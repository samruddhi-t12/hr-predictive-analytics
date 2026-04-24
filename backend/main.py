from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import joblib
import pandas as pd

from google import genai
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from pydantic import BaseModel

# --- 1. CONFIGURATION & SECURITY ---
load_dotenv()
secure_api_key = os.getenv("GEMINI_API_KEY")

if not secure_api_key:
    print("CRITICAL ERROR: GEMINI_API_KEY is missing from .env file!")

client = genai.Client(api_key=secure_api_key)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- 2. DATABASE & SCHEMAS ---
from backend import models
from backend.database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nexus HR Predictive Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str

class EmployeeCreate(BaseModel):
    email: str
    password: str
    role: str = "employee"
    name: str
    department: str
    age: int
    gender: str
    marital_status: str
    education_field: str
    distance_from_home: int
    job_role: str
    job_level: int
    monthly_income: int

class PulseUpdate(BaseModel):
    job_satisfaction: int
    environment_satisfaction: int
    over_time: str

# --- 3. ML MODEL LOADING ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_engine', 'attrition_model.pkl')
FEATURES_PATH = os.path.join(BASE_DIR, 'ml_engine', 'model_features.pkl')

try:
    model = joblib.load(MODEL_PATH)
    model_features = joblib.load(FEATURES_PATH)
    print("AI Model loaded successfully!")
except Exception as e:
    print(f"Startup Warning: Could not load ML model. Error: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 4. ROUTES ---
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    if not db.query(models.Employee).first():
        print("Seeding database with test Admin and Employee...")
        
        admin = models.Employee(
            email="admin@company.com", password_hash=get_password_hash("admin123"),
            role="admin", name="System Admin", department="HR", age=35, gender="Male", 
            marital_status="Married", education_field="Human Resources", distance_from_home=5,
            job_role="HR Director", job_level=4, monthly_income=8000, over_time="No", 
            environment_satisfaction=4, job_involvement=4, job_satisfaction=4, daily_rate=1200, 
            hourly_rate=80, num_companies_worked=3, total_working_years=10, years_at_company=5, 
            years_in_current_role=3, years_since_last_promotion=1, years_with_curr_manager=3,
            percent_salary_hike=12, performance_rating=4, business_travel="Travel_Rarely"
        )
        
        rahul = models.Employee(
            email="rahul@company.com", password_hash=get_password_hash("password123"),
            role="employee", name="Rahul Sharma", department="Sales", age=28, gender="Male", 
            marital_status="Single", education_field="Marketing", distance_from_home=25,
            job_role="Sales Representative", job_level=2, monthly_income=2500, over_time="Yes", 
            environment_satisfaction=3, job_involvement=3, job_satisfaction=3, daily_rate=800, 
            hourly_rate=50, num_companies_worked=2, total_working_years=5, years_at_company=3, 
            years_in_current_role=2, years_since_last_promotion=1, years_with_curr_manager=2,
            percent_salary_hike=15, performance_rating=3, business_travel="Travel_Rarely"
        )
        
        db.add(admin)
        db.add(rahul)
        db.commit()
    db.close()

@app.post("/register")
def register_employee(emp: EmployeeCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.Employee).filter(models.Employee.email == emp.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(emp.password)
    
    new_employee = models.Employee(
        email=emp.email, password_hash=hashed_password, role=emp.role, name=emp.name,
        department=emp.department, age=emp.age, gender=emp.gender, marital_status=emp.marital_status,
        education_field=emp.education_field, distance_from_home=emp.distance_from_home,
        job_role=emp.job_role, job_level=emp.job_level, monthly_income=emp.monthly_income,
        over_time="No", environment_satisfaction=3, job_involvement=3, job_satisfaction=3,
        daily_rate=800, hourly_rate=50, num_companies_worked=1, total_working_years=1, 
        years_at_company=1, years_in_current_role=1, years_since_last_promotion=0, 
        years_with_curr_manager=1, percent_salary_hike=10, performance_rating=3, 
        business_travel="Travel_Rarely"
    )
    
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return {"message": "Employee registered successfully!", "id": new_employee.id}

@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Employee).filter(models.Employee.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {"message": "Login successful", "user_id": user.id, "name": user.name, "role": user.role}

@app.get("/analyze-employee/{emp_id}")
def analyze_employee(emp_id: int, role: str = "admin", db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found in database")

    ai_input = {
        "Age": employee.age, "MonthlyIncome": employee.monthly_income,
        "DistanceFromHome": employee.distance_from_home, "OverTime": employee.over_time,
        "DailyRate": employee.daily_rate, "EnvironmentSatisfaction": employee.environment_satisfaction, 
        "HourlyRate": employee.hourly_rate, "JobInvolvement": employee.job_involvement, 
        "JobLevel": employee.job_level, "JobSatisfaction": employee.job_satisfaction,
        "NumCompaniesWorked": employee.num_companies_worked, "PercentSalaryHike": employee.percent_salary_hike, 
        "PerformanceRating": employee.performance_rating, "TotalWorkingYears": employee.total_working_years, 
        "YearsAtCompany": employee.years_at_company, "YearsInCurrentRole": employee.years_in_current_role,
        "YearsSinceLastPromotion": employee.years_since_last_promotion, "YearsWithCurrManager": employee.years_with_curr_manager,
        "BusinessTravel": employee.business_travel, "Department": employee.department,
        "EducationField": employee.education_field, "Gender": employee.gender,
        "JobRole": employee.job_role, "MaritalStatus": employee.marital_status
    }

    try:
        df_input = pd.DataFrame([ai_input])
        df_input = pd.get_dummies(df_input)
        df_input = df_input.reindex(columns=model_features, fill_value=0)
        
        prediction = model.predict(df_input)
        probability = model.predict_proba(df_input)[0][1] 
        is_high_risk = prediction[0] == 1

        print(f"Generating custom strategy via Gemini LLM for role: {role}...")
        
        if role == "admin":
            prompt = f"""
            You are an expert HR Director. An employee named {employee.name} in the {employee.department} department has a {round(probability * 100)}% probability of resigning.
            Key metrics: Age: {employee.age}, Monthly Income: ${employee.monthly_income}, Commute: {employee.distance_from_home} miles, Overtime: {employee.over_time}.
            If the risk is high, write a 3-step retention rescue plan. If the risk is low, write a 3-step career growth plan to keep them engaged. 
            Keep it highly specific, professional, and under 100 words. Format with clean bullet points.
            """
        else:
            prompt = f"""
            You are an expert Career Mentor advising {employee.name} in the {employee.department} department.
            Key metrics: Age: {employee.age}, Commute: {employee.distance_from_home} miles, Overtime: {employee.over_time}, Job Level: {employee.job_level}.
            Write a 3-step personalized career growth and upskilling roadmap for them. Focus on maximizing their potential, work-life balance, and future success.
            CRITICAL: DO NOT mention flight risk, retention, or resignation probabilities. Keep it encouraging, professional, and under 100 words. Format with clean bullet points.
            """
        
        try:
            response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
            strategy_text = response.text
        except Exception as llm_error:
            print(f"Network Error reaching Gemini APIs: {llm_error}")
            strategy_text = "LLM Generation Failed: Could not connect to external AI servers. Please check your internet connection or DNS settings."

        return {
            "employee_name": employee.name,
            "department": employee.department,
            "ai_analysis": {
                "flight_risk_probability": round(probability * 100, 2) if role == "admin" else None,
                "status": ("High Risk (Will Quit)" if is_high_risk else "Safe (Will Stay)") if role == "admin" else "Active Profile",
                "strategy": strategy_text 
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/update-pulse/{emp_id}")
def update_pulse(emp_id: int, pulse: PulseUpdate, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.job_satisfaction = pulse.job_satisfaction
    employee.environment_satisfaction = pulse.environment_satisfaction
    employee.over_time = pulse.over_time
    db.commit()
    return {"message": "Pulse data updated successfully"}

@app.get("/company-overview")
def get_company_overview(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).all()
    if not employees:
        return {"total_headcount": 0, "global_risk": 0, "departments": []}

    dept_stats = {}
    total_risk = 0

    for emp in employees:
        ai_input = {
            "Age": emp.age, "MonthlyIncome": emp.monthly_income, "DistanceFromHome": emp.distance_from_home, 
            "OverTime": emp.over_time, "DailyRate": emp.daily_rate, "EnvironmentSatisfaction": emp.environment_satisfaction, 
            "HourlyRate": emp.hourly_rate, "JobInvolvement": emp.job_involvement, "JobLevel": emp.job_level, 
            "JobSatisfaction": emp.job_satisfaction, "NumCompaniesWorked": emp.num_companies_worked, 
            "PercentSalaryHike": emp.percent_salary_hike, "PerformanceRating": emp.performance_rating, 
            "TotalWorkingYears": emp.total_working_years, "YearsAtCompany": emp.years_at_company, 
            "YearsInCurrentRole": emp.years_in_current_role, "YearsSinceLastPromotion": emp.years_since_last_promotion, 
            "YearsWithCurrManager": emp.years_with_curr_manager, "BusinessTravel": emp.business_travel, 
            "Department": emp.department, "EducationField": emp.education_field, "Gender": emp.gender,
            "JobRole": emp.job_role, "MaritalStatus": emp.marital_status
        }
        df_input = pd.DataFrame([ai_input])
        df_input = pd.get_dummies(df_input)
        df_input = df_input.reindex(columns=model_features, fill_value=0)
        
        probability = model.predict_proba(df_input)[0][1] * 100
        total_risk += probability

        dept = emp.department
        if dept not in dept_stats:
            dept_stats[dept] = {"count": 0, "total_risk": 0}
        
        dept_stats[dept]["count"] += 1
        dept_stats[dept]["total_risk"] += probability

    global_avg_risk = total_risk / len(employees)

    dept_data_list = []
    for dept, stats in dept_stats.items():
        dept_data_list.append({
            "name": dept,
            "employees": stats["count"],
            "avgRisk": round(stats["total_risk"] / stats["count"], 1)
        })

    return {
        "total_headcount": len(employees),
        "global_risk": round(global_avg_risk, 1),
        "departments": dept_data_list
    }