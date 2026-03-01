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

async function listAllTables() {
    try {
        const pool = await sql.connect(config);
        
        console.log('\n📊 All Tables in MSSQL Database: ' + config.database);
        console.log('='.repeat(80) + '\n');
        
        // Get all tables with row counts
        const tables = await pool.request().query(`
            SELECT 
                t.TABLE_NAME,
                t.TABLE_TYPE,
                p.rows as RecordCount
            FROM INFORMATION_SCHEMA.TABLES t
            LEFT JOIN sys.partitions p ON OBJECT_ID(t.TABLE_NAME) = p.object_id AND p.index_id IN (0,1)
            WHERE t.TABLE_TYPE = 'BASE TABLE'
            ORDER BY t.TABLE_NAME
        `);
        
        console.log('Total Tables:', tables.recordset.length, '\n');
        
        // Group and display tables
        const tableList = [];
        for (const table of tables.recordset) {
            tableList.push({
                'Table Name': table.TABLE_NAME,
                'Records': table.RecordCount || 0
            });
        }
        
        console.table(tableList);
        
        // Get details for key tables
        console.log('\n📋 Detailed Information for Key Tables:\n');
        console.log('='.repeat(80));
        
        const keyTables = ['Customers', 'Invoices', 'Connections', 'Payments', 'Bills', 
                          'Transactions', 'Users', 'Readings', 'Meters', 'Accounts'];
        
        for (const tableName of keyTables) {
            try {
                // Check if table exists
                const exists = tables.recordset.find(t => t.TABLE_NAME === tableName);
                if (!exists) continue;
                
                // Get column info
                const columns = await pool.request().query(`
                    SELECT 
                        COLUMN_NAME,
                        DATA_TYPE,
                        IS_NULLABLE,
                        CHARACTER_MAXIMUM_LENGTH
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${tableName}'
                    ORDER BY ORDINAL_POSITION
                `);
                
                // Get record count
                const count = await pool.request().query(`SELECT COUNT(*) as total FROM [${tableName}]`);
                const recordCount = count.recordset[0].total;
                
                console.log(`\n\n🔹 ${tableName.toUpperCase()} (${recordCount} records)`);
                console.log('─'.repeat(80));
                
                const cols = columns.recordset.map(c => ({
                    'Column': c.COLUMN_NAME,
                    'Type': c.DATA_TYPE,
                    'Nullable': c.IS_NULLABLE,
                    'Max Length': c.CHARACTER_MAXIMUM_LENGTH || 'N/A'
                }));
                
                console.table(cols);
                
                // Show sample data
                if (recordCount > 0) {
                    console.log(`\n   Sample Record (first row):`);
                    const sample = await pool.request().query(`SELECT TOP 1 * FROM [${tableName}]`);
                    if (sample.recordset.length > 0) {
                        const record = sample.recordset[0];
                        Object.keys(record).forEach(key => {
                            const value = record[key];
                            const displayValue = value ? String(value).substring(0, 50) : 'NULL';
                            console.log(`   ${key.padEnd(25)}: ${displayValue}`);
                        });
                    }
                }
                
            } catch (err) {
                // Table doesn't exist, skip
            }
        }
        
        await pool.close();
        console.log('\n' + '='.repeat(80));
        console.log('✅ Database scan complete!\n');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listAllTables();
