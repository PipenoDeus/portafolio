from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.utils.decorators import method_decorator
from django.utils.deprecation import MiddlewareMixin
from supabase import create_client 

from .models import Gym, Boxer, SparringReservation
from .serializer import SparringReservationSerializer
from .supabase_client import supabase
from .utils import jwt_required

from rest_framework import viewsets
from datetime import datetime, timedelta
import json
import bcrypt
import jwt



class JWTAuthenticationMiddleware(MiddlewareMixin):
    def process_request(self, request):
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
                payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
                request.user_payload = payload 
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expirado'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Token inválido'}, status=401)
        else:
            request.user_payload = None


# ======================== LOGIN ========================
@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        body = json.loads(request.body)
        email = body.get('email')
        password = body.get('password')

        result = supabase.table("user_profiles").select("*").eq("email", email).single().execute()
        user = result.data

        if user and bcrypt.checkpw(password.encode(), user['password'].encode()):
            payload = {
                'user_id': user['id'],
                'email': user['email'],
                'rol': user['rol'],
                'exp': datetime.utcnow() + timedelta(hours=4),
                'iat': datetime.utcnow()
                }

            token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')

            user.pop('password', None)
            return JsonResponse({'token': token, 'user': user}, status=200)

        return JsonResponse({'error': 'Credenciales inválidas'}, status=401)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    


# ======================== REGISTRO ========================
@csrf_exempt
def api_register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        body = json.loads(request.body)
        email = body.get('email')
        password = body.get('password')
        first_name = body.get('first_name')
        last_name = body.get('last_name')
        city = body.get('city')
        birthdate = body.get('birthdate')
        membresy = body.get('membresy', False)

        DEFAULT_AVATAR_URL = "https://xtckolxiipfxnstcbofm.supabase.co/storage/v1/object/public/avatars//Leonardo_Phoenix_10_a_stylized_highcontrast_black_and_white_il_2.jpg"
        avatar_url = body.get('avatar_url') or DEFAULT_AVATAR_URL

        exists = supabase.table("user_profiles").select("id").eq("email", email).execute()
        if exists.data:
            return JsonResponse({'error': 'El correo ya está registrado'}, status=409)

        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        result = supabase.table("user_profiles").insert({
            "email": email,
            "password": hashed_password,
            "first_name": first_name,
            "last_name": last_name,
            "city": city,
            "birthdate": birthdate,
            "avatar_url": avatar_url,
            "membresy": membresy,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        if not result.data:
            return JsonResponse({'error': 'No se pudo insertar el usuario'}, status=500)

        return JsonResponse({'message': 'Usuario registrado exitosamente'}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ======================== ACTUALIZACION USUARIO ========================
@csrf_exempt
def api_update_user(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return JsonResponse({'error': 'Token de autenticación no proporcionado'}, status=401)
    

    token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else None
    if not token:
        return JsonResponse({'error': 'Token de autenticación no proporcionado'}, status=401)

    try:

        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        user_id_from_token = payload.get('user_id')

        body = json.loads(request.body)
        email = body.get('email')

        if email and email != payload.get('email'):
            exists = supabase.table("user_profiles").select("id").eq("email", email).execute()
            if exists.data:
                return JsonResponse({'error': 'El correo electrónico ya está registrado'}, status=409)

        if not email:
            email = payload.get('email')

        fields = ['first_name', 'last_name', 'city', 'birthdate', 'avatar_url', 'membresy', 'password']
        update_data = {field: body[field] for field in fields if field in body}

        if email != payload.get('email'):
            update_data['email'] = email

        if not update_data:
            return JsonResponse({'error': 'No se proporcionaron datos para actualizar'}, status=400)


        result = supabase.table("user_profiles").update(update_data).eq("id", user_id_from_token).execute()

        if result.data:

            if 'email' in update_data:
                payload['email'] = email


            return JsonResponse({'message': 'Usuario actualizado exitosamente', 'user': result.data}, status=200)

        return JsonResponse({'error': 'No se encontró el usuario para actualizar'}, status=404)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ======================== ELIMINAR USUARIO ========================
@csrf_exempt
def api_delete_user(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)


    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return JsonResponse({'error': 'Token de autenticación no proporcionado'}, status=401)

    token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else None
    if not token:
        return JsonResponse({'error': 'Token de autenticación no proporcionado'}, status=401)

    try:

        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        user_email = payload.get('email')
        user_id = payload.get('user_id')


        if not user_email and not user_id:
            return JsonResponse({'error': 'Token inválido: falta user_id o email'}, status=400)


        result = supabase.table("user_profiles").delete().eq("id", user_id).execute()

        if result.data:
            return JsonResponse({'message': 'Usuario eliminado exitosamente'}, status=200)
        return JsonResponse({'error': 'No se encontró el usuario para eliminar'}, status=404)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ======================== OBTENER ROL ========================
@csrf_exempt
def api_get_role(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        body = json.loads(request.body)
        email = body.get('email')
        if not email:
            return JsonResponse({'error': 'El correo electrónico es obligatorio'}, status=400)

        result = supabase.table("user_profiles").select("rol").eq("email", email).single().execute()

        if result.data:
            return JsonResponse({'rol': result.data['rol']}, status=200)
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

# ======================== OBTENER GIMNASIOS ========================
@csrf_exempt
def obtener_gimnasios(request):
    try:
        result = supabase.table("gimnasios").select("*").execute()
        if result.data:
            return JsonResponse(result.data, safe=False, status=200)
        return JsonResponse({'error': 'No se encontraron gimnasios'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ======================== CLASES ========================
@csrf_exempt
def obtener_clases(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        result = supabase.table("clases").select("*").execute()
        return JsonResponse(result.data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ======================== RESERVA DE RING ========================
@csrf_exempt
def api_reservar_ring(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return JsonResponse({'error': 'Token de autenticación no proporcionado'}, status=401)

    token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else None
    if not token:
        return JsonResponse({'error': 'Token de autenticación no proporcionado'}, status=401)

    try:

        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        user_id_from_token = payload.get('user_id')  

        body = json.loads(request.body)
        boxer_id = body.get('boxer_id')
        ring_id = body.get('ring_id')
        fecha = body.get('fecha')
        hora_inicio = body.get('hora_inicio')
        hora_fin = body.get('hora_fin')
        oponente_email = body.get('oponente_email')
        descripcion = body.get('descripcion')

        if not all([boxer_id, ring_id, fecha, hora_inicio, hora_fin]):
            return JsonResponse({'error': 'Faltan campos obligatorios'}, status=400)

        if oponente_email:
            oponente = supabase.table("user_profiles").select("email").eq("email", oponente_email).execute()
            if not oponente.data:
                return JsonResponse({'error': 'El email del oponente no está registrado'}, status=404)

        conflictos = supabase.table("reservas").select("*")\
            .eq("fecha", fecha)\
            .eq("ring_id", ring_id)\
            .or_(f"hora_inicio.lte.{hora_fin},hora_fin.gte.{hora_inicio}")\
            .execute()

        if conflictos.data:
            return JsonResponse({'error': 'El ring ya está reservado en ese horario'}, status=409)
        
        result = supabase.table("reservas").insert({
            "boxer_id": boxer_id,
            "ring_id": ring_id,
            "fecha": fecha,
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
            "oponente_email": oponente_email,
            "descripcion": descripcion,
            "estado": "pendiente",
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        if result.data:
            return JsonResponse({'message': 'Reserva registrada exitosamente'}, status=201)
        return JsonResponse({'error': 'No se pudo crear la reserva'}, status=500)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
# ======================== MOSTRAR RESERVAS ========================

@csrf_exempt
def api_listar_reservas(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
        rol = payload.get('rol')

        if rol == 'admin':
            result = supabase.table("reservas").select("*").execute()
        else:
            result = supabase.table("reservas").select("*").eq("boxer_id", user_id).execute()

        return JsonResponse(result.data, safe=False, status=200)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
# ======================== MODIFICAR RESERVAS ========================
@csrf_exempt
def api_modificar_reserva(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
        rol = payload.get('rol')

        body = json.loads(request.body)
        reserva_id = body.get('id')
        if not reserva_id:
            return JsonResponse({'error': 'Falta el campo id'}, status=400)


        reserva = supabase.table("reservas").select("boxer_id").eq("id", reserva_id).single().execute()
        if not reserva.data:
            return JsonResponse({'error': 'Reserva no encontrada'}, status=404)

        if rol != 'admin' and reserva.data['boxer_id'] != user_id:
            return JsonResponse({'error': 'No tienes permiso para modificar esta reserva'}, status=403)


        campos_editables = ['fecha', 'hora_inicio', 'hora_fin', 'oponente_email', 'descripcion', 'estado']
        update_data = {campo: body[campo] for campo in campos_editables if campo in body}

        if not update_data:
            return JsonResponse({'error': 'No se proporcionaron campos válidos para actualizar'}, status=400)

        result = supabase.table("reservas").update(update_data).eq("id", reserva_id).execute()
        return JsonResponse({'message': 'Reserva actualizada exitosamente'}, status=200)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== ELIMINAR RESERVA ========================
@csrf_exempt
def api_eliminar_reserva(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
        rol = payload.get('rol')

        body = json.loads(request.body)
        reserva_id = body.get('id')
        if not reserva_id:
            return JsonResponse({'error': 'Falta el campo id'}, status=400)

        reserva = supabase.table("reservas").select("boxer_id").eq("id", reserva_id).single().execute()
        if not reserva.data:
            return JsonResponse({'error': 'Reserva no encontrada'}, status=404)

        if rol != 'admin' and reserva.data['boxer_id'] != user_id:
            return JsonResponse({'error': 'No tienes permiso para eliminar esta reserva'}, status=403)

        result = supabase.table("reservas").delete().eq("id", reserva_id).execute()
        return JsonResponse({'message': 'Reserva eliminada exitosamente'}, status=200)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ======================== CREACION DE BLOG ========================
@csrf_exempt
def api_create_blog(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        body = json.loads(request.body)
        titulo = body.get('titulo')
        contenido = body.get('contenido')
        user_id = body.get('user_id')

        if not all([titulo, contenido, user_id]):
            return JsonResponse({'error': 'Faltan campos'}, status=400)

        result = supabase.table("blogs").insert([{
            "titulo": titulo,
            "contenido": contenido,
            "user_id": user_id,
            "aprobado": False  
        }]).execute()

        return JsonResponse({'message': 'Blog creado', 'data': result.data}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def api_get_blogs(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        result = supabase.table("blogs")\
                         .select("*")\
                         .eq("aprobado", True)\
                         .order("fecha_creacion", desc=True)\
                         .execute()

        return JsonResponse({'blogs': result.data}, safe=False, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    
# ======================== CREACION DE RUTINA ========================

@csrf_exempt
def api_create_rutina(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        body = json.loads(request.body)
        nombre = body.get('nombre')
        descripcion = body.get('descripcion')
        nivel = body.get('nivel')
        entrenador_id = body.get('entrenador_id')

        if not all([nombre, descripcion, nivel, entrenador_id]):
            return JsonResponse({'error': 'Faltan campos'}, status=400)

        user_check = supabase.table("user_profiles").select("rol").eq("id", entrenador_id).single().execute()
        if user_check.data is None:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        rol = user_check.data.get('rol')
        if rol not in ['entrenador', 'admin']:
            return JsonResponse({'error': f'Permiso denegado: rol inválido ({rol})'}, status=403)

        result = supabase.table("rutinas").insert([{
            "nombre": nombre,
            "descripcion": descripcion,
            "nivel": nivel,
            "entrenador_id": entrenador_id
        }]).execute()

        return JsonResponse({'message': 'Rutina creada', 'data': result.data}, status=201)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

 # ======================== MOSTRAR RUTINAS ========================   
@csrf_exempt
def api_get_rutinas(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        result = supabase.table("rutinas").select("*").execute()

        return JsonResponse({'message': 'Rutinas obtenidas', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
# ======================== MODIFICAR RUTINA ========================    
@csrf_exempt
def api_update_rutina(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        rol = payload.get('rol')
        if rol not in ['admin', 'entrenador']:
            return JsonResponse({'error': 'No autorizado. Solo administradores o entrenadores pueden editar rutinas.'}, status=403)

        data = json.loads(request.body)
        rutina_id = data.get('id')

        if not rutina_id:
            return JsonResponse({'error': 'Falta el ID de la rutina'}, status=400)

        update_fields = {k: v for k, v in data.items() if k != 'id'}

        result = supabase.table("rutinas").update(update_fields).eq("id", rutina_id).execute()

        return JsonResponse({'message': 'Rutina actualizada', 'data': result.data}, status=200)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== DELETE RUTINA =========================
@csrf_exempt
def api_delete_rutina(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        # Validar rol
        rol = payload.get('rol')
        if rol not in ['admin', 'entrenador']:
            return JsonResponse({'error': 'No autorizado. Solo administradores o entrenadores pueden eliminar rutinas.'}, status=403)

        data = json.loads(request.body)
        rutina_id = data.get('id')

        if not rutina_id:
            return JsonResponse({'error': 'Falta el ID de la rutina'}, status=400)

        result = supabase.table("rutinas").delete().eq("id", rutina_id).execute()

        return JsonResponse({'message': 'Rutina eliminada', 'data': result.data}, status=200)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

    
# ======================== PANEL ADMIN ======================== 
# ======================== VERIFY TOKEN ========================
@csrf_exempt
def api_verify_token(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        return JsonResponse({
            'message': 'Token válido',
            'user_id': payload.get('user_id'),
            'email': payload.get('email'),
            'rol': payload.get('rol'),
            'exp': payload.get('exp')
        }, status=200)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)  
 # ======================== LISTA USUARIOS ========================    
@csrf_exempt
def api_list_users(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        user_role = payload.get('rol')

        if user_role != 'admin':
            return JsonResponse({'error': 'Acceso denegado: solo administradores'}, status=403)

        result = supabase.table("user_profiles").select("*").execute()

        if isinstance(result.data, list):
            return JsonResponse(result.data, safe=False, status=200)
        else:
            return JsonResponse({'error': 'No se encontraron usuarios'}, status=404)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


 # ======================== MODIFICAR USUARIO ======================== 
@csrf_exempt
def admin_update_user(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        user_role = payload.get('rol')

        if user_role != 'admin':
            return JsonResponse({'error': 'No autorizado: solo administradores'}, status=403)

        body = json.loads(request.body)
        user_id = body.get('id')  # Asegúrate de enviar el ID del usuario desde el frontend

        if not user_id:
            return JsonResponse({'error': 'Falta el campo id'}, status=400)

        new_email = body.get('email')
        if new_email:
            exists = supabase.table("user_profiles").select("id").eq("email", new_email).neq("id", user_id).execute()
            if exists.data:
                return JsonResponse({'error': 'El correo electrónico ya está registrado'}, status=409)


        fields = ['first_name', 'last_name', 'city', 'birthdate', 'avatar_url', 'membresy', 'rol', 'email']
        update_data = {field: body[field] for field in fields if field in body}

        if not update_data:
            return JsonResponse({'error': 'No se proporcionaron datos para actualizar'}, status=400)


        result = supabase.table("user_profiles").update(update_data).eq("id", user_id).execute()

        if result.data:
            return JsonResponse({'message': 'Usuario actualizado exitosamente', 'user': result.data}, status=200)
        else:
            return JsonResponse({'error': 'No se encontró el usuario para actualizar'}, status=404)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== ELIMINAR USUARIO ========================
@csrf_exempt
def admin_delete_user(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        user_role = payload.get('rol')
        admin_id = payload.get('user_id')

        if user_role != 'admin':
            return JsonResponse({'error': 'Acceso denegado: solo administradores'}, status=403)

        body = json.loads(request.body)
        user_id = body.get('id')

        if not user_id:
            return JsonResponse({'error': 'Falta el campo id'}, status=400)

        if user_id == admin_id:
            return JsonResponse({'error': 'No puedes eliminar tu propio usuario mientras estás autenticado'}, status=403)

        result = supabase.table("user_profiles").delete().eq("id", user_id).execute()

        if result.data:
            return JsonResponse({'message': 'Usuario eliminado exitosamente'}, status=200)
        else:
            return JsonResponse({'error': 'No se encontró el usuario para eliminar'}, status=404)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== AGREGAR GYMNASIO ========================
@csrf_exempt
def api_list_gimnasios(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        result = supabase.table("gimnasios").select("*").execute()

        if isinstance(result.data, list):
            return JsonResponse(result.data, safe=False, status=200)
        else:
            return JsonResponse({'error': 'No se encontraron gimnasios'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== MOSTRAR GYMNASIO ========================
@csrf_exempt
def api_create_gimnasio(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        required_fields = ['nombre', 'direccion', 'ciudad', 'telefono', 'imagen_url']

        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Faltan campos requeridos'}, status=400)

        result = supabase.table("gimnasios").insert(data).execute()

        return JsonResponse({'message': 'Gimnasio creado', 'data': result.data}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== EDITAR GYMNASIO =========================
@csrf_exempt
def api_update_gimnasio(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        gimnasio_id = data.get('id')

        if not gimnasio_id:
            return JsonResponse({'error': 'Falta el ID del gimnasio'}, status=400)

        update_fields = {k: v for k, v in data.items() if k != 'id'}

        result = supabase.table("gimnasios").update(update_fields).eq("id", gimnasio_id).execute()

        return JsonResponse({'message': 'Gimnasio actualizado', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== ELIMINAR GYMNASIO ========================
@csrf_exempt
def api_delete_gimnasio(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        gimnasio_id = data.get('id')

        if not gimnasio_id:
            return JsonResponse({'error': 'Falta el ID del gimnasio'}, status=400)

        result = supabase.table("gimnasios").delete().eq("id", gimnasio_id).execute()

        return JsonResponse({'message': 'Gimnasio eliminado', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

