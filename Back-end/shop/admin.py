from django.contrib import admin
from .models import Category, Product, ProductImage, Order, OrderItem


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'brand', 'price', 'gender', 'is_new', 'on_sale', 'in_stock']
    list_filter = ['gender', 'is_new', 'on_sale', 'in_stock', 'categories']
    search_fields = ['name', 'sku', 'brand']
    filter_horizontal = ['categories']
    inlines = [ProductImageInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ['name']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'sku', 'name', 'size', 'price', 'qty']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'customer_name', 'customer_phone', 'total', 'status', 'created_at']
    list_editable = ['status']
    list_filter = ['status', 'created_at']
    search_fields = ['order_id', 'customer_phone', 'customer_name']
    readonly_fields = ['order_id', 'subtotal', 'discount', 'total', 'coupon_code', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    # This is the key improvement over the old fake admin.html:
    # changing `status` here (or right from the list view, since it's
    # list_editable) actually updates the order, and the track-order page
    # picks it up immediately.
