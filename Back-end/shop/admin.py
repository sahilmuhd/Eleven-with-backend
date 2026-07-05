from django.contrib import admin
from .models import Category, Product, ProductImage, Order, OrderItem, Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'user']
    search_fields = ['name', 'phone', 'user__email']


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
    list_display = ['order_id', 'customer_name', 'customer_phone', 'city', 'total', 'payment_method', 'payment_status', 'status', 'created_at']
    list_editable = ['status', 'payment_status']
    list_filter = ['status', 'payment_method', 'payment_status', 'created_at', 'state']
    search_fields = ['order_id', 'customer_phone', 'customer_name', 'pincode', 'razorpay_payment_id']
    readonly_fields = [
        'order_id', 'subtotal', 'discount', 'total', 'coupon_code', 'created_at', 'updated_at',
        'payment_method', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
    ]
    fieldsets = (
        (None, {'fields': ('order_id', 'user', 'status')}),
        ('Customer', {'fields': ('customer_name', 'customer_phone', 'customer_email')}),
        ('Shipping address', {'fields': ('address_line1', 'address_line2', 'city', 'state', 'pincode')}),
        ('Totals', {'fields': ('subtotal', 'discount', 'total', 'coupon_code')}),
        # payment_status is editable here (and from the list view) so staff
        # can mark a Cash on Delivery order as "Paid" once the cash is
        # actually collected — it doesn't happen automatically like it
        # does for Razorpay orders.
        ('Payment', {'fields': ('payment_method', 'payment_status', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    inlines = [OrderItemInline]
    # This is the key improvement over the old fake admin.html:
    # changing `status` here (or right from the list view, since it's
    # list_editable) actually updates the order, and the track-order page
    # picks it up immediately.

    def save_model(self, request, obj, form, change):
        # Detect a transition *into* 'cancelled' (from anything else) so we
        # can give the reserved pairs back to stock automatically — covers
        # both the detail-page dropdown and the quick list_editable column,
        # since both route through save_model().
        became_cancelled = (
            change and 'status' in form.changed_data and obj.status == 'cancelled'
        )
        super().save_model(request, obj, form, change)
        if became_cancelled:
            obj.restore_stock()
