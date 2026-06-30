# Testing Patterns

**Analysis Date:** 2026-06-29

## Test Framework

**Runner:** Jest 29.7.0
- Config: `apps/api/jest.config.js`
- No website (Next.js) tests configured

**Assertion Library:** Jest built-in matchers
- No separate assertion library (Chai, etc.)

**Test Utilities:**
- `@nestjs/testing` — `Test.createTestingModule()`, `TestingModule`
- `supertest` 7.2.2 — HTTP assertion for e2e tests

**Run Commands:**
```bash
npm run test              # Run unit/spec tests (Jest)
npm run test:audit       # Run audit-specific tests
npm run test:e2e         # Run e2e tests (*.e2e-spec.ts)
npm run test:coverage    # Coverage report (when flag removed from config)
```

## Test File Organization

**Location Pattern:**
- **Unit tests:** Co-located with source code
  - `src/[feature]/[feature].service.spec.ts` (in same directory as `.service.ts`)
  - Example: `src/audit/audit.service.spec.ts` alongside `src/audit/audit.service.ts`
- **E2E tests:** Separate directory
  - `test/[feature].e2e-spec.ts` (at root of apps/api)
  - Example: `test/audit.e2e-spec.ts`

**Naming Pattern:**
- Unit tests: `*.spec.ts`
- E2E tests: `*.e2e-spec.ts`
- Jest regex: `testRegex: '.*\\.(spec|e2e-spec)\\.ts$'`

**Directory Structure:**
```
apps/api/
├── src/
│   ├── audit/
│   │   ├── audit.service.ts
│   │   ├── audit.service.spec.ts    # Unit test
│   │   ├── audit.controller.ts
│   │   └── audit.module.ts
│   └── [other-features]/
└── test/
    └── audit.e2e-spec.ts            # E2E test
```

## Test Structure

**Suite Organization:**
```typescript
describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('log()', () => {
    const baseParams: AuditLogParams = {
      userId: 1,
      action: AuditAction.CREATE,
      entity: AuditEntity.EVENT,
      entityId: 42,
    };

    it('llama a prisma.auditLog.create con userId/action/entity/entityId correctos', () => {
      mockPrismaService.auditLog.create.mockResolvedValue({});

      service.log(baseParams);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          action: AuditAction.CREATE,
          entity: AuditEntity.EVENT,
          entityId: 42,
        }),
      });
    });

    it('NO lanza cuando prisma.auditLog.create rechaza', () => {
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('DB error'));
      expect(() => service.log(baseParams)).not.toThrow();
    });
  });
});
```

**Patterns:**
- `beforeEach()`: Clear mocks and create fresh test module
- `afterAll()`: Close app instance in e2e tests
- `describe()` blocks nest by feature/method
- `it()` blocks test one specific behavior (not multiple)
- Test descriptions use Spanish or English depending on what's being tested (patterns use Spanish for user-visible behavior, English for code behavior)

## Mocking

**Framework:** Jest's built-in mocking (`jest.fn()`, `mockResolvedValue()`, `mockRejectedValue()`)

**Patterns:**

1. **Service Mocking (from `audit.service.spec.ts`):**
```typescript
const mockPrismaService = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Inject via Test.createTestingModule
const module: TestingModule = await Test.createTestingModule({
  providers: [
    AuditService,
    { provide: PrismaService, useValue: mockPrismaService },
  ],
}).compile();
```

2. **Mock Setup in Test:**
```typescript
mockPrismaService.auditLog.create.mockResolvedValue({});
mockPrismaService.auditLog.findMany.mockResolvedValue([]);
mockPrismaService.$transaction.mockResolvedValue([[], 0]);
```

3. **Assert Mock Was Called:**
```typescript
expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
  data: expect.objectContaining({
    userId: 1,
    action: AuditAction.CREATE,
  }),
});
```

**What to Mock:**
- External dependencies: `PrismaService`, `MailService`, `ConfigService`
- Database calls via Prisma
- HTTP clients (if present)
- File I/O

**What NOT to Mock:**
- NestJS core classes (`JwtService`, `Reflector`, `Logger`)
- Business logic — test the actual service methods
- Validation pipes (test them separately)

## Fixtures and Factories

**Test Data:**
- Created inline in test files (no separate fixtures directory)
- Example (from `audit.service.spec.ts`):
```typescript
const baseParams: AuditLogParams = {
  userId: 1,
  action: AuditAction.CREATE,
  entity: AuditEntity.EVENT,
  entityId: 42,
};

// Reused in multiple tests
it('test 1', () => {
  service.log(baseParams);
  // ...
});

it('test 2', () => {
  service.log({ ...baseParams, action: AuditAction.UPDATE });
  // ...
});
```

**Request Mocks:**
```typescript
const mockReq = {
  ip: '192.168.1.1',
  get: jest.fn((header: string) => {
    if (header === 'user-agent') return 'Mozilla/5.0';
    return undefined;
  }),
  originalUrl: '/api/events/1',
} as unknown as import('express').Request;
```

**Location:** Inline in test file, no shared fixtures directory

## Coverage

**Requirements:** Not enforced
- `collectCoverageFrom: ['src/**/*.(t|j)s']` configured in `jest.config.js`
- Coverage directory: `./coverage`
- No minimum coverage threshold set

**View Coverage:**
```bash
npm run test -- --coverage  # (Note: currently --no-coverage in npm scripts)
```

## Test Types

### Unit Tests

**Scope:**
- Single service or utility function
- All dependencies mocked
- File: `src/[feature]/[feature].service.spec.ts`

**Approach:**
- Test each method independently
- Mock external services (Prisma, Mail, Config)
- Assert return values, thrown exceptions, and mock call arguments

**Example (from `audit.service.spec.ts`):**
```typescript
describe('log()', () => {
  it('llama a prisma.auditLog.create con userId/action/entity/entityId correctos', () => {
    mockPrismaService.auditLog.create.mockResolvedValue({});
    service.log(baseParams);
    expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 1, action: AuditAction.CREATE }),
    });
  });
});
```

### E2E Tests

**Scope:**
- Full NestJS application (app module initialized)
- Real database connection required (or skip test)
- HTTP layer tested via `supertest`
- File: `test/[feature].e2e-spec.ts`

**Approach:**
- Create real NestJS app instance
- Make HTTP requests via `request(app.getHttpServer())`
- Verify status codes, response bodies, authorization

**Example (from `test/audit.e2e-spec.ts`):**
```typescript
describe.skip('AuditController (e2e) — requiere DB en VPS', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/admin/audit-logs', () => {
    it('responde 401 sin token', () => {
      return request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set(apiKeyHeaders)
        .expect(401);
    });

    it('responde 200 con token de rol ADMIN', async () => {
      const token = makeToken(1, 'ADMIN');
      const res = await request(app.getHttpServer())
        .get('/api/admin/audit-logs')
        .set({ ...apiKeyHeaders, Authorization: `Bearer ${token}` })
        .expect(200);

      expect(res.body).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });
  });
});
```

**Skipping E2E Tests:**
- Tests marked with `describe.skip()` when database not available locally
- Intended to run in CI/CD or staging with real DB connection
- Instructions in file comments explain when/how to run manually

### No Integration Tests

- Not a separate category in this codebase
- Unit tests use mocked Prisma; e2e tests use real database
- No integration tests between services in the middle ground

## Common Patterns

### Async Testing

**Pattern:**
```typescript
it('async operation', async () => {
  mockPrismaService.auditLog.findMany.mockResolvedValue([]);
  const result = await service.findAll({});
  expect(result).toEqual({ /* ... */ });
});

// Or using promises
it('async operation with return', () => {
  mockPrismaService.auditLog.findMany.mockResolvedValue([]);
  return service.findAll({});
});
```

**For E2E:**
```typescript
it('responde 200 con token de rol ADMIN', async () => {
  const token = makeToken(1, 'ADMIN');
  const res = await request(app.getHttpServer())
    .get('/api/admin/audit-logs')
    .set({ Authorization: `Bearer ${token}` })
    .expect(200);
  expect(res.body).toMatchObject({ items: expect.any(Array) });
});
```

### Error Testing

**Pattern:**
```typescript
it('NO lanza cuando prisma.auditLog.create rechaza', () => {
  mockPrismaService.auditLog.create.mockRejectedValue(new Error('DB error'));
  expect(() => service.log(baseParams)).not.toThrow();
});

// Or for async
it('lanza NotFoundException cuando no existe', async () => {
  mockPrismaService.faq.findUnique.mockResolvedValue(null);
  await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
});
```

**For HTTP Errors (E2E):**
```typescript
it('responde 401 sin token', () => {
  return request(app.getHttpServer())
    .get('/api/admin/audit-logs')
    .expect(401);
});

it('responde 403 con rol insuficiente', () => {
  const token = makeToken(99, 'AUTHENTICATED');
  return request(app.getHttpServer())
    .get('/api/admin/audit-logs')
    .set({ Authorization: `Bearer ${token}` })
    .expect(403);
});
```

### Mock Reset

**Pattern (from `beforeEach`):**
```typescript
beforeEach(async () => {
  jest.clearAllMocks();  // Clear call history and return values
  // Then create fresh module
});
```

## Configuration

**File:** `apps/api/jest.config.js`
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {},
};
```

**Key Settings:**
- `testRegex`: Matches both `*.spec.ts` and `*.e2e-spec.ts`
- `testEnvironment: 'node'`: No DOM, tests run in Node.js
- `transform`: Uses `ts-jest` to compile TypeScript on-the-fly
- `collectCoverageFrom`: Includes all source TypeScript/JavaScript files
- No module name mapping (no path aliases used in tests)

## Test Examples

### Example: Unit Test (`src/audit/audit.service.spec.ts`)

**Key Characteristics:**
- Mock entire Prisma service
- Test fire-and-forget behavior (`.log()` returns `void`)
- Test error handling without throwing
- Test parameter construction for database calls
- Use `expect.objectContaining()` to verify partial objects

**Notable Patterns:**
```typescript
// Fire-and-forget: no await, no return Promise
service.log(baseParams);  // Just call it

// Assert mock was called with correct structure
expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
  data: expect.objectContaining({
    userId: 1,
    action: AuditAction.CREATE,
    entity: AuditEntity.EVENT,
    entityId: 42,
  }),
});
```

### Example: E2E Test (`test/audit.e2e-spec.ts`)

**Key Characteristics:**
- Full app initialization (no mocks, except config)
- Real NestJS module compilation
- HTTP requests via `supertest`
- JWT token generation for auth
- Tests skip by default (`describe.skip`) due to DB requirement

**Notable Patterns:**
```typescript
// Generate valid JWT token
function makeToken(userId: number, role: string): string {
  return jwtService.sign({ sub: userId, email: `user${userId}@test.com`, role });
}

// Make HTTP request, assert status and response shape
const res = await request(app.getHttpServer())
  .get('/api/admin/audit-logs')
  .set({ Authorization: `Bearer ${token}` })
  .expect(200);

expect(res.body).toMatchObject({
  items: expect.any(Array),
  total: expect.any(Number),
});
```

## Coverage State

**Current Coverage:** Unknown (not tracked, no minimum enforced)

**Gaps Identified:**
- Website (Next.js) has no test configuration
- E2E tests marked `describe.skip()` — not running in CI/CD without DB
- Only one test file found: `src/audit/audit.service.spec.ts`
- Most services have no unit tests

**Recommendations:**
- Add unit tests for critical services (Auth, Users, Events, Payments)
- Set up e2e test running in CI/CD with database container
- Add integration tests for auth flows (JWT validation, 2FA, role checks)

---

*Testing analysis: 2026-06-29*
