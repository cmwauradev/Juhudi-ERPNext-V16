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

async function checkFields() {
    try {
        const pool = await sql.connect(config);
        
        console.log('\n📋 All Customers Table Columns:\n');
        const schema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Customers'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.table(schema.recordset);
        
        console.log('\n📊 Sample Customer with All Fields:\n');
        const sample = await pool.request().query('SELECT TOP 1 * FROM Customers WHERE Name IS NOT NULL');
        
        if (sample.recordset.length > 0) {
            const customer = sample.recordset[0];
            console.log('Field Mapping:');
            console.log('─'.repeat(80));
            Object.keys(customer).forEach(key => {
                const value = customer[key];
                const type = typeof value;
                const preview = value ? String(value).substring(0, 50) : 'NULL';
                console.log(`${key.padEnd(20)} | ${type.padEnd(10)} | ${preview}`);
            });
        }
        
        await pool.close();
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkFields();
