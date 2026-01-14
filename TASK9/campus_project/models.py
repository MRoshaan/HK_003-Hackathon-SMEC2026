from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True) # e.g., "Lab 1", "Auditorium"
    type = Column(String(50)) # e.g., "Lab", "Hall"
    capacity = Column(Integer)

    bookings = relationship("Booking", back_populates="resource")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"))
    user_name = Column(String(100))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)

    resource = relationship("Resource", back_populates="bookings")