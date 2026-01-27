# Testing Guide

## Overview

This directory contains all tests for the Nuqta application following a layered architecture approach.

## Test Structure

```
__tests__/
├── services/           # Service layer unit tests
│   ├── event.service.test.ts
│   ├── user.service.test.ts
│   ├── booking.service.test.ts
│   ├── review.service.test.ts
│   └── discount.service.test.ts
├── repositories/       # Repository layer tests (to be added)
├── actions/           # Server actions tests (to be added)
├── integration/       # Integration tests
│   └── booking-flow.test.ts
├── mocks/             # Mock data and utilities
│   ├── data.mock.ts
│   └── supabase.mock.ts
└── utils/             # Test utilities (to be added)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- event.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create event"
```

## Writing Tests

### Service Layer Tests

Service tests should mock all repository dependencies and focus on business logic.

**Example:**
```typescript
describe('EventService', () => {
    let eventService: EventService;
    let mockEventRepo: jest.Mocked<EventRepository>;
    
    beforeEach(() => {
        mockEventRepo = {
            findById: jest.fn(),
            create: jest.fn(),
            // ... other methods
        } as any;
        
        eventService = new EventService(mockEventRepo, ...);
    });
    
    it('should create event with valid data', async () => {
        // Arrange
        const eventData = { title: 'Test Event', ... };
        mockEventRepo.create.mockResolvedValue(mockEvent());
        
        // Act
        const result = await eventService.createEvent('vendor-id', eventData);
        
        // Assert
        expect(result).toBeDefined();
        expect(mockEventRepo.create).toHaveBeenCalledWith(...);
    });
});
```

### Repository Layer Tests

Repository tests should mock Supabase client and focus on data access logic.

**Example:**
```typescript
describe('EventRepository', () => {
    let eventRepo: EventRepository;
    let mockSupabaseClient: any;
    
    beforeEach(() => {
        mockSupabaseClient = createMockSupabaseClient();
        eventRepo = new EventRepository(mockSupabaseClient);
    });
    
    it('should find event by slug', async () => {
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
            data: mockEvent(),
            error: null
        });
        
        const result = await eventRepo.findBySlug('test-event');
        
        expect(result).toBeDefined();
    });
});
```

### Integration Tests

Integration tests should test complete workflows using mocked services.

**Example:**
```typescript
describe('Booking Flow Integration', () => {
    it('should complete full booking workflow', async () => {
        // 1. Search events
        // 2. View event details
        // 3. Create booking
        // 4. Confirm booking
        // 5. Send notification
    });
});
```

## Test Patterns

### Arrange-Act-Assert (AAA)

All tests should follow the AAA pattern:

```typescript
it('should do something', async () => {
    // Arrange - Set up test data and mocks
    const mockData = { ... };
    mockRepo.method.mockResolvedValue(mockData);
    
    // Act - Execute the code under test
    const result = await service.method();
    
    // Assert - Verify the results
    expect(result).toBe(expectedValue);
});
```

### Mock Data Factories

Use mock factories from `mocks/data.mock.ts`:

```typescript
import { mockEvent, mockTicket, mockVendor } from '../mocks/data.mock';

const event = mockEvent(); // Creates event with defaults
const customEvent = mockEvent({ title: 'Custom Title' }); // Override properties
```

### Error Testing

Test both success and error cases:

```typescript
it('should throw error when validation fails', async () => {
    await expect(
        service.method(invalidData)
    ).rejects.toThrow(ValidationError);
});
```

### Async Testing

Always use async/await with proper error handling:

```typescript
it('should handle async operation', async () => {
    const result = await service.asyncMethod();
    expect(result).toBeDefined();
});
```

## Coverage Goals

| Layer | Target |
|-------|--------|
| Services | >90% |
| Repositories | >80% |
| Actions | >85% |
| **Overall** | **>85%** |

## Common Issues

### Issue: Test timeout

**Solution:** Increase timeout or check for infinite loops
```typescript
it('should complete', async () => {
    // ...
}, 10000); // 10 second timeout
```

### Issue: Mock not being called

**Solution:** Verify the mock is set up correctly
```typescript
expect(mockRepo.method).toHaveBeenCalled();
expect(mockRepo.method).toHaveBeenCalledWith(expectedArgs);
expect(mockRepo.method).toHaveBeenCalledTimes(1);
```

### Issue: Async state issues

**Solution:** Always await promises and use proper cleanup
```typescript
afterEach(() => {
    jest.clearAllMocks();
});
```

## Best Practices

1. **One assertion per test** (when possible)
2. **Descriptive test names** - Use "should do X when Y"
3. **Test edge cases** - Empty arrays, null values, errors
4. **Keep tests fast** - Use mocks instead of real dependencies
5. **Independent tests** - Each test should run in isolation
6. **Clean up** - Use afterEach to reset mocks
7. **Mock external dependencies** - Never make real API calls
8. **Test business logic** - Focus on what matters

## Debugging Tests

```bash
# Run tests with node debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Use console.log in tests
it('should debug', () => {
    console.log('Debug output:', variable);
    // ...
});

# Use Jest's debug method
it('should debug', () => {
    jest.debug(data);
});
```

## CI/CD Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Pull requests (GitHub Actions)
- Before deployment

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated:** 2026-01-27
**Maintainer:** Development Team
