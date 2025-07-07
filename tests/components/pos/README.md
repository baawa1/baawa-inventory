# POS System Test Suite

This directory contains comprehensive tests for the Point of Sale (POS) system with offline capabilities.

## Test Structure

### Unit Tests (`/tests/components/pos/`)

- **POSInterface.test.tsx** - Main POS interface component tests
- **ProductGrid.test.tsx** - Product display and selection tests
- **TransactionHistory.test.tsx** - Transaction history and management tests
- **PWAManager.test.tsx** - Progressive Web App functionality tests

### Integration Tests (`/tests/integration/pos/`)

- **pos-integration.test.tsx** - End-to-end POS workflow tests
- API endpoint integration tests
- Offline synchronization tests

### Utility Tests (`/tests/lib/offline/`)

- **offline-storage.test.ts** - IndexedDB storage operations tests
- **offline-mode.test.ts** - Network detection and sync management tests

## Test Coverage

### Core POS Features ✅

- Product grid display and selection
- Shopping cart management
- Payment processing (online and offline)
- Barcode scanning simulation
- Receipt generation
- Customer information handling

### Offline Capabilities ✅

- Transaction queuing when offline
- Automatic sync when connection restored
- Product caching for offline use
- Network status detection
- Failed transaction retry logic

### PWA Features ✅

- Service worker registration
- Install prompt handling
- Offline page functionality
- Background sync capabilities
- Cache management

### API Integration ✅

- Product search and barcode lookup
- Sale creation and processing
- Transaction history retrieval
- Email receipt sending
- Error handling and validation

## Running Tests

```bash
# Run all POS tests
npm test -- --testPathPattern="pos"

# Run specific test suites
npm test tests/components/pos/POSInterface.test.tsx
npm test tests/integration/pos/pos-integration.test.tsx
npm test tests/lib/offline/

# Run tests with coverage
npm test -- --coverage --testPathPattern="pos"

# Run tests in watch mode during development
npm test -- --watch --testPathPattern="pos"
```

## Test Scenarios Covered

### Online Scenarios

- Normal product selection and sale completion
- Barcode scanning and product lookup
- Payment processing with various methods
- Receipt generation and email sending
- Transaction history viewing and filtering

### Offline Scenarios

- Product selection from cached data
- Transaction queuing with proper IDs
- Network status change handling
- Automatic sync when reconnected
- Failed sync retry mechanisms

### Edge Cases

- Empty product catalog
- Out of stock products
- Invalid barcode scans
- Payment failures
- Network interruptions
- Database errors

### PWA Scenarios

- App installation prompt
- Service worker updates
- Background synchronization
- Offline page display
- Cache invalidation

## Mock Strategy

### External Dependencies

- IndexedDB operations mocked with promise-based responses
- Network status mocked via navigator.onLine
- Service worker registration mocked
- API calls mocked with fetch mock

### Component Dependencies

- Child components mocked for unit tests
- Query hooks mocked for data simulation
- Toast notifications mocked
- React hooks mocked where needed

## Test Data

### Products

- Standard products with stock
- Out of stock products
- Products with/without barcodes
- Products with various categories

### Transactions

- Online completed transactions
- Offline pending transactions
- Failed transactions with errors
- Transactions with discounts and customer info

## Performance Considerations

- Tests use fake timers for time-based operations
- Async operations properly awaited
- Cleanup between tests ensures isolation
- Mock implementations optimized for speed

## Maintenance

- Update mocks when interfaces change
- Add tests for new POS features
- Maintain realistic test data
- Review coverage reports regularly
- Update scenarios based on user feedback
