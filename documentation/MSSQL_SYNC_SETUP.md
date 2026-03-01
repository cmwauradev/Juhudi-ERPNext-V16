# MSSQL to ERPNext Sync Setup Guide

Complete guide for syncing data from Microsoft SQL Server to ERPNext every 5 minutes.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Database Schema](#database-schema)
6. [Running the Sync](#running-the-sync)
7. [Monitoring](#monitoring)
8. [Customization](#customization)
9. [Troubleshooting](#troubleshooting)

---

## ✨ Features

- ✅ **Automated Sync** - Runs every 5 minutes automatically
- ✅ **Duplicate Prevention** - Tracks synced records to avoid duplicates
- ✅ **Sync Logging** - Custom ERPNext table tracks all sync operations
- ✅ **Error Handling** - Comprehensive error logging and recovery
- ✅ **Incremental Sync** - Only syncs new/modified records (last 10 minutes)
- ✅ **Multi-Entity Support** - Syncs Customers, Invoices, and more
- ✅ **Customizable** - Easy to modify for your MSSQL schema

---

## 📦 Prerequisites

### 1. Node.js Packages (Already Installed)
```bash
npm install mssql node-cron axios dotenv
```

### 2. MSSQL Server Access
- MSSQL Server hostname/IP
- Database name
- Username and password
- Network access to MSSQL server

### 3. ERPNext API Access
- API Key and Secret (already configured in `.env`)

---

## 🚀 Installation

### Step 1: Update Environment Variables

Edit your `.env` file and add MSSQL credentials:

```bash
# ERPNext Configuration (already configured)
ERPNEXT_URL=http://localhost:8000
ERPNEXT_API_KEY=19d191b417cbf4a
ERPNEXT_API_SECRET=4e18f78cd5b3d6c
ERPNEXT_COMPANY=Juhudi Smart Solutions

# MSSQL Database Configuration (UPDATE THESE)
MSSQL_SERVER=your_mssql_server_hostname
MSSQL_PORT=1433
MSSQL_DATABASE=your_database_name
MSSQL_USER=your_mssql_username
MSSQL_PASSWORD=your_mssql_password
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=false
```

### Step 2: Configure Your MSSQL Server

Ensure your MSSQL server allows remote connections:

1. **Enable TCP/IP:**
   - SQL Server Configuration Manager → SQL Server Network Configuration
   - Enable TCP/IP protocol
   - Restart SQL Server service

2. **Firewall Rules:**
   - Allow port 1433 (or your custom port)

3. **Authentication:**
   - Enable SQL Server and Windows Authentication mode

---

## 📊 Database Schema

### Expected MSSQL Tables

The sync script expects these tables in your MSSQL database. **Customize the queries in the script to match your actual schema.**

#### Customers Table
```sql
CREATE TABLE Customers (
    CustomerID INT PRIMARY KEY,
    CustomerName NVARCHAR(255),
    CustomerType NVARCHAR(50),
    Email NVARCHAR(255),
    Phone NVARCHAR(50),
    Address NVARCHAR(500),
    City NVARCHAR(100),
    Country NVARCHAR(100),
    TaxID NVARCHAR(100),
    CreatedDate DATETIME,
    ModifiedDate DATETIME
);
```

#### Invoices Table
```sql
CREATE TABLE Invoices (
    InvoiceID INT PRIMARY KEY,
    CustomerID INT,
    InvoiceDate DATE,
    DueDate DATE,
    TotalAmount DECIMAL(18,2),
    Currency NVARCHAR(10),
    Status NVARCHAR(50),
    PONumber NVARCHAR(100),
    CreatedDate DATETIME,
    ModifiedDate DATETIME,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```

#### InvoiceItems Table
```sql
CREATE TABLE InvoiceItems (
    ItemID INT PRIMARY KEY,
    InvoiceID INT,
    ItemCode NVARCHAR(100),
    ItemName NVARCHAR(255),
    Quantity DECIMAL(18,2),
    UnitPrice DECIMAL(18,2),
    Description NVARCHAR(500),
    FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID)
);
```

### ERPNext Sync Tracking Table

The script automatically creates this custom DocType in ERPNext:

**MSSQL Sync Log** (Table: `tabMSSQL Sync Log`)

| Field | Type | Description |
|-------|------|-------------|
| name | Data | Auto-generated (SYNC-00001) |
| source_table | Data | MSSQL table name |
| source_id | Data | MSSQL record ID |
| target_doctype | Data | ERPNext DocType |
| target_id | Data | ERPNext record ID |
| sync_status | Select | Success/Failed/Pending |
| sync_timestamp | Datetime | When synced |
| source_data | Long Text | JSON of original data |
| error_message | Long Text | Error details if failed |

---

## 🎯 Running the Sync

### One-Time Manual Sync
```bash
node mssql_to_erpnext_sync.js
```

### Automated Sync (Every 5 Minutes)
```bash
# The script runs automatically every 5 minutes once started
node mssql_to_erpnext_sync.js

# Keep it running in background
nohup node mssql_to_erpnext_sync.js > sync.log 2>&1 &
```

### As a Service (Recommended for Production)

Create a systemd service file: `/etc/systemd/system/erpnext-sync.service`

```ini
[Unit]
Description=MSSQL to ERPNext Sync Service
After=network.target

[Service]
Type=simple
User=apple
WorkingDirectory=/Users/apple/frappe-bench
ExecStart=/usr/bin/node /Users/apple/frappe-bench/mssql_to_erpnext_sync.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable erpnext-sync
sudo systemctl start erpnext-sync
sudo systemctl status erpnext-sync
```

### Using PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start sync service
pm2 start mssql_to_erpnext_sync.js --name "erpnext-sync"

# View logs
pm2 logs erpnext-sync

# Monitor
pm2 monit

# Auto-start on system boot
pm2 startup
pm2 save
```

---

## 📈 Monitoring

### View Sync Logs in ERPNext

1. Navigate to: http://localhost:8000/app/mssql-sync-log
2. View all sync operations
3. Filter by status, date, source table
4. Check error messages for failed syncs

### Console Output

The sync process provides real-time console output:

```
======================================================================
🔄 Starting MSSQL → ERPNext Sync at 2026-02-28T15:00:00.000Z
======================================================================

✅ Connected to MSSQL database: YourDatabase
✅ MSSQL Sync Log table already exists

📋 Syncing Customers...
📊 Fetched 5 customers from MSSQL
  ✅ Synced customer: 1001 → CUST-00010
  ✅ Logged sync: Customers[1001] → Customer[CUST-00010]
  ⏭️  Customer 1002 already synced, skipping...
  ✅ Synced customer: 1003 → CUST-00011

💰 Syncing Invoices...
📊 Fetched 3 invoices from MSSQL
  ✅ Synced invoice: 5001 → ACC-SINV-2026-00005
  ✅ Logged sync: Invoices[5001] → Sales Invoice[ACC-SINV-2026-00005]

✅ MSSQL connection closed

======================================================================
📊 SYNC SUMMARY
======================================================================
Started:  2026-02-28T15:00:00.000Z
Finished: 2026-02-28T15:00:15.000Z
Duration: 15.23 seconds

Customers:
  Processed: 5
  Synced:    2
  Skipped:   3
  Failed:    0

Invoices:
  Processed: 3
  Synced:    3
  Skipped:   0
  Failed:    0
======================================================================
```

### Check Database Directly

```bash
# View synced records
bench --site localhost mariadb -e "SELECT * FROM \`tabMSSQL Sync Log\` ORDER BY sync_timestamp DESC LIMIT 10"

# Count syncs by status
bench --site localhost mariadb -e "SELECT sync_status, COUNT(*) as count FROM \`tabMSSQL Sync Log\` GROUP BY sync_status"

# Failed syncs
bench --site localhost mariadb -e "SELECT * FROM \`tabMSSQL Sync Log\` WHERE sync_status='Failed'"
```

---

## 🔧 Customization

### 1. Modify MSSQL Queries

Edit the fetch functions in `mssql_to_erpnext_sync.js`:

```javascript
async function fetchCustomersFromMSSQL(pool) {
    const result = await pool.request().query(`
        SELECT 
            CustomerID,
            CustomerName,
            -- Add your custom fields here
            CustomField1,
            CustomField2
        FROM Customers
        WHERE ModifiedDate >= DATEADD(MINUTE, -10, GETDATE())
        ORDER BY ModifiedDate DESC
    `);
    return result.recordset;
}
```

### 2. Customize Data Transformation

Modify the transformation functions:

```javascript
function transformCustomerData(mssqlCustomer) {
    return {
        customer_name: mssqlCustomer.CustomerName,
        customer_type: mssqlCustomer.CustomerType === 'Business' ? 'Company' : 'Individual',
        // Add custom field mappings
        custom_field_1: mssqlCustomer.CustomField1,
        custom_field_2: mssqlCustomer.CustomField2
    };
}
```

### 3. Add More Entity Types

Copy the customer sync pattern to add products, orders, etc.:

```javascript
async function syncProducts(mssqlProduct) {
    // Similar to syncCustomer but for products
}

// In runSync():
const products = await fetchProductsFromMSSQL(pool);
for (const product of products) {
    await syncProduct(product);
}
```

### 4. Change Sync Frequency

Edit the cron schedule:

```javascript
// Every 5 minutes (default)
cron.schedule('*/5 * * * *', () => { runSync(); });

// Every 1 minute
cron.schedule('*/1 * * * *', () => { runSync(); });

// Every 15 minutes
cron.schedule('*/15 * * * *', () => { runSync(); });

// Every hour
cron.schedule('0 * * * *', () => { runSync(); });

// Every day at 2 AM
cron.schedule('0 2 * * *', () => { runSync(); });
```

### 5. Adjust Time Window

Change how far back to look for modified records:

```javascript
// Current: Last 10 minutes
WHERE ModifiedDate >= DATEADD(MINUTE, -10, GETDATE())

// Last 30 minutes
WHERE ModifiedDate >= DATEADD(MINUTE, -30, GETDATE())

// Last 1 hour
WHERE ModifiedDate >= DATEADD(HOUR, -1, GETDATE())

// Today only
WHERE CAST(ModifiedDate AS DATE) = CAST(GETDATE() AS DATE)
```

---

## 🆘 Troubleshooting

### Error: "Login failed for user"

**Solution:**
1. Verify MSSQL credentials in `.env`
2. Check SQL Server authentication mode (mixed mode required)
3. Verify user has access to the database

```sql
-- Grant access to database
USE YourDatabase;
CREATE USER YourUser FOR LOGIN YourLogin;
EXEC sp_addrolemember 'db_datareader', 'YourUser';
```

### Error: "Cannot connect to MSSQL server"

**Solution:**
1. Check MSSQL server is running
2. Verify firewall allows port 1433
3. Test connection:

```bash
node -e "
const sql = require('mssql');
sql.connect({
  server: 'your_server',
  database: 'your_db',
  user: 'your_user',
  password: 'your_pass',
  options: { encrypt: true }
}).then(() => console.log('Connected!')).catch(console.error);
"
```

### Error: "Customer not found in ERPNext"

**Cause:** Invoice references a customer that hasn't been synced yet.

**Solution:**
- Sync customers before invoices
- The script already does this, but ensure customers exist first

### Error: "MSSQL Sync Log table not found"

**Solution:**
1. The script creates this automatically on first run
2. Manually create if needed:
   - Login to ERPNext
   - Go to DocType List
   - Create new DocType following the schema above

### Performance Issues

**If sync is slow:**

1. **Add indexes to MSSQL:**
```sql
CREATE INDEX idx_customers_modified ON Customers(ModifiedDate);
CREATE INDEX idx_invoices_modified ON Invoices(ModifiedDate);
```

2. **Reduce time window:**
```javascript
// Change from 10 minutes to 5 minutes
WHERE ModifiedDate >= DATEADD(MINUTE, -5, GETDATE())
```

3. **Add pagination:**
```javascript
const result = await pool.request().query(`
    SELECT TOP 100 * FROM Customers
    WHERE ModifiedDate >= DATEADD(MINUTE, -10, GETDATE())
    ORDER BY ModifiedDate DESC
`);
```

### View Logs

```bash
# Real-time sync logs
tail -f sync.log

# PM2 logs
pm2 logs erpnext-sync

# System service logs
sudo journalctl -u erpnext-sync -f
```

---

## 📝 Example .env File

```bash
# ERPNext Configuration
ERPNEXT_URL=http://localhost:8000
ERPNEXT_API_KEY=19d191b417cbf4a
ERPNEXT_API_SECRET=4e18f78cd5b3d6c
ERPNEXT_COMPANY=Juhudi Smart Solutions

# MSSQL Database Configuration
MSSQL_SERVER=192.168.1.100
MSSQL_PORT=1433
MSSQL_DATABASE=CompanyDB
MSSQL_USER=sync_user
MSSQL_PASSWORD=SecurePassword123!
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=false
```

---

## 🔐 Security Best Practices

1. **Use read-only MSSQL user:**
```sql
CREATE LOGIN sync_user WITH PASSWORD = 'SecurePassword123!';
USE YourDatabase;
CREATE USER sync_user FOR LOGIN sync_user;
EXEC sp_addrolemember 'db_datareader', 'sync_user';
```

2. **Keep .env secure:**
```bash
chmod 600 .env
```

3. **Use HTTPS in production:**
```bash
ERPNEXT_URL=https://your-erp.com
```

4. **Enable encryption:**
```bash
MSSQL_ENCRYPT=true
```

---

## 📊 Sync Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     MSSQL Database                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Customers   │  │   Invoices   │  │ InvoiceItems │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Fetch (Modified in last 10 min)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Node.js Sync Service (Every 5 min)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Check if already synced (MSSQL Sync Log)             │  │
│  │ 2. Transform data to ERPNext format                     │  │
│  │ 3. Create/Update in ERPNext                             │  │
│  │ 4. Log sync result                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ERPNext Database                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ tabCustomer  │  │tabSales Inv. │  │MSSQL Sync Log│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Quick Start Checklist

- [ ] Install dependencies: `npm install mssql node-cron`
- [ ] Update `.env` with MSSQL credentials
- [ ] Customize MSSQL queries for your schema
- [ ] Test connection: `node -e "require('./mssql_to_erpnext_sync').connectMSSQL()"`
- [ ] Run one-time sync: `node mssql_to_erpnext_sync.js`
- [ ] Verify data in ERPNext
- [ ] Check MSSQL Sync Log table
- [ ] Set up as service (PM2 or systemd)
- [ ] Monitor logs regularly

---

**Need help?** Check the console output for detailed error messages and sync statistics!
