# Image Upload Enhancements

## Overview

The image upload system has been enhanced to generate meaningful filenames based on product information, improving SEO, organization, and user experience.

## Features

### 1. Meaningful Filename Generation

**Before:** `1752648219444_o4dge2dapho.png`
**After:** `iphone-15-pro-max_apple-inc_smartphones_01.jpg`

#### Filename Format

```
{product-name}_{brand}_{category}_{increment}.{extension}
```

#### Components:

- **Product Name**: Cleaned and truncated to 50 characters
- **Brand**: Cleaned and truncated to 30 characters (defaults to "no-brand")
- **Category**: Cleaned and truncated to 30 characters (defaults to "uncategorized")
- **Increment**: Sequential numbering (01, 02, 03, etc.)
- **Extension**: Original file extension preserved

### 2. Smart Alt Text Generation

**Before:** `photo` (original filename without extension)
**After:** `iPhone 15 Pro Max Apple Inc. Smartphones`

#### Alt Text Format:

- **First Image**: `{Product Name} {Brand} {Category}`
- **Subsequent Images**: `{Product Name} {Brand} {Category} - Image {Number}`

### 3. Conflict Resolution

- Automatically detects filename conflicts
- Adds incremental suffix (e.g., `_1`, `_2`) to resolve conflicts
- Prevents overwriting existing files

## Implementation Details

### ProductImageManager Changes

1. **Product Data Fetching**: Fetches complete product data including brand and category
2. **Filename Generation**: Creates meaningful filenames before upload
3. **Alt Text Generation**: Sets descriptive alt text based on product information
4. **File Renaming**: Renames files before upload to preserve meaningful names

### Upload Service Changes

1. **Filename Preservation**: Uses provided filename instead of generating random names
2. **Conflict Detection**: Checks for existing files and resolves conflicts
3. **Backward Compatibility**: Maintains compatibility with existing uploads

## Benefits

### SEO Improvements

- Descriptive filenames improve search engine indexing
- Meaningful alt text enhances accessibility and SEO
- Better image organization for content management

### User Experience

- Easy to identify images in storage
- Clear file naming convention
- Editable alt text for customization

### Organization

- Consistent naming across all product images
- Easy to sort and filter images
- Better file management

## Usage Examples

### Example 1: iPhone Product

- **Product**: iPhone 15 Pro Max
- **Brand**: Apple Inc.
- **Category**: Smartphones
- **Result**: `iphone-15-pro-max_apple-inc_smartphones_01.jpg`
- **Alt Text**: "iPhone 15 Pro Max Apple Inc. Smartphones"

### Example 2: Product without Brand/Category

- **Product**: Generic Widget
- **Brand**: None
- **Category**: None
- **Result**: `generic-widget_no-brand_uncategorized_01.jpg`
- **Alt Text**: "Generic Widget"

### Example 3: Multiple Images

- **First Image**: `product-name_brand_category_01.jpg`
- **Second Image**: `product-name_brand_category_02.jpg`
- **Alt Text 1**: "Product Name Brand Category"
- **Alt Text 2**: "Product Name Brand Category - Image 2"

## Technical Notes

### Character Limits

- Product name: 50 characters
- Brand name: 30 characters
- Category name: 30 characters

### Special Character Handling

- Removes special characters except alphanumeric and spaces
- Converts spaces to hyphens
- Converts to lowercase for consistency

### File Extensions

- Preserves original file extension
- Supports: jpg, jpeg, png, webp
- Defaults to "jpg" if extension is missing

## Migration

Existing images will continue to work normally. New uploads will use the enhanced naming system. No migration of existing files is required.

## Future Enhancements

1. **Watermarking**: Add watermark support with meaningful positioning
2. **Multiple Sizes**: Generate thumbnail and preview versions
3. **Format Conversion**: Automatic WebP conversion for modern browsers
4. **AI Alt Text**: AI-powered alt text generation for better descriptions
