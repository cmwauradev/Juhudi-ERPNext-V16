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

async function testInvoiceSync() {
    try {
        console.log('1. Fetching one invoice from MSSQL...');
        const pool = await sql.connect(mssqlConfig);
        const result = await pool.request().query('SELECT TOP 1 * FROM Invoices');
        const invoice = result.recordset[0];
        
        console.log('\nInvoice data from MSSQL:');
        console.log(invoice);
        
        console.log('\n2. Finding ERPNext customer for CustomerId:', invoice.CustomerId);
        
        // Check sync log
        const filters = JSON.stringify([
            ['source_table', '=', 'Customers'],
            ['source_id', '=', invoice.CustomerId.toString()],
            ['sync_status', '=', 'Success']
        ]);
        
        const syncLog = await erpnextAPI.get(
            `/api/resource/MSSQL Sync Log?filters=${encodeURIComponent(filters)}&limit_page_length=1`
        );
        
        if (syncLog.data.data.length === 0) {
            console.log('❌ Customer not found in sync log for CustomerId:', invoice.CustomerId);
            console.log('Available sync log entries:');
            const allLogs = await erpnextAPI.get('/api/resource/MSSQL Sync Log?limit_page_length=5');
            console.log(allLogs.data.data);
            return;
        }
        
        const erpnextCustomerId = syncLog.data.data[0].target_id;
        console.log('✅ Found ERPNext customer:', erpnextCustomerId);
        
        console.log('\n3. Creating invoice in ERPNext...');
        const today = new Date().toISOString().split('T')[0];
        const invoiceDate = invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : today;
        
        const invoiceData = {
            customer: erpnextCustomerId,
            company: 'Juhudi Smart Solutions',
            posting_date: invoiceDate,
            due_date: invoiceDate,
            currency: 'KES',
            items: [
                {
                    item_code: 'WATER-SERVICE',
                    qty: 1,
                    rate: invoice.Amount || 0,
                    description: `Invoice ${invoice.InvoiceId} - Connection ${invoice.ConnectionId}`
                }
            ]
        };
        
        console.log('\nInvoice data to create:');
        console.log(JSON.stringify(invoiceData, null, 2));
        
        const response = await erpnextAPI.post('/api/resource/Sales Invoice', invoiceData);
        console.log('\n✅ Invoice created successfully:', response.data.data.name);
        
        await pool.close();
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testInvoiceSync();
