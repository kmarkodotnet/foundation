# CR1_us-007-BE-1 | BE: POST /auth/accept-invitation – Meghívó elfogadása és AppUser aktiválása

**Story:** US-007 | [Auth] Meghívó elfogadása és fiók aktiválása  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Backend  
**Priority:** Magas  
**Size estimate:** M  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-164-BE-1.md (Invitation entitás és token logika)  
**Blocks:** CR1_us-007-FE-1.md

---

## Story

> Mint **meghívott felhasználó**, szeretnék a kapott meghívó linken keresztül regisztrálni a rendszerbe, hogy hozzáférhessek az alkalmazáshoz a számomra előre beállított szerepkörrel.

---

## Scope

A meghívó elfogadásának teljes backend flow-ja: a frontend elküldi a Google authorization code-ot és a meghívó tokent; a backend ellenőrzi a tokent, az email egyezést, létrehozza az `AppUser`-t, ACCEPTED-re állítja az `Invitation`-t és JWT-t ad vissza.

---

## Implementation Checklist

### Domain Layer (`GrantManagement.Domain`)
- [ ] `EmailMismatchException` — `Domain/Exceptions/EmailMismatchException.cs`
  - Konstruktor: `EmailMismatchException(string invitedEmail, string actualEmail)`
- [ ] `InvitationExpiredException` — `Domain/Exceptions/InvitationExpiredException.cs`
- [ ] `InvitationRevokedException` — `Domain/Exceptions/InvitationRevokedException.cs`
- [ ] `InvitationAlreadyAcceptedException` — `Domain/Exceptions/InvitationAlreadyAcceptedException.cs`
- [ ] `Invitation.Accept()` metódus (ha CR1_us-164-BE-1-ben nincs meg): státuszváltás PENDING → ACCEPTED, invariáns ellenőrzéssel

### Application Layer (`GrantManagement.Application`)
- [ ] Command: `Application/Auth/Commands/AcceptInvitation/AcceptInvitationCommand.cs`
  - `string AuthorizationCode`
  - `string RedirectUri`
  - `string InvitationToken`
- [ ] Handler: `Application/Auth/Commands/AcceptInvitation/AcceptInvitationCommandHandler.cs`
  1. Meghívó keresése token alapján → `InvitationNotFoundException` ha nem found
  2. Státusz ellenőrzés:
     - `ACCEPTED` → `InvitationAlreadyAcceptedException`
     - `REVOKED` → `InvitationRevokedException`
     - `EXPIRED` → `InvitationExpiredException`
     - `ExpiresAt < now` → státusz frissítése EXPIRED-re, majd `InvitationExpiredException`
  3. Google code exchange → `IGoogleAuthService.ExchangeCodeAsync(...)`
  4. Email egyezés: `invitation.Email != googleInfo.Email` → `EmailMismatchException`
  5. `AppUser.Create(googleInfo, invitation.Role)` — IsActive = true
  6. `invitation.Accept()`
  7. `SaveChangesAsync()`
  8. `IJwtService.GenerateToken(user)` → `AuthResultDto` visszaadása
- [ ] Validator: `Application/Auth/Commands/AcceptInvitation/AcceptInvitationCommandValidator.cs`
  - `AuthorizationCode`: NotEmpty
  - `RedirectUri`: NotEmpty
  - `InvitationToken`: NotEmpty
- [ ] Ugyanazon `AuthResultDto` és `UserProfileDto` DTO-k újrahasználata (us-001-BE-1-ből)

### API Layer (`GrantManagement.API`)
- [ ] `POST /api/v1/auth/accept-invitation` az `AuthController`-ben
  - `[AllowAnonymous]`
  - Dispatches `AcceptInvitationCommand`
  - Returns `200 OK` with `AuthResultDto`
- [ ] `[ProducesResponseType(typeof(AuthResultDto), 200)]`
- [ ] `[ProducesResponseType(422)]` — validációs hiba
- [ ] `[ProducesResponseType(410)]` — lejárt vagy visszavont meghívó
- [ ] `[ProducesResponseType(409)]` — már elfogadott meghívó
- [ ] `[ProducesResponseType(422)]` — email mismatch (vagy 400)
- [ ] ExceptionMiddleware bővítése:
  - `InvitationExpiredException` → 410, `detail: "invitation-expired"`
  - `InvitationRevokedException` → 410, `detail: "invitation-revoked"`
  - `InvitationAlreadyAcceptedException` → 409, `detail: "invitation-already-accepted"`
  - `EmailMismatchException` → 422, `detail: "email-mismatch"`

---

## API Contract

### Endpoint
```
POST /api/v1/auth/accept-invitation
```

### Authorization
- Required roles: None (anonymous)

### Request Body
```json
{
  "authorizationCode": "4/0AX4XfWi...",
  "redirectUri": "https://palyazat.alapitvany.hu/auth/callback",
  "invitationToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `authorizationCode` | `string` | Yes | Not empty |
| `redirectUri` | `string` | Yes | Not empty |
| `invitationToken` | `string` | Yes | Not empty |

### Responses

**200 OK** — Sikeres aktiválás, JWT visszaadva (ugyanaz a struktúra mint `google-callback` 200):
```json
{
  "accessToken": "eyJhbGci...",
  "expiresIn": 28800,
  "user": {
    "id": "...",
    "email": "uj.munkatars@teszt.hu",
    "fullName": "Új Munkatárs",
    "role": "PalyazatiMunkatars",
    "lastLoginAt": null
  }
}
```

**410 Gone** — Lejárt: `detail: "invitation-expired"` | Visszavont: `detail: "invitation-revoked"`  
**409 Conflict** — Már elfogadott: `detail: "invitation-already-accepted"`  
**422** — Email eltérés: `detail: "email-mismatch"` | Validációs hiba  
**404** — Token nem található

---

## Required Tests

### Unit Tests
- [ ] `AcceptInvitationCommandValidatorTests` — üres token → hiba
- [ ] `AcceptInvitationCommandHandlerTests` — nem létező token → InvitationNotFoundException
- [ ] `AcceptInvitationCommandHandlerTests` — EXPIRED meghívó → InvitationExpiredException
- [ ] `AcceptInvitationCommandHandlerTests` — REVOKED meghívó → InvitationRevokedException
- [ ] `AcceptInvitationCommandHandlerTests` — ACCEPTED meghívó → InvitationAlreadyAcceptedException
- [ ] `AcceptInvitationCommandHandlerTests` — ExpiresAt < now (PENDING) → EXPIRED-re állít, InvitationExpiredException
- [ ] `AcceptInvitationCommandHandlerTests` — email mismatch → EmailMismatchException
- [ ] `AcceptInvitationCommandHandlerTests` — sikeres eset → AppUser létrejön, Invitation ACCEPTED, JWT visszaadva
- [ ] `AcceptInvitationCommandHandlerTests` — sikeres eset → AppUser Role == Invitation.Role

### Integration Tests
- [ ] `AuthEndpointTests` — POST /auth/accept-invitation EXPIRED → 410 detail: "invitation-expired"
- [ ] `AuthEndpointTests` — POST /auth/accept-invitation REVOKED → 410 detail: "invitation-revoked"
- [ ] `AuthEndpointTests` — POST /auth/accept-invitation email mismatch → 422 detail: "email-mismatch"
- [ ] `AuthEndpointTests` — POST /auth/accept-invitation sikeres → 200, AppUser a DB-ben, Invitation.Status == ACCEPTED
- [ ] `AuthEndpointTests` — elfogadott token másodszori használata → 409

**Coverage:** ≥80%.

---

## Acceptance Criteria

- [ ] AC1: Érvényes token + egyező email → 200 OK, JWT visszaadva.
- [ ] AC2: Lejárt token → 410 `detail: "invitation-expired"`.
- [ ] AC3: Email eltérés → 422 `detail: "email-mismatch"`.
- [ ] AC4: Visszavont token → 410 `detail: "invitation-revoked"`.
- [ ] AC5: Már elfogadott token → 409.
- [ ] AC6: Sikeres elfogadás után az `Invitation.Status == ACCEPTED`, a token nem használható újra.
- [ ] AC7: Az `AppUser` a meghívóban meghatározott szerepkörrel jön létre.
