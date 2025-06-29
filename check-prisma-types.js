const { PrismaClient } = require('@prisma/client');

// Just check the type definitions for SalesItem and SalesTransaction
console.log('SalesItem fields would typically be:');
console.log('- id, transaction_id, product_id, variant_id, quantity, unit_price, total_price, discount_amount, created_at');

console.log('\nSalesTransaction fields would typically be:');  
console.log('- id, transaction_number, customer_name, customer_email, customer_phone, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, transaction_type, notes, user_id, created_at, updated_at');
