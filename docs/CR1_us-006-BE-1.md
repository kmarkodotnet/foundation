# CR1_us-006-BE-1 | BE: Meghívó-alapú belépési feltétel – GoogleLoginCommandHandler módosítása

**Story:** US-006 | [Auth] Meghívó-alapú belépési feltétel érvényesítése  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Backend  
**Type:** MODIFICATION — meglévő us-001-BE-1.md GoogleLoginCommandHandler deltája  
**Priority:** Magas  
**Size estimate:** S  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-164-BE-1.md (Invitation entitás megléte)  
**Blocks:** CR1_us-006-FE-1.md, CR1_us-001-BE-1.md

---

## Story

> Mint **rendszer**, szeretném megakadályozni, hogy meghívó nélküli Google-fiókkal bárki hozzáférjen a rendszerhez.

---

## Scope

A `GoogleLoginCommandHandler` módosítása: az automatikus `AppUser` létrehozás (auto-regisztráció) eltávolítása és helyette meghívó-alapú belépési ellenőrzés bevezetése. `NoInvitationException` bevezetése + ExceptionMiddleware mapping + audit naplózás.

---

## Implementation Checklist

### Domain Layer (`GrantManagement.Domain`)
- [ ] `NoInvitationException` — `Domain/Exceptions/NoInvitationException.cs`
  - Konstruktor: `NoInvitationException(string email)`
  - Tulajdonság: `string Email`

### Application Layer (`GrantManagement.Application`)
- [ ] `GoogleLoginCommandHandler` módosítása (`Application/Auth/Commands/GoogleLogin/GoogleLoginCommandHandler.cs`):

  **Régi logika (TÖRLENDŐ):**
  ```csharp
  // upsert: ha nem létezik, létrehozza Megtekinto szerepkörrel
  var user = await _context.AppUsers.FirstOrDefaultAsync(u => u.GoogleId == googleInfo.Sub);
  if (user == null) {
      user = AppUser.Create(googleInfo, UserRole.Megtekinto);
      _context.AppUsers.Add(user);
  }
  ```

  **Új logika:**
  ```csharp
  var user = await _context.AppUsers
      .FirstOrDefaultAsync(u => u.Email == googleInfo.Email && u.IsActive);
  if (user == null)
      throw new NoInvitationException(googleInfo.Email);
  ```

  - Az `InactiveUserException` dobása megmarad (ha user != null de `!IsActive`)
  - `LastLoginAt` frissítése megmarad

### API Layer (`GrantManagement.API`)
- [ ] `ExceptionMiddleware` módosítása:
  - `NoInvitationException` → HTTP 403, body: `{ "title": "Forbidden", "detail": "no-invitation" }`
  - Különböztesse meg az `InactiveUserException`-től: az marad `detail: "inactive"`
- [ ] Audit naplózás a `ExceptionMiddleware`-ben vagy a handlerben:
  - `NoInvitationException` esetén loggolás: e-mail cím, IP (HttpContext-ből), időbélyeg, `"no-invitation-attempt"` event type
  - **NE** kerüljön az audit_logs táblába (security log, nem üzleti audit) — Serilog structured log elegendő

---

## API Contract (delta)

### POST /api/v1/auth/google-callback — Változások

Új hibakód:

**403 Forbidden** (meghívó nélküli kísérlet):
```json
{
  "title": "Forbidden",
  "status": 403,
  "detail": "no-invitation"
}
```

Megkülönböztetés az inaktív felhasználó 403-ától:
```json
{
  "title": "Forbidden",
  "status": 403,
  "detail": "inactive"
}
```

---

## Required Tests

### Unit Tests
- [ ] `GoogleLoginCommandHandlerTests` — ismeretlen email → `NoInvitationException` dobódik
- [ ] `GoogleLoginCommandHandlerTests` — ismert, aktív user → sikeres login (változatlan viselkedés)
- [ ] `GoogleLoginCommandHandlerTests` — ismert, inaktív user → `InactiveUserException` dobódik (változatlan)
- [ ] `GoogleLoginCommandHandlerTests` — auto-create logika **nem** létezik többé (AppUsers.Add nem hívódik ismeretlen email esetén)

### Integration Tests
- [ ] `AuthEndpointTests` — ismeretlen email → 403 JSON body `detail: "no-invitation"`
- [ ] `AuthEndpointTests` — inaktív user → 403 JSON body `detail: "inactive"` (megkülönböztetés ellenőrzése)
- [ ] `AuthEndpointTests` — ismeretlen email kísérlet → Serilog log bejegyzés tartalmazza az email-t és `"no-invitation-attempt"` event-et

**Coverage:** ≥80%.

---

## Acceptance Criteria

- [ ] AC1: Ismeretlen email-lel történő Google OAuth callback → 403 `detail: "no-invitation"`.
- [ ] AC2: Az OidcCallbackComponent a 403 + `detail: "no-invitation"` választ `/login?error=no-invitation`-ra irányítja.
- [ ] AC3: A sikertelen kísérlet naplózódik (email, IP, időbélyeg).
- [ ] AC4: Meglévő aktív fiók esetén a belépési folyamat változatlan.
- [ ] AC5: Meglévő inaktív fiók esetén `detail: "inactive"` — nem keveredik a no-invitation esettel.
