# ERPNext Node.js Integration Guide

Complete Node.js integration for inserting data into ERPNext's Customer, Sales Invoice, Purchase Invoice (Bills), and Support Ticket tables.

---

## 📋 Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Configuration](#configuration)
3. [Usage Examples](#usage-examples)
4. [API Functions Reference](#api-functions-reference)
5. [Database Tables](#database-tables)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup Instructions

### Step 1: Install Node.js Dependencies

```bash
npm install axios
# Optional: for environment variables
npm install dotenv
```

Or use the provided package.json:

```bash
npm install
```

### Step 2: Generate API Keys in ERPNext

1. Login to ERPNext at `http://localhost:8000`
2. Go to: **User** → Select your user (e.g., Administrator)
3. Scroll to **API Access** section
4. Click **Generate Keys**
5. Copy the **API Key** and **API Secret**

### Step 3: Configure the Script

Open `erpnext_integration.js` and update the configuration:

```javascript
const config = {
    baseUrl: 'http://localhost:8000',
    apiKey: 'YOUR_API_KEY',          // Paste your API key
    apiSecret: 'YOUR_API_SECRET'      // Paste your API secret
};
```

Or create a `.env` file (recommended):

```bash
cp .env.example .env
# Edit .env with your credentials
```

Then modify the script to use dotenv:

```javascript
require('dotenv').config();

const config = {
    baseUrl: process.env.ERPNEXT_URL || 'http://localhost:8000',
    apiKey: process.env.ERPNEXT_API_KEY,
    apiSecret: process.env.ERPNEXT_API_SECRET
};
```

### Step 4: Run the Script

```bash
node erpnext_integration.js
```

Expected output:
```
🚀 Starting ERPNext Integration Demo...

📋 Creating Customer...
✅ Customer created successfully: CUST-00001
Customer ID: CUST-00001

📦 Creating Items...
✅ Item created successfully: PROD-001
✅ Item created successfully: PROD-002

💰 Creating Sales Invoice...
✅ Sales Invoice created successfully: SINV-00001
Sales Invoice ID: SINV-00001

... etc
```

---

## ⚙️ Configuration

### Required Configuration

| Parameter | Description | Example |
|-----------|-------------|---------|
| `baseUrl` | Your ERPNext instance URL | `http://localhost:8000` |
| `apiKey` | API Key from ERPNext | `abc123def456...` |
| `apiSecret` | API Secret from ERPNext | `xyz789ghi012...` |

### Optional Configuration

You may need to update these based on your ERPNext setup:

```javascript
// Company name (must match your ERPNext company)
const DEFAULT_COMPANY = 'Your Company';

// Default customer group
const DEFAULT_CUSTOMER_GROUP = 'Commercial';

// Default territory
const DEFAULT_TERRITORY = 'All Territories';

// Expense account for purchase invoices
const DEFAULT_EXPENSE_ACCOUNT = 'Cost of Goods Sold - YC';
```

---

## 📖 Usage Examples

### Example 1: Create a Single Customer

```javascript
const { createCustomer } = require('./erpnext_integration');

async function createMyCustomer() {
    const customer = await createCustomer({
        customer_name: 'Tech Solutions Inc',
        customer_type: 'Company',
        customer_group: 'Commercial',
        territory: 'United States',
        email: 'info@techsolutions.com',
        mobile: '+1-555-1234',
        website: 'https://techsolutions.com',
        tax_id: 'TAX-98765',
        external_id: 'CRM-12345'
    });
    
    console.log('Created customer:', customer.name);
}

createMyCustomer();
```

### Example 2: Create Sales Invoice

```javascript
const { createSalesInvoice } = require('./erpnext_integration');

async function createMyInvoice() {
    const invoice = await createSalesInvoice({
        customer: 'CUST-00001',                    // Use existing customer ID
        company: 'Your Company',
        posting_date: '2024-02-28',
        due_date: '2024-03-15',
        currency: 'USD',
        items: [
            {
                item_code: 'PROD-001',
                quantity: 5,
                rate: 100.00,
                description: 'Premium Product'
            },
            {
                item_code: 'PROD-002',
                quantity: 10,
                rate: 50.00,
                description: 'Standard Product'
            }
        ],
        remarks: 'Monthly invoice',
        po_number: 'PO-2024-001',
        external_id: 'EXTERNAL-INV-123'
    });
    
    console.log('Created invoice:', invoice.name);
    console.log('Total amount:', invoice.grand_total);
}

createMyInvoice();
```

### Example 3: Create Purchase Invoice (Bill)

```javascript
const { createPurchaseInvoice } = require('./erpnext_integration');

async function createMyBill() {
    const bill = await createPurchaseInvoice({
        supplier: 'SUP-00001',                     // Use existing supplier ID
        company: 'Your Company',
        posting_date: '2024-02-28',
        due_date: '2024-03-15',
        bill_number: 'VENDOR-BILL-001',
        bill_date: '2024-02-28',
        currency: 'USD',
        items: [
            {
                item_code: 'PROD-001',
                quantity: 100,
                rate: 75.00,
                description: 'Bulk purchase',
                expense_account: 'Cost of Goods Sold - YC'
            }
        ],
        remarks: 'Inventory restock',
        external_id: 'EXTERNAL-BILL-456'
    });
    
    console.log('Created bill:', bill.name);
}

createMyBill();
```

### Example 4: Create Support Ticket

```javascript
const { createSupportTicket } = require('./erpnext_integration');

async function createMyTicket() {
    const ticket = await createSupportTicket({
        subject: 'Unable to login to customer portal',
        email: 'customer@example.com',
        customer: 'CUST-00001',
        description: `Customer reports the following issue:
        
- Cannot access customer portal
- Reset password link not working
- Urgent - needs to download invoices

Please investigate and resolve ASAP.`,
        status: 'Open',
        priority: 'High',
        issue_type: 'Technical Support',
        assigned_to: 'support@yourcompany.com',
        external_id: 'ZENDESK-12345'
    });
    
    console.log('Created ticket:', ticket.name);
}

createMyTicket();
```

### Example 5: Bulk Create Customers

```javascript
const { bulkCreateCustomers } = require('./erpnext_integration');

async function importCustomers() {
    const customers = [
        {
            customer_name: 'Customer One',
            customer_type: 'Company',
            email: 'one@example.com',
            mobile: '+1-555-0001'
        },
        {
            customer_name: 'Customer Two',
            customer_type: 'Individual',
            email: 'two@example.com',
            mobile: '+1-555-0002'
        },
        {
            customer_name: 'Customer Three',
            customer_type: 'Company',
            email: 'three@example.com',
            mobile: '+1-555-0003'
        }
    ];
    
    const { results, errors } = await bulkCreateCustomers(customers);
    
    console.log(`✅ Successfully created: ${results.length}`);
    console.log(`❌ Failed: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('Errors:', errors);
    }
}

importCustomers();
```

### Example 6: Search/List Customers

```javascript
const { listCustomers } = require('./erpnext_integration');

async function findCustomers() {
    // Get all company-type customers
    const companies = await listCustomers(
        { customer_type: 'Company' },
        limit: 50
    );
    
    console.log('Found companies:', companies.length);
    companies.forEach(c => {
        console.log(`- ${c.name}: ${c.customer_name}`);
    });
}

findCustomers();
```

### Example 7: Complete Workflow - Order Processing

```javascript
async function processOrder(orderData) {
    try {
        // Step 1: Create or get customer
        let customer;
        try {
            customer = await getDocument('Customer', orderData.customer_email);
        } catch {
            customer = await createCustomer({
                customer_name: orderData.customer_name,
                customer_type: 'Individual',
                email: orderData.customer_email,
                mobile: orderData.customer_phone
            });
        }
        
        // Step 2: Create sales invoice
        const invoice = await createSalesInvoice({
            customer: customer.name,
            company: 'Your Company',
            items: orderData.items,
            remarks: `Order from website - Order ID: ${orderData.order_id}`
        });
        
        // Step 3: Submit the invoice (make it official)
        await submitDocument('Sales Invoice', invoice.name);
        
        // Step 4: Create a support ticket for order confirmation
        await createSupportTicket({
            subject: `Order Confirmation - ${invoice.name}`,
            email: customer.email_id,
            customer: customer.name,
            description: `Order placed successfully. Invoice: ${invoice.name}`,
            status: 'Closed',
            priority: 'Low',
            issue_type: 'Order Confirmation'
        });
        
        return {
            success: true,
            customer_id: customer.name,
            invoice_id: invoice.name,
            total: invoice.grand_total
        };
        
    } catch (error) {
        console.error('Order processing failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Usage
processOrder({
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+1-555-9999',
    order_id: 'WEB-ORDER-001',
    items: [
        { item_code: 'PROD-001', quantity: 2, rate: 100 }
    ]
}).then(result => console.log(result));
```

---

## 📚 API Functions Reference

### Core Functions

#### `createCustomer(customerData)`
Creates a new customer in ERPNext.

**Parameters:**
- `customer_name` (string, required): Customer name
- `customer_type` (string): 'Company' or 'Individual'
- `customer_group` (string): Customer group
- `territory` (string): Territory/region
- `email` (string): Email address
- `mobile` (string): Mobile number
- `website` (string): Website URL
- `tax_id` (string): Tax identification number
- `external_id` (string): External system ID

**Returns:** Customer object with `name` (ID)

---

#### `createSalesInvoice(invoiceData)`
Creates a sales invoice.

**Parameters:**
- `customer` (string, required): Customer ID
- `company` (string, required): Company name
- `posting_date` (string): Date in YYYY-MM-DD format
- `due_date` (string): Due date in YYYY-MM-DD format
- `currency` (string): Currency code (USD, EUR, etc.)
- `items` (array, required): Array of item objects
  - `item_code` (string): Item ID
  - `quantity` (number): Quantity
  - `rate` (number): Unit price
  - `description` (string): Item description
- `remarks` (string): Additional notes
- `po_number` (string): Purchase order number
- `external_id` (string): External invoice ID

**Returns:** Sales Invoice object

---

#### `createPurchaseInvoice(billData)`
Creates a purchase invoice (bill from supplier).

**Parameters:**
- `supplier` (string, required): Supplier ID
- `company` (string, required): Company name
- `posting_date` (string): Posting date
- `due_date` (string): Payment due date
- `bill_number` (string): Supplier's bill number
- `bill_date` (string): Bill date
- `currency` (string): Currency code
- `items` (array, required): Array of item objects
- `remarks` (string): Notes
- `external_id` (string): External bill ID

**Returns:** Purchase Invoice object

---

#### `createSupportTicket(ticketData)`
Creates a support ticket (Issue).

**Parameters:**
- `subject` (string, required): Ticket subject
- `email` (string): Customer email
- `customer` (string): Customer ID
- `description` (string): Detailed description
- `status` (string): 'Open', 'Replied', 'Closed'
- `priority` (string): 'Low', 'Medium', 'High', 'Urgent'
- `issue_type` (string): Type of issue
- `assigned_to` (string): User to assign
- `external_id` (string): External ticket ID

**Returns:** Issue object

---

### Utility Functions

#### `createDocument(doctype, data)`
Generic function to create any document type.

#### `getDocument(doctype, name)`
Get a document by its ID.

#### `updateDocument(doctype, name, data)`
Update an existing document.

#### `submitDocument(doctype, name)`
Submit a document (change status from Draft to Submitted).

#### `getOrCreateItem(itemData)`
Get existing item or create if doesn't exist.

#### `getOrCreateSupplier(supplierData)`
Get existing supplier or create if doesn't exist.

#### `bulkCreateCustomers(customersArray)`
Create multiple customers in one operation.

#### `listCustomers(filters, limit)`
Search and list customers with filters.

#### `getCustomerDetails(customerId)`
Get complete customer details with related invoices.

---

## 🗄️ Database Tables

Your data is stored in the MariaDB database: `_435e0475cf331d3a`

### Table Mappings

| ERPNext DocType | Database Table | Description |
|----------------|---------------|-------------|
| Customer | `tabCustomer` | Customer master data |
| Sales Invoice | `tabSales Invoice` | Sales invoices |
| Sales Invoice Item | `tabSales Invoice Item` | Invoice line items |
| Purchase Invoice | `tabPurchase Invoice` | Purchase bills |
| Purchase Invoice Item | `tabPurchase Invoice Item` | Bill line items |
| Issue | `tabIssue` | Support tickets |
| Item | `tabItem` | Product/service catalog |
| Supplier | `tabSupplier` | Supplier master data |

### Common Fields

All documents have these standard fields:

- `name`: Unique document ID (e.g., CUST-00001)
- `creation`: Timestamp when created
- `modified`: Last modified timestamp
- `owner`: User who created the document
- `modified_by`: User who last modified
- `docstatus`: 0=Draft, 1=Submitted, 2=Cancelled

### Direct Database Access (Advanced)

If you need to query the database directly:

```javascript
const mysql = require('mysql2/promise');

const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 1905,
    user: '_435e0475cf331d3a',
    password: 'SfiZ3BKz7sd0ZRKJ',
    database: '_435e0475cf331d3a'
});

// Query customers
const [rows] = await connection.execute(
    'SELECT name, customer_name, email_id FROM `tabCustomer` LIMIT 10'
);
console.log(rows);
```

**⚠️ Warning:** Direct database manipulation bypasses ERPNext's validation and business logic. Always use the API when possible.

---

## 🔧 Troubleshooting

### Error: "Authentication failed"

**Solution:** Verify your API keys are correct:

```javascript
// Test your API credentials
async function testAuth() {
    try {
        const response = await erpnextAPI.get('/api/method/frappe.auth.get_logged_user');
        console.log('✅ Authenticated as:', response.data.message);
    } catch (error) {
        console.error('❌ Authentication failed:', error.response?.data);
    }
}
```

### Error: "Customer does not exist"

**Solution:** Make sure the customer ID exists before creating invoices:

```javascript
// Check if customer exists
const customerExists = await erpnextAPI.get(`/api/resource/Customer/CUST-00001`)
    .then(() => true)
    .catch(() => false);

if (!customerExists) {
    console.log('Customer not found, creating...');
    await createCustomer({...});
}
```

### Error: "Item does not exist"

**Solution:** Create items before using them in invoices:

```javascript
await getOrCreateItem({
    item_code: 'PROD-001',
    item_name: 'My Product',
    item_group: 'Products',
    rate: 100.00
});
```

### Error: "Company does not exist"

**Solution:** Check your company name matches ERPNext:

```bash
# Login to ERPNext and check: Setup → Company
# Use the exact company name in your scripts
```

### Error: "Cannot submit document"

**Solution:** Some documents require mandatory fields before submission:

```javascript
// First create in draft mode
const invoice = await createSalesInvoice({...});

// Verify all fields are filled
const doc = await getDocument('Sales Invoice', invoice.name);
console.log(doc);

// Then submit
await submitDocument('Sales Invoice', invoice.name);
```

### Debugging Tips

Enable detailed logging:

```javascript
// Add request/response interceptors
erpnextAPI.interceptors.request.use(request => {
    console.log('Request:', request.method.toUpperCase(), request.url);
    console.log('Data:', request.data);
    return request;
});

erpnextAPI.interceptors.response.use(
    response => {
        console.log('Response:', response.status, response.data);
        return response;
    },
    error => {
        console.error('Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
```

---

## 📝 Complete Example Script

See `erpnext_integration.js` for a complete working example that demonstrates:

✅ Creating customers  
✅ Creating items  
✅ Creating sales invoices  
✅ Creating purchase invoices  
✅ Creating suppliers  
✅ Creating support tickets  
✅ Error handling  
✅ Bulk operations  

Run it with:
```bash
node erpnext_integration.js
```

---

## 🔗 Related Documentation

- [ERPNext API Documentation](https://frappeframework.com/docs/user/en/api)
- [Frappe REST API Guide](https://frappeframework.com/docs/user/en/guides/integration/rest_api)
- [ERPNext Developer Guide](https://frappeframework.com/docs/user/en/guides/app-development)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review ERPNext logs: `tail -f logs/web.log`
3. Check error logs: `tail -f logs/worker.error.log`
4. Visit ERPNext forums: https://discuss.erpnext.com

---

## 📄 License

MIT License - Feel free to use and modify for your integration needs.
