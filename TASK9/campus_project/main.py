import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database

# 1. Load the database password securely
load_dotenv() 

# Create Tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Mount the static folder to serve HTML files
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SIMULATED EMAIL FUNCTION (Safe & Fast) ---
def send_notification(email: str, message: str):
    # This prints to your terminal instead of sending a real email
    print(f"\n[📧 FAKE EMAIL SERVER] To: {email}")
    print(f"Message: {message}\n")

# --- Routes ---

@app.get("/")
def read_root():
    return FileResponse('static/index.html')

@app.get("/admin")
def read_admin():
    return FileResponse('static/admin.html')

@app.post("/resources/", response_model=schemas.ResourceOut)
def create_resource(resource: schemas.ResourceCreate, db: Session = Depends(get_db)):
    db_resource = models.Resource(**resource.dict())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

@app.get("/resources/", response_model=List[schemas.ResourceOut])
def read_resources(db: Session = Depends(get_db)):
    return db.query(models.Resource).all()

# --- 📅 BOOKING ROUTE ---
@app.post("/bookings/", response_model=schemas.BookingOut)
def create_booking(booking: schemas.BookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Check for Overlap
    overlap = db.query(models.Booking).filter(
        models.Booking.resource_id == booking.resource_id,
        models.Booking.status != "rejected",
        models.Booking.start_time < booking.end_time,
        models.Booking.end_time > booking.start_time
    ).first()

    if overlap:
        raise HTTPException(status_code=400, detail=f"Slot conflict! Overlaps with booking ID {overlap.id}")

    # 2. Save to DB
    db_booking = models.Booking(**booking.dict())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # 3. Simulate Email in Background
    email_msg = f"New booking request from {booking.user_name} for Resource ID {booking.resource_id}"
    background_tasks.add_task(send_notification, "admin@campus.edu", email_msg)
    
    return db_booking

@app.get("/bookings/", response_model=List[schemas.BookingOut])
def read_bookings(db: Session = Depends(get_db)):
    return db.query(models.Booking).all()

@app.put("/bookings/{booking_id}/status")
def update_status(booking_id: int, status: str, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = status
    db.commit()
    return {"message": f"Booking {status}"}