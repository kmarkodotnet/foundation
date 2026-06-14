# Dependency Graph — GrantManagement

**Kapcsolódó dokumentumok:** `user-stories.md` v1.1, `cr2-dev-task-index.md`, `architecture-plan.md` v1.1, `domain-model.md` v1.1  
**Verzió:** 1.1 (CR2)  
**Generálva:** 2026-06-13

---

## Tartalomjegyzék

1. [Jelölések](#1-jelölések)
2. [CR1 — Alap user story függőségek](#2-cr1--alap-user-story-függőségek)
3. [CR2 — User story szintű függőségek](#3-cr2--user-story-szintű-függőségek)
4. [CR2 — Task szintű függőségek (teljes)](#4-cr2--task-szintű-függőségek-teljes)
5. [Végrehajtási sorrend és párhuzamosíthatóság](#5-végrehajtási-sorrend-és-párhuzamosíthatóság)
6. [Blokkolt ticketek összesítő](#6-blokkolt-ticketek-összesítő)
7. [FE task blokkolók (BE contract dependency)](#7-fe-task-blokkolók-be-contract-dependency)
8. [Kritikus útvonal](#8-kritikus-útvonal)

---

## 1. Jelölések

```
─►   közvetlen függőség (A ─► B = B függ A-tól, A el kell készüljön előbb)
══►  erős blokkoló (az egész sprint blokkolt)
⋯►   laza függőség (ajánlott sorrend, de átfedés lehetséges)
[XL] méret becslés
(BE) backend task
(FE) frontend task
```

**Státuszok:**

| Jelölés | Jelentés |
|---|---|
| `[BLOKKOLÓ]` | Ez a task minden utána következőt blokkol |
| `[PÁRHUZAMOS]` | Más azonos sprint-szintű taskokkal párhuzamosan futtatható |
| `[FE-BLOKKOLT]` | A corresponding BE task Done státusza előtt nem indítható |

---

## 2. CR1 — Alap user story függőségek

### EPIC-01: Hitelesítés (alap)

```
US-001 (Google login)
  └─► US-002 (Meghívás + elfogadás)
        └─► US-007 (Felhasználói profil)
              └─► US-160 (Admin: user kezelés)
                    └─► US-161 (Szerepkör-módosítás)
                          └─► US-162 (Inaktiválás)
```

### EPIC-02–10: Pályázati munkafolyamat

```
US-010 (Felhívás létrehozása)
  └─► US-020 (Pályázat létrehozása)
        └─► US-030 (Dokumentum csatolás)
        └─► US-031 (Pályázat beadása)
              └─► US-040 (Eredmény rögzítése: Nyert)
              └─► US-041 (Eredmény rögzítése: Nem nyert → lezárás)
              └─► US-042 (Eredmény rögzítése: Visszavont)
                    └─► US-050 (Értesítő)
                    └─► US-051 (Szerződéskötés pályáztatóval)
                          └─► US-060 (Költési terv)
                                └─► US-070 (Alvállalkozói szerződés)
                                └─► US-080 (Számla + fizetés)
                                      └─► US-090 (Teljesítés igazolás)
                                            └─► US-100 (Elszámolás → CLOSED_WON)
```

### EPIC-11–19: Kereszt-funkcionális

```
US-110 (Dokumentumkezelés)    — párhuzamos US-020-tól
US-120 (E-mail csatolás)       — párhuzamos US-020-tól
US-130 (Megjegyzések)          — párhuzamos US-020-tól
US-140 (Pályáztatók CRUD)      — párhuzamos US-010-től
US-150 (Szerződő cégek CRUD)   — párhuzamos US-010-től
US-155 (Kódszótárak)           — párhuzamos US-010-től
US-170 (Keresés, szűrés)       — US-020 után
US-180 (Értesítések/határidők) — US-010 után (DeadlineCheckJob)
US-190 (Audit napló CR1)       — US-001 után (minden audit-képes akción)
US-163 (Fiók archiválás)       — US-160 után
US-164 (Rendszerjelentés)      — US-020 után
US-165 (Platform beállítások CR1) — US-001 után
```

---

## 3. CR2 — User story szintű függőségek

### 3.1 EPIC-24 → mindent blokkol (Sprint A)

```
US-230 [XL] Single→multi-tenant migráció (DB + Domain)
  ══►  US-223 [L]  JWT scope-claim + audience-szétválasztás
  ══►  US-231 [L]  EF Core global query filterek + BreakGlassExpirationJob
  ══►  US-233 [M]  Audit napló OwnerId/FoundationId kiterjesztés
  ══►  US-221 [M]  Scope-aware meghívási folyamat (BE rész)
```

### 3.2 EPIC-21: Platform adminisztráció (Sprint C) — US-223 után

```
US-223 (JWT scope)
  └─► US-200 [M]  Owner provisioning
  └─► US-203 [M]  Platform user meghívása
  └─► US-204 [S]  Platform technikai beállítások
  └─► US-205 [M]  Platform audit napló
  └─► US-206 [L]  Break-glass grant kiállítása
        └─► US-207 [M]  Break-glass visszavonás/lejárat

US-233 (Audit log kiterjesztés)
  └─► US-205 (Platform audit napló)    ⬅ közvetlen dependency
  └─► US-216 (Owner audit napló)       ⬅ közvetlen dependency

US-201 [S]  Owner felfüggesztés/reaktiválás  — US-200 után
US-202 [S]  Owner archiválása               — US-201 után (legalább 1 aktív cycle)
```

### 3.3 EPIC-22: Owner adminisztráció (Sprint D) — US-230 + US-221-BE után

```
US-230 + US-221-BE (Scope-aware invitation BE)
  └─► US-210 [L]  Foundation létrehozása
        └─► US-211 [M]  Foundation archiválása
        └─► US-212 [M]  FoundationAdmin kinevezése
        └─► US-213 [L]  Owner user meghívás + Foundation assign
        └─► US-214 [M]  Owner kódszótár-sablonok
        └─► US-215 [L]  Cross-foundation dashboard
        └─► US-216 [M]  Owner audit napló
```

### 3.4 EPIC-23: Hatókör-kezelés (Sprint B + E)

```
US-231 (EF query filterek)
  └─► US-222 [L]  Cross-tenant izoláció (ScopeValidationMiddleware, arch teszt)
        └─► US-232 [L]  Architecture + integrációs teszt suite

US-230 + US-223 + US-222
  └─► US-220 [M]  Foundation switcher (BE + FE)

US-221-BE
  └─► US-221-FE [M]  Hatókör-tudatos meghívó elfogadási oldal (Sprint E)
```

### 3.5 Teljes US-szintű függőségi gráf (szöveges)

```
US-230
├─► US-223
│     ├─► US-200 ─► US-201 ─► US-202
│     ├─► US-203
│     ├─► US-204
│     ├─► US-205 ◄─────────────────────── US-233
│     ├─► US-206 ─► US-207
│     └─► US-220
├─► US-231
│     └─► US-222 ─► US-232
├─► US-233
│     └─► US-216
└─► US-221-BE
      ├─► US-203
      ├─► US-210
      │     ├─► US-211
      │     ├─► US-212
      │     ├─► US-213
      │     ├─► US-214
      │     ├─► US-215
      │     └─► US-216
      └─► US-221-FE
```

---

## 4. CR2 — Task szintű függőségek (teljes)

### Sprint CR2-A — Infrastruktúra (BLOKKOLÓ)

Ezek a taskök **blokkolnak minden más CR2 taskot**. Párhuzamosan egymással nem futtathatók (egymásra épülnek).

---

#### `us-230-BE-1` [XL] — Single→multi-tenant migráció

| Mező | Érték |
|---|---|
| **Depends on** | — (nincs CR2 előfeltétel) |
| **Blocks** | us-223-BE-1, us-231-BE-1, us-233-BE-1, us-221-BE-1, és ezen keresztül az összes CR2 task |
| **Párhuzamos** | — |

**Sub-feladatok belső sorrendje:**
```
1. Új Domain entitások + enum-ok (Owner, Foundation, BreakGlassGrant, stb.)
2. AppUser domain bővítés (PlatformRole, OwnerId, FoundationAssignments)
3. IOwnedEntity marker + meglévő entitásokra OwnerId/FoundationId nullable
4. EF konfiguráció fájlok (Owner, Foundation, BreakGlassGrant, OwnerCodeListTemplate)
5. Migration 1: nullable oszlopok hozzáadása
6. Migration 2: seed default Owner + Foundation + backfill
7. Migration 3: NOT NULL + indexek (BreakGlassGrants + Owners + Foundations)
8. Fájl-path séma migráció
```

---

#### `us-223-BE-1` [L] — JWT scope-claim + audience szétválasztás

| Mező | Érték |
|---|---|
| **Depends on** | us-230-BE-1 (Owner/Foundation entitások szükségesek) |
| **Blocks** | us-200-BE-1, us-201-BE-1, us-202-BE-1, us-203-BE-1, us-204-BE-1, us-205-BE-1, us-206-BE-1, us-207-BE-1, us-220-BE-1, us-220-FE-1, us-200-FE-1..us-207-FE-1 |
| **Párhuzamos** | us-231-BE-1, us-233-BE-1, us-221-BE-1 (mind us-230 után) |

**Belső sorrend:**
```
1. ICurrentScopeService interface + CurrentScopeService implementáció
2. JwtTokenService.GenerateTokenForScope() + claim-ek
3. Program.cs: authorization policy regisztrációk
4. ScopeSwitchCommand + Handler
5. GetAvailableScopesQuery + Handler
6. ScopeSwitchController (POST /api/v1/me/scope-switch, GET /api/v1/me/available-scopes)
```

---

#### `us-231-BE-1` [L] — EF Core global query filterek

| Mező | Érték |
|---|---|
| **Depends on** | us-230-BE-1 (IOwnedEntity, OwnerId/FoundationId oszlopok) |
| **Blocks** | us-222-BE-1, us-232-BE-1 |
| **Párhuzamos** | us-223-BE-1, us-233-BE-1, us-221-BE-1 |

**Belső sorrend:**
```
1. ICurrentScopeService DI az AppDbContext konstruktorba
2. HasQueryFilter minden IOwnedEntity-re
3. SaveChangesAsync override: auto OwnerId/FoundationId inject
4. [ScopeBypassAllowed] attribute
5. ScopeValidationMiddleware alap
6. BreakGlassExpirationJob (Hangfire) regisztráció
```

---

#### `us-233-BE-1` [M] — Audit napló kiterjesztés

| Mező | Érték |
|---|---|
| **Depends on** | us-230-BE-1 (OwnerId/FoundationId migration) |
| **Blocks** | us-205-BE-1, us-216-BE-1 |
| **Párhuzamos** | us-223-BE-1, us-231-BE-1, us-221-BE-1 |

**Belső sorrend:**
```
1. AuditLog.OwnerId + AuditLog.FoundationId nullable oszlopok (migration)
2. AuditAction enum: új CR2 értékek (SCOPE_SWITCH, BREAK_GLASS_*, OWNER_*, FOUNDATION_*, SCOPE_VIOLATION)
3. AuditLogger.cs: scope automatikus rögzítés ICurrentScopeService-ből
```

---

### Sprint CR2-B — Tenant-biztonság

Sprint A teljes befejezése után indítható. Taskök egymástól függetlenek (párhuzamosíthatók).

---

#### `us-221-BE-1` [M] — Scope-aware meghívási folyamat (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-230-BE-1 |
| **Blocks** | us-203-BE-1, us-210-BE-1, us-213-BE-1, us-221-FE-1 |
| **Párhuzamos** | us-223-BE-1, us-231-BE-1, us-233-BE-1 (mind Sprint A-ban futhat) |

**Belső sorrend:**
```
1. Invitation entitás bővítés: Scope, OwnerId?, FoundationId?, *Role? mezők + migration
2. InviteCommandHandler: scope-specifikus invitation létrehozás
3. AcceptInvitationCommandHandler: 3 ágú logika (Platform/Owner/Foundation scope)
4. NK-13 cross-Owner validáció
```

---

#### `us-222-BE-1` [L] — Cross-tenant izoláció minden API-végponton

| Mező | Érték |
|---|---|
| **Depends on** | us-231-BE-1 (query filterek megvannak) |
| **Blocks** | us-232-BE-1 |
| **Párhuzamos** | us-221-BE-1 |

**Belső sorrend:**
```
1. ScopeValidationMiddleware finalizálás (break-glass grant ellenőrzés minden kérésen)
2. IOwnedEntity architecture teszt (NetArchTest)
3. IgnoreQueryFilters whitelist teszt
4. Minden controller: [Authorize(Policy = ...)] audit
```

---

#### `us-232-BE-1` [L] — Architecture + integrációs teszt suite

| Mező | Érték |
|---|---|
| **Depends on** | us-222-BE-1, us-231-BE-1, us-223-BE-1, us-221-BE-1 |
| **Blocks** | — (végső validáció, mást nem blokkol) |
| **Párhuzamos** | — |

**Belső sorrend:**
```
1. CrossTenantIsolationFixture: 2 Owner × 2 Foundation Testcontainers setup
2. Cross-tenant isolation tesztek (Application/Granter/Vendor/stb.)
3. Break-glass workflow integrációs tesztek
4. Scope-switch tesztek
5. Scope-claim manipulation security tesztek
6. Architecture tesztek (NetArchTest)
```

---

### Sprint CR2-C — Platform admin + break-glass

Sprint A + us-223-BE-1 után indítható. A sprint taskjai párhuzamosíthatók egymással (kivéve az US-206 → US-207 lánc).

---

#### `us-200-BE-1` [M] — Owner provisioning (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-223-BE-1 (IsPlatformAdmin policy) |
| **Blocks** | us-200-FE-1, us-201-BE-1 |
| **Párhuzamos** | us-203-BE-1, us-204-BE-1, us-205-BE-1, us-206-BE-1 |

---

#### `us-200-FE-1` [M] — Owner lista + létrehozás UI

| Mező | Érték |
|---|---|
| **Depends on** | us-200-BE-1 (API contract: GET/POST /api/v1/platform/owners) |
| **Blocks** | us-201-FE-1, us-202-FE-1 |
| **Párhuzamos** | us-203-FE-1, us-204-FE-1, us-205-FE-1, us-206-FE-1 |

---

#### `us-201-BE-1` [S] — Owner felfüggesztés/reaktiválás (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-200-BE-1 (Owner entitás létezik) |
| **Blocks** | us-201-FE-1, us-202-BE-1 |
| **Párhuzamos** | us-203-BE-1, us-204-BE-1 |

---

#### `us-201-FE-1` [S] — Suspend/Reactivate UI

| Mező | Érték |
|---|---|
| **Depends on** | us-201-BE-1, us-200-FE-1 |
| **Blocks** | us-202-FE-1 |
| **Párhuzamos** | us-203-FE-1, us-204-FE-1 |

---

#### `us-202-BE-1` [S] — Owner archiválás (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-201-BE-1, us-210-BE-1 (Foundation-count service szükséges) |
| **Blocks** | us-202-FE-1 |
| **Párhuzamos** | us-203-BE-1 |

> **Megjegyzés:** us-202-BE-1 megköveteli az `IFoundationCountService`-t, amit us-210-BE-1 vezet be. Ha us-210-BE-1 lassabb, us-202-BE-1 indulhat az interface stub-bal, de az integrációs tesztek us-210 után futtathatók csak.

---

#### `us-202-FE-1` [XS] — Archive gomb UI

| Mező | Érték |
|---|---|
| **Depends on** | us-202-BE-1, us-201-FE-1 |
| **Blocks** | — |
| **Párhuzamos** | — |

---

#### `us-203-BE-1` [M] — Platform user meghívó (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-223-BE-1, us-221-BE-1 (Platform-scope invitation ág) |
| **Blocks** | us-203-FE-1 |
| **Párhuzamos** | us-200-BE-1, us-204-BE-1, us-205-BE-1, us-206-BE-1 |

---

#### `us-203-FE-1` [S] — Platform user lista + invite dialog

| Mező | Érték |
|---|---|
| **Depends on** | us-203-BE-1 |
| **Blocks** | — |
| **Párhuzamos** | us-200-FE-1, us-204-FE-1, us-205-FE-1 |

---

#### `us-204-BE-1` [S] — Platform technikai beállítások (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-223-BE-1 (authorization policies) |
| **Blocks** | us-204-FE-1 |
| **Párhuzamos** | us-200-BE-1, us-203-BE-1, us-205-BE-1, us-206-BE-1 |

---

#### `us-204-FE-1` [S] — Platform settings form

| Mező | Érték |
|---|---|
| **Depends on** | us-204-BE-1 |
| **Blocks** | — |
| **Párhuzamos** | us-200-FE-1, us-203-FE-1, us-205-FE-1 |

---

#### `us-205-BE-1` [M] — Platform audit napló (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-223-BE-1, us-233-BE-1 (OwnerId/FoundationId az AuditLog-ban) |
| **Blocks** | us-205-FE-1 |
| **Párhuzamos** | us-200-BE-1, us-203-BE-1, us-204-BE-1, us-206-BE-1 |

---

#### `us-205-FE-1` [M] — Platform audit log lista + kiemelések

| Mező | Érték |
|---|---|
| **Depends on** | us-205-BE-1 |
| **Blocks** | — |
| **Párhuzamos** | us-200-FE-1, us-203-FE-1, us-204-FE-1, us-206-FE-1 |

---

#### `us-206-BE-1` [L] — Break-glass grant kiállítása (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-223-BE-1 (break-glass JWT generálás), us-231-BE-1 (BreakGlassExpirationJob alap) |
| **Blocks** | us-206-FE-1, us-207-BE-1 |
| **Párhuzamos** | us-200-BE-1, us-203-BE-1, us-204-BE-1, us-205-BE-1 |

---

#### `us-206-FE-1` [M] — Break-glass kiállítás dialog

| Mező | Érték |
|---|---|
| **Depends on** | us-206-BE-1 |
| **Blocks** | us-207-FE-1 |
| **Párhuzamos** | us-200-FE-1..us-205-FE-1 |

---

#### `us-207-BE-1` [M] — Break-glass visszavonás/lejárat (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-206-BE-1 (BreakGlassGrant.Revoke() az Issue() után értelmes) |
| **Blocks** | us-207-FE-1 |
| **Párhuzamos** | FE taskök mind párhuzamosak |

---

#### `us-207-FE-1` [S] — Break-glass lista + visszavonás UI

| Mező | Érték |
|---|---|
| **Depends on** | us-207-BE-1, us-206-FE-1 |
| **Blocks** | — |
| **Párhuzamos** | — |

---

### Sprint CR2-D — Owner admin

Sprint A + us-221-BE-1 után indítható. A legtöbb task párhuzamosan futtatható (kivéve Foundation-lánc).

---

#### `us-210-BE-1` [L] — Foundation létrehozása (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-230-BE-1, us-221-BE-1 (FoundationAdmin invitation ág) |
| **Blocks** | us-210-FE-1, us-211-BE-1, us-212-BE-1, us-213-BE-1, us-214-BE-1, us-215-BE-1, us-216-BE-1, us-202-BE-1 |
| **Párhuzamos** | us-203-BE-1, us-204-BE-1, us-205-BE-1, us-206-BE-1 |

---

#### `us-210-FE-1` [M] — Foundation lista + létrehozás dialog

| Mező | Érték |
|---|---|
| **Depends on** | us-210-BE-1 |
| **Blocks** | us-211-FE-1, us-212-FE-1, us-213-FE-1, us-214-FE-1, us-215-FE-1 |
| **Párhuzamos** | us-200-FE-1..us-207-FE-1 |

---

#### `us-211-BE-1` [M] — Foundation archiválás (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-210-BE-1 |
| **Blocks** | us-211-FE-1 |
| **Párhuzamos** | us-212-BE-1, us-213-BE-1, us-214-BE-1, us-215-BE-1, us-216-BE-1 |

---

#### `us-211-FE-1` [S] — Foundation archive gomb UI

| Mező | Érték |
|---|---|
| **Depends on** | us-211-BE-1, us-210-FE-1 |
| **Blocks** | — |
| **Párhuzamos** | us-212-FE-1, us-213-FE-1, us-214-FE-1 |

---

#### `us-212-BE-1` [M] — FoundationAdmin kinevezése (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-210-BE-1 (Foundation entitás, FoundationUserAssignment) |
| **Blocks** | us-212-FE-1 |
| **Párhuzamos** | us-211-BE-1, us-213-BE-1, us-214-BE-1, us-215-BE-1, us-216-BE-1 |

---

#### `us-212-FE-1` [S] — Admin lista + kinevezés/visszavonás UI

| Mező | Érték |
|---|---|
| **Depends on** | us-212-BE-1, us-210-FE-1 |
| **Blocks** | — |
| **Párhuzamos** | us-211-FE-1, us-213-FE-1, us-214-FE-1 |

---

#### `us-213-BE-1` [L] — Owner user meghívás + Foundation assign (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-210-BE-1, us-221-BE-1 (Owner-scope invitation ág) |
| **Blocks** | us-213-FE-1 |
| **Párhuzamos** | us-211-BE-1, us-212-BE-1, us-214-BE-1, us-215-BE-1, us-216-BE-1 |

---

#### `us-213-FE-1` [L] — Dinamikus Foundation-hozzárendelés form

| Mező | Érték |
|---|---|
| **Depends on** | us-213-BE-1, us-210-FE-1 |
| **Blocks** | — |
| **Párhuzamos** | us-211-FE-1, us-212-FE-1, us-214-FE-1, us-215-FE-1 |

---

#### `us-214-BE-1` [M] — Owner kódszótár-sablonok CRUD (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-210-BE-1 (Foundation entitás az apply-hoz) |
| **Blocks** | us-214-FE-1 |
| **Párhuzamos** | us-211-BE-1, us-212-BE-1, us-213-BE-1, us-215-BE-1, us-216-BE-1 |

---

#### `us-214-FE-1` [M] — Kódszótár-sablon szerkesztő + újra-alkalmazás

| Mező | Érték |
|---|---|
| **Depends on** | us-214-BE-1, us-210-FE-1 |
| **Blocks** | — |
| **Párhuzamos** | us-211-FE-1, us-212-FE-1, us-213-FE-1, us-215-FE-1 |

---

#### `us-215-BE-1` [L] — Cross-foundation dashboard (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-210-BE-1, us-223-BE-1 (Owner-audience scope) |
| **Blocks** | us-215-FE-1 |
| **Párhuzamos** | us-211-BE-1, us-212-BE-1, us-213-BE-1, us-214-BE-1, us-216-BE-1 |

---

#### `us-215-FE-1` [L] — Dashboard kártyák + Foundation-switcher integráció

| Mező | Érték |
|---|---|
| **Depends on** | us-215-BE-1, us-220-FE-1 (Foundation switcher komponens) |
| **Blocks** | — |
| **Párhuzamos** | us-211-FE-1..us-214-FE-1 |

---

#### `us-216-BE-1` [M] — Owner audit napló (BE)

| Mező | Érték |
|---|---|
| **Depends on** | us-210-BE-1, us-233-BE-1 (OwnerId/FoundationId az AuditLog-ban) |
| **Blocks** | us-216-FE-1 |
| **Párhuzamos** | us-211-BE-1, us-212-BE-1, us-213-BE-1, us-214-BE-1, us-215-BE-1 |

---

#### `us-216-FE-1` [M] — Owner audit log lista + BREAK_GLASS kiemelés

| Mező | Érték |
|---|---|
| **Depends on** | us-216-BE-1, us-210-FE-1 |
| **Blocks** | — |
| **Párhuzamos** | us-211-FE-1..us-215-FE-1 |

---

### Sprint CR2-E — Foundation switcher + meghívási flow UI

Sprint A + B befejezése után indítható (us-223, us-222 szükséges). A két task párhuzamos.

---

#### `us-220-BE-1` [M] — Foundation switcher endpoint véglegesítés + audit

| Mező | Érték |
|---|---|
| **Depends on** | us-223-BE-1 (ScopeSwitchCommand alap), us-222-BE-1 (cross-tenant izolációval konzisztens) |
| **Blocks** | us-220-FE-1, us-215-FE-1 |
| **Párhuzamos** | us-221-FE-1 |

---

#### `us-220-FE-1` [L] — Foundation switcher dropdown komponens

| Mező | Érték |
|---|---|
| **Depends on** | us-220-BE-1 |
| **Blocks** | us-215-FE-1 |
| **Párhuzamos** | us-221-FE-1 |

---

#### `us-221-FE-1` [M] — Hatókör-tudatos meghívó elfogadási oldal

| Mező | Érték |
|---|---|
| **Depends on** | us-221-BE-1 (Invitation.Scope mező és elfogadás logika) |
| **Blocks** | — |
| **Párhuzamos** | us-220-BE-1, us-220-FE-1 |

---

## 5. Végrehajtási sorrend és párhuzamosíthatóság

### Sprint-szintű végrehajtási sorrend

```
CR2-Sprint A (szekvenciális belül, blokkol mindenkit)
    us-230-BE-1  [XL]  ─────────────────────────────────► KÉSZ
        │
        ├── us-223-BE-1  [L]   ┐
        ├── us-231-BE-1  [L]   ├── párhuzamosak
        ├── us-233-BE-1  [M]   │   us-230 után
        └── us-221-BE-1  [M]   ┘
                │
                ▼
CR2-Sprint B (us-231 és us-221-BE után)
    us-222-BE-1  [L]   ┐
    us-232-BE-1  [L]   ┘  (us-232 us-222 után)

CR2-Sprint C (us-223 után) ◄─── párhuzamos Sprint D-vel
    us-200-BE-1  ─► us-200-FE-1
    us-201-BE-1  ─► us-201-FE-1
    us-202-BE-1  ─► us-202-FE-1
    us-203-BE-1  ─► us-203-FE-1
    us-204-BE-1  ─► us-204-FE-1
    us-205-BE-1  ─► us-205-FE-1
    us-206-BE-1  ─► us-206-FE-1
                  └─► us-207-BE-1 ─► us-207-FE-1

CR2-Sprint D (us-221-BE + us-230 után) ◄─── párhuzamos Sprint C-vel
    us-210-BE-1  ─► us-210-FE-1
                 ─► us-211-BE-1 ─► us-211-FE-1
                 ─► us-212-BE-1 ─► us-212-FE-1
                 ─► us-213-BE-1 ─► us-213-FE-1
                 ─► us-214-BE-1 ─► us-214-FE-1
                 ─► us-215-BE-1 ─► us-215-FE-1  ◄── us-220-FE-1 kell!
                 ─► us-216-BE-1 ─► us-216-FE-1

CR2-Sprint E (us-222 + us-223 + us-221-BE után)
    us-220-BE-1  ─► us-220-FE-1   ┐ párhuzamosak
    us-221-FE-1                    ┘
```

### Párhuzamosítási lehetőségek összefoglalva

| Sprint | Párhuzamos csoportok |
|---|---|
| CR2-A | us-230 szükséges; utána us-223, us-231, us-233, us-221-BE egyszerre |
| CR2-B | us-222 után us-232 (szekvenciális pár) |
| CR2-C és CR2-D | **teljesen párhuzamos** egymással (us-223 ill. us-221-BE előfeltétel megvan) |
| CR2-C belül | us-200..us-206 BE taskök párhuzamosak; us-206 → us-207 szekvenciális |
| CR2-D belül | us-210-BE-1 után az összes D-sprint BE task párhuzamos; us-215-FE-1 us-220-FE-1-re vár |
| CR2-E | us-220 és us-221-FE párhuzamos |

### Fejlesztői csapat javasolt elosztás (4 fős team)

```
Dev A (BE senior):  us-230 → us-223 → us-206 → us-207
Dev B (BE):         us-231 → us-222 → us-210 → us-215
Dev C (BE):         us-233 → us-221-BE → us-213 → us-216
Dev D (BE):         (Sprint A segítség) → us-200 → us-201 → us-202

FE Dev A:           us-200-FE → us-201-FE → us-202-FE → us-220-FE
FE Dev B:           us-210-FE → us-211-FE → us-213-FE → us-215-FE
FE Dev C:           us-203-FE → us-204-FE → us-205-FE → us-221-FE
FE Dev D:           us-206-FE → us-207-FE → us-212-FE → us-214-FE → us-216-FE
```

---

## 6. Blokkolt ticketek összesítő

### Mi blokkolja us-230-BE-1 kész állapota?

**Összes CR2 task** — amíg us-230-BE-1 nincs Done, egyetlen CR2 task sem indítható el.

### Mi blokkolja us-223-BE-1 kész állapota?

| Blokkolt task | Reason |
|---|---|
| us-200-BE-1..us-207-BE-1 | IsPlatformAdmin, CanReadPlatform policy szükséges |
| us-220-BE-1 | ScopeSwitchCommand véglegesítés |
| us-200-FE-1..us-207-FE-1 | BE API contract szükséges a FE-nek |

### Mi blokkolja us-231-BE-1 kész állapota?

| Blokkolt task | Reason |
|---|---|
| us-222-BE-1 | ScopeValidationMiddleware, query filter audit |
| us-232-BE-1 | Integrációs teszt suite feltételezi a filter működését |

### Mi blokkolja us-221-BE-1 kész állapota?

| Blokkolt task | Reason |
|---|---|
| us-203-BE-1 | Platform-scope invitation ág az AcceptInvitation handlerben |
| us-210-BE-1 | FoundationAdmin invitation az Owner-scope ágban |
| us-213-BE-1 | Owner-user invitation + Foundation assignment logika |
| us-221-FE-1 | FE az elfogadási oldalt a Scope mezőre támaszkodik |

### Mi blokkolja us-210-BE-1 kész állapota?

| Blokkolt task | Reason |
|---|---|
| us-211-BE-1 | Foundation.Archive() a Foundation entitáson van |
| us-212-BE-1 | FoundationUserAssignment CRUD |
| us-213-BE-1 | Foundation-hozzárendelés az invitation elfogadásakor |
| us-214-BE-1 | apply-to-foundation a Foundation entitásra mutat |
| us-215-BE-1 | Cross-foundation query Foundationöket listáz |
| us-216-BE-1 | Owner audit log scope-hoz FoundationId kell |
| us-202-BE-1 | IFoundationCountService Foundation entitásokat számolja |
| us-210-FE-1..us-216-FE-1 | Minden Owner-admin FE task |

### Mi blokkolja us-206-BE-1 kész állapota?

| Blokkolt task | Reason |
|---|---|
| us-207-BE-1 | Revoke() az Issue() után értelmes |
| us-206-FE-1 | FE az issue endpoint-ot hívja |
| us-207-FE-1 | FE a revoke endpoint-ot hívja |

### Mi blokkolja us-220-BE-1 kész állapota?

| Blokkolt task | Reason |
|---|---|
| us-220-FE-1 | Foundation switcher FE a BE endpoint-ot hívja |
| us-215-FE-1 | Dashboard "Belépés" gomb a switchert hívja |

---

## 7. FE task blokkolók (BE contract dependency)

Minden FE task blokkolt a saját BE párjától. Az alábbi táblázat a konkrét API contract függőségeket mutatja.

| FE Task | Blokkolt BE | Szükséges API végpont(ok) |
|---|---|---|
| us-200-FE-1 | us-200-BE-1 | `GET/POST /api/v1/platform/owners` |
| us-201-FE-1 | us-201-BE-1 | `POST /api/v1/platform/owners/{id}/suspend`, `.../reactivate` |
| us-202-FE-1 | us-202-BE-1 | `DELETE /api/v1/platform/owners/{id}` |
| us-203-FE-1 | us-203-BE-1 | `POST /api/v1/platform/users/invite` |
| us-204-FE-1 | us-204-BE-1 | `GET/PATCH /api/v1/platform/settings` |
| us-205-FE-1 | us-205-BE-1 | `GET /api/v1/platform/audit-logs`, `.../export` |
| us-206-FE-1 | us-206-BE-1 | `POST /api/v1/platform/break-glass` |
| us-207-FE-1 | us-207-BE-1 | `DELETE /api/v1/platform/break-glass/{id}`, `GET /api/v1/platform/break-glass` |
| us-210-FE-1 | us-210-BE-1 | `GET/POST /api/v1/owner/foundations` |
| us-211-FE-1 | us-211-BE-1 | `DELETE /api/v1/owner/foundations/{id}` |
| us-212-FE-1 | us-212-BE-1 | `POST/DELETE /api/v1/owner/foundations/{id}/admins/{userId}` |
| us-213-FE-1 | us-213-BE-1 | `POST /api/v1/owner/users/invite`, `POST .../assign` |
| us-214-FE-1 | us-214-BE-1 | `GET/POST/PUT/DELETE /api/v1/owner/code-list-templates`, `.../apply-to-foundation` |
| us-215-FE-1 | us-215-BE-1, us-220-FE-1 | `GET /api/v1/owner/dashboard` + switcher komponens |
| us-216-FE-1 | us-216-BE-1 | `GET /api/v1/owner/audit-logs`, `.../export` |
| us-220-FE-1 | us-220-BE-1 | `POST /api/v1/me/scope-switch`, `GET /api/v1/me/available-scopes` |
| us-221-FE-1 | us-221-BE-1 | `GET /api/v1/invitations/{token}` (Scope mező), `POST .../accept` |

---

## 8. Kritikus útvonal

A projekt **kritikus útja** (Critical Path) — ezek késedelme a teljes CR2 ütemtervet csúsztatja:

```
us-230-BE-1 [XL]
    → us-223-BE-1 [L]
        → us-210-BE-1 [L]
            → us-215-BE-1 [L]
                → us-220-BE-1 [M]
                    → us-220-FE-1 [L]
                        → us-215-FE-1 [L]
```

**Becsült kritikus útvonal időigénye:** XL + L + L + L + M + L + L = ~5-6 sprint hét (párhuzamosítás nélkül)

### Kockázati pontok

| Kockázat | Task | Hatás |
|---|---|---|
| us-230-BE-1 csúszás | Adatmigrációs komplexitás, 3-fázisú migráció | Minden CR2 task blokkolt |
| us-210-BE-1 csúszás | Foundation entitás + FoundationAdmin invitation | Sprint D összes taskja blokkolt |
| us-220-FE-1 csúszás | Foundation switcher shared komponens | us-215-FE-1 blokkolt |
| NK-13 cross-Owner validáció | us-221-BE-1, us-203-BE-1 | Adatintegritási kockázat ha kimarad |
| BreakGlass JWT vs Grant lejárat | us-206/207-BE-1, us-231-BE-1 | ScopeValidationMiddleware-re támaszkodik |

---

## Appendix — CR1 → CR2 érintkezési pontok

A következő CR1 taskök módosulnak CR2 során (migration során érintett):

| CR1 entitás/komponens | CR2 módosítás | Érintett task |
|---|---|---|
| `AppUser` | PlatformRole, OwnerId, FoundationAssignments | us-230-BE-1 |
| `Application` | OwnerId (Guid), FoundationId (Guid) | us-230-BE-1 |
| `Granter` | OwnerId (Guid), FoundationId (Guid) | us-230-BE-1 |
| `Vendor` | OwnerId (Guid), FoundationId (Guid) | us-230-BE-1 |
| `CodeList` | OwnerId (Guid), FoundationId (Guid) | us-230-BE-1 |
| `AuditLog` | OwnerId (Guid?), FoundationId (Guid?) | us-233-BE-1 |
| `AuditAction` enum | 12 új érték | us-233-BE-1 |
| `Invitation` | Scope, OwnerId?, FoundationId?, *Role? | us-221-BE-1 |
| `AppDbContext` | global query filterek, ICurrentScopeService DI | us-231-BE-1 |
| `JwtTokenService` | scope-aware token generálás | us-223-BE-1 |
| `AuditLogger` | auto scope rögzítés | us-233-BE-1 |
| `GoogleLoginCommandHandler` | Owner.Status != Suspended check | us-201-BE-1 |
| `AcceptInvitationCommandHandler` | 3 ágú scope logika | us-221-BE-1 |
| `DeadlineCheckJob` | Foundation-scope filter | us-231-BE-1 |
