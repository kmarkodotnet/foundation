# CR1_us-165-BE-1 | BE: GET /invitations + PUT /revoke + POST /resend + Expiry Job

**Story:** US-165 | [Admin] Meghívók listázása és kezelése  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Backend  
**Priority:** Magas  
**Size estimate:** M  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-164-BE-1.md (Invitation entitás és alapvégpont)  
**Blocks:** CR1_us-165-FE-1.md

---

## Story

> Mint **adminisztrátor**, szeretném áttekinteni a kiküldött meghívókat és kezelni a függőben lévőket, hogy nyomon követhessem ki fogadta el, és szükség esetén visszavonjak vagy újraküldjek.

---

## Scope

A meghívókezelés olvasási és mutációs végpontjai: lista lekérés, visszavonás, újraküldés. Hangfire lejárati job a PENDING meghívók EXPIRED-re állításához.

---

## Implementation Checklist

### Application Layer (`GrantManagement.Application`)

#### Lekérdezés
- [ ] Query: `Application/Invitations/Queries/GetInvitations/GetInvitationsQuery.cs` — `string? StatusFilter`
- [ ] Handler: `GetInvitationsQueryHandler.cs`
  - Lekérdezi az összes `Invitation`-t az `IApplicationDbContext`-en keresztül
  - Opcionális szűrés `StatusFilter` alapján
  - Rendezés: `CreatedAt DESC`
  - Visszatér: `IEnumerable<InvitationResponse>`

#### Visszavonás
- [ ] Command: `Application/Invitations/Commands/RevokeInvitation/RevokeInvitationCommand.cs` — `Guid InvitationId`
- [ ] Handler: `RevokeInvitationCommandHandler.cs`
  - Meghívó keresése ID alapján → `InvitationNotFoundException`
  - `invitation.Revoke()` hívása — ha nem PENDING, `DomainException`
  - `SaveChangesAsync()`
- [ ] Validator: `RevokeInvitationCommandValidator.cs` — `InvitationId` NotEmpty

#### Újraküldés
- [ ] Command: `Application/Invitations/Commands/ResendInvitation/ResendInvitationCommand.cs` — `Guid InvitationId`
- [ ] Handler: `ResendInvitationCommandHandler.cs`
  - Meghívó keresése ID alapján → `InvitationNotFoundException`
  - `invitation.Resend(expiryHours)` hívása — csak PENDING vagy EXPIRED esetén OK, ACCEPTED/REVOKED esetén `DomainException`
  - `IEmailService.SendInvitationAsync(...)` hívása az új tokennel
  - `SaveChangesAsync()`
- [ ] Validator: `ResendInvitationCommandValidator.cs`

### Infrastructure Layer (`GrantManagement.Infrastructure`)
- [ ] Hangfire recurring job: `Infrastructure/Jobs/InvitationExpiryJob.cs`
  - Nevű job: `"invitation-expiry-check"`
  - Ütemezés: óránként (`Cron.Hourly()`)
  - Logika: PENDING státuszú, `ExpiresAt < now` meghívók → státusz EXPIRED
  - Regisztrálás: `RecurringJob.AddOrUpdate<InvitationExpiryJob>(...)`

### API Layer (`GrantManagement.API`)
- [ ] `GET /api/v1/invitations` az `InvitationsController`-ben
  - `[Authorize(Policy = "CanManageUsers")]`
  - Query param: `?status=PENDING|ACCEPTED|EXPIRED|REVOKED` (opcionális)
  - Returns `200 OK` with `IEnumerable<InvitationResponse>`
- [ ] `PUT /api/v1/invitations/{id}/revoke`
  - `[Authorize(Policy = "CanManageUsers")]`
  - Returns `200 OK` with updated `InvitationResponse`
  - `[ProducesResponseType(404)]` — nem található
  - `[ProducesResponseType(400)]` — nem vonható vissza (domain hiba)
- [ ] `POST /api/v1/invitations/{id}/resend`
  - `[Authorize(Policy = "CanManageUsers")]`
  - Returns `200 OK` with updated `InvitationResponse`
  - `[ProducesResponseType(404)]` — nem található
  - `[ProducesResponseType(400)]` — nem küldhető újra (pl. ACCEPTED/REVOKED)

---

## API Contract

### GET /api/v1/invitations
**Query params:** `?status=PENDING` (opcionális)

**200 OK:**
```json
[
  {
    "id": "aaaaaaaa-0000-0000-0000-000000000201",
    "email": "uj.munkatars@teszt.hu",
    "role": "PalyazatiMunkatars",
    "status": "PENDING",
    "createdAt": "2026-06-10T10:00:00Z",
    "expiresAt": "2026-06-13T10:00:00Z"
  }
]
```

### PUT /api/v1/invitations/{id}/revoke
**200 OK:** `InvitationResponse` REVOKED státusszal  
**404:** nem található  
**400:** `DomainException` — nem PENDING státuszú meghívón

### POST /api/v1/invitations/{id}/resend
**200 OK:** `InvitationResponse` PENDING státusszal (új ExpiresAt)  
**404:** nem található  
**400:** `DomainException` — ACCEPTED vagy REVOKED meghívón

---

## Required Tests

### Unit Tests
- [ ] `GetInvitationsQueryHandlerTests` — status filter nélkül az összes visszajön
- [ ] `GetInvitationsQueryHandlerTests` — status=PENDING szűrő csak PENDING-eket ad vissza
- [ ] `RevokeInvitationCommandHandlerTests` — PENDING → REVOKED sikeres
- [ ] `RevokeInvitationCommandHandlerTests` — ACCEPTED meghívó → DomainException
- [ ] `RevokeInvitationCommandHandlerTests` — nem létező ID → InvitationNotFoundException
- [ ] `ResendInvitationCommandHandlerTests` — EXPIRED → PENDING sikeres, email újraküldve
- [ ] `ResendInvitationCommandHandlerTests` — PENDING → PENDING sikeres, email újraküldve (elveszett email eset)
- [ ] `ResendInvitationCommandHandlerTests` — ACCEPTED → DomainException
- [ ] `ResendInvitationCommandHandlerTests` — REVOKED → DomainException
- [ ] `InvitationExpiryJobTests` — lejárt PENDING meghívók → EXPIRED-re állítja
- [ ] `InvitationExpiryJobTests` — nem lejárt PENDING meghívó → érintetlen marad

### Integration Tests
- [ ] `InvitationsEndpointTests` — GET lista visszaadja az összes meghívót
- [ ] `InvitationsEndpointTests` — GET ?status=PENDING szűrés működik
- [ ] `InvitationsEndpointTests` — PUT /revoke PENDING → 200 REVOKED
- [ ] `InvitationsEndpointTests` — PUT /revoke ACCEPTED → 400
- [ ] `InvitationsEndpointTests` — POST /resend EXPIRED → 200 PENDING, új ExpiresAt
- [ ] `InvitationsEndpointTests` — Munkatárs token → 403 minden végponton

**Coverage:** ≥80%.

---

## Acceptance Criteria

- [ ] AC1: Az Admin listázhatja az összes meghívót státusz szerint szűrve.
- [ ] AC2: PENDING meghívó visszavonható; visszavonás után REVOKED, nem visszavonható.
- [ ] AC3: EXPIRED vagy PENDING meghívó újraküldhető; az újraküldés új tokent és érvényességi időt generál.
- [ ] AC4: ACCEPTED meghívón nincs visszavonás vagy újraküldés lehetőség.
- [ ] AC5: A Hangfire job óránként futtatja a lejárati ellenőrzést.
