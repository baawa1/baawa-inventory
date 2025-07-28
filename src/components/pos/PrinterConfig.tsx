'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  IconPrinter,
  IconSettings,
  IconTestPipe,
  IconUsb,
  IconNetwork,
  IconWifi,
} from '@tabler/icons-react';

interface PrinterConfigProps {
  onConfigChange: (_config: any) => void;
}

interface USBDevice {
  id: string;
  name: string;
}

export function PrinterConfig({ onConfigChange }: PrinterConfigProps) {
  const [config, setConfig] = useState({
    type: 'usb' as 'usb' | 'network' | 'serial',
    interface: 'USB001',
    options: {
      width: 32,
      characterSet: 'SLOVENIA',
      removeSpecialCharacters: false,
      lineCharacter: '-',
      ip: '192.168.1.100',
      port: 9100,
    },
  });

  const [isTesting, setIsTesting] = useState(false);
  const [usbDevices, setUsbDevices] = useState<USBDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Load available USB devices
  const loadUSBDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const response = await fetch('/api/pos/printer/devices');
      if (response.ok) {
        const devices = await response.json();
        setUsbDevices(devices);
      }
    } catch (error) {
      logger.error('Failed to load USB devices', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadUSBDevices();
  }, []);

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config };
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      if (parent === 'options') {
        newConfig.options = {
          ...newConfig.options,
          [child]: value,
        };
      }
    } else {
      (newConfig as any)[key] = value;
    }
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const testPrinter = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/pos/print-receipt?action=test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerConfig: config }),
      });

      if (response.ok) {
        toast.success('Printer test successful! Check your printer.');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Printer test failed');
      }
    } catch (error) {
      logger.error('Printer test failed', {
        config: config.type,
        interface: config.interface,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Printer test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const testNetworkConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/pos/printer/test-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip: config.options.ip,
          port: config.options.port,
        }),
      });

      if (response.ok) {
        toast.success('Network printer connection successful!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Network printer connection failed');
      }
    } catch (error) {
      logger.error('Network printer test failed', {
        ip: config.options.ip,
        port: config.options.port,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Network printer connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSettings className="h-5 w-5" />
          Printer Configuration
        </CardTitle>
        <CardDescription>
          Configure your thermal printer for cross-platform support (USB,
          Network, Serial)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="connection-type">Connection Type</Label>
                <Select
                  value={config.type}
                  onValueChange={value => handleConfigChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usb">
                      <div className="flex items-center gap-2">
                        <IconUsb className="h-4 w-4" />
                        USB Connection
                      </div>
                    </SelectItem>
                    <SelectItem value="network">
                      <div className="flex items-center gap-2">
                        <IconNetwork className="h-4 w-4" />
                        Network Connection
                      </div>
                    </SelectItem>
                    <SelectItem value="serial">
                      <div className="flex items-center gap-2">
                        <IconWifi className="h-4 w-4" />
                        Serial Connection
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(config.type as string) === 'usb' && (
                <div>
                  <Label htmlFor="usb-interface">USB Interface</Label>
                  <div className="flex gap-2">
                    <Select
                      value={config.interface}
                      onValueChange={value =>
                        handleConfigChange('interface', value)
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {usbDevices.map(device => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="USB001">USB001 (Default)</SelectItem>
                        <SelectItem value="USB002">USB002</SelectItem>
                        <SelectItem value="USB003">USB003</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadUSBDevices}
                      disabled={isLoadingDevices}
                    >
                      {isLoadingDevices ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                </div>
              )}

              {config.type === 'network' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="network-ip">IP Address</Label>
                    <Input
                      id="network-ip"
                      type="text"
                      value={config.options.ip}
                      onChange={e =>
                        handleConfigChange('options.ip', e.target.value)
                      }
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="network-port">Port</Label>
                    <Input
                      id="network-port"
                      type="number"
                      value={config.options.port}
                      onChange={e =>
                        handleConfigChange(
                          'options.port',
                          parseInt(e.target.value)
                        )
                      }
                      placeholder="9100"
                    />
                  </div>
                </div>
              )}

              {config.type === 'serial' && (
                <div>
                  <Label htmlFor="serial-interface">Serial Interface</Label>
                  <Select
                    value={config.interface}
                    onValueChange={value =>
                      handleConfigChange('interface', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COM1">COM1 (Windows)</SelectItem>
                      <SelectItem value="COM2">COM2 (Windows)</SelectItem>
                      <SelectItem value="/dev/ttyUSB0">
                        /dev/ttyUSB0 (Linux)
                      </SelectItem>
                      <SelectItem value="/dev/tty.usbserial">
                        /dev/tty.usbserial (macOS)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paper-width">Paper Width (chars)</Label>
                <Input
                  id="paper-width"
                  type="number"
                  value={config.options.width}
                  onChange={e =>
                    handleConfigChange(
                      'options.width',
                      parseInt(e.target.value)
                    )
                  }
                  min="24"
                  max="48"
                />
              </div>
              <div>
                <Label htmlFor="character-set">Character Set</Label>
                <Select
                  value={config.options.characterSet}
                  onValueChange={value =>
                    handleConfigChange('options.characterSet', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SLOVENIA">SLOVENIA</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="FRANCE">FRANCE</SelectItem>
                    <SelectItem value="GERMANY">GERMANY</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="DENMARK">DENMARK</SelectItem>
                    <SelectItem value="SWEDEN">SWEDEN</SelectItem>
                    <SelectItem value="ITALY">ITALY</SelectItem>
                    <SelectItem value="SPAIN">SPAIN</SelectItem>
                    <SelectItem value="JAPAN">JAPAN</SelectItem>
                    <SelectItem value="NORWAY">NORWAY</SelectItem>
                    <SelectItem value="DENMARK2">DENMARK2</SelectItem>
                    <SelectItem value="SPAIN2">SPAIN2</SelectItem>
                    <SelectItem value="LATINA">LATINA</SelectItem>
                    <SelectItem value="KOREA">KOREA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="line-character">Line Character</Label>
                <Input
                  id="line-character"
                  type="text"
                  value={config.options.lineCharacter}
                  onChange={e =>
                    handleConfigChange('options.lineCharacter', e.target.value)
                  }
                  maxLength={1}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="remove-special"
                  checked={config.options.removeSpecialCharacters}
                  onCheckedChange={checked =>
                    handleConfigChange(
                      'options.removeSpecialCharacters',
                      checked
                    )
                  }
                />
                <Label htmlFor="remove-special">
                  Remove Special Characters
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={testPrinter}
                  disabled={isTesting}
                  className="flex-1"
                >
                  {isTesting ? (
                    <>
                      <IconTestPipe className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <IconPrinter className="mr-2 h-4 w-4" />
                      Test Printer
                    </>
                  )}
                </Button>

                {config.type === 'network' && (
                  <Button
                    onClick={testNetworkConnection}
                    disabled={isTesting}
                    variant="outline"
                  >
                    {isTesting ? (
                      <>
                        <IconTestPipe className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <IconNetwork className="mr-2 h-4 w-4" />
                        Test Network
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="bg-muted rounded-lg p-4">
                <h4 className="mb-2 font-medium">Test Instructions</h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• Make sure your printer is connected and powered on</li>
                  <li>
                    • For USB: Check device manager (Windows) or system profiler
                    (macOS)
                  </li>
                  <li>
                    • For Network: Ensure printer IP is correct and accessible
                  </li>
                  <li>
                    • Test will print a sample receipt to verify connection
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
