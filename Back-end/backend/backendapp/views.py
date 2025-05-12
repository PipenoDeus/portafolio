from django.shortcuts import render, get_object_or_404, redirect
from .models import Gym,Boxer,SparringReservation
from .supabase_client import supabase
from .serializer import SparringReservationSerializer
from rest_framework import viewsets
from django.http import JsonResponse
from datetime import datetime, timedelta
from django.contrib import messages
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse
from django.db import models


def login(request):
    return render(request, 'backendapp/login.html')

def registro_view(request):
    return render(request, 'backendapp/registro.html')

def home(request):
    return render(request, 'backendapp/home.html')

def gym_list(request):
    response = supabase.table("Gym").select("*").execute()
    print("Supabase Response:", response)
    gyms = response.data
    return render(request, 'backendapp/gym_list.html', {'gyms': gyms})

def gym_create(request):
    if request.method == 'POST':
        Gym.objects.create(
            name=request.POST['name'],
            location=request.POST['location'],
            phone=request.POST['phone'],
            is_active='is_active' in request.POST
        )
        return redirect('gym_list')
    return render(request, 'backendapp/gym_form.html')

def gym_update(request, id):
    gym = get_object_or_404(Gym, id=id)
    if request.method == 'POST':
        gym.name = request.POST['name']
        gym.location = request.POST['location']
        gym.phone = request.POST['phone']
        gym.is_active = 'is_active' in request.POST
        gym.save()
        return redirect('gym_list')
    return render(request, 'backendapp/gym_form.html', {'gym': gym})

def gym_delete(request, id):
    gym = get_object_or_404(Gym, id=id)
    gym.delete()
    return redirect('gym_list')

# Boxer List
def boxer_list(request):
    response = supabase.table("Boxer").select("*").execute()
    print("Supabase Response:", response)
    boxers = response.data

    for boxer in boxers:
        try:
            kg = float(boxer['weight_class'])
            boxer['weight_lbs'] = round(kg * 2.20462, 1)
        except:
            boxer['weight_lbs'] = 'N/A'
    
    return render(request, 'backendapp/boxer_list.html', {'boxers': boxers})

# Create Boxer
def boxer_create(request):
    if request.method == 'POST':
        data = {
            "first_name": request.POST['first_name'],
            "last_name": request.POST['last_name'],
            "birth_date": request.POST['birth_date'],
            "weight_class": request.POST['weight_class'],
            "record": request.POST['record'],
            "is_active": 'is_active' in request.POST
        }

        supabase.table("Boxer").insert(data).execute()
        return redirect('boxer_list')

    return render(request, 'backendapp/boxer_form.html')

# Update Boxer
def boxer_update(request, id):
    boxer = get_object_or_404(Boxer, id=id)
    if request.method == 'POST':
        boxer.first_name = request.POST['first_name']
        boxer.last_name = request.POST['last_name']
        boxer.birth_date = request.POST['birth_date']
        boxer.weight_class = request.POST['weight_class']
        boxer.record = request.POST['record']
        boxer.is_active = 'is_active' in request.POST
        boxer.save()
        return redirect('boxer_list')
    return render(request, 'backendapp/boxer_form.html', {'boxer': boxer})

# Delete Boxer
def boxer_delete(request, id):
    supabase.table('SparringReservation').delete().or_(
        f"requester.eq.{id},opponent.eq.{id}"
    ).execute()

    response = supabase.table('boxer').delete().eq('id', id).execute()

    if response.error:
        return HttpResponse(f"Failed to delete boxer: {response.error.message}", status=500)

    return redirect('boxer_list')

class SparringReservationViewSet(viewsets.ModelViewSet):
    queryset = SparringReservation.objects.all()
    serializer_class = SparringReservationSerializer

def sparring_reserve(request):
    if request.method == "POST":
        try:
            date_str = request.POST["date"]
            time_str = request.POST["time"]
            requester = request.POST["requester"]
            opponent = request.POST["opponent"]

            duration_minutes = 60  

            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            time_obj = datetime.strptime(time_str, "%H:%M").time()
            start_dt = datetime.combine(date_obj, time_obj)
            end_dt = start_dt + timedelta(minutes=duration_minutes)

            existing = supabase.table("SparringReservation").select("*").eq("date", date_str).execute().data

            for r in existing:
                if str(r["requester"]) == requester or str(r["opponent"]) == requester \
                   or str(r["requester"]) == opponent or str(r["opponent"]) == opponent:
                    
                    existing_time = datetime.strptime(f"{r['date']} {r['time']}", "%Y-%m-%d %H:%M:%S")
                    existing_end = existing_time + timedelta(minutes=duration_minutes)

                    if (start_dt < existing_end and end_dt > existing_time):
                        messages.error(request, "Conflict")
                        return redirect("sparring_reserve")

            data = {
                "requester": requester,
                "opponent": opponent,
                "gym": request.POST.get("gym"),
                "date": date_str,
                "time": time_str,
                "notes": request.POST.get("notes"),
                "status": "pending"
            }

            supabase.table("SparringReservation").insert(data).execute()
            messages.success(request, "RESERVED!!")
            return redirect("home")

        except Exception as e:
            messages.error(request, f"Error: {str(e)}")
            return redirect("sparring_reserve")

    return render(request, "backendapp/sparring_form.html")

def calendar_page(request):
    return render(request, 'backendapp/calendar.html')

def reservation_events(request):
    response = supabase.table("SparringReservation") \
        .select("*, requester(first_name, last_name), opponent(first_name, last_name)") \
        .execute()

    data = response.data

    events = []
    for r in data:
        requester_name = f"{r['requester']['first_name']} {r['requester']['last_name']}"
        opponent_name = f"{r['opponent']['first_name']} {r['opponent']['last_name']}"

        events.append({
            "title": f"{requester_name} vs {opponent_name}",
            "start": f"{r['date']}T{r['time']}",
            "allDay": False
        })

    return JsonResponse(events, safe=False)




@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        body = json.loads(request.body)
        email = body.get('email')
        password = body.get('password')

        result = supabase.table("user_profiles").select("*").eq("email", email).single().execute()

        if result.data:
            user = result.data
            if password == user['password']:  
                return JsonResponse({'user': user}, status=200)
            else:
                return JsonResponse({'error': 'Contraseña inválida'}, status=401)
        else:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
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
        avatar_url = body.get('avatar_url', '')
        membresy = body.get('membresy', False)


        exists = supabase.table("user_profiles").select("id").eq("email", email).execute()
        if exists.data:
            return JsonResponse({'error': 'El correo ya está registrado'}, status=409)


        result = supabase.table("user_profiles").insert({
            "email": email,
            "password": password,
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

@csrf_exempt
def api_update_user(request):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        body = json.loads(request.body)
        email = body.get('email')  # identificador para buscar al usuario

        if not email:
            return JsonResponse({'error': 'Falta el campo email'}, status=400)

        # Campos que se pueden actualizar
        update_data = {}
        for field in ['first_name', 'last_name', 'city', 'birthdate', 'avatar_url', 'membresy', 'password']:
            if field in body:
                update_data[field] = body[field]

        if not update_data:
            return JsonResponse({'error': 'No se proporcionaron datos para actualizar'}, status=400)

        # Intentar actualizar el usuario
        result = supabase.table("user_profiles").update(update_data).eq("email", email).execute()

        if result.data:
            return JsonResponse({'message': 'Usuario actualizado exitosamente', 'user': result.data}, status=200)
        else:
            return JsonResponse({'error': 'No se encontró el usuario para actualizar'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def api_delete_user(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        body = json.loads(request.body)
        email = body.get('email')

        if not email:
            return JsonResponse({'error': 'Falta el campo email'}, status=400)

        # Elimina el perfil del usuario en la tabla personalizada
        result = supabase.table("user_profiles").delete().eq("email", email).execute()

        if result.data:
            return JsonResponse({'message': 'Usuario eliminado exitosamente'}, status=200)
        else:
            return JsonResponse({'error': 'No se encontró el usuario para eliminar'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt   
def obtener_gimnasios(request):
    try:
        # Obtener los gimnasios desde la base de datos de Supabase
        result = supabase.table("gimnasios").select("*").execute()

        if result.data:
            gimnasios = result.data  # Los datos de los gimnasios
            return JsonResponse(gimnasios, safe=False, status=200)
        else:
            return JsonResponse({'error': 'No se encontraron gimnasios'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def obtener_clases(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        result = supabase.table("clases").select("*").execute()
        return JsonResponse(result.data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def api_reservar_ring(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
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

        # Verificar si el email del oponente existe
        if oponente_email:
            oponente = supabase.table("user_profiles").select("email").eq("email", oponente_email).execute()

            if not oponente.data:
                return JsonResponse({'error': 'El email del oponente no está registrado'}, status=404)

        # Verificar conflictos de reservas
        conflictos = supabase.table("reservas").select("*")\
            .eq("fecha", fecha)\
            .eq("ring_id", ring_id)\
            .or_(f"hora_inicio.lte.{hora_fin},hora_fin.gte.{hora_inicio}")\
            .execute()

        if conflictos.data:
            return JsonResponse({'error': 'El ring ya está reservado en ese horario'}, status=409)

        # Crear la reserva
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

        if not result.data:
            return JsonResponse({'error': 'No se pudo crear la reserva'}, status=500)

        return JsonResponse({'message': 'Reserva registrada exitosamente'}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

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

@csrf_exempt
def api_create_rutina(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        body = json.loads(request.body)
        nombre = body.get('nombre')
        descripcion = body.get('descripcion')
        nivel = body.get('nivel')
        entrenador_id = body.get('entrenador_id')

        if not all([nombre, descripcion, nivel, entrenador_id]):
            return JsonResponse({'error': 'Faltan campos'}, status=400)

        # Verificar que el entrenador_id sea un usuario con rol válido
        user_check = supabase.table("user_profiles").select("rol").eq("id", entrenador_id).single().execute()
        if user_check.data is None:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        rol = user_check.data.get('rol')
        if rol not in ['entrenador', 'admin']:
            return JsonResponse({'error': f'Permiso denegado: rol inválido ({rol})'}, status=403)

        # Insertar la rutina
        result = supabase.table("rutinas").insert([{
            "nombre": nombre,
            "descripcion": descripcion,
            "nivel": nivel,
            "entrenador_id": entrenador_id
        }]).execute()

        return JsonResponse({'message': 'Rutina creada', 'data': result.data}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def api_get_rutinas(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        result = supabase.table("rutinas").select("*").execute()
        rutinas = result.data

        return JsonResponse({'rutinas': rutinas}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)