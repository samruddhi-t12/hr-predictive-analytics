from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. This creates a local file named 'hr_data.db' inside your backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./hr_data.db"

# 2. The Engine is the thing that actually talks to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# 3. The Session is what you use to query the database (like opening a connection)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Base is the template we will use to create our database tables
Base = declarative_base()