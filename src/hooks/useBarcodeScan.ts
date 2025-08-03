import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseBarcodeScanProps {
  onScan: (_barcode: string) => void;
}

export function useBarcodeScan({ onScan }: UseBarcodeScanProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    setError(null);
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setError(null);
  }, []);

  const handleScan = useCallback(
    (result: string) => {
      // Debug logging removed for production
      onScan(result);
      setIsScanning(false);
    },
    [onScan]
  );

  const handleError = useCallback((error: string) => {
    logger.error('Barcode scan error', {
      error,
    });
    setError(error);
    toast.error('Barcode scan failed');
  }, []);

  // Manual barcode lookup
  const lookupBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return null;

    try {
      const response = await fetch(
        `/api/pos/barcode-lookup?barcode=${encodeURIComponent(barcode)}`
      );

      if (!response.ok) {
        throw new Error('Product not found');
      }

      const product = await response.json();
      return product;
    } catch (error) {
      logger.error('Barcode lookup failed', {
        barcode,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, []);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
    handleScan,
    handleError,
    lookupBarcode,
  };
}
