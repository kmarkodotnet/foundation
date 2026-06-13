# CR1_us-006-FE-1 | FE: Login oldal – meghívó nélküli belépés hibaüzenet kezelése

**Story:** US-006 | [Auth] Meghívó-alapú belépési feltétel érvényesítése  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Frontend  
**Priority:** Magas  
**Size estimate:** S  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-006-BE-1.md (403 + detail: "no-invitation" végpont)  
**Blocks:** CR1_us-001-FE-1.md

---

## Story

> Mint **rendszer**, szeretném megakadályozni, hogy meghívó nélküli Google-fiókkal bárki hozzáférjen a rendszerhez, és a felhasználó egyértelmű tájékoztatást kapjon.

---

## Scope

Az `OidcCallbackComponent` módosítása a `no-invitation` 403 eset kezelésére. A `LoginComponent` frissítése az új `?error=no-invitation` query param megjelenítéséhez. A bejelentkezési oldalon ne legyen regisztrációs opció.

---

## Implementation Checklist

### OidcCallbackComponent módosítása
- [ ] `src/app/core/auth/oidc-callback/oidc-callback.component.ts` módosítása:

  **Meglévő hiba-kezelés (megtartandó):**
  ```typescript
  if (error.status === 403 && detail === 'inactive') {
    router.navigate(['/login'], { queryParams: { error: 'inactive' } });
  }
  ```

  **Új ág hozzáadása:**
  ```typescript
  if (error.status === 403 && detail === 'no-invitation') {
    router.navigate(['/login'], { queryParams: { error: 'no-invitation' } });
  }
  ```

  - A `detail` értéket a 403-as válasz body `detail` mezőjéből kell kiolvasni
  - Fallback: ha 403 de ismeretlen detail → `/login?error=auth_failed`

### LoginComponent módosítása
- [ ] `src/app/core/auth/login/login.component.ts`:
  - `error` signal/property bővítése `'no-invitation'` értékkel
  - `getErrorMessage()` metódus frissítése:
    ```typescript
    case 'no-invitation':
      return 'Hozzáféréshez meghívó szükséges. Kérj segítséget az adminisztrátortól.';
    ```
- [ ] `src/app/core/auth/login/login.component.html`:
  - Az `[role="alert"]` div az összes error-type-hoz megjelenik (nincs template-változtatás szükséges ha signal-alapú)
  - Nincs „Regisztráció" link vagy gomb az oldalon

### AuthService módosítása (ha szükséges)
- [ ] `auth.service.ts` — ha a `handleGoogleCallback()` dob hibát, a hívónak adja tovább a strukturált error body-t, ne csak a HTTP status kódot

---

## UX / Behaviour Specification

| Scenario | Expected behaviour |
|---|---|
| 403 + `detail: "no-invitation"` | OidcCallback → `/login?error=no-invitation` |
| `/login?error=no-invitation` | Alert box: „Hozzáféréshez meghívó szükséges. Kérj segítséget az adminisztrátortól." |
| `/login?error=inactive` | Alert box: „A fiókod inaktív. Kérj segítséget az adminisztrátortól." *(változatlan)* |
| Bejelentkezési oldal általánosan | Nincs regisztrációs link vagy gomb |

---

## Required Tests

### Unit Tests
- [ ] `OidcCallbackComponentTests` — 403 + `detail: "no-invitation"` → navigál `/login?error=no-invitation`-ra
- [ ] `OidcCallbackComponentTests` — 403 + `detail: "inactive"` → navigál `/login?error=inactive`-ra *(meglévő, változatlan)*
- [ ] `OidcCallbackComponentTests` — 403 ismeretlen detail → navigál `/login?error=auth_failed`-re
- [ ] `LoginComponentTests` — `?error=no-invitation` query param esetén a helyes szöveg jelenik meg az alertben
- [ ] `LoginComponentTests` — a login oldal nem tartalmaz regisztrációs elemet

**Coverage:** ≥80% az érintett komponenseken.

---

## Acceptance Criteria

- [ ] AC1: 403 + `detail: "no-invitation"` → OidcCallback `/login?error=no-invitation`-ra irányít.
- [ ] AC2: `/login?error=no-invitation` URL-n megjelenik: „Hozzáféréshez meghívó szükséges. Kérj segítséget az adminisztrátortól."
- [ ] AC3: A hibaüzenet után a Bejelentkezés gomb látható (újrapróbálkozás lehetséges).
- [ ] AC4: A bejelentkezési oldalon nincs regisztrációs lehetőség.
- [ ] AC5: Az `inactive` hibaüzenet kezelése változatlan marad.
