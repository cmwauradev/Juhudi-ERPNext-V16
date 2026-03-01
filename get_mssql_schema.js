const sql = require('mssql');
require('dotenv').config();

const config = {
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

async function getSchema() {
    try {
        const pool = await sql.connect(config);
        
        // Get Customers table schema
        console.log('\n📋 Customers Table Schema:\n');
        const customersSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Customers'
            ORDER BY ORDINAL_POSITION
        `);
        console.table(customersSchema.recordset);
        
        // Get Invoices table schema
        console.log('\n💰 Invoices Table Schema:\n');
        const invoicesSchema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Invoices'
            ORDER BY ORDINAL_POSITION
        `);
        console.table(invoicesSchema.recordset);
        
        // Sample Customers data
        console.log('\n👥 Sample Customers (first 3):\n');
        const customers = await pool.request().query('SELECT TOP 3 * FROM Customers');
        console.table(customers.recordset);
        
        // Sample Invoices data
        console.log('\n📄 Sample Invoices (first 3):\n');
        const invoices = await pool.request().query('SELECT TOP 3 * FROM Invoices');
        console.table(invoices.recordset);
        
        await pool.close();
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

getSchema();
