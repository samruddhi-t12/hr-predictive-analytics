import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import joblib
import shap
import os

print("--- Step 1: Loading the DSBDA Dataset ---")
try:
    df = pd.read_csv('data/employee_data.csv')
    print(f"Dataset loaded successfully! Rows: {df.shape[0]}, Columns: {df.shape[1]}")
except FileNotFoundError:
    print("Error: Could not find 'employee_data.csv' in the 'data/' folder.")
    exit()

print("\n--- Step 2: Data Preprocessing ---")
columns_to_drop = ['EmployeeCount', 'Over18', 'StandardHours', 'EmployeeNumber']
df = df.drop(columns=[col for col in columns_to_drop if col in df.columns])

# Binarize Target
df['Attrition'] = df['Attrition'].apply(lambda x: 1 if x == 'Yes' else 0)

# One-Hot Encode
df = pd.get_dummies(df, drop_first=True)

X = df.drop('Attrition', axis=1)
y = df['Attrition']

print("\n--- Step 3: Splitting & Scaling Data ---")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("\n--- Step 4: Training & Comparing Multiple Models ---")
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced'),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'),
    "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', scale_pos_weight=5) # scale_pos_weight handles imbalance
}

best_model = None
best_f1 = 0
best_model_name = ""

for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    predictions = model.predict(X_test_scaled)
    
    f1 = f1_score(y_test, predictions)
    print(f"\nModel: {name}")
    print(f"Accuracy:  {accuracy_score(y_test, predictions)*100:.2f}%")
    print(f"Precision: {precision_score(y_test, predictions)*100:.2f}%")
    print(f"Recall:    {recall_score(y_test, predictions)*100:.2f}%")
    print(f"F1-Score:  {f1:.2f}")
    
    if f1 > best_f1:
        best_f1 = f1
        best_model = model
        best_model_name = name

print(f"\n--- Step 5: Generating SHAP Explainer for {best_model_name} ---")
# SHAP requires a background dataset. We use a summary of the training data.
explainer = shap.Explainer(best_model.predict, X_train_scaled[:100]) # Use a subset to save compute time
shap_values = explainer(X_test_scaled[:5]) # Test run to ensure it works

print("\n--- Step 6: Saving the ML Engine ---")
if not os.path.exists('ml_engine'):
    os.makedirs('ml_engine')

joblib.dump(best_model, 'ml_engine/attrition_model.pkl')
joblib.dump(scaler, 'ml_engine/scaler.pkl')
joblib.dump(X.columns.tolist(), 'ml_engine/model_features.pkl')
joblib.dump(explainer, 'ml_engine/shap_explainer.pkl')

print(f"Success! {best_model_name} selected with an F1-Score of {best_f1:.2f}. All files saved.")