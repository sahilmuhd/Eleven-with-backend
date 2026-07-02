from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('shop.urls')),
]

# Serve product images even with DEBUG=False. Django isn't built to do this
# at real scale (a CDN/S3 would be the "right" answer for a bigger store),
# but for this catalog's size it's simple, free, and works reliably on Render.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
