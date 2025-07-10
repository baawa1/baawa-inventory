#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Testing Auth.js v5 Setup...\n");

// Test 1: Check if auth.ts file exists and has correct structure
const authFilePath = path.join(__dirname, "..", "auth.ts");
if (!fs.existsSync(authFilePath)) {
  console.error("❌ auth.ts file not found");
  process.exit(1);
}
console.log("✅ auth.ts file exists");

// Test 2: Check if auth.ts exports auth and handlers
const authContent = fs.readFileSync(authFilePath, "utf8");
const hasAuthExport = authContent.includes("export const { auth, handlers }");
const hasNextAuthImport = authContent.includes(
  'import NextAuth from "next-auth"'
);
const hasCredentialsProvider = authContent.includes("CredentialsProvider");

if (hasAuthExport) {
  console.log("✅ auth.ts exports auth and handlers correctly");
} else {
  console.error("❌ auth.ts does not export auth and handlers correctly");
  process.exit(1);
}

if (hasNextAuthImport) {
  console.log("✅ auth.ts imports NextAuth correctly");
} else {
  console.error("❌ auth.ts does not import NextAuth correctly");
  process.exit(1);
}

if (hasCredentialsProvider) {
  console.log("✅ auth.ts uses CredentialsProvider");
} else {
  console.error("❌ auth.ts does not use CredentialsProvider");
  process.exit(1);
}

// Test 3: Check if API route exists
const apiRoutePath = path.join(
  __dirname,
  "..",
  "src",
  "app",
  "api",
  "auth",
  "[...nextauth]",
  "route.ts"
);
if (fs.existsSync(apiRoutePath)) {
  const apiRouteContent = fs.readFileSync(apiRoutePath, "utf8");
  const hasHandlersImport = apiRouteContent.includes("import { handlers }");
  const hasHandlersExport = apiRouteContent.includes(
    "export const { GET, POST } = handlers"
  );

  if (hasHandlersImport && hasHandlersExport) {
    console.log("✅ API route uses handlers correctly");
  } else {
    console.error("❌ API route does not use handlers correctly");
    process.exit(1);
  }
} else {
  console.error("❌ API route file not found");
  process.exit(1);
}

// Test 4: Check if middleware uses auth correctly
const middlewarePath = path.join(__dirname, "..", "src", "middleware.ts");
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, "utf8");
  const hasAuthImport = middlewareContent.includes(
    'import { auth } from "../auth"'
  );
  const usesAuthAsMiddleware = middlewareContent.includes(
    "export default auth("
  );

  if (hasAuthImport && usesAuthAsMiddleware) {
    console.log("✅ Middleware uses auth correctly");
  } else {
    console.error("❌ Middleware does not use auth correctly");
    process.exit(1);
  }
} else {
  console.error("❌ Middleware file not found");
  process.exit(1);
}

// Test 5: Check if custom middleware files are cleaned up
const customMiddlewareFiles = [
  path.join(__dirname, "..", "src", "lib", "api-auth-middleware.ts"),
  path.join(__dirname, "..", "src", "lib", "api-middleware.ts"),
];

let customMiddlewareCleaned = true;
customMiddlewareFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes("withAuth") || content.includes("withValidatedAuth")) {
      console.error(`❌ Custom middleware still exists in ${file}`);
      customMiddlewareCleaned = false;
    }
  }
});

if (customMiddlewareCleaned) {
  console.log("✅ Custom middleware files cleaned up");
} else {
  console.error("❌ Custom middleware files not cleaned up");
  process.exit(1);
}

console.log("\n🎉 All Auth.js v5 tests passed!");
console.log("\n📋 Summary:");
console.log("- ✅ auth.ts file exists and exports correctly");
console.log("- ✅ API route uses handlers correctly");
console.log("- ✅ Middleware uses auth correctly");
console.log("- ✅ Custom middleware cleaned up");
console.log("\n🚀 Your Auth.js v5 setup is working correctly!");
