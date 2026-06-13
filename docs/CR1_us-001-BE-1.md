# CR1_us-001-BE-1 | BE: GoogleLoginCommandHandler – auto-create eltávolítása (US-001 delta)

**Story:** US-001 | [Auth] Google-fiókkal való bejelentkezés (módosítás)  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Backend  
**Type:** MODIFICATION — meglévő us-001-BE-1.md felülírja a handler logikáját  
**Priority:** Magas  
**Size estimate:** XS  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-006-BE-1.md (NoInvitationException és handler módosítás elvégzése)  
**Blocks:** CR1_us-001-FE-1.md

---

## Story

> Mint **bejelentkezett felhasználó**, szeretnék Google-fiókommal bejelentkezni, és ha nincs meghívóm, egyértelmű hibaüzenetet kapni.

---

## Scope

Ez a feladat az `us-001-BE-1.md` elfogadási kritériumainak frissítését és az ahhoz tartozó tesztek módosítását dokumentálja a CR1_us-006-BE-1 handler-változása után. Kódváltoztatás nincs — a tényleges implementáció a CR1_us-006-BE-1-ben történt.

---

## Implementation Checklist

### Application Layer — Tesztek frissítése
- [ ] `GoogleLoginCommandHandlerTests` — AC4 teszt **törlése**: `"new Google user → AppUser created with role Megtekinto"`
- [ ] `GoogleLoginCommandHandlerTests` — AC4 helyett **új teszt**: `"unknown email → throws NoInvitationException"` (ez CR1_us-006-BE-1-ben van, itt csak referencia)
- [ ] AC7 tesztje hozzáadása: `"failed login attempt is logged with email and IP"`

### API Layer — Tesztek frissítése
- [ ] `AuthEndpointTests` — AC4 teszt módosítása: meghívó nélkül → 403 `detail: "no-invitation"` (nem auto-create)
- [ ] AC7 integrációs teszt: Serilog structured log tartalmazza `"no-invitation-attempt"` event-et ismeretlen email esetén

---

## Acceptance Criteria (frissített)

- [ ] AC1: A bejelentkezési oldalon megjelenik a „Bejelentkezés Google-fiókkal" gomb. *(változatlan)*
- [ ] AC2: A gombra kattintva Google OAuth 2.0 folyamat indul. *(változatlan)*
- [ ] AC3: Sikeres hitelesítés után, ha az email-hez létezik aktív fiók, a felhasználó átkerül a főoldalra. *(módosított)*
- [ ] AC4: Ha a bejelentkező Google-fiók email cím nem rendelkezik aktív, elfogadott fiókkal → 403 `detail: "no-invitation"`. *(módosított — régi auto-create AC helyett)*
- [ ] AC5: Inaktív fiók esetén: „A fiókod inaktív. Kérj segítséget az adminisztrátortól." *(változatlan)*
- [ ] AC6: Munkamenet 8 óra inaktivitás után lejár. *(változatlan)*
- [ ] AC7: Meghívó nélküli belépési kísérlet naplózódik (email, IP, időbélyeg). *(ÚJ)*

---

## Notes

- Ez a task logikai elválasztás céljából létezik (traceability), de az érdemi kódváltoztatás a CR1_us-006-BE-1 tartalmazza.
- Az `us-001-BE-1.md` korábbi tesztlistájának "first login creates AppUser row with Role=Megtekinto" integrációs tesztje **törlendő** és a CR1_us-007-BE-1 "accept-invitation creates AppUser" teszttel helyettesítendő.
