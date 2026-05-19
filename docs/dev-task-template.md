# Development Task Ticket Templates – Grant Management System

## BE Task Template (`{us-id}-BE-{n}.md`)

```markdown
# {US-ID}-BE-{N} | BE: {Short Title}

**Story:** {US-ID} | [{Module}] {Story Title}
**Layer:** Backend
**Priority:** {High / Medium / Low}
**Size estimate:** {XS / S / M / L}
**Sprint:** Sprint {N}
**Depends on:** {task file names or "—"}
**Blocks:** {task file names or "—"}

---

## Story

> As a **{role}**, I want to {activity}, so that {business value}.

---

## Scope of This Task

{1-2 sentences: what this BE task covers and what it explicitly excludes.}

---

## Implementation Checklist

### Domain Layer (`GrantManagement.Domain`)
- [ ] Entity / Value Object in `Domain/Entities/{Name}.cs`
- [ ] Enum in `Domain/Enums/{Name}.cs` (if new)
- [ ] Interface in `Domain/Interfaces/Services/I{Name}.cs` (if new service contract)
- [ ] Exception in `Domain/Exceptions/{Name}.cs` (if new)

### Application Layer (`GrantManagement.Application`)
- [ ] Command: `Application/{Context}/Commands/{Name}/{Name}.cs`
- [ ] Command Handler: `Application/{Context}/Commands/{Name}/{Name}Handler.cs`
- [ ] Validator: `Application/{Context}/Commands/{Name}/{Name}Validator.cs`
- [ ] Query: `Application/{Context}/Queries/{Name}/{Name}.cs` (if read)
- [ ] Query Handler: `Application/{Context}/Queries/{Name}/{Name}Handler.cs`
- [ ] DTO: `Application/{Context}/DTOs/{Name}Dto.cs`
- [ ] MappingProfile entry in `Application/Common/Mappings/MappingProfile.cs`

### Infrastructure Layer (`GrantManagement.Infrastructure`)
- [ ] EF Core config: `Infrastructure/Persistence/Configurations/{Name}Configuration.cs` (if new entity)
- [ ] DbSet in `AppDbContext.cs` (if new entity)
- [ ] Migration: `dotnet ef migrations add {Name}`
- [ ] Infrastructure service impl (if needed)

### API Layer (`GrantManagement.API`)
- [ ] Controller action in `API/Controllers/{Resource}Controller.cs`
  - HTTP method + route: `{METHOD} /api/v1/{route}`
  - `[Authorize]` + `[RequireRole(...)]`
  - `await _mediator.Send(command)`
  - Correct HTTP status code
- [ ] OpenAPI: `[ProducesResponseType]` for all response codes
- [ ] XML doc comment for Swagger

### Authorization
- [ ] `[RequireRole({roles})]` on action
- [ ] Locked-application guard verified in `AuthorizationBehaviour` (if applicable)
- [ ] Policy in `Program.cs` (if new policy)

---

## API Contract

### Endpoint
```
{HTTP METHOD} /api/v1/{route}
```

### Authorization
- Required roles: `{roles}`
- Guard: {e.g. "Application must not be LOCKED" / "None"}

### Request Body (`application/json`)
```json
{
  "field": "value"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `field` | `string` | Yes | Not empty, max 500 |

### Responses
- **200/201:** `{ "id": "uuid", ... }`
- **400:** FluentValidation RFC 7807
- **401:** Missing/invalid JWT
- **403:** Insufficient role or locked application
- **404:** Resource not found
- **422:** Domain rule violation (if applicable)

---

## FluentValidation Rules

| Field | Rule | Error message |
|---|---|---|
| `Field` | `NotEmpty()` | "Field is required." |

---

## MediatR Pipeline Notes

- `ValidationBehaviour`: runs automatically
- `AuthorizationBehaviour`: RBAC + locked-application guard
- `AuditBehaviour`: applies to all `ICommand` implementations; fields logged: {list}

---

## Required Tests

### Unit Tests
- [ ] `{Name}ValidatorTests` — each validation rule (happy + error cases)
- [ ] `{Name}HandlerTests` — returns expected result on valid input
- [ ] `{Name}HandlerTests` — throws `NotFoundException` when entity missing
- [ ] `{Name}HandlerTests` — throws `ForbiddenException` on locked application (if applicable)

### Integration Tests (TestContainers + PostgreSQL)
- [ ] `{Resource}EndpointTests` — `{METHOD} {route}` → expected status + body
- [ ] `{Resource}EndpointTests` — returns 400 with invalid payload
- [ ] `{Resource}EndpointTests` — returns 401 without JWT
- [ ] `{Resource}EndpointTests` — returns 403 for unauthorized roles
- [ ] `{Resource}EndpointTests` — returns 404 for non-existent ID
- [ ] `AuditLogTests` — operation produces AuditLog with correct EntityType, Action, OldValue, NewValue

**Coverage:** ≥80% on Application and Domain layers.

---

## Acceptance Criteria (from Story)

- [ ] AC1: …
- [ ] AC2: …

---

## Notes / Open Questions

- {Ambiguities, decisions to confirm, schema dependencies}
```

---

## FE Task Template (`{us-id}-FE-{n}.md`)

```markdown
# {US-ID}-FE-{N} | FE: {Short Title}

**Story:** {US-ID} | [{Module}] {Story Title}
**Layer:** Frontend
**Priority:** {High / Medium / Low}
**Size estimate:** {XS / S / M / L}
**Sprint:** Sprint {N}
**Depends on:** {us-id}-BE-{n}.md (API must be available)
**Blocks:** {task file names or "—"}

---

## Story

> As a **{role}**, I want to {activity}, so that {business value}.

---

## Scope of This Task

{1-2 sentences: what this FE task covers and what it excludes.}

---

## Implementation Checklist

### Feature Module (`src/app/features/{module}/`)
- [ ] Component: `{path}/{name}.component.ts` + `.html` + `.scss`
- [ ] Route registered in `{module}-routing.module.ts`

### Service / API Client
- [ ] Method in `{module}.service.ts`: `{method}({params}): Observable<{Type}>`
- [ ] Response model: `models/{name}.model.ts`
- [ ] Request model: `models/{name}-request.model.ts` (if needed)

### Reactive Form (if data-entry)
- [ ] FormGroup: fields, types, initial values
- [ ] Validators: `Validators.required`, `maxLength(N)`, custom
- [ ] Error message display per field
- [ ] Submit disabled while invalid or loading

### Shared Components (reuse)
- [ ] `<app-confirm-dialog>` — destructive actions
- [ ] `<app-status-badge>` — status display
- [ ] `<app-file-upload>` — file upload (if applicable)
- [ ] `<app-comment-thread>` — comments (if applicable)
- [ ] `<app-audit-log-viewer>` — history tab (if applicable)

### Authorization (UX only)
- [ ] `*hasRole="['{Role}']"` on role-restricted buttons/actions
- [ ] `AuthGuard` on route (inherited from feature module)

### Navigation / Routing
- [ ] Route: `{path}` in feature routing module
- [ ] Post-action navigation: `router.navigate(['{target}'])`
- [ ] Query params for filter state (if applicable)

### State / Data Flow
- [ ] On init: load data via service, assign to observable/variable
- [ ] Loading indicator during HTTP call
- [ ] Error handling: `catchError` → snackbar/toast on API error
- [ ] On success: snackbar + list refresh or navigation

---

## API Consumed

| Method | URL | Body / Params | Response |
|---|---|---|---|
| `{METHOD}` | `/api/v1/{route}` | `{type or "—"}` | `{type}` |

**Defined by:** `{us-id}-BE-{n}.md`

---

## Component / Service Structure

```
src/app/features/{module}/
├── {sub-folder}/
│   ├── {name}.component.ts
│   ├── {name}.component.html
│   └── {name}.component.scss
├── models/
│   ├── {name}.model.ts
│   └── {name}-request.model.ts
└── {module}.service.ts
```

**Angular Material components used:**
- `MatTableModule` / `MatListModule` — list views
- `MatFormFieldModule` + `MatInputModule` — form fields
- `MatDialogModule` — modals and confirms
- `MatSnackBarModule` — success/error feedback
- `MatProgressSpinnerModule` — loading state
- `MatButtonModule` — actions
- `MatChipsModule` / `MatBadgeModule` — status indicators (if applicable)

---

## UX / Behaviour Specification

| Scenario | Expected behaviour |
|---|---|
| Required field empty on submit | Field highlighted red, error message shown, submit stays disabled |
| API returns 400 | Field-level errors mapped from response `errors` object |
| API returns 403 | Toast: "Nincs jogosultságod ehhez a művelethez." |
| API returns 404 | Inline "Nem található" message or navigate to 404 |
| API returns 500 | Toast: "Szerverhiba történt. Kérjük, próbálja újra." |
| Successful create/update | Success snackbar + navigate to {target} or refresh list |
| Destructive action | Confirm dialog; only proceeds on confirmation |
| {Story-specific scenario} | {Expected behaviour} |

---

## Required Tests

### Unit Tests (Jest + Angular Testing Library)
- [ ] `{Name}Component` — renders without error
- [ ] `{Name}Component` — submit disabled when form invalid
- [ ] `{Name}Component` — calls `{Service}.{method}()` on valid submit
- [ ] `{Name}Component` — shows success snackbar on completion
- [ ] `{Name}Component` — shows error on service failure
- [ ] `{Name}Component` — role-restricted elements absent for unauthorized roles
- [ ] `{Module}Service` — calls correct HTTP endpoint with correct payload
- [ ] `{Module}Service` — maps API response to model correctly

**Coverage:** ≥80% on component and service files.

---

## Acceptance Criteria (from Story)

- [ ] AC1: …
- [ ] AC2: …

---

## Notes / Open Questions

- {UX details to confirm, shared component dependencies}
```
