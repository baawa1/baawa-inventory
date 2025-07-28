# 🖨️ Cross-Platform Thermal Printer Setup Guide

This guide covers setting up thermal printers for the POS system across Windows, macOS, and Linux platforms.

## 📋 Table of Contents

1. [Supported Printers](#supported-printers)
2. [Prerequisites](#prerequisites)
3. [Quick Setup](#quick-setup)
4. [Platform-Specific Setup](#platform-specific-setup)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

## 🖨️ Supported Printers

### Primary Support
- **Xprinter XP 58** - 58mm thermal printer
- **Epson TM-T88VI** - 80mm thermal printer
- **Star TSP100** - 58mm thermal printer

### Generic ESC/POS Support
- Any ESC/POS compatible thermal printer
- Network-enabled thermal printers
- USB thermal printers

## 📋 Prerequisites

### Software Requirements
- Node.js 18+ 
- npm or yarn
- POS application running

### Hardware Requirements
- Thermal printer (USB, Network, or Serial)
- Thermal paper rolls (58mm or 80mm)
- Power adapter (if required)

### Dependencies
```bash
npm install node-thermal-printer escpos escpos-usb escpos-network
```

## 🚀 Quick Setup

### 1. Run Setup Script
```bash
node scripts/setup-thermal-printer.js
```

### 2. Connect Printer
- **USB**: Connect via USB cable
- **Network**: Connect to same network as computer
- **Serial**: Connect via serial cable

### 3. Start Application
```bash
npm run dev
```

### 4. Test Connection
1. Complete a test sale
2. Click "Thermal Print" button
3. Check printer output

## 🖥️ Platform-Specific Setup

### Windows Setup

#### USB Connection
1. **Install Drivers** (if required)
   - Download drivers from printer manufacturer
   - Install following manufacturer instructions

2. **Check Device Manager**
   ```powershell
   Get-PnpDevice | Where-Object {$_.Class -eq 'USB'}
   ```

3. **Test Connection**
   ```powershell
   # Check USB devices
   Get-PnpDevice | Where-Object {$_.FriendlyName -like "*printer*"}
   ```

#### Network Connection
1. **Configure Network Settings**
   - Set static IP on printer
   - Ensure printer is on same network

2. **Test Network Connectivity**
   ```powershell
   ping [printer-ip]
   Test-NetConnection -ComputerName [printer-ip] -Port 9100
   ```

3. **Check Windows Printers**
   ```powershell
   Get-Printer | Where-Object {$_.Type -eq 'TCPIPPrinter'}
   ```

### macOS Setup

#### USB Connection
1. **Check System Information**
   ```bash
   system_profiler SPUSBDataType
   ```

2. **Install CUPS** (if needed)
   ```bash
   brew install cups
   ```

3. **Check USB Devices**
   ```bash
   ls /dev/tty.usb*
   ```

#### Network Connection
1. **Check Network Printers**
   ```bash
   lpstat -p
   ```

2. **Test Network Connectivity**
   ```bash
   ping [printer-ip]
   nc -z [printer-ip] 9100
   ```

### Linux Setup

#### USB Connection
1. **Install Dependencies**
   ```bash
   sudo apt-get install cups libusb-1.0-0-dev
   ```

2. **Check USB Devices**
   ```bash
   lsusb
   ls /dev/ttyUSB*
   ```

3. **Create udev Rules** (if needed)
   ```bash
   sudo nano /etc/udev/rules.d/99-thermal-printer.rules
   ```
   
   Add rules:
   ```
   SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5740", MODE="0666"
   SUBSYSTEM=="usb", ATTRS{idVendor}=="04b8", ATTRS{idProduct}=="0202", MODE="0666"
   ```

4. **Reload udev Rules**
   ```bash
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

#### Network Connection
1. **Test Network Connectivity**
   ```bash
   ping [printer-ip]
   telnet [printer-ip] 9100
   ```

2. **Check CUPS**
   ```bash
   lpstat -p
   ```

## ⚙️ Configuration

### Printer Configuration Interface

The POS application includes a comprehensive printer configuration interface:

1. **Access Configuration**
   - Complete a test sale
   - Click "Printer Config" button

2. **Connection Settings**
   - **USB**: Select USB interface (USB001, USB002, etc.)
   - **Network**: Enter IP address and port (default: 9100)
   - **Serial**: Select serial port (COM1, /dev/ttyUSB0, etc.)

3. **Print Options**
   - **Paper Width**: 32 characters (58mm) or 48 characters (80mm)
   - **Character Set**: SLOVENIA, USA, FRANCE, etc.
   - **Line Character**: Custom separator character
   - **Remove Special Characters**: Toggle for compatibility

### Configuration File

The setup script creates a `printer-config.json` file:

```json
{
  "type": "usb",
  "interface": "USB001",
  "options": {
    "width": 32,
    "characterSet": "SLOVENIA",
    "removeSpecialCharacters": false,
    "lineCharacter": "-",
    "ip": "192.168.1.100",
    "port": 9100
  }
}
```

## 🧪 Testing

### Test Methods

1. **API Test Endpoint**
   ```bash
   curl -X POST http://localhost:3000/api/pos/print-receipt?action=test \
     -H "Content-Type: application/json" \
     -d '{"printerConfig": {...}}'
   ```

2. **Network Connection Test**
   ```bash
   curl -X POST http://localhost:3000/api/pos/printer/test-network \
     -H "Content-Type: application/json" \
     -d '{"ip": "192.168.1.100", "port": 9100}'
   ```

3. **USB Device Detection**
   ```bash
   curl http://localhost:3000/api/pos/printer/devices
   ```

### Test Receipt Content

The test prints a sample receipt with:
- Store header and branding
- Test transaction details
- Sample items and totals
- Connection status confirmation

## 🔧 Troubleshooting

### Common Issues

#### USB Connection Problems

**Problem**: "No USB printers found"
**Solutions**:
1. Check USB cable connection
2. Verify printer is powered on
3. Check device manager (Windows) or system profiler (macOS)
4. Run setup script as Administrator (Windows) or with sudo (Linux)
5. Install printer drivers if required

**Problem**: "Permission denied"
**Solutions**:
1. Run as Administrator (Windows)
2. Add user to lp group (Linux): `sudo usermod -a -G lp $USER`
3. Check udev rules (Linux)
4. Restart application after permission changes

#### Network Connection Problems

**Problem**: "Network printer connection failed"
**Solutions**:
1. Verify printer IP address is correct
2. Check network connectivity: `ping [printer-ip]`
3. Test port connectivity: `telnet [printer-ip] 9100`
4. Check firewall settings
5. Ensure printer is on same network as computer
6. Try different port (common ports: 9100, 9101, 9102)

**Problem**: "Connection timeout"
**Solutions**:
1. Check network cable connection
2. Verify printer network settings
3. Try static IP configuration
4. Check router settings
5. Test with different network cable

#### Print Quality Issues

**Problem**: "Text not aligned"
**Solutions**:
1. Adjust paper width setting
2. Check character set configuration
3. Verify paper roll installation
4. Clean print head
5. Check paper feed mechanism

**Problem**: "Missing characters"
**Solutions**:
1. Enable "Remove Special Characters" option
2. Change character set (try USA or SLOVENIA)
3. Check printer language settings
4. Update printer firmware

### Platform-Specific Issues

#### Windows
- **USB not detected**: Run as Administrator
- **Network blocked**: Check Windows Firewall
- **Driver issues**: Install manufacturer drivers

#### macOS
- **Permission issues**: Check System Preferences > Security & Privacy
- **USB not found**: Check System Information > USB
- **Network issues**: Check Network preferences

#### Linux
- **Permission denied**: Add user to lp group
- **USB not detected**: Check udev rules
- **Network timeout**: Check iptables/firewall

### Debug Commands

#### Windows
```powershell
# Check USB devices
Get-PnpDevice | Where-Object {$_.Class -eq 'USB'}

# Check network printers
Get-Printer | Where-Object {$_.Type -eq 'TCPIPPrinter'}

# Test network connection
Test-NetConnection -ComputerName [printer-ip] -Port 9100
```

#### macOS
```bash
# Check USB devices
system_profiler SPUSBDataType

# Check network printers
lpstat -p

# Test network connection
nc -z [printer-ip] 9100
```

#### Linux
```bash
# Check USB devices
lsusb
ls /dev/ttyUSB*

# Check network printers
lpstat -p

# Test network connection
telnet [printer-ip] 9100
```

## 📚 API Reference

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
      "removeSpecialCharacters": false,
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

### Get USB Devices Endpoint

```http
GET /api/pos/printer/devices
```

### Test Network Printer Endpoint

```http
POST /api/pos/printer/test-network
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "port": 9100
}
```

## 📞 Support

### Getting Help

1. **Check this documentation** first
2. **Run the setup script**: `node scripts/setup-thermal-printer.js`
3. **Test printer connection** in POS interface
4. **Check system logs** for error details
5. **Contact support** with error messages and system details

### Useful Resources

- [ESC/POS Command Reference](https://reference.epson-biz.com/modules/ref_escpos/)
- [Node Thermal Printer Documentation](https://github.com/Klemen1337/node-thermal-printer)
- [ESC/POS Library Documentation](https://github.com/song940/node-escpos)

### Log Files

Check application logs for detailed error information:
- Development: Console output
- Production: Application log files
- System logs: `/var/log/` (Linux), Event Viewer (Windows)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready 