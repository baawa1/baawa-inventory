import { describe, it, expect } from "@jest/globals";

// Mock utility functions that would be in supplier utils
const formatSupplierName = (name: string): string => {
  return name.trim().replace(/\s+/g, " ");
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

const formatAddress = (address: string): string => {
  return address.trim().replace(/\s+/g, " ");
};

const generateSupplierCode = (name: string): string => {
  const cleanName = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${cleanName.slice(0, 3)}${timestamp}`;
};

const calculateCreditUtilization = (
  creditLimit: number,
  currentBalance: number
): number => {
  if (creditLimit <= 0) return 0;
  return Math.min((currentBalance / creditLimit) * 100, 100);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

const validateWebsite = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const sanitizeSupplierData = (data: any): any => {
  const sanitized = { ...data };

  if (sanitized.name) {
    sanitized.name = formatSupplierName(sanitized.name);
  }

  if (sanitized.address) {
    sanitized.address = formatAddress(sanitized.address);
  }

  if (sanitized.contactPerson) {
    sanitized.contactPerson = sanitized.contactPerson.trim();
  }

  return sanitized;
};

describe("Supplier Utilities", () => {
  describe("formatSupplierName", () => {
    it("should format supplier name correctly", () => {
      expect(formatSupplierName("  Tech   Supplies   Ltd  ")).toBe(
        "Tech Supplies Ltd"
      );
    });

    it("should handle single word names", () => {
      expect(formatSupplierName("Supplier")).toBe("Supplier");
    });

    it("should handle names with special characters", () => {
      expect(formatSupplierName("Tech-Supplies & Co.")).toBe(
        "Tech-Supplies & Co."
      );
    });

    it("should handle empty string", () => {
      expect(formatSupplierName("")).toBe("");
    });

    it("should handle string with only spaces", () => {
      expect(formatSupplierName("   ")).toBe("");
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email formats", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
      expect(validateEmail("contact+tag@example.org")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("test.example.com")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(validateEmail("test@test")).toBe(false);
      expect(validateEmail("test..test@example.com")).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("should validate Nigerian phone numbers", () => {
      expect(validatePhone("+2348012345678")).toBe(true);
      expect(validatePhone("08012345678")).toBe(true);
      expect(validatePhone("+234 801 234 5678")).toBe(true);
    });

    it("should validate international phone numbers", () => {
      expect(validatePhone("+1-555-123-4567")).toBe(true);
      expect(validatePhone("+44 20 7946 0958")).toBe(true);
      expect(validatePhone("+61 2 8765 4321")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(validatePhone("123")).toBe(false);
      expect(validatePhone("invalid-phone")).toBe(false);
      expect(validatePhone("")).toBe(false);
      expect(validatePhone("abc-def-ghij")).toBe(false);
    });

    it("should handle phone numbers with parentheses", () => {
      expect(validatePhone("(555) 123-4567")).toBe(true);
      expect(validatePhone("+1 (555) 123-4567")).toBe(true);
    });
  });

  describe("formatAddress", () => {
    it("should format address correctly", () => {
      expect(formatAddress("  123   Main   Street  ")).toBe("123 Main Street");
    });

    it("should handle addresses with special characters", () => {
      expect(formatAddress("123 Main St., Suite #100")).toBe(
        "123 Main St., Suite #100"
      );
    });

    it("should handle empty address", () => {
      expect(formatAddress("")).toBe("");
    });

    it("should handle address with multiple spaces", () => {
      expect(formatAddress("123    Main    Street")).toBe("123 Main Street");
    });
  });

  describe("generateSupplierCode", () => {
    it("should generate supplier code from name", () => {
      const code = generateSupplierCode("Tech Supplies Ltd");
      expect(code).toMatch(/^TEC\d{6}$/);
    });

    it("should handle names with special characters", () => {
      const code = generateSupplierCode("Tech-Supplies & Co.");
      expect(code).toMatch(/^TEC\d{6}$/);
    });

    it("should handle short names", () => {
      const code = generateSupplierCode("ABC");
      expect(code).toMatch(/^ABC\d{6}$/);
    });

    it("should handle single character names", () => {
      const code = generateSupplierCode("A");
      expect(code).toMatch(/^A\d{6}$/);
    });

    it("should generate unique codes for same name", () => {
      const code1 = generateSupplierCode("Test Supplier");
      const code2 = generateSupplierCode("Test Supplier");
      expect(code1).not.toBe(code2);
    });
  });

  describe("calculateCreditUtilization", () => {
    it("should calculate credit utilization correctly", () => {
      expect(calculateCreditUtilization(1000, 500)).toBe(50);
      expect(calculateCreditUtilization(1000, 1000)).toBe(100);
      expect(calculateCreditUtilization(1000, 0)).toBe(0);
    });

    it("should cap utilization at 100%", () => {
      expect(calculateCreditUtilization(1000, 1500)).toBe(100);
    });

    it("should handle zero credit limit", () => {
      expect(calculateCreditUtilization(0, 500)).toBe(0);
    });

    it("should handle negative credit limit", () => {
      expect(calculateCreditUtilization(-1000, 500)).toBe(0);
    });

    it("should handle negative balance", () => {
      expect(calculateCreditUtilization(1000, -500)).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("should format currency in Nigerian Naira", () => {
      expect(formatCurrency(1000)).toBe("₦1,000.00");
      expect(formatCurrency(1500000)).toBe("₦1,500,000.00");
      expect(formatCurrency(0)).toBe("₦0.00");
    });

    it("should handle decimal amounts", () => {
      expect(formatCurrency(1000.5)).toBe("₦1,000.50");
      expect(formatCurrency(0.99)).toBe("₦0.99");
    });

    it("should handle large amounts", () => {
      expect(formatCurrency(999999999)).toBe("₦999,999,999.00");
    });
  });

  describe("validateWebsite", () => {
    it("should validate correct website URLs", () => {
      expect(validateWebsite("https://example.com")).toBe(true);
      expect(validateWebsite("http://www.example.com")).toBe(true);
      expect(validateWebsite("https://subdomain.example.co.uk")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(validateWebsite("not-a-url")).toBe(false);
      expect(validateWebsite("example.com")).toBe(false);
      expect(validateWebsite("")).toBe(false);
    });

    it("should handle URLs with query parameters", () => {
      expect(validateWebsite("https://example.com?param=value")).toBe(true);
    });

    it("should handle URLs with paths", () => {
      expect(validateWebsite("https://example.com/path/to/page")).toBe(true);
    });
  });

  describe("sanitizeSupplierData", () => {
    it("should sanitize supplier data correctly", () => {
      const rawData = {
        name: "  Tech   Supplies   Ltd  ",
        address: "  123   Main   Street  ",
        contactPerson: "  John   Doe  ",
        email: "test@example.com",
        phone: "+2348012345678",
      };

      const sanitized = sanitizeSupplierData(rawData);

      expect(sanitized.name).toBe("Tech Supplies Ltd");
      expect(sanitized.address).toBe("123 Main Street");
      expect(sanitized.contactPerson).toBe("John   Doe");
      expect(sanitized.email).toBe("test@example.com");
      expect(sanitized.phone).toBe("+2348012345678");
    });

    it("should handle data with missing fields", () => {
      const rawData = {
        name: "Test Supplier",
        email: "test@example.com",
      };

      const sanitized = sanitizeSupplierData(rawData);

      expect(sanitized.name).toBe("Test Supplier");
      expect(sanitized.email).toBe("test@example.com");
      expect(sanitized.address).toBeUndefined();
    });

    it("should handle empty data object", () => {
      const rawData = {};
      const sanitized = sanitizeSupplierData(rawData);
      expect(sanitized).toEqual({});
    });

    it("should handle null and undefined values", () => {
      const rawData = {
        name: "Test Supplier",
        address: null,
        contactPerson: undefined,
      };

      const sanitized = sanitizeSupplierData(rawData);

      expect(sanitized.name).toBe("Test Supplier");
      expect(sanitized.address).toBeNull();
      expect(sanitized.contactPerson).toBeUndefined();
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete supplier data processing", () => {
      const rawSupplierData = {
        name: "  Tech   Supplies   Ltd  ",
        contactPerson: "  John   Doe  ",
        email: "john@techsupplies.com",
        phone: "+2348012345678",
        address: "  123   Main   Street,   Victoria   Island  ",
        website: "https://techsupplies.com",
        creditLimit: 1000000,
        currentBalance: 250000,
      };

      // Sanitize the data
      const sanitized = sanitizeSupplierData(rawSupplierData);

      // Validate the sanitized data
      expect(validateEmail(sanitized.email)).toBe(true);
      expect(validatePhone(sanitized.phone)).toBe(true);
      expect(validateWebsite(sanitized.website)).toBe(true);

      // Generate supplier code
      const supplierCode = generateSupplierCode(sanitized.name);

      // Calculate credit utilization
      const utilization = calculateCreditUtilization(
        sanitized.creditLimit,
        sanitized.currentBalance
      );

      // Verify results
      expect(sanitized.name).toBe("Tech Supplies Ltd");
      expect(sanitized.address).toBe("123 Main Street, Victoria Island");
      expect(sanitized.contactPerson).toBe("John   Doe");
      expect(supplierCode).toMatch(/^TEC\d{6}$/);
      expect(utilization).toBe(25);
    });

    it("should handle edge cases in data processing", () => {
      const edgeCaseData = {
        name: "A",
        email: "test@test",
        phone: "123",
        address: "",
        website: "invalid-url",
        creditLimit: 0,
        currentBalance: -1000,
      };

      const sanitized = sanitizeSupplierData(edgeCaseData);

      expect(validateEmail(sanitized.email)).toBe(false);
      expect(validatePhone(sanitized.phone)).toBe(false);
      expect(validateWebsite(sanitized.website)).toBe(false);
      expect(
        calculateCreditUtilization(
          sanitized.creditLimit,
          sanitized.currentBalance
        )
      ).toBe(0);
    });
  });
});
