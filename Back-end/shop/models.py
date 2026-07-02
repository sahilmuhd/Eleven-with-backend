import random
import string

from django.db import models


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

    order_id = models.CharField(max_length=20, unique=True, default=generate_order_id, editable=False)

    customer_name = models.CharField(max_length=120, blank=True)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)

    subtotal = models.PositiveIntegerField(default=0)
    discount = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)
    coupon_code = models.CharField(max_length=40, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='placed')

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
