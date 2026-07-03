from rest_framework import viewsets, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Product, Order
from .serializers import (
    ProductSerializer, OrderSerializer, OrderCreateSerializer, TrackOrderSerializer,
    RegisterSerializer, LoginSerializer, CustomerSerializer,
    CartSerializer, WishlistSerializer,
)


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
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def track_order(request):
    """
    POST /api/track/  { "order_id": "ELV-12345", "phone": "9876543210" }
    Public order-status lookup — no login needed, but requires both the
    order ID and the phone number used at checkout, so one customer can't
    browse another's order by guessing IDs.
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
