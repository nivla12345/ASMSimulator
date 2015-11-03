from django.conf.urls import patterns, include, url

urlpatterns = patterns('',

                       url(r'^simulatorApp/', include('simulatorApp.urls')),
                       url(r'^$', 'simulatorApp.views.home'),

)
