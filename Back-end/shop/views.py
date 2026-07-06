import base64
import hashlib
import hmac
import json
import re
import urllib.error
import urllib.request

from django.conf import settings
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Product, Order
from .notifications import send_order_confirmation_email, send_seller_alert_email
from .serializers import (
    ProductSerializer, OrderSerializer, OrderCreateSerializer, TrackOrderSerializer,
    RegisterSerializer, LoginSerializer, CustomerSerializer,
    CartSerializer, WishlistSerializer, VerifyPaymentSerializer,
)


# Per-IP limits tighter than the site-wide 'anon' default (see
# DEFAULT_THROTTLE_RATES in settings.py) for the three endpoints that are
# actually worth brute-forcing/spamming: guessing a password, mass-creating
# accounts, and guessing order_id+phone combinations. Subclassing
# AnonRateThrottle (rather than ScopedRateThrottle) is deliberate — DRF's
# @api_view decorator doesn't forward a `throttle_scope` attribute for
# function-based views, so ScopedRateThrottle would silently never throttle
# here. A fixed `scope` on the throttle class itself works correctly instead.
class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'


class TrackOrderRateThrottle(AnonRateThrottle):
    scope = 'track_order'


class RazorpayError(Exception):
    pass


def create_razorpay_order(amount_paise, receipt):
    """
    Creates a Razorpay order via their REST API directly, using only the
    standard library — deliberately NOT using the official `razorpay`
    PyPI package, which pulls in `pkg_resources` and breaks with a
    `ModuleNotFoundError` on fresh venvs paired with newer setuptools/Python
    (a known, messy compatibility issue). This does the same thing with
    zero extra dependencies.
    """
    auth = base64.b64encode(f'{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}'.encode()).decode()
    body = json.dumps({
        'amount': amount_paise,
        'currency': 'INR',
        'receipt': receipt,
        'payment_capture': 1,
    }).encode()
    req = urllib.request.Request(
        'https://api.razorpay.com/v1/orders',
        data=body, method='POST',
        headers={'Authorization': f'Basic {auth}', 'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RazorpayError(e.read().decode())
    except Exception as e:
        raise RazorpayError(str(e))


def verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """Razorpay's signature is just HMAC-SHA256 of 'order_id|payment_id'
    using your secret key — this is the whole verification, no SDK needed."""
    payload = f'{razorpay_order_id}|{razorpay_payment_id}'.encode()
    expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Anyone can read the catalog; only staff can add/edit/delete products.
    This replaces the old admin.html, which only edited localStorage and
    didn't actually protect or persist anything."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class ProductViewSet(viewsets.ModelViewSet):
    """
    GET  /api/products/          -> full catalog (what eleven-real-products.js used to hardcode)
    GET  /api/products/<sku>/    -> single product (what product.html looks up by ?sku=)
    POST/PUT/DELETE              -> staff only, used by the real admin panel
    """
    queryset = Product.objects.prefetch_related('images', 'categories').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'sku'

    def get_serializer_context(self):
        return {'request': self.request}


class OrderViewSet(viewsets.ModelViewSet):
    """
    POST /api/orders/            -> anyone can place an order (checkout.html)
    GET  /api/orders/            -> staff only (order management / your new admin panel)
    GET  /api/orders/<id>/       -> staff only
    PATCH /api/orders/<id>/      -> staff only, used to update status (placed -> shipped, etc.)
    """
    queryset = Order.objects.prefetch_related('items').all()
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Cash on Delivery: nothing to charge right now, so there's no
        # Razorpay order to create. The order is placed immediately and
        # stays payment_status='pending' until staff mark it paid once the
        # cash is actually collected on delivery.
        if order.payment_method == 'cod':
            send_order_confirmation_email(order)
            send_seller_alert_email(order)
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        # Payment is Razorpay-only: create the matching Razorpay order right
        # away so checkout.js can open the payment widget against it. If
        # Razorpay is unreachable or misconfigured, don't leave a dangling
        # unpaid order behind — delete it and tell the customer to retry.
        try:
            rp_order = create_razorpay_order(order.total * 100, order.order_id)  # amount in paise
        except RazorpayError as e:
            print('ELEVEN: Razorpay order creation failed ->', e)  # shows up in the runserver terminal
            order.delete()
            return Response(
                {'detail': 'Could not start payment right now. Please try again in a moment.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        order.razorpay_order_id = rp_order['id']
        order.save(update_fields=['razorpay_order_id'])

        data = OrderSerializer(order).data
        data['razorpay'] = {
            'key_id': settings.RAZORPAY_KEY_ID,
            'razorpay_order_id': rp_order['id'],
            'amount': rp_order['amount'],
            'currency': rp_order['currency'],
        }
        return Response(data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_payment_view(request):
    """
    POST /api/orders/verify-payment/
    { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }

    Called by checkout.js the instant Razorpay's widget reports success.
    The signature is the only part of this that actually proves the
    payment happened — razorpay_payment_id alone could be faked by anyone
    poking at the browser console, so this is verified server-side against
    Razorpay's secret key before the order is marked paid.
    """
    serializer = VerifyPaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data

    order = Order.objects.filter(order_id=d['order_id'], razorpay_order_id=d['razorpay_order_id']).first()
    if not order:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not verify_razorpay_signature(d['razorpay_order_id'], d['razorpay_payment_id'], d['razorpay_signature']):
        order.payment_status = 'failed'
        order.save(update_fields=['payment_status'])
        return Response({'detail': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

    order.payment_status = 'paid'
    order.razorpay_payment_id = d['razorpay_payment_id']
    order.razorpay_signature = d['razorpay_signature']
    order.save(update_fields=['payment_status', 'razorpay_payment_id', 'razorpay_signature'])

    # Only now — payment actually confirmed — reserve the stock. (COD
    # orders reserve theirs immediately in OrderCreateSerializer.create()
    # instead, since there's no "maybe" step to wait on.) If two people
    # happened to both reach this point for the last pair of a size, one
    # will oversell here; that's a rare edge case for a store this size and
    # far better than blocking an already-successful payment — it just
    # means an occasional order needs a manual size swap/refund, which
    # shows up as negative stock in the admin so it's easy to spot.
    with transaction.atomic():
        for item in order.items.select_related('product').select_for_update():
            product = item.product
            if product is None:
                continue
            size_key = re.search(r'[\d.]+', str(item.size))
            size_key = size_key.group(0) if size_key else str(item.size).strip()
            product.stock[size_key] = int(product.stock.get(size_key, 0)) - item.qty
            product.save(update_fields=['stock'])

    send_order_confirmation_email(order)
    send_seller_alert_email(order)

    return Response(OrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([TrackOrderRateThrottle])
def track_order(request):
    """
    POST /api/track/  { "order_id": "ELV-12345", "phone": "9876543210" }
    Public order-status lookup — no login needed, but requires both the
    order ID and the phone number used at checkout, so one customer can't
    browse another's order by guessing IDs. Rate-limited (see
    DEFAULT_THROTTLE_RATES in settings.py) since it's an unauthenticated,
    guessable-ID lookup otherwise open to brute-forcing.
    """
    serializer = TrackOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    order_id = serializer.validated_data['order_id'].strip().upper()
    phone = serializer.validated_data['phone'].strip()

    order = Order.objects.filter(order_id=order_id, customer_phone=phone).first()
    if not order:
        return Response(
            {'detail': 'No order found with that order ID and phone number.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(OrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([RegisterRateThrottle])
def register_view(request):
    """POST /api/auth/register/  { name, email, phone, password }"""
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    data = CustomerSerializer(user.customer).data
    data['token'] = token.key
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    """POST /api/auth/login/  { email, password }"""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    token, _ = Token.objects.get_or_create(user=user)
    data = CustomerSerializer(user.customer).data
    data['token'] = token.key
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    """GET /api/auth/me/  — requires Authorization: Token <key>"""
    return Response(CustomerSerializer(request.user.customer).data)


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def cart_view(request):
    """
    GET  /api/cart/  -> the logged-in customer's saved cart
    PUT  /api/cart/  -> { items: [...] } replaces it wholesale

    The frontend (eleven-cart.js) keeps localStorage as its working copy for
    speed/offline-safety, and calls this to keep it backed up server-side —
    pulling it down on login/page load and pushing it up after every change,
    so the cart survives a new device or a cleared browser.
    """
    customer = request.user.customer
    if request.method == 'PUT':
        serializer = CartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer.cart = serializer.validated_data['items']
        customer.save(update_fields=['cart'])
        return Response({'items': customer.cart})
    return Response({'items': customer.cart})


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def wishlist_view(request):
    """
    GET  /api/wishlist/  -> the logged-in customer's saved wishlist (list of SKUs)
    PUT  /api/wishlist/  -> { skus: [...] } replaces it wholesale
    Same pull-on-login / push-on-change pattern as /api/cart/.
    """
    customer = request.user.customer
    if request.method == 'PUT':
        serializer = WishlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer.wishlist = serializer.validated_data['skus']
        customer.save(update_fields=['wishlist'])
        return Response({'skus': customer.wishlist})
    return Response({'skus': customer.wishlist})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_orders_view(request):
    """GET /api/my-orders/  — requires Authorization: Token <key>"""
    orders = Order.objects.filter(user=request.user).prefetch_related('items')
    return Response(OrderSerializer(orders, many=True).data)
