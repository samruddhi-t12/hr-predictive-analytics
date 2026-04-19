import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

print("--- Step 1: Loading the DSBDA Dataset ---")
# Reading the CSV from the data folder
try:
    df = pd.read_csv('data/employee_data.csv')
    print(f"Dataset loaded successfully! Rows: {df.shape[0]}, Columns: {df.shape[1]}")
except FileNotFoundError:
    print("Error: Could not find 'employee_data.csv' in the 'data/' folder.")
    exit()

print("\n--- Step 2: Data Preprocessing ---")
# Drop useless columns
columns_to_drop = ['EmployeeCount', 'Over18', 'StandardHours', 'EmployeeNumber']
df = df.drop(columns=[col for col in columns_to_drop if col in df.columns])

# Convert our target variable 'Attrition' (Yes/No) into binary (1/0)
df['Attrition'] = df['Attrition'].apply(lambda x: 1 if x == 'Yes' else 0)

# Convert categorical text data into numbers using One-Hot Encoding
df = pd.get_dummies(df, drop_first=True)

# Split data into Features (X) and Target (y)
X = df.drop('Attrition', axis=1)
y = df['Attrition']

# Split into Training data (80%) and Testing data (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("Data successfully split into training and testing sets.")

print("\n--- Step 3: Training the AI Model ---")
# Initialize the Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')

# Train the model
model.fit(X_train, y_train)
print("Model training complete!")

print("\n--- Step 4: Evaluating the Model ---")
# Make predictions on the test set
predictions = model.predict(X_test)

# Check accuracy
accuracy = accuracy_score(y_test, predictions)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

print("\n--- Step 5: Saving the Model for FastAPI ---")
# Save the trained model and the feature columns inside the ml_engine folder
joblib.dump(model, 'ml_engine/attrition_model.pkl')
joblib.dump(X.columns, 'ml_engine/model_features.pkl')
print("Success! .pkl files generated inside the 'ml_engine' folder.")