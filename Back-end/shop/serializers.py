import re
from collections import defaultdict

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from .models import Product, ProductImage, Category, Order, OrderItem, Customer, Coupon


def _size_key(raw):
    """Extracts the plain size number ('8', '8.5', ...) from whatever the
    frontend sends (e.g. 'UK 8'), so it matches the string keys used in
    Product.stock regardless of exact label formatting."""
    match = re.search(r'[\d.]+', str(raw))
    return match.group(0) if match else str(raw).strip()


class RegisterSerializer(serializers.Serializer):
    """What register.html POSTs to /api/auth/register/."""
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        Customer.objects.create(user=user, name=validated_data['name'], phone=validated_data['phone'])
        return user


class LoginSerializer(serializers.Serializer):
    """What login.html POSTs to /api/auth/login/."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs['email'].strip().lower(), password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Incorrect email or password.')
        attrs['user'] = user
        return attrs


class CustomerSerializer(serializers.Serializer):
    """Shape returned by register/login/me — matches what eleven-auth.js expects."""
    name = serializers.CharField()
    email = serializers.EmailField(source='user.email')
    phone = serializers.CharField()


class ForgotPasswordSerializer(serializers.Serializer):
    """What the frontend POSTs to /api/auth/forgot-password/. Deliberately
    has no validate_email existence check — the view always responds with
    the same generic message either way, so a wrong/unregistered email
    can't be used to fish for which addresses have accounts."""
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """What the frontend POSTs to /api/auth/reset-password/ — the uid/token
    pair from the emailed link, plus the new password."""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['image', 'order']


class ProductSerializer(serializers.ModelSerializer):
    # Shaped to match the old eleven-real-products.js objects as closely as
    # possible, so the existing frontend JS needs minimal changes.
    cats = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    isNew = serializers.BooleanField(source='is_new')
    onSale = serializers.BooleanField(source='on_sale')
    # True only if the manual override is on AND at least one size actually
    # has stock left — so this flips to false automatically once the last
    # pair sells, instead of needing someone to remember to toggle it.
    inStock = serializers.SerializerMethodField()
    # Which sizes can actually be added to cart right now (stock > 0).
    # `sizes` stays as the full "sizes this shoe comes in" list so nothing
    # that already reads it breaks; the frontend uses sizesInStock to grey
    # out/disable the sold-out ones. See Product.sizes_in_stock() in models.py.
    sizesInStock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'sku', 'name', 'brand', 'price', 'strike',
            'cats', 'gender', 'sizes', 'sizesInStock', 'isNew', 'onSale', 'inStock',
            'images', 'colorway', 'desc',
        ]

    def get_cats(self, obj):
        return list(obj.categories.values_list('name', flat=True))

    def get_gender(self, obj):
        return [obj.gender]

    def get_inStock(self, obj):
        return obj.in_stock and len(obj.sizes_in_stock()) > 0

    def get_sizesInStock(self, obj):
        return obj.sizes_in_stock()

    def get_images(self, obj):
        request = self.context.get('request')
        urls = []
        for img in obj.images.all():
            url = img.image.url
            urls.append(request.build_absolute_uri(url) if request else url)
        return urls


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['sku', 'name', 'size', 'price', 'qty']


class OrderItemWriteSerializer(serializers.Serializer):
    """What the frontend sends per cart line when placing an order."""
    sku = serializers.CharField()
    name = serializers.CharField()
    size = serializers.CharField()
    price = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_id', 'customer_name', 'customer_phone', 'customer_email',
            'address_line1', 'address_line2', 'city', 'state', 'pincode',
            'subtotal', 'discount', 'total', 'coupon_code', 'status',
            'payment_status', 'payment_method', 'created_at', 'items',
        ]
        read_only_fields = ['order_id', 'status', 'payment_status', 'created_at']


class OrderCreateSerializer(serializers.Serializer):
    """What checkout.html POSTs when placing an order."""
    customer_name = serializers.CharField(max_length=120)
    customer_phone = serializers.CharField()
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    address_line1 = serializers.CharField(max_length=200)
    address_line2 = serializers.CharField(max_length=200, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    pincode = serializers.RegexField(r'^\d{6}$', error_messages={'invalid': 'Enter a valid 6-digit PIN code.'})
    subtotal = serializers.IntegerField()
    discount = serializers.IntegerField(default=0)
    total = serializers.IntegerField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=['razorpay', 'cod'], default='razorpay')
    items = OrderItemWriteSerializer(many=True)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        payment_method = validated_data.get('payment_method', 'razorpay')

        with transaction.atomic():
            # Lock every Product row this order touches (ordered by sku so
            # two concurrent orders always acquire locks in the same order —
            # avoids deadlocks) before checking stock. Nothing is written
            # yet at this point — this is just an upfront sanity check so
            # an obviously-unavailable order is rejected immediately rather
            # than after the customer pays.
            skus = sorted(set(item['sku'] for item in items_data))
            products = {
                p.sku: p for p in Product.objects.select_for_update().filter(sku__in=skus)
            }

            # Combine quantities per (sku, size) first in case the same
            # line appears twice, so we validate against the *total*
            # requested rather than checking each line in isolation.
            requested = defaultdict(int)
            for item in items_data:
                requested[(item['sku'], _size_key(item['size']))] += item['qty']

            for (sku, size_key), qty in requested.items():
                product = products.get(sku)
                if product is None:
                    continue  # product removed from catalog since being added to cart; let it through on snapshot data alone
                available = int(product.stock.get(size_key, 0))
                if available < qty:
                    raise serializers.ValidationError({
                        'items': f'Sorry, only {available} left in size {size_key} for "{product.name}". Please update your cart and try again.'
                    })

            # ---- Recompute money server-side. Never trust the client's
            # subtotal/discount/total — those three fields in validated_data
            # are only ever a *preview* the frontend showed; what actually
            # gets saved (and, for Razorpay, what actually gets charged via
            # order.total in views.py) is computed fresh right here from
            # real Product prices and a real Coupon lookup. This is what
            # stops someone from e.g. setting a fake 99% discount via
            # devtools/localStorage and having it actually honored. ----
            real_subtotal = 0
            for item in items_data:
                product = products.get(item['sku'])
                # Use the live catalog price when the product still exists;
                # only fall back to the client's submitted price for a SKU
                # that's been removed from the catalog entirely, since
                # there's no authoritative price left to check against.
                unit_price = product.price if product is not None else item['price']
                item['price'] = unit_price  # snapshot the *real* price onto the OrderItem below, not whatever the client sent
                real_subtotal += unit_price * item['qty']

            coupon_code = (validated_data.get('coupon_code') or '').strip()
            real_discount = 0
            if coupon_code:
                coupon = Coupon.objects.filter(code__iexact=coupon_code).first()
                if coupon is None:
                    raise serializers.ValidationError({'coupon_code': 'This code isn\u2019t valid.'})
                ok, reason = coupon.is_valid_for(real_subtotal)
                if not ok:
                    raise serializers.ValidationError({'coupon_code': reason})
                real_discount = round(real_subtotal * coupon.discount_percent / 100)

            real_total = real_subtotal - real_discount
            validated_data['subtotal'] = real_subtotal
            validated_data['discount'] = real_discount
            validated_data['total'] = real_total

            # Cash on Delivery orders are placed immediately, so reserve the
            # stock right now. Razorpay orders only reserve stock once
            # payment is actually verified — see verify_payment_view in
            # views.py — otherwise someone abandoning the payment popup
            # would lock up stock that never actually sold.
            if payment_method == 'cod':
                for (sku, size_key), qty in requested.items():
                    product = products.get(sku)
                    if product is None:
                        continue
                    product.stock[size_key] = int(product.stock.get(size_key, 0)) - qty
                    product.save(update_fields=['stock'])

            order = Order.objects.create(user=user, **validated_data)
            for item in items_data:
                # look up the real Product row if the SKU still exists, so we
                # can link it — but always keep the snapshot fields too.
                product = products.get(item['sku'])
                OrderItem.objects.create(order=order, product=product, **item)

        return order


class CartItemSerializer(serializers.Serializer):
    """One line of the synced cart — mirrors the localStorage item shape
    used by eleven-cart.js exactly, so no translation is needed either side."""
    sku = serializers.CharField()
    name = serializers.CharField()
    size = serializers.CharField()
    price = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)
    color = serializers.CharField(required=False, allow_blank=True)
    shape = serializers.IntegerField(required=False)


class CartSerializer(serializers.Serializer):
    """What GET/PUT /api/cart/ returns and accepts."""
    items = CartItemSerializer(many=True)


class WishlistSerializer(serializers.Serializer):
    """What GET/PUT /api/wishlist/ returns and accepts — just a list of SKUs."""
    skus = serializers.ListField(child=serializers.CharField(), allow_empty=True)


class VerifyPaymentSerializer(serializers.Serializer):
    """What checkout.js POSTs right after Razorpay's widget reports success —
    the signature is what proves the payment is genuine, not just the
    presence of a payment_id (a browser could fake that field alone)."""
    order_id = serializers.CharField()
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()


class TrackOrderSerializer(serializers.Serializer):
    """What the 'track my order' page POSTs to look up status."""
    order_id = serializers.CharField()
    phone = serializers.CharField()


class CouponValidateSerializer(serializers.Serializer):
    """What cart.html/checkout.html POST to preview a coupon's discount
    before actually placing an order. This is purely a preview for
    display — OrderCreateSerializer.create() above re-validates the same
    coupon independently at order-creation time, so nothing here needs to
    be trusted later."""
    code = serializers.CharField()
    subtotal = serializers.IntegerField(min_value=0)
