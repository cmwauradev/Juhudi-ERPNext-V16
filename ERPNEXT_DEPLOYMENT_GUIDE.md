# ERPNext Deployment & Distribution Guide

## How ERPNext Apps Work Across Machines

ERPNext uses the **Frappe Framework**, which is Python-based and doesn't compile to binary files. Instead, it's distributed as **source code** that gets installed on other machines.

---

## 📦 Methods to Deploy ERPNext to Another Machine

### Method 1: Install as a Frappe App (Recommended)

Your custom code can be packaged as a **Frappe App** and installed on any ERPNext instance.

#### Step 1: Create a Frappe App

```bash
# On your development machine
cd frappe-bench
bench new-app juhudi_integration

# This creates:
apps/juhudi_integration/
├── juhudi_integration/
│   ├── __init__.py
│   ├── hooks.py
│   ├── modules.txt
│   └── public/
├── setup.py
├── requirements.txt
└── README.md
```

#### Step 2: Move Your Integration Scripts

```bash
# Move your Node.js scripts to the app
mkdir apps/juhudi_integration/juhudi_integration/integrations
cp mssql_sync_all_fields.js apps/juhudi_integration/juhudi_integration/integrations/
cp sync_invoices_direct.js apps/juhudi_integration/juhudi_integration/integrations/
cp package.json apps/juhudi_integration/
```

#### Step 3: Configure hooks.py

```python
# apps/juhudi_integration/juhudi_integration/hooks.py

app_name = "juhudi_integration"
app_title = "Juhudi Integration"
app_publisher = "Juhudi Smart Solutions"
app_description = "MSSQL to ERPNext Integration Suite"
app_version = "1.0.0"

# Scheduled tasks
scheduler_events = {
    "cron": {
        "*/5 * * * *": [
            "juhudi_integration.integrations.mssql_sync.run_sync"
        ]
    }
}

# Boot session - add custom fields info
boot_session = "juhudi_integration.boot.boot_session"
```

#### Step 4: Install on Target Machine

```bash
# On the target machine
cd /path/to/frappe-bench

# Clone your GitHub repo
git clone https://github.com/cmwauradev/Juhudi-ERPNext-V16.git apps/juhudi_integration

# Install the app
bench --site your-site install-app juhudi_integration

# Install Node.js dependencies
cd apps/juhudi_integration
npm install
```

---

### Method 2: Docker Container (Best for Production)

Package everything into a Docker image for consistent deployment.

#### Create Dockerfile

```dockerfile
# Dockerfile
FROM frappe/erpnext:v14

# Copy integration scripts
COPY mssql_sync_all_fields.js /home/frappe/frappe-bench/apps/
COPY sync_invoices_direct.js /home/frappe/frappe-bench/apps/
COPY package.json /home/frappe/frappe-bench/apps/

# Install Node.js dependencies
WORKDIR /home/frappe/frappe-bench/apps
RUN npm install

# Copy environment template
COPY .env.example /home/frappe/frappe-bench/apps/.env.example

# Expose ports
EXPOSE 8000 9000

CMD ["bench", "start"]
```

#### Build and Deploy

```bash
# Build Docker image
docker build -t juhudi-erpnext:v1.0 .

# Save image to file
docker save juhudi-erpnext:v1.0 > juhudi-erpnext-v1.0.tar

# On target machine, load image
docker load < juhudi-erpnext-v1.0.tar

# Run container
docker run -d -p 8000:8000 -p 9000:9000 juhudi-erpnext:v1.0
```

---

### Method 3: Backup and Restore (Full Site Migration)

Transfer your entire ERPNext site including all data.

#### On Source Machine

```bash
# Create site backup
bench --site localhost backup --with-files

# Backup location: sites/localhost/private/backups/
# Creates 3 files:
#   - database.sql.gz (database)
#   - files.tar (uploaded files)
#   - private-files.tar (private files)
```

#### On Target Machine

```bash
# Install ERPNext (same version)
bench new-site new-site-name
bench --site new-site-name install-app erpnext

# Restore backup
bench --site new-site-name restore /path/to/database.sql.gz \
  --with-private-files /path/to/private-files.tar \
  --with-public-files /path/to/files.tar

# Copy integration scripts
cp /path/to/integration/scripts/* /path/to/frappe-bench/
```

---

### Method 4: Git Clone + Manual Setup (Development)

Simple clone for development environments.

```bash
# On target machine
cd /desired/location
git clone https://github.com/cmwauradev/Juhudi-ERPNext-V16.git
cd Juhudi-ERPNext-V16

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with target machine credentials

# Run sync
node mssql_sync_all_fields.js
```

---

## 🏗️ Current State of Your Project

Your project is currently **Node.js scripts** that integrate with ERPNext via API.

### What You Have

```
Your Project/
├── Node.js Integration Scripts ✅
│   ├── mssql_sync_all_fields.js
│   ├── sync_invoices_direct.js
│   └── erpnext_integration.js
│
├── ERPNext Custom Fields ✅
│   └── Created via API (in Customer DocType)
│
└── ERPNext Data ✅
    ├── tabCustomer (860 records)
    ├── tabSales Invoice (632 records)
    └── tabMSSQL Sync Log
```

### Deployment Options

**Option A: Standalone Scripts (Current State)**
- ✅ Easy to deploy (just Node.js + npm)
- ✅ Works with any ERPNext instance via API
- ✅ Can run on separate server
- ❌ Not integrated into ERPNext UI
- ❌ Requires manual configuration

**Option B: Convert to Frappe App**
- ✅ Integrated into ERPNext
- ✅ Installable via `bench install-app`
- ✅ Scheduled jobs managed by Frappe
- ✅ Version controlled with ERPNext
- ⚠️ Requires app development

**Option C: Docker Container**
- ✅ Complete environment included
- ✅ Consistent across machines
- ✅ Easy to deploy and scale
- ⚠️ Requires Docker knowledge

---

## 📦 Recommended Deployment Strategy for Juhudi

### For Your Current Setup (Node.js Scripts)

#### Package 1: Scripts Only

```bash
# Create deployment package
tar -czf juhudi-integration-v1.0.tar.gz \
  mssql_sync_all_fields.js \
  sync_invoices_direct.js \
  erpnext_integration.js \
  test_connection.js \
  test_mssql_connection.js \
  package.json \
  .env.example \
  Documentation/

# Transfer to target machine
scp juhudi-integration-v1.0.tar.gz user@target-machine:/path/

# On target machine
tar -xzf juhudi-integration-v1.0.tar.gz
npm install
cp .env.example .env
# Configure .env
node mssql_sync_all_fields.js
```

#### Package 2: Docker Container (Recommended for Production)

```bash
# Create docker-compose.yml
version: '3.8'
services:
  erpnext:
    image: frappe/erpnext:v14
    ports:
      - "8000:8000"
    environment:
      - SITE_NAME=localhost
  
  mssql-sync:
    build: .
    depends_on:
      - erpnext
    env_file:
      - .env
    restart: always
```

---

## 🚀 Quick Deployment Commands

### Deploy to New Server (Ubuntu/Debian)

```bash
#!/bin/bash
# deploy.sh - Complete deployment script

# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone project
git clone https://github.com/cmwauradev/Juhudi-ERPNext-V16.git
cd Juhudi-ERPNext-V16

# 3. Install dependencies
npm install

# 4. Configure
cp .env.example .env
echo "Please edit .env file with your credentials"
nano .env

# 5. Test connections
npm run test:mssql
npm test

# 6. Setup PM2 for production
sudo npm install -g pm2
pm2 start mssql_sync_all_fields.js --name "mssql-sync"
pm2 save
pm2 startup

echo "✅ Deployment complete!"
```

---

## 📋 Deployment Checklist

### Before Deployment

- [ ] Test all scripts locally
- [ ] Document configuration requirements
- [ ] Create .env.example with all required variables
- [ ] Test with sample data
- [ ] Create backup of source environment

### During Deployment

- [ ] Install Node.js on target machine
- [ ] Clone/copy project files
- [ ] Run `npm install`
- [ ] Configure .env file
- [ ] Test MSSQL connection
- [ ] Test ERPNext API connection
- [ ] Run one-time sync test
- [ ] Set up PM2 or systemd service
- [ ] Configure log rotation

### After Deployment

- [ ] Monitor sync logs
- [ ] Verify data in ERPNext
- [ ] Set up alerts for failures
- [ ] Document deployment process
- [ ] Create rollback plan

---

## 🔧 Converting to Frappe App (Future Enhancement)

If you want full integration with ERPNext:

```bash
# 1. Create new Frappe app
bench new-app juhudi_integration

# 2. Structure
apps/juhudi_integration/
├── juhudi_integration/
│   ├── api/                    # API endpoints
│   │   └── mssql_sync.py       # Python wrapper for Node.js
│   ├── integrations/           # Integration scripts
│   │   ├── mssql_sync_all_fields.js
│   │   └── sync_invoices_direct.js
│   ├── public/                 # Static files
│   │   └── js/
│   ├── hooks.py                # Frappe hooks
│   └── modules.txt
├── package.json                # Node.js dependencies
└── setup.py                    # Python package

# 3. Install
bench --site localhost install-app juhudi_integration
```

---

## 💡 Summary

### Current Best Practice for Your Project

**Method:** Git-based deployment with PM2

**Why:**
- ✅ Simple to deploy
- ✅ Works with any ERPNext instance
- ✅ Easy to update (git pull)
- ✅ Process management with PM2
- ✅ No ERPNext modifications needed

**Deployment:**
```bash
git clone https://github.com/cmwauradev/Juhudi-ERPNext-V16.git
cd Juhudi-ERPNext-V16
npm install
cp .env.example .env
# Edit .env
pm2 start mssql_sync_all_fields.js
```

This gives you a production-ready deployment that can be installed on any server with Node.js!

---

**Need help with any specific deployment scenario?**
