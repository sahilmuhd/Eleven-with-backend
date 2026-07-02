from rest_framework import serializers
from .models import Product, ProductImage, Category, Order, OrderItem


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
            'subtotal', 'discount', 'total', 'coupon_code', 'status',
            'created_at', 'items',
        ]
        read_only_fields = ['order_id', 'status', 'created_at']


class OrderCreateSerializer(serializers.Serializer):
    """What checkout.html POSTs when placing an order."""
    customer_name = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField()
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    subtotal = serializers.IntegerField()
    discount = serializers.IntegerField(default=0)
    total = serializers.IntegerField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    items = OrderItemWriteSerializer(many=True)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            # look up the real Product row if the SKU still exists, so we
            # can link it — but always keep the snapshot fields too.
            product = Product.objects.filter(sku=item['sku']).first()
            OrderItem.objects.create(order=order, product=product, **item)
        return order


class TrackOrderSerializer(serializers.Serializer):
    """What the 'track my order' page POSTs to look up status."""
    order_id = serializers.CharField()
    phone = serializers.CharField()
