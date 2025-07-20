# Xprinter XP 58 Thermal Printer Setup Guide

## Overview

This guide will help you set up and configure the Xprinter XP 58 thermal printer with your POS system. The Xprinter XP 58 is a 58mm thermal receipt printer that supports USB, network, and serial connections.

## Features

- **Direct thermal printing** - No ink or ribbon required
- **58mm paper width** - Standard receipt size
- **USB/Network/Serial connectivity** - Multiple connection options
- **ESC/POS commands** - Industry standard printer language
- **Auto-cut paper** - Automatic paper cutting after printing
- **High-speed printing** - Up to 250mm/s print speed

## Hardware Requirements

### Xprinter XP 58 Specifications

- **Paper Width**: 58mm (2.28 inches)
- **Print Speed**: 250mm/s
- **Resolution**: 203 DPI
- **Interface**: USB 2.0, Ethernet, Serial
- **Paper Type**: Thermal paper roll
- **Power**: 12V DC adapter or USB powered

### System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **USB Port**: USB 2.0 or higher
- **Network**: Ethernet connection (for network printing)
- **Paper**: 58mm thermal paper rolls

## Installation Steps

### 1. Hardware Setup

1. **Unpack the printer** and remove all protective materials
2. **Connect power adapter** (if using external power)
3. **Connect USB cable** to your computer
4. **Load thermal paper**:
   - Open the paper cover
   - Insert paper roll with printed side facing up
   - Feed paper through the print head
   - Close the paper cover
5. **Power on the printer**

### 2. Driver Installation

#### Windows

1. Download Xprinter XP 58 drivers from the manufacturer website
2. Run the installer as administrator
3. Follow the installation wizard
4. Restart your computer if prompted

#### macOS

- Usually plug-and-play, no drivers required
- If issues occur, install CUPS drivers

#### Linux (Ubuntu/Debian)

```bash
# Install CUPS and printer utilities
sudo apt update
sudo apt install cups cups-client printer-driver-escpos

# Add user to lp group for USB access
sudo usermod -a -G lp $USER

# Create udev rules for USB access
echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5740", MODE="0666"' | sudo tee /etc/udev/rules.d/99-xprinter.rules

# Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### 3. Software Configuration

#### Automatic Setup

Run the setup script to automatically configure the printer:

```bash
node scripts/setup-xprinter-xp58.js
```

#### Manual Configuration

1. **Start the POS application**
2. **Navigate to POS interface**
3. **Complete a test sale**
4. **Click "Printer Config" button**
5. **Configure settings**:
   - **Connection Type**: USB
   - **Interface**: USB001 (or detected port)
   - **Paper Width**: 32 characters
   - **Character Set**: SLOVENIA
   - **Line Character**: -
6. **Click "Test Printer Connection"**

### 4. Testing

#### Test Page

1. In the printer configuration dialog
2. Click "Test Printer Connection"
3. Check if test page prints successfully

#### Test Receipt

1. Complete a test sale in POS
2. Click "Thermal Print" button
3. Verify receipt prints correctly

## Configuration Options

### Connection Types

#### USB Connection

- **Type**: `usb`
- **Interface**: `USB001`, `USB002`, etc.
- **Advantages**: Simple setup, reliable
- **Disadvantages**: Requires physical connection

#### Network Connection

- **Type**: `network`
- **Interface**: `192.168.1.100` (printer IP address)
- **Advantages**: Wireless, multiple computers can use
- **Disadvantages**: Requires network configuration

#### Serial Connection

- **Type**: `serial`
- **Interface**: `COM1` (Windows), `/dev/ttyUSB0` (Linux)
- **Advantages**: Legacy support
- **Disadvantages**: Slower, limited compatibility

### Printer Settings

#### Paper Width

- **32 characters**: Standard for 58mm paper
- **24-48 characters**: Adjustable range

#### Character Set

- **SLOVENIA**: Default, supports most characters
- **USA**: American English
- **FRANCE**: French characters
- **GERMANY**: German characters
- **Other**: Various international character sets

#### Line Character

- **Default**: `-` (hyphen)
- **Options**: Any single character for separator lines

## Troubleshooting

### Common Issues

#### Printer Not Detected

**Symptoms**: "Printer not connected" error
**Solutions**:

1. Check USB cable connection
2. Try different USB port
3. Restart printer and computer
4. Check driver installation
5. Verify printer is powered on

#### Paper Jams

**Symptoms**: Printer makes noise but no paper feeds
**Solutions**:

1. Open paper cover
2. Remove jammed paper
3. Reload paper correctly
4. Check paper roll is not stuck

#### Poor Print Quality

**Symptoms**: Faded or incomplete printing
**Solutions**:

1. Clean print head with alcohol
2. Check paper quality
3. Adjust print density settings
4. Replace thermal paper if old

#### Wrong Paper Width

**Symptoms**: Text cut off or misaligned
**Solutions**:

1. Check paper width setting (should be 32 for 58mm)
2. Verify paper roll is 58mm width
3. Adjust printer configuration

### Error Messages

#### "Printer not connected"

- Check USB connection
- Verify printer is powered on
- Test with different USB port
- Check system permissions

#### "Failed to print receipt"

- Check paper is loaded
- Verify printer is not jammed
- Test printer connection
- Check printer configuration

#### "Interface not found"

- Verify correct interface name
- Check USB device detection
- Try different interface names
- Restart application

## Maintenance

### Regular Maintenance

1. **Clean print head** monthly with alcohol
2. **Replace paper** when running low
3. **Check connections** weekly
4. **Update drivers** when available

### Paper Replacement

1. **Open paper cover**
2. **Remove empty roll**
3. **Insert new roll** with printed side up
4. **Feed paper** through print head
5. **Close cover** and test print

### Print Head Cleaning

1. **Power off printer**
2. **Open paper cover**
3. **Clean print head** with cotton swab and alcohol
4. **Let dry** completely
5. **Power on** and test

## API Reference

### Print Receipt Endpoint

```http
POST /api/pos/print-receipt
Content-Type: application/json

{
  "saleId": "SALE-001",
  "timestamp": "2024-01-01T12:00:00Z",
  "staffName": "John Doe",
  "customerName": "Jane Smith",
  "customerPhone": "+2341234567890",
  "items": [
    {
      "name": "Product Name",
      "sku": "SKU001",
      "quantity": 2,
      "price": 1500,
      "total": 3000,
      "category": "Category"
    }
  ],
  "subtotal": 3000,
  "discount": 0,
  "total": 3000,
  "paymentMethod": "cash",
  "printerConfig": {
    "type": "usb",
    "interface": "USB001",
    "options": {
      "width": 32,
      "characterSet": "SLOVENIA",
      "lineCharacter": "-"
    }
  }
}
```

### Test Printer Endpoint

```http
POST /api/pos/print-receipt?action=test
Content-Type: application/json

{
  "printerConfig": {
    "type": "usb",
    "interface": "USB001",
    "options": {
      "width": 32,
      "characterSet": "SLOVENIA",
      "lineCharacter": "-"
    }
  }
}
```

## Support

### Getting Help

1. **Check this documentation** first
2. **Run the setup script** for automatic configuration
3. **Test printer connection** in POS interface
4. **Check system logs** for error details
5. **Contact support** with error messages and system details

### Useful Commands

#### Detect USB Devices

```bash
# Windows
powershell "Get-PnpDevice | Where-Object {$_.Class -eq 'USB'}"

# macOS
system_profiler SPUSBDataType

# Linux
lsusb
```

#### Test Printer Connection

```bash
# Run setup script
node scripts/setup-xprinter-xp58.js
```

#### Check Application Logs

```bash
# Development
npm run dev

# Production
npm run start
```

## Changelog

### Version 1.0.0

- Initial Xprinter XP 58 support
- USB, network, and serial connections
- ESC/POS command support
- Automatic paper cutting
- Test page functionality
- Configuration interface
- Error handling and troubleshooting
