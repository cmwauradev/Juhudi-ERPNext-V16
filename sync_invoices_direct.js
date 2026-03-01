/**
 * Sync Invoices - Direct mapping using mssql_customer_id field
 */

const sql = require('mssql');
const axios = require('axios');
require('dotenv').config();

const mssqlConfig = {
    server: process.env.MSSQL_SERVER,
    port: parseInt(process.env.MSSQL_PORT || '1433'),
    database: process.env.MSSQL_DATABASE,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true
    }
};

const erpnextAPI = axios.create({
    baseURL: process.env.ERPNEXT_URL,
    headers: {
        'Authorization': `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json'
    }
});

// Cache for customer mapping
const customerCache = new Map();

async function findERPNextCustomerByMSSQLId(mssqlCustomerId) {
    // Check cache first
    if (customerCache.has(mssqlCustomerId)) {
        return customerCache.get(mssqlCustomerId);
    }
    
    try {
        // Query ERPNext Customer table directly using mssql_customer_id field
        const filters = JSON.stringify([['mssql_customer_id', '=', mssqlCustomerId.toString()]]);
        const response = await erpnextAPI.get(
            `/api/resource/Customer?filters=${encodeURIComponent(filters)}&fields=["name"]&limit_page_length=1`
        );
        
        if (response.data.data.length > 0) {
            const erpnextCustomerId = response.data.data[0].name;
            customerCache.set(mssqlCustomerId, erpnextCustomerId);
            return erpnextCustomerId;
        }
        
        return null;
    } catch (error) {
        console.error(`  ⚠️  Error finding customer ${mssqlCustomerId}:`, error.message);
        return null;
    }
}

async function syncInvoice(mssqlInvoice) {
    const sourceId = mssqlInvoice.InvoiceId;
    
    try {
        // Find ERPNext customer
        const erpnextCustomerId = await findERPNextCustomerByMSSQLId(mssqlInvoice.CustomerId);
        
        if (!erpnextCustomerId) {
            console.error(`  ❌ Invoice ${sourceId}: Customer ${mssqlInvoice.CustomerId} not found`);
            return null;
        }
        
        // Prepare invoice data
        const today = new Date().toISOString().split('T')[0];
        const invoiceDate = mssqlInvoice.date ? new Date(mssqlInvoice.date).toISOString().split('T')[0] : today;
        const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const invoiceData = {
            customer: erpnextCustomerId,
            company: 'Juhudi Smart Solutions',
            posting_date: invoiceDate,
            due_date: dueDate,
            currency: 'KES',
            po_no: mssqlInvoice.RefNo || null,
            items: [
                {
                    item_code: 'WATER-SERVICE',
                    item_name: mssqlInvoice.Type || 'Water Service',
                    qty: 1,
                    rate: mssqlInvoice.Amount || 0,
                    description: `MSSQL Invoice #${mssqlInvoice.InvoiceId}\nConnection: ${mssqlInvoice.ConnectionId || 'N/A'}\nType: ${mssqlInvoice.Type || 'N/A'}\nPaid: ${mssqlInvoice.Paid ? 'Yes' : 'No'}\nAmount Paid: ${mssqlInvoice.amountPaid || 0} KES\nBalance: ${mssqlInvoice.Balance || 0} KES`
                }
            ],
            remarks: `MSSQL Invoice ID: ${mssqlInvoice.InvoiceId}\nConnection ID: ${mssqlInvoice.ConnectionId || 'N/A'}\nPaid: ${mssqlInvoice.Paid ? 'Yes' : 'No'}\nBalance: ${mssqlInvoice.Balance || 0} KES`
        };
        
        // Create invoice in ERPNext
        const response = await erpnextAPI.post('/api/resource/Sales Invoice', invoiceData);
        const erpnextInvoice = response.data.data;
        
        console.log(`  ✅ Invoice ${sourceId} (${mssqlInvoice.Amount} KES) → ${erpnextInvoice.name}`);
        
        return erpnextInvoice;
        
    } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        if (!errMsg.includes('Duplicate')) {
            console.error(`  ❌ Invoice ${sourceId}: ${errMsg}`);
        }
        return null;
    }
}

async function syncAllInvoices() {
    const startTime = new Date();
    console.log('\n' + '='.repeat(70));
    console.log(`💰 Syncing MSSQL Invoices → ERPNext: ${startTime.toISOString()}`);
    console.log('='.repeat(70) + '\n');
    
    let pool;
    let stats = {
        processed: 0,
        synced: 0,
        failed: 0,
        customerNotFound: 0
    };
    
    try {
        // Connect to MSSQL
        pool = await sql.connect(mssqlConfig);
        console.log('✅ Connected to MSSQL\n');
        
        // Fetch all invoices
        console.log('📊 Fetching invoices from MSSQL...');
        const result = await pool.request().query(`
            SELECT 
                InvoiceId,
                CustomerId,
                ConnectionId,
                RefNo,
                date,
                Amount,
                Paid,
                Type,
                amountPaid,
                Balance
            FROM Invoices
            ORDER BY InvoiceId
        `);
        
        const invoices = result.recordset;
        console.log(`✅ Fetched ${invoices.length} invoices\n`);
        
        console.log('🔄 Syncing invoices...\n');
        
        for (const invoice of invoices) {
            stats.processed++;
            const result = await syncInvoice(invoice);
            
            if (result) {
                stats.synced++;
            } else {
                stats.failed++;
            }
            
            // Progress indicator
            if (stats.processed % 50 === 0) {
                console.log(`  📊 Progress: ${stats.processed}/${invoices.length} invoices processed`);
            }
        }
        
    } catch (error) {
        console.error('\n❌ Sync error:', error.message);
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n✅ MSSQL connection closed');
        }
    }
    
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 INVOICE SYNC SUMMARY');
    console.log('='.repeat(70));
    console.log(`Started:  ${startTime.toISOString()}`);
    console.log(`Finished: ${endTime.toISOString()}`);
    console.log(`Duration: ${duration} seconds`);
    console.log('\nInvoices:');
    console.log(`  Processed: ${stats.processed}`);
    console.log(`  Synced:    ${stats.synced}`);
    console.log(`  Failed:    ${stats.failed}`);
    console.log(`  Rate:      ${(stats.processed / parseFloat(duration)).toFixed(2)} invoices/second`);
    console.log('='.repeat(70) + '\n');
}

syncAllInvoices();
