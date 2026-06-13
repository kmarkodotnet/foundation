# CR1_us-164-BE-1 | BE: Invitation Entity + POST /invitations + Email Dispatch

**Story:** US-164 | [Admin] Felhasználói meghívó létrehozása és kiküldése  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Backend  
**Priority:** Magas  
**Size estimate:** L  
**Sprint:** Sprint 1  
**Depends on:** us-160-BE-1.md (AppUser és Admin jogkör megléte)  
**Blocks:** CR1_us-006-BE-1.md, CR1_us-007-BE-1.md, CR1_us-165-BE-1.md, CR1_us-164-FE-1.md

---

## Story

> Mint **adminisztrátor**, szeretnék új felhasználót meghívni a rendszerbe e-mail cím és szerepkör megadásával, hogy csak általam jóváhagyott személyek férhessenek hozzá az alkalmazáshoz.

---

## Scope

Az `Invitation` domain entitás létrehozása, a `POST /api/v1/invitations` végpont implementálása meghívó e-mail küldéssel. Ez az alapfeladat — a lista/visszavonás/újraküldés a CR1_us-165-BE-1-ben van; a token-alapú aktiválás a CR1_us-007-BE-1-ben.

---

## Implementation Checklist

### Domain Layer (`GrantManagement.Domain`)
- [ ] `Invitation` entitás — `Domain/Entities/Invitation.cs`
  - `Id` (Guid)
  - `Email` (string, max 320)
  - `Role` (UserRole)
  - `Token` (string — URL-safe GUID, egyszer használatos)
  - `Status` (InvitationStatus)
  - `ExpiresAt` (DateTimeOffset)
  - `CreatedAt` (DateTimeOffset)
  - `CreatedByUserId` (Guid)
  - Statikus factory: `Invitation.Create(email, role, createdByUserId, expiryHours)`
  - Metódusok: `Accept()`, `Revoke()`, `Resend(expiryHours)` — státuszátmenetek invariáns-ellenőrzéssel
- [ ] `InvitationStatus` enum — `Domain/Enums/InvitationStatus.cs`: `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`
- [ ] `InvitationAlreadyExistsException` — `Domain/Exceptions/InvitationAlreadyExistsException.cs` (aktív fiókhoz vagy már PENDING meghívóhoz küldési kísérlet)
- [ ] `InvitationNotFoundException` — `Domain/Exceptions/InvitationNotFoundException.cs`
- [ ] `IInvitationEmailService` interface a `Domain/Interfaces/Services/` alatt (vagy bővíthető az `IEmailService` megfelelő override-dal)

### Application Layer (`GrantManagement.Application`)
- [ ] Command: `Application/Invitations/Commands/CreateInvitation/CreateInvitationCommand.cs` — `string Email`, `UserRole Role`
- [ ] Handler: `Application/Invitations/Commands/CreateInvitation/CreateInvitationCommandHandler.cs`
  - Ellenőrzés: létezik-e már aktív `AppUser` ezzel az e-mail-lel → `InvitationAlreadyExistsException`
  - Ellenőrzés: van-e már `PENDING` státuszú meghívó erre az e-mail-re → `InvitationAlreadyExistsException` (külön üzenettel)
  - `Invitation.Create(...)` hívása a `SystemSettings.InvitationExpiryHours` értékével
  - Mentés + `IEmailService.SendInvitationAsync(...)` hívása
  - Visszatér: `InvitationResponse`
- [ ] Validator: `Application/Invitations/Commands/CreateInvitation/CreateInvitationCommandValidator.cs`
  - `Email`: `NotEmpty`, `EmailAddress`, max 320 kar
  - `Role`: valid `UserRole` enum érték
- [ ] DTO: `Application/Invitations/DTOs/InvitationResponse.cs` — `Guid Id`, `string Email`, `string Role`, `string Status`, `DateTimeOffset CreatedAt`, `DateTimeOffset ExpiresAt`
- [ ] AutoMapper: `Invitation` → `InvitationResponse`

### Infrastructure Layer (`GrantManagement.Infrastructure`)
- [ ] `Infrastructure/Persistence/Configurations/InvitationConfiguration.cs`
  - Table: `Invitations`
  - Index: `Email` + `Status` (részleges index PENDING-re: `WHERE status = 'PENDING'`)
  - `Token` oszlop: unique index
- [ ] `DbSet<Invitation> Invitations` hozzáadása az `AppDbContext`-hez
- [ ] Migration: `dotnet ef migrations add CR1_AddInvitations`
- [ ] `IEmailService` bővítése (vagy `SmtpEmailService`): `SendInvitationAsync(string toEmail, string role, string inviteLink)` — HTML e-mail template a meghívó linkkel

### API Layer (`GrantManagement.API`)
- [ ] `POST /api/v1/invitations` az `InvitationsController`-ben
  - `[Authorize(Policy = "CanManageUsers")]`
  - Dispatches `CreateInvitationCommand`
  - Returns `201 Created` with `InvitationResponse` + `Location` header
- [ ] `[ProducesResponseType(typeof(InvitationResponse), 201)]`
- [ ] `[ProducesResponseType(typeof(ValidationProblemDetails), 422)]`
- [ ] `[ProducesResponseType(409)]` — duplikált meghívó
- [ ] ExceptionMiddleware: `InvitationAlreadyExistsException` → HTTP 409

---

## API Contract

### Endpoint
```
POST /api/v1/invitations
```

### Authorization
- Required policy: `CanManageUsers` (Admin)

### Request Body
```json
{
  "email": "uj.munkatars@teszt.hu",
  "role": "PalyazatiMunkatars"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | `string` | Yes | Érvényes e-mail formátum, max 320 kar |
| `role` | `string` | Yes | Valid `UserRole` enum érték |

### Responses

**201 Created:**
```json
{
  "id": "aaaaaaaa-0000-0000-0000-000000000201",
  "email": "uj.munkatars@teszt.hu",
  "role": "PalyazatiMunkatars",
  "status": "PENDING",
  "createdAt": "2026-06-12T10:00:00Z",
  "expiresAt": "2026-06-15T10:00:00Z"
}
```

**409 Conflict** — Az e-mail cím már regisztrált felhasználóhoz tartozik, vagy már van aktív meghívó  
**422** — Validációs hiba (üres email, érvénytelen szerepkör)

---

## FluentValidation Rules

| Field | Rule | Error message |
|---|---|---|
| `Email` | `NotEmpty()` | "Az e-mail cím megadása kötelező." |
| `Email` | `EmailAddress()` | "Érvénytelen e-mail cím formátum." |
| `Email` | `MaximumLength(320)` | "Az e-mail cím legfeljebb 320 karakter lehet." |
| `Role` | `IsInEnum()` | "Érvénytelen szerepkör." |

---

## Required Tests

### Unit Tests
- [ ] `CreateInvitationCommandValidatorTests` — üres email → hiba
- [ ] `CreateInvitationCommandValidatorTests` — érvénytelen email → hiba
- [ ] `CreateInvitationCommandValidatorTests` — érvénytelen szerepkör → hiba
- [ ] `CreateInvitationCommandHandlerTests` — létező aktív AppUser-re küldés → InvitationAlreadyExistsException
- [ ] `CreateInvitationCommandHandlerTests` — már PENDING meghívóra küldés → InvitationAlreadyExistsException
- [ ] `CreateInvitationCommandHandlerTests` — sikeres eset → Invitation létrejön PENDING státusszal, SendInvitationAsync hívódik
- [ ] `InvitationTests` — `Create()` PENDING státusszal hozza létre, ExpiresAt = now + expiryHours
- [ ] `InvitationTests` — `Accept()` PENDING → ACCEPTED átmenet OK
- [ ] `InvitationTests` — `Accept()` nem PENDING → DomainException
- [ ] `InvitationTests` — `Revoke()` PENDING → REVOKED átmenet OK
- [ ] `InvitationTests` — `Revoke()` ACCEPTED → DomainException

### Integration Tests
- [ ] `InvitationsEndpointTests` — POST sikeres eset → 201, Invitation a DB-ben
- [ ] `InvitationsEndpointTests` — POST duplikált email (aktív user) → 409
- [ ] `InvitationsEndpointTests` — POST duplikált email (PENDING invite) → 409
- [ ] `InvitationsEndpointTests` — Munkatárs token → 403
- [ ] `InvitationsEndpointTests` — SendInvitationAsync email target ellenőrzés

**Coverage:** ≥80% a Domain és Application rétegen.

---

## Acceptance Criteria

- [ ] AC1: Az „Új meghívó" gomb elérhető a Felhasználók oldalon.
- [ ] AC2: Meghívó e-mail cím (kötelező, érvényes) és szerepkör megadásával létrehozható.
- [ ] AC3: Aktív fiókhoz küldés → 409 hibaüzenet.
- [ ] AC4: PENDING meghívóra újabb küldés → 409 figyelmeztetés.
- [ ] AC5: Sikeres küldés → e-mail elküldve, snackbar megjelenik.
- [ ] AC6: Meghívó e-mail tartalmazza a szerepkört és az elfogadási linket.
- [ ] AC7: Sikeres aktiválás után a meghívó státusza ACCEPTED-re vált.
