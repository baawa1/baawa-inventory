# Product Requirements Document: BaaWA Accessories Inventory Manager & POS

## 1. Introduction/Overview

This document outlines the requirements for a comprehensive Inventory Management System for BaaWA Accessories, a store specializing in wristwatches, shades, and accessories. The system aims to replace manual and fragmented processes by centralizing stock tracking, enabling efficient Point of Sale (POS) transactions, automating product content generation using AI, and seamlessly integrating with Webflow CMS for online product listings.

The goal is to develop a robust application that improves operational efficiency, enhances the sales process, and streamlines online content management, ultimately supporting the growth of BaaWA Accessories.

## 2. Goals

- **Centralize Inventory:** Provide a single source of truth for all product inventory (wristwatches, shades, accessories).
- **Efficient POS:** Implement a fast, reliable, and user-friendly POS system for in-store sales, including offline capabilities.
- **Automate Content Creation:** Leverage AI to generate SEO-optimized and conversion-focused product descriptions and marketing copy.
- **Seamless Webflow Integration:** Ensure automatic and accurate synchronization of product information (details, stock levels, AI-generated content) with the BaaWA Accessories Webflow CMS.
- **Improve Stock Management:** Implement features for low-stock alerts, reorder recommendations, and supplier management to optimize stock levels.
- **Enhance User Experience:** Deliver a role-based, intuitive interface for store staff, managers, and administrators.
- **Data-Driven Decisions:** Enable basic reporting and tracking for sales and inventory.

## 3. User Stories

- **Store Associate:**
  - "As a store associate, I want to quickly find a product by scanning its barcode or searching by name/SKU so that I can add it to the cart for checkout efficiently."
  - "As a store associate, I want to process payments using cash, bank transfer, or a POS machine so that I can complete a customer's purchase."
  - "As a store associate, I want the POS to work offline so that I can continue making sales even if the internet connection is down, and have the data sync later."
  - "As a store associate, I want to be able to apply discounts to items or the total bill as per store policy."
  - "As a store associate, I want to print a clear and detailed receipt for the customer after each transaction."
  - "As a store associate, I want to optionally capture customer details (name, phone, email) for loyalty programs."
- **Store Manager:**
  - "As a store manager, I want to add new products to the inventory system manually or via bulk CSV upload, including details like SKU, price, quantity, supplier, and images."
  - "As a store manager, I want to receive low-stock alerts for products so that I can reorder them before they run out."
  - "As a store manager, I want to manage supplier information and track purchase orders."
  - "As a store manager, I want to update stock levels manually when new shipments arrive or for stock adjustments."
  - "As a store manager, I want to view reports on sales and inventory levels to understand business performance."
  - "As a store manager, I want to define reorder levels and get reorder recommendations."
- **Admin/Owner:**
  - "As an admin, I want full access to all system modules, including user management and system settings."
  - "As an admin, I want to define user roles and permissions (Admin, Manager, Staff)."
  - "As an admin, I want to oversee the AI content generation process, including approving or editing content."
  - "As an admin, I want to manage the integration with Webflow, including triggering manual syncs or enabling auto-sync."
  - "As an admin, I want to export inventory and sales reports to Excel or PDF for further analysis."
- **Product/E-commerce Manager:**
  - "As a product manager, I want to use AI to generate compelling and SEO-optimized product descriptions, titles, and social media blurbs based on product details and images, to save time and improve online conversion rates."
  - "As a product manager, I want to be able to review, edit, and approve AI-generated content before it's published to Webflow."
  - "As a Webflow editor, I want products to be automatically updated on the website after they’re edited in the inventory system and approved for sync."

## 4. Functional Requirements

### 4.1. Inventory Management

1.  **FR1.1:** The system must allow users to add new products with the following details:
    - SKU (unique identifier)
    - Product Category (e.g., wristwatch, shade, accessory)
    - Brand
    - Model Name
    - Cost Price
    - Selling Price
    - Quantity on Hand
    - Supplier Information (link to supplier profile)
    - Product Status (e.g., active, archived, draft)
    - Variants (e.g., color, size) - with individual SKU, price, quantity if necessary.
    - Product Images (support for multiple images per product/variant)
    - Description / Tags
2.  **FR1.2:** The system must support adding new inventory via:
    - Manual data entry through a user interface.
    - Bulk import of products using a CSV file format (with template and column mapping).
3.  **FR1.3:** Stock levels must be automatically decremented upon a completed POS sale.
4.  **FR1.4:** The system must allow manual adjustment of stock levels with a reason/note for the adjustment.
5.  **FR1.5:** The system must support supplier management, including:
    - Storing supplier name, contact details, and products supplied.
    - Creating and tracking purchase orders (PO) with status (e.g., pending, fulfilled, cancelled).
    - Updating stock levels upon PO fulfillment.
6.  **FR1.6:** The system must provide low-stock alerts when product quantity reaches a predefined threshold.
7.  **FR1.7:** The system must allow setting reorder level thresholds for each product.
8.  **FR1.8:** The system should provide reorder recommendations based on sales velocity and reorder levels (basic implementation for MVP).
9.  **FR1.9:** The system must allow users to search and filter the product list by SKU, name, category, brand, etc.
10. **FR1.10:** The system must support archiving products that are no longer active.
11. **FR1.11:** The system must allow exporting inventory reports (e.g., current stock, stock value) to CSV or PDF.

### 4.2. POS Checkout

1.  **FR2.1:** Staff must be able to search for products by name, SKU, or scan a barcode (if barcode scanner is integrated).
2.  **FR2.2:** Staff must be able to add products to a shopping cart.
3.  **FR2.3:** The system must allow applying discounts per item or to the total order amount.
4.  **FR2.4:** The system must support the following payment methods:
    - Cash
    - Bank Transfer
    - POS Machine (external, system records transaction)
    - Wallet/Credit (optional, for future consideration beyond MVP if complex)
5.  **FR2.5:** The system must generate and allow printing of a receipt upon successful payment. The receipt must include:
    - Store name & logo
    - Date & time of transaction
    - List of items (name, quantity, price per item, total item price)
    - Subtotal
    - Discounts applied (per item and/or total)
    - Total amount due
    - Payment method used
    - Staff name (who processed the sale)
    - Optional: Thank you message / return policy.
6.  **FR2.6:** The POS must support an offline mode:
    - Allow transactions to be processed if the internet connection is lost.
    - Store transaction data locally.
    - Automatically sync stored transactions to the server when the connection is restored.
    - Alert staff if offline mode is active and when data is syncing/synced.
7.  **FR2.7:** The system must allow optional capturing of customer information (name, phone number, email) at the point of sale for loyalty programs and marketing.
8.  **FR2.8:** The system must track sales transactions, including items sold, payment method, discounts, and staff member.

### 4.3. AI-Generated Product Content

1.  **FR3.1:** The system must integrate with OpenAI API for content generation.
2.  **FR3.2:** The AI content generation feature must use the following product inputs:
    - Product Category
    - Brand
    - Style/Model
    - Color
    - Key Features (e.g., water-resistant, polarized, material)
    - Uploaded product image(s) (image analysis capabilities if feasible, otherwise based on image metadata/tags if provided).
3.  **FR3.3:** The AI must be able to generate the following content types:
    - Short product description
    - Long product description
    - SEO title
    - SEO meta description
    - Social media blurbs (e.g., for Instagram, Facebook)
    - Bullet-point list of key features.
4.  **FR3.4:** Users (Manager/Admin) must be able to preview AI-generated content.
5.  **FR3.5:** Users (Manager/Admin) must be able to edit and approve AI-generated content before it is used or published.
6.  **FR3.6:** The system should allow input of target SEO keywords to guide the AI.
7.  **FR3.7:** The system should allow selection of a desired tone for the AI-generated content (e.g., stylish, trendy, concise).
8.  **FR3.8:** AI-assisted product generation should be an option when adding new products, populating relevant fields.

### 4.4. Webflow Integration

1.  **FR4.1:** The system must integrate with the Webflow CMS API.
2.  **FR4.2:** The system must allow one-way synchronization of the following product fields from the inventory app to Webflow CMS:
    - Product Name
    - Short Description (AI-generated or manually entered)
    - Long Description (AI-generated or manually entered)
    - Selling Price
    - SKU
    - Product Category
    - Product Images
    - SEO Meta Title (AI-generated or manually entered)
    - SEO Meta Description (AI-generated or manually entered)
    - Stock Status (e.g., in stock, out of stock - optional, based on quantity)
3.  **FR4.3:** Synchronization to Webflow must be triggered:
    - Manually per product by an authorized user (Manager/Admin).
    - Via a batch sync option for multiple selected products.
    - Optionally, via an auto-sync toggle (real-time or near real-time if enabled by admin, for future consideration beyond MVP if complex).
4.  **FR4.4:** The system must provide feedback on the status of Webflow sync operations (e.g., success, failure with error message).

### 4.5. User Management & Roles

1.  **FR5.1:** The system must support user authentication (login/logout).
2.  **FR5.2:** The system must have at least three user roles with distinct permissions:
    - **Admin:** Full access to all system modules, settings, user management, and analytics.
    - **Manager:** Access to inventory management, POS, order management, supplier management, AI content review/approval, Webflow sync, and reporting.
    - **Staff:** Access to POS module for sales transactions, view-only access to product information (e.g., price, stock availability).
3.  **FR5.3:** Admins must be able to create, edit, and deactivate user accounts.

## 5. Non-Goals (Out of Scope for MVP)

- Multi-store support (system designed for a single store location initially).
- Advanced analytics and customizable dashboards (basic reporting only for MVP).
- Employee timesheet management or payroll features.
- Direct integration with external accounting software (e.g., QuickBooks, Xero) - data export will be provided (Phase 2).
- Complex promotion engine (e.g., loyalty points, tiered discounts beyond simple percentage/fixed amount) - basic "buy 2 get 1" is in scope.
- Gift card processing (Phase 2).
- Advanced AI image analysis for content generation (MVP will rely on product attributes).
- Two-way sync with Webflow (sync is from inventory app to Webflow only).

## 6. Design Considerations (Optional)

- **UI/UX:**
  - Clean, minimalist, and modern user interface.
  - Intuitive navigation and user workflows.
  - Responsive design for accessibility on various screen sizes (desktop, tablet for POS).
- **Branding:**
  - Incorporate BaaWA Accessories brand colors and fonts.
- **Technology Stack (as specified):**
  - **Frontend:** Next.js 15, React, TypeScript.
  - **Styling:** Tailwind CSS, Shadcn UI.
  - **Animation:** Framer Motion for subtle transitions and improved UX.
- **Accessibility:**
  - Ensure large enough tap targets for touch interactions (especially in POS).
  - Maintain proper color contrast ratios for readability.
  - Support keyboard navigation where appropriate.

## 7. Technical Considerations (Optional)

- **Frontend Hosting:** Vercel.
- **Backend & Database:** Supabase (PostgreSQL, Auth).
- **AI Integration:** OpenAI API.
- **Webflow Integration:** Webflow CMS API.
- **Offline Storage (POS):** Utilize browser local storage (e.g., IndexedDB) for offline transaction data.
- **Data Import:** Provide clear instructions and a template for CSV product import, including column mapping functionality.
- **Development Environment:** Docker for local development and testing consistency (optional but recommended).
- **Security:** Ensure secure handling of API keys (OpenAI, Webflow) and user data. Implement appropriate authentication and authorization measures via Supabase Auth.

## 8. Success Metrics

- **Inventory Accuracy:** >95% stock accuracy (physical count vs. system count) after 30 days of full system usage.
- **Content Generation Efficiency:** >50% reduction in time spent creating product listings for Webflow.
- **Webflow Sync Reliability:** 0 failed or out-of-sync Webflow product updates due to system error (user error excluded).
- **POS Efficiency:**
  - Average checkout time < X minutes (to be benchmarked against current process).
  - Successful sync of 100% of offline transactions within 24 hours of connection restoration.
  - Track usage of discount features.
- **AI Content Quality:**
  - AI-generated content passes basic grammar and spell checks.
  - AI-generated content incorporates targeted keywords where specified.
  - All AI-generated content is editable before publishing.
  - > 70% approval rate of AI-generated content by staff (requiring minimal edits).
- **User Adoption:** Track active users in each role and gather qualitative feedback on system usability.

## 9. Open Questions

- Specific barcode scanner models to be supported or tested for POS?
- Detailed requirements for "basic reporting" for MVP (e.g., specific sales reports, inventory reports)?
- Any existing specific format for bank transfer confirmations that needs to be accommodated in POS workflow?
- Priority of "Wallet/credit (optional)" for POS beyond MVP?
- Specifics of "buy 2 get 1" promotion logic (e.g., cheapest item free, specific product combinations)?
- Are there any specific data retention policies to consider?
- What are the exact BaaWA Accessories brand colors and fonts to be used? (Need asset files or specifications)

---

This PRD will be used to guide the development of the BaaWA Accessories Inventory Manager.
Date Generated: 17 June 2025
