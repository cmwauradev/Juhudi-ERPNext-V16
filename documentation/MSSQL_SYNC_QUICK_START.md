# MSSQL Sync - Quick Start Guide

Fast setup guide for syncing MSSQL data to ERPNext every 5 minutes.

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Update .env File

Open `.env` and add your MSSQL credentials:

```bash
# MSSQL Database Configuration
MSSQL_SERVER=192.168.1.100          # Your MSSQL server IP/hostname
MSSQL_PORT=1433                     # Default MSSQL port
MSSQL_DATABASE=YourDatabaseName     # Your database name
MSSQL_USER=your_username            # MSSQL username
MSSQL_PASSWORD=your_password        # MSSQL password
MSSQL_ENCRYPT=true                  # Use encryption (true/false)
MSSQL_TRUST_SERVER_CERTIFICATE=false # Trust cert (true for self-signed)
```

### Step 2: Test MSSQL Connection

```bash
npm run test:mssql
```

Expected output:
```
✅ Connected successfully!
✅ Query executed successfully!
✅ Found X tables
🎉 MSSQL CONNECTION TEST PASSED!
```

### Step 3: Customize Database Schema (Optional)

Edit `mssql_to_erpnext_sync.js` to match your MSSQL table structure.

Find these functions and update the queries:
- `fetchCustomersFromMSSQL()` - Line ~200
- `fetchInvoicesFromMSSQL()` - Line ~230
- `fetchInvoiceItemsFromMSSQL()` - Line ~260

### Step 4: Run One-Time Sync Test

```bash
npm run sync
```

This will:
1. Create "MSSQL Sync Log" table in ERPNext
2. Fetch data from MSSQL
3. Sync to ERPNext
4. Show summary report

### Step 5: Start Automated Sync (Every 5 Minutes)

```bash
# Option A: Keep terminal open
npm run sync

# Option B: Run in background
nohup npm run sync > sync.log 2>&1 &

# Option C: Use PM2 (recommended)
npm install -g pm2
pm2 start mssql_to_erpnext_sync.js --name "mssql-sync"
pm2 logs mssql-sync
pm2 save
```

---

## 📊 What Gets Synced

### From MSSQL → To ERPNext

| MSSQL Table | ERPNext DocType | ERPNext Table |
|-------------|-----------------|---------------|
| Customers | Customer | tabCustomer |
| Invoices | Sales Invoice | tabSales Invoice |
| InvoiceItems | Sales Invoice Item | tabSales Invoice Item |

### Sync Tracking

All syncs are logged in:
- **DocType:** MSSQL Sync Log
- **Table:** `tabMSSQL Sync Log`
- **View:** http://localhost:8000/app/mssql-sync-log

---

## 🔍 Monitoring

### View Sync Logs in ERPNext
```
http://localhost:8000/app/mssql-sync-log
```

### View Console Logs
```bash
# If running with nohup
tail -f sync.log

# If using PM2
pm2 logs mssql-sync

# Real-time monitoring
pm2 monit
```

### Check Last Sync Status
```bash
bench --site localhost mariadb -e "
SELECT source_table, target_doctype, sync_status, COUNT(*) as count 
FROM \`tabMSSQL Sync Log\` 
GROUP BY source_table, target_doctype, sync_status
"
```

---

## 🛠️ Common Commands

```bash
# Test ERPNext connection
npm test

# Test MSSQL connection
npm run test:mssql

# Run sync once
npm run sync

# Create sample invoice
npm run create-invoice

# Stop PM2 sync
pm2 stop mssql-sync

# Restart PM2 sync
pm2 restart mssql-sync

# View PM2 logs
pm2 logs mssql-sync --lines 100

# PM2 process list
pm2 list
```

---

## 🎯 Sync Schedule

**Default:** Every 5 minutes

**Customize:** Edit `mssql_to_erpnext_sync.js` line ~700

```javascript
// Every 5 minutes (default)
cron.schedule('*/5 * * * *', () => runSync());

// Every 1 minute
cron.schedule('*/1 * * * *', () => runSync());

// Every 15 minutes  
cron.schedule('*/15 * * * *', () => runSync());

// Every hour at minute 0
cron.schedule('0 * * * *', () => runSync());

// Daily at 2:00 AM
cron.schedule('0 2 * * *', () => runSync());
```

**Cron Format:** `minute hour day month weekday`

---

## ✅ Verification Checklist

After first sync, verify:

- [ ] MSSQL connection successful
- [ ] "MSSQL Sync Log" table created in ERPNext
- [ ] Customers synced to ERPNext
- [ ] Invoices synced to ERPNext
- [ ] No failed syncs (check logs)
- [ ] Sync running every 5 minutes

---

## 🚨 Troubleshooting

### Connection Failed

**Error:** `ESOCKET` or `Cannot connect`

**Fix:**
1. Verify MSSQL server is running
2. Check firewall allows port 1433
3. Ping the server: `ping your_mssql_server`
4. Test telnet: `telnet your_mssql_server 1433`

### Login Failed

**Error:** `ELOGIN` or `Authentication failed`

**Fix:**
1. Verify username/password in `.env`
2. Enable SQL Server authentication (not just Windows)
3. Grant user access:
```sql
USE YourDatabase;
CREATE USER your_user FOR LOGIN your_login;
EXEC sp_addrolemember 'db_datareader', 'your_user';
```

### Table Not Found

**Error:** `Invalid object name 'Customers'`

**Fix:**
1. Verify table names in your MSSQL database
2. Update queries in `mssql_to_erpnext_sync.js`
3. Check schema: `SELECT * FROM INFORMATION_SCHEMA.TABLES`

### Duplicate Records

**Issue:** Same record synced multiple times

**Fix:**
- The sync log prevents this automatically
- If duplicates occur, check `isRecordSynced()` function
- Verify `source_id` is unique

### Items Not Found

**Error:** `Item PROD-001 does not exist`

**Fix:**
1. Create items in ERPNext first
2. Or sync items from MSSQL (add custom sync function)
3. Use existing item codes that match MSSQL

---

## 📁 File Structure

```
frappe-bench/
├── mssql_to_erpnext_sync.js       # Main sync script
├── test_mssql_connection.js       # Test MSSQL connection
├── test_connection.js             # Test ERPNext connection
├── erpnext_integration.js         # ERPNext API functions
├── create_invoice_example.js      # Sample invoice creation
├── .env                           # Configuration (credentials)
├── package.json                   # Node.js dependencies
├── MSSQL_SYNC_SETUP.md           # Detailed guide
└── MSSQL_SYNC_QUICK_START.md     # This file
```

---

## 📞 Support

**Check detailed documentation:**
```bash
cat MSSQL_SYNC_SETUP.md
```

**View ERPNext logs:**
```bash
tail -f logs/web.log
tail -f logs/worker.error.log
```

**Check database:**
```bash
bench --site localhost mariadb
> SELECT * FROM `tabMSSQL Sync Log` ORDER BY sync_timestamp DESC LIMIT 10;
```

---

## 🎓 Example Sync Flow

```
1. [Every 5 minutes] Cron triggers sync

2. Connect to MSSQL database
   └─ Fetch customers modified in last 10 minutes

3. For each customer:
   ├─ Check if already synced (MSSQL Sync Log)
   ├─ If not synced:
   │  ├─ Transform data to ERPNext format
   │  ├─ Create customer in ERPNext
   │  └─ Log sync (source_id → target_id)
   └─ If already synced: Skip

4. Fetch invoices modified in last 10 minutes

5. For each invoice:
   ├─ Check if already synced
   ├─ Find ERPNext customer (from sync log)
   ├─ Fetch invoice items
   ├─ Create invoice in ERPNext
   └─ Log sync

6. Show summary:
   ├─ Customers: X processed, Y synced, Z skipped
   └─ Invoices: X processed, Y synced, Z skipped

7. Wait 5 minutes, repeat
```

---

## 🔒 Security Tips

1. **Use read-only MSSQL user:**
```sql
GRANT SELECT ON Customers TO sync_user;
GRANT SELECT ON Invoices TO sync_user;
GRANT SELECT ON InvoiceItems TO sync_user;
```

2. **Protect .env file:**
```bash
chmod 600 .env
```

3. **Use HTTPS for ERPNext in production**

4. **Enable MSSQL encryption:**
```bash
MSSQL_ENCRYPT=true
```

---

## ✨ Next Steps

After successful sync:

1. **Add more tables** - Products, Orders, Payments
2. **Customize field mappings** - Match your business needs
3. **Set up alerts** - Email on sync failures
4. **Add bidirectional sync** - ERPNext → MSSQL
5. **Optimize performance** - Add indexes, pagination

---

**Ready to sync?**

```bash
# Test connections
npm run test:mssql
npm test

# Start syncing!
npm run sync
```

Good luck! 🚀
