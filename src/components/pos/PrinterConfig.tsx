"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { IconTestPipe, IconSettings } from "@tabler/icons-react";
import { logger } from "@/lib/logger";

interface PrinterConfigProps {
  onConfigChange: (config: any) => void;
}

export function PrinterConfig({ onConfigChange }: PrinterConfigProps) {
  const [config, setConfig] = useState({
    type: "usb",
    interface: "USB001",
    options: {
      width: 32,
      characterSet: "SLOVENIA",
      removeSpecialCharacters: false,
      lineCharacter: "-",
    },
  });

  const [isTesting, setIsTesting] = useState(false);

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config };
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      if (parent === "options") {
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
      const response = await fetch("/api/pos/print-receipt?action=test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ printerConfig: config }),
      });

      if (response.ok) {
        toast.success("Printer test successful! Check your printer.");
      } else {
        const error = await response.json();
        toast.error(error.error || "Printer test failed");
      }
    } catch (error) {
      logger.error("Printer test failed", {
        config: config.type,
        interface: config.interface,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error("Printer test failed");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSettings className="h-5 w-5" />
          Xprinter XP 58 Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Type */}
        <div className="space-y-2">
          <Label htmlFor="connection-type">Connection Type</Label>
          <Select
            value={config.type}
            onValueChange={(value) => handleConfigChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select connection type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usb">USB</SelectItem>
              <SelectItem value="network">Network</SelectItem>
              <SelectItem value="serial">Serial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Interface */}
        <div className="space-y-2">
          <Label htmlFor="interface">Interface</Label>
          <Input
            id="interface"
            value={config.interface}
            onChange={(e) => handleConfigChange("interface", e.target.value)}
            placeholder="USB001, 192.168.1.100, COM1"
          />
          <p className="text-sm text-muted-foreground">
            {config.type === "usb" && "Common USB interfaces: USB001, USB002"}
            {config.type === "network" && "Network IP: 192.168.1.100"}
            {config.type === "serial" && "Serial port: COM1, /dev/ttyUSB0"}
          </p>
        </div>

        {/* Paper Width */}
        <div className="space-y-2">
          <Label htmlFor="width">Paper Width (characters)</Label>
          <Input
            id="width"
            type="number"
            value={config.options.width}
            onChange={(e) =>
              handleConfigChange("options.width", parseInt(e.target.value))
            }
            min="24"
            max="48"
          />
          <p className="text-sm text-muted-foreground">
            Xprinter XP 58 supports 32 characters (default)
          </p>
        </div>

        {/* Character Set */}
        <div className="space-y-2">
          <Label htmlFor="character-set">Character Set</Label>
          <Select
            value={config.options.characterSet}
            onValueChange={(value) =>
              handleConfigChange("options.characterSet", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select character set" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SLOVENIA">SLOVENIA (Default)</SelectItem>
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
              <SelectItem value="LATINAMERICA">LATINAMERICA</SelectItem>
              <SelectItem value="KOREA">KOREA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Line Character */}
        <div className="space-y-2">
          <Label htmlFor="line-character">Line Character</Label>
          <Input
            id="line-character"
            value={config.options.lineCharacter}
            onChange={(e) =>
              handleConfigChange("options.lineCharacter", e.target.value)
            }
            maxLength={1}
            placeholder="-"
          />
        </div>

        {/* Test Button */}
        <div className="pt-4">
          <Button
            onClick={testPrinter}
            disabled={isTesting}
            className="w-full"
            variant="outline"
          >
            <IconTestPipe className="h-4 w-4 mr-2" />
            {isTesting ? "Testing..." : "Test Printer Connection"}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>USB Connection:</strong> Make sure your Xprinter XP 58 is
            connected via USB and recognized by your system.
          </p>
          <p>
            <strong>Network Connection:</strong> Ensure the printer is on the
            same network and the IP address is correct.
          </p>
          <p>
            <strong>Serial Connection:</strong> Verify the correct COM port or
            device path is specified.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
