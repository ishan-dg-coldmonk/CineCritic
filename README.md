# 🎬 CineCritic – Movie Review App

CineCritic is a simple full-stack movie review application where users can search movies and write reviews.

Frontend is built with **HTML, CSS, and JavaScript**, the backend uses **Spring Boot (Java 17)**, and **PostgreSQL** is used as the database.

---

## Tech Stack

- Frontend: HTML, CSS, JavaScript  
- Backend: Spring Boot (Java 17)  
- Database: PostgreSQL  
- Movie Data: OMDb API  

---

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/your-username/cinecritic.git
cd cinecritic
```

---

## Frontend Setup

```bash
cd frontend
```

- Open `index.html` directly in a browser  
**OR**
- Open the folder in VS Code and run **Live Server**

---

## Backend Setup

### Requirements
- Java 17 installed
- IntelliJ IDEA (recommended)

### Run the Backend

**From IDE**
- Open the `backend` folder in IntelliJ
- Run `MovieReviewApplication.java`

**From Terminal**
```bash
cd backend
./mvnw spring-boot:run
```

The backend will start on:
```
http://localhost:8081
```

---

## Database Setup (PostgreSQL)

1. Install **PostgreSQL** and **pgAdmin**
2. Open pgAdmin and create a new server if needed
3. Create a database named:
   ```
   movie_review_db
   ```
4. Configure your Spring Boot application to connect to this database using:
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: `12345678`

The required tables will be created automatically when the backend starts.

---

## How to Run the App

1. Start PostgreSQL  
2. Run the Spring Boot backend  
3. Open the frontend in a browser  

---

## Notes

- Movie search and details are powered by the **OMDb API**
- Ensure the backend is running before interacting with the frontend

---

## Author

**Ishan Dasgupta**
