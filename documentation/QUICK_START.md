# Quick Start Guide - Node.js ERPNext Integration

## ✅ Setup Complete!

Your Node.js integration with ERPNext is fully configured and tested.

---

## 📦 What's Installed

- ✅ Node.js dependencies (axios, dotenv)
- ✅ API credentials configured
- ✅ Connection tested and working
- ✅ Sample data created successfully

---

## 🔑 Your API Credentials

**API Key:** `19d191b417cbf4a`  
**API Secret:** `4e18f78cd5b3d6c`  
**Database:** `_435e0475cf331d3a` (MariaDB on port 1905)  
**Company:** `Juhudi Smart Solutions`

These are stored in `.env` file (not committed to git).

---

## 🚀 Available Scripts

### 1. Test Connection
```bash
node test_connection.js
```
Verifies your API connection and shows system info.

### 2. Run Full Integration Demo
```bash
node erpnext_integration.js
```
Creates sample customers, invoices, bills, and support tickets.

---

## 📊 Successfully Tested Operations

### ✅ Customers (→ `tabCustomer`)
```javascript
const { createCustomer } = require('./erpnext_integration');

await createCustomer({
    customer_name: 'Acme Corporation Ltd',
    customer_type: 'Company',
    customer_group: 'Commercial',
    territory: 'Kenya',
    email_id: 'contact@acmecorp.co.ke',
    mobile_no: '+254-712-345678'
});
```

### ✅ Sales Invoices (→ `tabSales Invoice`)
```javascript
const { createSalesInvoice } = require('./erpnext_integration');

await createSalesInvoice({
    customer: 'Acme Corporation Ltd - 1',
    company: 'Juhudi Smart Solutions',
    posting_date: '2026-02-28',
    due_date: '2026-03-15',
    items: [
        {
            item_code: 'PROD-TEST-001',
            qty: 5,
            rate: 1000.00,
            description: 'Test Product'
        }
    ]
});
```

### ✅ Purchase Invoices/Bills (→ `tabPurchase Invoice`)
```javascript
const { createPurchaseInvoice } = require('./erpnext_integration');

await createPurchaseInvoice({
    supplier: 'Global Supplies Kenya Ltd',
    company: 'Juhudi Smart Solutions',
    posting_date: '2026-02-28',
    due_date: '2026-03-15',
    bill_no: 'VENDOR-BILL-001',
    items: [
        {
            item_code: 'PROD-TEST-001',
            qty: 20,
            rate: 750.00
        }
    ]
});
```

### ✅ Support Tickets (→ `tabIssue`)
```javascript
const { createSupportTicket } = require('./erpnext_integration');

await createSupportTicket({
    subject: 'Product inquiry',
    raised_by: 'customer@email.com',
    customer: 'Acme Corporation Ltd - 1',
    description: 'Customer needs help...',
    status: 'Open',
    priority: 'Medium'
});
```

---

## 🗄️ Database Tables

Your data is stored in MariaDB database: `_435e0475cf331d3a`

| DocType | Database Table | What You Created |
|---------|---------------|------------------|
| Customer | `tabCustomer` | Acme Corporation Ltd - 1 |
| Item | `tabItem` | PROD-TEST-001 |
| Sales Invoice | `tabSales Invoice` | ACC-SINV-2026-00001 |
| Supplier | `tabSupplier` | Global Supplies Kenya Ltd |
| Purchase Invoice | `tabPurchase Invoice` | ACC-PINV-2026-00001 |
| Issue (Support Ticket) | `tabIssue` | ISS-2026-00001 |

---

## 🌐 View Your Data

Open ERPNext in your browser:
```
http://localhost:8000
```

**Login Credentials:**
- Username: `Administrator`
- Password: (your admin password)

### Navigate to:
- **Customers:** CRM → Customer
- **Sales Invoices:** Accounts → Sales Invoice
- **Purchase Invoices:** Accounts → Purchase Invoice
- **Support Tickets:** Support → Issue
- **Items:** Stock → Item

---

## 📝 Your ERPNext Setup

### Available Territories:
- All Territories
- Kenya
- Rest Of The World

### Available Customer Groups:
- All Customer Groups
- Individual
- Commercial
- Non Profit
- Government

### Company:
- Juhudi Smart Solutions

**Important:** Always use these exact values when creating records!

---

## 🔧 Common Operations

### Create a Customer
```bash
node -e "
const { createCustomer } = require('./erpnext_integration');
createCustomer({
  customer_name: 'New Customer',
  customer_type: 'Company',
  customer_group: 'Commercial',
  territory: 'Kenya',
  email_id: 'customer@example.com'
}).then(console.log);
"
```

### List All Customers
```bash
node -e "
const { listCustomers } = require('./erpnext_integration');
listCustomers({}, 20).then(customers => {
  customers.forEach(c => console.log(c.name, '-', c.customer_name));
});
"
```

---

## 📚 Documentation Files

1. **`erpnext_integration.js`** - Main integration script with all functions
2. **`test_connection.js`** - Test your API connection
3. **`NODEJS_INTEGRATION_README.md`** - Complete documentation
4. **`ERPNEXT_INTEGRATION_GUIDE.md`** - Integration points guide
5. **`CUSTOM_APP_INTEGRATION_GUIDE.md`** - Custom app development guide
6. **`package.json`** - Node.js dependencies
7. **`.env`** - Your API credentials (secure, not in git)

---

## 🎯 Next Steps

1. **Explore the integration script:**
   ```bash
   cat erpnext_integration.js
   ```

2. **Read the full documentation:**
   ```bash
   cat NODEJS_INTEGRATION_README.md
   ```

3. **Build your own integration:**
   - Copy functions from `erpnext_integration.js`
   - Modify for your use case
   - Test with `node your_script.js`

4. **Learn about all integration points:**
   ```bash
   cat ERPNEXT_INTEGRATION_GUIDE.md
   ```

---

## 🆘 Troubleshooting

### Connection Issues
```bash
node test_connection.js
```

### Check Logs
```bash
tail -f logs/web.log
tail -f logs/worker.error.log
```

### Verify Database
```bash
bench --site localhost mariadb
```

---

## 🔒 Security Notes

- API keys are in `.env` (already in `.gitignore`)
- Never commit API credentials to version control
- Regenerate keys if compromised
- Use HTTPS in production

---

## ✨ Summary

You now have a fully working Node.js integration that can:

✅ Insert into Customers table (`tabCustomer`)  
✅ Insert into Sales Invoices table (`tabSales Invoice`)  
✅ Insert into Purchase Invoices/Bills table (`tabPurchase Invoice`)  
✅ Insert into Support Tickets table (`tabIssue`)  
✅ Insert into Items table (`tabItem`)  
✅ Insert into Suppliers table (`tabSupplier`)  

All data is stored in MariaDB database: **_435e0475cf331d3a**

---

**Need help?** Check `NODEJS_INTEGRATION_README.md` for detailed examples and troubleshooting!
