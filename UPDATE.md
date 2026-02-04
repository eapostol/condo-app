# Condo Management Portal - Launch Instructions

## Application Overview

This is a **MERN stack** (MongoDB, Express, React, Node.js) condo management portal that provides role-based reporting and management features for condominium communities. 

**Key Features:**
- Role-based access (Manager and Board member views)
- Report generation and PDF export
- MySQL/MongoDB dual-database support for reporting
- OAuth authentication (Google, Microsoft Azure AD)
- RESTful API with Swagger documentation

**Technology Stack:**
- **Frontend**: React 18 + Vite + TailwindCSS (Port 3000)
- **Backend**: Node.js + Express (Port 5000)
- **Databases**: MongoDB (Port 27017), MySQL 8.4 (Port 3307)
- **Authentication**: JWT + Passport.js + OAuth

---

## (A) Native Launch on Windows 11

This method runs the application directly on your Windows 11 machine without Docker.

### Prerequisites

1. **Node.js** (v18 or higher)
   ```powershell
   node --version
   npm --version
   ```

2. **MongoDB** (v7 or higher)
   - Download from: https://www.mongodb.com/try/download/community
   - Ensure MongoDB service is running:
     ```powershell
     net start MongoDB
     ```
   - Verify connection:
     ```powershell
     mongosh
     ```

3. **MySQL** (v8.4 or compatible)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Install and configure with:
     - Root password: `root_password`
     - Database: `condo_mgmt`
     - User: `condo_app`
     - Password: `condo_app_pw`
   - Initialize the database:
     ```powershell
     mysql -u root -p < server\db\mysql\init\01_schema.sql
     mysql -u root -p < server\db\mysql\init\02_sample_data.sql
     mysql -u root -p < server\db\mysql\init\03_views.sql
     mysql -u root -p < server\db\mysql\init\04_role_views.sql
     ```

### Setup Steps

1. **Install Dependencies**
   ```powershell
   # Install all dependencies (root, server, client)
   npm run install:all
   ```

2. **Configure Environment Variables**
   
   Create `server\.env` file (copy from `.env.docker` and modify):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/condo_app
   JWT_SECRET=development_secret_key_for_testing_purposes_only
   CLIENT_URL=http://localhost:3000
   
   REPORTING_PROVIDER=mysql
   
   # MySQL Database (local)
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=condo_mgmt
   MYSQL_USER=condo_app
   MYSQL_PASSWORD=condo_app_pw
   
   # OAuth credentials (use existing or configure your own)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=/api/auth/google/callback
   
   MICROSOFT_CLIENT_ID=your_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
   MICROSOFT_CALLBACK_URL=/api/auth/microsoft/callback
   MICROSOFT_TENANT=common
   ```

3. **Seed the Database (Optional)**
   ```powershell
   npm run seed
   ```

### Launch the Application

#### Option 1: Run Both Server and Client Together (Recommended)
```powershell
npm run dev
```
This uses `concurrently` to run both server and client with hot-reload.

#### Option 2: Run Server and Client Separately

**Terminal 1 - Backend Server:**
```powershell
npm run dev:server
```

**Terminal 2 - Frontend Client:**
```powershell
npm run dev:client
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Swagger API Docs**: http://localhost:5000/api/docs

### Demo Credentials

- **Manager Account**: `manager1` / `Password123!`
- **Board Member Account**: `board1` / `Password123!`

### Stopping the Application

- Press `Ctrl + C` in each terminal window

---

## (B) Docker Container Launch (Development)

This method runs the entire application stack in Docker containers with hot-reload support for development.

### Prerequisites

1. **Docker Desktop** for Windows
   - Download from: https://www.docker.com/products/docker-desktop/
   - Ensure Docker is running (check system tray icon)
   - Verify installation:
     ```powershell
     docker --version
     docker compose version
     ```

### Launch Steps

1. **Navigate to Project Directory**
   ```powershell
   cd d:\projects\2025\condo-project\app
   ```

2. **Start the Development Environment**
   ```powershell
   docker compose -f docker-compose.dev.yml up --build -d
   ```

   **What this does:**
   - Builds and starts 4 containers: `client`, `api`, `mongo`, `mysql`
   - Mounts local source code for hot-reload
   - Seeds database with sample data on first start
   - Exposes ports for local access

3. **Wait for Startup**
   - First run takes 5-10 minutes (downloading images, building)
   - Watch for log messages indicating services are ready
   - Look for: `Server listening on port 5000` and `Vite ready`

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Swagger API Docs**: http://localhost:5000/api/docs
- **MongoDB**: `mongodb://localhost:27017`
- **MySQL**: `localhost:3307` (user: `condo_app`, password: `condo_app_pw`)

### Demo Credentials

- **Manager Account**: `manager1` / `Password123!`
- **Board Member Account**: `board1` / `Password123!`

### Development Features

- **Hot Reload**: Code changes in `client/` and `server/` folders automatically reload
- **Volume Mounting**: Local files are mounted, so edits persist
- **Database Persistence**: Data persists across container restarts (stored in Docker volumes)

### Useful Commands

**View Running Containers:**
```powershell
docker compose -f docker-compose.dev.yml ps
```

**View Logs:**
```powershell
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f client
```

**Stop the Application:**
```powershell
# Graceful stop (keeps data)
docker compose -f docker-compose.dev.yml down

# Force stop
Ctrl + C (in terminal where compose is running)
```

**Complete Reset (Remove All Data):**
```powershell
docker compose -f docker-compose.dev.yml down -v
```
⚠️ This removes all volumes including database data!

**Rebuild After Major Changes:**
```powershell
docker compose -f docker-compose.dev.yml up --build --force-recreate
```

**Access Container Shell:**
```powershell
# API server
docker compose -f docker-compose.dev.yml exec api sh

# Client
docker compose -f docker-compose.dev.yml exec client sh

# MySQL
docker compose -f docker-compose.dev.yml exec mysql mysql -u condo_app -pcondo_app_pw condo_mgmt
```

### Production Docker Setup

For production deployment (single container):
```powershell
docker compose up --build
```
This uses `docker-compose.yml` which builds a production-optimized bundle.

---

## Troubleshooting

### Native Launch Issues

**MongoDB Connection Failed:**
```powershell
# Check if MongoDB is running
net start MongoDB

# Or start MongoDB manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**MySQL Connection Failed:**
```powershell
# Check if MySQL is running
Get-Service -Name MySQL*

# Start MySQL service
net start MySQL80
```

**Port Already in Use:**
```powershell
# Find what's using port 3000 or 5000
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <process_id> /F
```

### Docker Issues

**Docker Desktop Not Running:**
- Open Docker Desktop and wait for "Docker Desktop is running" message
- Check system tray icon is green

**Port Conflicts:**
- Ports 3000, 5000, 27017, 3307 must be available
- Modify ports in `docker-compose.dev.yml` if needed

**Build Failures:**
```powershell
# Clean Docker cache and rebuild
docker system prune -a
docker compose -f docker-compose.dev.yml build --no-cache
```

**Volume Permission Issues:**
```powershell
# Remove volumes and recreate
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

**Slow Performance on Windows:**
- Ensure WSL 2 backend is enabled in Docker Desktop settings
- Move project to WSL filesystem for better performance

---

## Project Structure

```
app/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utilities (PDF generation)
│   ├── Dockerfile.dev     # Dev container
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── config/       # Database & passport config
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   └── services/     # Business logic
│   ├── db/mysql/init/    # MySQL schema & seed data
│   ├── Dockerfile.dev    # Dev container
│   └── server.js         # Entry point
├── docker-compose.yml     # Production compose
├── docker-compose.dev.yml # Development compose
└── package.json          # Root package (scripts)
```

---

## Additional Notes

- **Database Provider**: Set `REPORTING_PROVIDER=mysql` or `REPORTING_PROVIDER=mongo` in environment
- **OAuth**: Configure your own OAuth credentials for Google/Microsoft login
- **API Documentation**: Swagger UI available at `/api/docs`
- **Seed Data**: Automatically seeded in Docker, manually run `npm run seed` for native

---

**Last Updated**: February 3, 2026
