#!/usr/bin/env node

/**
 * Cross-Platform Thermal Printer Setup Script
 * 
 * This script helps set up thermal printers for:
 * - Windows (USB, Network, Serial)
 * - macOS (USB, Network, Serial)
 * - Linux (USB, Network, Serial)
 * 
 * Supported printers:
 * - Xprinter XP 58
 * - Epson TM-T88VI
 * - Star TSP100
 * - Generic ESC/POS printers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Detect operating system
function getOS() {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  if (platform === 'linux') return 'linux';
  return 'unknown';
}

// Check if command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Windows specific functions
function setupWindows() {
  logStep(1, 'Setting up thermal printer for Windows...');
  
  try {
    // Check if Node.js is running with admin privileges
    const isAdmin = execSync('net session', { stdio: 'ignore' });
    if (!isAdmin) {
      logWarning('This script may need to be run as Administrator for USB printer access');
    }
    
    // Check for USB devices
    logInfo('Checking for USB thermal printers...');
    try {
      const usbDevices = execSync('powershell "Get-PnpDevice | Where-Object {$_.Class -eq \'USB\'}"', { encoding: 'utf8' });
      logSuccess('USB devices found');
      console.log(usbDevices);
    } catch (_error) {
      logWarning('Could not enumerate USB devices. Run as Administrator if needed.');
    }
    
    // Check for network printers
    logInfo('Checking for network printers...');
    try {
      const networkPrinters = execSync('powershell "Get-Printer | Where-Object {$_.Type -eq \'TCPIPPrinter\'}"', { encoding: 'utf8' });
      logSuccess('Network printers found');
      console.log(networkPrinters);
    } catch (error) {
      logWarning('Could not enumerate network printers');
    }
    
    logSuccess('Windows setup completed');
  } catch (error) {
    logError(`Windows setup failed: ${error.message}`);
  }
}

// macOS specific functions
function setupMacOS() {
  logStep(1, 'Setting up thermal printer for macOS...');
  
  try {
    // Check for USB devices
    logInfo('Checking for USB thermal printers...');
    try {
      const usbDevices = execSync('system_profiler SPUSBDataType', { encoding: 'utf8' });
      logSuccess('USB devices found');
      console.log(usbDevices);
    } catch (error) {
      logWarning('Could not enumerate USB devices');
    }
    
    // Check for network printers
    logInfo('Checking for network printers...');
    try {
      const networkPrinters = execSync('lpstat -p', { encoding: 'utf8' });
      logSuccess('Network printers found');
      console.log(networkPrinters);
    } catch (error) {
      logWarning('Could not enumerate network printers');
    }
    
    // Check for CUPS
    if (commandExists('cups-config')) {
      logSuccess('CUPS is installed');
    } else {
      logWarning('CUPS not found. Install with: brew install cups');
    }
    
    logSuccess('macOS setup completed');
  } catch (error) {
    logError(`macOS setup failed: ${error.message}`);
  }
}

// Linux specific functions
function setupLinux() {
  logStep(1, 'Setting up thermal printer for Linux...');
  
  try {
    // Check for USB devices
    logInfo('Checking for USB thermal printers...');
    try {
      const usbDevices = execSync('lsusb', { encoding: 'utf8' });
      logSuccess('USB devices found');
      console.log(usbDevices);
    } catch (error) {
      logWarning('Could not enumerate USB devices');
    }
    
    // Check for CUPS
    if (commandExists('cups-config')) {
      logSuccess('CUPS is installed');
    } else {
      logWarning('CUPS not found. Install with: sudo apt-get install cups');
    }
    
    // Check for udev rules
    const udevRulesPath = '/etc/udev/rules.d/99-thermal-printer.rules';
    if (!fs.existsSync(udevRulesPath)) {
      logInfo('Creating udev rules for thermal printer...');
      const udevRules = `# Thermal Printer udev rules
SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5740", MODE="0666"
SUBSYSTEM=="usb", ATTRS{idVendor}=="04b8", ATTRS{idProduct}=="0202", MODE="0666"
SUBSYSTEM=="usb", ATTRS{idVendor}=="051d", ATTRS{idProduct}=="0002", MODE="0666"
`;
      try {
        fs.writeFileSync(udevRulesPath, udevRules);
        logSuccess('Udev rules created');
        logInfo('Run: sudo udevadm control --reload-rules && sudo udevadm trigger');
      } catch (error) {
        logWarning('Could not create udev rules. Run with sudo if needed.');
      }
    } else {
      logSuccess('Udev rules already exist');
    }
    
    logSuccess('Linux setup completed');
  } catch (error) {
    logError(`Linux setup failed: ${error.message}`);
  }
}

// Test printer connection
function testPrinterConnection() {
  logStep(2, 'Testing printer connection...');
  
  try {
    // Test the printer service
    const { XprinterXP58Service } = require(path.join(__dirname, '../src/lib/pos/thermal-printer'));
    
    // Test USB devices
    const usbDevices = XprinterXP58Service.getAvailableUSBDevices();
    if (usbDevices.length > 0) {
      logSuccess(`Found ${usbDevices.length} USB printer(s)`);
      usbDevices.forEach(device => {
        logInfo(`  - ${device.name} (${device.id})`);
      });
    } else {
      logWarning('No USB printers found');
    }
    
    // Test network printer (default IP)
    logInfo('Testing network printer connection...');
    XprinterXP58Service.testNetworkPrinter('192.168.1.100', 9100)
      .then(isConnected => {
        if (isConnected) {
          logSuccess('Network printer connection successful');
        } else {
          logWarning('Network printer connection failed (this is normal if no network printer is configured)');
        }
      })
      .catch(error => {
        logWarning(`Network printer test failed: ${error.message}`);
      });
    
  } catch (error) {
    logError(`Printer connection test failed: ${error.message}`);
  }
}

// Create configuration file
function createConfigFile() {
  logStep(3, 'Creating printer configuration...');
  
  const configPath = path.join(process.cwd(), 'printer-config.json');
  const defaultConfig = {
    type: 'usb',
    interface: 'USB001',
    options: {
      width: 32,
      characterSet: 'SLOVENIA',
      removeSpecialCharacters: false,
      lineCharacter: '-',
      ip: '192.168.1.100',
      port: 9100,
    },
  };
  
  try {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      logSuccess('Printer configuration file created');
      logInfo(`Configuration saved to: ${configPath}`);
    } else {
      logInfo('Printer configuration file already exists');
    }
  } catch (error) {
    logError(`Failed to create configuration file: ${error.message}`);
  }
}

// Main setup function
function main() {
  log('🖨️  Cross-Platform Thermal Printer Setup', 'bright');
  log('==========================================', 'bright');
  
  const os = getOS();
  logInfo(`Detected OS: ${os}`);
  
  // OS-specific setup
  switch (os) {
    case 'windows':
      setupWindows();
      break;
    case 'macos':
      setupMacOS();
      break;
    case 'linux':
      setupLinux();
      break;
    default:
      logError(`Unsupported operating system: ${os}`);
      process.exit(1);
  }
  
  // Test printer connection
  testPrinterConnection();
  
  // Create configuration file
  createConfigFile();
  
  // Final instructions
  logStep(4, 'Setup completed!');
  logInfo('Next steps:');
  logInfo('1. Connect your thermal printer');
  logInfo('2. Start the POS application: npm run dev');
  logInfo('3. Complete a test sale and click "Thermal Print"');
  logInfo('4. Use the "Printer Config" button to configure your printer');
  logInfo('5. Test the connection using the "Test Printer" button');
  
  log('\n📋 Troubleshooting Tips:', 'bright');
  log('• USB Connection: Check device manager (Windows) or system profiler (macOS)');
  log('• Network Connection: Ensure printer IP is correct and accessible');
  log('• Permissions: Run as Administrator (Windows) or with sudo (Linux) if needed');
  log('• Drivers: Install printer-specific drivers if available');
  log('• Firewall: Check if network printer is blocked by firewall');
  
  log('\n🔗 Useful Commands:', 'bright');
  log('• Test USB devices: node scripts/setup-thermal-printer.js');
  log('• Check printer status: Check printer documentation');
  log('• Network test: ping [printer-ip]');
  log('• CUPS (Linux/macOS): lpstat -p');
  log('• Windows: Get-Printer | Where-Object {$_.Type -eq "TCPIPPrinter"}');
}

// Run setup
if (require.main === module) {
  main();
}

module.exports = { main, getOS, setupWindows, setupMacOS, setupLinux }; 