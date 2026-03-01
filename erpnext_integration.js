/**
 * ERPNext Integration Script - Node.js
 * 
 * This script demonstrates how to insert data into:
 * - Customers
 * - Sales Invoices
 * - Purchase Invoices (Bills)
 * - Support Tickets (Issues)
 * 
 * Requirements:
 * npm install axios
 */

const axios = require('axios');

// Configuration - Load from .env file
try {
    require('dotenv').config();
} catch (e) {
    console.log('dotenv not available, using direct config');
}

const config = {
    baseUrl: process.env.ERPNEXT_URL || 'http://localhost:8000',
    apiKey: process.env.ERPNEXT_API_KEY || 'YOUR_API_KEY',
    apiSecret: process.env.ERPNEXT_API_SECRET || 'YOUR_API_SECRET',
    company: process.env.ERPNEXT_COMPANY || 'Juhudi Smart Solutions'
};

// ============================================================================
// DEBUG: Environment Detection & Target Configuration
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('🔍 DEBUG: Environment Detection & Configuration');
console.log('='.repeat(70));
console.log('\n📋 Environment Variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  ERPNEXT_URL: ${process.env.ERPNEXT_URL || 'not set (using default)'}`);
console.log(`  ERPNEXT_API_KEY: ${process.env.ERPNEXT_API_KEY ? 'set (' + process.env.ERPNEXT_API_KEY.substring(0, 10) + '...)' : 'not set (using default)'}`);
console.log(`  ERPNEXT_API_SECRET: ${process.env.ERPNEXT_API_SECRET ? 'set (' + process.env.ERPNEXT_API_SECRET.substring(0, 10) + '...)' : 'not set (using default)'}`);
console.log(`  ERPNEXT_COMPANY: ${process.env.ERPNEXT_COMPANY || 'not set (using default)'}`);
console.log('\n🎯 Detected Target Configuration:');
console.log(`  Target URL: ${config.baseUrl}`);
console.log(`  Target Company: ${config.company}`);
console.log(`  Using API Key: ${config.apiKey.substring(0, 15)}...`);
console.log(`  Using API Secret: ${config.apiSecret.substring(0, 15)}...`);
console.log(`  Source: ${process.env.ERPNEXT_URL ? 'Environment Variable' : 'Default Fallback'}`);
console.log('='.repeat(70) + '\n');

// Create axios instance with default config
const erpnextAPI = axios.create({
    baseURL: config.baseUrl,
    headers: {
        'Authorization': `token ${config.apiKey}:${config.apiSecret}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Generic function to create a document in ERPNext
 */
async function createDocument(doctype, data) {
    try {
        const response = await erpnextAPI.post(`/api/resource/${doctype}`, data);
        console.log(`✅ ${doctype} created successfully:`, response.data.data.name);
        return response.data.data;
    } catch (error) {
        console.error(`❌ Error creating ${doctype}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Generic function to get a document from ERPNext
 */
async function getDocument(doctype, name) {
    try {
        const response = await erpnextAPI.get(`/api/resource/${doctype}/${name}`);
        return response.data.data;
    } catch (error) {
        console.error(`❌ Error getting ${doctype}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Generic function to update a document in ERPNext
 */
async function updateDocument(doctype, name, data) {
    try {
        const response = await erpnextAPI.put(`/api/resource/${doctype}/${name}`, data);
        console.log(`✅ ${doctype} updated successfully:`, name);
        return response.data.data;
    } catch (error) {
        console.error(`❌ Error updating ${doctype}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * 1. CREATE CUSTOMER
 */
async function createCustomer(customerData) {
    const data = {
        customer_name: customerData.customer_name,
        customer_type: customerData.customer_type || 'Company', // 'Company' or 'Individual'
        customer_group: customerData.customer_group || 'Commercial',
        territory: customerData.territory || 'All Territories',
        email_id: customerData.email,
        mobile_no: customerData.mobile,
        website: customerData.website || '',
        tax_id: customerData.tax_id || '',
        // Custom fields if you have them
        custom_external_id: customerData.external_id || ''
    };

    return await createDocument('Customer', data);
}

/**
 * 2. CREATE SALES INVOICE
 */
async function createSalesInvoice(invoiceData) {
    const data = {
        customer: invoiceData.customer,                    // Customer ID (e.g., 'CUST-00001')
        company: invoiceData.company || 'Your Company',    // Your company name
        posting_date: invoiceData.posting_date || new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date || new Date().toISOString().split('T')[0],
        currency: invoiceData.currency || 'KES',
        
        // Invoice items (array of items)
        items: invoiceData.items.map(item => ({
            item_code: item.item_code,              // Item ID
            qty: item.quantity || 1,
            rate: item.rate || 0,
            description: item.description || '',
            uom: item.uom || 'Nos'                  // Unit of Measurement
        })),
        
        // Payment terms (optional)
        payment_terms_template: invoiceData.payment_terms || '',
        
        // Additional fields
        remarks: invoiceData.remarks || '',
        po_no: invoiceData.po_number || '',
        po_date: invoiceData.po_date || '',
        
        // Tax and charges (optional)
        taxes_and_charges: invoiceData.tax_template || '',
        
        // Custom fields
        custom_external_invoice_id: invoiceData.external_id || ''
    };

    return await createDocument('Sales Invoice', data);
}

/**
 * 3. CREATE PURCHASE INVOICE (BILL)
 */
async function createPurchaseInvoice(billData) {
    const data = {
        supplier: billData.supplier,                       // Supplier ID (e.g., 'SUP-00001')
        company: billData.company || 'Your Company',
        posting_date: billData.posting_date || new Date().toISOString().split('T')[0],
        due_date: billData.due_date || new Date().toISOString().split('T')[0],
        currency: billData.currency || 'KES',
        bill_no: billData.bill_number || '',              // Supplier's bill number
        bill_date: billData.bill_date || new Date().toISOString().split('T')[0],
        
        // Bill items (array of items)
        items: billData.items.map(item => ({
            item_code: item.item_code,
            qty: item.quantity || 1,
            rate: item.rate || 0,
            description: item.description || '',
            uom: item.uom || 'Nos',
            expense_account: item.expense_account || 'Cost of Goods Sold - YC' // Adjust account
        })),
        
        // Additional fields
        remarks: billData.remarks || '',
        
        // Tax and charges (optional)
        taxes_and_charges: billData.tax_template || '',
        
        // Custom fields
        custom_external_bill_id: billData.external_id || ''
    };

    return await createDocument('Purchase Invoice', data);
}

/**
 * 4. CREATE SUPPORT TICKET (ISSUE)
 */
async function createSupportTicket(ticketData) {
    const data = {
        subject: ticketData.subject,
        raised_by: ticketData.email || '',                 // Customer email
        customer: ticketData.customer || '',               // Customer ID (optional)
        description: ticketData.description || '',
        status: ticketData.status || 'Open',               // Open, Replied, Closed, etc.
        priority: ticketData.priority || 'Medium',         // Low, Medium, High, Urgent
        issue_type: ticketData.issue_type || '',           // Custom issue types
        
        // Assignment
        assigned_to: ticketData.assigned_to || '',         // User email to assign
        
        // Additional fields
        via_customer_portal: 0,
        custom_external_ticket_id: ticketData.external_id || ''
    };

    return await createDocument('Issue', data);
}

/**
 * 5. SUBMIT A DOCUMENT (for Sales Invoice, Purchase Invoice, etc.)
 */
async function submitDocument(doctype, name) {
    try {
        const response = await erpnextAPI.post(
            `/api/resource/${doctype}/${name}`,
            { docstatus: 1 }  // 0 = Draft, 1 = Submitted, 2 = Cancelled
        );
        console.log(`✅ ${doctype} ${name} submitted successfully`);
        return response.data.data;
    } catch (error) {
        console.error(`❌ Error submitting ${doctype}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * 6. HELPER: Get or Create Item
 */
async function getOrCreateItem(itemData) {
    try {
        // Try to get existing item
        return await getDocument('Item', itemData.item_code);
    } catch (error) {
        // If item doesn't exist, create it
        console.log(`Item ${itemData.item_code} not found, creating...`);
        
        const data = {
            item_code: itemData.item_code,
            item_name: itemData.item_name,
            item_group: itemData.item_group || 'Products',
            stock_uom: itemData.uom || 'Nos',
            is_stock_item: itemData.is_stock_item || 0,
            is_sales_item: itemData.is_sales_item || 1,
            is_purchase_item: itemData.is_purchase_item || 1,
            standard_rate: itemData.rate || 0,
            opening_stock: itemData.opening_stock || 0,
            description: itemData.description || ''
        };
        
        return await createDocument('Item', data);
    }
}

/**
 * 7. HELPER: Get or Create Supplier
 */
async function getOrCreateSupplier(supplierData) {
    try {
        // Try to get existing supplier
        return await getDocument('Supplier', supplierData.supplier_name);
    } catch (error) {
        // If supplier doesn't exist, create it
        console.log(`Supplier ${supplierData.supplier_name} not found, creating...`);
        
        const data = {
            supplier_name: supplierData.supplier_name,
            supplier_group: supplierData.supplier_group || 'All Supplier Groups',
            supplier_type: supplierData.supplier_type || 'Company',
            country: supplierData.country || 'Kenya',
            email_id: supplierData.email || '',
            mobile_no: supplierData.mobile || ''
        };
        
        return await createDocument('Supplier', data);
    }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

async function main() {
    try {
        console.log('🚀 Starting ERPNext Integration Demo...\n');

        // -------------------------
        // 1. CREATE CUSTOMER
        // -------------------------
        console.log('📋 Creating Customer...');
        const customer = await createCustomer({
            customer_name: 'Acme Corporation',
            customer_type: 'Company',
            customer_group: 'Commercial',
            territory: 'Kenya',
            email: 'contact@acmecorp.com',
            mobile: '+1-555-0100',
            website: 'https://acmecorp.com',
            tax_id: 'TAX-12345',
            external_id: 'EXT-CUST-001'
        });
        console.log('Customer ID:', customer.name);
        console.log('');

        // -------------------------
        // 2. CREATE ITEMS
        // -------------------------
        console.log('📦 Creating Items...');
        await getOrCreateItem({
            item_code: 'PROD-001',
            item_name: 'Premium Widget',
            item_group: 'Products',
            uom: 'Nos',
            is_sales_item: 1,
            is_purchase_item: 1,
            rate: 100.00,
            description: 'High-quality widget for industrial use'
        });

        await getOrCreateItem({
            item_code: 'PROD-002',
            item_name: 'Standard Gadget',
            item_group: 'Products',
            uom: 'Nos',
            is_sales_item: 1,
            is_purchase_item: 1,
            rate: 50.00,
            description: 'Standard gadget for everyday use'
        });
        console.log('');

        // -------------------------
        // 3. CREATE SALES INVOICE
        // -------------------------
        console.log('💰 Creating Sales Invoice...');
        const salesInvoice = await createSalesInvoice({
            customer: customer.name,
            company: config.company,
            posting_date: '2024-02-28',
            due_date: '2024-03-15',
            currency: 'KES',
            items: [
                {
                    item_code: 'PROD-001',
                    quantity: 5,
                    rate: 100.00,
                    description: 'Premium Widget - Bulk Order'
                },
                {
                    item_code: 'PROD-002',
                    quantity: 10,
                    rate: 50.00,
                    description: 'Standard Gadget'
                }
            ],
            remarks: 'First order from Acme Corporation',
            po_number: 'PO-2024-001',
            external_id: 'EXT-INV-001'
        });
        console.log('Sales Invoice ID:', salesInvoice.name);
        console.log('');

        // Submit the sales invoice (optional - makes it official)
        // console.log('📝 Submitting Sales Invoice...');
        // await submitDocument('Sales Invoice', salesInvoice.name);
        // console.log('');

        // -------------------------
        // 4. CREATE SUPPLIER
        // -------------------------
        console.log('🏭 Creating Supplier...');
        const supplier = await getOrCreateSupplier({
            supplier_name: 'Global Supplies Inc',
            supplier_group: 'All Supplier Groups',
            supplier_type: 'Company',
            country: 'Kenya',
            email: 'sales@globalsupplies.com',
            mobile: '+1-555-0200'
        });
        console.log('Supplier ID:', supplier.name);
        console.log('');

        // -------------------------
        // 5. CREATE PURCHASE INVOICE (BILL)
        // -------------------------
        console.log('📄 Creating Purchase Invoice (Bill)...');
        const purchaseInvoice = await createPurchaseInvoice({
            supplier: supplier.name,
            company: config.company,
            posting_date: '2024-02-28',
            due_date: '2024-03-15',
            bill_number: 'BILL-2024-001',
            bill_date: '2024-02-28',
            currency: 'KES',
            items: [
                {
                    item_code: 'PROD-001',
                    quantity: 20,
                    rate: 75.00,
                    description: 'Bulk purchase of widgets',
                    expense_account: 'Cost of Goods Sold - YC'  // Adjust to your chart of accounts
                }
            ],
            remarks: 'Monthly inventory purchase',
            external_id: 'EXT-BILL-001'
        });
        console.log('Purchase Invoice ID:', purchaseInvoice.name);
        console.log('');

        // -------------------------
        // 6. CREATE SUPPORT TICKET
        // -------------------------
        console.log('🎫 Creating Support Ticket...');
        const ticket = await createSupportTicket({
            subject: 'Product inquiry - Premium Widget specifications',
            email: 'contact@acmecorp.com',
            customer: customer.name,
            description: `Customer is requesting detailed specifications for PROD-001.
            
They want to know:
1. Dimensions and weight
2. Material composition
3. Warranty information
4. Bulk pricing options`,
            status: 'Open',
            priority: 'Medium',
            issue_type: 'Product Inquiry',
            external_id: 'EXT-TICKET-001'
        });
        console.log('Support Ticket ID:', ticket.name);
        console.log('');

        console.log('✅ All operations completed successfully!');
        
    } catch (error) {
        console.error('❌ Error in main execution:', error.message);
        process.exit(1);
    }
}

// ============================================================================
// ADDITIONAL UTILITY FUNCTIONS
// ============================================================================

/**
 * Bulk create customers from array
 */
async function bulkCreateCustomers(customersArray) {
    const results = [];
    const errors = [];
    
    for (const customerData of customersArray) {
        try {
            const customer = await createCustomer(customerData);
            results.push({ success: true, customer_id: customer.name, data: customerData });
        } catch (error) {
            errors.push({ success: false, error: error.message, data: customerData });
        }
    }
    
    return { results, errors };
}

/**
 * Search/List customers with filters
 */
async function listCustomers(filters = {}, limit = 20) {
    try {
        const params = new URLSearchParams({
            fields: JSON.stringify(['name', 'customer_name', 'customer_type', 'email_id', 'mobile_no']),
            limit_page_length: limit
        });
        
        if (Object.keys(filters).length > 0) {
            params.append('filters', JSON.stringify(filters));
        }
        
        const response = await erpnextAPI.get(`/api/resource/Customer?${params}`);
        return response.data.data;
    } catch (error) {
        console.error('❌ Error listing customers:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get customer with all details
 */
async function getCustomerDetails(customerId) {
    try {
        const customer = await getDocument('Customer', customerId);
        
        // Get outstanding invoices
        const invoices = await erpnextAPI.get(
            `/api/resource/Sales Invoice?filters=[["customer","=","${customerId}"]]`
        );
        
        return {
            customer,
            invoices: invoices.data.data
        };
    } catch (error) {
        console.error('❌ Error getting customer details:', error.response?.data || error.message);
        throw error;
    }
}

// Run the main function if this script is executed directly
if (require.main === module) {
    main();
}

// Export functions for use in other modules
module.exports = {
    createCustomer,
    createSalesInvoice,
    createPurchaseInvoice,
    createSupportTicket,
    createDocument,
    getDocument,
    updateDocument,
    submitDocument,
    getOrCreateItem,
    getOrCreateSupplier,
    bulkCreateCustomers,
    listCustomers,
    getCustomerDetails
};
