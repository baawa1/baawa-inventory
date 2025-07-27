/**
 * Date utility functions for safe timestamp handling
 */

/**
 * Safely converts a timestamp to a Date object
 * @param timestamp - The timestamp to convert (can be Date, string, or any other value)
 * @param fallbackDate - Optional fallback date if conversion fails (defaults to current date)
 * @returns A valid Date object
 */
export function safeParseTimestamp(
  timestamp: any,
  fallbackDate: Date = new Date()
): Date {
  // If it's already a valid Date object
  if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
    return timestamp;
  }

  // If it's a string, try to parse it
  if (typeof timestamp === 'string') {
    const parsedDate = new Date(timestamp);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // If it's a number (timestamp), try to parse it
  if (typeof timestamp === 'number') {
    const parsedDate = new Date(timestamp);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // Return fallback date if all parsing attempts fail
  return fallbackDate;
}

/**
 * Validates if a value is a valid Date object
 * @param date - The value to validate
 * @returns True if the value is a valid Date object
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safely converts a timestamp to ISO string
 * @param timestamp - The timestamp to convert
 * @param fallbackDate - Optional fallback date if conversion fails
 * @returns ISO string representation of the date
 */
export function safeToISOString(
  timestamp: any,
  fallbackDate: Date = new Date()
): string {
  const validDate = safeParseTimestamp(timestamp, fallbackDate);
  return validDate.toISOString();
}
