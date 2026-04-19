from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import joblib
import pandas as pd

from google import genai
import os
from dotenv import load_dotenv
load_dotenv()

secure_api_key = os.getenv("GEMINI_API_KEY")

if not secure_api_key:
    print("CRITICAL ERROR: GEMINI_API_KEY is missing from .env file!")

# Initialize the client securely
client = genai.Client(api_key=secure_api_key)

# FIXED IMPORTS: Explicitly pointing to the backend folder
from backend import models
from backend.database import engine, SessionLocal

# 1. Create the actual database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="HR Predictive Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the AI Model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_engine', 'attrition_model.pkl')
FEATURES_PATH = os.path.join(BASE_DIR, 'ml_engine', 'model_features.pkl')

try:
    model = joblib.load(MODEL_PATH)
    model_features = joblib.load(FEATURES_PATH)
    print("AI Model loaded successfully!")
except Exception as e:
    print(f"Startup Warning: Could not load ML model. Error: {e}")

# Dependency: This opens a database session for each request and closes it after
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- NEW: Seed the database with a test employee ---
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    # Check if the database is empty
    if not db.query(models.Employee).first():
        print("Seeding database with test employee: Rahul...")
        test_emp = models.Employee(
            name="Rahul Sharma",
            department="Sales",
            age=28,
            monthly_income=2500,
            distance_from_home=25,
            over_time="Yes"
        )
        db.add(test_emp)
        db.commit()
    db.close()

@app.get("/analyze-employee/{emp_id}")
def analyze_employee(emp_id: int, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found in database")

    ai_input = {
        "Age": employee.age, "MonthlyIncome": employee.monthly_income,
        "DistanceFromHome": employee.distance_from_home, "OverTime": employee.over_time,
        "DailyRate": 800, "EnvironmentSatisfaction": 3, "HourlyRate": 50,
        "JobInvolvement": 3, "JobLevel": 2, "JobSatisfaction": 3,
        "NumCompaniesWorked": 2, "PercentSalaryHike": 15, "PerformanceRating": 3,
        "TotalWorkingYears": 5, "YearsAtCompany": 3, "YearsInCurrentRole": 2,
        "YearsSinceLastPromotion": 1, "YearsWithCurrManager": 2,
        "BusinessTravel": "Travel_Rarely", "Department": employee.department,
        "EducationField": "Life Sciences", "Gender": "Male",
        "JobRole": "Sales Representative", "MaritalStatus": "Single"
    }

    try:
        df_input = pd.DataFrame([ai_input])
        df_input = pd.get_dummies(df_input)
        df_input = df_input.reindex(columns=model_features, fill_value=0)
        
        prediction = model.predict(df_input)
        probability = model.predict_proba(df_input)[0][1] 
        is_high_risk = prediction[0] == 1

        print("Generating custom strategy via Gemini LLM...")
        
        # We ask the LLM to give advice regardless of risk level
        prompt = f"""
        You are an expert HR Director. An employee named {employee.name} in the {employee.department} department has a {round(probability * 100)}% probability of resigning.
        Key metrics: Age: {employee.age}, Monthly Income: ${employee.monthly_income}, Commute: {employee.distance_from_home} miles, Overtime: {employee.over_time}.
        If the risk is high, write a 3-step retention rescue plan. If the risk is low, write a 3-step career growth plan to keep them engaged. 
        Keep it highly specific, professional, and under 100 words.
        """
        
        # Added a specific try-except block to handle the DNS [Errno 11001] network failure
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            strategy_text = response.text
        except Exception as llm_error:
            print(f"Network Error reaching Gemini APIs: {llm_error}")
            strategy_text = "LLM Generation Failed: Could not connect to external AI servers. Please check your internet connection or DNS settings."

        return {
            "employee_name": employee.name,
            "department": employee.department,
            "ai_analysis": {
                "flight_risk_probability": round(probability * 100, 2),
                "status": "High Risk (Will Quit)" if is_high_risk else "Safe (Will Stay)",
                "strategy": strategy_text
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))