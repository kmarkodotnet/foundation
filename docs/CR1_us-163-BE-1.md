# CR1_us-163-BE-1 | BE: SystemSettings – DefaultUserRole eltávolítása, InvitationExpiryHours hozzáadása

**Story:** US-163 | [Admin] Rendszerbeállítások kezelése (módosítás)  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Backend  
**Type:** MODIFICATION — meglévő us-163-BE-1.md feladaton felüli delta  
**Priority:** Közepes  
**Size estimate:** S  
**Sprint:** Sprint 1  
**Depends on:** us-163-BE-1.md (SystemSettings entitás megléte)  
**Blocks:** CR1_us-164-BE-1.md (expiryHours értéke innen olvasódik), CR1_us-163-FE-1.md

---

## Story

> Mint **adminisztrátor**, szeretném módosítani a rendszer alap beállításait, hogy a meghívó érvényességi ideje is konfigurálható legyen.

---

## Scope

A `SystemSettings` entitás és DTO-k módosítása: `DefaultUserRole` mező törlése (értelmetlenné vált a meghívásos modellben), `InvitationExpiryHours` mező hozzáadása. Ez egy delta feladat — az alap SystemSettings implementáció (us-163-BE-1) már létezik.

---

## Implementation Checklist

### Domain Layer (`GrantManagement.Domain`)
- [ ] `Domain/Entities/SystemSettings.cs` módosítása:
  - `DefaultUserRole` property **törlése**
  - `InvitationExpiryHours` property hozzáadása: `int InvitationExpiryHours` (default: 72)

### Application Layer (`GrantManagement.Application`)
- [ ] `Application/Admin/DTOs/SystemSettingsDto.cs` (vagy `SystemSettingsResponse.cs`) módosítása:
  - `DefaultUserRole` mező **törlése**
  - `InvitationExpiryHours` mező hozzáadása: `int InvitationExpiryHours`
- [ ] `Application/Admin/Commands/UpdateSystemSettings/UpdateSystemSettingsCommand.cs` módosítása:
  - `DefaultUserRole` **törlése**
  - `InvitationExpiryHours` hozzáadása: `int InvitationExpiryHours`
- [ ] `UpdateSystemSettingsCommandValidator.cs` módosítása:
  - `DefaultUserRole` validáció **törlése**
  - `InvitationExpiryHours`: `InclusiveBetween(1, 168)` (1 óra – 7 nap)
- [ ] AutoMapper profil frissítése

### Infrastructure Layer (`GrantManagement.Infrastructure`)
- [ ] Migration: `dotnet ef migrations add CR1_SystemSettings_InvitationExpiry`
  - `DefaultUserRole` oszlop DROP
  - `InvitationExpiryHours` oszlop ADD (int, default 72, NOT NULL)
- [ ] Ha seed adat volt a `DefaultUserRole`-hoz, az is törlendő

---

## API Contract (delta)

### GET /api/v1/system-settings — Response változás

Törlendő mező:
```json
"defaultUserRole": "Megtekinto"   ← TÖRLENDŐ
```

Hozzáadandó mező:
```json
"invitationExpiryHours": 72        ← ÚJ
```

### PUT /api/v1/system-settings — Request változás

Törlendő mező: `defaultUserRole`  
Hozzáadandó mező: `invitationExpiryHours` (int, 1–168)

---

## FluentValidation Rules (delta)

| Field | Rule | Error message |
|---|---|---|
| `InvitationExpiryHours` | `InclusiveBetween(1, 168)` | "A meghívó érvényességi ideje 1–168 óra között lehet." |
| `InvitationExpiryHours` | `NotEmpty()` | "Az érvényességi idő megadása kötelező." |

---

## Required Tests

### Unit Tests
- [ ] `UpdateSystemSettingsCommandValidatorTests` — `InvitationExpiryHours = 0` → hiba
- [ ] `UpdateSystemSettingsCommandValidatorTests` — `InvitationExpiryHours = 169` → hiba
- [ ] `UpdateSystemSettingsCommandValidatorTests` — `InvitationExpiryHours = 72` → OK
- [ ] `UpdateSystemSettingsCommandValidatorTests` — `DefaultUserRole` mező már nem létezik a commandban (compile-time)

### Integration Tests
- [ ] `SystemSettingsEndpointTests` — GET válasz tartalmazza `invitationExpiryHours`, NEM tartalmazza `defaultUserRole`
- [ ] `SystemSettingsEndpointTests` — PUT `invitationExpiryHours = 0` → 422
- [ ] `SystemSettingsEndpointTests` — PUT `invitationExpiryHours = 48` → 200, DB-ben 48

**Coverage:** ≥80%.

---

## Acceptance Criteria

- [ ] AC1: A Rendszerbeállítások oldal tartalmazza a „Meghívó érvényességi ideje" mezőt (default: 72).
- [ ] AC2: Az „Alapértelmezett szerepkör" beállítás eltűnik az UI-ból és az API-ból.
- [ ] AC3: Mentés után az új érvényességi idő az új meghívókra érvényes.
- [ ] AC4: 0 vagy 169+ értéknél validációs hiba.
