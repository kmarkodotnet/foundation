# CR2 Dev Task Index — Multi-tenant Owner/Foundation hierarchia

**Kapcsolódó dokumentumok:** `user-stories.md` v1.1 (CR2), `domain-model.md` v1.1 (CR2), `architecture-plan.md` v1.1 (CR2)  
**Generálva:** 2026-06-13  
**Task-ok száma:** 40 (23 BE + 17 FE)

---

## Végrehajtási sorrend (dependency graph alapján)

```
CR2-Sprint A (Infrastruktúra — BLOKKOLÓ)
  us-230-BE-1  [XL] Single-tenant → multi-tenant migráció (Domain + DB)
  us-223-BE-1  [L]  JWT scope-claim bővítés + audience-szétválasztás
  us-231-BE-1  [L]  EF Core global query filterek
  us-233-BE-1  [M]  Audit napló kiterjesztés (OwnerId/FoundationId + új típusok)

CR2-Sprint B (Tenant-biztonság)
  us-221-BE-1  [M]  Hatókör-tudatos meghívási folyamat (BE)
  us-222-BE-1  [L]  Cross-tenant izoláció minden API-végponton
  us-232-BE-1  [L]  Architecture + integrációs tesztek (cross-tenant regresszió)

CR2-Sprint C (Platform admin + break-glass)
  us-200-BE-1  [M]  Owner provisioning (BE)         → us-200-FE-1 [M]
  us-201-BE-1  [S]  Owner felfüggesztés/reaktiválás  → us-201-FE-1 [S]
  us-202-BE-1  [S]  Owner archiválása               → us-202-FE-1 [XS]
  us-203-BE-1  [M]  Platform user meghívása         → us-203-FE-1 [S]
  us-204-BE-1  [S]  Platform technikai beállítások  → us-204-FE-1 [S]
  us-205-BE-1  [M]  Platform audit napló            → us-205-FE-1 [M]
  us-206-BE-1  [L]  Break-glass grant kiállítása    → us-206-FE-1 [M]
  us-207-BE-1  [M]  Break-glass visszavonás/lejárat → us-207-FE-1 [S]

CR2-Sprint D (Owner admin)
  us-210-BE-1  [L]  Foundation létrehozása          → us-210-FE-1 [M]
  us-211-BE-1  [M]  Foundation archiválása          → us-211-FE-1 [S]
  us-212-BE-1  [M]  FoundationAdmin kinevezése      → us-212-FE-1 [S]
  us-213-BE-1  [L]  Owner user meghívás + Foundation assign → us-213-FE-1 [L]
  us-214-BE-1  [M]  Owner kódszótár-sablonok        → us-214-FE-1 [M]
  us-215-BE-1  [L]  Cross-foundation dashboard      → us-215-FE-1 [L]
  us-216-BE-1  [M]  Owner audit napló               → us-216-FE-1 [M]

CR2-Sprint E (Foundation switcher + meghívási flow UI)
  us-220-BE-1  [M]  Foundation switcher (BE)        → us-220-FE-1 [L]
  us-221-FE-1  [M]  Hatókör-tudatos meghívás (FE)
```

---

## Task-ok összesítő táblázata

| Task fájl | Story | Sprint | Méret | Layer | Leírás |
|---|---|---|---|---|---|
| `us-230-BE-1.md` | US-230 | CR2-A | XL | BE+DB | Single→multi-tenant migráció + Domain aggregátumok |
| `us-223-BE-1.md` | US-223 | CR2-A | L | BE | JWT scope-claim + audience-szétválasztás |
| `us-231-BE-1.md` | US-231 | CR2-A | L | BE | EF Core global query filterek + BreakGlassExpirationJob |
| `us-233-BE-1.md` | US-233 | CR2-A | M | BE | Audit napló: OwnerId/FoundationId + új AuditAction-ok |
| `us-221-BE-1.md` | US-221 | CR2-B | M | BE | Scope-aware invitation: Invitation bővítése + elfogadás |
| `us-222-BE-1.md` | US-222 | CR2-B | L | BE | Cross-tenant izoláció + ScopeValidationMiddleware |
| `us-232-BE-1.md` | US-232 | CR2-B | L | BE | Architecture + integrációs teszt suite (cross-tenant) |
| `us-200-BE-1.md` | US-200 | CR2-C | M | BE | Owner provisioning command + API |
| `us-200-FE-1.md` | US-200 | CR2-C | M | FE | Owner lista + létrehozás UI |
| `us-201-BE-1.md` | US-201 | CR2-C | S | BE | Owner Suspend/Reactivate + login-check |
| `us-201-FE-1.md` | US-201 | CR2-C | S | FE | Suspend/Reactivate gombok + confirm dialog |
| `us-202-BE-1.md` | US-202 | CR2-C | S | BE | Owner Archive + Foundation-count check |
| `us-202-FE-1.md` | US-202 | CR2-C | XS | FE | Archive gomb disabled/tooltip logika |
| `us-203-BE-1.md` | US-203 | CR2-C | M | BE | Platform user meghívó + elfogadás PlatformRole-lal |
| `us-203-FE-1.md` | US-203 | CR2-C | S | FE | Platform user lista + invite dialog |
| `us-204-BE-1.md` | US-204 | CR2-C | S | BE | PlatformSettings singleton CRUD |
| `us-204-FE-1.md` | US-204 | CR2-C | S | FE | Platform settings form |
| `us-205-BE-1.md` | US-205 | CR2-C | M | BE | Platform audit log query + CSV export |
| `us-205-FE-1.md` | US-205 | CR2-C | M | FE | Platform audit log lista + kiemelések |
| `us-206-BE-1.md` | US-206 | CR2-C | L | BE | BreakGlassGrant.Issue() + break-glass JWT |
| `us-206-FE-1.md` | US-206 | CR2-C | M | FE | Break-glass kiállítás dialog (min 20 char indoklás) |
| `us-207-BE-1.md` | US-207 | CR2-C | M | BE | BreakGlassGrant.Revoke() + ExpirationJob |
| `us-207-FE-1.md` | US-207 | CR2-C | S | FE | Break-glass lista + visszavonás UI |
| `us-210-BE-1.md` | US-210 | CR2-D | L | BE | Foundation.Create() + kódszótár-másolás + meghívó |
| `us-210-FE-1.md` | US-210 | CR2-D | M | FE | Foundation lista + létrehozás dialog |
| `us-211-BE-1.md` | US-211 | CR2-D | M | BE | Foundation.Archive() + assignment-inaktiválás |
| `us-211-FE-1.md` | US-211 | CR2-D | S | FE | Archive gomb disabled/tooltip logika |
| `us-212-BE-1.md` | US-212 | CR2-D | M | BE | FoundationAdmin kinevezés + utolsó admin szabály |
| `us-212-FE-1.md` | US-212 | CR2-D | S | FE | Admin lista + kinevezés/visszavonás UI |
| `us-213-BE-1.md` | US-213 | CR2-D | L | BE | Owner user meghívó + Foundation-assign payload |
| `us-213-FE-1.md` | US-213 | CR2-D | L | FE | Dinamikus Foundation-hozzárendelés form |
| `us-214-BE-1.md` | US-214 | CR2-D | M | BE | OwnerCodeListTemplate CRUD + apply-to-foundation |
| `us-214-FE-1.md` | US-214 | CR2-D | M | FE | Kódszótár-sablon szerkesztő + újra-alkalmazás |
| `us-215-BE-1.md` | US-215 | CR2-D | L | BE | Cross-foundation dashboard query (5 perces cache) |
| `us-215-FE-1.md` | US-215 | CR2-D | L | FE | Dashboard kártyák + Foundation-switcher integráció |
| `us-216-BE-1.md` | US-216 | CR2-D | M | BE | Owner audit log query + CSV export |
| `us-216-FE-1.md` | US-216 | CR2-D | M | FE | Owner audit log lista + BREAK_GLASS kiemelés |
| `us-220-BE-1.md` | US-220 | CR2-E | M | BE | Foundation switcher endpoint véglegesítés + audit |
| `us-220-FE-1.md` | US-220 | CR2-E | L | FE | Foundation switcher dropdown komponens |
| `us-221-FE-1.md` | US-221 | CR2-E | M | FE | Hatókör-tudatos meghívó elfogadási oldal |

---

## Kritikus függőségek összefoglalva

```
us-230-BE-1 (XL)
  └─► us-223-BE-1 (L) ──────────────────────────► us-200-BE-1 és utána mindenki
  └─► us-231-BE-1 (L) ── us-222-BE-1 (L) ────────► us-232-BE-1 (L)
  └─► us-233-BE-1 (M) ── us-205-BE-1, us-216-BE-1
  └─► us-221-BE-1 (M) ── us-203-BE-1, us-210-BE-1, us-213-BE-1

us-210-BE-1 (L) ─► us-211-BE-1, us-212-BE-1, us-213-BE-1, us-214-BE-1, us-215-BE-1, us-216-BE-1

us-206-BE-1 (L) ─► us-207-BE-1
```

**Sprint A blokkolja az összes többi sprint-et.**

---

## Új fájlok / módosított fájlok CR2 összesítve

### Új tartós fájlok (domain)
- `Domain/Tenancy/Owner.cs`, `Foundation.cs`, `BreakGlassGrant.cs`
- `Domain/Users/FoundationUserAssignment.cs`
- `Domain/Tenancy/Enums/{OwnerStatus, FoundationStatus, PlatformRole, OwnerRole, FoundationRole, AssignmentScope, BreakGlassStatus}.cs`
- `Domain/Tenancy/Events/{OwnerProvisioned, ..., BreakGlassActivated, ...}.cs`
- `Domain/Common/IOwnedEntity.cs` (marker interface)

### Módosított fájlok (domain)
- `Domain/Entities/AppUser.cs` — PlatformRole, OwnerRole, FoundationAssignments, új domain metódusok
- `Domain/Entities/AuditLog.cs` — OwnerId, FoundationId
- `Domain/Enums/AuditAction.cs` — új CR2 értékek
- `Domain/Entities/{Application, Granter, Vendor, CodeList, Notification}.cs` — OwnerId, FoundationId

### Új fájlok (infrastructure)
- `Infrastructure/Auth/CurrentScopeService.cs`
- `Infrastructure/BackgroundJobs/BreakGlassExpirationJob.cs`
- `Infrastructure/Persistence/Configurations/Tenancy/{Owner, Foundation, BreakGlassGrant, OwnerCodeListTemplate}Configuration.cs`
- 3 új EF Core migráció

### Módosított fájlok (infrastructure)
- `AppDbContext.cs` — global query filterek, új DbSet-ek
- `JwtTokenService.cs` — scope-aware token kiállítás
- `AuditLogger.cs` — scope automatikus rögzítése

### Új API controller-ek
- `API/Controllers/Platform/{OwnersController, PlatformUsersController, PlatformAuditLogsController, BreakGlassController, PlatformSettingsController}`
- `API/Controllers/Owner/{FoundationsController, OwnerUsersController, OwnerAuditLogsController, OwnerCodeListTemplatesController, OwnerReportsController}`
- `API/Controllers/Me/ScopeSwitchController`
- `API/Middleware/ScopeValidationMiddleware`

### Új Angular modulok / komponensek
- `features/platform/{owners, users, audit-logs, break-glass, settings}`
- `features/owner/{foundations, users, audit-logs, code-list-templates, dashboard}`
- `shared/components/foundation-switcher`
- `core/auth/scope.service.ts`
