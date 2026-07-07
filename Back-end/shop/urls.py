from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet, OrderViewSet, track_order, validate_coupon,
    register_view, login_view, me_view, my_orders_view,
    cart_view, wishlist_view, verify_payment_view,
)

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    # Must come before the router include below — otherwise the router's
    # orders/<pk>/ pattern would swallow this as a detail lookup first.
    path('orders/verify-payment/', verify_payment_view, name='verify-payment'),
    path('', include(router.urls)),
    path('track/', track_order, name='track-order'),
    path('coupons/validate/', validate_coupon, name='coupon-validate'),
    path('auth/register/', register_view, name='auth-register'),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/me/', me_view, name='auth-me'),
    path('my-orders/', my_orders_view, name='my-orders'),
    path('cart/', cart_view, name='cart'),
    path('wishlist/', wishlist_view, name='wishlist'),
]
