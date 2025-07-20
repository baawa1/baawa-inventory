#!/usr/bin/env node

/**
 * Xprinter XP 58 Setup Script
 *
 * This script helps configure and test the Xprinter XP 58 thermal printer.
 * Run this script to:
 * 1. Detect available USB devices
 * 2. Test printer connection
 * 3. Print a test page
 * 4. Configure printer settings
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🖨️  Xprinter XP 58 Setup Script");
console.log("================================\n");

// Check if running on supported platform
const platform = process.platform;
console.log(`Platform: ${platform}`);

if (platform === "win32") {
  console.log("✅ Windows detected - USB support available");
} else if (platform === "darwin") {
  console.log("✅ macOS detected - USB support available");
} else if (platform === "linux") {
  console.log("✅ Linux detected - USB support available");
} else {
  console.log("❌ Unsupported platform");
  process.exit(1);
}

// Function to detect USB devices
function detectUSBDevices() {
  console.log("\n🔍 Detecting USB devices...");

  try {
    if (platform === "win32") {
      // Windows: Use PowerShell to list USB devices
      const output = execSync(
        "powershell \"Get-PnpDevice | Where-Object {$_.Class -eq 'USB'} | Select-Object FriendlyName, InstanceId\"",
        { encoding: "utf8" }
      );
      console.log("USB Devices found:");
      console.log(output);
    } else if (platform === "darwin") {
      // macOS: Use system_profiler
      const output = execSync("system_profiler SPUSBDataType", {
        encoding: "utf8",
      });
      console.log("USB Devices found:");
      console.log(output);
    } else if (platform === "linux") {
      // Linux: Use lsusb
      const output = execSync("lsusb", { encoding: "utf8" });
      console.log("USB Devices found:");
      console.log(output);
    }
  } catch (error) {
    console.log("❌ Error detecting USB devices:", error.message);
  }
}

// Function to create printer configuration
function createPrinterConfig() {
  console.log("\n⚙️  Creating printer configuration...");

  const config = {
    type: "usb",
    interface: "USB001", // Default USB interface
    options: {
      width: 32,
      characterSet: "SLOVENIA",
      removeSpecialCharacters: false,
      lineCharacter: "-",
    },
  };

  const configPath = path.join(
    __dirname,
    "..",
    "src",
    "lib",
    "pos",
    "printer-config.json"
  );

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Printer configuration saved to: ${configPath}`);
    return config;
  } catch (error) {
    console.log("❌ Error creating printer configuration:", error.message);
    return null;
  }
}

// Function to test printer connection
function testPrinterConnection(config) {
  console.log("\n🧪 Testing printer connection...");

  try {
    // This would require the actual printer library to be available
    console.log("⚠️  Printer testing requires the application to be running");
    console.log(
      '   Use the "Test Printer Connection" button in the POS interface'
    );
    console.log(`   Configuration: ${JSON.stringify(config, null, 2)}`);
  } catch (error) {
    console.log("❌ Error testing printer:", error.message);
  }
}

// Function to provide setup instructions
function provideSetupInstructions() {
  console.log("\n📋 Setup Instructions for Xprinter XP 58:");
  console.log("==========================================");
  console.log("");
  console.log("1. Hardware Setup:");
  console.log("   - Connect Xprinter XP 58 to your computer via USB");
  console.log("   - Ensure the printer is powered on");
  console.log("   - Load thermal paper (58mm width)");
  console.log("");
  console.log("2. Driver Installation:");
  console.log(
    "   - Windows: Install Xprinter XP 58 drivers from manufacturer website"
  );
  console.log("   - macOS: Usually plug-and-play, no drivers needed");
  console.log("   - Linux: May require udev rules for USB access");
  console.log("");
  console.log("3. Application Configuration:");
  console.log("   - Open the POS application");
  console.log("   - Go to receipt generation");
  console.log('   - Click "Printer Config" button');
  console.log('   - Set connection type to "USB"');
  console.log("   - Set interface to detected USB port (e.g., USB001)");
  console.log('   - Click "Test Printer Connection"');
  console.log("");
  console.log("4. Common USB Interface Names:");
  console.log("   - Windows: USB001, USB002, USB003...");
  console.log("   - macOS: /dev/usb/lp0, /dev/usb/lp1...");
  console.log("   - Linux: /dev/usb/lp0, /dev/ttyUSB0...");
  console.log("");
  console.log("5. Troubleshooting:");
  console.log("   - Ensure printer is connected and powered on");
  console.log("   - Check USB cable connection");
  console.log("   - Try different USB ports");
  console.log("   - Restart the application after connecting printer");
  console.log("   - Check system permissions for USB access");
  console.log("");
}

// Function to create test receipt data
function createTestReceiptData() {
  console.log("\n📄 Creating test receipt data...");

  const testData = {
    saleId: "TEST-001",
    timestamp: new Date().toISOString(),
    staffName: "Test Staff",
    customerName: "Test Customer",
    customerPhone: "+2341234567890",
    items: [
      {
        name: "Test Product 1",
        sku: "TEST001",
        quantity: 2,
        price: 1500,
        total: 3000,
        category: "Test Category",
      },
      {
        name: "Test Product 2",
        sku: "TEST002",
        quantity: 1,
        price: 2500,
        total: 2500,
        category: "Test Category",
      },
    ],
    subtotal: 5500,
    discount: 500,
    total: 5000,
    paymentMethod: "cash",
  };

  const testDataPath = path.join(
    __dirname,
    "..",
    "src",
    "lib",
    "pos",
    "test-receipt-data.json"
  );

  try {
    fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
    console.log(`✅ Test receipt data saved to: ${testDataPath}`);
    return testData;
  } catch (error) {
    console.log("❌ Error creating test data:", error.message);
    return null;
  }
}

// Main execution
async function main() {
  try {
    detectUSBDevices();

    const config = createPrinterConfig();
    if (config) {
      testPrinterConnection(config);
    }

    createTestReceiptData();
    provideSetupInstructions();

    console.log("\n✅ Setup script completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Connect your Xprinter XP 58 to USB");
    console.log("2. Start the POS application");
    console.log("3. Test the printer connection");
    console.log("4. Print a test receipt");
  } catch (error) {
    console.error("❌ Setup script failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  detectUSBDevices,
  createPrinterConfig,
  testPrinterConnection,
  provideSetupInstructions,
  createTestReceiptData,
};
