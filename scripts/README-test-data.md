# Test Data Generation Script

This script generates comprehensive test data for all tables in the Inventory POS system database.

## Overview

The `generate-complete-test-data.js` script creates realistic test data for:

- **Users** (Admin, Managers, Staff)
- **Suppliers** with contact information
- **Categories** and **Subcategories**
- **Brands** with descriptions
- **Products** with variants, pricing, and inventory
- **Sales Transactions** and **Sales Items**
- **Purchase Orders** and **Purchase Order Items**
- **Stock Additions**, **Adjustments**, and **Reconciliations**
- **Audit Logs** for tracking changes
- **AI Content** for product descriptions
- **Webflow Sync** records
- **Rate Limits** and **Session Blacklist**

## Prerequisites

1. **Database Setup**: Ensure your database is properly set up and migrations are applied
2. **Environment Variables**: Make sure your `.env` file has the correct `DATABASE_URL`
3. **Dependencies**: Install required packages:
   ```bash
   npm install bcryptjs
   ```

## Usage

### Generate Test Data

```bash
npm run seed:test-data
```

### Generate Test Data with Reset (Optional)

If you want to clear existing data first (be careful in production!):

```bash
npm run seed:test-data:reset
```

### Direct Script Execution

```bash
node scripts/generate-complete-test-data.js
```

## Default Admin Credentials

After running the script, you can log in with:

- **Email**: `baawapay+admin.user@gmail.com`
- **Password**: `password123`

## Generated Data Summary

The script creates the following test data:

| Table                 | Count | Description                                 |
| --------------------- | ----- | ------------------------------------------- |
| Users                 | 14    | 1 Admin, 3 Managers, 10 Staff               |
| Suppliers             | 15    | Various suppliers with contact info         |
| Categories            | 35    | 15 main + 20 subcategories                  |
| Brands                | 30    | Popular electronics brands                  |
| Products              | 50    | Various products with pricing               |
| Product Variants      | ~15   | Variants for products with hasVariants=true |
| Sales Transactions    | 100   | Completed sales with customers              |
| Sales Items           | ~300  | Individual items in transactions            |
| Stock Additions       | 50    | Inventory additions from suppliers          |
| Purchase Orders       | 30    | Orders to suppliers                         |
| Purchase Order Items  | ~150  | Items in purchase orders                    |
| Stock Adjustments     | 40    | Inventory adjustments                       |
| Stock Reconciliations | 20    | Monthly reconciliations                     |
| Reconciliation Items  | ~400  | Individual items in reconciliations         |
| Audit Logs            | 200   | System activity logs                        |
| AI Content            | 30    | AI-generated product content                |
| Webflow Sync          | 20    | E-commerce sync records                     |
| Rate Limits           | 4     | API rate limiting records                   |
| Session Blacklist     | 10    | Blacklisted sessions                        |

## Data Relationships

The script maintains proper relationships between tables:

- Products are linked to Categories, Brands, and Suppliers
- Sales Items reference Products and Product Variants
- Stock operations are linked to Users and Products
- Purchase Orders are linked to Suppliers and Users
- All audit trails maintain proper user references

## Customization

You can modify the script to:

1. **Change data volumes**: Adjust the loop counts in each seeding function
2. **Modify data ranges**: Update the `randomNumber()` and `randomDecimal()` calls
3. **Add new data types**: Extend the arrays at the top of the file
4. **Change default values**: Modify the default admin credentials or other defaults

## Safety Features

- **No data deletion**: The script only adds data, doesn't delete existing records
- **Unique constraints**: Uses proper SKU generation and unique identifiers
- **Realistic data**: Generates realistic Nigerian business data (cities, phone numbers, etc.)
- **Proper relationships**: Maintains referential integrity

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` in `.env`
   - Ensure database is running and accessible

2. **Unique Constraint Violations**
   - The script generates unique values, but if run multiple times, you may get conflicts
   - Use the reset option or manually clear tables first

3. **Memory Issues**
   - For large datasets, consider running in smaller batches
   - Monitor your database connection limits

### Error Recovery

If the script fails partway through:

1. Check the console output for the specific error
2. Fix the underlying issue (usually database-related)
3. Re-run the script - it will continue from where it left off

## Production Considerations

⚠️ **Warning**: This script is designed for development and testing environments only.

- **Never run in production** without proper backups
- **Test thoroughly** in a staging environment first
- **Review the data** before deploying to production
- **Consider data privacy** - the script generates realistic but fictional data

## Support

For issues or questions about the test data generation:

1. Check the console output for specific error messages
2. Verify your database schema matches the Prisma schema
3. Ensure all required dependencies are installed
4. Review the database connection and permissions

## Script Structure

```
scripts/
├── generate-complete-test-data.js  # Main seeding script
└── README-test-data.md            # This documentation
```

The main script is organized into individual seeding functions for each table, making it easy to modify or extend specific parts of the data generation process.
