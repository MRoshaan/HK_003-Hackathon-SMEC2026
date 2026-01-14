from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# --- Resource Schemas ---
class ResourceBase(BaseModel):
    name: str
    type: str
    capacity: int

class ResourceCreate(ResourceBase):
    pass

class ResourceOut(ResourceBase):
    id: int
    class Config:
        from_attributes = True

# --- Booking Schemas ---
class BookingCreate(BaseModel):
    resource_id: int
    user_name: str
    start_time: datetime
    end_time: datetime

class BookingOut(BookingCreate):
    id: int
    status: str
    resource: ResourceOut
    class Config:
        from_attributes = True