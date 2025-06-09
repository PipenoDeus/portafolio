from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from .paypal_config import paypalrestsdk
from django.http import HttpResponseRedirect


from .supabase_client import supabase

from datetime import datetime, timedelta
import json
import bcrypt
import jwt
import uuid
import os
from uuid import UUID

# ======================== PAYPAL  ========================
@csrf_exempt
def crear_pago(request):
    try:
        if request.method != 'POST':
            return JsonResponse({'error': 'Método no permitido'}, status=405)

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Token no proporcionado'}, status=401)

        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        user_id = payload.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'El token no contiene user_id'}, status=401)

        try:
            user_id = str(UUID(user_id))  
        except (ValueError, TypeError):
            return JsonResponse({'error': 'user_id inválido'}, status=401)

        request.session['user_id'] = user_id

        transaction_token = generate_transaction_token(user_id)
        if not transaction_token:
            return JsonResponse({'error': 'Error al generar la transacción'}, status=500)

        pago = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {"payment_method": "paypal"},
            "redirect_urls": {
                "return_url": f"http://localhost:8000/api/pago_exitoso/?transaction_token={transaction_token}",
                "cancel_url": "http://localhost:8000/pago_cancelado/"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "Membresía Premium",
                        "sku": "premium001",
                        "price": "10.00",
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": "10.00",
                    "currency": "USD"
                },
                "description": "Compra de membresía premium"
            }]
        })

        if pago.create():
            for link in pago.links:
                if link.method == "REDIRECT":
                    return JsonResponse({"redirect_url": link.href})
        else:
            return JsonResponse({"error": str(pago.error)}, status=500)

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': f'Error interno: {str(e)}'}, status=500)

@csrf_exempt
def generate_transaction_token(user_id):

    transaction_token = str(uuid.uuid4())  

    result = supabase.table("transactions").insert({
        "user_id": user_id,
        "transaction_token": transaction_token,
        "status": "pending",  
        "created_at": datetime.utcnow().isoformat()
    }).execute()

    if not result.data:
        return None

    return transaction_token

@csrf_exempt
def start_payment_process(request):
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
        user_id = payload.get('user_id')

        if not user_id:
            return JsonResponse({'error': 'Usuario no autenticado'}, status=401)

        transaction_token = generate_transaction_token(user_id)
        if not transaction_token:
            return JsonResponse({'error': 'No se pudo generar el token de transacción'}, status=500)

        return JsonResponse({'transaction_token': transaction_token}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def complete_payment(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    body = json.loads(request.body)
    transaction_token = body.get('transaction_token')
    payment_status = body.get('payment_status')
    payment_details = body.get('payment_details')

    if not transaction_token or not payment_status or not payment_details:
        return JsonResponse({'error': 'Faltan parámetros necesarios'}, status=400)

    result = supabase.table("transactions").select("*").eq("transaction_token", transaction_token).single().execute()
    transaction = result.data

    if not transaction:
        return JsonResponse({'error': 'Token de transacción no encontrado'}, status=404)

    if payment_status != 'Completed':
        return JsonResponse({'error': 'Pago no completado'}, status=400)

    result = supabase.table("transactions").update({
        "status": "completed",
        "payment_details": payment_details,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("transaction_token", transaction_token).execute()

    if not result.data:
        return JsonResponse({'error': 'No se pudo actualizar la transacción'}, status=500)

    user_id = transaction['user_id']
    result = supabase.table("user_profiles").update({
        "membresy": True  
    }).eq("id", user_id).execute()

    if not result.data:
        return JsonResponse({'error': 'No se pudo actualizar la membresía del usuario'}, status=500)

    return JsonResponse({'message': 'Pago completado exitosamente'}, status=200)

@csrf_exempt
def pago_exitoso(request):
    payment_id = request.GET.get('paymentId')
    paypal_token = request.GET.get('token')
    payer_id = request.GET.get('PayerID')
    transaction_token = request.GET.get('transaction_token')

    if not transaction_token:
        return HttpResponse("Token de transacción no proporcionado", status=400)

    result = supabase.table("transactions").select("user_id").eq("transaction_token", transaction_token).limit(1).execute()

    if not result.data:
        return HttpResponse("Transacción no encontrada", status=404)

    user_id = result.data[0]['user_id']

    try:
        update_result = supabase.table("user_profiles").update({"membresy": True}).eq("id", user_id).execute()

        if update_result.data:
            return HttpResponseRedirect("http://localhost:3000/perfil")
        else:
            return HttpResponse("❌ Error al actualizar la membresía.", status=500)

    except Exception as e:
        return HttpResponse(f"Error: {str(e)}", status=500)

# ======================== TOKEN ========================
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

            return JsonResponse({'token': token}, status=200)

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
        number = body.get('number')
        membresy = body.get('membresy', False)

        DEFAULT_AVATAR_URL = "https://eakoogbjlxlidtjclcxo.supabase.co/storage/v1/object/public/avatars//Leonardo_Phoenix_10_a_stylized_highcontrast_black_and_white_il_2.jpg"
        avatar_url = body.get('avatar_url') or DEFAULT_AVATAR_URL

        if not number:
            return JsonResponse({'error': 'Número de celular es requerido'}, status=400)

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
            "number": number,
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

        fields = ['first_name', 'last_name', 'city', 'birthdate', 'avatar_url', 'membresy', 'password', 'number']
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


# ======================== OBTENER USUARIO ========================
@csrf_exempt
def api_get_user_data(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]

    try:
        decoded_token = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        email = decoded_token.get('email')

        if not email:
            return JsonResponse({'error': 'Email no encontrado en el token'}, status=400)

        fields = "id, email, number, first_name, last_name, city, created_at, avatar_url, membresy, birthdate, rol"
        result = supabase.table("user_profiles").select(fields).eq("email", email).single().execute()

        if result.data:
            return JsonResponse(result.data, status=200)

        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
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
# ======================== OBTENER CLASES ========================
@csrf_exempt
def obtener_clases(request):
    try:
        result = supabase.table("clases").select("*").execute()
        if result.data:
            return JsonResponse(result.data, safe=False, status=200)
        return JsonResponse({'error': 'No se encontraron clases'}, status=404)

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
        oponent_email = body.get('oponente_email')
        descripcion = body.get('descripcion')

        if not all([boxer_id, ring_id, fecha, hora_inicio, hora_fin]):
            return JsonResponse({'error': 'Faltan campos obligatorios'}, status=400)

        if oponent_email:
            oponente = supabase.table("user_profiles").select("email").eq("email", oponent_email).execute()
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
            "oponent_email": oponent_email,
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
            reservas_resp = supabase.table("reservas").select("*").execute()
        else:
            reservas_resp = supabase.table("reservas").select("*").eq("boxer_id", user_id).execute()
        reservas = reservas_resp.data

        perfiles_resp = supabase.table("user_profiles").select("id, email, first_name, last_name").execute()
        perfiles = perfiles_resp.data

        rings_resp = supabase.table("rings").select("id, nombre").execute()
        rings = rings_resp.data

        for reserva in reservas:

            boxeador = next((u for u in perfiles if u["id"] == reserva["boxer_id"]), None)
            if boxeador:
                reserva["boxeador_nombre"] = f'{boxeador["first_name"]} {boxeador["last_name"]}'
                reserva["boxeador_email"] = boxeador["email"]
            else:
                reserva["boxeador_nombre"] = "Desconocido"
                reserva["boxeador_email"] = "Desconocido"

            reserva_email = (reserva.get("oponent_email") or "").strip().lower()
            oponente = next(
                (u for u in perfiles if (u.get("email") or "").strip().lower() == reserva_email),
                None
            )

            if oponente:
                reserva["oponente_nombre"] = f'{oponente["first_name"]} {oponente["last_name"]}'
                reserva["oponente_email"] = oponente["email"]
            else:
                reserva["oponente_nombre"] = "Desconocido"
                reserva["oponente_email"] = reserva.get("oponent_email", "Sin email")

            ring = next((r for r in rings if r["id"] == reserva["ring_id"]), None)
            if ring:
                reserva["ring_nombre"] = ring["nombre"]
            else:
                reserva["ring_nombre"] = "Desconocido"

        return JsonResponse(reservas, safe=False, status=200)

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
        if 'oponente_email' in update_data:
            oponente_check = supabase.table("user_profiles").select("email").eq("email", update_data['oponente_email']).single().execute()
            if not oponente_check.data:
                return JsonResponse({'error': 'El oponente ingresado no existe en el sistema'}, status=400)


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

        result = supabase.table("rutinas").select("*, user_profiles!fk_entrenador(first_name, last_name)").execute()

        for rutina in result.data:
            if 'user_profiles' in rutina and rutina['user_profiles']:
                first = rutina['user_profiles'].get('first_name', '')
                last = rutina['user_profiles'].get('last_name', '')
                rutina['entrenador_nombre'] = f"{first} {last}".strip()
            rutina.pop('user_profiles', None)

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
        user_id = body.get('id') 

        if not user_id:
            return JsonResponse({'error': 'Falta el campo id'}, status=400)

        new_email = body.get('email')
        if new_email:
            exists = supabase.table("user_profiles").select("id").eq("email", new_email).neq("id", user_id).execute()
            if exists.data:
                return JsonResponse({'error': 'El correo electrónico ya está registrado'}, status=409)


        fields = ['first_name', 'last_name','number', 'city', 'birthdate', 'avatar_url', 'membresy', 'rol', 'email']
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
    
# ======================== SUBIR IMAGEN A GYM =========================

@csrf_exempt
def upload_image_gym(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        print(f"Archivos recibidos en request.FILES: {request.FILES}")

        if not request.FILES or 'file' not in request.FILES:
            return JsonResponse({'error': 'No se recibió archivo'}, status=400)

        file = request.FILES['file']
        print(f"Archivo recibido: {file.name}")

        if file.size == 0:
            return JsonResponse({'error': 'El archivo está vacío'}, status=400)

        extension = '.' + file.name.split('.')[-1] if '.' in file.name else ''
        filename = f"{int(datetime.now().timestamp())}{extension}"
        file_path = f"gimnasios/{filename}"

        print(f"Subiendo archivo con el nombre: {filename} al bucket: {file_path}")

        response = supabase.storage.from_('gimnasios').upload(
            file_path, file.read(), {"content-type": file.content_type}
        )
        print(f"Respuesta de Supabase: {response}")

        if getattr(response, 'error', None):
            return JsonResponse({
                'error': 'Error al subir imagen',
                'details': str(response.error)
            }, status=500)

        public_url = supabase.storage.from_('gimnasios').get_public_url(file_path)
        print(f"Respuesta para obtener URL pública: {public_url}")

        if not public_url:
            return JsonResponse({'error': 'No se pudo obtener la URL pública'}, status=500)

        return JsonResponse({'public_url': public_url}, status=200)

    except Exception as e:
        print(f"Error en el proceso: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

    

# ======================== LISTAR CLASES =========================
@csrf_exempt
def api_list_clases(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        result = supabase.table("clases").select(
            "id, titulo, descripcion, video_url, created_at, entrenador_id, user_profiles!clases_entrenador_id_fkey(first_name, last_name)"
        ).execute()

        clases = result.data

        for clase in clases:
            user = clase.get("user_profiles", {})
            clase["nombre_entrenador"] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            clase.pop("user_profiles", None)

        return JsonResponse(clases, safe=False, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== CREAR CLASES =========================
@csrf_exempt
def api_create_clase(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        user_role = payload.get('rol')
        if user_role not in ['entrenador', 'admin']:
            return JsonResponse({'error': 'No autorizado'}, status=403)

        data = json.loads(request.body)
        required_fields = ['entrenador_id', 'titulo', 'descripcion', 'video_url']
        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Faltan campos requeridos'}, status=400)

        result = supabase.table("clases").insert(data).execute()
        return JsonResponse({'message': 'Clase creada', 'data': result.data}, status=201)

    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expirado'}, status=401)
    except jwt.DecodeError:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ======================== EDITAR CLASES =========================

@csrf_exempt
def api_update_clase(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        clase_id = data.get('id')
        if not clase_id:
            return JsonResponse({'error': 'Falta el ID de la clase'}, status=400)

        update_fields = {k: v for k, v in data.items() if k != 'id'}
        result = supabase.table("clases").update(update_fields).eq("id", clase_id).execute()

        return JsonResponse({'message': 'Clase actualizada', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ======================== ELIMINAR CLASES ========================

@csrf_exempt
def api_delete_clase(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        clase_id = data.get('id')
        if not clase_id:
            return JsonResponse({'error': 'Falta el ID de la clase'}, status=400)

        result = supabase.table("clases").delete().eq("id", clase_id).execute()
        return JsonResponse({'message': 'Clase eliminada', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== LISTAR BLOGS ========================

@csrf_exempt
def api_list_blogs_admin(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        result = supabase.table("blogs").select(
            "id, user_id, titulo, contenido, fecha_creacion, aprobado, user_profiles!blogs_user_id_fkey(first_name, last_name)"
        ).execute()

        blogs = result.data
        for blog in blogs:
            user = blog.get("user_profiles", {})
            blog["autor"] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            blog.pop("user_profiles", None)

        return JsonResponse(blogs, safe=False, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
# ======================== CREAR BLOGS ========================
@csrf_exempt
def api_create_blog_admin(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        user_role = payload.get('rol')
        data = json.loads(request.body)

        required_fields = ['user_id', 'titulo', 'contenido']
        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Faltan campos requeridos'}, status=400)

        if user_role != 'admin':
            data['aprobado'] = False  # Forzar aprobación manual si no es admin

        result = supabase.table("blogs").insert(data).execute()
        return JsonResponse({'message': 'Blog creado', 'data': result.data}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
# ======================== MODIFICAR BLOGS ========================
@csrf_exempt
def api_update_blog_admin(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        blog_id = data.get('id')
        if not blog_id:
            return JsonResponse({'error': 'Falta el ID del blog'}, status=400)

        update_fields = {k: v for k, v in data.items() if k != 'id'}
        result = supabase.table("blogs").update(update_fields).eq("id", blog_id).execute()

        return JsonResponse({'message': 'Blog actualizado', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
# ======================== ELIMINAR BLOGS ========================

@csrf_exempt
def api_delete_blog_admin(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        blog_id = data.get('id')
        if not blog_id:
            return JsonResponse({'error': 'Falta el ID del blog'}, status=400)

        result = supabase.table("blogs").delete().eq("id", blog_id).execute()
        return JsonResponse({'message': 'Blog eliminado', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

# ======================== LISTAR RINGS ========================
def api_list_rings_admin(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        # Obtener todos los rings
        rings_result = supabase.table("rings").select(
            "id, nombre, descripcion, estado, gimnasio_id"
        ).execute()
        rings = rings_result.data

        # Obtener todos los gimnasios
        gyms_result = supabase.table("gimnasios").select("id, nombre, imagen_url").execute()
        gimnasios = gyms_result.data
        gimnasio_dict = {gym["id"]: gym for gym in gimnasios}

        # Agregar nombre e imagen del gimnasio a cada ring
        for ring in rings:
            gym = gimnasio_dict.get(ring["gimnasio_id"])
            if gym:
                ring["gimnasio_nombre"] = gym["nombre"]
                ring["gimnasio_imagen_url"] = gym["imagen_url"]
            else:
                ring["gimnasio_nombre"] = "Desconocido"
                ring["gimnasio_imagen_url"] = ""

        return JsonResponse(rings, safe=False, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== CREAR RINGS ========================
@csrf_exempt
def api_create_ring_admin(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        required_fields = ['nombre', 'descripcion', 'estado', 'gimnasio_id']
        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Faltan campos requeridos'}, status=400)

        result = supabase.table("rings").insert(data).execute()
        return JsonResponse({'message': 'Ring creado', 'data': result.data}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== MODIFICAR RINGS ========================
@csrf_exempt
def api_update_ring_admin(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        ring_id = data.get('id')
        if not ring_id:
            return JsonResponse({'error': 'Falta el ID del ring'}, status=400)

        update_fields = {k: v for k, v in data.items() if k != 'id'}
        result = supabase.table("rings").update(update_fields).eq("id", ring_id).execute()

        return JsonResponse({'message': 'Ring actualizado', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ======================== ELIMINAR RINGS ========================
@csrf_exempt
def api_delete_ring_admin(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Token no proporcionado'}, status=401)

    token = auth_header.split(' ')[1]
    try:
        jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])

        data = json.loads(request.body)
        ring_id = data.get('id')
        if not ring_id:
            return JsonResponse({'error': 'Falta el ID del ring'}, status=400)

        result = supabase.table("rings").delete().eq("id", ring_id).execute()
        return JsonResponse({'message': 'Ring eliminado', 'data': result.data}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
# ======================== SUBIR IMAGEN A RINGS ========================= 

@csrf_exempt
def upload_image_rings(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        print(f"Archivos recibidos en request.FILES: {request.FILES}")

        if not request.FILES or 'file' not in request.FILES:
            return JsonResponse({'error': 'No se recibió archivo'}, status=400)

        file = request.FILES['file']
        print(f"Archivo recibido: {file.name}")

        if file.size == 0:
            return JsonResponse({'error': 'El archivo está vacío'}, status=400)

        extension = '.' + file.name.split('.')[-1] if '.' in file.name else ''
        filename = f"{int(datetime.now().timestamp())}{extension}"
        file_path = f"rings/{filename}"

        print(f"Subiendo archivo con el nombre: {filename} al bucket: {file_path}")

        response = supabase.storage.from_('rings').upload(
            file_path, file.read(), {"content-type": file.content_type}
        )
        print(f"Respuesta de Supabase: {response}")

        if getattr(response, 'error', None):
            return JsonResponse({
                'error': 'Error al subir imagen',
                'details': str(response.error)
            }, status=500)

        public_url_data = supabase.storage.from_('rings').get_public_url(file_path)
        print(f"Respuesta para obtener URL pública: {public_url_data}")

        public_url = None
        if hasattr(public_url_data, 'model_dump'):
            public_url = public_url_data.model_dump().get('public_url') or public_url_data.model_dump().get('publicUrl')
        elif isinstance(public_url_data, dict):
            public_url = public_url_data.get('public_url') or public_url_data.get('publicUrl')
        elif isinstance(public_url_data, str):  # fallback por si es URL directa
            public_url = public_url_data

        if not public_url:
            return JsonResponse({'error': 'No se pudo obtener la URL pública'}, status=500)

        return JsonResponse({'public_url': public_url}, status=200)

    except Exception as e:
        print(f"Error en el proceso: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
