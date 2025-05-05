from django.shortcuts import render, get_object_or_404, redirect
from .models import Gym,Boxer,SparringReservation
from .supabase_client import supabase
from .serializer import SparringReservationSerializer
from rest_framework import viewsets
from django.http import JsonResponse
from datetime import datetime, timedelta
from django.contrib import messages
from django.http import HttpResponse


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
