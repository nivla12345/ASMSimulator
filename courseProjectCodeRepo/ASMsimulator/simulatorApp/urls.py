__author__ = 'AlvinKevin'

from django.conf.urls import patterns, url
from django.contrib.auth.forms import AuthenticationForm

from forms import *


urlpatterns = patterns('',

                       url(r'^$', 'simulatorApp.views.home', name="home"),
                       url(r'^register$', 'simulatorApp.views.register', name="register"),
                       url(r'^reset', 'simulatorApp.views.reset_password', name="reset"),
                       url(r'^public', 'simulatorApp.views.public', name="public_projects"),

                       # Profile related views
                       url(r'^profile$', 'simulatorApp.views.profile', name="profile"),
                       url(r'^edit-profile$', 'simulatorApp.views.edit_profile', name="edit_profile"),
                       url(r'^view-profile/(?P<id>\d+)$', 'simulatorApp.views.view_profile', name='view_profile'),

                       url(r'^follow/(?P<id>\d+)$', 'simulatorApp.views.follow', name='follow'),
                       url(r'^unfollow/(?P<id>\d+)$', 'simulatorApp.views.unfollow', name='unfollow'),

                       # Program related views
                       url(r'^create-program/(?P<id>\d+)$', 'simulatorApp.views.createProgram', name="create_program"),
                       url(r'^simulate-program/(?P<id>\d+)$', 'simulatorApp.views.simulateProgram',
                           name="simulate_program"),
                       url(r'^save-program/(?P<id>\d+)$', 'simulatorApp.views.saveProgram', name="save_program"),
                       url(r'^delete-program/(?P<id>\d+)$', 'simulatorApp.views.deleteProgram', name="delete_program"),
                       url(r'^edit-program/(?P<id>\d+)$', 'simulatorApp.views.editProgram', name="edit_program"),
                       url(r'^favorite-program/(?P<id>\d+)$', 'simulatorApp.views.favorite', name="favorite"),
                       url(r'^unfavorite-program/(?P<id>\d+)$', 'simulatorApp.views.unfavorite', name="unfavorite"),

                       # Profile creation
                       url(r'^confirm-registration/(?P<username>[a-zA-Z0-9_@\+\-\.]+)/(?P<token>[a-z0-9\-]+)$',
                           'simulatorApp.views.confirmed_registration', name='confirm_register'),
                       url(r'^confirm-reset/(?P<username>[a-zA-Z0-9_@\+\-\.]+)/(?P<token>[a-z0-9\-]+)$',
                           'simulatorApp.views.confirmed_reset', name='confirm_reset'),
                       url(r'^photo/(?P<id>\d+)$$', 'simulatorApp.views.get_photo', name='photo'),

                       # Route for built-in authentication with our own custom login page
                       url(r'^login$', 'django.contrib.auth.views.login',
                           {'template_name': 'login.html',
                            'extra_context': {'login_form': AuthenticationForm(),
                                              'registration_form': RegistrationForm(),
                                              'reset_form': ResetForm()}},
                           name='login'),

                       # Route to logout a user and send them back to the login page
                       url(r'^logout$', 'django.contrib.auth.views.logout_then_login', name='logout'),
)
