# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GrantManagement** — Hungarian grant/application lifecycle management system. The domain language (entity names, error messages, comments) is Hungarian. The system tracks grant applications through a 9-step workflow from initial call through settlement.

Stack: .NET 8 backend · Angular 20 frontend (not yet scaffolded) · PostgreSQL

## Commands

### Backend

```powershell
# Build entire solution
dotnet build backend/GrantManagement.sln

# Run API (from backend/src/GrantManagement.API)
dotnet run --project backend/src/GrantManagement.API

# Run all tests
dotnet test backend/GrantManagement.sln

# Run a single test project
dotnet test backend/tests/GrantManagement.Application.Tests
dotnet test backend/tests/GrantManagement.Domain.Tests

# Run a single test by name
dotnet test backend/tests/GrantManagement.Application.Tests --filter "FullyQualifiedName~TestName"

# EF Core migrations (run from backend/src/GrantManagement.Infrastructure)
dotnet ef migrations add <MigrationName> --startup-project ../GrantManagement.API
dotnet ef database update --startup-project ../GrantManagement.API
```

### Configuration

Required `appsettings.Development.json` entries in `GrantManagement.API`:
- `ConnectionStrings:DefaultConnection` — PostgreSQL connection string
- `Jwt:SecretKey`, `Jwt:Issuer`
- `Smtp:*` — SMTP settings for MailKit
- `FileStorage:BasePath` — local upload directory (default: `data/uploads`)
- `AllowedOrigins` — array of CORS origins (default: `["http://localhost:4200"]`)

## Architecture

### Clean Architecture layers (dependency order)

```
Domain → Application → Infrastructure
                    → API
```

| Project | Role |
|---|---|
| `GrantManagement.Domain` | Entities, ValueObjects, Enums, Domain events, Domain exceptions, Interfaces (IFileStorageService, IEmailService) |
| `GrantManagement.Application` | MediatR commands/queries, DTOs, FluentValidation validators, AutoMapper profiles, Pipeline behaviours, `IApplicationDbContext` |
| `GrantManagement.Infrastructure` | EF Core `AppDbContext`, Fluent entity configurations, SMTP email, local file storage, Hangfire background jobs, `CurrentUserService` |
| `GrantManagement.API` | Controllers, `ApiControllerBase`, `ExceptionMiddleware`, SignalR `NotificationHub`, `Program.cs` |

### Key patterns

**No repository pattern.** Application layer injects `IApplicationDbContext` directly and queries via EF Core (LINQ / `AsNoTracking()`).

**MediatR pipeline** (registered in order):
1. `LoggingBehaviour` — logs every request/response
2. `ValidationBehaviour` — runs all `IValidator<TRequest>` and throws `ValidationException` on failure
3. `AuthorizationBehaviour` — checks `IApplicationCommand` requests against locked-application rule

**Commands and queries** follow the vertical-slice folder structure:
```
Application/
  Applications/
    Commands/CreateApplication/
      CreateApplicationCommand.cs          ← IRequest<Dto>
      CreateApplicationCommandHandler.cs   ← IRequestHandler
      CreateApplicationCommandValidator.cs ← AbstractValidator
    Queries/GetApplicationList/
      GetApplicationListQuery.cs
      GetApplicationListQueryHandler.cs
```

**Controllers** inherit `ApiControllerBase` (route prefix `api/v1/[controller]`, requires `[Authorize]`). They only call `Sender.Send()` — no business logic.

**Domain aggregate: `Application`**
- Extends `AggregateRoot<Guid>` which holds domain events (`_domainEvents`)
- Created via `Application.Create(...)` static factory — constructor is private
- Raises domain events: `ApplicationCreated`, `ApplicationSubmitted`, `ApplicationWon`, `ApplicationLost`, `SettlementApproved`, etc.
- `IsLocked` (`ClosedWon | ClosedLost | Archived`) enforced in every mutating method via `EnsureNotLocked()`
- Initialises 9 ordered `WorkflowStep` entities on creation

**Global query filters** in `AppDbContext`:
- `Application` — `!IsArchived`
- `Document` — `!IsArchived`
- `Comment` — `!IsDeleted`

**`SaveChangesAsync` override** automatically sets `CreatedAt`/`UpdatedAt` on all `BaseEntity<Guid>` instances.

### Exception → HTTP mapping (`ExceptionMiddleware`)

| Exception | HTTP status |
|---|---|
| `ValidationException` (FluentValidation) | 422 Unprocessable Entity |
| `NotFoundException` | 404 Not Found |
| `ForbiddenException` | 403 Forbidden |
| `DomainException` | 400 Bad Request |
| Unhandled | 500 Internal Server Error |

All responses use RFC 7807 `ProblemDetails` / `ValidationProblemDetails`.

### Authorization policies (JWT Bearer)

| Policy | Roles |
|---|---|
| `CanCreateApplication` | Admin, PalyazatiMunkatars |
| `CanApproveApplication` | Admin, Elnok |
| `CanManageInvoices` | Admin, Penzugyes |
| `CanManageUsers` | Admin |
| `CanViewAuditLog` | Admin |

SignalR `/hubs/notifications` accepts JWT via `access_token` query param.

### Infrastructure services

- **Email**: MailKit `SmtpEmailService` implementing `IEmailService`
- **File storage**: `LocalFileStorageService` (filesystem, path from config) implementing `IFileStorageService`
- **Background jobs**: Hangfire with PostgreSQL storage; `DeadlineCheckJob` is the recurring job
- **Swagger**: available at `/swagger` in Development; JWT Bearer security scheme configured

## Project constraints

- Repository pattern is **forbidden** — query directly via `IApplicationDbContext`
- All endpoints must have `[ProducesResponseType]` attributes (OpenAPI)
- Unit test coverage minimum **80%**
- Test projects use **xUnit + Moq + FluentAssertions**
