# 1. Base Image: Start with a lightweight version of Python 3.11
FROM python:3.11-slim

# 2. Working Directory: Create a folder inside the container to put our code
WORKDIR /app

# 3. System Dependencies: Install C++ compilers required by some ML libraries (like XGBoost/SHAP)
RUN apt-get update && apt-get install -y build-essential

# 4. Copy Requirements: Move only the requirements file first. 
# Docker caches this step, so if you change your code later, it doesn't have to re-download everything!
COPY requirements.txt .

# 5. Install Packages: Tell Python to install everything inside the container
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy Code: Move your actual application code into the /app folder
COPY . .

# 7. Expose Port: Tell the container to open port 8000 for web traffic
EXPOSE 8000

# 8. Start Command: The command that runs when the container starts
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]