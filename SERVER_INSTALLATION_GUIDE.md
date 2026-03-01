# ERPNext Server Installation Guide

You have server access! Let's install ERPNext step by step.

---

## Step 1: Update System (2 minutes)

```bash
# Update package lists
sudo apt update

# Upgrade packages
sudo apt upgrade -y
```

---

## Step 2: Install Prerequisites (5 minutes)

```bash
# Install required packages
sudo apt install -y \
    python3-dev \
    python3-pip \
    python3-venv \
    redis-server \
    mariadb-server \
    nginx \
    git \
    curl \
    supervisor \
    software-properties-common
```

---

## Step 3: Install Node.js 18 (2 minutes)

```bash
# Add Node.js repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Install Yarn
sudo npm install -g yarn

# Verify installation
node --version
npm --version
```

---

## Step 4: Configure MariaDB (3 minutes)

```bash
# Secure MariaDB installation
sudo mysql_secure_installation
```

**Answer the prompts:**
- Enter current password for root: `(press Enter - no password)`
- Switch to unix_socket authentication: `n`
- Change root password: `Y`
- New password: `admin` (or your choice)
- Re-enter password: `admin`
- Remove anonymous users: `Y`
- Disallow root login remotely: `Y`
- Remove test database: `Y`
- Reload privilege tables: `Y`

**Configure MariaDB for ERPNext:**

```bash
# Edit MariaDB config
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Add these lines under `[mysqld]` section:

```ini
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
```

Save: `Ctrl+O`, Enter, `Ctrl+X`

**Restart MariaDB:**

```bash
sudo systemctl restart mariadb
sudo systemctl enable mariadb
```

---

## Step 5: Create Frappe User (1 minute)

```bash
# Create frappe user
sudo adduser frappe --gecos "First,Last,RoomNumber,WorkPhone,HomePhone" --disabled-password

# Set password
sudo passwd frappe
# Enter: frappe123 (or your choice)

# Add to sudo group
sudo usermod -aG sudo frappe
```

---

## Step 6: Install Frappe Bench (5 minutes)

```bash
# Switch to frappe user
sudo su - frappe

# Install frappe-bench
sudo pip3 install frappe-bench

# Initialize bench
bench init frappe-bench --frappe-branch version-14

# Change to bench directory
cd frappe-bench
```

---

## Step 7: Get ERPNext and HRMS (10 minutes)

```bash
# Still as frappe user, in frappe-bench directory

# Get ERPNext
bench get-app erpnext --branch version-14

# Get HRMS
bench get-app hrms

# Get your integration app (optional)
bench get-app https://github.com/cmwauradev/Juhudi-ERPNext-V16.git
```

---

## Step 8: Create Site (5 minutes)

```bash
# Create new site
bench new-site juhudi.local \
  --admin-password admin123 \
  --mariadb-root-password admin

# Install ERPNext
bench --site juhudi.local install-app erpnext

# Install HRMS
bench --site juhudi.local install-app hrms

# Set as default site
bench use juhudi.local
```

---

## Step 9: Setup Production (10 minutes)

```bash
# Exit frappe user
exit

# Setup production as root/sudo user
sudo bench setup production frappe

# Enable scheduler
sudo bench --site juhudi.local enable-scheduler

# Setup HTTPS (optional, if you have domain)
# sudo bench setup lets-encrypt juhudi.yourdomain.com
```

---

## Step 10: Configure Firewall (2 minutes)

```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Allow ERPNext port
sudo ufw allow 8000/tcp

# Enable firewall
sudo ufw enable
```

---

## Step 11: Start ERPNext (1 minute)

```bash
# Restart services
sudo supervisorctl restart all

# Check status
sudo supervisorctl status all
```

All services should show `RUNNING`.

---

## Step 12: Access ERPNext

1. Get your server IP:
```bash
hostname -I
```

2. In browser, go to: `http://YOUR_SERVER_IP`

3. Login:
   - Username: `Administrator`
   - Password: `admin123`

---

## Step 13: Generate API Keys (3 minutes)

1. Login to ERPNext
2. Go to: **User** (search in awesome bar)
3. Click **Administrator** (or create new API user)
4. Scroll to **API Access** section
5. Click **Generate Keys**
6. **COPY** both API Key and API Secret

---

## Step 14: Setup Windows Integration

**On your Windows machine:**

```powershell
# Install Node.js if not done
# Download from: https://nodejs.org/

# Navigate to integration folder
cd C:\Users\Administrator\Documents\ERP\Juhudi-ERPNext-V16-main

# Install dependencies
npm install

# Configure .env
copy .env.example .env
notepad .env
```

**Update .env:**

```bash
# ERPNext Server Configuration
ERPNEXT_URL=http://YOUR_SERVER_IP
ERPNEXT_API_KEY=paste_api_key_here
ERPNEXT_API_SECRET=paste_api_secret_here
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

**Test and Sync:**

```powershell
# Test connections
node test_connection.js
node test_mssql_connection.js

# Run first sync
node mssql_sync_all_fields.js

# Setup auto-sync
npm install -g pm2
pm2 start mssql_sync_all_fields.js --name "mssql-sync"
pm2 save
```

---

## Troubleshooting

### Issue: Can't access ERPNext web

```bash
# Check if services are running
sudo supervisorctl status all

# Restart all services
sudo supervisorctl restart all

# Check nginx
sudo systemctl status nginx
sudo systemctl restart nginx

# Check logs
tail -f /home/frappe/frappe-bench/logs/web.log
```

### Issue: Site not found

```bash
# List sites
bench --site juhudi.local list-apps

# Set default site
bench use juhudi.local

# Restart
sudo supervisorctl restart all
```

### Issue: Database connection error

```bash
# Check MariaDB is running
sudo systemctl status mariadb

# Restart MariaDB
sudo systemctl restart mariadb

# Check bench config
cat /home/frappe/frappe-bench/sites/juhudi.local/site_config.json
```

---

## Useful Commands

```bash
# Check bench status
bench --site juhudi.local migrate

# Clear cache
bench --site juhudi.local clear-cache

# Backup site
bench --site juhudi.local backup --with-files

# Restore backup
bench --site juhudi.local restore /path/to/backup.sql.gz

# Update bench
bench update

# Restart services
sudo supervisorctl restart all

# View logs
tail -f /home/frappe/frappe-bench/logs/web.log
tail -f /home/frappe/frappe-bench/logs/worker.error.log

# Check running processes
sudo supervisorctl status all
```

---

## What You'll Have

✅ ERPNext running on your server
✅ Accessible at http://YOUR_SERVER_IP
✅ MariaDB database configured
✅ Production setup with Nginx
✅ Ready for Windows integration
✅ 860 customers + 632 invoices will sync

---

## Next Steps After Installation

1. Complete ERPNext setup wizard
2. Generate API keys
3. Configure Windows integration
4. Run first sync
5. Setup automatic sync with PM2
6. Configure company settings
7. Add more users

---

**Total Installation Time:** 30-45 minutes

