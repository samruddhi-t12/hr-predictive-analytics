from sqlalchemy import Column, Integer, String, Float
from backend.database import Base

class Employee(Base):
    __tablename__ = "employees"

    #auth
    id = Column(Integer, primary_key=True, index=True)
    email=Column(String,unique=True,index=True)
    password_hash=Column(String)
    role=Column(String,default="employee")  # "admin" or "employee"

    #employee data(onboarding)
    name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    marital_status = Column(String)
    education_field = Column(String)
    distance_from_home = Column(Integer)
   
   #HR data (by admin)
    department = Column(String)
    job_role = Column(String)
    job_level=  Column(Integer)
    monthly_income = Column(Integer)
    daily_rate = Column(Integer)
    hourly_rate = Column(Integer)
    num_companies_worked = Column(Integer)
    total_working_years = Column(Integer)
    years_at_company = Column(Integer)
    years_in_current_role = Column(Integer)
    years_since_last_promotion = Column(Integer)
    years_with_curr_manager = Column(Integer)
    percent_salary_hike= Column(Integer)
    performance_rating = Column(Integer) # <-- TYPO FIXED HERE
    business_travel = Column(String)

    #dynamic(in pulse)
    over_time = Column(String)
    environment_satisfaction = Column(Integer)
    job_involvement = Column(Integer)
    job_satisfaction = Column(Integer)