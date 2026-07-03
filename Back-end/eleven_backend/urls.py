from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('shop.urls')),
]

# Serve product photos (media files) regardless of DEBUG. This isn't the
# most efficient way to serve images at real scale (a CDN like Cloudinary/S3
# would be better long-term), but for this store's size it's simple and
# works — and fixes images being blank in production, since they were only
# being served when DEBUG=True before.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
