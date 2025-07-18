import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("Product Barcode Functionality", () => {
  beforeEach(() => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
    jest.clearAllMocks();
  });

  describe("Barcode Validation", () => {
    it("should validate EAN-13 barcodes", () => {
      const isValidEAN13 = (barcode: string): boolean => {
        if (!/^\d{13}$/.test(barcode)) return false;

        const digits = barcode.split("").map(Number);
        const checkDigit = digits[12];
        const sum = digits.slice(0, 12).reduce((acc, digit, index) => {
          return acc + digit * (index % 2 === 0 ? 1 : 3);
        }, 0);
        const calculatedCheckDigit = (10 - (sum % 10)) % 10;

        return checkDigit === calculatedCheckDigit;
      };

      // Valid EAN-13 barcodes
      expect(isValidEAN13("1234567890128")).toBe(true);
      expect(isValidEAN13("9780201379624")).toBe(true);

      // Invalid EAN-13 barcodes
      expect(isValidEAN13("1234567890123")).toBe(false); // Wrong check digit
      expect(isValidEAN13("123456789012")).toBe(false); // Too short
      expect(isValidEAN13("12345678901234")).toBe(false); // Too long
      expect(isValidEAN13("123456789012a")).toBe(false); // Contains letters
    });

    it("should validate UPC-A barcodes", () => {
      const isValidUPCA = (barcode: string): boolean => {
        if (!/^\d{12}$/.test(barcode)) return false;

        const digits = barcode.split("").map(Number);
        const checkDigit = digits[11];
        const sum = digits.slice(0, 11).reduce((acc, digit, index) => {
          return acc + digit * (index % 2 === 0 ? 3 : 1);
        }, 0);
        const calculatedCheckDigit = (10 - (sum % 10)) % 10;

        return checkDigit === calculatedCheckDigit;
      };

      // Valid UPC-A barcodes
      expect(isValidUPCA("123456789012")).toBe(true);
      expect(isValidUPCA("012345678905")).toBe(true);

      // Invalid UPC-A barcodes
      expect(isValidUPCA("123456789013")).toBe(false); // Wrong check digit
      expect(isValidUPCA("12345678901")).toBe(false); // Too short
      expect(isValidUPCA("1234567890123")).toBe(false); // Too long
    });

    it("should validate custom barcode formats", () => {
      const isValidCustomBarcode = (barcode: string): boolean => {
        // Custom format: 3-6 alphanumeric characters
        return /^[A-Z0-9]{3,6}$/.test(barcode);
      };

      expect(isValidCustomBarcode("ABC123")).toBe(true);
      expect(isValidCustomBarcode("123")).toBe(true);
      expect(isValidCustomBarcode("ABCDEF")).toBe(true);

      expect(isValidCustomBarcode("AB")).toBe(false); // Too short
      expect(isValidCustomBarcode("ABCDEFG")).toBe(false); // Too long
      expect(isValidCustomBarcode("ABC-123")).toBe(false); // Contains invalid characters
      expect(isValidCustomBarcode("abc123")).toBe(false); // Lowercase not allowed
    });

    it("should handle empty and null barcodes", () => {
      const isValidBarcode = (barcode: string | null | undefined): boolean => {
        if (!barcode || barcode.trim() === "") return false;
        return /^\d{12,13}$/.test(barcode.trim());
      };

      expect(isValidBarcode("")).toBe(false);
      expect(isValidBarcode("   ")).toBe(false);
      expect(isValidBarcode(null)).toBe(false);
      expect(isValidBarcode(undefined)).toBe(false);
      expect(isValidBarcode("1234567890128")).toBe(true);
    });
  });

  describe("Barcode Lookup", () => {
    it("should lookup product by barcode successfully", async () => {
      const mockProduct = {
        id: 1,
        name: "Test Product",
        sku: "TEST-001",
        barcode: "1234567890128",
        price: 15.99,
        stock: 10,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => mockProduct,
        } as Response
      );

      const response = await fetch(
        "/api/pos/barcode-lookup?barcode=1234567890128"
      );
      const product = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/pos/barcode-lookup?barcode=1234567890128"
      );
      expect(product).toEqual(mockProduct);
    });

    it("should handle barcode not found", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: false,
          status: 404,
          json: async () => ({ message: "Product not found" }),
        } as Response
      );

      const response = await fetch(
        "/api/pos/barcode-lookup?barcode=9999999999999"
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it("should handle network errors during barcode lookup", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(
        fetch("/api/pos/barcode-lookup?barcode=1234567890128")
      ).rejects.toThrow("Network error");
    });

    it("should encode barcode parameters correctly", async () => {
      const mockProduct = { id: 1, name: "Test Product" };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        {
          ok: true,
          json: async () => mockProduct,
        } as Response
      );

      const barcode = "123 456 789 0128"; // Contains spaces
      const encodedBarcode = encodeURIComponent(barcode);

      await fetch(`/api/pos/barcode-lookup?barcode=${encodedBarcode}`);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/pos/barcode-lookup?barcode=123%20456%20789%200128"
      );
    });
  });

  describe("Barcode Generation", () => {
    it("should generate valid EAN-13 check digits", () => {
      const generateEAN13CheckDigit = (digits: string): number => {
        if (!/^\d{12}$/.test(digits)) {
          throw new Error("Must provide exactly 12 digits");
        }

        const digitArray = digits.split("").map(Number);
        const sum = digitArray.reduce((acc, digit, index) => {
          return acc + digit * (index % 2 === 0 ? 1 : 3);
        }, 0);

        return (10 - (sum % 10)) % 10;
      };

      expect(generateEAN13CheckDigit("123456789012")).toBe(8);
      expect(generateEAN13CheckDigit("978020137962")).toBe(4);
      expect(generateEAN13CheckDigit("400638133393")).toBe(1);
    });

    it("should generate valid UPC-A check digits", () => {
      const generateUPCACheckDigit = (digits: string): number => {
        if (!/^\d{11}$/.test(digits)) {
          throw new Error("Must provide exactly 11 digits");
        }

        const digitArray = digits.split("").map(Number);
        const sum = digitArray.reduce((acc, digit, index) => {
          return acc + digit * (index % 2 === 0 ? 3 : 1);
        }, 0);

        return (10 - (sum % 10)) % 10;
      };

      expect(generateUPCACheckDigit("12345678901")).toBe(2);
      expect(generateUPCACheckDigit("01234567890")).toBe(5);
    });

    it("should generate custom barcodes", () => {
      const generateCustomBarcode = (
        prefix: string,
        sequence: number
      ): string => {
        const paddedSequence = sequence.toString().padStart(4, "0");
        return `${prefix}${paddedSequence}`;
      };

      expect(generateCustomBarcode("PROD", 1)).toBe("PROD0001");
      expect(generateCustomBarcode("ITEM", 123)).toBe("ITEM0123");
      expect(generateCustomBarcode("SKU", 9999)).toBe("SKU9999");
    });

    it("should validate generated barcodes", () => {
      const validateGeneratedBarcode = (barcode: string): boolean => {
        // Check if it follows the pattern: 3-4 letters + 4 digits
        return /^[A-Z]{3,4}\d{4}$/.test(barcode);
      };

      expect(validateGeneratedBarcode("PROD0001")).toBe(true);
      expect(validateGeneratedBarcode("ITEM0123")).toBe(true);
      expect(validateGeneratedBarcode("SKU9999")).toBe(true);

      expect(validateGeneratedBarcode("PROD001")).toBe(false); // Too short
      expect(validateGeneratedBarcode("PRODUCT0001")).toBe(false); // Too long
      expect(validateGeneratedBarcode("prod0001")).toBe(false); // Lowercase
      expect(validateGeneratedBarcode("PROD000A")).toBe(false); // Letter in number part
    });
  });

  describe("Barcode Scanning", () => {
    it("should handle successful barcode scan", () => {
      const handleBarcodeScan = (barcode: string) => {
        if (!barcode || barcode.trim() === "") {
          throw new Error("Invalid barcode");
        }

        const trimmedBarcode = barcode.trim();

        // Validate format
        if (!/^\d{12,13}$/.test(trimmedBarcode)) {
          throw new Error("Invalid barcode format");
        }

        return {
          barcode: trimmedBarcode,
          timestamp: new Date().toISOString(),
          valid: true,
        };
      };

      const result = handleBarcodeScan("1234567890128");

      expect(result.barcode).toBe("1234567890128");
      expect(result.valid).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it("should handle barcode scan errors", () => {
      const handleBarcodeScan = (barcode: string) => {
        if (!barcode || barcode.trim() === "") {
          throw new Error("Invalid barcode");
        }

        const trimmedBarcode = barcode.trim();

        if (!/^\d{12,13}$/.test(trimmedBarcode)) {
          throw new Error("Invalid barcode format");
        }

        return {
          barcode: trimmedBarcode,
          timestamp: new Date().toISOString(),
          valid: true,
        };
      };

      expect(() => handleBarcodeScan("")).toThrow("Invalid barcode");
      expect(() => handleBarcodeScan("   ")).toThrow("Invalid barcode");
      expect(() => handleBarcodeScan("123")).toThrow("Invalid barcode format");
      expect(() => handleBarcodeScan("abcdefghijkl")).toThrow(
        "Invalid barcode format"
      );
    });

    it("should normalize barcode data", () => {
      const normalizeBarcode = (barcode: string): string => {
        // Remove spaces, dashes, and other separators
        return barcode.replace(/[\s\-_]/g, "");
      };

      expect(normalizeBarcode("123 456 789 0128")).toBe("1234567890128");
      expect(normalizeBarcode("123-456-789-0128")).toBe("1234567890128");
      expect(normalizeBarcode("123_456_789_0128")).toBe("1234567890128");
      expect(normalizeBarcode("1234567890128")).toBe("1234567890128");
    });
  });

  describe("Barcode Duplicate Detection", () => {
    it("should detect duplicate barcodes", () => {
      const checkBarcodeDuplicate = (
        barcode: string,
        existingBarcodes: string[]
      ): boolean => {
        return existingBarcodes.includes(barcode);
      };

      const existingBarcodes = [
        "1234567890128",
        "9876543210987",
        "1111111111111",
      ];

      expect(checkBarcodeDuplicate("1234567890128", existingBarcodes)).toBe(
        true
      );
      expect(checkBarcodeDuplicate("9999999999999", existingBarcodes)).toBe(
        false
      );
      expect(checkBarcodeDuplicate("9876543210987", existingBarcodes)).toBe(
        true
      );
    });

    it("should handle case-insensitive barcode comparison", () => {
      const checkBarcodeDuplicate = (
        barcode: string,
        existingBarcodes: string[]
      ): boolean => {
        const normalizedBarcode = barcode.toUpperCase();
        return existingBarcodes.some(
          (existing) => existing.toUpperCase() === normalizedBarcode
        );
      };

      const existingBarcodes = [
        "1234567890128",
        "ABCD12345678",
        "test12345678",
      ];

      expect(checkBarcodeDuplicate("1234567890128", existingBarcodes)).toBe(
        true
      );
      expect(checkBarcodeDuplicate("abcd12345678", existingBarcodes)).toBe(
        true
      );
      expect(checkBarcodeDuplicate("TEST12345678", existingBarcodes)).toBe(
        true
      );
      expect(checkBarcodeDuplicate("9999999999999", existingBarcodes)).toBe(
        false
      );
    });
  });
});
