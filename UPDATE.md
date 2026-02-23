# Condo Management Portal - Launch Instructions

## Application Overview

This is a demo condo management portal built with a MERN-style application stack and a separate MySQL reporting database.

**Key Features:**

- Role-based access (Manager and Board member views)
- Report generation and PDF export
- MySQL/MongoDB dual-database support for reporting
- OAuth authentication (Google, Microsoft Azure AD)
- RESTful API with Swagger documentation

**Technology Stack:**

- **Frontend**: React 18 + Vite + TailwindCSS (Port 3000)
- **Backend**: Node.js + Express (Port 5000)
- **Databases**:
  - MongoDB (default port 27017)
  - MySQL 8.4 (native install usually 3306; Docker host mapping uses 3307)
- **Authentication**: JWT + Passport.js + OAuth

---

## Choose a Launch Mode

- Use **(A) Native Launch on Windows 11** if you want to run Node, MongoDB, and MySQL directly on your machine.
- Use **(B) Docker Container Launch (Development)** if you want the full stack in containers with hot reload.

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
   - Download from: <https://www.mongodb.com/try/download/community>
   - Ensure MongoDB service is running:

     ```powershell
     net start MongoDB
     ```

   - Verify connection:

     ```powershell
     mongosh
     ```

3. **MySQL** (v8.4 or compatible)
   - Download from: <https://dev.mysql.com/downloads/mysql/>
   - Install and configure with:
     - Root password: `root_password` (or your own)
     - Database: `condo_mgmt`
     - User: `condo_app`
     - Password: `condo_app_pw`
   - Initialize the reporting database:

     ```powershell
     mysql -u root -p < server\db\mysql\init\01_schema.sql
     mysql -u root -p < server\db\mysql\init\02_sample_data.sql
     mysql -u root -p < server\db\mysql\init\03_views.sql
     mysql -u root -p < server\db\mysql\init\04_role_views.sql
     ```

### Setup Steps

1. **Install Dependencies**

   ```powershell
   # Install root, server, and client dependencies
   npm run install:all
   ```

2. **Configure Environment Variables**

   Create `server\.env` (you can copy from `server\.env.example` or your Docker env file and adjust values):

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/condo_app
   JWT_SECRET=development_secret_key_for_testing_purposes_only
   CLIENT_URL=http://localhost:3000

   REPORTING_PROVIDER=mysql

   # MySQL Database (local native install)
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=condo_mgmt
   MYSQL_USER=condo_app
   MYSQL_PASSWORD=condo_app_pw

   # OAuth credentials (configure your own if needed)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=/api/auth/google/callback

   MICROSOFT_CLIENT_ID=your_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
   MICROSOFT_CALLBACK_URL=/api/auth/microsoft/callback
   MICROSOFT_TENANT=common
   ```

3. **Seed MongoDB Demo Data (Optional)**

   From the repo root:

   ```powershell
   npm --prefix server run seed
   ```

### Launch the Application

#### Option 1: Run Server and Client Together (Recommended)

```powershell
npm run dev
```

This runs both backend and frontend using `concurrently` with hot reload.

#### Option 2: Run Server and Client Separately

**Terminal 1 - Backend Server:**

```powershell
npm run dev:server
```

**Terminal 2 - Frontend Client:**

```powershell
npm run dev:client
```

### Stopping the Application

- Press `Ctrl + C` in each terminal window

---

## (B) Docker Container Launch (Development)

This method runs the full development stack in Docker containers with hot-reload support.

### Prerequisites

1. **Docker Desktop** for Windows
   - Download from: <https://www.docker.com/products/docker-desktop/>
   - Ensure Docker is running (check system tray icon)
   - Verify installation:

     ```powershell
     docker --version
     docker compose version
     ```

### Launch Steps

1. **Navigate to the project directory**

   ```powershell
   cd <path-to-your-project>\condo-app
   ```

2. **Start the development environment**

   ```powershell
   docker compose -f docker-compose.dev.yml up --build -d
   ```

   **What this does:**
   - Builds and starts 4 containers: `client`, `api`, `mongo`, `mysql`
   - Mounts local source code for hot reload
   - Seeds MongoDB demo data on first start (via seed-once behavior)
   - Exposes ports for local access

3. **Wait for startup**
   - First run may take several minutes (image pulls + builds)
   - Check logs for readiness messages from API and Vite

### Development Features

- **Hot Reload**: Changes in `client/` and `server/` automatically reload
- **Volume Mounting**: Local files are mounted, so edits persist
- **Database Persistence**: Data persists across container restarts in Docker volumes

### Useful Docker Commands

**View running containers:**

```powershell
docker compose -f docker-compose.dev.yml ps
```

**View logs:**

```powershell
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific services
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f client
```

**Stop the application:**

```powershell
# Graceful stop (keeps data)
docker compose -f docker-compose.dev.yml down
```

**Complete reset (remove all Docker data for this stack):**

```powershell
docker compose -f docker-compose.dev.yml down -v
```

This removes volumes, including database data.

**Rebuild after major changes:**

```powershell
docker compose -f docker-compose.dev.yml up --build --force-recreate
```

**Access container shells:**

```powershell
# API server
docker compose -f docker-compose.dev.yml exec api sh

# Client
docker compose -f docker-compose.dev.yml exec client sh

# MySQL
docker compose -f docker-compose.dev.yml exec mysql mysql -u condo_app -pcondo_app_pw condo_mgmt
```

### Production-Style Docker Setup (Demo)

To run the production-style compose setup from the repo root:

```powershell
docker compose up --build
```

This uses `docker-compose.yml`, which builds the client and serves the built frontend from the API container while still running separate MongoDB/MySQL services.

---

## Common Access URLs

### Native Launch

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:5000/api>
- **Swagger API Docs**: <http://localhost:5000/api/docs>

### Docker Development Launch

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:5000/api>
- **Swagger API Docs**: <http://localhost:5000/api/docs>
- **MongoDB**: `mongodb://localhost:27017`
- **MySQL**: `localhost:3307` (user: `condo_app`, password: `condo_app_pw`)

## Demo Credentials

- **Manager Account**: `manager1` / `Password123!`
- **Board Member Account**: `board1` / `Password123!`

---

## Troubleshooting

### Native Launch Issues

**MongoDB connection failed:**

```powershell
# Check if MongoDB is running
net start MongoDB

# Or start MongoDB manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**MySQL connection failed:**

```powershell
# Check if MySQL is running
Get-Service -Name MySQL*

# Start MySQL service
net start MySQL80
```

**Port already in use:**

```powershell
# Find what's using port 3000 or 5000
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <process_id> /F
```

### Docker Issues

**Docker Desktop not running:**

- Open Docker Desktop and wait for it to finish starting
- Confirm the tray icon indicates Docker is running

**Port conflicts:**

- Ports `3000`, `5000`, `27017`, and `3307` must be available
- Change port mappings in `docker-compose.dev.yml` if needed

**Build failures:**

```powershell
# Clean Docker cache and rebuild (destructive to unused images/cache)
docker system prune -a
docker compose -f docker-compose.dev.yml build --no-cache
```

**Volume permission or stale state issues:**

```powershell
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

**Slow performance on Windows:**

- Ensure Docker Desktop is using the WSL 2 backend
- Consider storing the project in the WSL filesystem for better I/O performance

---

## Project Structure

```text
app/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utilities (PDF generation)
│   ├── Dockerfile.dev      # Dev container
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database & passport config
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   ├── db/mysql/init/      # MySQL schema, sample data, and reporting views
│   ├── Dockerfile.dev      # Dev container
│   └── server.js           # Entry point
├── docker-compose.yml      # Production-style compose
├── docker-compose.dev.yml  # Development compose (hot reload)
└── package.json            # Root package scripts
```

---

## Additional Notes

- **Reporting Provider**: `REPORTING_PROVIDER=mysql` is the working/default setup.
- **Mongo Reporting Provider**: `REPORTING_PROVIDER=mongo` exists as a code path, but reporting queries are not fully implemented yet.
- **OAuth**: Configure your own Google/Microsoft OAuth credentials if using social login.
- **API Documentation**: Swagger UI is available at `/api/docs`.
- **Seed Data**: Docker dev uses seed-once behavior; native launch can use `npm --prefix server run seed`.

---

**Last Updated**: February 23, 2026
