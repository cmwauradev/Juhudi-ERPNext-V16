# Complete ERPNext Setup on Windows - Step by Step

## 🎯 Goal
Install complete ERPNext + MSSQL Integration on Windows machine

---

## Part 1: Install Docker Desktop (10 minutes)

### Step 1: Download Docker Desktop

1. Go to: https://www.docker.com/products/docker-desktop/
2. Click "Download for Windows"
3. Run the installer
4. **Important:** During installation, ensure "Use WSL 2" is checked
5. Restart your computer when prompted

### Step 2: Verify Installation

```powershell
# Open PowerShell and run:
docker --version
docker-compose --version
```

You should see versions like:
- Docker version 24.x.x
- Docker Compose version 2.x.x

---

## Part 2: Create ERPNext Docker Setup (5 minutes)

### Step 1: Create Project Directory

```powershell
# In PowerShell
mkdir C:\ERPNext
cd C:\ERPNext
```

### Step 2: Create docker-compose.yml

```powershell
# Create the file
notepad docker-compose.yml
```

Copy and paste this EXACT content into the file:

```yaml
version: "3"

services:
  backend:
    image: frappe/erpnext:v14.51.0
    deploy:
      restart_policy:
        condition: on-failure
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  configurator:
    image: frappe/erpnext:v14.51.0
    deploy:
      restart_policy:
        condition: none
    entrypoint:
      - bash
      - -c
    command:
      - >
        ls -1 apps > sites/apps.txt;
        bench set-config -g db_host $$DB_HOST;
        bench set-config -g redis_cache "redis://$$REDIS_CACHE";
        bench set-config -g redis_queue "redis://$$REDIS_QUEUE";
        bench set-config -g redis_socketio "redis://$$REDIS_QUEUE";
    environment:
      DB_HOST: mariadb
      REDIS_CACHE: redis-cache:6379
      REDIS_QUEUE: redis-queue:6379
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  create-site:
    image: frappe/erpnext:v14.51.0
    deploy:
      restart_policy:
        condition: none
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs
    entrypoint:
      - bash
      - -c
    command:
      - >
        wait-for-it -t 120 mariadb:3306;
        wait-for-it -t 120 redis-cache:6379;
        wait-for-it -t 120 redis-queue:6379;
        export start=`date +%s`;
        until [[ -n `grep -hs ^ sites/common_site_config.json | jq -r ".db_host // empty"` ]] && \
          [[ -n `grep -hs ^ sites/common_site_config.json | jq -r ".redis_cache // empty"` ]] && \
          [[ -n `grep -hs ^ sites/common_site_config.json | jq -r ".redis_queue // empty"` ]];
        do
          echo "Waiting for sites/common_site_config.json to be created";
          sleep 5;
          if (( `date +%s`-start > 120 )); then
            echo "could not find sites/common_site_config.json with required keys";
            exit 1
          fi
        done;
        echo "sites/common_site_config.json found";
        bench new-site juhudi.local --no-mariadb-socket --admin-password=admin123 --db-root-password=admin --install-app erpnext --install-app hrms --set-default;

  frontend:
    image: frappe/erpnext:v14.51.0
    deploy:
      restart_policy:
        condition: on-failure
    command:
      - nginx-entrypoint.sh
    environment:
      BACKEND: backend:8000
      FRAPPE_SITE_NAME_HEADER: juhudi.local
      SOCKETIO: websocket:9000
      UPSTREAM_REAL_IP_ADDRESS: 127.0.0.1
      UPSTREAM_REAL_IP_HEADER: X-Forwarded-For
      UPSTREAM_REAL_IP_RECURSIVE: "off"
      PROXY_READ_TIMEOUT: 120
      CLIENT_MAX_BODY_SIZE: 50m
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs
    ports:
      - "8080:8080"

  websocket:
    image: frappe/erpnext:v14.51.0
    deploy:
      restart_policy:
        condition: on-failure
    command:
      - node
      - /home/frappe/frappe-bench/apps/frappe/socketio.js
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  queue-short:
    image: frappe/erpnext:v14.51.0
    deploy:
      restart_policy:
        condition: on-failure
    command:
      - bench
      - worker
      - --queue
      - short,default
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  queue-long:
    image: frappe/erpnext:v14.51.0
    deploy:
      restart_policy:
        condition: on-failure
    command:
      - bench
      - worker
      - --queue
      - long,default,short
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  scheduler:
    image: frappe/erpnext:v14.51.0
    deploy:
      restart_policy:
        condition: on-failure
    command:
      - bench
      - schedule
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  mariadb:
    image: mariadb:10.6
    healthcheck:
      test: mysqladmin ping -h localhost --password=admin
      interval: 1s
      retries: 15
    deploy:
      restart_policy:
        condition: on-failure
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --skip-character-set-client-handshake
      - --skip-innodb-read-only-compressed
    environment:
      MYSQL_ROOT_PASSWORD: admin
    volumes:
      - mariadb-data:/var/lib/mysql
    ports:
      - "3307:3306"

  redis-cache:
    image: redis:6.2-alpine
    deploy:
      restart_policy:
        condition: on-failure
    volumes:
      - redis-cache-data:/data

  redis-queue:
    image: redis:6.2-alpine
    deploy:
      restart_policy:
        condition: on-failure
    volumes:
      - redis-queue-data:/data

volumes:
  mariadb-data:
  redis-cache-data:
  redis-queue-data:
  sites:
  logs:
```

**Save and close Notepad**

### Step 3: Start ERPNext

```powershell
# In PowerShell, in C:\ERPNext directory
docker-compose up -d
```

This will:
- Download ERPNext images (~2GB, takes 5-10 minutes first time)
- Start MariaDB database
- Start Redis
- Create ERPNext site
- Install ERPNext and HRMS apps

### Step 4: Monitor Installation

```powershell
# Watch the logs
docker-compose logs -f create-site
```

Wait until you see: "Site juhudi.local created successfully"

Press `Ctrl+C` to stop watching logs.

### Step 5: Verify ERPNext is Running

```powershell
# Check all containers are running
docker-compose ps
```

All services should show "Up" status.

### Step 6: Access ERPNext

1. Open browser: http://localhost:8080
2. Login with:
   - **Username:** Administrator
   - **Password:** admin123

🎉 **ERPNext is now running!**

---

## Part 3: Install Node.js for Integration (5 minutes)

### Step 1: Download Node.js

1. Go to: https://nodejs.org/
2. Download "LTS" version (18.x or 20.x)
3. Run installer
4. **Important:** Check "Add to PATH" during installation
5. Click through to complete installation

### Step 2: Verify Installation

```powershell
# Close and reopen PowerShell
node --version
npm --version
```

You should see versions like:
- v18.x.x or v20.x.x
- 9.x.x or 10.x.x

---

## Part 4: Setup MSSQL Integration (10 minutes)

### Step 1: Get Integration Scripts

```powershell
# Navigate to your integration folder
cd C:\Users\Administrator\Documents\ERP\Juhudi-ERPNext-V16-main

# Install dependencies
npm install
```

### Step 2: Generate API Keys in ERPNext

1. Open http://localhost:8080
2. Login as Administrator / admin123
3. Go to User (click profile icon → My Settings)
4. Scroll to "API Access" section
5. Click "Generate Keys"
6. **Copy both API Key and API Secret** (you'll need these next)

### Step 3: Configure Environment

```powershell
# Copy example environment file
copy .env.example .env

# Edit configuration
notepad .env
```

Update the .env file with:

```bash
# ERPNext Configuration
ERPNEXT_URL=http://localhost:8080
ERPNEXT_API_KEY=paste_your_api_key_here
ERPNEXT_API_SECRET=paste_your_api_secret_here
ERPNEXT_COMPANY=Juhudi Smart Solutions

# MSSQL Configuration
MSSQL_SERVER=85.190.241.118
MSSQL_PORT=1433
MSSQL_DATABASE=TEST_ERP
MSSQL_USER=sa
MSSQL_PASSWORD=P~w2yvkm1UIhn2nm
MSSQL_ENCRYPT=false
MSSQL_TRUST_SERVER_CERTIFICATE=true
```

**Save and close Notepad**

### Step 4: Test Connections

```powershell
# Test ERPNext connection
node test_connection.js

# Test MSSQL connection
node test_mssql_connection.js
```

Both should show "✅ Connected successfully"

### Step 5: Run First Sync

```powershell
# Sync all customers and invoices
node mssql_sync_all_fields.js
```

This will sync:
- 860 customers from MSSQL → ERPNext
- 632 invoices from MSSQL → ERPNext

Takes about 1-2 minutes.

### Step 6: Setup Automatic Sync (Optional)

For automatic sync every 5 minutes:

```powershell
# Install PM2 globally
npm install -g pm2-windows-service pm2

# Start sync service
pm2 start mssql_sync_all_fields.js --name "mssql-sync"

# Save configuration
pm2 save

# Setup to start on Windows boot
pm2-service-install
# When prompted, accept defaults
```

---

## Part 5: Verify Everything Works

### Step 1: Check ERPNext

1. Go to http://localhost:8080
2. Navigate to "Customer" list
3. You should see 860+ customers
4. Navigate to "Sales Invoice" list
5. You should see 632+ invoices

### Step 2: Check Sync Logs

```powershell
# If using PM2
pm2 logs mssql-sync

# Or check the console output
```

---

## Part 6: Daily Management Commands

### Start/Stop ERPNext

```powershell
# Stop ERPNext
cd C:\ERPNext
docker-compose stop

# Start ERPNext
docker-compose start

# Restart ERPNext
docker-compose restart

# View logs
docker-compose logs -f
```

### Manage Sync Service

```powershell
# Stop sync
pm2 stop mssql-sync

# Start sync
pm2 start mssql-sync

# Restart sync
pm2 restart mssql-sync

# View logs
pm2 logs mssql-sync

# Monitor
pm2 monit
```

### Backup ERPNext Data

```powershell
# Connect to backend container
docker exec -it erpnext-backend-1 bash

# Inside container, create backup
bench --site juhudi.local backup --with-files

# Exit container
exit

# Backups are stored in Docker volume
# To access: Docker Desktop → Volumes → sites → sites/juhudi.local/private/backups/
```

---

## Troubleshooting

### Issue: Docker won't start

**Solution:**
1. Enable Hyper-V in Windows Features
2. Enable WSL 2
3. Restart computer

### Issue: Port 8080 already in use

**Solution:**
```powershell
# Edit docker-compose.yml
# Change line: "8080:8080" to "8081:8080"
# Access at http://localhost:8081
```

### Issue: ERPNext site not created

**Solution:**
```powershell
# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Issue: MSSQL connection fails

**Solution:**
1. Check Windows Firewall allows outbound on port 1433
2. Verify MSSQL server is accessible from Windows
3. Try: `telnet 85.190.241.118 1433`

### Issue: npm install fails

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

---

## System Requirements

### Minimum:
- Windows 10 Pro/Enterprise (64-bit) or Windows 11
- 8 GB RAM
- 50 GB free disk space
- Internet connection

### Recommended:
- Windows 10 Pro/Enterprise or Windows 11
- 16 GB RAM
- 100 GB free disk space
- SSD storage
- Stable internet

---

## URLs and Ports

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| ERPNext Web | http://localhost:8080 | Administrator / admin123 |
| MariaDB | localhost:3307 | root / admin |
| Redis Cache | localhost:6379 | - |

---

## File Locations

| Item | Location |
|------|----------|
| Docker Compose | C:\ERPNext\docker-compose.yml |
| Integration Scripts | C:\Users\Administrator\Documents\ERP\Juhudi-ERPNext-V16-main |
| ERPNext Data | Docker Volume: sites |
| Database | Docker Volume: mariadb-data |
| Logs | Docker Volume: logs |

---

## What You'll Have After Setup

✅ **ERPNext running in Docker**
  - Web: http://localhost:8080
  - Database: MariaDB
  - Apps: ERPNext + HRMS

✅ **MSSQL Integration**
  - 860 customers synced
  - 632 invoices synced
  - Auto-sync every 5 minutes

✅ **All running on Windows**
  - No Linux dual-boot needed
  - No WSL complexity
  - Easy to manage

---

## Next Steps After Setup

1. **Create Company:** Setup → Company
2. **Configure Settings:** Setup → System Settings
3. **Create Users:** User → Add users
4. **Explore Features:** Navigate through ERPNext modules
5. **Sync More Data:** Add Connections, Bills, Payments

---

## Getting Help

### Check Logs
```powershell
# ERPNext logs
docker-compose logs -f

# Sync logs
pm2 logs mssql-sync

# Specific service
docker-compose logs -f backend
```

### Restart Everything
```powershell
# Restart ERPNext
cd C:\ERPNext
docker-compose restart

# Restart sync
pm2 restart mssql-sync
```

---

## Complete Setup Checklist

- [ ] Docker Desktop installed
- [ ] docker-compose.yml created
- [ ] ERPNext containers running
- [ ] ERPNext accessible at http://localhost:8080
- [ ] Can login with Administrator / admin123
- [ ] Node.js installed
- [ ] Integration scripts downloaded
- [ ] npm install completed
- [ ] .env file configured
- [ ] API keys generated in ERPNext
- [ ] test_connection.js passes
- [ ] test_mssql_connection.js passes
- [ ] First sync completed
- [ ] 860+ customers visible in ERPNext
- [ ] 632+ invoices visible in ERPNext
- [ ] PM2 service running (optional)

---

**Total Setup Time: ~30-45 minutes**

**You'll have a complete, production-ready ERPNext system running on Windows!**
