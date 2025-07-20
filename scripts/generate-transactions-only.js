const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const paymentMethods = [
  "CASH",
  "BANK_TRANSFER",
  "POS_MACHINE",
  "CREDIT_CARD",
  "MOBILE_MONEY",
];
const paymentStatuses = ["pending", "completed", "failed", "refunded"];
const transactionTypes = ["sale", "refund", "exchange"];

const firstNames = [
  "John",
  "Jane",
  "Mike",
  "Sarah",
  "David",
  "Lisa",
  "Tom",
  "Emma",
  "Chris",
  "Anna",
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
];

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min, max, decimals = 2) => {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
};

const generateTransactionNumber = () =>
  `TXN${Date.now()}${randomNumber(100, 999)}`;
const generatePhone = () => `+234${randomNumber(7000000000, 9999999999)}`;
const generateEmail = (firstName, lastName) =>
  `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

async function generateTransactions() {
  try {
    console.log("Starting transaction generation...");

    // Get existing users and products
    const users = await prisma.user.findMany({ select: { id: true } });
    const products = await prisma.product.findMany({
      select: { id: true, price: true },
    });

    if (users.length === 0) {
      console.log("No users found. Please create users first.");
      return;
    }

    if (products.length === 0) {
      console.log("No products found. Please create products first.");
      return;
    }

    console.log(`Found ${users.length} users and ${products.length} products`);

    // Generate transactions
    const transactions = [];
    for (let i = 0; i < 50; i++) {
      const user = randomElement(users);
      const transactionNumber = generateTransactionNumber();
      const subtotal = randomDecimal(1000, 50000);
      const discountAmount = subtotal * randomDecimal(0, 0.2); // 0-20% discount
      const totalAmount = subtotal - discountAmount;

      const transaction = await prisma.salesTransaction.create({
        data: {
          subtotal: subtotal,
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

    console.log(`Created ${transactions.length} transactions`);

    // Generate sales items for each transaction
    const salesItems = [];
    for (const transaction of transactions) {
      const itemCount = randomNumber(1, 5);
      for (let i = 0; i < itemCount; i++) {
        const product = randomElement(products);
        const quantity = randomNumber(1, 10);
        const unitPrice = parseFloat(product.price);
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
          },
        });
        salesItems.push(salesItem);
      }
    }

    console.log(`Created ${salesItems.length} sales items`);
    console.log("Transaction generation completed successfully!");
  } catch (error) {
    console.error("Error generating transactions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateTransactions();
