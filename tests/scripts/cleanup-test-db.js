#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("Cleaning up test database...");

try {
  // Drop test database
  console.log("Dropping test database...");
  execSync("dropdb test_db", { stdio: "inherit" });
  console.log("Test database dropped successfully!");
} catch (error) {
  console.log("Test database does not exist or drop failed:", error.message);
}

console.log("Test database cleanup complete!");
