# Complete Frappe Bench Deployment Guide

## Understanding Frappe Bench

**Frappe Bench** is the deployment tool for ERPNext. It manages:
- Multiple apps (frappe, erpnext, hrms, your custom apps)
- Multiple sites
- Python virtual environment
- Node.js dependencies
- Background workers
- Database connections
- Web server configuration

---

## 🏗️ Your Current Bench Structure

```
/Users/apple/frappe-bench/
├── apps/                          # All Frappe applications
│   ├── frappe/                    # Core framework
│   ├── erpnext/                   # ERP application
│   ├── hrms/                      # HR application
│   └── juhudi_integration/        # Your custom app (if created)
│
├── sites/                         # All sites/instances
│   ├── localhost/                 # Your site
│   │   ├── site_config.json       # Site configuration
│   │   ├── site1.db              # SQLite (dev only)
│   │   └── private/
│   ├── apps.txt                   # Apps installed on sites
│   └── common_site_config.json    # Shared configuration
│
├── env/                           # Python virtual environment
├── config/                        # Service configurations
│   ├── redis_cache.conf
│   ├── redis_queue.conf
│   └── supervisor.conf
│
├── logs/                          # Application logs
├── Procfile                       # Process definitions
└── Your Integration Scripts/      # Your Node.js scripts
    ├── mssql_sync_all_fields.js
    └── package.json
```

---

## 📦 Methods to Deploy Bench to Another Machine

### Method 1: Fresh Bench Installation + App Installation (Recommended)

Install Frappe Bench on the new machine, then install your apps.

#### Step 1: Install Frappe Bench on Target Machine

```bash
# Prerequisites (Ubuntu/Debian)
sudo apt update
sudo apt install -y python3-dev python3-pip python3-venv
sudo apt install -y redis-server mariadb-server nginx
sudo apt install -y git curl

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
```

#### Step 2: Get ERPNext Apps

```bash
# Get ERPNext
bench get-app erpnext --branch version-14

# Get HRMS
bench get-app hrms

# Get your custom integration from GitHub
bench get-app https://github.com/cmwauradev/Juhudi-ERPNext-V16.git
```

#### Step 3: Create Site

```bash
# Create new site
bench new-site your-site.local

# Install apps on the site
bench --site your-site.local install-app erpnext
bench --site your-site.local install-app hrms
bench --site your-site.local install-app juhudi_integration

# Set as default site
bench use your-site.local
```

#### Step 4: Restore Data (Optional)

If you want to transfer your existing data:

```bash
# On source machine (your Mac)
cd /Users/apple/frappe-bench
bench --site localhost backup --with-files

# Copy backup files to target machine
# Files are in: sites/localhost/private/backups/

# On target machine
bench --site your-site.local restore /path/to/backup.sql.gz
```

#### Step 5: Configure Integration

```bash
# Setup environment for integration scripts
cd apps/juhudi_integration
npm install

# Configure credentials
cp .env.example .env
nano .env

# Setup PM2 for sync service
pm2 start mssql_sync_all_fields.js --name "mssql-sync"
pm2 save
```

---

### Method 2: Bench Backup and Complete Migration

Transfer the entire bench directory.

#### On Source Machine (Your Mac)

```bash
cd /Users/apple/frappe-bench

# Stop all bench services
bench stop

# Create database backup
bench --site localhost backup --with-files

# Create tar of entire bench (excluding large/unnecessary files)
tar --exclude='env' \
    --exclude='node_modules' \
    --exclude='sites/assets' \
    --exclude='logs' \
    -czf frappe-bench-backup.tar.gz .

# Restart services
bench start
```

#### On Target Machine

```bash
# Install prerequisites (as in Method 1)

# Create bench directory
mkdir -p /home/frappe/frappe-bench
cd /home/frappe/frappe-bench

# Extract backup
tar -xzf /path/to/frappe-bench-backup.tar.gz

# Reinstall Python environment
bench setup env
bench setup requirements

# Reinstall Node.js dependencies
bench setup node_modules

# Rebuild assets
bench build

# Setup production
sudo bench setup production frappe

# Start services
bench start
```

---

### Method 3: Docker Container (Production Ready)

Package everything in Docker for easy deployment.

#### Create Dockerfile

```dockerfile
# Dockerfile
FROM frappe/bench:latest

# Set working directory
WORKDIR /home/frappe/frappe-bench

# Copy bench directory
COPY --chown=frappe:frappe . .

# Install apps
RUN bench get-app erpnext --branch version-14
RUN bench get-app hrms
RUN bench get-app https://github.com/cmwauradev/Juhudi-ERPNext-V16.git

# Install Node.js dependencies for integration
WORKDIR /home/frappe/frappe-bench/apps/juhudi_integration
RUN npm install

# Back to bench directory
WORKDIR /home/frappe/frappe-bench

# Setup bench
RUN bench setup requirements
RUN bench build

# Expose ports
EXPOSE 8000 9000 6787

CMD ["bench", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  mariadb:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: your_root_password
    volumes:
      - mariadb-data:/var/lib/mysql
    networks:
      - erpnext-network

  redis-cache:
    image: redis:alpine
    networks:
      - erpnext-network

  redis-queue:
    image: redis:alpine
    networks:
      - erpnext-network

  erpnext:
    build: .
    ports:
      - "8000:8000"
      - "9000:9000"
    environment:
      - SITE_NAME=localhost
    depends_on:
      - mariadb
      - redis-cache
      - redis-queue
    volumes:
      - erpnext-sites:/home/frappe/frappe-bench/sites
    networks:
      - erpnext-network

  mssql-sync:
    build:
      context: .
      dockerfile: Dockerfile.sync
    depends_on:
      - erpnext
    env_file:
      - .env
    networks:
      - erpnext-network

volumes:
  mariadb-data:
  erpnext-sites:

networks:
  erpnext-network:
```

---

## 🎯 Recommended Approach for Juhudi

### Scenario A: Development/Testing Machine

**Use Method 1: Fresh Installation**

```bash
# Quick setup script
#!/bin/bash

# Install bench
pip3 install frappe-bench

# Initialize
bench init frappe-bench --frappe-branch version-14
cd frappe-bench

# Get apps
bench get-app erpnext --branch version-14
bench get-app hrms
bench get-app https://github.com/cmwauradev/Juhudi-ERPNext-V16.git

# Create site
bench new-site juhudi.local
bench --site juhudi.local install-app erpnext
bench --site juhudi.local install-app hrms

# Start
bench start
```

### Scenario B: Production Server

**Use Method 3: Docker Container**

Benefits:
- ✅ Isolated environment
- ✅ Easy to scale
- ✅ Consistent across servers
- ✅ Simple backup/restore
- ✅ Easy rollback

---

## 📋 Complete Migration Checklist

### Pre-Migration (Source Machine)

```bash
# 1. Create database backup
bench --site localhost backup --with-files

# 2. Export site config
cat sites/localhost/site_config.json > site_config_backup.json

# 3. List installed apps
bench --site localhost list-apps > installed_apps.txt

# 4. Document custom configurations
cat sites/common_site_config.json > common_config_backup.json

# 5. Export integration environment
cp .env .env.backup

# 6. Create bench archive (optional)
tar -czf bench-migration.tar.gz \
    --exclude='env' \
    --exclude='node_modules' \
    --exclude='sites/assets' \
    sites/ apps/ config/ Procfile
```

### Migration (Target Machine)

```bash
# 1. Install prerequisites
sudo apt update
sudo apt install -y python3-dev python3-pip redis-server mariadb-server nginx git curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn

# 2. Install bench
sudo pip3 install frappe-bench

# 3. Initialize bench
bench init frappe-bench --frappe-branch version-14
cd frappe-bench

# 4. Get apps (same versions as source)
bench get-app erpnext --branch version-14
bench get-app hrms
bench get-app https://github.com/cmwauradev/Juhudi-ERPNext-V16.git

# 5. Create site
bench new-site juhudi.local --db-name juhudi_erp

# 6. Install apps
bench --site juhudi.local install-app erpnext
bench --site juhudi.local install-app hrms

# 7. Restore database
bench --site juhudi.local restore /path/to/backup.sql.gz

# 8. Configure integration
cd apps/juhudi_integration
npm install
cp .env.backup .env
nano .env  # Update for new environment

# 9. Setup production
sudo bench setup production frappe
sudo bench setup nginx
sudo supervisorctl reread
sudo supervisorctl update

# 10. Setup MSSQL sync
pm2 start mssql_sync_all_fields.js --name "mssql-sync"
pm2 save
pm2 startup
```

### Post-Migration Verification

```bash
# 1. Check site status
bench --site juhudi.local migrate
bench --site juhudi.local clear-cache

# 2. Verify apps
bench --site juhudi.local list-apps

# 3. Check database
bench --site juhudi.local console
>>> frappe.db.count('Customer')
>>> frappe.db.count('Sales Invoice')

# 4. Test web access
curl http://localhost:8000

# 5. Test MSSQL sync
npm run test:mssql

# 6. Check sync service
pm2 list
pm2 logs mssql-sync
```

---

## 🔧 Configuration Files to Transfer

### 1. Site Configuration

```json
// sites/localhost/site_config.json
{
  "db_name": "_435e0475cf331d3a",
  "db_password": "your_password",
  "db_type": "mariadb"
}
```

### 2. Common Configuration

```json
// sites/common_site_config.json
{
  "redis_cache": "redis://127.0.0.1:13000",
  "redis_queue": "redis://127.0.0.1:11000",
  "webserver_port": 8000
}
```

### 3. Integration Environment

```bash
# .env
ERPNEXT_URL=http://localhost:8000
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
ERPNEXT_COMPANY=Juhudi Smart Solutions

MSSQL_SERVER=85.190.241.118
MSSQL_DATABASE=TEST_ERP
MSSQL_USER=sa
MSSQL_PASSWORD=your_password
```

---

## 🚀 Quick Deploy Script

Save as `deploy-bench.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Juhudi ERPNext..."

# Variables
SITE_NAME="juhudi.local"
BENCH_DIR="frappe-bench"
BACKUP_FILE="$1"

# Check if backup file provided
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./deploy-bench.sh /path/to/backup.sql.gz"
    exit 1
fi

# Install prerequisites
echo "📦 Installing prerequisites..."
sudo apt update
sudo apt install -y python3-dev python3-pip python3-venv redis-server mariadb-server nginx git curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn pm2

# Install Frappe Bench
echo "🔧 Installing Frappe Bench..."
sudo pip3 install frappe-bench

# Initialize bench
echo "🏗️  Initializing bench..."
bench init $BENCH_DIR --frappe-branch version-14
cd $BENCH_DIR

# Get apps
echo "📥 Getting apps..."
bench get-app erpnext --branch version-14
bench get-app hrms
bench get-app https://github.com/cmwauradev/Juhudi-ERPNext-V16.git

# Create site
echo "🌐 Creating site..."
bench new-site $SITE_NAME

# Install apps
echo "⚙️  Installing apps..."
bench --site $SITE_NAME install-app erpnext
bench --site $SITE_NAME install-app hrms

# Restore backup
echo "📦 Restoring backup..."
bench --site $SITE_NAME restore $BACKUP_FILE

# Setup integration
echo "🔗 Setting up MSSQL integration..."
cd apps/juhudi_integration
npm install
echo "Please configure .env file"

# Setup production
echo "🚀 Setting up production..."
cd ../..
sudo bench setup production frappe

# Setup sync service
echo "⏰ Setting up sync service..."
pm2 start apps/juhudi_integration/mssql_sync_all_fields.js --name "mssql-sync"
pm2 save
pm2 startup

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "   1. Configure .env file in apps/juhudi_integration/"
echo "   2. Access ERPNext at: http://$(hostname -I | awk '{print $1}'):8000"
echo "   3. Check sync logs: pm2 logs mssql-sync"
```

Make executable and run:
```bash
chmod +x deploy-bench.sh
./deploy-bench.sh /path/to/backup.sql.gz
```

---

## 📊 Deployment Comparison

| Method | Complexity | Time | Use Case |
|--------|------------|------|----------|
| Fresh Install | Medium | 30-60 min | New server |
| Full Migration | Low | 15-30 min | Exact replica |
| Docker | High (setup) Low (deploy) | 1-5 min (after setup) | Production |
| Git Clone (scripts only) | Very Low | 5 min | Integration only |

---

## 💡 Best Practice Recommendations

### For Development
- Use **Fresh Install** (Method 1)
- Keep bench separate from production
- Use git for version control

### For Production
- Use **Docker** (Method 3)
- Implement proper backup strategy
- Use load balancers for scaling
- Setup monitoring (PM2, Supervisor)

### For Your Integration Scripts
- Keep as **separate service** (current approach)
- Can run on same server or different server
- Easy to update via git pull
- No need to rebuild bench

---

## 🎯 Summary for Juhudi

**Your Current Setup:**
- ✅ Frappe Bench installed on Mac
- ✅ ERPNext + HRMS apps
- ✅ Custom integration scripts (Node.js)
- ✅ 860 customers + 632 invoices synced

**To Deploy on New Server:**

**Option A: Full ERPNext + Integration** (Recommended)
```bash
# Install bench with all apps + your integration
./deploy-bench.sh /path/to/backup.sql.gz
```

**Option B: Integration Scripts Only** (Simpler)
```bash
# Just sync scripts, connect to existing ERPNext
git clone https://github.com/cmwauradev/Juhudi-ERPNext-V16.git
cd Juhudi-ERPNext-V16
npm install
# Configure .env to point to existing ERPNext
node mssql_sync_all_fields.js
```

**Both work perfectly - choose based on your needs!**

