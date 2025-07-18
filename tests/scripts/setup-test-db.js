#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("Setting up test database...");

// Check if test database exists
const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://test:test@localhost:5432/test_db";

try {
  // Create test database if it doesn't exist
  console.log("Creating test database...");
  execSync(`createdb test_db`, { stdio: "inherit" });
} catch (error) {
  console.log(
    "Test database already exists or creation failed:",
    error.message
  );
}

try {
  // Run Prisma migrations on test database
  console.log("Running Prisma migrations...");
  execSync("npx prisma migrate deploy --schema=./prisma/schema.prisma", {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: "inherit",
  });
} catch (error) {
  console.error("Failed to run migrations:", error.message);
  process.exit(1);
}

try {
  // Seed test database with initial data
  console.log("Seeding test database...");
  execSync("node scripts/seed-test-data.js", {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: "inherit",
  });
} catch (error) {
  console.log("Seeding failed or not implemented:", error.message);
}

console.log("Test database setup complete!");
