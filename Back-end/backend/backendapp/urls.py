from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import SparringReservationViewSet, api_login,api_register,obtener_gimnasios,obtener_clases,api_reservar_ring,api_create_blog,api_get_blogs,api_create_rutina,api_get_rutinas,api_update_user,api_delete_user

router = DefaultRouter()
router.register(r'sparring-reservations', SparringReservationViewSet)

urlpatterns = [
    path('login/', views.login, name='login'),
    path('registro/', views.registro_view, name='registro'),
    path('', views.home, name='home'),

    path('gym_list/', views.gym_list, name='gym_list'),
    path('create/', views.gym_create, name='gym_create'),
    path('update/<int:id>/', views.gym_update, name='gym_update'),
    path('delete/<int:id>/', views.gym_delete, name='gym_delete'),

    path('boxers/', views.boxer_list, name='boxer_list'),
    path('boxers/create/', views.boxer_create, name='boxer_create'),
    path('boxers/update/<int:id>/', views.boxer_update, name='boxer_update'),
    path('boxers/delete/<int:id>/', views.boxer_delete, name='boxer_delete'),

    path('api/', include(router.urls)), 
    path("reserve-sparring/", views.sparring_reserve, name="sparring_reserve"),
    path('calendar/', views.calendar_page, name='calendar'),
    path('api/reservations/', views.reservation_events, name='reservation_events'),
    path('api/login/', api_login),
    path('api/register/', api_register),
    path('api/gimnasios/', obtener_gimnasios),
    path('api/clases/', obtener_clases),
    path('api/reserva_ring',api_reservar_ring),
    path('api/create-blog/', api_create_blog, name='create_blog'),
    path('api/blogs/', api_get_blogs, name='api_get_blogs'),
    path('api/create_rutina', api_create_rutina, name='api_create_rutina'),
    path('api/get_rutina', api_get_rutinas, name='api_get_rutina'),
    path('api/update_user/', api_update_user, name='api_update_user'),
    path('api/delete_user/', api_delete_user, name='delete_user'),
]
