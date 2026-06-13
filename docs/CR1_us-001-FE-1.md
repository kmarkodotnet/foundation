# CR1_us-001-FE-1 | FE: Google bejelentkezés – meghívó-ellenőrzés UI delta (US-001 delta)

**Story:** US-001 | [Auth] Google-fiókkal való bejelentkezés (módosítás)  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Frontend  
**Type:** MODIFICATION — meglévő us-001-FE-1.md deltája  
**Priority:** Magas  
**Size estimate:** XS  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-006-FE-1.md (no-invitation hibaüzenet kezelés LoginComponent-ben)  
**Blocks:** —

---

## Story

> Mint **bejelentkezett felhasználó**, szeretnék Google-fiókommal bejelentkezni, és ha nincs meghívóm, egyértelmű hibaüzenetet kapni.

---

## Scope

Ez a feladat az `us-001-FE-1.md` elfogadási kritériumainak frissítését és az ahhoz tartozó tesztek módosítását dokumentálja. A tényleges kódváltoztatás a `CR1_us-006-FE-1.md`-ben történt (OidcCallbackComponent + LoginComponent). Ez a task a traceability és a tesztlista naprakészen tartása céljából létezik.

---

## Implementation Checklist

### Nincs önálló kódváltoztatás

Az érdemi implementáció a `CR1_us-006-FE-1.md`-ben szerepel. Az alábbi tesztfrissítések szükségesek az `us-001-FE-1.md` tesztjeihez képest:

### Unit Tests frissítése
- [ ] `OidcCallbackComponentTests` — törlendő teszt: `"első sikeres bejelentkezés → AppUser Megtekintő szerepkörrel jön létre"` *(ez a CR1_us-006-FE-1-ben kerül felváltásra)*
- [ ] `LoginComponentTests` — törlendő teszt: `"regisztrációs link látható"` *(nincs regisztrációs opció a meghívásos modellben)*

### Integration / E2E tesztek frissítése
- [ ] TS-002 frissítése (e2e): meghívó nélküli belépési kísérlet visszautasítása *(ld. e2e/tests/01-auth/auth.spec.ts — már frissítve)*

---

## Acceptance Criteria (frissített)

- [ ] AC1: A bejelentkezési oldalon megjelenik a „Bejelentkezés Google-fiókkal" gomb. *(változatlan)*
- [ ] AC2: A gombra kattintva Google OAuth 2.0 folyamat indul. *(változatlan)*
- [ ] AC3: Sikeres hitelesítés után, ha az email-hez létezik aktív fiók, a felhasználó átkerül a főoldalra. *(módosított — meghívó-ellenőrzés után)*
- [ ] AC4: Ha a bejelentkező Google-fiók email cím nem rendelkezik aktív, elfogadott fiókkal → hibaüzenet: „Hozzáféréshez meghívó szükséges." *(módosított — régi auto-create AC helyett)*
- [ ] AC5: Inaktív fiók esetén: „A fiókod inaktív. Kérj segítséget az adminisztrátortól." *(változatlan)*
- [ ] AC6: Munkamenet 8 óra inaktivitás után lejár. *(változatlan)*
- [ ] AC7: Meghívó nélküli belépési kísérlet nem hoz létre új felhasználót az UI oldalon sem. *(ÚJ — az `/api/v1/users/me` nem hívódik meg)*

---

## Notes

- Ez a task logikai elválasztás céljából létezik (traceability), de az érdemi kódváltoztatás a `CR1_us-006-FE-1.md` tartalmazza.
- A korábbi `us-001-FE-1.md` tesztek közül az első bejelentkezés automatikus Megtekintő szerepkör-létrehozásra vonatkozó tesztek törlendők.
