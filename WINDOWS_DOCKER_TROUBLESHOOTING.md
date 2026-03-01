# Windows Docker Troubleshooting Guide

## Issue: "Docker Desktop is unable to start"

This is a common Windows issue. Here are the solutions:

---

## Solution 1: Start Docker Desktop Manually

### Step 1: Open Docker Desktop
1. Press `Windows Key`
2. Type "Docker Desktop"
3. Click on Docker Desktop app
4. Wait for it to start (you'll see whale icon in system tray)
5. Wait until the whale icon stops animating

### Step 2: Verify Docker is Running
```powershell
docker ps
```

Should show "CONTAINER ID   IMAGE..." (even if empty)

### Step 3: Try Again
```powershell
cd C:\ERP
docker-compose up -d
```

---

## Solution 2: Enable Required Windows Features

### Step 1: Enable Hyper-V (Windows Pro/Enterprise only)

```powershell
# Run PowerShell as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

### Step 2: Enable WSL 2

```powershell
# Run PowerShell as Administrator
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

### Step 3: Install WSL 2

```powershell
# Run PowerShell as Administrator
wsl --install
```

### Step 4: Restart Computer

---

## Solution 3: Reinstall Docker Desktop

If Docker still won't start:

1. Uninstall Docker Desktop
   - Settings → Apps → Docker Desktop → Uninstall

2. Delete Docker data
   - Delete: `C:\Users\Administrator\AppData\Local\Docker`
   - Delete: `C:\Users\Administrator\AppData\Roaming\Docker`

3. Reinstall Docker Desktop
   - Download fresh: https://www.docker.com/products/docker-desktop/
   - Install with default settings
   - Restart computer

---

## Solution 4: Fix YAML Error

Your docker-compose.yml had a YAML syntax error. Here's the FIXED version:

### Create new docker-compose.yml

```powershell
cd C:\ERP
del docker-compose.yml
notepad docker-compose.yml
```

Copy THIS EXACT content (no extra spaces):

```yaml
services:
  backend:
    image: frappe/erpnext:v14
    restart: on-failure
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  configurator:
    image: frappe/erpnext:v14
    restart: "no"
    entrypoint:
      - bash
      - -c
    command:
      - >
        ls -1 apps > sites/apps.txt;
        bench set-config -g db_host mariadb;
        bench set-config -g redis_cache "redis://redis-cache:6379";
        bench set-config -g redis_queue "redis://redis-queue:6379";
        bench set-config -g redis_socketio "redis://redis-queue:6379";
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  create-site:
    image: frappe/erpnext:v14
    restart: "no"
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
          echo "Waiting for configuration";
          sleep 5;
          if (( `date +%s`-start > 120 )); then
            echo "Timeout waiting for config";
            exit 1
          fi
        done;
        echo "Configuration found";
        bench new-site juhudi.local --no-mariadb-socket --admin-password=admin123 --db-root-password=admin --install-app erpnext --set-default;

  frontend:
    image: frappe/erpnext:v14
    restart: on-failure
    command:
      - nginx-entrypoint.sh
    environment:
      BACKEND: backend:8000
      FRAPPE_SITE_NAME_HEADER: juhudi.local
      SOCKETIO: websocket:9000
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs
    ports:
      - "8080:8080"

  websocket:
    image: frappe/erpnext:v14
    restart: on-failure
    command:
      - node
      - /home/frappe/frappe-bench/apps/frappe/socketio.js
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

  queue-short:
    image: frappe/erpnext:v14
    restart: on-failure
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
    restart: on-failure
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
    restart: on-failure
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
    restart: on-failure
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
    restart: on-failure
    volumes:
      - redis-cache-data:/data

  redis-queue:
    image: redis:6.2-alpine
    restart: on-failure
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

---

## Quick Fix Steps (Try This First)

```powershell
# 1. Start Docker Desktop manually
# Windows Key → Search "Docker Desktop" → Click it
# Wait for whale icon to appear in system tray

# 2. Verify Docker is running
docker ps

# 3. If error, restart Docker Desktop
# Right-click whale icon → Restart Docker Desktop

# 4. Try again
cd C:\ERP
docker-compose up -d
```

---

## Verification Checklist

Before running docker-compose:

- [ ] Docker Desktop is running (whale icon in system tray)
- [ ] Whale icon is NOT animating (means it's ready)
- [ ] `docker ps` works without error
- [ ] No YAML syntax errors in docker-compose.yml
- [ ] Running PowerShell in C:\ERP directory

---

## Common Docker Desktop Issues on Windows

### Issue: "Hardware virtualization is not enabled"

**Solution:**
1. Restart computer
2. Enter BIOS (usually F2, F10, or Del during boot)
3. Enable VT-x (Intel) or AMD-V (AMD)
4. Save and restart

### Issue: "WSL 2 installation is incomplete"

**Solution:**
```powershell
# Run as Administrator
wsl --install
wsl --update
```
Restart computer.

### Issue: "Windows Home edition detected"

**Solution:**
- Docker Desktop requires Windows 10/11 Pro, Enterprise, or Education
- OR use Docker with WSL 2 backend

---

## Alternative: Use Docker with WSL 2 Directly

If Docker Desktop keeps failing:

### Step 1: Install WSL 2
```powershell
# Run as Administrator
wsl --install
# Restart computer
```

### Step 2: Install Docker in WSL Ubuntu
```bash
# Open Ubuntu from Start Menu
sudo apt update
sudo apt install docker.io docker-compose -y
sudo service docker start
```

### Step 3: Run docker-compose in WSL
```bash
cd /mnt/c/ERP
docker-compose up -d
```

Access ERPNext at: http://localhost:8080

---

## Status Check Commands

```powershell
# Check Docker service
docker version

# Check Docker is responsive
docker ps

# Check containers
docker-compose ps

# View logs
docker-compose logs

# Restart everything
docker-compose restart
```

---

## If All Else Fails

**Simplest Option:**
Use a Linux VM or cloud server:

1. Install VirtualBox
2. Create Ubuntu VM
3. Install ERPNext in Ubuntu
4. Run integration scripts on Windows, connect to Ubuntu ERPNext

OR

Use cloud ERPNext (DigitalOcean, AWS, Azure) and run integration scripts on Windows.

