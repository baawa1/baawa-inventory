const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if coupons table exists
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons'
      `;
      
      if (tables.length > 0) {
        console.log('✅ Coupons table exists');
      } else {
        console.log('❌ Coupons table does not exist');
      }
      
      // List all tables
      const allTables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log('\n📋 Available tables:');
      allTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
      
    } catch (error) {
      console.error('Error checking tables:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 