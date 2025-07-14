# WooCommerce Migration Guide

## Overview

This guide covers migrating products from WooCommerce to your inventory POS system with full SEO capabilities and Supabase storage integration.

## Database Schema Updates

### Added Fields to Product Model

The following fields have been added to support WooCommerce migration and SEO:

#### Pricing & Sales

- `salePrice` - Sale price for discounted products
- `saleStartDate` - When sale pricing begins
- `saleEndDate` - When sale pricing ends

#### Product Features

- `isFeatured` - Whether product is featured
- `allowReviews` - Whether customer reviews are allowed
- `sortOrder` - Product display order

#### SEO Fields

- `metaExcerpt` - Short meta description
- `metaContent` - Full meta content
- `variantAttributes` - Product variant attributes (JSON)
- `variantValues` - Product variant values (JSON)

#### Image Storage

- `images` - Changed from JSON to String[] for Supabase storage URLs

## WooCommerce CSV Field Mapping

### ✅ Direct Mappings (Already Supported)

| WooCommerce Field       | Database Field        | Notes                 |
| ----------------------- | --------------------- | --------------------- |
| ID                      | Product.id            | Auto-generated        |
| SKU                     | Product.sku           | Unique identifier     |
| Name                    | Product.name          | Product title         |
| Description             | Product.description   | Full description      |
| Short description       | Product.metaExcerpt   | Meta excerpt          |
| Regular price           | Product.price         | Standard price        |
| Sale price              | Product.salePrice     | Discounted price      |
| Date sale price starts  | Product.saleStartDate | Sale start date       |
| Date sale price ends    | Product.saleEndDate   | Sale end date         |
| Stock                   | Product.stock         | Current inventory     |
| Low stock amount        | Product.minStock      | Minimum stock level   |
| Weight (kg)             | Product.weight        | Product weight        |
| Length/Width/Height     | Product.dimensions    | Combined dimensions   |
| Categories              | Product.categoryId    | Primary category      |
| Tags                    | Product.tags          | Product tags array    |
| Brands                  | Product.brandId       | Brand relationship    |
| Published               | Product.status        | Active/inactive       |
| Is featured?            | Product.isFeatured    | Featured product flag |
| Allow customer reviews? | Product.allowReviews  | Review permissions    |
| Position                | Product.sortOrder     | Display order         |
| Images                  | Product.images        | Supabase storage URLs |

### 🔄 Transformed Mappings

| WooCommerce Field        | Database Field            | Transformation  |
| ------------------------ | ------------------------- | --------------- |
| Meta: \_wc_cog_cost      | Product.cost              | Cost of goods   |
| Meta: post_title         | Product.metaTitle         | SEO title       |
| Meta: post_excerpt       | Product.metaDescription   | SEO description |
| Meta: post_content       | Product.metaContent       | Full content    |
| Attribute 1/2 name/value | Product.variantAttributes | JSON structure  |

### ❌ Excluded Fields (Not Needed)

- GTIN, UPC, EAN, or ISBN
- Meta: rank_math_seo_score
- Meta: rank_math_primary_product_cat
- Sold individually?
- Backorders allowed?
- Shipping class

## Setup Instructions

### 1. Set Up Supabase Storage

```bash
# Set up the product-images storage bucket
node scripts/setup-supabase-storage.js
```

This creates:

- `product-images` bucket with public access
- RLS policies for authenticated uploads
- 5MB file size limit
- Supported formats: JPEG, PNG, WebP, GIF

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 3. Environment Variables

Ensure these are set in your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run Migration

```bash
# Import WooCommerce products
node scripts/woocommerce-import.js wc-product-export-18-6-2025-1750220421093.csv
```

## Migration Process

### What the Script Does

1. **CSV Parsing**: Handles complex CSV with quoted fields
2. **Duplicate Detection**: Skips existing products by SKU
3. **Brand/Category Creation**: Auto-creates missing brands and categories
4. **Image Processing**:
   - Downloads images from WooCommerce URLs
   - Uploads to Supabase storage
   - Updates product with new URLs
5. **SEO Optimization**: Maps all SEO fields
6. **Variant Support**: Handles product variants and attributes

### Image Migration

- Downloads images from WooCommerce URLs
- Generates unique filenames: `{SKU}_{timestamp}_{random}.{ext}`
- Uploads to Supabase `product-images` bucket
- Updates product with public URLs
- Handles multiple images per product

### SEO Features

- **Meta Titles**: From WooCommerce post titles
- **Meta Descriptions**: From excerpts and descriptions
- **Keywords**: Extracted from product tags
- **Structured Data**: Ready for search engines

## Post-Migration Tasks

### 1. Verify Data

```sql
-- Check imported products
SELECT COUNT(*) as total_products FROM products;

-- Check brands and categories
SELECT COUNT(*) as total_brands FROM brands;
SELECT COUNT(*) as total_categories FROM categories;

-- Check images
SELECT COUNT(*) as products_with_images
FROM products
WHERE array_length(images, 1) > 0;
```

### 2. Update Product Images

If you need to update existing products to use Supabase storage:

```javascript
// Use the uploadImageToSupabase function from the import script
const supabaseUrl = await uploadImageToSupabase(oldImageUrl, productSku);
```

### 3. SEO Optimization

- Review and update meta titles/descriptions
- Add structured data markup
- Set up sitemap generation
- Configure canonical URLs

## Troubleshooting

### Common Issues

1. **Image Upload Failures**
   - Check Supabase storage permissions
   - Verify image URLs are accessible
   - Check file size limits

2. **CSV Parsing Errors**
   - Ensure proper CSV format
   - Check for special characters in fields
   - Verify encoding (UTF-8)

3. **Duplicate Products**
   - Script automatically skips existing SKUs
   - Check for SKU conflicts

### Performance Tips

- Process images in batches
- Add delays between uploads
- Monitor Supabase storage usage
- Use connection pooling for database

## API Integration

### Product Endpoints

Your existing API endpoints will work with the new fields:

```typescript
// Get products with SEO data
GET /api/products

// Get featured products
GET /api/products?featured=true

// Get products by category
GET /api/products?categoryId=1
```

### Image URLs

Images are now served from Supabase:

```
https://your-project.supabase.co/storage/v1/object/public/product-images/filename.jpg
```

## Next Steps

1. **Testing**: Verify all products imported correctly
2. **SEO Setup**: Configure meta tags and structured data
3. **Performance**: Optimize image loading and caching
4. **Monitoring**: Set up alerts for storage usage
5. **Backup**: Create regular backups of product data

## Support

For issues with the migration:

1. Check the console output for specific errors
2. Verify environment variables are set correctly
3. Ensure Supabase storage is properly configured
4. Review the migration logs for skipped/error products
