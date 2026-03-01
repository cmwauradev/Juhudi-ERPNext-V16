# ERPNext Cloud Setup Guide - DigitalOcean

## Complete Step-by-Step Guide to Deploy ERPNext on Cloud

**Time:** 30-45 minutes  
**Cost:** $12-24/month  
**Result:** Professional ERPNext accessible from anywhere

---

## Part 1: Create DigitalOcean Account (5 minutes)

### Step 1: Sign Up

1. Go to: https://www.digitalocean.com/
2. Click "Sign Up"
3. Enter your email and create password
4. OR sign up with Google/GitHub

### Step 2: Add Payment Method

1. After signup, you'll be asked to add payment
2. Choose:
   - **Credit/Debit Card**, OR
   - **PayPal**
3. Enter payment details
4. **New users get $200 credit for 60 days!**

### Step 3: Verify Email

1. Check your email inbox
2. Click verification link
3. Return to DigitalOcean dashboard

---

## Part 2: Create ERPNext Droplet (10 minutes)

### Step 1: Create New Droplet

1. Click **"Create"** button (top right)
2. Select **"Droplets"**

### Step 2: Choose Image

1. Click **"Marketplace"** tab
2. Search for **"ERPNext"**
3. Select **"ERPNext on Ubuntu 22.04"**
   - Official ERPNext image
   - Pre-configured and ready to use

### Step 3: Choose Plan

**Recommended Plans:**

| Plan | RAM | CPU | Storage | Price | Good For |
|------|-----|-----|---------|-------|----------|
| **Basic** | 2 GB | 1 CPU | 50 GB | $12/month | Testing, small business |
| **Basic** | 4 GB | 2 CPU | 80 GB | $24/month | **Recommended** - Production |
| **Basic** | 8 GB | 4 CPU | 160 GB | $48/month | Large business |

**Choose:** 4GB RAM plan ($24/month) for production use

### Step 4: Choose Region

Select datacenter closest to you:
- **Bangalore** (closest to Kenya)
- **Frankfurt** (Europe)
- **London** (Europe)
- **New York** (Americas)

### Step 5: Authentication

**Choose:** Password

1. Select "Password" option
2. Create a strong password (save this!)
3. Example: `JuhudiERP2026!Secure`

**Save this password - you'll need it to access your server!**

### Step 6: Finalize and Create

1. Hostname: Enter `juhudi-erpnext`
2. Tags: (optional) `erpnext`, `production`
3. Click **"Create Droplet"**

### Step 7: Wait for Creation

- Takes 1-2 minutes
- You'll see progress bar
- When done, you'll see your droplet with an IP address

**COPY THE IP ADDRESS** - Example: `159.89.164.233`

---

## Part 3: Access and Setup ERPNext (10 minutes)

### Step 1: Wait for ERPNext Installation

After droplet is created, ERPNext installs automatically.

**Wait 5-10 minutes** for complete installation.

### Step 2: Access ERPNext

1. Copy your droplet IP address
2. In browser, go to: `http://YOUR_IP_ADDRESS`
   - Example: `http://159.89.164.233`

### Step 3: Complete Setup Wizard

When ERPNext loads, you'll see setup wizard:

**Page 1: Language & Region**
- Language: English
- Country: Kenya
- Timezone: Africa/Nairobi
- Currency: KES
- Click **Next**

**Page 2: Company Details**
- Company Name: `Juhudi Smart Solutions`
- Company Abbreviation: `JSS`
- Click **Next**

**Page 3: Administrator**
- Full Name: Your Name
- Email: `admin@juhudi.local` (or your email)
- Password: Create admin password
- Click **Complete Setup**

### Step 4: Wait for Setup

- Takes 2-3 minutes
- Don't close the browser
- You'll see "Setting up your organization..."

### Step 5: ERPNext is Ready!

You'll see ERPNext dashboard!

---

## Part 4: Configure Firewall (5 minutes)

### Step 1: Open DigitalOcean Dashboard

1. Go to your droplet
2. Click on droplet name
3. Click **"Networking"** tab
4. Click **"Firewalls"**

### Step 2: Create Firewall

1. Click **"Create Firewall"**
2. Name: `erpnext-firewall`

### Step 3: Configure Rules

**Inbound Rules:**
- SSH: Port 22 (All IPv4, All IPv6)
- HTTP: Port 80 (All IPv4, All IPv6)
- HTTPS: Port 443 (All IPv4, All IPv6)
- Custom: Port 8000 (All IPv4, All IPv6) - for ERPNext

**Outbound Rules:**
- All TCP, All Ports (default)

### Step 4: Apply to Droplet

1. Under "Apply to Droplets", select your droplet
2. Click **"Create Firewall"**

---

## Part 5: Setup SSL (HTTPS) - Optional but Recommended (10 minutes)

### Step 1: Add Domain (Optional)

If you have a domain name:

1. Go to DigitalOcean → **Networking** → **Domains**
2. Add your domain
3. Create A record pointing to your droplet IP

OR skip this and use IP address directly.

### Step 2: Install SSL Certificate

**If using domain:**

```bash
# SSH into your droplet
ssh root@YOUR_IP_ADDRESS

# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo bench setup lets-encrypt YOUR_DOMAIN.com

# Example:
# sudo bench setup lets-encrypt juhudi-erp.com
```

**If using IP address only:**
- Skip SSL for now
- Use HTTP only
- Can add SSL later with domain

---

## Part 6: Generate API Keys (5 minutes)

### Step 1: Login to ERPNext

1. Go to: `http://YOUR_IP_ADDRESS`
2. Login with admin credentials

### Step 2: Create API User

1. Go to: **User** (search in awesome bar)
2. Click **"New"**
3. Create API user:
   - Email: `api@juhudi.local`
   - First Name: `API`
   - Last Name: `User`
   - Send Welcome Email: No
   - User Type: System User
   - **Add Roles:**
     - System Manager
     - Sales Manager
     - Stock Manager

4. Click **Save**

### Step 3: Generate API Keys

1. While viewing the API user
2. Scroll to **"API Access"** section
3. Click **"Generate Keys"**
4. **COPY BOTH:**
   - API Key: `abc123def456...`
   - API Secret: `xyz789ghi012...`

**SAVE THESE - You'll need them for Windows integration!**

---

## Part 7: Configure Windows Integration (5 minutes)

### Step 1: Update .env on Windows

```powershell
# On your Windows machine
cd C:\Users\Administrator\Documents\ERP\Juhudi-ERPNext-V16-main
notepad .env
```

Update with your cloud ERPNext details:

```bash
# ERPNext Cloud Configuration
ERPNEXT_URL=http://YOUR_DROPLET_IP
ERPNEXT_API_KEY=paste_your_api_key_here
ERPNEXT_API_SECRET=paste_your_api_secret_here
ERPNEXT_COMPANY=Juhudi Smart Solutions

# MSSQL Configuration (same as before)
MSSQL_SERVER=85.190.241.118
MSSQL_PORT=1433
MSSQL_DATABASE=TEST_ERP
MSSQL_USER=sa
MSSQL_PASSWORD=P~w2yvkm1UIhn2nm
MSSQL_ENCRYPT=false
MSSQL_TRUST_SERVER_CERTIFICATE=true
```

Save and close.

### Step 2: Install Node.js on Windows (if not done)

1. Download: https://nodejs.org/
2. Install LTS version
3. Check "Add to PATH"
4. Restart PowerShell

### Step 3: Install Dependencies

```powershell
cd C:\Users\Administrator\Documents\ERP\Juhudi-ERPNext-V16-main
npm install
```

### Step 4: Test Connection

```powershell
# Test ERPNext connection
node test_connection.js

# Test MSSQL connection
node test_mssql_connection.js
```

Both should show **"✅ Connected successfully"**

### Step 5: Run First Sync

```powershell
node mssql_sync_all_fields.js
```

This will sync:
- 860 customers from MSSQL → Cloud ERPNext
- 632 invoices from MSSQL → Cloud ERPNext

Takes about 1-2 minutes.

### Step 6: Verify in ERPNext

1. Go to cloud ERPNext: `http://YOUR_IP`
2. Navigate to **Customer** list
3. You should see 860+ customers!
4. Navigate to **Sales Invoice** list
5. You should see 632+ invoices!

---

## Part 8: Setup Automatic Sync (5 minutes)

### On Windows Machine:

```powershell
# Install PM2 for Windows
npm install -g pm2 pm2-windows-service

# Start sync service
pm2 start mssql_sync_all_fields.js --name "mssql-sync"

# Save configuration
pm2 save

# Setup to start on Windows boot
pm2-service-install
# Accept defaults when prompted

# Verify running
pm2 status
pm2 logs mssql-sync
```

Now syncs automatically every 5 minutes!

---

## Part 9: Access Your ERPNext

### URLs:

**Web Interface:**
- URL: `http://YOUR_DROPLET_IP`
- Example: `http://159.89.164.233`

**From Anywhere:**
- Access from home, office, mobile
- Share with team members

**Mobile App:**
- Download ERPNext mobile app
- Enter your server URL
- Login with credentials

---

## Management Commands

### Manage Droplet

```bash
# SSH into server
ssh root@YOUR_IP

# Check ERPNext status
sudo supervisorctl status all

# Restart ERPNext
sudo supervisorctl restart all

# View logs
tail -f /home/frappe/frappe-bench/logs/web.log

# Backup
cd /home/frappe/frappe-bench
bench --site site1.local backup --with-files
```

### Manage Sync (Windows)

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

---

## Backup and Maintenance

### Automated Backups

DigitalOcean offers automated backups:

1. Go to droplet → **Backups**
2. Click **"Enable Backups"**
3. Cost: +20% of droplet price ($4.80/month for $24 droplet)
4. Weekly automated snapshots

### Manual Backup

```bash
# SSH into server
ssh root@YOUR_IP

# Create backup
cd /home/frappe/frappe-bench
bench --site site1.local backup --with-files

# Backups stored in:
# /home/frappe/frappe-bench/sites/site1.local/private/backups/

# Download backup to Windows
# Use WinSCP or FileZilla
```

### Restore Backup

```bash
# SSH into server
ssh root@YOUR_IP

# Restore
cd /home/frappe/frappe-bench
bench --site site1.local restore /path/to/backup.sql.gz
```

---

## Upgrade ERPNext

```bash
# SSH into server
ssh root@YOUR_IP

# Update bench
cd /home/frappe/frappe-bench
bench update

# Migrate site
bench --site site1.local migrate
```

---

## Costs Summary

| Item | Cost | Notes |
|------|------|-------|
| **Droplet (4GB)** | $24/month | Recommended for production |
| **Backups** | $4.80/month | Optional but recommended |
| **Domain** | $12/year | Optional (use IP if not) |
| **SSL Certificate** | FREE | Let's Encrypt |
| **Total** | ~$24-29/month | Professional setup |

**First 60 days:** FREE with $200 credit!

---

## Scaling

### If You Need More Power:

1. Go to droplet → **Resize**
2. Choose larger plan:
   - 8GB RAM: $48/month
   - 16GB RAM: $96/month
3. Click **Resize**
4. Takes 1-2 minutes
5. No data loss, no downtime

---

## Monitoring

### DigitalOcean Dashboard:

- CPU usage
- Memory usage
- Bandwidth
- Disk I/O

### ERPNext System Health:

1. Login to ERPNext
2. Search: **System Health Report**
3. View server stats

---

## Troubleshooting

### Can't access ERPNext

1. Check droplet is running (DigitalOcean dashboard)
2. Check firewall allows port 8000
3. Try: `http://IP:8000` instead of `http://IP`

### Sync fails from Windows

1. Verify .env has correct IP
2. Test: `curl http://YOUR_IP`
3. Check Windows firewall allows outbound

### ERPNext slow

1. Check droplet resources
2. Upgrade to larger plan if needed
3. Check database size

---

## Security Best Practices

1. **Change default passwords**
2. **Enable firewall** (done in setup)
3. **Regular backups** (enable automated)
4. **Keep updated:** `bench update` monthly
5. **Use SSL** if using domain
6. **Strong API passwords**

---

## What You'll Have After Setup

✅ **Professional ERPNext in Cloud**
  - Accessible from anywhere
  - Fast and reliable
  - Automatic backups

✅ **Windows Integration Working**
  - Syncs MSSQL data automatically
  - 860 customers synced
  - 632 invoices synced
  - Runs every 5 minutes

✅ **Team Access**
  - Create users in ERPNext
  - Share URL with team
  - Mobile app access

✅ **Production Ready**
  - Scalable
  - Secure
  - Monitored

---

## Next Steps After Setup

1. **Add more users:** User → New
2. **Configure settings:** Setup → Company
3. **Sync more data:** Bills, Payments, Connections
4. **Train team:** ERPNext tutorials
5. **Customize:** Add custom fields, reports

---

## Support Resources

**DigitalOcean:**
- Docs: https://docs.digitalocean.com/
- Community: https://www.digitalocean.com/community
- Support: support@digitalocean.com

**ERPNext:**
- Forum: https://discuss.erpnext.com/
- Docs: https://docs.erpnext.com/
- YouTube: ERPNext tutorials

---

## Quick Start Checklist

- [ ] DigitalOcean account created
- [ ] Payment method added
- [ ] Droplet created (4GB recommended)
- [ ] ERPNext marketplace image selected
- [ ] Droplet IP address copied
- [ ] Waited 10 minutes for installation
- [ ] Accessed ERPNext at `http://IP`
- [ ] Completed setup wizard
- [ ] Created API user
- [ ] Generated API keys
- [ ] Updated .env on Windows
- [ ] Tested connection from Windows
- [ ] Ran first sync
- [ ] Verified data in cloud ERPNext
- [ ] Setup PM2 auto-sync

**Total Time:** 30-45 minutes  
**Result:** Professional cloud ERPNext + Windows integration working!

---

**Ready to start?** Let me know when you create your DigitalOcean account and I'll guide you through each step!
