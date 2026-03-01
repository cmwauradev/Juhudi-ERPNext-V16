/**
 * Simple Example: Create a Sales Invoice in ERPNext
 * 
 * This script demonstrates how to add an invoice to the Sales Invoice table
 * Run with: node create_invoice_example.js
 */

const axios = require('axios');
require('dotenv').config();

// API Configuration
const api = axios.create({
    baseURL: process.env.ERPNEXT_URL || 'http://localhost:8000',
    headers: {
        'Authorization': `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`,
        'Content-Type': 'application/json'
    }
});

// Get today's date and future date (15 days from now)
const today = new Date().toISOString().split('T')[0];
const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

async function createInvoice() {
    console.log('\n💰 Creating Sales Invoice...\n');
    
    try {
        // Invoice data
        const invoiceData = {
            customer: 'Acme Corporation Ltd - 1',      // Use existing customer
            company: 'Juhudi Smart Solutions',
            posting_date: today,
            due_date: dueDate,
            currency: 'KES',
            
            // Invoice items
            items: [
                {
                    item_code: 'PROD-TEST-001',
                    qty: 10,
                    rate: 5000.00,
                    description: 'Premium Product - Monthly Order'
                }
            ],
            
            // Optional fields
            remarks: 'Invoice created via Node.js API',
            po_no: 'PO-2026-001',
            po_date: today
        };
        
        // Create the invoice
        const response = await api.post('/api/resource/Sales Invoice', invoiceData);
        const invoice = response.data.data;
        
        console.log('✅ SUCCESS! Invoice created in database: _435e0475cf331d3a');
        console.log('─'.repeat(60));
        console.log('Invoice ID:     ', invoice.name);
        console.log('Customer:       ', invoice.customer);
        console.log('Posting Date:   ', invoice.posting_date);
        console.log('Due Date:       ', invoice.due_date);
        console.log('Currency:       ', invoice.currency);
        console.log('Total Amount:   ', invoice.total, 'KES');
        console.log('Grand Total:    ', invoice.grand_total, 'KES');
        console.log('Status:         ', invoice.status);
        console.log('─'.repeat(60));
        console.log('\n🌐 View in ERPNext:');
        console.log(`   http://localhost:8000/app/sales-invoice/${invoice.name}`);
        console.log('\n📊 Database Table: tabSales Invoice\n');
        
    } catch (error) {
        console.error('\n❌ ERROR creating invoice:');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data?.message || error.response.statusText);
            
            if (error.response.data?.exc) {
                console.error('\nDetails:');
                console.error(error.response.data.exc);
            }
        } else {
            console.error(error.message);
        }
        console.log('');
    }
}

// Run the function
createInvoice();
