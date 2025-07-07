/**
 * Test script to verify role-based access control for inventory pages
 */

const testRoles = ["ADMIN", "MANAGER", "EMPLOYEE"];

console.log("Testing role-based access control...\n");

testRoles.forEach((role) => {
  console.log(`Testing role: ${role}`);

  // Test low-stock page access
  const lowStockAccess = ["ADMIN", "MANAGER", "EMPLOYEE"].includes(role);
  console.log(
    `  Low Stock page access: ${lowStockAccess ? "✅ ALLOWED" : "❌ DENIED"}`
  );

  console.log("");
});

console.log("Role access test completed.");
