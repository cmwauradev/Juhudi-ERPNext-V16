/**
 * MSSQL to ERPNext Sync - Customized for TEST_ERP Database
 * 
 * Syncs data from your MSSQL database to ERPNext:
 * - Customers → ERPNext Customer
 * - Invoices → ERPNext Sales Invoice
 * 
 * Runs every 5 minutes automatically
 */

const sql = require('mssql');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

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

const erpnextConfig = {
    baseURL: process.env.ERPNEXT_URL || 'http://localhost:8000',
    headers: {
        'Authorization': `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json'
    }
};

const erpnextAPI = axios.create(erpnextConfig);

// ============================================================================
// DEBUG: Environment Detection & Target Configuration
// ============================================================================
function logEnvironmentConfig() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 DEBUG: Environment Detection & Configuration');
    console.log('='.repeat(70));
    console.log('\n📋 Environment Variables:');
    console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log('\n  MSSQL Source:');
    console.log(`    MSSQL_SERVER: ${process.env.MSSQL_SERVER || 'not set'}`);
    console.log(`    MSSQL_PORT: ${process.env.MSSQL_PORT || 'not set (default: 1433)'}`);
    console.log(`    MSSQL_DATABASE: ${process.env.MSSQL_DATABASE || 'not set'}`);
    console.log(`    MSSQL_USER: ${process.env.MSSQL_USER || 'not set'}`);
    console.log(`    MSSQL_PASSWORD: ${process.env.MSSQL_PASSWORD ? 'set (hidden)' : 'not set'}`);
    console.log('\n  ERPNext Target:');
    console.log(`    ERPNEXT_URL: ${process.env.ERPNEXT_URL || 'not set (default: http://localhost:8000)'}`);
    console.log(`    ERPNEXT_API_KEY: ${process.env.ERPNEXT_API_KEY ? 'set (' + process.env.ERPNEXT_API_KEY.substring(0, 10) + '...)' : 'not set'}`);
    console.log(`    ERPNEXT_API_SECRET: ${process.env.ERPNEXT_API_SECRET ? 'set (' + process.env.ERPNEXT_API_SECRET.substring(0, 10) + '...)' : 'not set'}`);
    console.log(`    ERPNEXT_COMPANY: ${process.env.ERPNEXT_COMPANY || 'not set (default: Juhudi Smart Solutions)'}`);
    console.log('\n🎯 Detected Target Configuration:');
    console.log('  MSSQL Source:');
    console.log(`    Server: ${mssqlConfig.server}`);
    console.log(`    Port: ${mssqlConfig.port}`);
    console.log(`    Database: ${mssqlConfig.database}`);
    console.log(`    User: ${mssqlConfig.user}`);
    console.log(`    Encrypt: ${mssqlConfig.options.encrypt}`);
    console.log('  ERPNext Target:');
    console.log(`    URL: ${erpnextConfig.baseURL}`);
    console.log(`    Company: ${process.env.ERPNEXT_COMPANY || 'Juhudi Smart Solutions'}`);
    console.log(`    Auth: ${process.env.ERPNEXT_API_KEY ? 'Configured' : 'Missing'}`);
    console.log('='.repeat(70) + '\n');
}

// ============================================================================
// SYNC TRACKING
// ============================================================================

async function ensureSyncTrackingTable() {
    try {
        await erpnextAPI.get('/api/resource/DocType/MSSQL Sync Log');
        console.log('✅ MSSQL Sync Log table exists');
        return true;
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('📋 Creating MSSQL Sync Log table...');
            await createSyncTrackingTable();
            return true;
        }
        throw error;
    }
}

async function createSyncTrackingTable() {
    const docTypeData = {
        doctype: 'DocType',
        name: 'MSSQL Sync Log',
        module: 'Custom',
        custom: 1,
        is_submittable: 0,
        track_changes: 1,
        autoname: 'format:SYNC-{#####}',
        fields: [
            { fieldname: 'source_table', label: 'Source Table', fieldtype: 'Data', reqd: 1 },
            { fieldname: 'source_id', label: 'Source Record ID', fieldtype: 'Data', reqd: 1 },
            { fieldname: 'target_doctype', label: 'Target DocType', fieldtype: 'Data', reqd: 1 },
            { fieldname: 'target_id', label: 'Target Record ID', fieldtype: 'Data', reqd: 1 },
            { fieldname: 'sync_status', label: 'Sync Status', fieldtype: 'Select', options: 'Success\nFailed\nPending', default: 'Success' },
            { fieldname: 'sync_timestamp', label: 'Sync Timestamp', fieldtype: 'Datetime', default: 'Now' },
            { fieldname: 'source_data', label: 'Source Data (JSON)', fieldtype: 'Long Text' },
            { fieldname: 'error_message', label: 'Error Message', fieldtype: 'Long Text' }
        ]
    };

    try {
        await erpnextAPI.post('/api/resource/DocType', docTypeData);
        console.log('✅ MSSQL Sync Log table created');
    } catch (error) {
        console.error('❌ Error creating sync table:', error.response?.data || error.message);
    }
}

async function isRecordSynced(sourceTable, sourceId) {
    try {
        const filters = JSON.stringify([
            ['source_table', '=', sourceTable],
            ['source_id', '=', sourceId.toString()],
            ['sync_status', '=', 'Success']
        ]);
        
        const response = await erpnextAPI.get(
            `/api/resource/MSSQL Sync Log?filters=${encodeURIComponent(filters)}&limit_page_length=1`
        );
        
        return response.data.data.length > 0;
    } catch (error) {
        return false;
    }
}

async function logSyncRecord(sourceTable, sourceId, targetDoctype, targetId, sourceData, status = 'Success', errorMessage = null) {
    try {
        const logData = {
            source_table: sourceTable,
            source_id: sourceId.toString(),
            target_doctype: targetDoctype,
            target_id: targetId,
            sync_status: status,
            sync_timestamp: new Date().toISOString(),
            source_data: JSON.stringify(sourceData),
            error_message: errorMessage
        };

        await erpnextAPI.post('/api/resource/MSSQL Sync Log', logData);
        console.log(`  ✅ Logged: ${sourceTable}[${sourceId}] → ${targetDoctype}[${targetId}]`);
    } catch (error) {
        console.error('  ⚠️  Error logging sync:', error.message);
    }
}

async function findERPNextCustomerByMSSQLId(mssqlCustomerId) {
    try {
        const filters = JSON.stringify([
            ['source_table', '=', 'Customers'],
            ['source_id', '=', mssqlCustomerId.toString()],
            ['sync_status', '=', 'Success']
        ]);
        
        const response = await erpnextAPI.get(
            `/api/resource/MSSQL Sync Log?filters=${encodeURIComponent(filters)}&limit_page_length=1`
        );
        
        if (response.data.data.length > 0) {
            return response.data.data[0].target_id;
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// ============================================================================
// MSSQL DATA FETCHING - CUSTOMIZED FOR YOUR SCHEMA
// ============================================================================

async function connectMSSQL() {
    try {
        const pool = await sql.connect(mssqlConfig);
        console.log('✅ Connected to MSSQL:', mssqlConfig.database);
        return pool;
    } catch (error) {
        console.error('❌ MSSQL connection failed:', error.message);
        throw error;
    }
}

/**
 * Fetch customers from MSSQL - Customized for your Customers table
 */
async function fetchCustomersFromMSSQL(pool) {
    try {
        const result = await pool.request().query(`
            SELECT 
                CustomerId,
                Name,
                IDNO,
                Address,
                PCode,
                Town,
                PIN,
                Landline,
                Mobile,
                Email,
                Date
            FROM Customers
            ORDER BY CustomerId DESC
        `);
        
        console.log(`📊 Fetched ${result.recordset.length} customers from MSSQL`);
        return result.recordset;
    } catch (error) {
        console.error('❌ Error fetching customers:', error.message);
        return [];
    }
}

/**
 * Fetch invoices from MSSQL - Customized for your Invoices table
 */
async function fetchInvoicesFromMSSQL(pool) {
    try {
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
            ORDER BY InvoiceId DESC
        `);
        
        console.log(`📊 Fetched ${result.recordset.length} invoices from MSSQL`);
        return result.recordset;
    } catch (error) {
        console.error('❌ Error fetching invoices:', error.message);
        return [];
    }
}

// ============================================================================
// DATA TRANSFORMATION - MSSQL TO ERPNEXT FORMAT
// ============================================================================

/**
 * Transform MSSQL customer to ERPNext format
 */
function transformCustomerData(mssqlCustomer) {
    return {
        customer_name: mssqlCustomer.Name || `Customer ${mssqlCustomer.CustomerId}`,
        customer_type: 'Individual',
        customer_group: 'Commercial',
        territory: 'Kenya',
        email_id: mssqlCustomer.Email || null,
        mobile_no: mssqlCustomer.Mobile || null,
        tax_id: mssqlCustomer.PIN || null,
        custom_mssql_customer_id: mssqlCustomer.CustomerId.toString(),
        custom_id_number: mssqlCustomer.IDNO || null,
        // Address details
        address_line1: mssqlCustomer.Address || null,
        city: mssqlCustomer.Town || null,
        pincode: mssqlCustomer.PCode || null
    };
}

/**
 * Transform MSSQL invoice to ERPNext format
 */
function transformInvoiceData(mssqlInvoice, erpnextCustomerId) {
    const today = new Date().toISOString().split('T')[0];
    const invoiceDate = mssqlInvoice.date ? new Date(mssqlInvoice.date).toISOString().split('T')[0] : today;
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return {
        customer: erpnextCustomerId,
        company: process.env.ERPNEXT_COMPANY || 'Juhudi Smart Solutions',
        posting_date: invoiceDate,
        due_date: dueDate,
        currency: 'KES',
        po_no: mssqlInvoice.RefNo || null,
        // Create a single line item for the invoice
        items: [
            {
                item_code: 'WATER-SERVICE', // You'll need to create this item in ERPNext
                item_name: mssqlInvoice.Type || 'Water Service',
                qty: 1,
                rate: mssqlInvoice.Amount || 0,
                description: `${mssqlInvoice.Type || 'Invoice'} - Connection: ${mssqlInvoice.ConnectionId || 'N/A'}`
            }
        ],
        remarks: `MSSQL Invoice ID: ${mssqlInvoice.InvoiceId}, Paid: ${mssqlInvoice.Paid ? 'Yes' : 'No'}`,
        custom_mssql_invoice_id: mssqlInvoice.InvoiceId.toString(),
        custom_balance: mssqlInvoice.Balance || 0
    };
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync a customer from MSSQL to ERPNext
 */
async function syncCustomer(mssqlCustomer) {
    const sourceTable = 'Customers';
    const sourceId = mssqlCustomer.CustomerId;
    
    try {
        // Check if already synced
        if (await isRecordSynced(sourceTable, sourceId)) {
            console.log(`  ⏭️  Customer ${sourceId} already synced`);
            return null;
        }
        
        // Transform data
        const customerData = transformCustomerData(mssqlCustomer);
        
        // Create in ERPNext
        const response = await erpnextAPI.post('/api/resource/Customer', customerData);
        const erpnextCustomer = response.data.data;
        
        console.log(`  ✅ Synced: ${mssqlCustomer.Name} → ${erpnextCustomer.name}`);
        
        // Log the sync
        await logSyncRecord(sourceTable, sourceId, 'Customer', erpnextCustomer.name, mssqlCustomer);
        
        return erpnextCustomer;
        
    } catch (error) {
        console.error(`  ❌ Error syncing customer ${sourceId}:`, error.response?.data?.message || error.message);
        
        await logSyncRecord(
            sourceTable,
            sourceId,
            'Customer',
            'N/A',
            mssqlCustomer,
            'Failed',
            error.response?.data?.message || error.message
        );
        
        return null;
    }
}

/**
 * Sync an invoice from MSSQL to ERPNext
 */
async function syncInvoice(mssqlInvoice) {
    const sourceTable = 'Invoices';
    const sourceId = mssqlInvoice.InvoiceId;
    
    try {
        // Check if already synced
        if (await isRecordSynced(sourceTable, sourceId)) {
            console.log(`  ⏭️  Invoice ${sourceId} already synced`);
            return null;
        }
        
        // Find corresponding ERPNext customer
        const erpnextCustomerId = await findERPNextCustomerByMSSQLId(mssqlInvoice.CustomerId);
        
        if (!erpnextCustomerId) {
            console.error(`  ❌ Cannot sync invoice ${sourceId}: Customer ${mssqlInvoice.CustomerId} not found in ERPNext`);
            await logSyncRecord(
                sourceTable,
                sourceId,
                'Sales Invoice',
                'N/A',
                mssqlInvoice,
                'Failed',
                `Customer ${mssqlInvoice.CustomerId} not found`
            );
            return null;
        }
        
        // Transform data
        const invoiceData = transformInvoiceData(mssqlInvoice, erpnextCustomerId);
        
        // Create in ERPNext
        const response = await erpnextAPI.post('/api/resource/Sales Invoice', invoiceData);
        const erpnextInvoice = response.data.data;
        
        console.log(`  ✅ Synced: Invoice ${sourceId} (${mssqlInvoice.Amount} KES) → ${erpnextInvoice.name}`);
        
        // Log the sync
        await logSyncRecord(sourceTable, sourceId, 'Sales Invoice', erpnextInvoice.name, mssqlInvoice);
        
        return erpnextInvoice;
        
    } catch (error) {
        console.error(`  ❌ Error syncing invoice ${sourceId}:`, error.response?.data?.message || error.message);
        
        await logSyncRecord(
            sourceTable,
            sourceId,
            'Sales Invoice',
            'N/A',
            mssqlInvoice,
            'Failed',
            error.response?.data?.message || error.message
        );
        
        return null;
    }
}

// ============================================================================
// MAIN SYNC PROCESS
// ============================================================================

async function runSync() {
    const startTime = new Date();
    
    // Log environment configuration
    logEnvironmentConfig();
    
    console.log('\n' + '='.repeat(70));
    console.log(`🔄 MSSQL → ERPNext Sync Started: ${startTime.toISOString()}`);
    console.log('='.repeat(70) + '\n');
    
    let pool;
    let stats = {
        customersProcessed: 0,
        customersSynced: 0,
        customersSkipped: 0,
        customersFailed: 0,
        invoicesProcessed: 0,
        invoicesSynced: 0,
        invoicesSkipped: 0,
        invoicesFailed: 0
    };
    
    try {
        // Ensure sync tracking table exists
        await ensureSyncTrackingTable();
        
        // Connect to MSSQL
        pool = await connectMSSQL();
        
        // ====================================================================
        // SYNC CUSTOMERS
        // ====================================================================
        console.log('\n📋 Syncing Customers...');
        const customers = await fetchCustomersFromMSSQL(pool);
        
        for (const customer of customers) {
            stats.customersProcessed++;
            const result = await syncCustomer(customer);
            
            if (result) {
                stats.customersSynced++;
            } else if (await isRecordSynced('Customers', customer.CustomerId)) {
                stats.customersSkipped++;
            } else {
                stats.customersFailed++;
            }
        }
        
        // ====================================================================
        // SYNC INVOICES
        // ====================================================================
        console.log('\n💰 Syncing Invoices...');
        const invoices = await fetchInvoicesFromMSSQL(pool);
        
        for (const invoice of invoices) {
            stats.invoicesProcessed++;
            const result = await syncInvoice(invoice);
            
            if (result) {
                stats.invoicesSynced++;
            } else if (await isRecordSynced('Invoices', invoice.InvoiceId)) {
                stats.invoicesSkipped++;
            } else {
                stats.invoicesFailed++;
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
    
    // ========================================================================
    // SYNC SUMMARY
    // ========================================================================
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(70));
    console.log(`Started:  ${startTime.toISOString()}`);
    console.log(`Finished: ${endTime.toISOString()}`);
    console.log(`Duration: ${duration} seconds`);
    console.log('\nCustomers:');
    console.log(`  Processed: ${stats.customersProcessed}`);
    console.log(`  Synced:    ${stats.customersSynced}`);
    console.log(`  Skipped:   ${stats.customersSkipped}`);
    console.log(`  Failed:    ${stats.customersFailed}`);
    console.log('\nInvoices:');
    console.log(`  Processed: ${stats.invoicesProcessed}`);
    console.log(`  Synced:    ${stats.invoicesSynced}`);
    console.log(`  Skipped:   ${stats.invoicesSkipped}`);
    console.log(`  Failed:    ${stats.invoicesFailed}`);
    console.log('='.repeat(70) + '\n');
}

// ============================================================================
// SCHEDULER
// ============================================================================

function startScheduledSync() {
    console.log('🕐 Starting MSSQL → ERPNext Sync Service...');
    console.log('⏰ Sync runs every 5 minutes\n');
    
    // Run immediately
    runSync();
    
    // Schedule every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        runSync();
    });
    
    console.log('✅ Scheduler started');
    console.log('Press Ctrl+C to stop\n');
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (require.main === module) {
    const requiredVars = [
        'MSSQL_SERVER',
        'MSSQL_DATABASE',
        'MSSQL_USER',
        'MSSQL_PASSWORD',
        'ERPNEXT_URL',
        'ERPNEXT_API_KEY',
        'ERPNEXT_API_SECRET'
    ];
    
    const missingVars = requiredVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing environment variables:', missingVars.join(', '));
        process.exit(1);
    }
    
    startScheduledSync();
}

module.exports = { runSync, syncCustomer, syncInvoice };
