/**
 * Test ERPNext API Connection
 * Run this to verify your API keys are working
 */

const axios = require('axios');

// Load environment variables if using .env file
try {
    require('dotenv').config();
} catch (e) {
    console.log('dotenv not loaded, using direct configuration');
}

// Configuration - Update these values or use .env file
const config = {
    baseUrl: process.env.ERPNEXT_URL || 'http://localhost:8000',
    apiKey: process.env.ERPNEXT_API_KEY || 'YOUR_API_KEY',
    apiSecret: process.env.ERPNEXT_API_SECRET || 'YOUR_API_SECRET'
};

// Create axios instance
const erpnextAPI = axios.create({
    baseURL: config.baseUrl,
    headers: {
        'Authorization': `token ${config.apiKey}:${config.apiSecret}`,
        'Content-Type': 'application/json'
    }
});

async function testConnection() {
    console.log('\n🔌 Testing ERPNext API Connection...\n');
    console.log('Configuration:');
    console.log('  Base URL:', config.baseUrl);
    console.log('  API Key:', config.apiKey.substring(0, 10) + '...');
    console.log('  API Secret:', config.apiSecret.substring(0, 10) + '...\n');
    
    try {
        // Test 1: Get logged user
        console.log('Test 1: Authentication...');
        const authResponse = await erpnextAPI.get('/api/method/frappe.auth.get_logged_user');
        console.log('✅ Authentication successful!');
        console.log('   Logged in as:', authResponse.data.message);
        
        // Test 2: Get system settings
        console.log('\nTest 2: Fetching system info...');
        const versionResponse = await erpnextAPI.get('/api/method/frappe.utils.change_log.get_versions');
        console.log('✅ System info retrieved!');
        if (versionResponse.data.message) {
            const versions = versionResponse.data.message;
            console.log('   ERPNext version:', versions.erpnext || 'N/A');
            console.log('   Frappe version:', versions.frappe || 'N/A');
        }
        
        // Test 3: List customers
        console.log('\nTest 3: Fetching customers...');
        const customerResponse = await erpnextAPI.get('/api/resource/Customer?limit_page_length=5');
        console.log('✅ Customer data retrieved!');
        console.log('   Total customers found:', customerResponse.data.data.length);
        if (customerResponse.data.data.length > 0) {
            console.log('   Sample customers:');
            customerResponse.data.data.forEach((customer, index) => {
                console.log(`     ${index + 1}. ${customer.name} - ${customer.customer_name}`);
            });
        }
        
        // Test 4: List items
        console.log('\nTest 4: Fetching items...');
        const itemResponse = await erpnextAPI.get('/api/resource/Item?limit_page_length=5');
        console.log('✅ Item data retrieved!');
        console.log('   Total items found:', itemResponse.data.data.length);
        if (itemResponse.data.data.length > 0) {
            console.log('   Sample items:');
            itemResponse.data.data.forEach((item, index) => {
                console.log(`     ${index + 1}. ${item.name} - ${item.item_name}`);
            });
        }
        
        // Test 5: Get company info
        console.log('\nTest 5: Fetching company info...');
        const companyResponse = await erpnextAPI.get('/api/resource/Company?limit_page_length=5');
        console.log('✅ Company data retrieved!');
        if (companyResponse.data.data.length > 0) {
            console.log('   Available companies:');
            companyResponse.data.data.forEach((company, index) => {
                console.log(`     ${index + 1}. ${company.name} - ${company.company_name}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 ALL TESTS PASSED!');
        console.log('Your ERPNext API connection is working correctly.');
        console.log('You can now run: node erpnext_integration.js');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ CONNECTION TEST FAILED');
        console.log('='.repeat(60));
        
        if (error.response) {
            console.log('\nError Details:');
            console.log('  Status:', error.response.status);
            console.log('  Message:', error.response.data?.message || error.response.statusText);
            
            if (error.response.status === 401) {
                console.log('\n⚠️  Authentication Error!');
                console.log('    Your API keys are incorrect or invalid.');
                console.log('\nPlease check:');
                console.log('  1. API keys are correctly set in .env file');
                console.log('  2. Keys were generated for the right user');
                console.log('  3. Keys haven\'t been regenerated (old keys stop working)');
                console.log('\nTo generate new keys, run:');
                console.log('  bench --site localhost execute generate_api_keys.py');
            } else if (error.response.status === 403) {
                console.log('\n⚠️  Permission Error!');
                console.log('    Your user doesn\'t have permission to access the API.');
                console.log('    Make sure the user has appropriate roles.');
            } else if (error.response.status === 404) {
                console.log('\n⚠️  Not Found!');
                console.log('    The endpoint doesn\'t exist.');
                console.log('    Check your ERPNext URL:', config.baseUrl);
            }
        } else if (error.request) {
            console.log('\n⚠️  Connection Error!');
            console.log('    Cannot connect to ERPNext server.');
            console.log('\nPlease check:');
            console.log('  1. ERPNext is running (bench start)');
            console.log('  2. URL is correct:', config.baseUrl);
            console.log('  3. No firewall blocking the connection');
        } else {
            console.log('\nError:', error.message);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        process.exit(1);
    }
}

// Run the test
testConnection();
