/**
 * MSSQL to ERPNext Data Sync Service
 * 
 * Features:
 * - Fetches data from MSSQL database
 * - Syncs to ERPNext database
 * - Tracks synced records to prevent duplicates
 * - Runs automatically every 5 minutes
 * - Comprehensive error handling and logging
 * 
 * Usage:
 * node mssql_to_erpnext_sync.js
 */

const sql = require('mssql');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

// MSSQL Configuration
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

// ERPNext Configuration
const erpnextConfig = {
    baseURL: process.env.ERPNEXT_URL || 'http://localhost:8000',
    headers: {
        'Authorization': `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json'
    }
};

const erpnextAPI = axios.create(erpnextConfig);

// Sync tracking in-memory store (you can also use a file or database)
const syncTracker = new Map();

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
// SYNC TRACKING TABLE IN ERPNEXT
// ============================================================================

/**
 * Create a custom DocType in ERPNext to track synced records
 * This ensures we don't sync the same record twice
 */
async function ensureSyncTrackingTable() {
    try {
        // Check if the custom DocType exists
        const response = await erpnextAPI.get('/api/resource/DocType/MSSQL Sync Log');
        console.log('✅ MSSQL Sync Log table already exists');
        return true;
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('📋 Creating MSSQL Sync Log tracking table...');
            await createSyncTrackingTable();
            return true;
        }
        throw error;
    }
}

/**
 * Create the sync tracking DocType
 */
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
            {
                fieldname: 'source_table',
                label: 'Source Table',
                fieldtype: 'Data',
                reqd: 1
            },
            {
                fieldname: 'source_id',
                label: 'Source Record ID',
                fieldtype: 'Data',
                reqd: 1
            },
            {
                fieldname: 'target_doctype',
                label: 'Target DocType',
                fieldtype: 'Data',
                reqd: 1
            },
            {
                fieldname: 'target_id',
                label: 'Target Record ID',
                fieldtype: 'Data',
                reqd: 1
            },
            {
                fieldname: 'sync_status',
                label: 'Sync Status',
                fieldtype: 'Select',
                options: 'Success\nFailed\nPending',
                default: 'Success'
            },
            {
                fieldname: 'sync_timestamp',
                label: 'Sync Timestamp',
                fieldtype: 'Datetime',
                default: 'Now'
            },
            {
                fieldname: 'source_data',
                label: 'Source Data (JSON)',
                fieldtype: 'Long Text'
            },
            {
                fieldname: 'error_message',
                label: 'Error Message',
                fieldtype: 'Long Text'
            }
        ]
    };

    try {
        await erpnextAPI.post('/api/resource/DocType', docTypeData);
        console.log('✅ MSSQL Sync Log table created successfully');
    } catch (error) {
        console.error('❌ Error creating sync tracking table:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Check if a record has already been synced
 */
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
        console.error('Error checking sync status:', error.message);
        return false;
    }
}

/**
 * Log a synced record
 */
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
        console.log(`  ✅ Logged sync: ${sourceTable}[${sourceId}] → ${targetDoctype}[${targetId}]`);
    } catch (error) {
        console.error('  ⚠️  Error logging sync record:', error.message);
    }
}

// ============================================================================
// MSSQL DATA FETCHING
// ============================================================================

/**
 * Connect to MSSQL database
 */
async function connectMSSQL() {
    try {
        const pool = await sql.connect(mssqlConfig);
        console.log('✅ Connected to MSSQL database:', mssqlConfig.database);
        return pool;
    } catch (error) {
        console.error('❌ MSSQL connection failed:', error.message);
        throw error;
    }
}

/**
 * Fetch customers from MSSQL
 * CUSTOMIZE THIS QUERY FOR YOUR DATABASE SCHEMA
 */
async function fetchCustomersFromMSSQL(pool) {
    try {
        const result = await pool.request().query(`
            SELECT 
                CustomerID,
                CustomerName,
                CustomerType,
                Email,
                Phone,
                Address,
                City,
                Country,
                TaxID,
                CreatedDate,
                ModifiedDate
            FROM Customers
            WHERE ModifiedDate >= DATEADD(MINUTE, -10, GETDATE())
            ORDER BY ModifiedDate DESC
        `);
        
        console.log(`📊 Fetched ${result.recordset.length} customers from MSSQL`);
        return result.recordset;
    } catch (error) {
        console.error('❌ Error fetching customers from MSSQL:', error.message);
        return [];
    }
}

/**
 * Fetch invoices from MSSQL
 * CUSTOMIZE THIS QUERY FOR YOUR DATABASE SCHEMA
 */
async function fetchInvoicesFromMSSQL(pool) {
    try {
        const result = await pool.request().query(`
            SELECT 
                InvoiceID,
                CustomerID,
                InvoiceDate,
                DueDate,
                TotalAmount,
                Currency,
                Status,
                PONumber,
                CreatedDate,
                ModifiedDate
            FROM Invoices
            WHERE ModifiedDate >= DATEADD(MINUTE, -10, GETDATE())
            ORDER BY ModifiedDate DESC
        `);
        
        console.log(`📊 Fetched ${result.recordset.length} invoices from MSSQL`);
        return result.recordset;
    } catch (error) {
        console.error('❌ Error fetching invoices from MSSQL:', error.message);
        return [];
    }
}

/**
 * Fetch invoice items from MSSQL
 * CUSTOMIZE THIS QUERY FOR YOUR DATABASE SCHEMA
 */
async function fetchInvoiceItemsFromMSSQL(pool, invoiceId) {
    try {
        const result = await pool.request()
            .input('invoiceId', sql.Int, invoiceId)
            .query(`
                SELECT 
                    ItemID,
                    ItemCode,
                    ItemName,
                    Quantity,
                    UnitPrice,
                    Description
                FROM InvoiceItems
                WHERE InvoiceID = @invoiceId
            `);
        
        return result.recordset;
    } catch (error) {
        console.error(`❌ Error fetching items for invoice ${invoiceId}:`, error.message);
        return [];
    }
}

// ============================================================================
// DATA TRANSFORMATION & SYNC
// ============================================================================

/**
 * Transform MSSQL customer data to ERPNext format
 */
function transformCustomerData(mssqlCustomer) {
    return {
        customer_name: mssqlCustomer.CustomerName,
        customer_type: mssqlCustomer.CustomerType === 'Business' ? 'Company' : 'Individual',
        customer_group: 'Commercial',
        territory: mssqlCustomer.Country === 'Kenya' ? 'Kenya' : 'Rest Of The World',
        email_id: mssqlCustomer.Email,
        mobile_no: mssqlCustomer.Phone,
        tax_id: mssqlCustomer.TaxID,
        custom_mssql_customer_id: mssqlCustomer.CustomerID.toString()
    };
}

/**
 * Sync a customer from MSSQL to ERPNext
 */
async function syncCustomer(mssqlCustomer) {
    const sourceTable = 'Customers';
    const sourceId = mssqlCustomer.CustomerID;
    
    try {
        // Check if already synced
        if (await isRecordSynced(sourceTable, sourceId)) {
            console.log(`  ⏭️  Customer ${sourceId} already synced, skipping...`);
            return null;
        }
        
        // Transform data
        const customerData = transformCustomerData(mssqlCustomer);
        
        // Create in ERPNext
        const response = await erpnextAPI.post('/api/resource/Customer', customerData);
        const erpnextCustomer = response.data.data;
        
        console.log(`  ✅ Synced customer: ${sourceId} → ${erpnextCustomer.name}`);
        
        // Log the sync
        await logSyncRecord(sourceTable, sourceId, 'Customer', erpnextCustomer.name, mssqlCustomer);
        
        return erpnextCustomer;
        
    } catch (error) {
        console.error(`  ❌ Error syncing customer ${sourceId}:`, error.response?.data?.message || error.message);
        
        // Log the failed sync
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
 * Find ERPNext customer by MSSQL Customer ID
 */
async function findERPNextCustomerByMSSQLId(mssqlCustomerId) {
    try {
        // First, check sync log
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
        console.error('Error finding ERPNext customer:', error.message);
        return null;
    }
}

/**
 * Transform MSSQL invoice data to ERPNext format
 */
function transformInvoiceData(mssqlInvoice, erpnextCustomerId, items) {
    return {
        customer: erpnextCustomerId,
        company: process.env.ERPNEXT_COMPANY || 'Juhudi Smart Solutions',
        posting_date: mssqlInvoice.InvoiceDate.toISOString().split('T')[0],
        due_date: mssqlInvoice.DueDate.toISOString().split('T')[0],
        currency: mssqlInvoice.Currency || 'KES',
        po_no: mssqlInvoice.PONumber,
        items: items.map(item => ({
            item_code: item.ItemCode,
            qty: item.Quantity,
            rate: item.UnitPrice,
            description: item.Description || item.ItemName
        })),
        custom_mssql_invoice_id: mssqlInvoice.InvoiceID.toString()
    };
}

/**
 * Sync an invoice from MSSQL to ERPNext
 */
async function syncInvoice(mssqlInvoice, pool) {
    const sourceTable = 'Invoices';
    const sourceId = mssqlInvoice.InvoiceID;
    
    try {
        // Check if already synced
        if (await isRecordSynced(sourceTable, sourceId)) {
            console.log(`  ⏭️  Invoice ${sourceId} already synced, skipping...`);
            return null;
        }
        
        // Find corresponding ERPNext customer
        const erpnextCustomerId = await findERPNextCustomerByMSSQLId(mssqlInvoice.CustomerID);
        
        if (!erpnextCustomerId) {
            console.error(`  ❌ Cannot sync invoice ${sourceId}: Customer ${mssqlInvoice.CustomerID} not found in ERPNext`);
            await logSyncRecord(
                sourceTable,
                sourceId,
                'Sales Invoice',
                'N/A',
                mssqlInvoice,
                'Failed',
                `Customer ${mssqlInvoice.CustomerID} not found`
            );
            return null;
        }
        
        // Fetch invoice items
        const items = await fetchInvoiceItemsFromMSSQL(pool, sourceId);
        
        if (items.length === 0) {
            console.error(`  ❌ Cannot sync invoice ${sourceId}: No items found`);
            return null;
        }
        
        // Transform data
        const invoiceData = transformInvoiceData(mssqlInvoice, erpnextCustomerId, items);
        
        // Create in ERPNext
        const response = await erpnextAPI.post('/api/resource/Sales Invoice', invoiceData);
        const erpnextInvoice = response.data.data;
        
        console.log(`  ✅ Synced invoice: ${sourceId} → ${erpnextInvoice.name}`);
        
        // Log the sync
        await logSyncRecord(sourceTable, sourceId, 'Sales Invoice', erpnextInvoice.name, mssqlInvoice);
        
        return erpnextInvoice;
        
    } catch (error) {
        console.error(`  ❌ Error syncing invoice ${sourceId}:`, error.response?.data?.message || error.message);
        
        // Log the failed sync
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

/**
 * Main synchronization function
 */
async function runSync() {
    const startTime = new Date();
    
    // Log environment configuration
    logEnvironmentConfig();
    
    console.log('\n' + '='.repeat(70));
    console.log(`🔄 Starting MSSQL → ERPNext Sync at ${startTime.toISOString()}`);
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
            } else if (await isRecordSynced('Customers', customer.CustomerID)) {
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
            const result = await syncInvoice(invoice, pool);
            
            if (result) {
                stats.invoicesSynced++;
            } else if (await isRecordSynced('Invoices', invoice.InvoiceID)) {
                stats.invoicesSkipped++;
            } else {
                stats.invoicesFailed++;
            }
        }
        
    } catch (error) {
        console.error('\n❌ Sync process error:', error.message);
    } finally {
        // Close MSSQL connection
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

/**
 * Schedule sync to run every 5 minutes
 */
function startScheduledSync() {
    console.log('🕐 Starting scheduled sync service...');
    console.log('⏰ Sync will run every 5 minutes\n');
    
    // Run immediately on start
    runSync();
    
    // Schedule to run every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        runSync();
    });
    
    console.log('✅ Scheduler started successfully');
    console.log('Press Ctrl+C to stop\n');
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// Check if running as main module
if (require.main === module) {
    // Check for required environment variables
    const requiredEnvVars = [
        'MSSQL_SERVER',
        'MSSQL_DATABASE',
        'MSSQL_USER',
        'MSSQL_PASSWORD',
        'ERPNEXT_URL',
        'ERPNEXT_API_KEY',
        'ERPNEXT_API_SECRET'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => console.error(`  - ${varName}`));
        console.error('\nPlease update your .env file and try again.');
        process.exit(1);
    }
    
    // Start the scheduler
    startScheduledSync();
}

// Export functions for external use
module.exports = {
    runSync,
    syncCustomer,
    syncInvoice,
    connectMSSQL,
    ensureSyncTrackingTable
};
