# Coding Conventions

**Analysis Date:** 2026-06-29

## Language Standards

**Code Language:** English only
- All identifiers, function names, variable names, code comments
- Exception: Comments explaining Spanish UX text are bilingual

**UI/UX Language:** Spanish only
- User-facing messages, labels, error messages, validation messages
- Examples: `'Email inválido'`, `'Pregunta no encontrada'`, `'Bienvenido de vuelta'`

**Documentation & Commits:** English
- Code comments, commit messages, PR descriptions

## Naming Patterns

**Files:**
- Controllers: `[feature].controller.ts` (e.g., `faq.controller.ts`, `auth.controller.ts`)
- Services: `[feature].service.ts` (e.g., `faq.service.ts`, `users.service.ts`)
- Modules: `[feature].module.ts` (e.g., `faq.module.ts`, `auth.module.ts`)
- DTOs: `[action]-[entity].dto.ts` (e.g., `create-faq.dto.ts`, `update-user.dto.ts`, `register.dto.ts`)
- Guards: `[name].guard.ts` (e.g., `jwt-auth.guard.ts`, `roles.guard.ts`, `two-fa.guard.ts`)
- Decorators: `[name].decorator.ts` (e.g., `current-user.decorator.ts`, `roles.decorator.ts`)
- Filters: `[name].filter.ts` (e.g., `http-exception.filter.ts`)
- Tests: `[feature].spec.ts` for unit, `[feature].e2e-spec.ts` for e2e (co-located with implementation)

**Functions:**
- camelCase: `findAll()`, `findOne()`, `create()`, `update()`, `remove()`, `findByHandle()`
- Private functions: same camelCase, prefixed with `private`
- Async functions: return Promise explicitly where needed
- Methods that don't throw: prefix with `ensure` if validation (e.g., `ensure()`)
- Methods that fire-and-forget: `void` return type (see **Fire-and-Forget Pattern** below)

**Variables:**
- camelCase for all: `email`, `userId`, `firstName`, `isVerified`, `startTime`, `endTime`
- Constants: UPPER_SNAKE_CASE (e.g., `USER_SELECT`, `PUBLIC_PATHS`)
- Boolean prefixes: `is`, `has`, `should`, `can` (e.g., `isVerified`, `hasRole`, `shouldValidate`)

**Types & Interfaces:**
- PascalCase: `CreateFaqDto`, `JwtUser`, `EventPriceDto`, `OrgContextDto`
- Enum members: UPPER_SNAKE_CASE (from Prisma schema, e.g., `AuditAction.CREATE`, `UserType.ORGANIZATION`)
- Type aliases: PascalCase (e.g., `TwoFaUser`, `OnboardingUser`)

**Classes & Decorators:**
- PascalCase: `FaqController`, `FaqService`, `JwtAuthGuard`, `RolesGuard`, `HttpExceptionFilter`
- Decorators: PascalCase (e.g., `@CurrentUser`, `@Roles`, `@OrgContext`)

**Relation Fields:**
- Prisma schema uses `owner` for relationships; responses expose as `user` via DTOs/selects
- Example: `owner: { select: { id, firstname, lastname, email, handle } }` → returned as nested object, not renamed

## Code Style

**Formatting:**
- No explicit ESLint/Prettier config files found; codebase follows consistent style:
  - 2-space indentation
  - Semicolons at end of statements
  - Double quotes for strings (most common pattern in examples)
  - Single quotes for TypeScript type annotations and JSDoc examples
- Import organization: automatic, no specific alphabetization rule enforced
- Line length: no strict limit, but most lines stay under 100 characters

**Linting:**
- No `.eslintrc` or `.prettierrc` configured at project root or in apps/api
- Style is maintained through code review practices, not automated tools

## Import Organization

**Order (observed pattern):**
1. Node.js built-ins (`import { join } from 'path'`)
2. Third-party libraries (`import { ValidationPipe } from '@nestjs/common'`)
3. Type imports (`import type { Request } from 'express'`)
4. Local utilities and services (`import { PrismaService } from '../../utils/prisma/prisma.service'`)
5. DTOs and local modules (`import { CreateFaqDto } from './dto/create-faq.dto'`)

**Path Aliases:**
- Next.js website: `@/*` maps to project root (e.g., `@/components/AuthShell`, `@/lib/api`)
- NestJS API: no configured path aliases; uses relative imports

## Error Handling

**NestJS Exceptions:**
- Import from `@nestjs/common`: `BadRequestException`, `ConflictException`, `ForbiddenException`, `NotFoundException`, `UnauthorizedException`
- Example usage (from `FaqService`):
  ```typescript
  if (!faq) throw new NotFoundException('Pregunta no encontrada');
  ```

**Global Exception Filter:**
- File: `utils/http-exception.filter.ts`
- Catches all exceptions and returns: `{ message: string, statusCode: number }`
- Only logs non-HTTP exceptions to preserve stack traces
- Applied globally in `main.ts` via `app.useGlobalFilters(new HttpExceptionFilter())`

**Validation & Transformation:**
- Applied globally in `main.ts`: `new ValidationPipe({ whitelist: true, transform: true })`
- DTOs use `class-validator` decorators for validation
- Rejects unknown properties; transforms query params to correct types

**Fire-and-Forget Pattern:**
- Used in `AuditService.log()` and `NotificationsService.create()` — both return `void`
- Fire the Prisma operation in background with `.catch()` for error logging, never throw
- Example (from `NotificationsService`):
  ```typescript
  create(params: CreateNotificationParams): void {
    if ((!params.userId && !params.orgId) || (params.userId && params.orgId)) {
      this.logger.warn(`Notification skipped: exactly one of userId/orgId required`);
      return;
    }
    this.prisma.notification.create({ data: { /* ... */ } })
      .catch((err: unknown) => this.logger.error('Notification insert failed', /* ... */));
  }
  ```

## Logging

**Framework:** NestJS built-in Logger (from `@nestjs/common`)

**Patterns:**
- Declare logger in service: `private readonly logger = new Logger(ServiceName.name);`
- Log levels used:
  - `this.logger.log()` — informational (operation succeeded)
  - `this.logger.warn()` — warnings (expected but unusual condition)
  - `this.logger.error()` — errors (operation failed, but handled gracefully)
  - `this.logger.debug()` — development only (debug info, e.g., 2FA codes in dev mode)
- Example (from `AuthService`):
  ```typescript
  private readonly logger = new Logger(AuthService.name);
  // ...
  if (process.env.NODE_ENV === 'development' && !this.config.get('MAILGUN_API_KEY')) {
    this.logger.debug(`2FA code (dev only) for ${user.email}: ${code}`);
  }
  ```

## Comments

**JSDoc/TSDoc:**
- Used for public methods and exported types
- Single-line JSDoc for simple explanations: `/** Firma un JWT con id, email y rol del usuario. */`
- Multi-line JSDoc for complex logic or implementation notes
- Example (from `AuthService`):
  ```typescript
  /**
   * Genera un código de 6 dígitos, lo guarda hasheado (SHA-256, 10 min)
   * y lo envía por email.
   */
  private async issueTwoFaCode(user: User): Promise<void>
  ```

**Inline Comments:**
- Used sparingly, only when logic is non-obvious
- Spanish comments acceptable when explaining user-facing strings
- Example (from `main.ts`):
  ```typescript
  // Detrás de Nginx: confiar en 1 hop para que req.ip refleje la IP real del cliente
  // (vía X-Forwarded-For) en lugar de la IP interna del proxy. Lo usa el AuditService.
  app.set('trust proxy', 1);
  ```

**When NOT to Comment:**
- Self-documenting code (clear function name, obvious logic)
- Type declarations (types document intent)

## Function Design

**Size:** Functions kept small and focused (5-25 lines typical)

**Parameters:**
- Use objects for multiple related parameters (e.g., `CreateFaqDto`, `AuditLogParams`)
- DTOs passed as `@Body()` parameters in controllers
- Optional fields marked with `?` in TypeScript

**Return Values:**
- Services return Prisma models directly or shaped objects
- Controllers return JSON responses (NestJS handles serialization)
- Async operations return `Promise<T>`
- Void functions used for fire-and-forget patterns only

**Dependency Injection:**
- NestJS constructor injection with `private readonly` (immutable)
- Example (from `FaqService`):
  ```typescript
  constructor(private readonly prisma: PrismaService) {}
  ```

## Module Design

**Exports:**
- Each feature has a `[feature].module.ts` with controller and service
- Services exported via `exports: [ServiceName]` when used by other modules
- Example (from `NotificationsModule`):
  ```typescript
  @Module({
    imports: [AuthModule],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService], // 11-02 lo importa desde events/spots/heroes/orgs/transfers
  })
  export class NotificationsModule {}
  ```

**Barrel Files:**
- Not used; imports are explicit from `[feature]/[feature].service.ts`

## DTO Conventions

**Decorators:** Layered validation
1. `@ApiProperty()` or `@ApiPropertyOptional()` — Swagger documentation
2. `class-validator` decorators — Runtime validation
3. Custom messages in Spanish for user-facing errors

**Example (from `RegisterDto`):**
```typescript
@ApiProperty({ example: 'usuario@ejemplo.com' })
@IsEmail({}, { message: 'Email inválido' })
email: string;

@ApiPropertyOptional({ example: 1, description: 'ID del país del usuario' })
@IsOptional()
@IsInt()
@Min(1)
countryId?: number;
```

**Nested DTOs:**
- Use `@Type()` and `@ValidateNested()` for nested objects/arrays
- Example (from `CreateEventDto`):
  ```typescript
  @ValidateNested({ each: true })
  @Type(() => EventPriceDto)
  prices: EventPriceDto[];
  ```

## Auth & Authorization

**JWT Payload (`JwtUser`):**
- Located in `src/auth/current-user.decorator.ts`
- Contains: `{ sub: number; email: string; role: string; orgRole?: string; actingAs?: number }`
- Injected via `@CurrentUser()` decorator in handlers

**Guards:**
- `JwtAuthGuard`: Verifies Bearer token, checks user not blocked
- `RolesGuard`: Checks `@Roles('ADMIN', 'SUPER_ADMIN')` decorator
- `OptionalJwtAuthGuard`: Token optional, allows anonymous
- `TwoFaGuard`: Only accepts tokens with `twoFaPending: true`
- `OnboardingGuard`: Only accepts tokens with `onboardingPending: true`
- `ApiKeyGuard`: Global guard; allows public paths, requires `X-Api-Key` header otherwise

**Guard Usage Pattern:**
```typescript
@Post('create')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
create(@Body() dto: CreateFaqDto) { /* ... */ }
```

## Service Ownership Checks

**Pattern:** Services validate resource ownership before mutations
- Example (implicit in patterns): Service methods receive `userId` or `orgContext` from controller
- Controller injects `@CurrentUser()` and passes to service
- Service checks: `if (event.userId !== user.sub) throw new ForbiddenException()`
- Not shown in every service, but pattern is consistent where checked

## TypeScript Settings

**File: `apps/api/tsconfig.json`**
- `strictNullChecks: true` — Non-null assertions required
- `forceConsistentCasingInFileNames: true`
- `noImplicitAny: false` — Allows implicit `any` (used sparingly)
- `target: ES2023` — Modern ECMAScript target
- No explicit path aliases configured (uses relative imports)

## Swagger/API Documentation

**Decorators:**
- `@ApiTags()` — Group endpoints by feature
- `@ApiOperation()` — Short summary of endpoint purpose
- `@ApiProperty()` / `@ApiPropertyOptional()` — DTO field documentation
- `@ApiBearerAuth()` — Marks endpoint as JWT-protected
- `@ApiResponse()` — Custom response descriptions

**Generated Docs:**
- Available at `/docs` in development (not production)
- Built from NestJS Swagger module configuration

---

*Convention analysis: 2026-06-29*
