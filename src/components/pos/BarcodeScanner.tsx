"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCamera, IconCameraOff, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({
  onScan,
  onClose,
  isOpen,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [
        // Support various barcode formats
        1, // CODE_128
        2, // CODE_39
        3, // CODE_93
        4, // CODABAR
        5, // EAN_13
        6, // EAN_8
        7, // ITF
        8, // QR_CODE
        9, // PDF_417
        10, // AZTEC
        11, // DATA_MATRIX
      ],
    };

    const scanner = new Html5QrcodeScanner(
      "barcode-scanner",
      config,
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    const onScanSuccess = (decodedText: string) => {
      // Debug logging removed for production
      onScan(decodedText);
      toast.success("Barcode scanned successfully!");
      cleanup();
    };

    const onScanError = (error: string) => {
      // Don't log every scan error, just continue scanning
      logger.debug("Scan error", { error });
    };

    try {
      scanner.render(onScanSuccess, onScanError);
      setError(null);
    } catch (err) {
      logger.error("Failed to start scanner", {
        error: err instanceof Error ? err.message : String(err),
      });
      setError(
        "Failed to start camera. Please ensure camera permissions are granted."
      );
      toast.error("Failed to start camera scanner");
    }

    return cleanup;
  }, [isOpen, onScan]);

  const cleanup = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (err) {
        logger.error("Failed to clear barcode scanner", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
      scannerRef.current = null;
    }
    setError(null);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconCamera className="h-5 w-5" />
              Barcode Scanner
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center text-red-500">
                <IconCameraOff className="h-8 w-8 mr-2" />
                <span>Camera Error</span>
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Position the barcode within the viewfinder
                </p>
              </div>

              {/* Scanner Container */}
              <div
                id="barcode-scanner"
                className="w-full"
                style={{ minHeight: "300px" }}
              />

              <div className="flex justify-center space-x-2">
                <Button onClick={handleClose} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
