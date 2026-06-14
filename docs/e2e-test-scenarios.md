# E2E Tesztforgatókönyvek – Pályázatkezelő Rendszer

**Kapcsolódó dokumentumok:** `functional-specification.md` v1.1 (CR2), `user-stories.md` v1.1 (CR2), `domain-model.md` v1.1 (CR2)  
**Verzió:** 1.0 (CR2 alapján)  
**Státusz:** Tervezet  
**Teszt-eszköz:** Playwright (Angular E2E) + xUnit WebApplicationFactory (API szintű E2E)

---

## Jelölések és konvenciók

### Szerepkör-rövidítések a forgatókönyvekben

| Rövidítés | Teljes név |
|---|---|
| `PA` | PlatformAdmin |
| `PAu` | PlatformAuditor |
| `OA` | OwnerAdmin |
| `OAu` | OwnerAuditor |
| `FA` | FoundationAdmin |
| `El` | Elnök |
| `PM` | Pályázati munkatárs |
| `Pz` | Pénzügyes |
| `Me` | Megtekintő |

### Forgatókönyv formátuma

```
E2E-XXX | [Kategória] Rövid cím
Előfeltétel: ...
Szereplők: ...

Lépések:
1. ...
2. ...

Elvárt eredmény: ...
Kapcsolódó US/FS: ...
```

### Teszt-adatbázis előfeltételek (minden E2E suite-ra)

```
Platform:
  PlatformAdmin user:  pa@test.com
  PlatformAuditor user: pau@test.com

Owner A:
  OwnerAdmin:           oa@owner-a.com
  Foundation X (ACTIVE):
    FoundationAdmin:    fa-x@owner-a.com
    Elnök:              el-x@owner-a.com
    PalyazatiMunkatars: pm-x@owner-a.com
    Penzugyes:          pz-x@owner-a.com
    Megtekinto:         me-x@owner-a.com
  Foundation Y (ACTIVE):
    FoundationAdmin:    fa-y@owner-a.com
    (Ugyanaz az FA több Foundation-ban: fa-x is FoundationAdmin itt Megtekintő szerepkörrel)

Owner B:
  OwnerAdmin:           oa@owner-b.com
  Foundation P (ACTIVE):
    FoundationAdmin:    fa-p@owner-b.com
```

---

## Tartalomjegyzék

1. [Hitelesítés és meghívási folyamat](#1-hitelesítés-és-meghívási-folyamat)
2. [Foundation-szintű jogosultsági mátrix tesztek](#2-foundation-szintű-jogosultsági-mátrix-tesztek)
3. [Owner-szintű jogosultsági mátrix tesztek](#3-owner-szintű-jogosultsági-mátrix-tesztek)
4. [Platform-szintű jogosultsági mátrix tesztek](#4-platform-szintű-jogosultsági-mátrix-tesztek)
5. [Teljes pályázati munkafolyamat (happy path)](#5-teljes-pályázati-munkafolyamat-happy-path)
6. [Munkafolyamat negatív esetek és határfeltételek](#6-munkafolyamat-negatív-esetek-és-határfeltételek)
7. [CR2: Multi-tenant scope-izoláció](#7-cr2-multi-tenant-scope-izoláció)
8. [CR2: Foundation switcher](#8-cr2-foundation-switcher)
9. [CR2: Break-glass hozzáférés](#9-cr2-break-glass-hozzáférés)
10. [CR2: Owner lifecycle](#10-cr2-owner-lifecycle)
11. [CR2: Utolsó admin szabály minden szinten](#11-cr2-utolsó-admin-szabály-minden-szinten)
12. [CR2: Scope-claim manipuláció (biztonsági tesztek)](#12-cr2-scope-claim-manipuláció-biztonsági-tesztek)

---

## 1. Hitelesítés és meghívási folyamat

---

### E2E-001 | [Auth] Sikeres Google bejelentkezés meghívott felhasználóként

**Előfeltétel:** `pm-x@owner-a.com` aktív meghívóval rendelkezik Foundation X-ben PalyazatiMunkatars szerepkörrel  
**Szereplő:** Pályázati munkatárs

**Lépések:**
1. Navigálás `/login`-ra
2. „Bejelentkezés Google-fiókkal" gomb megnyomása
3. Google OAuth flow befejezése `pm-x@owner-a.com` fiókkal
4. Rendszer ellenőrzi a meghívó elfogadottságát

**Elvárt eredmény:**
- Redirect `/app/applications` oldalra (Foundation X kontextusban)
- JWT `audience = business`, `foundation_id = X`, `foundation_roles = {X: PalyazatiMunkatars}`
- Dashboard megjelenik Foundation X pályázataival

**Kapcsolódó US:** US-001, US-007  
**FS hivatkozás:** 31.1

---

### E2E-002 | [Auth] Meghívó nélküli bejelentkezési kísérlet

**Előfeltétel:** `ismeretlen@gmail.com` nem szerepel az adatbázisban  
**Szereplő:** Ismeretlen

**Lépések:**
1. Google bejelentkezési kísérlet `ismeretlen@gmail.com`-mal

**Elvárt eredmény:**
- Hibaüzenet: „Hozzáféréshez meghívó szükséges. Kérj segítséget az adminisztrátortól."
- Bejelentkezés megtagadva
- Audit-bejegyzés keletkezik (email, IP, időbélyeg)

**Kapcsolódó US:** US-001, US-006  
**FS hivatkozás:** 31.1

---

### E2E-003 | [Auth] Inaktív felhasználói fiók bejelentkezési kísérlet

**Előfeltétel:** `pm-x@owner-a.com` fókja `IsActive = false`  
**Szereplő:** Inaktív PM

**Lépések:**
1. Google bejelentkezési kísérlet

**Elvárt eredmény:**
- Hibaüzenet: „A fiókod inaktív. Kérj segítséget az adminisztrátortól."
- HTTP 403

**Kapcsolódó US:** US-001  
**FS hivatkozás:** 31.1

---

### E2E-004 | [Auth] Foundation-scope meghívó elfogadása

**Előfeltétel:** FoundationAdmin küldött meghívót `uj@owner-a.com`-ra FoundationAdmin szerepkörre Foundation X-be  
**Szereplő:** Újonnan meghívott FA

**Lépések:**
1. `uj@owner-a.com` megkapja a meghívó emailt
2. Meghívó link megnyitása
3. Oldal mutatja: „Ez a meghívó FoundationAdmin szerepkörre szól az Alfa Alapítványban."
4. „Elfogadás Google-fiókkal" gomb → Google OAuth
5. Rendszer létrehozza az AppUser-t és a FoundationUserAssignment-et

**Elvárt eredmény:**
- AppUser létrejön `FoundationAssignments = [{FoundationId: X, Role: FoundationAdmin}]`
- JWT `audience = business`, `foundation_id = X`
- Redirect `/app/applications`-re

**Kapcsolódó US:** US-007, US-221  
**FS hivatkozás:** 4.4

---

### E2E-005 | [Auth] NK-13: Más Owner meghívójának elfogadási kísérlete

**Előfeltétel:** `fa-x@owner-a.com` (Owner A AppUser-je) megkap egy Owner B Foundation-ra szóló meghívót  
**Szereplő:** FA (Owner A)

**Lépések:**
1. Meghívó link megnyitása
2. Google OAuth befejezése `fa-x@owner-a.com`-mal

**Elvárt eredmény:**
- 403 hiba: „Ez a meghívó más szervezethez szól."
- Hozzárendelés nem jön létre

**Kapcsolódó US:** US-007, US-221  
**FS hivatkozás:** NK-13

---

### E2E-006 | [Auth] Munkamenet-lejárat

**Előfeltétel:** Bejelentkezve mint PM  
**Szereplő:** PM

**Lépések:**
1. 8 óra inaktivitás (teszten szimulálva: JWT manuálisan expired-re állítva)
2. API hívás kísérlete

**Elvárt eredmény:**
- 401 válasz
- UI redirect `/login`-ra

**Kapcsolódó US:** US-001  
**FS hivatkozás:** 31.1

---

## 2. Foundation-szintű jogosultsági mátrix tesztek

> Minden teszt Foundation X kontextusban fut. Az alábbi szekció a 5.1 mátrix összes sorát lefedi happy path + forbidden kombinációban.

---

### E2E-010 | [Jogos.] Pályázati felhívás — teljes CRUD mátrix

**Előfeltétel:** Foundation X adatbázisban van, minden szereplő bejelentkezett

| Szerepkör | Létrehozás | Olvasás | Módosítás | Törlés/Archiválás |
|---|---|---|---|---|
| FA | ✅ | ✅ | ✅ | ✅ |
| El | ❌ → 403 | ✅ | ✅ | ❌ → 403 |
| PM | ✅ | ✅ | ✅ | ❌ → 403 |
| Pz | ❌ → 403 | ✅ | ❌ → 403 | ❌ → 403 |
| Me | ❌ → 403 | ✅ | ❌ → 403 | ❌ → 403 |

**Lépések (PM eset):**
1. PM bejelentkezve Foundation X-be
2. `POST /api/v1/applications` → 201 (PM létrehozhat)
3. `GET /api/v1/applications/{id}` → 200
4. `PUT /api/v1/applications/{id}` → 200
5. `POST /api/v1/applications/{id}/archive` → 403

**Elvárt eredmény:** Minden fenti HTTP státuszkód a táblázat szerint

**Kapcsolódó US:** US-010, US-011, US-013  
**FS hivatkozás:** 5.1

---

### E2E-011 | [Jogos.] Számlák — Pénzügyes teljes CRUD, Munkatárs csak olvashat

**Szereplők:** Pz, PM

**Lépések (Munkatárs kísérlet):**
1. PM bejelentkezve
2. `POST /api/v1/applications/{id}/invoices` → **403** (PM nem rögzíthet számlát)
3. `GET /api/v1/applications/{id}/invoices` → **200** (olvashat)

**Lépések (Pénzügyes):**
1. Pz bejelentkezve
2. `POST .../invoices` → 201
3. `PUT .../invoices/{id}/mark-paid` → 200
4. `DELETE .../invoices/{id}` → 200

**Elvárt eredmény:** PM kap 403-at számlalétrehozásnál; Pz teljes CRUD-ot végezhet

**Kapcsolódó US:** US-060, US-061, US-062  
**FS hivatkozás:** 5.1 (Számlák sor)

---

### E2E-012 | [Jogos.] Elszámolás jóváhagyása — csak Elnök és FoundationAdmin

**Szereplők:** El, PM, Pz

**Lépések:**
1. Pz rögzíti az elszámolást (`POST .../settlement`)
2. PM kísérli meg a jóváhagyást (`POST .../settlement/approve`) → **403**
3. Pz kísérli meg a jóváhagyást → **403** (elszámolást rögzíthet, de nem hagyhat jóvá)
4. Elnök jóváhagyja → **200**

**Elvárt eredmény:** Csak El és FA hagyhat jóvá elszámolást

**Kapcsolódó US:** US-071  
**FS hivatkozás:** 5.1 (Elszámolás sor), 7.4

---

### E2E-013 | [Jogos.] Megjegyzések — saját megjegyzés szerkesztése más által tiltott

**Szereplők:** PM-1, PM-2, FA

**Lépések:**
1. PM-1 létrehozza `comment-A`-t
2. PM-2 kísérli meg `comment-A` szerkesztését → **403** (más megjegyzése)
3. PM-1 szerkeszti saját megjegyzését → **200**
4. FA szerkeszti PM-1 megjegyzését → **200** (FA bármely megjegyzést szerkeszthet)

**Elvárt eredmény:** Más megjegyzése csak FA által szerkeszthető

**Kapcsolódó US:** US-096  
**FS hivatkozás:** 5.5

---

### E2E-014 | [Jogos.] Lezárt pályázat módosítása — csak FoundationAdmin

**Előfeltétel:** Pályázat `CLOSED_LOST` állapotban  
**Szereplők:** PM, FA

**Lépések:**
1. PM kísérli meg a lezárt pályázat módosítását → **403** (locked application guard)
2. FA módosítja a lezárt pályázatot → **200**

**Elvárt eredmény:** Lezárt pályázaton csak FA végezhet módosítást

**Kapcsolódó US:** US-032  
**FS hivatkozás:** 5.5, 8.1

---

### E2E-015 | [Jogos.] Felhasználók (Foundation-szintű hozzárendelés) — csak FoundationAdmin kezeli

**Szereplők:** FA, El, PM

**Lépések:**
1. El navigál Foundation felhasználó-kezelésre → **403** (El nem kezelhet felhasználókat)
2. PM kísérli meg → **403**
3. FA meghívót küld → **201** (FA küldhet meghívót Foundation-szinten)

**Elvárt eredmény:** Foundation-szintű felhasználói hozzárendelés csak FA-nak elérhető

**Kapcsolódó US:** US-161, US-164  
**FS hivatkozás:** 5.1 (Felhasználók sor)

---

### E2E-016 | [Jogos.] Dokumentumkezelés — Pénzügyes csak feltöltheti, nem archiválhat

**Szereplők:** Pz, FA

**Lépések:**
1. Pz feltölt dokumentumot → **201** (R,C joga van)
2. Pz kísérli meg a dokumentum archiválását → **403** (D csak FA-nak)
3. FA archiválja → **200**

**Kapcsolódó US:** US-080, US-083  
**FS hivatkozás:** 5.1 (Dokumentumkezelés sor)

---

### E2E-017 | [Jogos.] Kódszótárak — csak FoundationAdmin módosíthat

**Szereplők:** PM, El, FA

**Lépések:**
1. PM kísérli meg új kódszótár-tétel létrehozását → **403**
2. El kísérli meg → **403**
3. FA létrehozza → **201**

**Kapcsolódó US:** US-120, US-121  
**FS hivatkozás:** 5.1 (Kódszótárak sor)

---

### E2E-018 | [Jogos.] Audit napló — csak FA és Elnök olvashat

**Szereplők:** PM, Pz, Me, FA, El

**Lépések:**
1. PM kísérli meg az audit napló olvasását → **403**
2. Pz kísérli meg → **403**
3. Me kísérli meg → **403**
4. El olvas → **200**
5. FA olvas → **200**

**Kapcsolódó US:** US-150  
**FS hivatkozás:** 5.1 (Audit napló sor)

---

## 3. Owner-szintű jogosultsági mátrix tesztek

---

### E2E-030 | [Jogos.] OwnerAdmin — alapítványok CRUD, OwnerAuditor csak olvashat

**Szereplők:** OA, OAu

**Lépések:**
1. OA bejelentkezve Owner A-ba (`audience = owner`)
2. `POST /api/v1/owner/foundations` → **201**
3. `GET /api/v1/owner/foundations` → **200**
4. `POST /api/v1/owner/foundations/{id}/archive` → **200**
5. OAu bejelentkezve
6. `POST /api/v1/owner/foundations` → **403** (OAu csak olvashat)
7. `GET /api/v1/owner/foundations` → **200**

**Kapcsolódó US:** US-210, US-211  
**FS hivatkozás:** 5.2

---

### E2E-031 | [Jogos.] OwnerAdmin — cross-foundation pályázati adatok olvasása

**Előfeltétel:** Owner A-nak Foundation X és Foundation Y is van, mindkettőben pályázatok  
**Szereplők:** OA

**Lépések:**
1. OA bejelentkezve Owner A-ba
2. `GET /api/v1/owner/reports/dashboard` → **200**, tartalmaz Foundation X és Y adatokat
3. `GET /api/v1/owner/audit-logs` → **200**, X és Y Foundation-ok eseményei is látszanak
4. OA Foundation X üzleti adatait is olvashatja (Owner szintű, cross-foundation read)

**Elvárt eredmény:** OA látja az összes saját Foundation adatait összesítve

**Kapcsolódó US:** US-215, US-216  
**FS hivatkozás:** 5.2

---

### E2E-032 | [Jogos.] OwnerAdmin nem oszthat ki Owner-szintű szerepkört

**Szereplő:** OA

**Lépések:**
1. OA megkísérli másik felhasználónak OwnerAdmin szerepkört kiosztani
2. UI-ban az „OwnerAdmin" opció nem elérhető (csak FoundationRole-ok láthatók)
3. Közvetlen API kísérlet `POST /api/v1/owner/users/{id}/assign-owner-role` → **403** (endpoint nem létezik vagy forbidden)

**Elvárt eredmény:** OwnerAdmin csak Foundation-szintű szerepkört oszthat ki

**Kapcsolódó US:** US-212, US-213  
**FS hivatkozás:** 5.2 megjegyzés (privilege escalation védelem)

---

### E2E-033 | [Jogos.] OwnerAdmin nem férhet hozzá más Owner adataihoz

**Szereplők:** OA (Owner A)

**Lépések:**
1. OA bejelentkezve Owner A-ba
2. `GET /api/v1/owner/foundations?ownerId=<Owner_B_id>` kísérlet → **403** / scope-szűrt üres válasz
3. `GET /api/v1/applications?ownerId=<Owner_B_id>` → **403** / üres (EF query filter kizárja)
4. Közvetlen URL-el Foundation P (Owner B) elérési kísérlete → **403**

**Elvárt eredmény:** Owner A JWT-vel Owner B adatai 0 rekordot / 403-at adnak vissza

**Kapcsolódó US:** US-222  
**FS hivatkozás:** 5.4

---

## 4. Platform-szintű jogosultsági mátrix tesztek

---

### E2E-040 | [Jogos.] PlatformAdmin — Owners CRUD, PlatformAuditor csak olvashat

**Szereplők:** PA, PAu

**Lépések:**
1. PA bejelentkezve (`audience = platform`)
2. `POST /api/v1/platform/owners` → **201**
3. `POST /api/v1/platform/owners/{id}/suspend` → **200**
4. PAu bejelentkezve
5. `POST /api/v1/platform/owners` → **403**
6. `GET /api/v1/platform/owners` → **200**

**Kapcsolódó US:** US-200, US-201  
**FS hivatkozás:** 5.3

---

### E2E-041 | [Jogos.] PlatformAdmin alapértelmezésben nem fér hozzá üzleti adatokhoz

**Szereplő:** PA

**Lépések:**
1. PA bejelentkezve platform audience-szel
2. `GET /api/v1/applications` → **401** (audience mismatch: `business` audience kellene)
3. `GET /api/v1/owner/foundations` → **401** (audience mismatch: `owner` kellene)
4. `POST /api/v1/platform/break-glass` (Owner A-ra) → **200** (PA kiállíthatja)
5. Kapott break-glass JWT-vel `GET /api/v1/owner/foundations` → **200** (break-glass mód)

**Elvárt eredmény:** PA platform JWT-vel üzleti API-t nem érhet el; break-glass JWT után igen

**Kapcsolódó US:** US-206, US-041 elv  
**FS hivatkozás:** 5.3, 5.5

---

### E2E-042 | [Jogos.] Platform-szintű felhasználó nem lehet egyszerre Foundation-szintű

**Szereplő:** PA

**Lépések:**
1. PA meghív egy felhasználót PlatformAdmin szerepkörrel (`uj-pa@test.com`)
2. A felhasználó elfogadja → PlatformRole = PlatformAdmin, OwnerId = null
3. Ugyanaz a felhasználó kap Foundation X-be meghívót → **403** / **DomainException**

**Elvárt eredmény:** Szerepkör-keveredés kizárva — PlatformAdmin nem lehet egyidejűleg Foundation-szintű

**Kapcsolódó US:** US-203  
**FS hivatkozás:** 4.4, 5.5

---

## 5. Teljes pályázati munkafolyamat (happy path)

> Ez az E2E forgatókönyv az összes 9 lépésen végigmegy, különböző szerepkörök együttműködésével.

---

### E2E-050 | [Workflow] Teljes pályázati életciklus — nyertes, teljes körű eset

**Előfeltétel:** Foundation X adatbázisban van, FA + El + PM + Pz bejelentkezve  
**Szereplők:** PM, El, Pz, FA

**Lépések:**

**1. lépés — Pályázati felhívás rögzítése (PM)**
1. PM bejelentkezik Foundation X-be
2. `POST /api/v1/applications` → 201, status = `DRAFT`
3. Felhívás adatai kitöltve (cím, pályáztató, kategória, összeg)

**2. lépés — Beadás (PM + El jóváhagyás)**
4. PM rögzíti a beadás adatait: `PUT .../workflow/submission`
5. El jóváhagyja: `POST .../workflow/submission/approve` → status = `SUBMITTED`

**3. lépés — Nyert eredmény rögzítése (PM + El)**
6. PM rögzíti az eredményt: `POST .../workflow/result` `{outcome: "WON", amount: 5000000}`
7. El jóváhagyja: `POST .../workflow/result/approve` → status = `WON`

**4. lépés — Értesítő (PM, kihagyható)**
8. PM jelöli elvégzettként: `POST .../workflow/contract/skip`

**5. lépés — Költési terv (PM + El jóváhagyás)**
9. PM létrehozza a költési tervet: `POST .../budget-plan`
10. El jóváhagyja: `POST .../budget-plan/approve`

**6. lépés — Alvállalkozói szerződések (PM, kihagyható)**
11. PM jelöli kihagyottként: `POST .../workflow/vendor-contracts/skip`

**7. lépés — Számlák (Pz)**
12. Pz rögzít számlát: `POST .../invoices`
13. Pz rögzíti a fizetést: `PUT .../invoices/{id}/mark-paid`

**8. lépés — Esemény igazolása (PM, kihagyható)**
14. PM rögzíti az igazolást: `POST .../proof-records`

**9. lépés — Elszámolás (Pz + El jóváhagyás)**
15. Pz rögzíti az elszámolást: `POST .../settlement`
16. El jóváhagyja: `POST .../settlement/approve` → status = `CLOSED_WON`

**Elvárt eredmény:**
- Pályázat `CLOSED_WON` állapotban
- 9 munkafolyamat-lépés mind teljesített
- Audit napló tartalmazza az összes műveletet (FA és El olvashatja)
- Lezárt pályázat nem módosítható (PM kísérletére 403)

**Kapcsolódó US:** US-010–US-021, US-030, US-040–US-071  
**FS hivatkozás:** 7.2, 7.4

---

### E2E-051 | [Workflow] Nem nyert pályázat lezárása

**Szereplők:** PM, El

**Lépések:**
1. PM rögzíti a felhívást és a beadást (lépések 1-2)
2. PM rögzíti az eredményt: `{outcome: "LOST"}`
3. El jóváhagyja → status = `CLOSED_LOST`
4. [4]–[9] lépések inaktívként jelennek meg

**Elvárt eredmény:**
- Pályázat `CLOSED_LOST` állapotban
- Aktív lépések 1–3, az összes többi inaktív
- PM nem módosíthatja tovább (403); FA igen

**Kapcsolódó US:** US-031  
**FS hivatkozás:** 7.5

---

### E2E-052 | [Workflow] Lépés kihagyása és visszaállítása

**Szereplők:** PM, FA

**Lépések:**
1. PM kihagyja a 6. lépést (alvállalkozói szerződések): `POST .../skip`
2. PM visszaállítja: `POST .../restore` → FA/El szükséges, PM kísérlete → **403**
3. FA visszaállítja a kihagyott lépést → **200**

**Elvárt eredmény:** Visszaállítás csak FA/El jogkörrel lehetséges

**Kapcsolódó US:** US-041  
**FS hivatkozás:** 7.3, 5.5

---

## 6. Munkafolyamat negatív esetek és határfeltételek

---

### E2E-060 | [Negatív] Pályázati státuszátmenet sorrendkényszer

**Szereplő:** PM

**Lépések:**
1. PM megpróbálja az elszámolást rögzíteni a beadás előtt → **400/422** (üzleti szabály: wrong state)
2. PM megpróbálja a nyert eredményt rögzíteni a beadás jóváhagyása nélkül → **400/422**

**Elvárt eredmény:** A munkafolyamat-lépések sorrendje kényszerített

**FS hivatkozás:** 7.4

---

### E2E-061 | [Negatív] Elnyert összeg nélküli nyert eredmény

**Szereplő:** PM

**Lépések:**
1. `POST .../workflow/result` `{outcome: "WON"}` — elnyert összeg hiányzik

**Elvárt eredmény:** **400** — „Nyert eredménynél az elnyert összeg kötelező."

**FS hivatkozás:** 9.

---

### E2E-062 | [Negatív] Archiválás pályázatokkal rendelkező Felhívás esetén

**Előfeltétel:** Felhíváshoz tartozik aktív pályázat  
**Szereplő:** FA

**Lépések:**
1. FA kíséreli meg a felhívás archiválását → **400** „Aktív pályázat tartozik ehhez a felhíváshoz."

**FS hivatkozás:** 10.

---

## 7. CR2: Multi-tenant scope-izoláció

---

### E2E-070 | [CR2] Foundation X adatai nem látszanak Foundation Y JWT-vel

**Előfeltétel:** Foundation X és Foundation Y Owner A-hoz tartozik; mindkettőben 3-3 pályázat  
**Szereplő:** `fa-x@owner-a.com` (csak Foundation X-be van rendelve)

**Lépések:**
1. FA-X bejelentkezik, JWT `foundation_id = X`
2. `GET /api/v1/applications` → **200**, csak Foundation X pályázatai (3 db)
3. `GET /api/v1/applications/{foundation_Y_application_id}` → **404** (EF query filter kizárja)
4. `POST /api/v1/applications` → 201, az új pályázat automatikusan Foundation X-be kerül

**Elvárt eredmény:** FA-X egyetlen Foundation Y rekordot sem lát

**Kapcsolódó US:** US-222, US-231  
**FS hivatkozás:** 5.4

---

### E2E-071 | [CR2] Owner A adatai nem látszanak Owner B JWT-vel

**Előfeltétel:** Owner A és Owner B mindkét adatbázisban van pályázatokkal  
**Szereplő:** `fa-x@owner-a.com`

**Lépések:**
1. FA-X bejelentkezik (Foundation X, Owner A)
2. `GET /api/v1/applications` → **200**, 0 Owner B rekord
3. `GET /api/v1/granters` → **200**, csak Owner A Granterek
4. Kézzel megadva Owner B-hez tartozó `applicationId`: `GET /api/v1/applications/{b_app_id}` → **404**

**Elvárt eredmény:** Egyetlen Owner B rekord sem férhető hozzá Owner A JWT-vel

**Kapcsolódó US:** US-222, US-231  
**FS hivatkozás:** 5.4

---

### E2E-072 | [CR2] Új pályázat automatikusan a helyes scope-ba kerül

**Szereplő:** PM (Foundation X)

**Lépések:**
1. PM `foundation_id = X` JWT-vel bejelentkezik
2. `POST /api/v1/applications` — nincs `foundationId` payload-ban (nem kell megadni)
3. Az adatbázisban az új rekord `FoundationId = X`, `OwnerId = Owner_A`

**Elvárt eredmény:** SaveChanges scope-injection automatikusan tölti az `OwnerId`/`FoundationId` mezőket

**Kapcsolódó US:** US-231  
**FS hivatkozás:** CR2.E.3

---

### E2E-073 | [CR2] Cross-tenant hozzáférési kísérlet — SCOPE_VIOLATION audit

**Szereplő:** FA-X (Foundation X, Owner A)

**Lépések:**
1. FA-X JWT-vel `GET /api/v1/applications/{foundation_P_application_id}` (Owner B)
2. Válasz: **404** (EF query filter kizárta)
3. Audit napló lekérdezve PA által: `SCOPE_VIOLATION` bejegyzés látható

**Elvárt eredmény:** Scope-sértési kísérlet naplózódik SCOPE_VIOLATION típussal

**Kapcsolódó US:** US-222, US-233  
**FS hivatkozás:** 5.4, CR2.G

---

### E2E-074 | [CR2] OwnerAdmin cross-foundation olvasási jog

**Előfeltétel:** OA (Owner A) bejelentkezik; Foundation X-ben 3, Foundation Y-ban 2 pályázat  
**Szereplő:** OA

**Lépések:**
1. OA bejelentkezik (`audience = owner`, `foundation_id = null`)
2. `GET /api/v1/owner/reports/dashboard` → **200**, Foundation X (3 db) + Foundation Y (2 db) is benne van
3. `GET /api/v1/owner/audit-logs` → **200**, mindkét Foundation eseményei

**Elvárt eredmény:** OwnerAdmin lát cross-foundation aggregált adatokat (csak olvasás)

**Kapcsolódó US:** US-215, US-216  
**FS hivatkozás:** 5.2

---

## 8. CR2: Foundation switcher

---

### E2E-080 | [CR2] Sikeres alapítvány-váltás

**Előfeltétel:** `fa-x@owner-a.com` egyszerre Foundation X-ben (FoundationAdmin) és Foundation Y-ban (Megtekintő) van  
**Szereplő:** FA-X (multi-foundation user)

**Lépések:**
1. Bejelentkezés → JWT `foundation_id = X` (utolsó bejelentkezett Foundation)
2. Navigációs sávban látszódik Foundation-választó dropdown
3. Foundation Y kiválasztása a dropdownból
4. Kliens `POST /api/v1/me/scope-switch { targetFoundationId: Y }` → **200**, új JWT
5. Új JWT: `audience = business`, `foundation_id = Y`, Foundation Y szerepköre Megtekintő
6. UI újratöltődik Foundation Y adataival
7. SCOPE_SWITCH audit-bejegyzés keletkezik

**Elvárt eredmény:**
- Scope-váltás után Foundation Y adatai látszanak
- Szerep megváltozik Foundation Y-ban Megtekintőre (pl. Feltöltés gomb eltűnik)
- Foundation Y neve és logója megjelenik a badge-ben

**Kapcsolódó US:** US-220  
**FS hivatkozás:** 26.4

---

### E2E-081 | [CR2] Egy Foundation-nal rendelkező felhasználónál nem jelenik meg switcher

**Előfeltétel:** PM Foundation X-ben, semmilyen más Foundation-ban nincs  
**Szereplő:** PM

**Lépések:**
1. PM bejelentkezik
2. Navigációs sáv megvizsgálva

**Elvárt eredmény:** Foundation-választó dropdown nem jelenik meg (csak egy elérhető Foundation)

**Kapcsolódó US:** US-220  
**FS hivatkozás:** 26.4

---

### E2E-082 | [CR2] OwnerAdmin „Owner áttekintés" visszaváltás

**Előfeltétel:** OA bejelentkezve Foundation X kontextusában (`audience = business`)  
**Szereplő:** OA

**Lépések:**
1. Switcher dropdownban az „Owner áttekintés" opció látszódik
2. „Owner áttekintés" kiválasztása
3. `POST /api/v1/me/scope-switch { targetFoundationId: null }` → **200**, új JWT `audience = owner`
4. Navigálás `/owner/dashboard`-ra

**Elvárt eredmény:** OA visszaváltott Owner-szintű kontextusba; cross-foundation dashboard látszik

**Kapcsolódó US:** US-220  
**FS hivatkozás:** 26.4

---

### E2E-083 | [CR2] Idegen Foundation-ra scope-switch kísérlete

**Szereplő:** FA-X (Foundation X, Owner A)

**Lépések:**
1. `POST /api/v1/me/scope-switch { targetFoundationId: Foundation_P_Owner_B_id }` → **403**

**Elvárt eredmény:** Csak a felhasználó saját hozzárendelt Foundation-jaira válthat

**Kapcsolódó US:** US-220  
**FS hivatkozás:** 5.4

---

### E2E-084 | [CR2] Scope-váltás utáni modal bezárás

**Szereplő:** FA-X

**Lépések:**
1. Foundation X-ben FA-X megnyit egy modalt (pl. pályázat-szerkesztő)
2. Foundation Y-ra vált a switcherrel
3. A megnyitott modal automatikusan bezárul
4. UI Foundation Y kontextusára töltődik

**Elvárt eredmény:** Nyitott modal-ok bezárulnak scope-váltáskor

**Kapcsolódó US:** US-220  
**FS hivatkozás:** 26.4

---

## 9. CR2: Break-glass hozzáférés

---

### E2E-090 | [CR2] Break-glass grant kiállítása és Owner-adat elérése

**Szereplő:** PA

**Lépések:**
1. PA bejelentkezik (`audience = platform`)
2. `/platform/owners/Owner_A` oldalon „Break-glass hozzáférés" gomb megnyomása
3. Modál megnyílik: indoklás textarea (min 20 karakter)
4. Indoklás megadva: „Jogszabályi adatkiadás – NAV megkeresés 2025/1234"
5. Megerősítés → `POST /api/v1/platform/break-glass { targetOwnerId: A, reason: "..." }` → **200**
6. Válaszban: `{ grantId, accessToken, expiresAt }`
7. Navigálás Owner A adataihoz
8. Break-glass JWT-vel `GET /api/v1/owner/foundations` (Owner A) → **200**, Foundation X és Y is látszik
9. OA (Owner A) kap e-mail értesítést

**Elvárt eredmény:**
- Break-glass JWT-vel Owner A üzleti adatai elérhetők
- Audit: BREAK_GLASS_ACCESS bejegyezve
- Platform audit naplóban kiemelten látszik

**Kapcsolódó US:** US-206  
**FS hivatkozás:** 5.5, 26.1.5

---

### E2E-091 | [CR2] Break-glass — indoklás nélkül/túl rövid indoklással

**Szereplő:** PA

**Lépések:**
1. Break-glass modál: 15 karakteres indoklás megadva
2. „Megerősítés" gomb disabled marad (< 20 karakter)
3. API szinten: `POST /platform/break-glass { reason: "Rövid text" }` → **400** „Az indoklás legalább 20 karakter legyen."

**Elvárt eredmény:** 20 karakter alatti indoklással nem állítható ki grant

**Kapcsolódó US:** US-206  
**FS hivatkozás:** CR2.7

---

### E2E-092 | [CR2] Break-glass grant manuális visszavonása

**Előfeltétel:** Aktív BreakGlassGrant létezik PA1 → Owner A-ra  
**Szereplő:** PA

**Lépések:**
1. `/platform/break-glass` listán látszik a PA1 aktív grantja visszavonás gombbal
2. Visszavonás gomb megnyomása → `POST /platform/break-glass/{grantId}/revoke` → **200**
3. Grant `Status = REVOKED`
4. PA1 break-glass JWT-vel API kísérlet → **403** „Break-glass hozzáférés lejárt vagy visszavonva."

**Elvárt eredmény:**
- Grant visszavonva, audit BREAK_GLASS_REVOKED
- Lejárt/visszavont grant JWT-vel 403

**Kapcsolódó US:** US-207  
**FS hivatkozás:** 5.5

---

### E2E-093 | [CR2] Break-glass automatikus lejárat (Hangfire job)

**Előfeltétel:** BreakGlassGrant `ExpiresAt = now - 1 hour`  
**Rendszer:** BreakGlassExpirationJob

**Lépések:**
1. Hangfire job manuálisan triggerelve (teszt-endpoint)
2. Job megtalálja a lejárt grant-et
3. `Status = EXPIRED`, audit BREAK_GLASS_EXPIRED bejegyezve
4. PA break-glass JWT-vel API kísérlet → **403**

**Elvárt eredmény:** Lejárt grant automatikusan inaktívvá válik; a régi JWT nem használható

**Kapcsolódó US:** US-207  
**FS hivatkozás:** CR2.K

---

### E2E-094 | [CR2] Break-glass nem fér hozzá más Owner adataihoz

**Előfeltétel:** PA break-glass granttal Owner A-ra  
**Szereplő:** PA

**Lépések:**
1. Break-glass JWT `break_glass_grant_id = grant_A_id`
2. `GET /api/v1/owner/foundations` (Owner A) → **200**
3. `GET /api/v1/owner/foundations?ownerId=Owner_B` → **403** (grant csak Owner A-ra szól)

**Elvárt eredmény:** Break-glass grant kizárólag a megjelölt Owner adatait teszi elérhetővé

**Kapcsolódó US:** US-206  
**FS hivatkozás:** 5.5, CR2.D.5

---

## 10. CR2: Owner lifecycle

---

### E2E-100 | [CR2] Teljes Owner provisioning folyamat

**Szereplő:** PA

**Lépések:**
1. PA bejelentkezik
2. `/platform/owners` oldalon „Új Owner létrehozása" gomb
3. Kitölt: Name = „Gamma Kft.", contactEmail = „tech@gamma.hu", initialOwnerAdminEmail = „oa@gamma.hu"
4. Mentés → `POST /api/v1/platform/owners` → **201**
5. Owner ACTIVE állapotban létrejön
6. `oa@gamma.hu` kap meghívó emailt OwnerAdmin szerepkörre
7. Meghívó elfogadása → `oa@gamma.hu` AppUser.OwnerId = Gamma Kft, OwnerRole = OwnerAdmin
8. Audit: OWNER_PROVISIONED

**Elvárt eredmény:** Teljes Owner onboarding megvalósul

**Kapcsolódó US:** US-200  
**FS hivatkozás:** 26.1.1

---

### E2E-101 | [CR2] Owner felfüggesztése blokkolja a bejelentkezést

**Előfeltétel:** Owner A ACTIVE, `fa-x@owner-a.com` aktív felhasználó  
**Szereplők:** PA, FA-X

**Lépések:**
1. PA felfüggeszti Owner A-t: `POST /platform/owners/A/suspend` → **200**
2. FA-X bejelentkezési kísérlete Google-lal → **403** „A szervezeted hozzáférése jelenleg fel van függesztve."
3. Adatok változatlanul megőrizve (pályázatok nem törlődnek)
4. PA reaktiválja: `POST /platform/owners/A/reactivate` → **200**
5. FA-X újra bejelentkezik sikeresen

**Elvárt eredmény:** Felfüggesztett Owner felhasználói nem léphetnek be; reaktiválás azonnal helyreáll

**Kapcsolódó US:** US-201  
**FS hivatkozás:** 26.1.1

---

### E2E-102 | [CR2] Owner archiválása csak üres Foundation-listával

**Előfeltétel:** Owner C-nek van egy ACTIVE Foundation-ja  
**Szereplő:** PA

**Lépések:**
1. `POST /platform/owners/C/archive` → **400** „Először minden alapítványt archiválj."
2. PA archiválja Foundation-t: `POST /owner/foundations/{f_id}/archive` → (aktív pályázat esetén szintén 400)
3. Pályázat lezárva → Foundation archiválva
4. `POST /platform/owners/C/archive` → **200**

**Elvárt eredmény:** Owner archiválása előfeltétel-láncon múlik (pályázat → Foundation → Owner)

**Kapcsolódó US:** US-202, US-211  
**FS hivatkozás:** 26.1.1

---

## 11. CR2: Utolsó admin szabály minden szinten

---

### E2E-110 | [CR2] Utolsó PlatformAdmin nem vonható vissza

**Előfeltétel:** Csak egy PlatformAdmin van a rendszerben  
**Szereplő:** PA

**Lépések:**
1. PA megkísérli saját PlatformAdmin szerepkörét visszavonni (self-demotion) → **422**
2. PA megkísérli a másik admin fiókját (az egyetlen másikat) inaktiválni → **422**

**Elvárt eredmény:** Az utolsó PlatformAdmin nem távolítható el

**Kapcsolódó US:** US-203  
**FS hivatkozás:** 5.5

---

### E2E-111 | [CR2] Utolsó OwnerAdmin nem vonható vissza

**Előfeltétel:** Owner A-ban csak egy OwnerAdmin van  
**Szereplő:** PA

**Lépések:**
1. PA megkísérli visszavonni az egyetlen OwnerAdmin-t → **422** „Az Owner-nek legalább egy aktív OwnerAdmin-nak kell maradnia."

**Elvárt eredmény:** Owner nem maradhat OwnerAdmin nélkül

**Kapcsolódó US:** US-212  
**FS hivatkozás:** 5.5

---

### E2E-112 | [CR2] Utolsó FoundationAdmin nem vonható vissza

**Előfeltétel:** Foundation X-ben csak egy FoundationAdmin van  
**Szereplők:** OA

**Lépések:**
1. OA megkísérli visszavonni az egyetlen FoundationAdmin-t → **422** „Az alapítványnak legalább egy aktív FoundationAdminnak kell maradnia."
2. UI-ban a visszavonás gomb disabled (tooltip látható)

**Elvárt eredmény:** Foundation nem maradhat FoundationAdmin nélkül

**Kapcsolódó US:** US-212  
**FS hivatkozás:** 5.5

---

### E2E-113 | [CR2] Self-demotion tiltása minden szinten

**Szereplők:** PA, OA, FA

**Lépések:**
1. PA megkísérli saját PlatformAdmin szerepkörének visszavonását → **422**
2. OA megkísérli saját OwnerAdmin szerepkörének visszavonását → **422**
3. FA megkísérli saját FoundationAdmin visszavonását → **422**

**Elvárt eredmény:** Self-demotion minden szinten tiltott

**Kapcsolódó US:** US-203, US-212  
**FS hivatkozás:** 5.5

---

## 12. CR2: Scope-claim manipuláció (biztonsági tesztek)

---

### E2E-120 | [Biztonság] Módosított JWT owner_id claim-mel

**Előfeltétel:** Érvényes Foundation X JWT `owner_id = Owner_A`  
**Szereplő:** Kártékony felhasználó

**Lépések:**
1. FA-X JWT `owner_id` claim-jét manuálisan `Owner_B`-re módosítja
2. `GET /api/v1/applications` → **401** (JWT signature invalid — claim módosítás érvényteleníti az aláírást)

**Elvárt eredmény:** JWT signature validáció megakadályozza a claim-manipulációt

**Kapcsolódó US:** US-223  
**FS hivatkozás:** 31.2, CR2.N

---

### E2E-121 | [Biztonság] Business audience JWT-vel platform-végpont elérési kísérlete

**Szereplő:** FA-X (érvényes business JWT)

**Lépések:**
1. `GET /api/v1/platform/owners` FA-X JWT-vel (`audience = business`) → **401**
2. `POST /api/v1/platform/break-glass` FA-X JWT-vel → **401**

**Elvárt eredmény:** Audience mismatch → 401 (nem 403)

**Kapcsolódó US:** US-223  
**FS hivatkozás:** CR2.D.2

---

### E2E-122 | [Biztonság] Owner audience JWT-vel üzleti-végpont elérési kísérlete

**Szereplő:** OA (érvényes owner JWT)

**Lépések:**
1. `GET /api/v1/applications` OA owner JWT-vel → **401** (business audience kellene)
2. `GET /api/v1/owner/foundations` → **200** (owner-végpont, helyes audience)

**Elvárt eredmény:** Owner JWT nem használható üzleti API-n

**Kapcsolódó US:** US-223  
**FS hivatkozás:** CR2.D.2

---

### E2E-123 | [Biztonság] Foundation-scope mismatch — idegen Foundation ID a JWT-ben

**Szereplő:** FA-X (Foundation X JWT-vel)

**Lépések:**
1. Érvényes, aláírt JWT `foundation_id = X`
2. Request body-ban `foundationId = Y` megadva `POST /api/v1/applications` requestben
3. Backend ignorálja a body-ban lévő `foundationId`-t; SaveChanges scope-injection `foundation_id = X`-et használ

**Elvárt eredmény:** Scope soha nem jöhet kliens-oldali bemenetből; a scope kizárólag JWT-ből származik

**Kapcsolódó US:** US-223, US-231  
**FS hivatkozás:** 5.4, CR2.E.3

---

### E2E-124 | [Biztonság] Lejárt break-glass grant JWT-vel hozzáférési kísérlet

**Előfeltétel:** PA break-glass JWT-je van, de a grant `Status = EXPIRED`  
**Szereplő:** PA

**Lépések:**
1. `GET /api/v1/owner/foundations` lejárt grant break-glass JWT-vel → **403** „Break-glass hozzáférés lejárt vagy visszavonva."

**Elvárt eredmény:** Lejárt grant nem ad hozzáférést, még érvényes JWT aláírás esetén sem

**Kapcsolódó US:** US-207  
**FS hivatkozás:** CR2.D.5

---

## Forgatókönyvek összesítő táblázata

| Azonosító | Kategória | Leírás | Prioritás | Kapcsolódó US |
|---|---|---|---|---|
| E2E-001 | Auth | Sikeres bejelentkezés | Magas | US-001, US-007 |
| E2E-002 | Auth | Meghívó nélküli kísérlet | Magas | US-001, US-006 |
| E2E-003 | Auth | Inaktív fiók | Magas | US-001 |
| E2E-004 | Auth | Foundation-scope meghívó | Magas | US-007, US-221 |
| E2E-005 | Auth | NK-13 meghívó elutasítás | Magas | US-007, US-221 |
| E2E-006 | Auth | Munkamenet lejárat | Közepes | US-001 |
| E2E-010 | Jogos. | Felhívás CRUD mátrix | Magas | US-010–013 |
| E2E-011 | Jogos. | Számla — Pz vs PM | Magas | US-060–062 |
| E2E-012 | Jogos. | Elszámolás jóváhagyás | Magas | US-071 |
| E2E-013 | Jogos. | Saját megjegyzés szerkesztés | Közepes | US-096 |
| E2E-014 | Jogos. | Lezárt pályázat módosítás | Magas | US-032 |
| E2E-015 | Jogos. | Felhasználókezelés — csak FA | Magas | US-164 |
| E2E-016 | Jogos. | Dokumentum — Pz vs FA | Közepes | US-083 |
| E2E-017 | Jogos. | Kódszótár — csak FA | Közepes | US-120 |
| E2E-018 | Jogos. | Audit napló — FA és El | Közepes | US-150 |
| E2E-030 | Owner jogos. | OA vs OAu CRUD | Magas | US-210, US-211 |
| E2E-031 | Owner jogos. | OA cross-foundation olvasás | Magas | US-215, US-216 |
| E2E-032 | Owner jogos. | OA nem oszthat OwnerRole-t | Magas | US-212 |
| E2E-033 | Owner jogos. | OA más Owner adatai | Kritikus | US-222 |
| E2E-040 | Platform jogos. | PA vs PAu Owner CRUD | Magas | US-200, US-201 |
| E2E-041 | Platform jogos. | PA üzleti adathoz alapból nem fér | Kritikus | US-206 |
| E2E-042 | Platform jogos. | Platform + Foundation szerepkör keveredés | Magas | US-203 |
| E2E-050 | Workflow | Teljes nyertes workflow | Magas | US-010–071 |
| E2E-051 | Workflow | Nem nyert lezárás | Magas | US-031 |
| E2E-052 | Workflow | Lépés kihagyás/visszaállítás | Közepes | US-041 |
| E2E-060 | Negatív | Sorrendkényszer | Magas | FS 7.4 |
| E2E-061 | Negatív | Összeg nélküli nyert eredmény | Közepes | FS 9. |
| E2E-062 | Negatív | Archiválás pályázatokkal | Közepes | FS 10. |
| E2E-070 | CR2 izoláció | Foundation X vs Y izoláció | Kritikus | US-222 |
| E2E-071 | CR2 izoláció | Owner A vs B izoláció | Kritikus | US-222 |
| E2E-072 | CR2 izoláció | Scope auto-inject mentésnél | Kritikus | US-231 |
| E2E-073 | CR2 izoláció | SCOPE_VIOLATION audit | Magas | US-222, US-233 |
| E2E-074 | CR2 izoláció | OA cross-foundation olvasás | Magas | US-215 |
| E2E-080 | CR2 switcher | Sikeres Foundation-váltás | Magas | US-220 |
| E2E-081 | CR2 switcher | Egy Foundation → nincs switcher | Közepes | US-220 |
| E2E-082 | CR2 switcher | OA visszaváltás Owner-szintre | Magas | US-220 |
| E2E-083 | CR2 switcher | Idegen Foundation-ra kísérlet | Kritikus | US-220 |
| E2E-084 | CR2 switcher | Modal bezárás scope-váltásnál | Közepes | US-220 |
| E2E-090 | CR2 break-glass | Grant kiállítása + adat elérés | Magas | US-206 |
| E2E-091 | CR2 break-glass | Rövid indoklás elutasítás | Magas | US-206 |
| E2E-092 | CR2 break-glass | Manuális visszavonás | Magas | US-207 |
| E2E-093 | CR2 break-glass | Automatikus lejárat (job) | Magas | US-207 |
| E2E-094 | CR2 break-glass | Más Owner nem elérhető granttal | Kritikus | US-206 |
| E2E-100 | CR2 Owner | Teljes Owner provisioning | Magas | US-200 |
| E2E-101 | CR2 Owner | Felfüggesztés blokkolja belépést | Magas | US-201 |
| E2E-102 | CR2 Owner | Archiválás előfeltétel-lánc | Közepes | US-202, US-211 |
| E2E-110 | CR2 admin | Utolsó PlatformAdmin védelem | Kritikus | US-203 |
| E2E-111 | CR2 admin | Utolsó OwnerAdmin védelem | Kritikus | US-212 |
| E2E-112 | CR2 admin | Utolsó FoundationAdmin védelem | Kritikus | US-212 |
| E2E-113 | CR2 admin | Self-demotion tiltás | Kritikus | US-203, US-212 |
| E2E-120 | Biztonság | JWT signature invalidálás | Kritikus | US-223 |
| E2E-121 | Biztonság | Business JWT → platform-végpont | Kritikus | US-223 |
| E2E-122 | Biztonság | Owner JWT → business-végpont | Kritikus | US-223 |
| E2E-123 | Biztonság | Scope nem jöhet kliensből | Kritikus | US-223, US-231 |
| E2E-124 | Biztonság | Lejárt break-glass JWT | Kritikus | US-207 |

**Összesen: 54 forgatókönyv**

| Kategória | Darab | Kritikus |
|---|---|---|
| Hitelesítés / meghívás | 6 | 1 |
| Foundation-szintű jogosultságok | 9 | 2 |
| Owner-szintű jogosultságok | 4 | 2 |
| Platform-szintű jogosultságok | 3 | 1 |
| Munkafolyamat (happy + negatív) | 6 | 2 |
| CR2 scope-izoláció | 5 | 3 |
| CR2 Foundation switcher | 5 | 1 |
| CR2 Break-glass | 5 | 1 |
| CR2 Owner lifecycle | 3 | 0 |
| CR2 Utolsó admin szabály | 4 | 4 |
| CR2 Biztonsági tesztek | 5 | 5 |
| **Összesen** | **55** | **22** |
