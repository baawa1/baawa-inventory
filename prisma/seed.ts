import { PrismaClient, UserRole, UserStatus, ProductStatus, FinancialType, FinancialStatus, PaymentMethod, ExpenseType, IncomeSource, CouponType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Helper function to generate random date in 2025 (Jan 1 to today)
  const getRandomDate2025 = () => {
    const start = new Date('2025-01-01')
    const end = new Date() // Today
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  // Helper function to generate random date in last 30 days
  const getRecentDate = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }

  // Hash password for users
  const hashedPassword = await bcrypt.hash('password123', 10)

  console.log('👥 Creating users...')

  // Create 10 test users with different roles
  const users = await Promise.all([
    // 2 Admins
    prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'baawapay+admin@gmail.com',
        password: hashedPassword,
        phone: '+2348123456789',
        role: UserRole.ADMIN,
        userStatus: UserStatus.APPROVED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        approvedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'baawapay+superadmin@gmail.com',
        password: hashedPassword,
        phone: '+2348123456780',
        role: UserRole.ADMIN,
        userStatus: UserStatus.APPROVED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        approvedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    // 3 Managers
    prisma.user.create({
      data: {
        firstName: 'Sales',
        lastName: 'Manager',
        email: 'baawapay+salesmanager@gmail.com',
        password: hashedPassword,
        phone: '+2348123456781',
        role: UserRole.MANAGER,
        userStatus: UserStatus.APPROVED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        approvedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Inventory',
        lastName: 'Manager',
        email: 'baawapay+inventorymanager@gmail.com',
        password: hashedPassword,
        phone: '+2348123456782',
        role: UserRole.MANAGER,
        userStatus: UserStatus.APPROVED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        approvedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Store',
        lastName: 'Manager',
        email: 'baawapay+storemanager@gmail.com',
        password: hashedPassword,
        phone: '+2348123456783',
        role: UserRole.MANAGER,
        userStatus: UserStatus.APPROVED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        approvedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    // 5 Staff members
    prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Staff',
        email: 'baawapay+johnstaff@gmail.com',
        password: hashedPassword,
        phone: '+2348123456784',
        role: UserRole.STAFF,
        userStatus: UserStatus.APPROVED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        approvedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Mary',
        lastName: 'Cashier',
        email: 'baawapay+marycashier@gmail.com',
        password: hashedPassword,
        phone: '+2348123456785',
        role: UserRole.STAFF,
        userStatus: UserStatus.APPROVED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        approvedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'David',
        lastName: 'Assistant',
        email: 'baawapay+davidassistant@gmail.com',
        password: hashedPassword,
        phone: '+2348123456786',
        role: UserRole.STAFF,
        userStatus: UserStatus.VERIFIED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Sales',
        email: 'baawapay+sarahsales@gmail.com',
        password: hashedPassword,
        phone: '+2348123456787',
        role: UserRole.STAFF,
        userStatus: UserStatus.APPROVED,
        emailVerified: true,
        emailVerifiedAt: getRandomDate2025(),
        approvedAt: getRandomDate2025(),
        lastLogin: getRecentDate(),
        lastActivity: getRecentDate(),
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.user.create({
      data: {
        firstName: 'Peter',
        lastName: 'Helper',
        email: 'baawapay+peterhelper@gmail.com',
        password: hashedPassword,
        phone: '+2348123456788',
        role: UserRole.STAFF,
        userStatus: UserStatus.PENDING,
        emailVerified: false,
        createdAt: getRandomDate2025(),
      }
    })
  ])

  console.log('🏢 Creating suppliers...')

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Premium Watch Co.',
        contactPerson: 'Ahmed Hassan',
        email: 'baawapay+supplier1@gmail.com',
        phone: '+2348098765432',
        address: '123 Victoria Island, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        website: 'www.premiumwatchco.com',
        notes: 'High-end watches and accessories supplier',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Fashion Glasses Ltd',
        contactPerson: 'Fatima Ibrahim',
        email: 'baawapay+supplier2@gmail.com',
        phone: '+2348098765433',
        address: '45 Allen Avenue, Ikeja',
        city: 'Lagos',
        state: 'Lagos',
        website: 'www.fashionglasses.ng',
        notes: 'Eyewear and sunglasses distributor',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Clock Masters Nigeria',
        contactPerson: 'Emeka Okafor',
        email: 'baawapay+supplier3@gmail.com',
        phone: '+2348098765434',
        address: '78 Awolowo Road, Ikoyi',
        city: 'Lagos',
        state: 'Lagos',
        website: 'www.clockmasters.ng',
        notes: 'Wall clocks and timepiece specialists',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Luxury Accessories Hub',
        contactPerson: 'Kemi Adebayo',
        email: 'baawapay+supplier4@gmail.com',
        phone: '+2348098765435',
        address: '90 Broad Street, Marina',
        city: 'Lagos',
        state: 'Lagos',
        notes: 'Premium jewelry and accessories',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Global Timepieces',
        contactPerson: 'Yusuf Musa',
        email: 'baawapay+supplier5@gmail.com',
        phone: '+2348098765436',
        address: '12 Ahmadu Bello Way, Abuja',
        city: 'Abuja',
        state: 'FCT',
        website: 'www.globaltimepieces.com',
        notes: 'International watch brands distributor',
        createdAt: getRandomDate2025(),
      }
    })
  ])

  console.log('🏷️ Creating brands...')

  const brands = await Promise.all([
    // Watch Brands
    prisma.brand.create({
      data: {
        name: 'Rolex',
        description: 'Luxury Swiss watches',
        website: 'www.rolex.com',
        image: '/brands/rolex.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Casio',
        description: 'Digital and analog watches',
        website: 'www.casio.com',
        image: '/brands/casio.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Citizen',
        description: 'Japanese precision watches',
        website: 'www.citizen.com',
        image: '/brands/citizen.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    // Glasses Brands
    prisma.brand.create({
      data: {
        name: 'Ray-Ban',
        description: 'Premium sunglasses and eyewear',
        website: 'www.ray-ban.com',
        image: '/brands/rayban.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Oakley',
        description: 'Sport and lifestyle eyewear',
        website: 'www.oakley.com',
        image: '/brands/oakley.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Gucci',
        description: 'Luxury fashion eyewear',
        website: 'www.gucci.com',
        image: '/brands/gucci.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    // Clock Brands
    prisma.brand.create({
      data: {
        name: 'Seiko',
        description: 'Japanese wall clocks and timepieces',
        website: 'www.seiko.com',
        image: '/brands/seiko.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Howard Miller',
        description: 'American heritage clocks',
        website: 'www.howardmiller.com',
        image: '/brands/howardmiller.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    // Accessories Brands
    prisma.brand.create({
      data: {
        name: 'Pandora',
        description: 'Jewelry and charms',
        website: 'www.pandora.net',
        image: '/brands/pandora.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Tiffany & Co.',
        description: 'Luxury jewelry and accessories',
        website: 'www.tiffany.com',
        image: '/brands/tiffany.jpg',
        createdAt: getRandomDate2025(),
      }
    })
  ])

  console.log('📂 Creating categories...')

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Accessories',
        description: 'Fashion accessories, jewelry, and personal items',
        image: '/categories/accessories.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.category.create({
      data: {
        name: 'Wristwatches',
        description: 'Digital and analog wristwatches for all occasions',
        image: '/categories/wristwatches.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.category.create({
      data: {
        name: 'Glasses',
        description: 'Sunglasses, reading glasses, and prescription eyewear',
        image: '/categories/glasses.jpg',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.category.create({
      data: {
        name: 'Wall Clocks',
        description: 'Decorative and functional wall clocks',
        image: '/categories/wallclocks.jpg',
        createdAt: getRandomDate2025(),
      }
    })
  ])

  console.log('📦 Creating products...')

  // Get brand and supplier IDs for easier reference
  const rolexBrand = brands.find(b => b.name === 'Rolex')!
  const casioBrand = brands.find(b => b.name === 'Casio')!
  const citizenBrand = brands.find(b => b.name === 'Citizen')!
  const raybanBrand = brands.find(b => b.name === 'Ray-Ban')!
  const oakleyBrand = brands.find(b => b.name === 'Oakley')!
  const gucciBrand = brands.find(b => b.name === 'Gucci')!
  const seikoBrand = brands.find(b => b.name === 'Seiko')!
  const howardMillerBrand = brands.find(b => b.name === 'Howard Miller')!
  const pandoraBrand = brands.find(b => b.name === 'Pandora')!
  const tiffanyBrand = brands.find(b => b.name === 'Tiffany & Co.')!

  const watchSupplier = suppliers.find(s => s.name === 'Premium Watch Co.')!
  const glassesSupplier = suppliers.find(s => s.name === 'Fashion Glasses Ltd')!
  const clockSupplier = suppliers.find(s => s.name === 'Clock Masters Nigeria')!
  const accessorySupplier = suppliers.find(s => s.name === 'Luxury Accessories Hub')!
  const globalSupplier = suppliers.find(s => s.name === 'Global Timepieces')!

  const accessoriesCategory = categories.find(c => c.name === 'Accessories')!
  const watchesCategory = categories.find(c => c.name === 'Wristwatches')!
  const glassesCategory = categories.find(c => c.name === 'Glasses')!
  const clocksCategory = categories.find(c => c.name === 'Wall Clocks')!

  // Create Wristwatches
  const watchProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Rolex Submariner',
        description: 'Luxury diving watch with ceramic bezel',
        sku: 'ROL-SUB-001',
        cost: 800000,
        price: 1200000,
        stock: 5,
        minStock: 2,
        categoryId: watchesCategory.id,
        brandId: rolexBrand.id,
        supplierId: watchSupplier.id,
        images: JSON.stringify([
          { url: '/products/rolex-submariner-1.jpg', alt: 'Rolex Submariner front view' },
          { url: '/products/rolex-submariner-2.jpg', alt: 'Rolex Submariner side view' }
        ]),
        tags: ['luxury', 'diving', 'swiss', 'automatic'],
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.product.create({
      data: {
        name: 'Casio G-Shock DW-5600',
        description: 'Digital sports watch with shock resistance',
        sku: 'CAS-GSH-001',
        cost: 15000,
        price: 25000,
        stock: 50,
        minStock: 10,
        categoryId: watchesCategory.id,
        brandId: casioBrand.id,
        supplierId: globalSupplier.id,
        images: JSON.stringify([
          { url: '/products/casio-gshock-1.jpg', alt: 'Casio G-Shock front view' }
        ]),
        tags: ['digital', 'sports', 'durable', 'water-resistant'],
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.product.create({
      data: {
        name: 'Citizen Eco-Drive',
        description: 'Solar-powered analog watch',
        sku: 'CIT-ECO-001',
        cost: 45000,
        price: 75000,
        stock: 30,
        minStock: 5,
        categoryId: watchesCategory.id,
        brandId: citizenBrand.id,
        supplierId: watchSupplier.id,
        images: JSON.stringify([
          { url: '/products/citizen-ecodrive-1.jpg', alt: 'Citizen Eco-Drive watch' }
        ]),
        tags: ['solar', 'analog', 'japanese', 'eco-friendly'],
        createdAt: getRandomDate2025(),
      }
    })
  ])

  // Create Glasses
  const glassesProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Ray-Ban Aviator Classic',
        description: 'Classic aviator sunglasses with metal frame',
        sku: 'RAY-AVI-001',
        cost: 35000,
        price: 55000,
        stock: 25,
        minStock: 5,
        categoryId: glassesCategory.id,
        brandId: raybanBrand.id,
        supplierId: glassesSupplier.id,
        images: JSON.stringify([
          { url: '/products/rayban-aviator-1.jpg', alt: 'Ray-Ban Aviator sunglasses' }
        ]),
        tags: ['aviator', 'classic', 'metal', 'UV-protection'],
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.product.create({
      data: {
        name: 'Oakley Holbrook',
        description: 'Sports sunglasses with Prizm lens technology',
        sku: 'OAK-HOL-001',
        cost: 28000,
        price: 45000,
        stock: 40,
        minStock: 8,
        categoryId: glassesCategory.id,
        brandId: oakleyBrand.id,
        supplierId: glassesSupplier.id,
        images: JSON.stringify([
          { url: '/products/oakley-holbrook-1.jpg', alt: 'Oakley Holbrook sunglasses' }
        ]),
        tags: ['sports', 'prizm', 'lifestyle', 'durable'],
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.product.create({
      data: {
        name: 'Gucci Square Frame',
        description: 'Luxury acetate frame glasses',
        sku: 'GUC-SQU-001',
        cost: 85000,
        price: 135000,
        stock: 15,
        minStock: 3,
        categoryId: glassesCategory.id,
        brandId: gucciBrand.id,
        supplierId: glassesSupplier.id,
        images: JSON.stringify([
          { url: '/products/gucci-square-1.jpg', alt: 'Gucci square frame glasses' }
        ]),
        tags: ['luxury', 'acetate', 'designer', 'fashion'],
        createdAt: getRandomDate2025(),
      }
    })
  ])

  // Create Wall Clocks
  const clockProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Seiko Pendulum Clock',
        description: 'Traditional wooden pendulum wall clock',
        sku: 'SEI-PEN-001',
        cost: 18000,
        price: 32000,
        stock: 20,
        minStock: 4,
        categoryId: clocksCategory.id,
        brandId: seikoBrand.id,
        supplierId: clockSupplier.id,
        images: JSON.stringify([
          { url: '/products/seiko-pendulum-1.jpg', alt: 'Seiko pendulum wall clock' }
        ]),
        tags: ['pendulum', 'wooden', 'traditional', 'chiming'],
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.product.create({
      data: {
        name: 'Howard Miller Gallery Wall Clock',
        description: 'Modern minimalist wall clock',
        sku: 'HM-GAL-001',
        cost: 25000,
        price: 42000,
        stock: 35,
        minStock: 6,
        categoryId: clocksCategory.id,
        brandId: howardMillerBrand.id,
        supplierId: clockSupplier.id,
        images: JSON.stringify([
          { url: '/products/howard-miller-gallery-1.jpg', alt: 'Howard Miller gallery wall clock' }
        ]),
        tags: ['modern', 'minimalist', 'gallery', 'silent'],
        createdAt: getRandomDate2025(),
      }
    })
  ])

  // Create Accessories
  const accessoryProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Pandora Charm Bracelet',
        description: 'Sterling silver charm bracelet',
        sku: 'PAN-CHR-001',
        cost: 35000,
        price: 58000,
        stock: 45,
        minStock: 8,
        categoryId: accessoriesCategory.id,
        brandId: pandoraBrand.id,
        supplierId: accessorySupplier.id,
        images: JSON.stringify([
          { url: '/products/pandora-charm-1.jpg', alt: 'Pandora charm bracelet' }
        ]),
        tags: ['sterling-silver', 'charms', 'bracelet', 'jewelry'],
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.product.create({
      data: {
        name: 'Tiffany & Co. Necklace',
        description: 'Elegant silver necklace with pendant',
        sku: 'TIF-NEC-001',
        cost: 125000,
        price: 195000,
        stock: 12,
        minStock: 2,
        categoryId: accessoriesCategory.id,
        brandId: tiffanyBrand.id,
        supplierId: accessorySupplier.id,
        images: JSON.stringify([
          { url: '/products/tiffany-necklace-1.jpg', alt: 'Tiffany & Co. silver necklace' }
        ]),
        tags: ['silver', 'necklace', 'luxury', 'pendant'],
        createdAt: getRandomDate2025(),
      }
    })
  ])

  console.log('👥 Creating customers...')

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Adebayo Johnson',
        email: 'baawapay+customer1@gmail.com',
        phone: '+2348167654321',
        billingAddress: '12 Adeola Street, Victoria Island',
        shippingAddress: '12 Adeola Street, Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '101001',
        customerType: 'individual',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Chioma Okafor',
        email: 'baawapay+customer2@gmail.com',
        phone: '+2348167654322',
        billingAddress: '45 Allen Avenue, Ikeja',
        shippingAddress: '45 Allen Avenue, Ikeja',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '100001',
        customerType: 'individual',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Fashion Hub Ltd',
        email: 'baawapay+fashionhub@gmail.com',
        phone: '+2348167654323',
        billingAddress: '78 Broad Street, Marina',
        shippingAddress: '78 Broad Street, Marina',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '101001',
        customerType: 'business',
        notes: 'Wholesale customer - 10% discount applies',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Musa Ibrahim',
        email: 'baawapay+customer4@gmail.com',
        phone: '+2348167654324',
        billingAddress: '23 Wuse 2, Abuja',
        shippingAddress: '23 Wuse 2, Abuja',
        city: 'Abuja',
        state: 'FCT',
        postalCode: '900001',
        customerType: 'individual',
        createdAt: getRandomDate2025(),
      }
    }),
    prisma.customer.create({
      data: {
        name: 'Sarah Ahmed',
        email: 'baawapay+customer5@gmail.com',
        phone: '+2348167654325',
        billingAddress: '15 GRA, Port Harcourt',
        shippingAddress: '15 GRA, Port Harcourt',
        city: 'Port Harcourt',
        state: 'Rivers',
        postalCode: '500001',
        customerType: 'individual',
        createdAt: getRandomDate2025(),
      }
    }),
  ])

  // Set approver for users (first admin approves others)
  await prisma.user.updateMany({
    where: {
      userStatus: UserStatus.APPROVED,
      approvedAt: { not: null },
      id: { not: users[0].id }
    },
    data: {
      approvedBy: users[0].id
    }
  })

  console.log('📈 Creating sales transactions...')

  // Collect all products for sales
  const allProducts = [...watchProducts, ...glassesProducts, ...clockProducts, ...accessoryProducts]

  // Create sales transactions
  const transactions = []
  for (let i = 0; i < 50; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)]
    const randomCustomer = Math.random() > 0.3 ? customers[Math.floor(Math.random() * customers.length)] : null
    const transactionDate = getRandomDate2025()

    // Generate random transaction number
    const transactionNumber = `TXN-${transactionDate.getFullYear()}${String(transactionDate.getMonth() + 1).padStart(2, '0')}${String(transactionDate.getDate()).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`

    // Select 1-4 random products for this transaction
    const numItems = Math.floor(Math.random() * 4) + 1
    const selectedProducts: any[] = []
    for (let j = 0; j < numItems; j++) {
      const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)]
      if (!selectedProducts.find(p => p.id === randomProduct.id)) {
        selectedProducts.push(randomProduct)
      }
    }

    // Calculate transaction totals
    let subtotal = 0
    const items = selectedProducts.map(product => {
      const quantity = Math.floor(Math.random() * 3) + 1
      const unitPrice = Number(product.price)
      const totalPrice = unitPrice * quantity
      subtotal += totalPrice

      return {
        productId: product.id,
        quantity,
        unitPrice,
        totalPrice,
        discountAmount: 0
      }
    })

    const discountAmount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0 // 30% chance of 10% discount
    const taxAmount = Math.floor((subtotal - discountAmount) * 0.075) // 7.5% VAT
    const totalAmount = subtotal - discountAmount + taxAmount

    const paymentMethods = ['cash', 'card', 'bank_transfer', 'pos_machine']
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]

    const transaction = await prisma.salesTransaction.create({
      data: {
        transaction_number: transactionNumber,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: Math.random() > 0.1 ? 'completed' : 'pending', // 90% completed
        transaction_type: 'sale',
        user_id: randomUser.id,
        customer_id: randomCustomer?.id,
        notes: Math.random() > 0.5 ? 'Regular customer purchase' : null,
        created_at: transactionDate,
        updated_at: transactionDate
      }
    })

    // Create sales items
    for (const item of items) {
      await prisma.salesItem.create({
        data: {
          transaction_id: transaction.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          discount_amount: item.discountAmount,
          created_at: transactionDate
        }
      })
    }

    transactions.push(transaction)
  }

  console.log('📦 Creating stock additions...')

  // Create stock additions for all products
  const stockAdditions = []
  for (const product of allProducts) {
    // Create 2-4 stock additions per product
    const numAdditions = Math.floor(Math.random() * 3) + 2
    for (let i = 0; i < numAdditions; i++) {
      const additionDate = getRandomDate2025()
      const quantity = Math.floor(Math.random() * 50) + 10
      const costPerUnit = Number(product.cost)
      const totalCost = costPerUnit * quantity
      const randomUser = users.filter(u => u.role !== 'STAFF')[Math.floor(Math.random() * users.filter(u => u.role !== 'STAFF').length)]
      const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]

      const stockAddition = await prisma.stockAddition.create({
        data: {
          productId: product.id,
          quantity,
          costPerUnit,
          totalCost,
          purchaseDate: additionDate,
          supplierId: randomSupplier.id,
          createdById: randomUser.id,
          referenceNo: `PO-${additionDate.getFullYear()}${String(additionDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
          notes: 'Regular stock replenishment',
          createdAt: additionDate,
          updatedAt: additionDate
        }
      })
      stockAdditions.push(stockAddition)
    }
  }

  console.log('⚖️ Creating stock adjustments...')

  // Create some stock adjustments
  const stockAdjustments = []
  for (let i = 0; i < 15; i++) {
    const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)]
    const randomUser = users[Math.floor(Math.random() * users.length)]
    const approver = users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER')[0]
    const adjustmentDate = getRandomDate2025()

    const oldQuantity = randomProduct.stock
    const adjustment = Math.floor(Math.random() * 10) - 5 // -5 to +5
    const newQuantity = Math.max(0, oldQuantity + adjustment)

    const reasons = [
      'Damaged inventory',
      'Stock count correction',
      'Customer return',
      'Promotional giveaway',
      'Transfer to another location'
    ]
    const reason = reasons[Math.floor(Math.random() * reasons.length)]

    const stockAdjustment = await prisma.stockAdjustment.create({
      data: {
        product_id: randomProduct.id,
        user_id: randomUser.id,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        quantity: adjustment,
        reason,
        adjustment_type: adjustment > 0 ? 'INCREASE' : 'DECREASE',
        status: Math.random() > 0.2 ? 'APPROVED' : 'PENDING', // 80% approved
        approved_by: Math.random() > 0.2 ? approver.id : null,
        approved_at: Math.random() > 0.2 ? adjustmentDate : null,
        reference_number: `ADJ-${adjustmentDate.getFullYear()}${String(adjustmentDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
        notes: `Stock adjustment due to: ${reason}`,
        created_at: adjustmentDate,
        updated_at: adjustmentDate
      }
    })
    stockAdjustments.push(stockAdjustment)
  }

  console.log('💰 Creating financial transactions...')

  // Create financial transactions
  const financialTransactions = []

  // Income transactions (from sales)
  for (let i = 0; i < 20; i++) {
    const transactionDate = getRandomDate2025()
    const amount = Math.floor(Math.random() * 500000) + 50000 // 50k to 550k
    const creator = users.filter(u => u.role !== 'STAFF')[Math.floor(Math.random() * users.filter(u => u.role !== 'STAFF').length)]

    const financialTransaction = await prisma.financialTransaction.create({
      data: {
        transactionNumber: `INC-${transactionDate.getFullYear()}${String(transactionDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
        type: FinancialType.INCOME,
        amount,
        description: 'Sales revenue',
        transactionDate,
        status: FinancialStatus.COMPLETED,
        paymentMethod: Math.random() > 0.5 ? PaymentMethod.CASH : PaymentMethod.BANK_TRANSFER,
        createdBy: creator.id,
        approvedBy: users[0].id, // First admin approves
        approvedAt: transactionDate,
        createdAt: transactionDate,
        updatedAt: transactionDate
      }
    })

    // Create income details
    await prisma.incomeDetail.create({
      data: {
        transactionId: financialTransaction.id,
        payerName: 'Customer Sales',
        incomeSource: IncomeSource.SALES,
        createdAt: transactionDate
      }
    })

    financialTransactions.push(financialTransaction)
  }

  // Expense transactions
  for (let i = 0; i < 15; i++) {
    const transactionDate = getRandomDate2025()
    const amount = Math.floor(Math.random() * 200000) + 20000 // 20k to 220k
    const creator = users.filter(u => u.role !== 'STAFF')[Math.floor(Math.random() * users.filter(u => u.role !== 'STAFF').length)]

    const expenseTypes = [
      ExpenseType.INVENTORY_PURCHASES,
      ExpenseType.UTILITIES,
      ExpenseType.RENT,
      ExpenseType.OFFICE_SUPPLIES,
      ExpenseType.MAINTENANCE
    ]
    const expenseType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)]

    const financialTransaction = await prisma.financialTransaction.create({
      data: {
        transactionNumber: `EXP-${transactionDate.getFullYear()}${String(transactionDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
        type: FinancialType.EXPENSE,
        amount,
        description: `Business expense - ${expenseType}`,
        transactionDate,
        status: FinancialStatus.COMPLETED,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        createdBy: creator.id,
        approvedBy: users[0].id,
        approvedAt: transactionDate,
        createdAt: transactionDate,
        updatedAt: transactionDate
      }
    })

    // Create expense details
    await prisma.expenseDetail.create({
      data: {
        transactionId: financialTransaction.id,
        vendorName: 'Business Vendor',
        expenseType,
        createdAt: transactionDate
      }
    })

    financialTransactions.push(financialTransaction)
  }

  console.log('🎫 Creating coupons...')

  // Create some coupons
  const coupons = []
  for (let i = 0; i < 5; i++) {
    const validFrom = getRandomDate2025()
    const validUntil = new Date(validFrom)
    validUntil.setDate(validUntil.getDate() + 30) // Valid for 30 days

    const coupon = await prisma.coupon.create({
      data: {
        code: `SAVE${i + 1}0`,
        name: `${(i + 1) * 10}% Discount`,
        description: `Get ${(i + 1) * 10}% off your purchase`,
        type: CouponType.PERCENTAGE,
        value: (i + 1) * 10,
        minimumAmount: 10000,
        maxUses: 100,
        currentUses: Math.floor(Math.random() * 20),
        validFrom,
        validUntil,
        createdBy: users[0].id,
        createdAt: validFrom,
        updatedAt: validFrom
      }
    })
    coupons.push(coupon)
  }

  console.log('📋 Creating audit logs...')

  // Create some audit logs
  for (let i = 0; i < 30; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)]
    const logDate = getRandomDate2025()

    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
    const tables = ['products', 'users', 'sales_transactions', 'stock_adjustments']
    const action = actions[Math.floor(Math.random() * actions.length)]
    const tableName = tables[Math.floor(Math.random() * tables.length)]

    await prisma.auditLog.create({
      data: {
        action,
        table_name: tableName,
        record_id: Math.floor(Math.random() * 100) + 1,
        user_id: randomUser.id,
        old_values: action === 'UPDATE' ? { field: 'old_value' } : undefined,
        new_values: action !== 'DELETE' ? { field: 'new_value' } : undefined,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        created_at: logDate
      }
    })
  }

  console.log('✅ Database seeding completed!')
  console.log(`Created:
  - ${users.length} users
  - ${suppliers.length} suppliers
  - ${brands.length} brands
  - ${categories.length} categories
  - ${allProducts.length} products
  - ${customers.length} customers
  - ${transactions.length} sales transactions
  - ${stockAdditions.length} stock additions
  - ${stockAdjustments.length} stock adjustments
  - ${financialTransactions.length} financial transactions
  - ${coupons.length} coupons
  - 30 audit log entries`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })