from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import joblib
import pandas as pd
import shap
import io
import time
from statistics import mean
from collections import deque
import bcrypt

from google import genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Dict, Any

# --- 1. CONFIGURATION & SECURITY ---
load_dotenv()
secure_api_key = os.getenv("GEMINI_API_KEY")

if not secure_api_key:
    print("CRITICAL ERROR: GEMINI_API_KEY is missing from .env file!")

client = genai.Client(api_key=secure_api_key)

# Modern bcrypt implementation directly replacing passlib
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# --- LIVE TELEMETRY & DRIFT MONITORING ---
monitoring_stats = {
    "total_predictions": 0,
    "inference_latency_ms": deque(maxlen=1000), 
    "rolling_probabilities": deque(maxlen=1000),
    "baseline_attrition_rate": 0.161 
}

# --- 2. DATABASE & SCHEMAS ---
import models
from database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

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

# --- 3. ML MODEL LOADING (LIFESPAN) ---
ml_assets: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    ML_DIR = os.path.join(BASE_DIR, 'ml_engine')
    
    try:
        ml_assets['model'] = joblib.load(os.path.join(ML_DIR, 'attrition_model.pkl'))
        ml_assets['scaler'] = joblib.load(os.path.join(ML_DIR, 'scaler.pkl'))
        ml_assets['features'] = joblib.load(os.path.join(ML_DIR, 'model_features.pkl'))
        ml_assets['explainer'] = joblib.load(os.path.join(ML_DIR, 'shap_explainer.pkl'))
        print("AI Model, Scaler, Features, and SHAP Explainer loaded successfully!")
    except Exception as e:
        print(f"Startup Warning: Could not load ML models. Error: {e}")
        
    yield
    ml_assets.clear()

app = FastAPI(title="Nexus HR Predictive Analytics API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hr-predictive-analytics.vercel.app", 
        "http://localhost:3000",
        "http://localhost:5173"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        print("Seeding PostgreSQL database with test Admin and Employee...")
        
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
    if not ml_assets:
        raise HTTPException(status_code=503, detail="ML Engine not fully initialized.")

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
        df_input = df_input.reindex(columns=ml_assets['features'], fill_value=0)
        
        scaled_array = ml_assets['scaler'].transform(df_input)
        scaled_df = pd.DataFrame(scaled_array, columns=ml_assets['features'])
        
        start_time = time.perf_counter()
        prediction = ml_assets['model'].predict(scaled_array)
        probability = float(ml_assets['model'].predict_proba(scaled_array)[0][1])
        inference_time_ms = (time.perf_counter() - start_time) * 1000
        
        monitoring_stats["total_predictions"] += 1
        monitoring_stats["inference_latency_ms"].append(inference_time_ms)
        monitoring_stats["rolling_probabilities"].append(probability)

        is_high_risk = prediction[0] == 1

        shap_vals = ml_assets['explainer'](scaled_df).values[0]
        impacts = [{"feature_name": f, "impact_weight": float(v)} for f, v in zip(ml_assets['features'], shap_vals)]
        top_reasons = sorted(impacts, key=lambda x: abs(x["impact_weight"]), reverse=True)[:3]
        
        if role == "admin":
            prompt = f"""
            You are an expert HR Director. An employee named {employee.name} in the {employee.department} department has a {round(probability * 100)}% probability of resigning.
            Top ML identified risk/retention drivers: 
            1. {top_reasons[0]['feature_name']} (SHAP Impact: {top_reasons[0]['impact_weight']:.2f})
            2. {top_reasons[1]['feature_name']} (SHAP Impact: {top_reasons[1]['impact_weight']:.2f})
            3. {top_reasons[2]['feature_name']} (SHAP Impact: {top_reasons[2]['impact_weight']:.2f})
            Key metrics: Age: {employee.age}, Monthly Income: ${employee.monthly_income}, Commute: {employee.distance_from_home} miles, Overtime: {employee.over_time}.
            If the risk is high, write a 3-step retention rescue plan addressing the top drivers. If the risk is low, write a 3-step career growth plan to keep them engaged. 
            Keep it highly specific, professional, and under 100 words. Format with clean bullet points.
            """
        else:
            prompt = f"""
            You are an expert Career Mentor advising {employee.name} in the {employee.department} department.
            Key metrics: Age: {employee.age}, Commute: {employee.distance_from_home} miles, Overtime: {employee.over_time}, Job Level: {employee.job_level}.
            Write a 3-step personalized career growth and upskilling roadmap for them. Focus on maximizing their potential, work-life balance, and future success.
            CRITICAL: DO NOT mention flight risk, retention, resignation probabilities, or SHAP drivers. Keep it encouraging, professional, and under 100 words. Format with clean bullet points.
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
                "top_drivers": top_reasons if role == "admin" else None,
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
    if not ml_assets:
        raise HTTPException(status_code=503, detail="ML Engine not fully initialized.")

    employees = db.query(models.Employee).all()
    if not employees:
        return {"total_headcount": 0, "global_risk": 0, "departments": []}

    emp_data = []
    for emp in employees:
        emp_data.append({
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
        })

    df_input = pd.DataFrame(emp_data)
    df_input = pd.get_dummies(df_input)
    df_input = df_input.reindex(columns=ml_assets['features'], fill_value=0)
    
    scaled_matrix = ml_assets['scaler'].transform(df_input)
    probabilities = ml_assets['model'].predict_proba(scaled_matrix)[:, 1] * 100

    dept_stats = {}
    total_risk = 0

    for idx, emp in enumerate(employees):
        prob = probabilities[idx]
        total_risk += prob
        
        dept = emp.department
        if dept not in dept_stats:
            dept_stats[dept] = {"count": 0, "total_risk": 0}
        
        dept_stats[dept]["count"] += 1
        dept_stats[dept]["total_risk"] += prob

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

@app.post("/batch-predict")
async def batch_predict(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Only CSV files are supported.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        identifiers = df.get('EmployeeNumber', df.index).tolist()
        departments = df.get('Department', ['Unknown'] * len(df)).tolist()
        
        existing_ids = {emp.id for emp in db.query(models.Employee.id).all()}
        new_employees = []
        default_hash = get_password_hash("nexus2026")

        for index, row in df.iterrows():
            emp_id = int(row.get('EmployeeNumber', index + 1000))
            
            if emp_id not in existing_ids:
                new_emp = models.Employee(
                    id=emp_id, email=f"employee{emp_id}@company.com", password_hash=default_hash,
                    role="employee", name=f"Employee #{emp_id}", department=str(row.get('Department', 'Unknown')),
                    age=int(row.get('Age', 30)), gender=str(row.get('Gender', 'Male')),
                    marital_status=str(row.get('MaritalStatus', 'Single')), education_field=str(row.get('EducationField', 'Other')),
                    distance_from_home=int(row.get('DistanceFromHome', 5)), job_role=str(row.get('JobRole', 'Staff')),
                    job_level=int(row.get('JobLevel', 1)), monthly_income=int(row.get('MonthlyIncome', 5000)),
                    daily_rate=int(row.get('DailyRate', 800)), hourly_rate=int(row.get('HourlyRate', 50)),
                    num_companies_worked=int(row.get('NumCompaniesWorked', 1)), total_working_years=int(row.get('TotalWorkingYears', 5)),
                    years_at_company=int(row.get('YearsAtCompany', 2)), years_in_current_role=int(row.get('YearsInCurrentRole', 2)),
                    years_since_last_promotion=int(row.get('YearsSinceLastPromotion', 1)), years_with_curr_manager=int(row.get('YearsWithCurrManager', 2)),
                    percent_salary_hike=int(row.get('PercentSalaryHike', 10)), performance_rating=int(row.get('PerformanceRating', 3)),
                    business_travel=str(row.get('BusinessTravel', 'Travel_Rarely')), over_time=str(row.get('OverTime', 'No')),
                    environment_satisfaction=int(row.get('EnvironmentSatisfaction', 3)), job_involvement=int(row.get('JobInvolvement', 3)),
                    job_satisfaction=int(row.get('JobSatisfaction', 3))
                )
                new_employees.append(new_emp)
                existing_ids.add(emp_id)

        if new_employees:
            db.add_all(new_employees)
            db.commit()

        df_processed = pd.get_dummies(df)
        df_processed = df_processed.reindex(columns=ml_assets['features'], fill_value=0)
        
        scaled_matrix = ml_assets['scaler'].transform(df_processed)
        probabilities = ml_assets['model'].predict_proba(scaled_matrix)[:, 1]
        
        results = []
        for idx, prob in enumerate(probabilities):
            if prob > 0.50:  
                results.append({
                    "employee_id": int(identifiers[idx]),
                    "department": str(departments[idx]),
                    "flight_risk_probability": round(float(prob * 100), 2)
                })
                
        sorted_results = sorted(results, key=lambda x: x['flight_risk_probability'], reverse=True)
        
        return {
            "status": "success",
            "total_records_processed": len(df),
            "critical_flight_risks": len(sorted_results),
            "actionable_targets": sorted_results[:100]  
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

@app.get("/model-health")
async def get_model_health():
    if not ml_assets:
        return {"status": "offline", "detail": "ML Engine not initialized"}

    if monitoring_stats["total_predictions"] == 0:
        return {"status": "healthy", "detail": "Awaiting initial inference traffic"}

    avg_latency = mean(monitoring_stats["inference_latency_ms"])
    avg_prob = mean(monitoring_stats["rolling_probabilities"])
    
    drift_detected = False
    drift_variance = abs(avg_prob - monitoring_stats["baseline_attrition_rate"])
    if drift_variance > 0.15 and len(monitoring_stats["rolling_probabilities"]) > 50:
        drift_detected = True

    return {
        "system_status": "healthy",
        "model_version": "Logistic_Regression_v1.0",
        "telemetry": {
            "total_inferences_served": monitoring_stats["total_predictions"],
            "average_latency_ms": round(avg_latency, 2),
            "p99_latency_ms": round(max(monitoring_stats["inference_latency_ms"]), 2)
        },
        "drift_monitoring": {
            "baseline_training_attrition": f"{monitoring_stats['baseline_attrition_rate'] * 100}%",
            "current_rolling_attrition": f"{round(avg_prob * 100, 2)}%",
            "drift_detected": drift_detected,
            "status_message": "WARNING: High Data Drift Detected. Model Retraining Recommended." if drift_detected else "Nominal. Model distribution matches training baseline."
        }
    }