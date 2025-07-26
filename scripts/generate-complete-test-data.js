#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Test data arrays
const firstNames = [
  "John",
  "Jane",
  "Michael",
  "Sarah",
  "David",
  "Emily",
  "Robert",
  "Lisa",
  "James",
  "Jennifer",
  "William",
  "Jessica",
  "Richard",
  "Amanda",
  "Thomas",
  "Nicole",
  "Christopher",
  "Stephanie",
  "Daniel",
  "Melissa",
  "Matthew",
  "Ashley",
  "Anthony",
  "Elizabeth",
  "Mark",
  "Megan",
  "Donald",
  "Lauren",
  "Steven",
  "Rachel",
  "Paul",
  "Kimberly",
  "Andrew",
  "Heather",
  "Joshua",
  "Michelle",
  "Kenneth",
  "Tiffany",
  "Kevin",
  "Christina",
  "Brian",
  "Nicole",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
];

// Company names are now included in supplierNames

const productNames = [
  "Wireless Bluetooth Headphones",
  "Smart Fitness Watch",
  "Portable Power Bank",
  "USB-C Laptop Charger",
  "Wireless Mouse",
  "Mechanical Keyboard",
  "Gaming Headset",
  "Webcam HD 1080p",
  "External SSD 1TB",
  "Wireless Earbuds",
  "Tablet Stand",
  "Phone Mount",
  "Cable Organizer",
  "Desk Lamp LED",
  "Monitor Stand",
  "Laptop Cooling Pad",
  "Wireless Charger",
  "Bluetooth Speaker",
  "USB Hub",
  "Screen Protector",
  "Laptop Sleeve",
  "Wireless Keyboard",
  "Gaming Mouse",
  "Microphone USB",
  "Graphics Tablet",
  "Printer Wireless",
  "Scanner Document",
  "Projector Portable",
  "Speaker Bluetooth",
  "Headphones Noise Cancelling",
];

const categoryNames = [
  "Electronics",
  "Computers",
  "Mobile Devices",
  "Audio Equipment",
  "Gaming",
  "Office Supplies",
  "Home & Garden",
  "Sports & Fitness",
  "Fashion",
  "Beauty & Health",
  "Books & Media",
  "Toys & Games",
  "Automotive",
  "Tools & Hardware",
  "Kitchen & Dining",
];

const subcategoryNames = [
  "Smartphones",
  "Laptops",
  "Tablets",
  "Accessories",
  "Components",
  "Peripherals",
  "Networking",
  "Storage",
  "Software",
  "Gaming Consoles",
  "Controllers",
  "VR Headsets",
  "Audio Systems",
  "Speakers",
  "Microphones",
  "Cameras",
  "Video Equipment",
  "Lighting",
  "Furniture",
  "Decor",
];

const brandNames = [
  "Apple",
  "Samsung",
  "Sony",
  "LG",
  "Dell",
  "HP",
  "Lenovo",
  "Asus",
  "Acer",
  "Microsoft",
  "Google",
  "Xiaomi",
  "Huawei",
  "OnePlus",
  "Bose",
  "JBL",
  "Beats",
  "Sennheiser",
  "Logitech",
  "Razer",
  "Corsair",
  "SteelSeries",
  "Nintendo",
  "PlayStation",
  "Xbox",
  "Canon",
  "Nikon",
  "GoPro",
  "DJI",
  "Philips",
  "IKEA",
];

const supplierNames = [
  "TechSupply Pro",
  "Global Electronics",
  "Digital Wholesale",
  "Innovation Distributors",
  "Premium Tech Solutions",
  "Elite Suppliers",
  "Quality Electronics Co",
  "Professional Systems Ltd",
  "Advanced Tech Supply",
  "Modern Solutions Inc",
  "Expert Electronics",
  "Master Distributors",
  "Creative Tech Supply",
  "Future Electronics",
  "Smart Solutions Co",
];

const cities = [
  "Lagos",
  "Abuja",
  "Kano",
  "Ibadan",
  "Port Harcourt",
  "Kaduna",
  "Enugu",
  "Jos",
  "Zaria",
  "Ilorin",
  "Maiduguri",
  "Benin City",
  "Calabar",
  "Katsina",
  "Sokoto",
  "Ogbomosho",
  "Onitsha",
  "Warri",
];

const states = [
  "Lagos",
  "FCT",
  "Kano",
  "Oyo",
  "Rivers",
  "Kaduna",
  "Enugu",
  "Plateau",
  "Kaduna",
  "Kwara",
  "Borno",
  "Edo",
  "Cross River",
  "Katsina",
  "Sokoto",
  "Oyo",
  "Anambra",
  "Delta",
];

const paymentMethods = [
  "CASH",
  "BANK_TRANSFER",
  "POS_MACHINE",
  "CREDIT_CARD",
  "MOBILE_MONEY",
];
const transactionTypes = ["sale", "refund", "exchange"];
const paymentStatuses = ["pending", "completed", "failed", "refunded"];

const adjustmentTypes = ["ADD", "REMOVE", "CORRECT", "DAMAGE", "THEFT"];
const adjustmentStatuses = ["PENDING", "APPROVED", "REJECTED"];
const reconciliationStatuses = ["DRAFT", "PENDING", "APPROVED", "REJECTED"];

// Helper functions
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min, max, decimals = 2) => {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
};

const generateSKU = (prefix) =>
  `${prefix}${Date.now()}${randomNumber(100, 999)}`;
const generateBarcode = () =>
  randomNumber(1000000000000, 9999999999999).toString();
const generateTransactionNumber = () =>
  `TXN${Date.now()}${randomNumber(100, 999)}`;

const generatePhone = () => {
  const prefixes = ["080", "081", "070", "090", "091"];
  return `${randomElement(prefixes)}${randomNumber(10000000, 99999999)}`;
};

const generateEmail = (firstName, lastName) => {
  return `baawapay+${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
};

const generateAddress = () => {
  const streets = [
    "Main Street",
    "Broadway",
    "Park Avenue",
    "Oak Street",
    "Elm Street",
  ];
  const numbers = randomNumber(1, 999);
  return `${numbers} ${randomElement(streets)}`;
};

const generateProductDescription = (name) => {
  const descriptions = [
    `High-quality ${name} with premium features and excellent performance.`,
    `Professional ${name} designed for optimal user experience.`,
    `Advanced ${name} with cutting-edge technology and reliable performance.`,
    `Premium ${name} offering superior quality and durability.`,
    `Modern ${name} with innovative design and exceptional functionality.`,
  ];
  return randomElement(descriptions);
};

const generateImages = () => {
  const imageUrls = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500",
  ];

  return [
    {
      url: randomElement(imageUrls),
      alt: "Product image",
      isPrimary: true,
    },
    {
      url: randomElement(imageUrls),
      alt: "Product image",
      isPrimary: false,
    },
  ];
};

// Main seeding functions
async function seedUsers() {
  console.log("Seeding users...");

  const users = [];
  const hashedPassword = await bcrypt.hash("password123", 12);

  // Check if admin user already exists
  let adminUser = await prisma.user.findUnique({
    where: { email: "baawapay+admin.user@gmail.com" },
  });

  if (!adminUser) {
    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        firstName: "Admin",
        lastName: "User",
        email: "baawapay+admin.user@gmail.com",
        password: hashedPassword,
        phone: generatePhone(),
        role: "ADMIN",
        userStatus: "APPROVED",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
        permissions: [
          "USER_MANAGEMENT",
          "SYSTEM_CONFIGURATION",
          "AUDIT_LOGS",
          "INVENTORY_MANAGEMENT",
          "SALES_MANAGEMENT",
          "REPORTS_ACCESS",
          "POS_ACCESS",
        ],
      },
    });
  }
  users.push(adminUser);

  // Create manager users
  for (let i = 0; i < 3; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const email = generateEmail(firstName, lastName);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email: email,
          password: hashedPassword,
          phone: generatePhone(),
          role: "MANAGER",
          userStatus: "APPROVED",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          permissions: [
            "INVENTORY_MANAGEMENT",
            "SALES_MANAGEMENT",
            "REPORTS_ACCESS",
            "POS_ACCESS",
            "RECONCILIATION_APPROVAL",
          ],
        },
      });
    }
    users.push(user);
  }

  // Create staff users
  for (let i = 0; i < 10; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const email = generateEmail(firstName, lastName);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email: email,
          password: hashedPassword,
          phone: generatePhone(),
          role: "STAFF",
          userStatus: "APPROVED",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          permissions: ["POS_ACCESS", "INVENTORY_VIEW", "SALES_CREATION"],
        },
      });
    }
    users.push(user);
  }

  console.log(`Processed ${users.length} users`);
  return users;
}

async function seedSuppliers() {
  console.log("Seeding suppliers...");

  const suppliers = [];
  for (let i = 0; i < 15; i++) {
    const supplierName = randomElement(supplierNames);

    // Check if supplier already exists
    let supplier = await prisma.supplier.findFirst({
      where: { name: supplierName },
    });

    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: supplierName,
          contactPerson: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
          email: generateEmail(
            randomElement(firstNames),
            randomElement(lastNames)
          ),
          phone: generatePhone(),
          address: generateAddress(),
          city: randomElement(cities),
          state: randomElement(states),
          postalCode: randomNumber(100000, 999999).toString(),
          country: "Nigeria",
          website: `https://www.${supplierName.toLowerCase().replace(/\s+/g, "")}.com`,
          taxNumber: `TAX${randomNumber(100000, 999999)}`,
          paymentTerms: randomElement([
            "Net 30",
            "Net 60",
            "Net 90",
            "Cash on Delivery",
          ]),
          creditLimit: randomDecimal(10000, 1000000),
          notes: "Reliable supplier with good track record",
          isActive: true,
        },
      });
    }
    suppliers.push(supplier);
  }

  console.log(`Processed ${suppliers.length} suppliers`);
  return suppliers;
}

async function seedCategories() {
  console.log("Seeding categories...");

  const categories = [];

  // Create main categories
  for (const categoryName of categoryNames) {
    // Check if category already exists
    let category = await prisma.category.findFirst({
      where: { name: categoryName, parentId: null },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          description: `${categoryName} products and accessories`,
          image: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500`,
          isActive: true,
        },
      });
    }
    categories.push(category);
  }

  // Create subcategories
  for (const subcategoryName of subcategoryNames) {
    // Check if subcategory already exists
    let subcategory = await prisma.category.findFirst({
      where: { name: subcategoryName, parentId: { not: null } },
    });

    if (!subcategory) {
      const parentCategory = randomElement(categories);
      subcategory = await prisma.category.create({
        data: {
          name: subcategoryName,
          description: `${subcategoryName} products`,
          image: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500`,
          isActive: true,
          parentId: parentCategory.id,
        },
      });
    }
    categories.push(subcategory);
  }

  console.log(`Processed ${categories.length} categories`);
  return categories;
}

async function seedBrands() {
  console.log("Seeding brands...");

  const brands = [];
  for (const brandName of brandNames) {
    // Check if brand already exists
    let brand = await prisma.brand.findUnique({
      where: { name: brandName },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: brandName,
          description: `${brandName} - Quality products and innovative solutions`,
          website: `https://www.${brandName.toLowerCase()}.com`,
          image: `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500`,
          isActive: true,
        },
      });
    }
    brands.push(brand);
  }

  console.log(`Processed ${brands.length} brands`);
  return brands;
}

async function seedProducts(categories, brands, suppliers) {
  console.log("Seeding products...");

  const products = [];
  for (let i = 0; i < 50; i++) {
    const productName = randomElement(productNames);
    const cost = randomDecimal(1000, 50000);
    const price = cost * randomDecimal(1.2, 2.5); // 20% to 150% markup
    const stock = randomNumber(0, 1000);

    const product = await prisma.product.create({
      data: {
        name: productName,
        description: generateProductDescription(productName),
        sku: generateSKU("PROD"),
        barcode: generateBarcode(),
        cost: cost,
        price: price,
        stock: stock,
        minStock: randomNumber(5, 50),
        maxStock: randomNumber(200, 2000),
        unit: randomElement(["piece", "box", "pack", "set", "pair"]),
        weight: randomDecimal(0.1, 10),
        dimensions: `${randomNumber(5, 50)}x${randomNumber(5, 50)}x${randomNumber(1, 20)}cm`,
        color: randomElement([
          "Black",
          "White",
          "Silver",
          "Blue",
          "Red",
          "Green",
        ]),
        size: randomElement(["Small", "Medium", "Large", "XL", "XXL"]),
        material: randomElement([
          "Plastic",
          "Metal",
          "Wood",
          "Fabric",
          "Glass",
        ]),
        hasVariants: Math.random() > 0.7, // 30% chance of having variants
        isArchived: false,
        tags: [
          randomElement(["Electronics", "Gaming", "Office", "Home"]),
          randomElement(["New", "Popular", "Featured"]),
        ],
        metaTitle: `${productName} - Best Quality`,
        metaDescription: `High-quality ${productName} with excellent features`,
        seoKeywords: [productName.toLowerCase(), "quality", "best", "premium"],
        status: "active",

        isFeatured: Math.random() > 0.8, // 20% chance of being featured
        metaContent: `Detailed information about ${productName}`,
        metaExcerpt: `Premium ${productName} with advanced features`,
        saleEndDate:
          Math.random() > 0.8
            ? new Date(Date.now() + randomNumber(1, 30) * 24 * 60 * 60 * 1000)
            : null,
        salePrice: Math.random() > 0.8 ? price * randomDecimal(0.7, 0.9) : null,
        saleStartDate:
          Math.random() > 0.8
            ? new Date(Date.now() - randomNumber(1, 7) * 24 * 60 * 60 * 1000)
            : null,
        sortOrder: randomNumber(1, 100),
        variantAttributes:
          Math.random() > 0.7
            ? { color: ["Red", "Blue", "Green"], size: ["S", "M", "L"] }
            : null,
        variantValues: Math.random() > 0.7 ? { color: "Red", size: "M" } : null,
        images: generateImages(),
        categoryId: randomElement(categories).id,
        brandId: randomElement(brands).id,
        supplierId: randomElement(suppliers).id,
      },
    });
    products.push(product);
  }

  console.log(`Created ${products.length} products`);
  return products;
}

async function seedProductVariants(products) {
  console.log("Seeding product variants...");

  const variants = [];
  const productsWithVariants = products.filter((p) => p.hasVariants);

  for (const product of productsWithVariants) {
    const variantCount = randomNumber(2, 5);
    for (let i = 0; i < variantCount; i++) {
      const basePrice = parseFloat(product.price);
      const variantPrice = basePrice * randomDecimal(0.8, 1.3);
      const variantCost = parseFloat(product.cost) * randomDecimal(0.8, 1.2);

      const variant = await prisma.productVariant.create({
        data: {
          name: `${product.name} - ${randomElement(["Red", "Blue", "Green", "Black", "White"])} ${randomElement(["Small", "Medium", "Large"])}`,
          sku: generateSKU("VAR"),
          price: variantPrice,
          cost: variantCost,
          color: randomElement(["Red", "Blue", "Green", "Black", "White"]),
          size: randomElement(["Small", "Medium", "Large"]),
          material: randomElement(["Plastic", "Metal", "Wood", "Fabric"]),
          weight: randomDecimal(0.1, 5),
          dimensions: {
            width: randomNumber(5, 50),
            height: randomNumber(5, 50),
            depth: randomNumber(1, 20),
          },
          current_stock: randomNumber(0, 500),
          min_stock_level: randomNumber(5, 20),
          max_stock_level: randomNumber(200, 1000),
          is_active: true,
          images: generateImages(),
          product_id: product.id,
        },
      });
      variants.push(variant);
    }
  }

  console.log(`Created ${variants.length} product variants`);
  return variants;
}

async function seedSalesTransactions(users, _products, _variants) {
  console.log("Seeding sales transactions...");

  const transactions = [];
  for (let i = 0; i < 100; i++) {
    const user = randomElement(users);
    const transactionNumber = generateTransactionNumber();
    const subtotal = randomDecimal(1000, 50000);
    const taxAmount = subtotal * 0.075; // 7.5% tax
    const discountAmount = subtotal * randomDecimal(0, 0.2); // 0-20% discount
    const totalAmount = subtotal + taxAmount - discountAmount;

    const transaction = await prisma.salesTransaction.create({
      data: {
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        transaction_number: transactionNumber,
        payment_method: randomElement(paymentMethods),
        payment_status: randomElement(paymentStatuses),
        transaction_type: randomElement(transactionTypes),
        customer_name: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        customer_email: generateEmail(
          randomElement(firstNames),
          randomElement(lastNames)
        ),
        customer_phone: generatePhone(),
        notes:
          Math.random() > 0.7 ? "Customer requested special handling" : null,
        user_id: user.id,
      },
    });
    transactions.push(transaction);
  }

  console.log(`Created ${transactions.length} sales transactions`);
  return transactions;
}

async function seedSalesItems(transactions, products, variants) {
  console.log("Seeding sales items...");

  const salesItems = [];
  for (const transaction of transactions) {
    const itemCount = randomNumber(1, 5);
    for (let i = 0; i < itemCount; i++) {
      const useVariant = Math.random() > 0.7;
      const product = randomElement(products);
      const variant = useVariant
        ? randomElement(variants.filter((v) => v.product_id === product.id))
        : null;

      const quantity = randomNumber(1, 10);
      const unitPrice = variant
        ? parseFloat(variant.price)
        : parseFloat(product.price);
      const totalPrice = unitPrice * quantity;
      const discountAmount = totalPrice * randomDecimal(0, 0.15);

      const salesItem = await prisma.salesItem.create({
        data: {
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          discount_amount: discountAmount,
          transaction_id: transaction.id,
          product_id: product.id,
          variant_id: variant ? variant.id : null,
        },
      });
      salesItems.push(salesItem);
    }
  }

  console.log(`Created ${salesItems.length} sales items`);
  return salesItems;
}

async function seedStockAdditions(users, products, suppliers) {
  console.log("Seeding stock additions...");

  const stockAdditions = [];
  for (let i = 0; i < 50; i++) {
    const product = randomElement(products);
    const quantity = randomNumber(10, 500);
    const costPerUnit = parseFloat(product.cost);
    const totalCost = costPerUnit * quantity;

    const stockAddition = await prisma.stockAddition.create({
      data: {
        quantity: quantity,
        costPerUnit: costPerUnit,
        totalCost: totalCost,
        purchaseDate: new Date(
          Date.now() - randomNumber(1, 365) * 24 * 60 * 60 * 1000
        ),
        notes: `Bulk purchase of ${product.name}`,
        referenceNo: `REF${randomNumber(100000, 999999)}`,
        productId: product.id,
        supplierId: randomElement(suppliers).id,
        createdById: randomElement(users).id,
      },
    });
    stockAdditions.push(stockAddition);
  }

  console.log(`Created ${stockAdditions.length} stock additions`);
  return stockAdditions;
}

async function seedStockAdjustments(users, products, variants) {
  console.log("Seeding stock adjustments...");

  const stockAdjustments = [];
  for (let i = 0; i < 40; i++) {
    const user = randomElement(users);
    const useVariant = Math.random() > 0.7;
    const product = randomElement(products);
    const variant = useVariant
      ? randomElement(variants.filter((v) => v.product_id === product.id))
      : null;

    const oldQuantity = variant ? variant.current_stock : product.stock;
    const adjustmentQuantity = randomNumber(1, 50);
    const adjustmentType = randomElement(adjustmentTypes);
    const newQuantity =
      adjustmentType === "ADD"
        ? oldQuantity + adjustmentQuantity
        : adjustmentType === "REMOVE"
          ? Math.max(0, oldQuantity - adjustmentQuantity)
          : randomNumber(0, 200);

    const stockAdjustment = await prisma.stockAdjustment.create({
      data: {
        quantity: adjustmentQuantity,
        reason: `${adjustmentType} adjustment for inventory management`,
        notes: Math.random() > 0.5 ? "Regular inventory adjustment" : null,
        adjustment_type: adjustmentType,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        status: randomElement(adjustmentStatuses),
        reference_number: `ADJ${randomNumber(100000, 999999)}`,
        user_id: user.id,
        product_id: product.id,
        variant_id: variant ? variant.id : null,
        approved_by: Math.random() > 0.3 ? randomElement(users).id : null,
        approved_at: Math.random() > 0.3 ? new Date() : null,
      },
    });
    stockAdjustments.push(stockAdjustment);
  }

  console.log(`Created ${stockAdjustments.length} stock adjustments`);
  return stockAdjustments;
}

async function seedStockReconciliations(users, _products) {
  console.log("Seeding stock reconciliations...");

  const reconciliations = [];
  for (let i = 0; i < 20; i++) {
    const user = randomElement(users);
    const status = randomElement(reconciliationStatuses);

    const reconciliation = await prisma.stockReconciliation.create({
      data: {
        title: `Monthly Stock Reconciliation ${i + 1}`,
        description: `Comprehensive stock count and reconciliation`,
        notes: Math.random() > 0.5 ? "Regular monthly reconciliation" : null,
        status: status,
        createdById: user.id,
        approvedById: status === "APPROVED" ? randomElement(users).id : null,
        submittedAt:
          status !== "DRAFT"
            ? new Date(Date.now() - randomNumber(1, 30) * 24 * 60 * 60 * 1000)
            : null,
        approvedAt:
          status === "APPROVED"
            ? new Date(Date.now() - randomNumber(1, 7) * 24 * 60 * 60 * 1000)
            : null,
      },
    });
    reconciliations.push(reconciliation);
  }

  console.log(`Created ${reconciliations.length} stock reconciliations`);
  return reconciliations;
}

async function seedStockReconciliationItems(reconciliations, products) {
  console.log("Seeding stock reconciliation items...");

  const reconciliationItems = [];
  for (const reconciliation of reconciliations) {
    const productCount = randomNumber(5, 20);
    const selectedProducts = products.slice(0, productCount);

    for (const product of selectedProducts) {
      const systemCount = product.stock;
      const physicalCount = systemCount + randomNumber(-10, 10); // ±10 variance
      const discrepancy = physicalCount - systemCount;
      const estimatedImpact = Math.abs(discrepancy) * parseFloat(product.price);

      const reconciliationItem = await prisma.stockReconciliationItem.create({
        data: {
          systemCount: systemCount,
          physicalCount: physicalCount,
          discrepancy: discrepancy,
          discrepancyReason:
            discrepancy !== 0
              ? randomElement([
                  "Counting error",
                  "Theft",
                  "Damage",
                  "System error",
                ])
              : null,
          estimatedImpact: estimatedImpact,
          notes:
            discrepancy !== 0
              ? "Discrepancy found during physical count"
              : null,
          reconciliationId: reconciliation.id,
          productId: product.id,
        },
      });
      reconciliationItems.push(reconciliationItem);
    }
  }

  console.log(
    `Created ${reconciliationItems.length} stock reconciliation items`
  );
  return reconciliationItems;
}

async function seedAuditLogs(users) {
  console.log("Seeding audit logs...");

  const auditLogs = [];
  const actions = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "APPROVE",
    "REJECT",
  ];
  const tables = [
    "users",
    "products",
    "sales_transactions",

    "stock_adjustments",
  ];

  for (let i = 0; i < 200; i++) {
    const user = randomElement(users);
    const action = randomElement(actions);
    const tableName = randomElement(tables);

    const auditLog = await prisma.auditLog.create({
      data: {
        action: action,
        table_name: tableName,
        record_id: randomNumber(1, 1000),
        user_id: user.id,
        ip_address: `${randomNumber(192, 223)}.${randomNumber(1, 255)}.${randomNumber(1, 255)}.${randomNumber(1, 255)}`,
        user_agent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        old_values:
          Math.random() > 0.5
            ? { name: "Old Value", status: "inactive" }
            : null,
        new_values:
          Math.random() > 0.5 ? { name: "New Value", status: "active" } : null,
      },
    });
    auditLogs.push(auditLog);
  }

  console.log(`Created ${auditLogs.length} audit logs`);
  return auditLogs;
}

async function seedAIContent(users, products) {
  console.log("Seeding AI content...");

  const aiContents = [];
  const contentTypes = [
    "description",
    "meta_title",
    "meta_description",
    "seo_keywords",
  ];
  const models = ["GPT-4", "Claude-3", "Gemini-Pro"];

  for (let i = 0; i < 30; i++) {
    const product = randomElement(products);
    const contentType = randomElement(contentTypes);
    const model = randomElement(models);

    const aiContent = await prisma.aIContent.create({
      data: {
        content_type: contentType,
        generated_content: `AI-generated ${contentType} for ${product.name}`,
        original_content: `Original ${contentType} for ${product.name}`,
        confidence_score: randomDecimal(0.7, 1.0, 2),
        model_used: model,
        prompt_used: `Generate ${contentType} for ${product.name}`,
        is_approved: Math.random() > 0.3,
        approved_by: Math.random() > 0.3 ? randomElement(users).id : null,
        approved_at: Math.random() > 0.3 ? new Date() : null,
        product_id: product.id,
      },
    });
    aiContents.push(aiContent);
  }

  console.log(`Created ${aiContents.length} AI content records`);
  return aiContents;
}

async function _seedContentSync(products, categories, brands) {
  console.log("Seeding Content sync...");

  const contentSyncs = [];
  const syncStatuses = ["pending", "synced", "failed"];

  // Create content sync records for products
  for (let i = 0; i < 10; i++) {
    const product = randomElement(products);
    const syncStatus = randomElement(syncStatuses);

    const contentSync = await prisma.contentSync.create({
      data: {
        entity_type: "product",
        entity_id: product.id,
        sync_status: syncStatus,
        last_sync_at:
          syncStatus === "synced"
            ? new Date(Date.now() - randomNumber(1, 30) * 24 * 60 * 60 * 1000)
            : null,
        sync_errors: syncStatus === "failed" ? "Connection timeout" : null,
        retry_count: syncStatus === "failed" ? randomNumber(1, 3) : 0,
        webhook_url:
          syncStatus === "synced"
            ? `https://webhook.site/${randomNumber(10000, 99999)}`
            : null,
      },
    });
    contentSyncs.push(contentSync);
  }

  // Create content sync records for categories
  for (let i = 0; i < 5; i++) {
    const category = randomElement(categories);
    const syncStatus = randomElement(syncStatuses);

    const contentSync = await prisma.contentSync.create({
      data: {
        entity_type: "category",
        entity_id: category.id,
        sync_status: syncStatus,
        last_sync_at:
          syncStatus === "synced"
            ? new Date(Date.now() - randomNumber(1, 30) * 24 * 60 * 60 * 1000)
            : null,
        sync_errors: syncStatus === "failed" ? "Connection timeout" : null,
        retry_count: syncStatus === "failed" ? randomNumber(1, 3) : 0,
        webhook_url:
          syncStatus === "synced"
            ? `https://webhook.site/${randomNumber(10000, 99999)}`
            : null,
      },
    });
    contentSyncs.push(contentSync);
  }

  // Create content sync records for brands
  for (let i = 0; i < 5; i++) {
    const brand = randomElement(brands);
    const syncStatus = randomElement(syncStatuses);

    const contentSync = await prisma.contentSync.create({
      data: {
        entity_type: "brand",
        entity_id: brand.id,
        sync_status: syncStatus,
        last_sync_at:
          syncStatus === "synced"
            ? new Date(Date.now() - randomNumber(1, 30) * 24 * 60 * 60 * 1000)
            : null,
        sync_errors: syncStatus === "failed" ? "Connection timeout" : null,
        retry_count: syncStatus === "failed" ? randomNumber(1, 3) : 0,
        webhook_url:
          syncStatus === "synced"
            ? `https://webhook.site/${randomNumber(10000, 99999)}`
            : null,
      },
    });
    contentSyncs.push(contentSync);
  }

  console.log(`Created ${contentSyncs.length} Content sync records`);
  return contentSyncs;
}

async function seedRateLimits() {
  console.log("Seeding rate limits...");

  const rateLimits = [];
  const keys = ["login", "api", "register", "password_reset"];

  for (const key of keys) {
    const rateLimit = await prisma.rateLimit.create({
      data: {
        key: key,
        count: randomNumber(1, 10),
      },
    });
    rateLimits.push(rateLimit);
  }

  console.log(`Created ${rateLimits.length} rate limit records`);
  return rateLimits;
}

async function seedSessionBlacklist(users) {
  console.log("Seeding session blacklist...");

  const sessionBlacklists = [];
  const reasons = ["logout", "security", "expired", "suspicious_activity"];

  for (let i = 0; i < 10; i++) {
    const user = randomElement(users);
    const reason = randomElement(reasons);

    const sessionBlacklist = await prisma.sessionBlacklist.create({
      data: {
        sessionId: `session_${randomNumber(100000, 999999)}`,
        userId: user.id,
        reason: reason,
        blacklistedAt: new Date(
          Date.now() - randomNumber(1, 30) * 24 * 60 * 60 * 1000
        ),
        expiresAt: new Date(
          Date.now() + randomNumber(1, 7) * 24 * 60 * 60 * 1000
        ),
      },
    });
    sessionBlacklists.push(sessionBlacklist);
  }

  console.log(`Created ${sessionBlacklists.length} session blacklist records`);
  return sessionBlacklists;
}

async function seedFinancialTransactions(users) {
  console.log("Seeding financial transactions...");

  const financialTransactions = [];
  const paymentMethods = [
    "CASH",
    "BANK_TRANSFER",
    "POS_MACHINE",
    "CREDIT_CARD",
    "MOBILE_MONEY",
  ];
  const expenseTypes = [
    "INVENTORY_PURCHASES",
    "UTILITIES",
    "RENT",
    "SALARIES",
    "MARKETING",
    "OFFICE_SUPPLIES",
    "TRAVEL",
    "INSURANCE",
    "MAINTENANCE",
    "OTHER",
  ];
  const incomeSources = [
    "SALES",
    "SERVICES",
    "INVESTMENTS",
    "ROYALTIES",
    "COMMISSIONS",
    "OTHER",
  ];
  const statuses = [
    "PENDING",
    "COMPLETED",
    "CANCELLED",
    "APPROVED",
    "REJECTED",
  ];

  // Generate income transactions
  for (let i = 0; i < 25; i++) {
    const user = randomElement(users);
    const isApproved = Math.random() > 0.3; // 70% approved
    const approver = isApproved
      ? randomElement(
          users.filter((u) => u.role === "ADMIN" || u.role === "MANAGER")
        )
      : null;
    const incomeSource = randomElement(incomeSources);
    const paymentMethod = randomElement(paymentMethods);
    const amount = randomDecimal(5000, 500000, 2);
    const status = isApproved ? "COMPLETED" : randomElement(statuses);

    const transaction = await prisma.financialTransaction.create({
      data: {
        transactionNumber: `FIN-${Date.now()}-${randomNumber(100, 999)}`,
        type: "INCOME",
        amount: amount,
        description: `Income from ${incomeSource.toLowerCase()} - ${randomElement(
          [
            "Monthly revenue",
            "Service payment",
            "Investment return",
            "Commission payment",
            "Royalty payment",
          ]
        )}`,
        transactionDate: new Date(
          Date.now() - randomNumber(1, 90) * 24 * 60 * 60 * 1000
        ),
        paymentMethod: paymentMethod,
        status: status,
        approvedBy: approver?.id || null,
        approvedAt: isApproved ? new Date() : null,
        createdBy: user.id,
      },
    });

    // Create income detail
    await prisma.incomeDetail.create({
      data: {
        transactionId: transaction.id,
        incomeSource: incomeSource,
        payerName: randomElement([
          "Various Customers",
          "Service Clients",
          "Investment Account",
          "Partner Company",
          "Royalty Holder",
        ]),
      },
    });

    financialTransactions.push(transaction);
  }

  // Generate expense transactions
  for (let i = 0; i < 30; i++) {
    const user = randomElement(users);
    const isApproved = Math.random() > 0.2; // 80% approved
    const approver = isApproved
      ? randomElement(
          users.filter((u) => u.role === "ADMIN" || u.role === "MANAGER")
        )
      : null;
    const expenseType = randomElement(expenseTypes);
    const paymentMethod = randomElement(paymentMethods);
    const amount = randomDecimal(1000, 200000, 2);
    const status = isApproved ? "COMPLETED" : randomElement(statuses);

    const transaction = await prisma.financialTransaction.create({
      data: {
        transactionNumber: `FIN-${Date.now()}-${randomNumber(100, 999)}`,
        type: "EXPENSE",
        amount: amount,
        description: `Expense for ${expenseType.toLowerCase().replace("_", " ")} - ${randomElement(
          [
            "Monthly payment",
            "Service fee",
            "Maintenance cost",
            "Operational expense",
            "Business cost",
          ]
        )}`,
        transactionDate: new Date(
          Date.now() - randomNumber(1, 90) * 24 * 60 * 60 * 1000
        ),
        paymentMethod: paymentMethod,
        status: status,
        approvedBy: approver?.id || null,
        approvedAt: isApproved ? new Date() : null,
        createdBy: user.id,
      },
    });

    // Create expense detail
    await prisma.expenseDetail.create({
      data: {
        transactionId: transaction.id,
        expenseType: expenseType,
        vendorName: randomElement([
          "Property Management Ltd",
          "Ikeja Electric",
          "Staff Payroll",
          "Marketing Agency",
          "Office Supplies Co",
          "Travel Agency",
          "Insurance Company",
          "Maintenance Services",
        ]),
      },
    });

    financialTransactions.push(transaction);
  }

  console.log(`Created ${financialTransactions.length} financial transactions`);
  return financialTransactions;
}

async function seedFinancialReports(users) {
  console.log("Seeding financial reports...");

  const financialReports = [];
  const reportTypes = ["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"];
  const reportNames = [
    "Monthly Financial Summary",
    "Quarterly Revenue Report",
    "Annual Financial Statement",
    "Expense Analysis Report",
    "Income vs Expense Report",
    "Cash Flow Statement",
    "Profit & Loss Report",
    "Budget vs Actual Report",
  ];

  for (let i = 0; i < 15; i++) {
    const user = randomElement(
      users.filter((u) => u.role === "ADMIN" || u.role === "MANAGER")
    );
    const reportType = randomElement(reportTypes);
    const reportName = randomElement(reportNames);

    // Generate report data
    const reportData = {
      totalIncome: randomDecimal(100000, 2000000, 2),
      totalExpenses: randomDecimal(50000, 1500000, 2),
      netProfit: randomDecimal(50000, 500000, 2),
      transactionCount: randomNumber(50, 500),
      averageTransactionValue: randomDecimal(5000, 50000, 2),
      topExpenseCategories: [
        {
          category: "INVENTORY_PURCHASES",
          amount: randomDecimal(20000, 300000, 2),
        },
        { category: "SALARIES", amount: randomDecimal(15000, 200000, 2) },
        { category: "RENT", amount: randomDecimal(5000, 100000, 2) },
      ],
      topIncomeSources: [
        { source: "SALES", amount: randomDecimal(50000, 800000, 2) },
        { source: "SERVICES", amount: randomDecimal(10000, 200000, 2) },
        { source: "COMMISSIONS", amount: randomDecimal(5000, 100000, 2) },
      ],
    };

    const periodStart = new Date(
      Date.now() - randomNumber(30, 365) * 24 * 60 * 60 * 1000
    );
    const periodEnd = new Date(
      periodStart.getTime() + randomNumber(30, 90) * 24 * 60 * 60 * 1000
    );

    const report = await prisma.financialReport.create({
      data: {
        reportType: reportType,
        reportName: reportName,
        periodStart: periodStart,
        periodEnd: periodEnd,
        reportData: reportData,
        generatedBy: user.id,
        fileUrl:
          Math.random() > 0.5
            ? `https://reports.example.com/${reportType.toLowerCase()}-${Date.now()}.pdf`
            : null,
      },
    });

    financialReports.push(report);
  }

  console.log(`Created ${financialReports.length} financial reports`);
  return financialReports;
}

// Main seeding function
async function main() {
  try {
    console.log("Starting comprehensive test data generation...");

    // Seed data in order of dependencies
    const users = await seedUsers();
    const suppliers = await seedSuppliers();
    const categories = await seedCategories();
    const brands = await seedBrands();
    const products = await seedProducts(categories, brands, suppliers);
    const variants = await seedProductVariants(products);
    const transactions = await seedSalesTransactions(users, products, variants);
    const salesItems = await seedSalesItems(transactions, products, variants);
    const stockAdditions = await seedStockAdditions(users, products, suppliers);

    const stockAdjustments = await seedStockAdjustments(
      users,
      products,
      variants
    );
    const reconciliations = await seedStockReconciliations(users, products);
    const reconciliationItems = await seedStockReconciliationItems(
      reconciliations,
      products
    );
    const auditLogs = await seedAuditLogs(users);
    const aiContents = await seedAIContent(users, products);
    // const _contentSyncs = await seedContentSync(products, categories, brands);
    const rateLimits = await seedRateLimits();
    const sessionBlacklists = await seedSessionBlacklist(users);
    const financialTransactions = await seedFinancialTransactions(users);
    const financialReports = await seedFinancialReports(users);

    console.log("\n✅ Test data generation completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Users: ${users.length}`);
    console.log(`- Suppliers: ${suppliers.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Brands: ${brands.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Product Variants: ${variants.length}`);
    console.log(`- Sales Transactions: ${transactions.length}`);
    console.log(`- Sales Items: ${salesItems.length}`);
    console.log(`- Stock Additions: ${stockAdditions.length}`);

    console.log(`- Stock Adjustments: ${stockAdjustments.length}`);
    console.log(`- Stock Reconciliations: ${reconciliations.length}`);
    console.log(`- Reconciliation Items: ${reconciliationItems.length}`);
    console.log(`- Audit Logs: ${auditLogs.length}`);
    console.log(`- AI Content: ${aiContents.length}`);
    // console.log(`- Content Sync: ${_contentSyncs.length}`);
    console.log(`- Rate Limits: ${rateLimits.length}`);
    console.log(`- Session Blacklist: ${sessionBlacklists.length}`);
    console.log(`- Financial Transactions: ${financialTransactions.length}`);
    console.log(`- Financial Reports: ${financialReports.length}`);

    console.log("\n🔑 Default admin credentials:");
    console.log("Email: admin@inventory.com");
    console.log("Password: password123");
  } catch (error) {
    console.error("❌ Error generating test data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 Test data generation completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test data generation failed:", error);
      process.exit(1);
    });
}

module.exports = { main };
