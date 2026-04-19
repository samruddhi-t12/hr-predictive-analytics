from sqlalchemy import Column, Integer, String, Float
from backend.database import Base

class Employee(Base):
    __tablename__ = "employees"

    # This is exactly like setting up columns in an Excel sheet or SQL table
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    department = Column(String)
    
    # The critical metrics our AI model needs
    age = Column(Integer)
    monthly_income = Column(Integer)
    distance_from_home = Column(Integer)
    over_time = Column(String)  # "Yes" or "No"