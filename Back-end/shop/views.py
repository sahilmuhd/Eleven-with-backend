from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Product, Order
from .serializers import (
    ProductSerializer, OrderSerializer, OrderCreateSerializer, TrackOrderSerializer,
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
        serializer = OrderCreateSerializer(data=request.data)
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
