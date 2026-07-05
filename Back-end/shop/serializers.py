from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Product, ProductImage, Category, Order, OrderItem, Customer


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
    inStock = serializers.BooleanField(source='in_stock')

    class Meta:
        model = Product
        fields = [
            'sku', 'name', 'brand', 'price', 'strike',
            'cats', 'gender', 'sizes', 'isNew', 'onSale', 'inStock',
            'images', 'colorway', 'desc',
        ]

    def get_cats(self, obj):
        return list(obj.categories.values_list('name', flat=True))

    def get_gender(self, obj):
        return [obj.gender]

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
        order = Order.objects.create(user=user, **validated_data)
        for item in items_data:
            # look up the real Product row if the SKU still exists, so we
            # can link it — but always keep the snapshot fields too.
            product = Product.objects.filter(sku=item['sku']).first()
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
