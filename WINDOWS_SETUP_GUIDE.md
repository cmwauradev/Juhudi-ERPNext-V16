# ERPNext Setup on Windows

## ⚠️ Important Note

**Frappe Bench is NOT officially supported on Windows.** ERPNext is designed for Linux.

You have 3 options:

---

## Option 1: WSL2 (Windows Subsystem for Linux) - RECOMMENDED

Run ERPNext in a Linux environment within Windows.

### Step 1: Enable WSL2

```powershell
# Run PowerShell as Administrator
wsl --install

# Restart your computer
# After restart, Ubuntu will install automatically
```

### Step 2: Install in WSL Ubuntu

```bash
# Open Ubuntu from Start Menu
# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y python3-dev python3-pip python3-venv
sudo apt install -y redis-server mariadb-server nginx git curl

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
sudo npm install -g yarn

# Install Frappe Bench
sudo pip3 install frappe-bench

# Initialize bench
bench init frappe-bench --frappe-branch version-14
cd frappe-bench

# Get ERPNext
bench get-app erpnext --branch version-14
bench get-app hrms

# Create site
bench new-site juhudi.local

# Install apps
bench --site juhudi.local install-app erpnext
bench --site juhudi.local install-app hrms

# Start
bench start
```

### Step 3: Install Juhudi Integration

```bash
# In WSL Ubuntu
cd ~/frappe-bench
git clone https://github.com/cmwauradev/Juhudi-ERPNext-V16.git integration
cd integration
npm install
cp .env.example .env
nano .env  # Configure your credentials
```

---

## Option 2: Docker Desktop - EASIEST

Use Docker to run ERPNext on Windows.

### Step 1: Install Docker Desktop

1. Download from: https://www.docker.com/products/docker-desktop/
2. Install and restart
3. Enable WSL2 backend in settings

### Step 2: Run ERPNext with Docker

```powershell
# Create directory
mkdir C:\erpnext-docker
cd C:\erpnext-docker

# Create docker-compose.yml
```

Save this as `docker-compose.yml`:

```yaml
version: "3"

services:
  backend:
    image: frappe/erpnext:v14
    deploy:
      restart_policy:
        condition: on-failure
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  configurator:
    image: frappe/erpnext:v14
    deploy:
      restart_policy:
        condition: none
    entrypoint:
      - bash
      - -c
    command:
      - >
        ls -1 apps > sites/apps.txt;
        bench set-config -g db_host mariadb;
        bench set-config -gp db_port 3306;
        bench set-config -g redis_cache redis://redis-cache:6379;
        bench set-config -g redis_queue redis://redis-queue:6379;
        bench set-config -g redis_socketio redis://redis-socketio:6379;
        bench set-config -gp socketio_port 9000;
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  create-site:
    image: frappe/erpnext:v14
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
        wait-for-it -t 120 redis-socketio:6379;
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
        bench new-site juhudi.local --no-mariadb-socket --admin-password=admin --db-root-password=admin --install-app erpnext --set-default;

  frontend:
    image: frappe/erpnext:v14
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
    image: frappe/erpnext:v14
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
    image: frappe/erpnext:v14
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
    image: frappe/erpnext:v14
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
    image: frappe/erpnext:v14
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

  redis-socketio:
    image: redis:6.2-alpine
    deploy:
      restart_policy:
        condition: on-failure
    volumes:
      - redis-socketio-data:/data

volumes:
  mariadb-data:
  redis-cache-data:
  redis-queue-data:
  redis-socketio-data:
  sites:
  logs:
```

### Step 3: Start ERPNext

```powershell
# In PowerShell
cd C:\erpnext-docker
docker-compose up -d

# Wait 2-3 minutes for initialization
# Access ERPNext at: http://localhost:8080
# Login: Administrator / admin
```

### Step 4: Run Juhudi Integration

```powershell
# In a separate PowerShell window
cd C:\Users\Administrator\Documents\ERP\Juhudi-ERPNext-V16-main
npm install
cp .env.example .env
# Edit .env:
# ERPNEXT_URL=http://localhost:8080
notepad .env

# Run sync
node mssql_sync_all_fields.js
```

---

## Option 3: Use Your Integration Scripts Only (SIMPLEST)

Just run the MSSQL sync scripts on Windows - connect to ERPNext running elsewhere.

### Step 1: Install Node.js on Windows

1. Download from: https://nodejs.org/
2. Install (includes npm)
3. Restart PowerShell

### Step 2: Setup Integration

```powershell
# In PowerShell
cd C:\Users\Administrator\Documents\ERP\Juhudi-ERPNext-V16-main
npm install

# Configure
cp .env.example .env
notepad .env
# Set ERPNEXT_URL to your ERPNext instance (can be on another server)
```

### Step 3: Run

```powershell
# Test connections
node test_connection.js
node test_mssql_connection.js

# Run sync
node mssql_sync_all_fields.js
```

---

## Quick Fix for Your Current Situation

### Install Python and Node.js First

```powershell
# 1. Install Python 3.11
# Download from: https://www.python.org/downloads/
# During install, CHECK "Add Python to PATH"

# 2. Install Node.js 18
# Download from: https://nodejs.org/
# During install, CHECK "Add to PATH"

# 3. Restart PowerShell

# 4. Verify installation
python --version
node --version
npm --version
pip --version
```

### Then Choose Your Option

**Recommended: Option 2 (Docker)** - Easiest for Windows

---

## Comparison

| Option | Difficulty | Setup Time | Best For |
|--------|------------|------------|----------|
| WSL2 | Medium | 30 min | Full development |
| Docker | Easy | 10 min | **Recommended** |
| Scripts Only | Very Easy | 5 min | Just MSSQL sync |

---

## What I Recommend for You

Based on your situation:

1. **Install Docker Desktop** (10 minutes)
2. **Run ERPNext in Docker** (copy docker-compose.yml above)
3. **Run integration scripts on Windows** (already downloaded)

This gives you:
- ✅ ERPNext running in container
- ✅ MSSQL sync running on Windows
- ✅ Easy to manage
- ✅ No Linux knowledge needed

---

## Next Steps

Tell me which option you prefer, and I'll give you exact commands to run!

1. WSL2 (Full Linux experience)
2. Docker (Easiest, recommended)
3. Scripts only (simplest, connect to existing ERPNext)
