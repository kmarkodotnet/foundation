# CR1_us-007-FE-1 | FE: Meghívó elfogadása oldal – `/auth/accept` flow

**Story:** US-007 | [Auth] Meghívó elfogadása és fiók aktiválása  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Frontend  
**Priority:** Magas  
**Size estimate:** M  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-007-BE-1.md (POST /auth/accept-invitation végpont)  
**Blocks:** —

---

## Story

> Mint **meghívott felhasználó**, szeretnék a kapott meghívó linken keresztül regisztrálni a rendszerbe, hogy hozzáférhessem az alkalmazáshoz a számomra előre beállított szerepkörrel.

---

## Scope

Új `AcceptInvitationComponent` létrehozása a `/auth/accept` útvonalon. A meghívó tokenből és Google OAuth callback kódból felépíti a kérést, elküldi a `POST /auth/accept-invitation` végpontnak, majd siker esetén a főoldalra, hiba esetén a login oldalra irányít a megfelelő hibaüzenettel.

---

## Implementation Checklist

### Routing
- [ ] `src/app/core/auth/auth.routes.ts` (vagy az app routing) frissítése:
  ```typescript
  { path: 'auth/accept', component: AcceptInvitationComponent }
  ```
  - `canActivate`: nem kell (anonimous route)
  - A Google OAuth `redirect_uri`-nak erre az útvonalra kell mutatnia a meghívó elfogadásakor

### AcceptInvitationComponent
- [ ] `src/app/core/auth/accept-invitation/accept-invitation.component.ts` létrehozása:
  - `ngOnInit`-ban kiolvasni a query paramétereket:
    - `code` — Google authorization code
    - `state` — tartalmazza az `invitationToken`-t (base64/JSON csomagolva)
    - `error` — ha Google visszaad hibát
  - Ha `error` query param van: navigálás `/login?error=auth_failed`-re
  - Ha `code` és `invitationToken` megvan: `AuthService.acceptInvitation(code, redirectUri, invitationToken)` hívása
  - Siker: JWT tárolása, navigálás `/dashboard`-ra
  - Hiba kezelése:
    - 410 + `detail: "invitation-expired"` → `/login?error=invitation-expired`
    - 410 + `detail: "invitation-revoked"` → `/login?error=invitation-revoked`
    - 409 + `detail: "invitation-already-accepted"` → `/login?error=invitation-already-accepted`
    - 422 + `detail: "email-mismatch"` → `/login?error=email-mismatch`
    - egyéb hiba → `/login?error=auth_failed`
  - Betöltési állapot: spinner megjelenítése az API hívás alatt
- [ ] `src/app/core/auth/accept-invitation/accept-invitation.component.html`:
  - Loading spinner teljes képernyőn
  - Nincs form — automatikus feldolgozás

### AuthService módosítása
- [ ] `src/app/core/auth/auth.service.ts`:
  - `acceptInvitation(authorizationCode: string, redirectUri: string, invitationToken: string): Observable<AuthResult>` metódus hozzáadása
  - `POST /api/v1/auth/accept-invitation` hívása
  - Visszaad: `AuthResult` (accessToken, expiresIn, user)
  - JWT tárolás: azonos logika mint a `handleGoogleCallback()`-ban

### LoginComponent hibaüzenetek bővítése
- [ ] `src/app/core/auth/login/login.component.ts`:
  - `getErrorMessage()` metódus bővítése:
    ```typescript
    case 'invitation-expired':
      return 'A meghívó lejárt. Kérj új meghívót az adminisztrátortól.';
    case 'invitation-revoked':
      return 'A meghívód vissza lett vonva. Kérj segítséget az adminisztrátortól.';
    case 'invitation-already-accepted':
      return 'Ez a meghívó már korábban el lett fogadva. Próbálj bejelentkezni.';
    case 'email-mismatch':
      return 'A Google-fiókod email-je nem egyezik a meghívóban szereplő email-lel.';
    ```

### Google OAuth redirect_uri kezelés
- [ ] `src/app/core/auth/auth.service.ts` — `startGoogleLogin()` metódus:
  - Ha `invitationToken` paraméter van jelen (pl. URL-ben): a redirect_uri legyen `/auth/accept`
  - Különben marad `/auth/callback` (normál login flow)
  - Az `invitationToken`-t a `state` paraméterbe kell csomagolni (JSON, base64 encode)
  ```typescript
  startGoogleLoginForInvitation(invitationToken: string): void {
    const state = btoa(JSON.stringify({ invitationToken }));
    // Google OAuth URL összerakása state paraméterrel
  }
  ```

### InvitationLandingComponent (opcionális közbülső oldal)
- [ ] `src/app/core/auth/invitation-landing/invitation-landing.component.ts` (opcionális):
  - Az `/invite/:token` URL-en fogadja a meghívó linkeket
  - Megjeleníti: „[Név], meghívtak az alkalmazásba. Kattints a Google-bejelentkezéshez."
  - Gomb: „Bejelentkezés Google-fiókkal" → `startGoogleLoginForInvitation(token)`
  - Ez egy UX-javítás, az AC-k teljesítéséhez nem kötelező

---

## UX / Behaviour Specification

| Scenario | Expected behaviour |
|---|---|
| Meghívó link megnyitása (`/invite/:token`) | Közbülső oldal VAGY közvetlen Google OAuth indítás |
| Google OAuth sikeres callback → `/auth/accept?code=...&state=...` | AcceptInvitationComponent feldolgoz, 200 OK → főoldal |
| 410 + `detail: "invitation-expired"` | `/login?error=invitation-expired` + hibaüzenet |
| 410 + `detail: "invitation-revoked"` | `/login?error=invitation-revoked` + hibaüzenet |
| 409 + `detail: "invitation-already-accepted"` | `/login?error=invitation-already-accepted` + hibaüzenet |
| 422 + `detail: "email-mismatch"` | `/login?error=email-mismatch` + hibaüzenet |
| Google visszaad `error` query param-ot | `/login?error=auth_failed` |

---

## Required Tests

### Unit Tests
- [ ] `AcceptInvitationComponentTests` — sikeres flow → navigál `/dashboard`-ra
- [ ] `AcceptInvitationComponentTests` — 410 + `detail: "invitation-expired"` → navigál `/login?error=invitation-expired`-re
- [ ] `AcceptInvitationComponentTests` — 410 + `detail: "invitation-revoked"` → navigál `/login?error=invitation-revoked`-re
- [ ] `AcceptInvitationComponentTests` — 409 + `detail: "invitation-already-accepted"` → navigál `/login?error=invitation-already-accepted`-re
- [ ] `AcceptInvitationComponentTests` — 422 + `detail: "email-mismatch"` → navigál `/login?error=email-mismatch`-re
- [ ] `AcceptInvitationComponentTests` — Google `error` query param → navigál `/login?error=auth_failed`-re
- [ ] `AuthServiceTests` — `acceptInvitation()` POST kérés helyes payload-dal
- [ ] `LoginComponentTests` — `?error=invitation-expired` → helyes szöveg az alertben
- [ ] `LoginComponentTests` — `?error=email-mismatch` → helyes szöveg az alertben

**Coverage:** ≥80% az érintett komponenseken.

---

## Acceptance Criteria

- [ ] AC1: A meghívó linkre kattintva Google OAuth folyamat indul a helyes `redirect_uri`-val.
- [ ] AC2: Sikeres Google hitelesítés + helyes token + egyező email → főoldalra irányít, JWT tárolva.
- [ ] AC3: Lejárt token → LoginComponent: „A meghívó lejárt. Kérj új meghívót az adminisztrátortól."
- [ ] AC4: Email eltérés → LoginComponent: „A Google-fiókod email-je nem egyezik a meghívóban szereplő email-lel."
- [ ] AC5: Visszavont token → LoginComponent megfelelő hibaüzenettel.
- [ ] AC6: Már elfogadott token → LoginComponent megfelelő hibaüzenettel.
- [ ] AC7: A feldolgozás alatt spinner látható (felhasználói visszajelzés).
