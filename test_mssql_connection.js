/**
 * Test MSSQL Connection
 * 
 * This script tests your MSSQL database connection before running the sync
 * Run with: node test_mssql_connection.js
 */

const sql = require('mssql');
require('dotenv').config();

// MSSQL Configuration from .env
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

// ============================================================================
// DEBUG: Environment Detection & Target Configuration
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('🔍 DEBUG: Environment Detection & Configuration');
console.log('='.repeat(70));
console.log('\n📋 Environment Variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  MSSQL_SERVER: ${process.env.MSSQL_SERVER || 'not set'}`);
console.log(`  MSSQL_PORT: ${process.env.MSSQL_PORT || 'not set (using default: 1433)'}`);
console.log(`  MSSQL_DATABASE: ${process.env.MSSQL_DATABASE || 'not set'}`);
console.log(`  MSSQL_USER: ${process.env.MSSQL_USER || 'not set'}`);
console.log(`  MSSQL_PASSWORD: ${process.env.MSSQL_PASSWORD ? 'set (hidden)' : 'not set'}`);
console.log(`  MSSQL_ENCRYPT: ${process.env.MSSQL_ENCRYPT || 'not set (using default: false)'}`);
console.log(`  MSSQL_TRUST_SERVER_CERTIFICATE: ${process.env.MSSQL_TRUST_SERVER_CERTIFICATE || 'not set (using default: false)'}`);
console.log('\n🎯 Detected Target Configuration:');
console.log(`  Target Server: ${config.server}`);
console.log(`  Target Port: ${config.port}`);
console.log(`  Target Database: ${config.database}`);
console.log(`  Connection User: ${config.user}`);
console.log(`  Encryption Enabled: ${config.options.encrypt}`);
console.log(`  Trust Server Certificate: ${config.options.trustServerCertificate}`);
console.log(`  Source: ${process.env.MSSQL_SERVER ? 'Environment Variables' : 'Not Configured'}`);
console.log('='.repeat(70) + '\n');

async function testConnection() {
    console.log('\n🔌 Testing MSSQL Connection...\n');
    console.log('Configuration:');
    console.log('  Server:   ', config.server);
    console.log('  Port:     ', config.port);
    console.log('  Database: ', config.database);
    console.log('  User:     ', config.user);
    console.log('  Encrypt:  ', config.options.encrypt);
    console.log('');
    
    try {
        // Connect
        console.log('Connecting to MSSQL server...');
        const pool = await sql.connect(config);
        console.log('✅ Connected successfully!\n');
        
        // Test query
        console.log('Running test query...');
        const result = await pool.request().query('SELECT @@VERSION AS Version');
        console.log('✅ Query executed successfully!\n');
        console.log('SQL Server Version:');
        console.log(result.recordset[0].Version);
        console.log('');
        
        // List tables
        console.log('Fetching table list...');
        const tables = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        
        console.log(`\n✅ Found ${tables.recordset.length} tables:\n`);
        tables.recordset.forEach((table, index) => {
            console.log(`  ${index + 1}. ${table.TABLE_NAME}`);
        });
        
        // Check for expected tables
        console.log('\n📋 Checking for expected sync tables...');
        const tableNames = tables.recordset.map(t => t.TABLE_NAME);
        
        const expectedTables = ['Customers', 'Invoices', 'InvoiceItems'];
        expectedTables.forEach(tableName => {
            if (tableNames.includes(tableName)) {
                console.log(`  ✅ ${tableName} - Found`);
            } else {
                console.log(`  ❌ ${tableName} - Not found`);
            }
        });
        
        // Sample data check
        if (tableNames.includes('Customers')) {
            console.log('\n📊 Sample Customers data:');
            const customers = await pool.request().query('SELECT TOP 5 * FROM Customers');
            console.log(`  Found ${customers.recordset.length} customers (showing up to 5)`);
            
            if (customers.recordset.length > 0) {
                console.log('\n  Sample record:');
                const sample = customers.recordset[0];
                Object.keys(sample).forEach(key => {
                    console.log(`    ${key}: ${sample[key]}`);
                });
            }
        }
        
        // Close connection
        await pool.close();
        console.log('\n✅ Connection closed');
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 MSSQL CONNECTION TEST PASSED!');
        console.log('You can now run the sync script.');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ CONNECTION TEST FAILED');
        console.error('='.repeat(60));
        console.error('\nError Details:');
        console.error('  Code:   ', error.code);
        console.error('  Message:', error.message);
        
        if (error.code === 'ESOCKET') {
            console.error('\n⚠️  Cannot connect to MSSQL server!');
            console.error('\nPossible causes:');
            console.error('  1. Server hostname/IP is incorrect');
            console.error('  2. Server is not running');
            console.error('  3. Firewall blocking port', config.port);
            console.error('  4. Network connectivity issues');
        } else if (error.code === 'ELOGIN') {
            console.error('\n⚠️  Authentication failed!');
            console.error('\nPossible causes:');
            console.error('  1. Username or password is incorrect');
            console.error('  2. User does not have access to database');
            console.error('  3. SQL Server authentication not enabled');
        }
        
        console.error('\n' + '='.repeat(60) + '\n');
        process.exit(1);
    }
}

// Run the test
testConnection();
