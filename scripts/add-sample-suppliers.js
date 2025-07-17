const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addSampleSuppliers() {
  try {
    console.log("Adding sample suppliers...");

    // Sample supplier data
    const sampleSuppliers = [
      {
        name: "TechCorp Electronics",
        email: "orders@techcorp.com",
        phone: "+234 801 234 5678",
        address: "123 Tech Street, Victoria Island, Lagos",
        contactPerson: "John Smith",
        isActive: true,
      },
      {
        name: "Global Imports Ltd",
        email: "info@globalimports.ng",
        phone: "+234 802 345 6789",
        address: "456 Import Avenue, Ikeja, Lagos",
        contactPerson: "Sarah Johnson",
        isActive: true,
      },
      {
        name: "Premium Supplies Co",
        email: "sales@premiumsupplies.com",
        phone: "+234 803 456 7890",
        address: "789 Premium Road, Lekki, Lagos",
        contactPerson: "Michael Brown",
        isActive: true,
      },
      {
        name: "QuickMart Distributors",
        email: "orders@quickmart.ng",
        phone: "+234 804 567 8901",
        address: "321 Distribution Street, Surulere, Lagos",
        contactPerson: "Emily Davis",
        isActive: false,
      },
      {
        name: "Elite Trading Partners",
        email: "contact@elitetrading.com",
        phone: "+234 805 678 9012",
        address: "654 Elite Boulevard, Ikoyi, Lagos",
        contactPerson: "David Wilson",
        isActive: true,
      },
      {
        name: "Metro Wholesale",
        email: "info@metro-wholesale.ng",
        phone: "+234 806 789 0123",
        address: "987 Metro Lane, Yaba, Lagos",
        contactPerson: "Lisa Anderson",
        isActive: true,
      },
      {
        name: "Prime Vendors Inc",
        email: "sales@primevendors.com",
        phone: "+234 807 890 1234",
        address: "147 Prime Street, Gbagada, Lagos",
        contactPerson: "Robert Taylor",
        isActive: false,
      },
      {
        name: "Express Logistics",
        email: "orders@expresslogistics.ng",
        phone: "+234 808 901 2345",
        address: "258 Express Road, Oshodi, Lagos",
        contactPerson: "Jennifer Martinez",
        isActive: true,
      },
    ];

    // Create suppliers
    for (const supplierData of sampleSuppliers) {
      const supplier = await prisma.supplier.create({
        data: supplierData,
      });

      console.log(
        `Created supplier: ${supplier.name} (${supplier.isActive ? "Active" : "Inactive"})`
      );
    }

    console.log("Sample suppliers added successfully!");
    console.log(`Created ${sampleSuppliers.length} suppliers`);
  } catch (error) {
    console.error("Error adding sample suppliers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSampleSuppliers();
