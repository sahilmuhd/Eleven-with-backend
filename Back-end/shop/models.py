import random
import string

from django.conf import settings
from django.db import models


class Customer(models.Model):
    """Extra profile info for a registered shopper, on top of Django's
    built-in User (which handles email/password/auth). Created by
    /api/auth/register/ — see views.py."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer')
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True)

    # Server-side cart/wishlist for logged-in shoppers, so both persist
    # across devices/browsers instead of living only in localStorage.
    # Shape mirrors the frontend exactly:
    #   cart:      [{sku, name, size, price, qty, color?, shape?}, ...]
    #   wishlist:  ['SKU-1', 'SKU-2', ...]
    cart = models.JSONField(default=list, blank=True)
    wishlist = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f'{self.name} <{self.user.email}>'


class Category(models.Model):
    """Tags like 'Running', 'Limited Edition', 'Collab' — matches the
    `cats` array on each product in the old eleven-real-products.js file."""
    name = models.CharField(max_length=60, unique=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    GENDER_CHOICES = [
        ('Men', 'Men'),
        ('Women', 'Women'),
        ('Unisex', 'Unisex'),
    ]

    sku = models.CharField(max_length=40, unique=True, primary_key=True)
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=120)

    price = models.PositiveIntegerField(help_text='Current price in ₹')
    strike = models.PositiveIntegerField(
        default=0, help_text='Original/MRP price in ₹, 0 if not on sale'
    )

    categories = models.ManyToManyField(Category, related_name='products', blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Unisex')

    # Stored as a JSON list of ints, e.g. [7, 8, 9, 10] — mirrors the frontend shape exactly
    sizes = models.JSONField(default=list, help_text='List of available UK sizes, e.g. [7, 8, 9, 10]')

    colorway = models.CharField(max_length=120, blank=True)
    desc = models.TextField(blank=True)

    is_new = models.BooleanField(default=False)
    on_sale = models.BooleanField(default=False)
    in_stock = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.sku})'


class ProductImage(models.Model):
    """Multiple images per product, in display order — replaces the
    hardcoded images[] array from the old JS catalog."""
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.product.sku} — image {self.order}'


def generate_order_id():
    digits = ''.join(random.choices(string.digits, k=5))
    return f'ELV-{digits}'


class Order(models.Model):
    STATUS_CHOICES = [
        ('placed', 'Order placed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('out_for_delivery', 'Out for delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('razorpay', 'Prepaid (Razorpay)'),
        ('cod', 'Cash on Delivery'),
    ]

    order_id = models.CharField(max_length=20, unique=True, default=generate_order_id, editable=False)

    # Null for guest checkouts; set when a logged-in customer places the order,
    # so /api/my-orders/ can look orders up without relying on phone number.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='orders',
    )

    customer_name = models.CharField(max_length=120, blank=True)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)

    # Shipping address — required for every new order placed through
    # checkout.html now that orders are fulfilled from the database instead
    # of over WhatsApp. Kept blank=True at the model level so older orders
    # placed before this field existed don't break admin/serialization.
    address_line1 = models.CharField(max_length=200, blank=True)
    address_line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)

    subtotal = models.PositiveIntegerField(default=0)
    discount = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)
    coupon_code = models.CharField(max_length=40, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='placed')

    # 'razorpay' (pay online now) or 'cod' (pay cash when it arrives). COD
    # orders skip Razorpay entirely — see OrderViewSet.create in views.py —
    # and stay payment_status='pending' until marked paid manually by staff
    # once cash is collected.
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='razorpay')

    # Razorpay integration. The order row is created up-front (with
    # payment_status='pending') so we have an order_id/receipt to hand
    # Razorpay when creating its order; it only flips to 'paid' after the
    # signature is verified server-side in verify_payment_view — never
    # trust the browser's word alone that a payment succeeded.
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    razorpay_order_id = models.CharField(max_length=64, blank=True)
    razorpay_payment_id = models.CharField(max_length=64, blank=True)
    razorpay_signature = models.CharField(max_length=128, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.order_id


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    # Nullable + snapshot fields below: if a product is later deleted or its
    # price changes, this row still shows exactly what the customer bought.
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL)

    sku = models.CharField(max_length=40)
    name = models.CharField(max_length=200)
    size = models.CharField(max_length=10)
    price = models.PositiveIntegerField(help_text='Price at time of order, in ₹')
    qty = models.PositiveSmallIntegerField(default=1)

    def __str__(self):
        return f'{self.name} ({self.size}) x{self.qty}'
