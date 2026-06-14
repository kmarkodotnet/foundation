# Funkcionális Specifikáció – Pályázatkezelő Rendszer

**Verzió:** 1.0  
**Dátum:** 2026  
**Státusz:** Tervezet  
**Készítette:** Markó Krisztián

---

## Tartalomjegyzék

1. [Dokumentum célja](#1-dokumentum-célja)
2. [Rendszer célja és üzleti háttér](#2-rendszer-célja-és-üzleti-háttér)
3. [Fogalomtár](#3-fogalomtár)
4. [Szerepkörök és felhasználói csoportok](#4-szerepkörök-és-felhasználói-csoportok)
5. [Jogosultsági modell](#5-jogosultsági-modell)
6. [Fő modulok áttekintése](#6-fő-modulok-áttekintése)
7. [Pályázatkezelési munkafolyamat részletes leírása](#7-pályázatkezelési-munkafolyamat-részletes-leírása)
8. [Munkafolyamat állapotai és átmenetei](#8-munkafolyamat-állapotai-és-átmenetei)
9. [Lépésenkénti funkcionális követelmények](#9-lépésenkénti-funkcionális-követelmények)
10. [Pályázati felhívások kezelése](#10-pályázati-felhívások-kezelése)
11. [Pályázati anyagok kezelése](#11-pályázati-anyagok-kezelése)
12. [Eredmények kezelése](#12-eredmények-kezelése)
13. [Szerződések kezelése (pályáztatóval)](#13-szerződések-kezelése-pályáztatóval)
14. [Költési terv és ötletelés kezelése](#14-költési-terv-és-ötletelés-kezelése)
15. [Alvállalkozói szerződések kezelése](#15-alvállalkozói-szerződések-kezelése)
16. [Számlák és fizetések kezelése](#16-számlák-és-fizetések-kezelése)
17. [Események és teljesítések igazolása](#17-események-és-teljesítések-igazolása)
18. [Elszámolás kezelése](#18-elszámolás-kezelése)
19. [Dokumentumkezelés](#19-dokumentumkezelés)
20. [E-mail csatolások kezelése](#20-e-mail-csatolások-kezelése)
21. [Megjegyzések kezelése](#21-megjegyzések-kezelése)
22. [Pályáztatók kezelése](#22-pályáztatók-kezelése)
23. [Szerződő cégek kezelése](#23-szerződő-cégek-kezelése)
24. [Kódszótárak kezelése](#24-kódszótárak-kezelése)
25. [Felhasználói profil](#25-felhasználói-profil)
26. [Adminisztrációs funkciók](#26-adminisztrációs-funkciók)
27. [Keresés, szűrés, listázás](#27-keresés-szűrés-listázás)
28. [Értesítések és határidőfigyelés](#28-értesítések-és-határidőfigyelés)
29. [Audit naplózás](#29-audit-naplózás)
30. [Nem funkcionális követelmények](#30-nem-funkcionális-követelmények)
31. [Biztonsági követelmények](#31-biztonsági-követelmények)
32. [Adatkezelési és fájltárolási követelmények](#32-adatkezelési-és-fájltárolási-követelmények)
33. [Integrációs követelmények](#33-integrációs-követelmények)
34. [Nyitott kérdések](#34-nyitott-kérdések)
35. [Későbbi bővítési lehetőségek](#35-későbbi-bővítési-lehetőségek)

---

## 1. Dokumentum célja

Ez a dokumentum egy alapítvány számára tervezett pályázatkezelő webalkalmazás funkcionális specifikációját tartalmazza. Célja, hogy egyértelműen meghatározza a rendszer üzleti funkcióit, folyamatait, adatmodelljét és jogosultsági szabályait olyan részletességgel, amely alapja lehet:

- a szoftverarchitektúra tervezésének,
- a domain modell kialakításának,
- felhasználói történetek (user story-k) megírásának,
- fejlesztési feladatok részletes bontásának,
- tesztelési forgatókönyvek kidolgozásának.

A dokumentum **nem tartalmaz** technikai implementációs részleteket (kód, adatbázis-séma, API definíciók), azok külön műszaki specifikáció tárgyát képezik.

---

## 2. Rendszer célja és üzleti háttér

### 2.1 Üzleti kontextus

Az alapítvány rendszeres időközönként állami és nem állami pályázatokon vesz részt. A pályázati tevékenység összetett folyamat: a felhívás megjelenésétől a beadáson, eredményhirdetésen, szerződéskötésen, pénzfelhasználáson, teljesítésigazoláson át az elszámolásig számos párhuzamos és egymásra épülő tevékenységet érint.

A jelenleg alkalmazott, jellemzően manuális nyilvántartás nem biztosít elegendő átláthatóságot, nyomon követhetőséget és dokumentumkezelési funkcionalitást.

### 2.2 A rendszer célja

A tervezett webalkalmazás célja:

- A pályázati folyamat **teljes életciklusának** digitális kezelése egyetlen rendszerben.
- **Munkafolyamat-alapú** ügykezelés, amely végigvezeti a felhasználót a pályázati lépéseken.
- Minden folyamatlépéshez kapcsolódó **dokumentumok, e-mailek és megjegyzések** tárolása.
- **Szerepkör alapú hozzáférés-kezelés**, amely tükrözi az alapítvány szervezeti felépítését.
- **Határidők és értesítések** kezelése, hogy egyetlen fontos dátum se maradjon figyelmen kívül.
- **Audit trail** biztosítása a változtatások visszakövethetőségéhez.

### 2.3 Érintett szervezeti egységek

- Alapítvány elnökség (stratégiai döntések, jóváhagyások)
- Pályázati munkatársak (pályázatok összeállítása, benyújtása)
- Pénzügyi munkatásak (számlák, kifizetések, elszámolás)
- Adminisztráció (rendszerkarbantartás, felhasználókezelés)

---

## 3. Fogalomtár

| Fogalom | Meghatározás |
|---|---|
| **Pályázat** | Egy adott pályázati felhívásra benyújtott vagy benyújtandó pályázati egység, amely a teljes életciklust végigköveti. |
| **Pályázati felhívás** | A pályáztató által meghirdetett lehetőség, amelyre az alapítvány pályázni kíván. |
| **Pályáztató** | Az a szervezet (állami szerv, alapítvány, vállalat stb.), amely a pályázati felhívást meghirdeti és a támogatást folyósítja. |
| **Pályázati anyag** | Az alapítvány által összeállított és benyújtott dokumentumok összessége. |
| **Munkafolyamat** | A pályázati életciklus lépéseinek előre meghatározott, részben kihagyható sorrendje. |
| **Munkafolyamat-lépés** | A munkafolyamat egy konkrét állomása (pl. felhívás rögzítése, beadás, eredmény rögzítése). |
| **Állapot** | A pályázat aktuális helyzete a munkafolyamatban (pl. Folyamatban, Nyert, Lezárt). |
| **Támogatói okirat** | A pályáztató által kiállított hivatalos dokumentum, amely igazolja a nyertes pályázatot és a megítélt összeget. |
| **Szerződés (pályáztatóval)** | Az alapítvány és a pályáztató között kötött megállapodás a támogatás feltételeiről. |
| **Alvállalkozói szerződés** | Az alapítvány és egy külső szolgáltató/szállító között kötött megállapodás pályázati célú teljesítésre. |
| **Szerződő cég** | Alvállalkozói szerződés másik fele; az alapítvány által megbízott külső vállalkozó vagy szállító. |
| **Költési terv** | A pályázati pénz tervezett felhasználásának dokumentuma (esemény, tárgyi javak, összegek). |
| **Elszámolás** | A pályáztató felé benyújtott pénzügyi és tartalmi beszámoló a felhasznált összegekről és teljesítményekről. |
| **Dokumentum** | Bármely feltöltött fájl (PDF, Word, kép, stb.), amely egy pályázati lépéshez csatolható. |
| **Kódszótár** | A rendszerben használt, adminisztrátor által bővíthető értékkészlet (pl. pályázat típusa, dokumentumtípus). |
| **RBAC** | Role-Based Access Control – szerepkör alapú hozzáférés-kezelés. |
| **Audit napló** | A rendszerben végzett műveletek időbélyeges, felhasználóhoz kötött naplója. |

---

## 4. Szerepkörök és felhasználói csoportok

A rendszer **háromszintű felügyeleti hierarchiát** alkalmaz:

1. **Platform szint** — a SaaS-szolgáltató által üzemeltetett, a teljes rendszer felett értelmezett szint.
2. **Owner (tulajdonos) szint** — egy tulajdonos szervezet, amely egy vagy több alapítványt birtokol és felügyel.
3. **Foundation (alapítvány) szint** — egy konkrét alapítvány, amelyhez a pályázati üzleti adatok ténylegesen tartoznak.

```
Platform
   └── Owner (1 → N Foundation)
          └── Foundation
                 └── pályázatok, dokumentumok, számlák, …
```

A rendszer Google/Gmail fiókkal történő bejelentkezést használ. Minden felhasználó bejelentkezés után előre meghívott szerepkörrel rendelkezik; szerepkört kizárólag az adott szint felelőse oszthat ki (PlatformAdmin Owner-szinten, OwnerAdmin Foundation-szinten, FoundationAdmin a saját alapítványán belül).

### 4.1 Platform-szintű szerepkörök

#### PlatformAdmin
- A teljes platform üzemeltetésének felelőse.
- Owners (tulajdonosi szervezetek) létrehozása, módosítása, felfüggesztése, archiválása.
- Platform-szintű technikai beállítások kezelése (fájlméret-limit, meghívó-érvényesség, alapértelmezett értesítési határidők).
- Platform-szintű audit napló megtekintése.
- **Alapértelmezésben nem fér hozzá** az Owners alá tartozó üzleti adatokhoz; ezt csak „break-glass" módon, kötelező indoklással, naplózott módon teheti meg (lásd 5.5 és 26.1.5).

#### PlatformAuditor
- Csak olvasási jog a teljes platform metaadataira (Owners listája, platform audit napló).
- Nem fér hozzá pályázati üzleti adatokhoz.
- Tipikus felhasználó: külső compliance auditor.

### 4.2 Owner-szintű szerepkörök

#### OwnerAdmin
- Az Owner alá tartozó alapítványok teljes körű felügyelete.
- Új alapítvány létrehozása, archiválása, alapítványi metaadatok módosítása.
- FoundationAdmin szerepkör kiosztása alapítványonként (meghívóval).
- Owner-szintű kódszótár-sablonok kezelése (új alapítványok ezekkel jönnek létre).
- Owner-szintű audit napló megtekintése (az Owner alá tartozó alapítványok összevont auditja).
- Cross-foundation jelentések megtekintése (összesített pályázati statisztikák több alapítványra).

#### OwnerAuditor
- Csak olvasási jog az Owner alá tartozó összes alapítvány adataira (cross-foundation).
- Tipikus felhasználó: könyvelő, kuratóriumi tag, külső pénzügyi auditor.

### 4.3 Foundation-szintű szerepkörök

Minden Foundation-szintű szerepkör **egyetlen konkrét alapítványhoz** van kötve. Egy felhasználó több alapítványban is rendelkezhet szerepkörrel, alapítványonként eltérővel — feltéve, hogy ezek az alapítványok ugyanahhoz az Owner-hez tartoznak.

#### FoundationAdmin *(korábban: FoundationAdmin)*
- Egy adott alapítvány teljes adminisztrációs felelőse.
- Felhasználók kezelése az adott alapítványon belül, alapítvány-szintű szerepkörök hozzárendelése (kivéve OwnerAdmin/OwnerAuditor/PlatformAdmin/PlatformAuditor).
- Kódszótárak kezelése az adott alapítványra (az Owner-szintű sablon felülírható és bővíthető).
- Minden modul olvasása, írása, törlése, jóváhagyása az adott alapítványon belül.
- Az adott alapítvány audit naplójának megtekintése.

#### Elnök
- Stratégiai szintű rálátás az adott alapítvány összes pályázatára.
- Jóváhagyási jogkör kulcsfontosságú lépéseknél (pl. pályázat beadása, elszámolás).
- Nem kezeli a napi adminisztratív feladatokat.
- Olvasási jog mindenhol, módosítási és jóváhagyási jog kiemelt modulokban.

#### Pályázati munkatárs
- Pályázatok létrehozása, kezelése a munkafolyamat mentén az adott alapítványon belül.
- Dokumentumok, e-mailek, megjegyzések csatolása.
- Pályáztatók és szerződő cégek kezelése.
- Pénzügyi modulokban csak olvasási jog.

#### Pénzügyes
- Számlák és fizetések rögzítése és kezelése az adott alapítványon belül.
- Elszámolás rögzítése.
- Olvasási jog a pályázati adatokhoz.
- Nem módosíthat pályázati tartalmi adatokat.

#### Megtekintő
- Kizárólag olvasási jog az adott alapítvány összes moduljában.
- Nem hozhat létre, nem módosíthat, nem törölhet semmit.
- Tipikus felhasználó: az alapítványhoz kapcsolódó külső szemlélő.

### 4.4 Felhasználó ↔ szerepkör hozzárendelési modell

- Egy felhasználó (Google-fiók) **legfeljebb egy Owner-hez** tartozhat (NK-13). Egy másik Owner alá tartozás új meghívást és új Google-fiókot igényel.
- Egy felhasználónak az Owner-en belül **expliciten meg kell kapnia** szerepkört minden alapítványban, amelyhez hozzá akar férni; az Owner alá tartozás önmagában nem jelent automatikus láthatóságot (NK-14).
- Egy felhasználó **több alapítványban különböző szerepkörökkel** is rendelkezhet (pl. az „A" alapítványban FoundationAdmin, a „B" alapítványban Pénzügyes).
- Az OwnerAdmin egyúttal lehet FoundationAdmin egy vagy több saját alapítványban — de a két szerepkör kiosztása **különálló esemény**, külön audit-bejegyzéssel jár (NK-17).
- Platform-szintű és Owner/Foundation-szintű szerepkörök ugyanazon felhasználón **nem keveredhetnek**: aki PlatformAdmin vagy PlatformAuditor, az nem lehet egyszerre OwnerAdmin/FoundationAdmin (jogosultság-szétválasztás).
- Bejelentkezés után a felhasználó az alapértelmezett (vagy egyetlen) hatókörébe érkezik; ha több alapítványhoz tartozik, **alapítvány-váltó** UI-elem segítségével válthat hatókört (lásd 26.4).

---

## 5. Jogosultsági modell

A rendszer **hatókör-alapú RBAC**-ot alkalmaz: minden szerepkör egy konkrét hatókörhöz (Platform, Owner vagy Foundation) van kötve, és a műveletek csak az adott hatókörön belül érvényesek. Hatókörök közti hozzáférés kizárólag az alábbi szabályok szerint, expliciten engedélyezett.

A táblázatokban alkalmazott jelölések:
- **R** = olvasás (Read)
- **C** = létrehozás (Create)
- **U** = módosítás (Update)
- **D** = törlés (Delete)
- **A** = jóváhagyás (Approve)
- **–** = nincs jogosultság

### 5.1 Foundation-szintű jogosultsági mátrix

A mátrix egy **adott alapítványon belüli** jogokat ír le. A „FoundationAdmin" oszlop a korábbi „Admin" szerepkör új neve.

| Modul | FoundationAdmin | Elnök | Pályázati munkatárs | Pénzügyes | Megtekintő |
|---|---|---|---|---|---|
| Pályázati felhívások | R,C,U,D | R,U,A | R,C,U | R | R |
| Pályázati anyagok | R,C,U,D | R,A | R,C,U | R | R |
| Pályázati eredmények | R,C,U,D | R,U,A | R,C,U | R | R |
| Értesítő / szerződés (pályáztatóval) | R,C,U,D | R,U,A | R,C,U | R | R |
| Költési terv | R,C,U,D | R,U,A | R,C,U | R | R |
| Alvállalkozói szerződések | R,C,U,D | R,A | R,C,U | R,C,U | R |
| Számlák és fizetések | R,C,U,D | R,A | R | R,C,U,A | R |
| Események / teljesítés igazolása | R,C,U,D | R,A | R,C,U | R | R |
| Elszámolás | R,C,U,D | R,A | R,C | R,C,U,A | R |
| Dokumentumkezelés | R,C,U,D | R | R,C,U | R,C | R |
| E-mail csatolások | R,C,U,D | R | R,C,U | R,C | R |
| Megjegyzések | R,C,U,D | R,C,U | R,C,U | R,C,U | R |
| Pályáztatók (alapítvány-szintű) | R,C,U,D | R | R,C,U | R | R |
| Szerződő cégek (alapítvány-szintű) | R,C,U,D | R | R,C,U | R,C,U | R |
| Kódszótárak (alapítvány-szintű felülírás) | R,C,U,D | R | R | R | R |
| Felhasználók (alapítvány-szintű hozzárendelés) | R,C,U,D | R | – | – | – |
| Alapítvány audit napló | R | R | – | – | – |

### 5.2 Owner-szintű jogosultsági mátrix

A mátrix az adott **Owner saját alapítványainak összességén** értelmezett. Az OwnerAdmin/OwnerAuditor szerepkörök a megnevezett Owner alá tartozó **minden** alapítványra vonatkoznak; idegen Owner adataihoz nincs hozzáférés.

| Modul | OwnerAdmin | OwnerAuditor |
|---|---|---|
| Alapítványok (CRUD, archiválás) | R,C,U,D | R |
| FoundationAdmin kinevezés / visszavonás | C,U,D | – |
| Owner-szintű kódszótár-sablonok | R,C,U,D | R |
| Cross-foundation jelentések | R | R |
| Owner-szintű audit napló | R | R |
| Bármely saját alapítvány pályázati adatai | R | R |
| Owner-szintű felhasználói adminisztráció | R,C,U,D | R |

> **Megjegyzés:** Az OwnerAdmin **nem oszthat ki** Owner-szintű (OwnerAdmin/OwnerAuditor) szerepkört, csak alapítvány-szintűt. Új Owner-szintű szerepkört kizárólag PlatformAdmin hozhat létre (privilege escalation védelem).

### 5.3 Platform-szintű jogosultsági mátrix

| Modul | PlatformAdmin | PlatformAuditor |
|---|---|---|
| Owners (CRUD, suspend, archiválás) | R,C,U,D | R |
| Platform-szintű felhasználói adminisztráció | R,C,U,D | R |
| Platform-szintű technikai beállítások | R,U | R |
| Platform audit napló | R | R |
| Bármely Owner üzleti adatai | – *(default; lásd break-glass, 5.5)* | – |

### 5.4 Hatókör-izolációs szabályok

- Minden adatlekérdezés és módosítás backend oldalon az aktuálisan bejelentkezett felhasználó **JWT-claim-jeiből származtatott hatóköréhez** van kötve. A scope soha nem származhat kliensoldali bemenetből.
- Foundation-szintű szerepkörök **csak az adott alapítvány** adataihoz férnek hozzá.
- Owner-szintű szerepkörök **csak az adott Owner saját alapítványaihoz** férnek hozzá.
- Platform-szintű szerepkörök **csak a platform metaadataihoz** férnek hozzá; üzleti adathoz csak break-glass módban (lásd 5.5).
- Hatókör-ütközés esetén (pl. egy entitás `FoundationId`-je nem egyezik a felhasználó scope-jával) a rendszer 403 hibát ad vissza és kiemelt audit-bejegyzést készít.

### 5.5 Különleges jogosultsági szabályok

- Lezárt pályázatokon (`LEZÁRT` állapot) kizárólag FoundationAdmin (vagy a felette levő OwnerAdmin) végezhet módosítást.
- Törlés helyett az adott szintű felelős szoftveres archiválást hajt végre (soft delete), kivéve teszt adatokat.
- A jóváhagyás (`A`) jogkör mindig az adott lépés véglegesítését jelenti (pl. beadás megerősítése, elszámolás lezárása).
- Saját megjegyzés módosítható és törölhető a megjegyzés tulajdonosa által is, az adott alapítvány FoundationAdminja mellett.
- **Utolsó admin szabály**: mindenkor legalább egy aktív felelősnek léteznie kell minden szinten — legalább 1 PlatformAdmin, Owner-enként legalább 1 OwnerAdmin, alapítványonként legalább 1 FoundationAdmin. Self-demotion (saját szerepkör visszavonása) minden szinten tiltott.
- **Break-glass hozzáférés** (NK-18): PlatformAdmin szükség esetén (technikai vészhelyzet, jogszabályi adatkiadási kötelezettség) ideiglenes Owner-szintű hozzáférést kaphat egy adott Owner adataihoz. Feltételek:
  - kötelező szöveges indoklás;
  - az érintett Owner OwnerAdminjának automatikus e-mail értesítése;
  - kiemelt audit-bejegyzés (`BREAK_GLASS_ACCESS`);
  - alapértelmezett időkorlát: 24 óra, ezt követően automatikus visszavonás.

---

## 6. Fő modulok áttekintése

A rendszer az alábbi fő modulokból épül fel:

| # | Modul neve | Leírás |
|---|---|---|
| M01 | Pályázatkezelés | A pályázati életciklus munkafolyamat-alapú kezelése (felhívástól elszámolásig). |
| M02 | Dokumentumkezelés | Fájlok feltöltése, csatolása pályázati lépésekhez, típus szerinti kezelés. |
| M03 | E-mail csatolások | E-mailek (mint dokumentumtípus) rögzítése és csatolása. |
| M04 | Megjegyzések | Szabad szöveges megjegyzések minden pályázati lépésnél. |
| M05 | Pályáztatók | A pályázatot kiíró szervezetek önálló nyilvántartása. |
| M06 | Szerződő cégek | Az alvállalkozói szerződések partnereinek önálló nyilvántartása. |
| M07 | Kódszótárak | Adminisztrátor által bővíthető értéklista kezelő. |
| M08 | Felhasználókezelés | Google-alapú bejelentkezés, szerepkör-hozzárendelés, profil. |
| M09 | Keresés és szűrés | Általános és modul-specifikus keresési, szűrési és listázási funkciók. |
| M10 | Értesítések | Automatikus határidőfigyelmeztetések és rendszerértesítések. |
| M11 | Audit napló | Minden adatmódosítás naplózása visszakövethetőség céljából. |
| M12 | Alapítvány-adminisztráció | Alapítvány-szintű beállítások, felhasználók, kódszótárak kezelése (lásd 26.3). |
| M13 | Owner-adminisztráció | Alapítványok provisioningja, Owner-szintű felhasználók, kódszótár-sablonok, cross-foundation jelentések, Owner-szintű audit (lásd 26.2). |
| M14 | Platform-adminisztráció | Owners (tulajdonosok) kezelése, platform-szintű felhasználók és technikai beállítások, platform audit, break-glass hozzáférés (lásd 26.1). |

---

## 7. Pályázatkezelési munkafolyamat részletes leírása

### 7.1 A munkafolyamat általános jellemzői

A pályázati munkafolyamat **lineáris, de részben kihagyható** lépések sorozata. A folyamat logikai sorrendje adott, de bizonyos lépések (pl. szerződéskötés a pályáztatóval, alvállalkozói szerződések) a pályázat jellegétől függően kihagyhatók.

**Alapelv:** Minden pályázathoz pontosan egy munkafolyamat-példány tartozik. A munkafolyamat egy Pályázat entitáshoz kötődik, és az egyes lépések a Pályázaton belüli al-rekordokként jelennek meg.

### 7.2 A munkafolyamat lépéseinek sorrendje

```
[1] Pályázati felhívás rögzítése
        ↓
[2] Pályázati anyag elkészítése és beadása
        ↓
[3] Pályázati eredmény rögzítése
       /       \
[NEM NYERT]  [NYERT]
      ↓           ↓
  [LEZÁRT]   [4] Értesítő és szerződéskötés (pályáztatóval) [KIHAGYHATÓ]
                  ↓
             [5] Ötletelés és költési terv
                  ↓
             [6] Alvállalkozói szerződések létrehozása [KIHAGYHATÓ]
                  ↓
             [7] Számlák és fizetések rögzítése
                  ↓
             [8] Esemény / teljesítés igazolása [KIHAGYHATÓ]
                  ↓
             [9] Elszámolás
                  ↓
              [LEZÁRT]
```

### 7.3 Lépések kötelezősége és kihagyhatósága

| Lépés | Neve | Kötelező? | Kihagyás feltétele |
|---|---|---|---|
| 1 | Pályázati felhívás rögzítése | ✅ Kötelező | – |
| 2 | Pályázati anyag elkészítése és beadása | ✅ Kötelező | – |
| 3 | Pályázati eredmény rögzítése | ✅ Kötelező | – |
| 4 | Értesítő és szerződéskötés (pályáztatóval) | ⚠️ Feltételes | Ha a nyertes pályázathoz nem szükséges szerződés a pályáztatóval |
| 5 | Ötletelés és költési terv | ✅ Kötelező (nyertes pályázatnál) | – |
| 6 | Alvállalkozói szerződések létrehozása | ⚠️ Feltételes | Ha minden kifizetés szerződés nélkül, csak számla alapján történik |
| 7 | Számlák és fizetések rögzítése | ✅ Kötelező (nyertes pályázatnál) | – |
| 8 | Esemény / teljesítés igazolása | ⚠️ Feltételes | Ha a pályázat nem tartalmaz eseményt vagy tárgyi teljesítést |
| 9 | Elszámolás | ✅ Kötelező (nyertes pályázatnál) | – |

### 7.4 Továbblépési feltételek

| Lépésről | Lépésre | Szükséges feltétel |
|---|---|---|
| 1 → 2 | Felhívásból Beadásba | Felhívás rögzítve (kötelező mezők kitöltve) |
| 2 → 3 | Beadásból Eredményre | Beadás időpontja rögzítve |
| 3 → LEZÁRT | Nem nyert | Eredmény = „Nem nyert", jóváhagyás szükséges |
| 3 → 4/5 | Nyert | Eredmény = „Nyert", elnyert összeg rögzítve |
| 4 → 5 | Szerződéskötésből Költési tervbe | Lépés jelölhető elvégzettként (manuálisan) |
| 5 → 6/7 | Költési tervből tovább | Legalább 1 tervezett tétel rögzítve |
| 6 → 7 | Szerződésekből Számlákba | Lépés jelölhető elvégzettként |
| 7 → 8/9 | Számlákból tovább | Legalább 1 számla rögzítve |
| 8 → 9 | Igazolásból Elszámolásba | Legalább 1 igazolás rögzítve |
| 9 → LEZÁRT | Elszámolásból Lezárásba | Elszámolás időpontja rögzítve, jóváhagyás szükséges (Elnök vagy FoundationAdmin) |

### 7.5 Negatív eredmény kezelése

Ha a [3] lépésnél az eredmény **„Nem nyert"**:
- A pályázat állapota `LEZÁRT – NEM NYERT` lesz.
- A [4]–[9] lépések nem aktiválódnak, inaktívként jelennek meg.
- Az összes addig rögzített adat és dokumentum megőrzésre kerül.
- A lezárt pályázat olvasható, de nem módosítható (kivéve FoundationAdmin).

### 7.6 Párhuzamos tevékenységek

> **Szakmai feltételezés:** A [6] Alvállalkozói szerződések és a [7] Számlák lépések részben párhuzamosan is kezelhetők, mivel egy szerződés alapján több számla is keletkezhet, de előfordulhat, hogy a számla korábban érkezik meg a formális szerződésnél. A rendszer ezt azzal kezeli, hogy a számlánál a szerződés opcionálisan adható meg (nem kötelező).

---

## 8. Munkafolyamat állapotai és átmenetei

### 8.1 Pályázat állapotok

| Állapot kód | Magyar elnevezés | Leírás |
|---|---|---|
| `DRAFT` | Tervezet | Felhívás rögzítve, de még nem indult el aktívan. |
| `IN_PROGRESS` | Folyamatban | Az aktív munkafolyamat valamelyik lépésénél tart. |
| `SUBMITTED` | Beadva | Pályázati anyag beadva, eredményre vár. |
| `WON` | Nyert | Pozitív eredmény rögzítve. |
| `LOST` | Nem nyert | Negatív eredmény rögzítve. |
| `CLOSED_WON` | Lezárt – Nyert | Elszámolás teljesítve, a nyertes pályázat folyamata lezárult. |
| `CLOSED_LOST` | Lezárt – Nem nyert | A nem nyert pályázat manuálisan lezárva. |
| `ARCHIVED` | Archivált | FoundationAdmin által archivált pályázat (logikailag törölt). |

### 8.2 Állapotátmenetek

```
DRAFT → IN_PROGRESS (pályázati anyag elkészítése megkezdődik)
IN_PROGRESS → SUBMITTED (beadás időpontja rögzítve)
SUBMITTED → WON (eredmény = nyert)
SUBMITTED → LOST (eredmény = nem nyert)
WON → IN_PROGRESS (visszakerül a folyamatba: szerződés, költési terv, stb.)
IN_PROGRESS → CLOSED_WON (elszámolás lezárva + jóváhagyva)
LOST → CLOSED_LOST (manuális lezárás)
Bármely állapot → ARCHIVED (csak FoundationAdmin)
```

### 8.3 Munkafolyamat-lépés állapotok

Minden egyes munkafolyamat-lépésnek saját állapota van:

| Állapot | Leírás |
|---|---|
| `PENDING` | Még nem aktív, előző lépés nem teljesült. |
| `ACTIVE` | Aktuálisan elvégezhető/folyamatban lévő lépés. |
| `COMPLETED` | A lépés elvégzettnek jelölve vagy automatikusan teljesült. |
| `SKIPPED` | A lépést a felhasználó kihagyta (csak kihagyható lépéseknél). |
| `LOCKED` | Pályázat lezárása után zárolódik; módosítás nem lehetséges. |

---

## 9. Lépésenkénti funkcionális követelmények

*(A részletes, lépésenkénti leírást a 10–18. fejezetek tartalmazzák.)*

### 9.1 Közös szabályok minden lépésre

- Minden lépésnél lehetséges dokumentum, e-mail és megjegyzés csatolása.
- Minden lépésnél rögzítésre kerül a létrehozó felhasználó és az időbélyeg.
- Módosítás esetén az előző értéket az audit napló megőrzi.
- Lezárt lépésnél (`LOCKED`) csak FoundationAdmin végezhet módosítást.
- Kihagyott lépés visszaállítható aktívra, ha az üzleti folyamat megköveteli (FoundationAdmin vagy Elnök jogkörrel).

---

## 10. Pályázati felhívások kezelése

### 10.1 Modul célja
A pályázati felhívás az életciklus kiindulópontja. Ez a lépés rögzíti a pályáztató által meghirdetett lehetőség összes releváns adatát.

### 10.2 Érintett szerepkörök
- Létrehozás: FoundationAdmin, Pályázati munkatárs
- Módosítás: FoundationAdmin, Elnök, Pályázati munkatárs
- Törlés/Archiválás: FoundationAdmin
- Megtekintés: Minden szerepkör

### 10.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció | Megjegyzés |
|---|---|---|---|---|
| Pályáztató | Entitás hivatkozás | ✅ | Létező pályáztató | Legördülő listából |
| Pályázat címe | Szöveges (max. 500 kar.) | ✅ | Nem üres | – |
| Pályázat azonosítója | Szöveges (max. 100 kar.) | ❌ | – | A pályáztató által adott kód |
| Pályázat leírása | Hosszú szöveg | ❌ | – | Rich text vagy plain text |
| Pályázat típusa | Kódszótár | ❌ | Érvényes kódszótár elem | Pl.: állami, EU, magán |
| Pályázati összeg minimum | Szám (Ft) | ❌ | Pozitív, ≤ maximum | – |
| Pályázati összeg maximum | Szám (Ft) | ❌ | Pozitív, ≥ minimum | – |
| Beadási határidő | Dátum + idő | ✅ | Jövőbeni dátum | Figyelmeztető értesítés küldése |
| Elköltési határidő | Dátum | ❌ | Beadási határidő utáni dátum | – |
| Egyéb metaadatok | Hosszú szöveg | ❌ | – | Szabadon kitölthető |

### 10.4 Üzleti szabályok
- Egy pályázóhoz több pályázat is rögzíthető.
- A beadási határidőhöz automatikus értesítés kapcsolódik (ld. 28. fejezet).
- A pályázat azonosítója nem egyedi kényszer a rendszerben, de ajánlott kitölteni.

### 10.5 Kapcsolódó dokumentumtípusok
- Pályázati kiírás (ajánlott melléklet)
- Egyéb

### 10.6 Elfogadási kritériumok
- A pályázati felhívás sikeresen elmenthető a kötelező mezők kitöltésével.
- A pályáztató neve kereshető és kiválasztható a legördülő listából.
- A lista nézeten megjelenik a beadási határidő és az eltelt/hátralévő napok száma.
- Ha a beadási határidő a következő 7 napon belül van, figyelmeztető ikon jelenik meg.

---

## 11. Pályázati anyagok kezelése

### 11.1 Modul célja
Rögzíti a tényleges pályázat benyújtásának körülményeit és tartalmát.

### 11.2 Érintett szerepkörök
- Létrehozás/módosítás: FoundationAdmin, Pályázati munkatárs
- Jóváhagyás (beadás véglegesítése): Elnök, FoundationAdmin
- Megtekintés: Minden szerepkör

### 11.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Pályázati anyag leírása | Hosszú szöveg | ✅ | Nem üres |
| Beadás módja | Kódszótár | ❌ | Érvényes elem (pl.: online felület, postai) |
| Beadás időpontja | Dátum + idő | ✅ (lépés lezárásához) | Múltbeli vagy jelenlegi dátum |
| Beadta (felhasználó) | Rendszer-generált | – | Automatikus, bejelentkezett user |

### 11.4 Üzleti szabályok
- A lépés csak akkor tekinthető lezártnak, ha a beadás időpontja rögzítve van.
- Beadás után a pályázat állapota `SUBMITTED`-re vált.
- Az Elnök vagy FoundationAdmin jóváhagyása szükséges a lépés véglegesítéséhez (konfigurálható).

> **Szakmai feltételezés:** A jóváhagyás a beadás tényét, nem az anyag tartalmát igazolja. Az anyag tartalmi ellenőrzése szervezeti folyamat, nem rendszerszintű.

### 11.5 Kapcsolódó dokumentumtípusok
- Benyújtott pályázat (kötelezően ajánlott csatolmány)
- Egyéb

### 11.6 Elfogadási kritériumok
- A lépés nem zárható le a beadás időpontja nélkül.
- A csatolt dokumentum(ok) listája megjelenik a lépés részletező nézetén.
- A jóváhagyási státusz vizuálisan jelzett (pl. zöld pipa / szürke várakozás).

---

## 12. Eredmények kezelése

### 12.1 Modul célja
A pályázat eredményének (nyert / nem nyert) és a kapcsolódó adatok rögzítése.

### 12.2 Érintett szerepkörök
- Rögzítés: FoundationAdmin, Pályázati munkatárs
- Jóváhagyás: Elnök, FoundationAdmin
- Megtekintés: Minden szerepkör

### 12.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Eredmény | Enum (Nyert / Nem nyert) | ✅ | Kötelező választás |
| Eredmény időpontja | Dátum | ✅ | Múltbeli vagy jelenlegi dátum |
| Egyedi azonosító (döntési szám) | Szöveges (max. 100 kar.) | ❌ | – |
| Elnyert összeg | Szám (Ft) | ✅ (ha Nyert) | Pozitív szám; ≤ max pályázati összeg (ha meg van adva) |
| Megjegyzés | Szöveg | ❌ | – |

### 12.4 Üzleti szabályok
- Ha az eredmény **Nem nyert**: a pályázat `LOST` állapotba kerül, a többi lépés inaktiválódik.
- Ha az eredmény **Nyert**: az elnyert összeget kötelező megadni; a folyamat a [4] vagy [5] lépéssel folytatódik.
- Az eredmény megváltoztatható mindaddig, amíg a pályázat nincs `CLOSED` állapotban.

### 12.5 Kapcsolódó dokumentumtípusok
- Támogatói okirat

### 12.6 Elfogadási kritériumok
- „Nyert" eredménynél az elnyert összeg megadása nélkül nem menthető a lépés.
- „Nem nyert" után a [4]–[9] lépések szürkítve, inaktívként jelennek meg az UI-on.
- A pályázat listán az eredmény ikonsávon (nyert / nem nyert / függőben) megjelenik.

---

## 13. Szerződések kezelése (pályáztatóval)

### 13.1 Modul célja
A nyertes pályázathoz kapcsolódó, a pályáztatóval kötött szerződés rögzítése. Ez a lépés kihagyható, ha a pályáztató nem köt formális szerződést.

### 13.2 Érintett szerepkörök
- Létrehozás/módosítás: FoundationAdmin, Pályázati munkatárs
- Jóváhagyás: Elnök, FoundationAdmin
- Megtekintés: Minden szerepkör

### 13.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Szerződés azonosítója | Szöveges (max. 100 kar.) | ❌ | – |
| Szerződéskötés időpontja | Dátum | ❌ | Múltbeli vagy jelenlegi |
| Megjegyzés | Szöveg | ❌ | – |
| Értesítő kapott? | Boolean | ❌ | – |
| Értesítő időpontja | Dátum | ❌ | – |

### 13.4 Üzleti szabályok
- Ha a lépés ki van hagyva (`SKIPPED`), rögzíthető a kihagyás indoka megjegyzésben.
- A lépés elvégzettnek jelölhető dokumentum nélkül is, ha a szerződés csak papír alapon létezik.

### 13.5 Kapcsolódó dokumentumtípusok
- Szerződés
- Támogatói okirat
- Egyéb

### 13.6 Elfogadási kritériumok
- A lépés kihagyható egy indoklás-mező kitöltésével vagy egy explicit „Lépés kihagyása" gombbal.
- A csatolt szerződés dokumentum a lépés részletező nézetén megtekinthető.

---

## 14. Költési terv és ötletelés kezelése

### 14.1 Modul célja
A nyertes pályázati összeg felhasználásának tervezése, a pályázati feltételeknek megfelelő bontásban.

### 14.2 Érintett szerepkörök
- Létrehozás/módosítás: FoundationAdmin, Pályázati munkatárs
- Jóváhagyás: Elnök, FoundationAdmin
- Megtekintés: Minden szerepkör (pénzügyes is olvashat)

### 14.3 Adatmezők – Költési terv fej

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Leírás / bevezetés | Szöveg | ❌ | – |
| Jóváhagyás státusza | Enum | – | Automatikus |

### 14.4 Adatmezők – Költési terv tétel

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Tétel neve | Szöveges (max. 300 kar.) | ✅ | Nem üres |
| Típus | Enum (Esemény / Tárgyi jószág / Egyéb) | ✅ | – |
| Tervezett összeg | Szám (Ft) | ✅ | Pozitív szám |
| Leírás / indoklás | Szöveg | ❌ | – |
| Sorrend | Egész szám | ❌ | Automatikus, kézzel módosítható |

### 14.5 Üzleti szabályok
- Legalább 1 tételnek léteznie kell a lépés lezárásához.
- A tervezett összegek összege nem haladhatja meg az elnyert összeget (figyelmeztető validáció, nem blokkoló).
- Minden egyes tétel opcionálisan kapcsolható egy alvállalkozói szerződéshez ([6] lépés) vagy számlához ([7] lépés).
- A tételek sorba rendezhetők drag-and-drop-pal.

### 14.6 Kapcsolódó dokumentumtípusok
- Egyéb (pl. Excel-alapú tervtáblázat)

### 14.7 Elfogadási kritériumok
- Tételek hozzáadhatók, szerkeszthetők és törölhetők a listából.
- Az összesített tervezett összeg és az elnyert összeg közötti különbség vizuálisan megjelenik.
- A tétel-szintű kapcsolat a számlákkal és szerződésekkel a részletező nézetben látható.

---

## 15. Alvállalkozói szerződések kezelése

### 15.1 Modul célja
Az alapítvány és külső cégek/szolgáltatók között kötött, pályázati célú megállapodások rögzítése.

### 15.2 Érintett szerepkörök
- Létrehozás/módosítás: FoundationAdmin, Pályázati munkatárs, Pénzügyes
- Jóváhagyás: FoundationAdmin, Elnök
- Megtekintés: Minden szerepkör

### 15.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Szerződő cég | Entitás hivatkozás | ✅ | Létező szerződő cég |
| Szerződéskötés időpontja | Dátum | ✅ | Múltbeli vagy jelenlegi dátum |
| Szerződés azonosítója | Szöveges (max. 100 kar.) | ❌ | – |
| Szerződés összege | Szám (Ft) | ✅ | Pozitív szám |
| Kapcsolt költési terv tétel | Tétel hivatkozás | ❌ | Érvényes tétel a pályázat költési tervéből |
| Megjegyzés | Szöveg | ❌ | – |

### 15.4 Üzleti szabályok
- Egy pályázathoz több alvállalkozói szerződés is rögzíthető.
- A szerződés összege figyelmeztető módon összevetésre kerül a kapcsolt költési terv tétel összegével.
- A lépés kihagyható, ha nincsenek alvállalkozói szerződések (minden fizetés közvetlen számla alapján történik).

### 15.5 Kapcsolódó dokumentumtípusok
- Szerződés
- Egyéb

### 15.6 Elfogadási kritériumok
- Több szerződés egymás után hozzáadható.
- Szerződés törölhető mindaddig, amíg nincs hozzá rögzített számla.
- Ha a pályázat lezárásra kerül, a szerződések `LOCKED` állapotba kerülnek.

---

## 16. Számlák és fizetések kezelése

### 16.1 Modul célja
A pályázati keretből teljesített kifizetések dokumentálása számla- és fizetési szinten.

### 16.2 Érintett szerepkörök
- Létrehozás/módosítás: FoundationAdmin, Pénzügyes
- Megtekintés: Minden szerepkör
- Jóváhagyás (kifizetés igazolása): FoundationAdmin, Elnök, Pénzügyes

### 16.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Szállító | Szöveg vagy entitás hivatkozás | ✅ | Nem üres |
| Számla sorszáma | Szöveges (max. 100 kar.) | ✅ | Nem üres, pályázaton belül egyedi (ajánlott) |
| Kiállítás dátuma | Dátum | ✅ | Múltbeli vagy jelenlegi |
| Összeg | Szám (Ft) | ✅ | Pozitív szám |
| Fizetve? | Boolean | ✅ | – |
| Fizetés időpontja | Dátum | ✅ (ha Fizetve = igen) | Kiállítás dátuma utáni vagy azzal egyező |
| Kapcsolt alvállalkozói szerződés | Szerződés hivatkozás | ❌ | Érvényes alvállalkozói szerződés |
| Kapcsolt költési terv tétel | Tétel hivatkozás | ❌ | Érvényes tétel |
| Megjegyzés | Szöveg | ❌ | – |

### 16.4 Üzleti szabályok
- Számla rögzíthető alvállalkozói szerződés nélkül is (közvetlen, szerződés nélküli kifizetés).
- Ha a fizetve mező `igen`, a fizetés időpontja kötelező.
- Az összes rögzített számla összege nem haladhatja meg az elnyert összeget (figyelmeztető validáció).
- Banki kivonat csatolható a fizetés igazolásához.

### 16.5 Kapcsolódó dokumentumtípusok
- Számla
- Banki kivonat
- Egyéb

### 16.6 Összesítő nézet
A [7] lépés tartalmaz egy összesítőt:
- összes rögzített számla összege,
- ebből kifizetett és kifizetetlen,
- elnyert összeg versus felhasznált összeg (egyenleg).

### 16.7 Elfogadási kritériumok
- A pénzügyes tud új számlát rögzíteni a pályázati munkatárs beavatkozása nélkül.
- A számla listán szűrhető: fizetve / nem fizetve.
- Lezárt pályázatnál számlák nem módosíthatók.

---

## 17. Események és teljesítések igazolása

### 17.1 Modul célja
Annak dokumentálása, hogy a pályázati célja szerinti esemény megtörtént vagy a tárgyi ellenszolgáltatás megérkezett.

### 17.2 Érintett szerepkörök
- Létrehozás/módosítás: FoundationAdmin, Pályázati munkatárs
- Megtekintés: Minden szerepkör

### 17.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Igazolás típusa | Enum (Esemény / Tárgyi teljesítés) | ✅ | – |
| Esemény időpontja | Dátum | ✅ (ha Esemény) | – |
| Tárgyi ellenszolgáltatás megérkezésének időpontja | Dátum | ✅ (ha Tárgyi) | – |
| Leírás | Szöveg | ❌ | – |
| Fotós igazolás | Fájl(ok) | ✅ | Kép típusú fájl (jpg, png, stb.) |
| Kapcsolt költési terv tétel | Tétel hivatkozás | ❌ | – |

### 17.4 Üzleti szabályok
- Legalább 1 fotó feltöltése kötelező az igazolás lezárásához.
- Egy pályázathoz több igazolás is rögzíthető (pl. több esemény vagy több tárgyi tétel).
- A lépés kihagyható, ha a pályázat természete nem igényel ilyen igazolást.

### 17.5 Kapcsolódó dokumentumtípusok
- Fotó (kötelező)
- Egyéb (pl. jelenléti ív, átvételi elismervény)

### 17.6 Elfogadási kritériumok
- Fotó feltöltése nélkül az igazolás nem rögzíthető.
- A feltöltött fotók bélyegképként megjelennek a lépés nézetén.
- Igazolás törlése esetén a fotók is törlődnek (vagy az FoundationAdmin kezeli az árva fájlokat).

---

## 18. Elszámolás kezelése

### 18.1 Modul célja
A pályáztató felé teljesítendő pénzügyi és tartalmi elszámolás rögzítése.

### 18.2 Érintett szerepkörök
- Létrehozás: FoundationAdmin, Pénzügyes, Pályázati munkatárs
- Módosítás: FoundationAdmin, Pénzügyes
- Jóváhagyás (lezárás): Elnök, FoundationAdmin
- Megtekintés: Minden szerepkör

### 18.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Elszámolás időpontja | Dátum | ✅ | Múltbeli vagy jelenlegi |
| Elszámolás módja | Kódszótár | ❌ | Pl.: online, postai, személyes |
| Összefoglaló leírás | Szöveg | ❌ | – |
| Megjegyzés | Szöveg | ❌ | – |

### 18.4 Üzleti szabályok
- Az elszámolás csak akkor zárható le, ha az elnyert összeg legalább 80%-a rögzített számlákon lefedett (figyelmeztető validáció, nem blokkoló).

> **Szakmai feltételezés:** A 80%-os küszöbérték üzleti döntés, a nyitott kérdéseknél felvetésre kerül.

- Az elszámolás lezárása és Elnöki jóváhagyása után a pályázat `CLOSED_WON` állapotba kerül.
- Lezárás után az összes lépés `LOCKED` státuszba kerül.

### 18.5 Kapcsolódó dokumentumtípusok
- Beszámoló
- Banki kivonat
- Számla
- Fotó
- Egyéb

### 18.6 Elfogadási kritériumok
- Az elszámolás elmentése után az Elnök kap értesítést a jóváhagyáshoz.
- Jóváhagyás visszavonható mindaddig, amíg a pályázat ténylegesen `CLOSED_WON` állapotba nem kerül.
- A lezárt pályázaton az Elszámolás lépés csak olvasható módban jelenik meg.

---

## 19. Dokumentumkezelés

### 19.1 Modul célja
A pályázati folyamat bármely lépéséhez kapcsolódó fájlok feltöltése, tárolása és kezelése.

### 19.2 Dokumentumtípusok (kódszótárból)

| Dokumentumtípus | Tipikus lépés |
|---|---|
| Pályázati kiírás | [1] Felhívás |
| Benyújtott pályázat | [2] Beadás |
| Támogatói okirat | [3] Eredmény |
| Szerződés (pályáztatóval) | [4] Értesítő/szerződés |
| Szerződés (alvállalkozói) | [6] Alvállalkozói szerz. |
| Számla | [7] Számlák |
| Banki kivonat | [7] Számlák, [9] Elszámolás |
| Fotó | [8] Igazolás |
| Beszámoló | [9] Elszámolás |
| Egyéb | Bármely lépés |

### 19.3 Feltöltési szabályok

| Mező neve | Szabály |
|---|---|
| Fájlméret limit | Maximum 50 MB/fájl (konfigurálható) |
| Engedélyezett formátumok | PDF, DOCX, XLSX, JPG, PNG, TIFF, MSG, EML |
| Fájlnév | Eredeti fájlnév megőrzésre kerül |
| Verziózás | Egy dokumentumhoz feltölthető új verzió, a régi megmarad |
| Törlés | Soft delete; a fájl tárhelyről nem kerül azonnal törlésre |

> **Szakmai feltételezés:** Verziózás egyszerű módban: az újabb feltöltés „aktív", a korábbi „archív" verziónak minősül. Teljes verziókövető rendszer (diff, merge) nem szükséges.

### 19.4 Adatmezők

| Mező neve | Típus | Kötelező |
|---|---|---|
| Fájl | Bináris | ✅ |
| Dokumentumtípus | Kódszótár | ✅ |
| Megjelenítési név | Szöveg | ❌ (default: fájlnév) |
| Feltöltés időpontja | Timestamp | Automatikus |
| Feltöltötte | Felhasználó | Automatikus |
| Verzió | Egész szám | Automatikus |
| Megjegyzés a dokumentumhoz | Szöveg | ❌ |

### 19.5 Üzleti szabályok
- Dokumentum feltölthető bármely lépésnél, bármely jogosult szerepkör által.
- Dokumentum nem törölhető véglegesen (csak FoundationAdmin archiválhat).
- Mindenki megtekintheti a csatolt dokumentumokat olvasási jogkörrel.
- A fájlok közvetlen letöltési link vagy előnézet formájában elérhetők.

### 19.6 Elfogadási kritériumok
- Fájlfeltöltés progress bar-ral jelzett folyamat.
- Nem engedélyezett fájlformátum esetén hibaüzenet jelenik meg.
- Sikeres feltöltés után a dokumentum azonnal megjelenik a csatolmányok listájában.

---

## 20. E-mail csatolások kezelése

### 20.1 Modul célja
A pályázathoz kapcsolódó elektronikus levelezés dokumentálása. Az e-mailek nem az alkalmazásból kerülnek kiküldésre, hanem meglévő leveleket csatolunk hozzájuk.

### 20.2 Csatolási módok

1. **Fájlként feltöltés**: Az e-mail exportált formátumban (.eml, .msg) töltendő fel.
2. **Manuális rögzítés**: Az e-mail legfontosabb adatait (feladó, cím, dátum, tartalom összefoglalója) kézzel rögzíti a felhasználó.

> **Szakmai feltételezés:** Gmail-integráció (API alapú e-mail szinkronizáció) a jelen verzióban nem tervezett, de a 35. fejezetben bővítési lehetőségként szerepel.

### 20.3 Adatmezők (manuális rögzítés)

| Mező neve | Típus | Kötelező |
|---|---|---|
| Tárgy | Szöveg (max. 500 kar.) | ✅ |
| Feladó e-mail cím | Szöveg | ✅ |
| Küldés dátuma | Dátum + idő | ✅ |
| Irány | Enum (Bejövő / Kimenő) | ✅ |
| Tartalom összefoglalója | Hosszú szöveg | ❌ |
| Csatolt fájl (.eml/.msg) | Bináris | ❌ |

### 20.4 Üzleti szabályok
- Egy lépéshez több e-mail is csatolható.
- Az e-mail csatolmány nem önálló dokumentum, hanem a kommunikáció nyomvonalának részét képezi.
- E-mail törölhető az azt rögzítő felhasználó által (saját rögzítés esetén) vagy FoundationAdmin által.

### 20.5 Elfogadási kritériumok
- E-mail hozzáadható bármely lépés részletes nézetéből.
- Az e-mail csatolmányok időrendben jelennek meg (legújabb felül).
- E-mail előnézet megjeleníthető (ha .eml/.msg fájl is feltöltésre kerül).

---

## 21. Megjegyzések kezelése

### 21.1 Modul célja
Rövid vagy hosszabb szöveges megjegyzések rögzítése minden pályázati lépésnél a kontextus és a döntések dokumentálásához.

### 21.2 Adatmezők

| Mező neve | Típus | Kötelező |
|---|---|---|
| Szöveg | Hosszú szöveg | ✅ |
| Létrehozva | Timestamp | Automatikus |
| Létrehozta | Felhasználó | Automatikus |
| Módosítva | Timestamp | Automatikus (ha módosítva) |

### 21.3 Üzleti szabályok
- Megjegyzés szerkeszthető a saját szerző által (és FoundationAdmin által).
- Megjegyzés törölhető a saját szerző által (és FoundationAdmin által); törölt megjegyzés helyén „Törölve" felirat jelenik meg, a tartalom nem látható.
- Megjegyzéseket más felhasználók nem módosíthatják.
- A megjegyzések időrendben (legújabb alul) jelennek meg; chat-szerű megjelenítés ajánlott.

### 21.4 Elfogadási kritériumok
- Megjegyzés hozzáadható egyetlen kattintással a lépés nézetéből.
- A megjegyzés szerzője és időpontja mindig megjelenik.
- Törölt megjegyzésnél a törlés ténye naplózva van.

---

## 22. Pályáztatók kezelése

### 22.1 Modul célja
A pályázatokat kiíró szervezetek önálló, visszakereshető nyilvántartása. A pályáztató nem kódszótár-elem, hanem önálló entitás kapcsolódó adatokkal.

### 22.2 Érintett szerepkörök
- Létrehozás/módosítás: FoundationAdmin, Pályázati munkatárs
- Törlés/Archiválás: FoundationAdmin
- Megtekintés: Minden szerepkör

### 22.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Megnevezés | Szöveg (max. 300 kar.) | ✅ | Egyedi (rendszeren belül) |
| Leírás | Hosszú szöveg | ❌ | – |
| Telefonszám | Szöveg | ❌ | Formátum ellenőrzés (opcionális) |
| E-mail cím | Szöveg | ❌ | Érvényes e-mail formátum |
| Státusz | Enum (Aktív / Inaktív) | ✅ | Default: Aktív |

### 22.4 Kapcsolódó adatok (csak olvasható, összesítés)
- Eddig hozzákapcsolt pályázatok száma és listája.

### 22.5 Üzleti szabályok
- Aktív pályázathoz kapcsolt pályáztató nem törölhető (csak inaktiválható).
- Inaktív pályáztató esetén figyelmeztető üzenet jelenik meg új pályázat rögzítésekor.

### 22.6 Elfogadási kritériumok
- Pályáztató nevére keresés működik a legördülő listában (autocomplete).
- A pályáztató részletező oldalán megjelennek a kapcsolt pályázatok.

---

## 23. Szerződő cégek kezelése

### 23.1 Modul célja
Az alvállalkozói szerződések partnerének (külső cég, szolgáltató, szállító) nyilvántartása. Nem kódszótár-elem, hanem önálló entitás.

### 23.2 Érintett szerepkörök
- Létrehozás/módosítás: FoundationAdmin, Pályázati munkatárs, Pénzügyes
- Törlés/Archiválás: FoundationAdmin
- Megtekintés: Minden szerepkör

### 23.3 Adatmezők

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Megnevezés | Szöveg (max. 300 kar.) | ✅ | Egyedi (rendszeren belül) |
| Adószám | Szöveg (max. 20 kar.) | ❌ | Magyar adószám formátum (pl. 12345678-1-23) |
| Cím | Szöveg | ❌ | – |
| Telefonszám | Szöveg | ❌ | – |
| E-mail cím | Szöveg | ❌ | Érvényes formátum |
| Státusz | Enum (Aktív / Inaktív) | ✅ | Default: Aktív |

### 23.4 Kapcsolódó adatok (csak olvasható)
- Eddigi kapcsolt pályázatok és szerződések száma és listája.

### 23.5 Üzleti szabályok
- Aktív szerződéssel rendelkező cég nem törölhető, csak inaktiválható.
- Adószám formátumellenőrzés nem blokkoló (csak figyelmeztető validáció).

### 23.6 Elfogadási kritériumok
- Cég neve autocomplete-tel kereshető alvállalkozói szerződés rögzítésekor.
- A cég részletező oldalán megjelennek a kapcsolt szerződések pályázatonként bontva.

---

## 24. Kódszótárak kezelése

### 24.1 Modul célja
A rendszerben használt értékkészletek adminisztrátor általi karbantartása. A kódszótárak bővíthetők, szerkeszthetők és sorbarendezhetők.

### 24.2 Érintett szerepkörök
- Teljes CRUD: FoundationAdmin
- Megtekintés: Minden szerepkör (a kódszótárak tartalmát az összes felhasználó olvashatja)

### 24.3 Kódszótár-típusok (rendszer-szintű, előre definiált)

| Kódszótár neve | Használat helye |
|---|---|
| Pályázat típusa | Pályázati felhívás |
| Dokumentumtípus | Dokumentumkezelés |
| Beadás módja | Pályázati anyag |
| Elszámolás módja | Elszámolás |
| Esemény típusa | Esemény/teljesítés igazolása |

### 24.4 Adatmezők (kódszótár típus)

| Mező neve | Típus | Kötelező |
|---|---|---|
| Kódszótár neve | Szöveg (max. 100 kar.) | ✅ |
| Leírás | Szöveg | ❌ |
| Rendszer-szintű? | Boolean | Automatikus |

### 24.5 Adatmezők (kódszótár elem)

| Mező neve | Típus | Kötelező | Validáció |
|---|---|---|---|
| Kód | Szöveg (max. 50 kar.) | ✅ | Egyedi a szótáron belül |
| Megnevezés | Szöveg (max. 200 kar.) | ✅ | Nem üres |
| Leírás | Szöveg | ❌ | – |
| Sorrend | Egész szám | ✅ | Pozitív; drag-and-drop rendezéssel módosítható |
| Státusz | Enum (Aktív / Inaktív) | ✅ | Default: Aktív |

### 24.6 Üzleti szabályok
- Rendszer-szintű kódszótárak nem törölhetők, csak bővíthetők és elemeik módosíthatók.
- FoundationAdmin saját kódszótárakat is létrehozhat egyedi üzleti szükségletekre.
- Inaktív kódszótár-elem nem jelenik meg a kiválasztó listákban, de a már kapcsolt rekordokon megmarad.
- Kódszótár elem sorrendje határozza meg a legördülő listák sorrendjét az alkalmazásban.

### 24.7 Elfogadási kritériumok
- Kódszótár-elemek drag-and-drop-pal sorba rendezhetők.
- Inaktív elem esetén a kapcsolt pályázat adatlapján az elem értéke megjeleníthető, de kiválasztásra nem ajánlott.

---

## 25. Felhasználói profil

### 25.1 Modul célja
A bejelentkezett felhasználó saját adatainak megtekintése és korlátozott módosítása.

### 25.2 Adatmezők

| Mező neve | Forrás | Módosítható? |
|---|---|---|
| Teljes név | Google fiók | Nem (szinkronizált) |
| E-mail cím | Google fiók | Nem |
| Profilkép | Google fiók | Nem |
| Szerepkör | FoundationAdmin által beállított | Nem (saját magán) |
| Értesítési beállítások | Felhasználó | ✅ |
| Felhasználói felület nyelve | Felhasználó | ✅ (ha több nyelv elérhető) |
| Utolsó bejelentkezés | Rendszer | Nem |

### 25.3 Üzleti szabályok
- A felhasználó saját szerepkörét nem módosíthatja.
- Az értesítési beállítások testreszabhatók (pl. melyik típusú értesítéseket kap e-mailben).

### 25.4 Elfogadási kritériumok
- A profiloldal elérhető a navigációs sávból.
- Az értesítési beállítások mentése azonnal életbe lép.

---

## 26. Adminisztrációs funkciók

Az adminisztrációs funkciók a háromszintű felügyeleti hierarchia szerint vannak strukturálva: platform-, owner- és alapítvány-szintű feladatkörök külön UI-felületeken érhetők el, és külön bejelentkezési hatókörökhöz tartoznak.

### 26.1 Platform-szintű adminisztráció

A platform-szintű funkciók kizárólag PlatformAdmin és PlatformAuditor szerepkörrel érhetők el, külön UI-belépési ponton (`/platform`).

#### 26.1.1 Owners (tulajdonosok) kezelése

- Új Owner provisioning: szervezetnév, technikai kapcsolattartó e-mail címe, kezdő OwnerAdmin meghívásához használt Google-fiók.
- Owner-lifecycle állapotok: `ACTIVE`, `SUSPENDED`, `ARCHIVED`.
- Owner felfüggesztése: az alá tartozó felhasználók nem tudnak bejelentkezni, az adatok megőrzöttek maradnak.
- Owner archiválása: soft delete, csak akkor engedélyezett, ha minden alá tartozó alapítvány előzőleg archivált vagy migrált.

#### 26.1.2 Platform-szintű felhasználókezelés

- PlatformAdmin / PlatformAuditor szerepkörök kiosztása, módosítása, visszavonása.
- Platform-szintű felhasználó **nem rendelkezhet** egyidejűleg Owner- vagy Foundation-szintű szerepkörrel (jogosultság-szétválasztás).
- Meghívási folyamat: lásd 26.3.2; a meghívó hatóköre ebben az esetben `PLATFORM`.

#### 26.1.3 Platform-szintű technikai beállítások

| Beállítás | Leírás |
|---|---|
| Fájlméret korlát | Maximum feltöltési méret MB-ban (platform-szintű alapérték) |
| Meghívó érvényességi ideje | Hány óráig érvényes a kiküldött meghívó link (default: 72 óra) |
| Alapértelmezett értesítési határidők | Hány nappal előre küldjön figyelmeztetőt (default: 7 nap) — Owner/Foundation-szinten felülírható |
| Default Owner-szintű kódszótár-sablon | Új Owner létrehozásakor örökölt értékkészlet (NK-16) |

#### 26.1.4 Platform audit napló

- Minden platform-szintű művelet, Owner-lifecycle esemény és break-glass hozzáférés naplózva.
- Szűrhető: PlatformAdmin felhasználó, érintett Owner, dátumintervallum, művelettípus szerint.

#### 26.1.5 Break-glass hozzáférés Owner üzleti adataihoz

- PlatformAdmin szükség esetén időkorlátos, indoklott Owner-szintű hozzáférést kaphat (lásd 5.5).
- Az indítás kötelező szöveges indoklást igényel.
- Az érintett Owner OwnerAdminja automatikusan e-mail értesítést kap.
- A hozzáférés alapértelmezett időtartama 24 óra; lejáratkor automatikus visszavonás.
- Külön audit-bejegyzés készül `BREAK_GLASS_ACCESS` művelettípussal.

### 26.2 Owner-szintű adminisztráció

Az Owner-szintű funkciók kizárólag OwnerAdmin és OwnerAuditor szerepkörrel érhetők el.

#### 26.2.1 Alapítványok (Foundations) kezelése

- Új alapítvány létrehozása: alapítvány neve, branding (logó, megjelenítendő név), kezdő FoundationAdmin meghívásához használt Google-fiók.
- Új alapítvány automatikusan örökli az Owner-szintű kódszótár-sablonokat (NK-16).
- Új alapítvány létrehozásakor opcionálisan átmásolhatók az Owner alá tartozó **másik** alapítvány Pályáztatói és Szerződő cégei (NK-15 — sablonmásolás, nem megosztás).
- Alapítvány-lifecycle: `ACTIVE`, `ARCHIVED`.
- Alapítvány archiválása soft delete; csak akkor lehetséges, ha nincs aktív (nem lezárt) pályázata.

#### 26.2.2 Owner-szintű felhasználókezelés és cross-foundation hozzárendelés

- Az Owner alá tartozó összes felhasználó listája egy helyen, alapítvány-szerinti szerepkörrel együtt.
- OwnerAdmin új felhasználót hívhat meg az Owner-hez és tetszőleges saját alapítványához rendelhet alapítvány-szintű szerepkörrel.
- OwnerAdmin/OwnerAuditor szerepkört kiosztani **nem** lehet itt; ezt kizárólag PlatformAdmin végzi.
- A meghívási folyamat hatóköre: `OWNER` (legalább egy alapítvány-szintű hozzárendeléssel együtt).

#### 26.2.3 Owner-szintű kódszótár-sablonok

- Az Owner-szintű kódszótár-sablonok az adott Owner alá tartozó **új** alapítványoknak az alapértelmezett értékkészletét jelentik.
- A már létező alapítványok saját kódszótárai változatlanok maradnak; az Owner-szintű sablon módosítása nem hat vissza rájuk automatikusan.
- Sablon manuálisan „újra-alkalmazható" egy létező alapítványra, ami a hiányzó tételeket pótolja (meglévőket nem ír felül).

#### 26.2.4 Cross-foundation jelentések

- Az OwnerAdmin/OwnerAuditor összevont jelentéseket lát az Owner alá tartozó összes alapítványra:
  - aktuális pályázati állapot-megoszlás (folyamatban / nyert / lezárt);
  - elnyert összeg alapítványonkénti és összevont bontásban;
  - elszámolási státuszok cross-foundation áttekintése.
- A részletes pályázati nézet alapítvány-specifikus; OwnerAdmin a foundation switcheren keresztül navigál a részletekhez.

#### 26.2.5 Owner-szintű audit napló

- Az Owner alá tartozó összes alapítvány audit-eseményei összevonva.
- Szűrhető: felhasználó, alapítvány, dátumintervallum, entitás típus, művelet típusa szerint.

### 26.3 Alapítvány-szintű adminisztráció

Az alapítvány-szintű funkciók FoundationAdmin szerepkörrel érhetők el, az aktuálisan kiválasztott alapítvány hatókörén belül.

#### 26.3.1 Felhasználókezelés (alapítvány-szintű)

- Felhasználók listázása az adott alapítványon belül (név, e-mail, alapítvány-szintű szerepkör, utolsó belépés, státusz).
- Alapítvány-szintű szerepkör módosítása meglévő felhasználónak (kivéve OwnerAdmin/OwnerAuditor/PlatformAdmin/PlatformAuditor).
- Felhasználó **alapítvány-szintű** hozzárendelésének inaktiválása vagy törlése: a felhasználó Owner-szinten megmarad, csak az adott alapítvány hozzáférését veszti el.
- Meghívók kezelése az alapítvány hatókörén belül: új meghívó kiküldése, lejárt meghívó újraküldése, függőben lévő meghívó visszavonása.

#### 26.3.2 Meghívásos regisztrációs folyamat

A rendszerbe kizárólag meghívott felhasználók léphetnek be. Automatikus önregisztráció nem engedélyezett.

**A meghívási folyamat lépései:**
1. A meghívást indító felelős (PlatformAdmin / OwnerAdmin / FoundationAdmin) létrehoz egy meghívót: megadja a felhasználó e-mail címét, a meghívó **hatókörét** (PLATFORM / OWNER / FOUNDATION) és a szándékolt szerepkört.
2. A rendszer meghívó e-mailt küld egy egyszer használatos, időkorlátozott tokennel.
3. A felhasználó a meghívó linkre kattint, és Google OAuth-on hitelesíti magát.
4. A rendszer ellenőrzi, hogy a Google-fiók e-mail címe megegyezik-e a meghívott e-mail címmel.
5. Egyezés esetén a fiók aktiválódik a megadott hatókörrel és szerepkörrel.
6. Eltérés esetén a bejelentkezés megtagadva; hibaüzenet jelenik meg: „A Google-fiókod e-mail címe nem egyezik a meghívóban szereplő címmel."

**Meghívó státuszok:**

| Státusz | Leírás |
|---|---|
| `PENDING` | Kiküldve, a felhasználó még nem fogadta el |
| `ACCEPTED` | A felhasználó aktiválta a fiókját |
| `EXPIRED` | Lejárt (érvényességi idő eltelt, újraküldhető) |
| `REVOKED` | Az indító felelős visszavonta elfogadás előtt |

**Üzleti szabályok:**
- Meghívó nélkül a Google OAuth sikeres hitelesítés ellenére sem jön létre felhasználói fiók.
- Egy e-mail címre egyszerre csak egy aktív (`PENDING`) meghívó létezhet, **hatókörönként**.
- Egy felhasználó legfeljebb egy Owner-hez tartozhat (NK-13); ha már egy Owner-hez tartozik, idegen Owner alá szóló meghívót csak akkor fogadhat el, ha az előzőt törlik (külön Google-fiók ajánlott).
- Platform-szintű meghívót csak PlatformAdmin küldhet; Owner-szintűt csak PlatformAdmin küldhet; Foundation-szintűt OwnerAdmin vagy FoundationAdmin küldhet.
- Lejárt meghívó újraküldhető; az újraküldés új tokent generál és visszaállítja az érvényességi időt.
- Meghívó visszavonható mindaddig, amíg a felhasználó el nem fogadta (`PENDING` státusz).
- Az **utolsó admin szabály** (lásd 5.5) minden szinten érvényesül: az utolsó aktív felelős szerepköre nem vonható vissza.
- Senki nem inaktiválhatja saját magát egyik szinten sem (self-demotion tiltás).

#### 26.3.3 Alapítvány-szintű beállítások

| Beállítás | Leírás |
|---|---|
| Alapítvány neve | Megjelenik a UI-ban és az exportált dokumentumokon |
| Alapítvány logó | A foundation switcherben és a fejléceken jelenik meg |
| Értesítési határidők (felülírás) | A platform-szintű alapérték felülírása (NK-19 alapján csak alapítvány-szinten) |
| Alapítvány-szintű kódszótár-felülírás | Az Owner-szintű sablon felülírása és bővítése |

#### 26.3.4 Alapítvány audit napló

- A FoundationAdmin megtekintheti az adott alapítvány teljes audit naplóját (lásd 29. fejezet).
- Szűrhető: felhasználó, dátumintervallum, entitás típus, művelet típusa szerint.

### 26.4 Foundation switcher (alapítvány-váltó)

- A navigációs sávban elérhető, ha a felhasználó több alapítványhoz vagy szintű hatókörhöz tartozik.
- Az OwnerAdmin a switcheren keresztül léphet be bármely saját alapítvány kontextusába.
- A switcher használata új scope-claim refresh-t indít a backenden; a JWT új `foundation_id` (és szükség esetén `owner_role`) értékkel készül.
- A foundation switcher használata audit-eseményt generál (`SCOPE_SWITCH`).

### 26.5 Elfogadási kritériumok

- A felhasználólista keresési mezővel szűrhető minden szinten.
- Szerepkör-módosítás azonnal életbe lép (a felhasználó következő oldalbetöltésekor vagy scope-váltáskor).
- A meghívási folyamat egyértelműen jelzi a UI-ban, hogy melyik hatókörbe (Platform / Owner / Foundation) szól a meghívó.
- Az utolsó admin szabály megsértésére irányuló műveleteket a UI proaktívan megakadályozza (gomb tiltása + magyarázat).

---

## 27. Keresés, szűrés, listázás

### 27.1 Pályázatok listanézete

#### Elérhető szűrők
| Szűrő | Típus |
|---|---|
| Pályázat neve / azonosítója | Szabad szöveges keresés |
| Pályáztató | Legördülő (entitás) |
| Pályázat típusa | Kódszótár alapú |
| Állapot | Checkbox (DRAFT, IN_PROGRESS, SUBMITTED, WON, LOST, CLOSED_WON, CLOSED_LOST) |
| Beadási határidő (tól-ig) | Dátumtartomány |
| Elnyert összeg (tól-ig) | Számsáv |
| Felelős munkatárs | Felhasználó |

#### Rendezési lehetőségek
- Beadási határidő (növekvő/csökkenő)
- Elnyert összeg (növekvő/csökkenő)
- Legutóbb módosítva
- Állapot

#### Listanézet oszlopai (konfigurálható)
- Pályázat neve
- Pályáztató
- Állapot
- Beadási határidő
- Elnyert összeg
- Aktuális lépés
- Utolsó módosítás

### 27.2 Globális keresés
- Keresési mező a navigációs sávban.
- Keres: pályázat neve, pályáztató neve, szerződő cég neve, dokumentum neve mezőkben.
- Eredmény csoportosítva jelenik meg entitástípusonként.

### 27.3 Exportálás
- A szűrt pályázatlista exportálható Excel (.xlsx) formátumban.
- Az export tartalmazza a listanézet látható oszlopait.

### 27.4 Elfogadási kritériumok
- A szűrők URL-be menthetők (könyvjelzőzhető szűrt nézet).
- Az oldal nem lapoz, hanem végtelen görgetést (infinite scroll) vagy lapozást (pagination) alkalmaz.
- Üres találat esetén informatív üzenet jelenik meg.

---

## 28. Értesítések és határidőfigyelés

### 28.1 Értesítési típusok

| Esemény | Értesített szerepkörök | Csatorna |
|---|---|---|
| Beadási határidő közeleg (7 nappal előtte) | Pályázati munkatárs, Elnök | Rendszer értesítés + e-mail |
| Beadási határidő elmaradt (1 nappal utána) | Pályázati munkatárs, FoundationAdmin | Rendszer értesítés + e-mail |
| Elköltési határidő közeleg (14 nappal előtte) | Pénzügyes, Elnök | Rendszer értesítés + e-mail |
| Pályázati eredmény rögzítve | Elnök, FoundationAdmin | Rendszer értesítés |
| Elszámolás jóváhagyásra vár | Elnök | Rendszer értesítés + e-mail |
| Új megjegyzés rögzítve | Érintett lépés utolsó módosítója | Rendszer értesítés |
| Dokumentum feltöltve | Érintett pályázat felelőse | Rendszer értesítés |
| Meghívó kiküldve | Meghívott felhasználó | E-mail |
| Meghívó 24 órán belül lejár | Meghívott felhasználó | E-mail |
| Meghívó elfogadva (fiók aktiválva) | FoundationAdmin | Rendszer értesítés |

### 28.2 Rendszer értesítések
- A navigációs sávon értesítési harang ikon, számlálóval.
- Értesítések listája megtekinthető, olvasottnak jelölhető.
- Olvasatlan értesítések száma megjelenik az ikon mellett.

### 28.3 E-mail értesítések
- Az e-mail értesítések felhasználónként kikapcsolhatók a profil beállításokban.
- Az e-mail szövege tartalmazza a pályázat nevét és egy közvetlen linket.
- Az e-mail küldő cím a rendszergazda által konfigurálható.

> **Szakmai feltételezés:** Az e-mail küldéshez SMTP szerver szükséges; Google Workspace SMTP integráció ajánlott az alapítvány Gmail-fiókjának felhasználásával.

### 28.4 Elfogadási kritériumok
- Az értesítési lista valós időben frissül (WebSocket vagy polling).
- Az értesítésre kattintva közvetlenül az érintett pályázati lépésre navigál.

---

## 29. Audit naplózás

### 29.1 Modul célja
Minden adatmódosítás visszakövethetőségének biztosítása.

### 29.2 Naplózott műveletek

Minden audit-bejegyzés tartalmazza a kapcsolódó `OwnerId` és `FoundationId` (ha értelmezhető) mezőket, hogy a napló a hatókör-hierarchia szerint szűrhető legyen.

| Művelettípus | Naplózott adatok |
|---|---|
| Létrehozás (C) | Entitás típus, entitás ID, létrehozó felhasználó, hatókör (OwnerId/FoundationId), időbélyeg, új értékek |
| Módosítás (U) | Entitás típus, entitás ID, módosító felhasználó, hatókör, időbélyeg, módosított mező, régi érték, új érték |
| Törlés/Archiválás (D) | Entitás típus, entitás ID, törlő felhasználó, hatókör, időbélyeg |
| Állapotváltás | Entitás típus, entitás ID, felhasználó, hatókör, időbélyeg, régi állapot, új állapot |
| Bejelentkezés | Felhasználó, hatókör, időbélyeg, IP cím |
| Szerepkör-módosítás | Érintett felhasználó, módosító felelős, érintett hatókör, régi/új szerepkör, időbélyeg |
| Hatókör-váltás (`SCOPE_SWITCH`) | Felhasználó, kiinduló hatókör, új hatókör, időbélyeg |
| Break-glass hozzáférés (`BREAK_GLASS_ACCESS`) | PlatformAdmin, érintett Owner, indoklás, kezdő/lejárati időbélyeg |

### 29.3 Megőrzési idő
- Az audit napló bejegyzések **5 évig** megőrzésre kerülnek.
- Az audit napló nem törölhető (csak FoundationAdmin által exportálható).

### 29.4 Megtekintési jogosultság
- Platform-szintű audit napló (teljes platform): PlatformAdmin, PlatformAuditor
- Owner-szintű audit napló (az adott Owner alá tartozó összes alapítvány összevontan): OwnerAdmin, OwnerAuditor
- Alapítvány-szintű audit napló (egy adott alapítvány): FoundationAdmin
- Saját pályázatok auditja az adott alapítványon belül: Elnök

### 29.5 Elfogadási kritériumok
- Az audit napló szűrhető: entitás típus, felhasználó, dátumintervallum, művelettípus szerint.
- Az audit napló exportálható CSV formátumban.
- Minden pályázat részletes nézetén elérhető az adott pályázatra vonatkozó audit napló (csak FoundationAdmin és Elnök számára).

---

## 30. Nem funkcionális követelmények

### 30.1 Teljesítmény

| Mutató | Elvárás |
|---|---|
| Oldalbetöltési idő (lista nézetek) | < 2 másodperc normál körülmények között |
| API válaszidő (CRUD műveletek) | < 500 ms (95. percentilis) |
| Fájlfeltöltés sebessége | Függő a sávszélességtől; 50 MB-os fájl legfeljebb 60 s alatt |
| Egyidejű felhasználók | Min. 20 párhuzamos aktív felhasználó kiszolgálása |

### 30.2 Rendelkezésre állás
- Tervezett üzemidő: 99% (munkaidőben, hétköznap 8–18 óra között).
- Karbantartási ablak: munkaidőn kívül.

### 30.3 Skálázhatóság
- Az alkalmazás tervezési fázisban előre láthatóan max. 50–100 aktív felhasználót kiszolgáló méretű rendszer.
- Az architektúra horizontálisan skálázható legyen (konténerizáció ajánlott).

### 30.4 Böngészőtámogatás
- Chrome (utolsó 2 verzió)
- Firefox (utolsó 2 verzió)
- Edge (utolsó 2 verzió)
- Safari (utolsó 1 verzió, macOS)
- Reszponzív megjelenítés: tablet (768px+) és asztali (1280px+) felbontáson

### 30.5 Hozzáférhetőség
- WCAG 2.1 AA szintű megfelelőség elvárt a fő munkafolyamat oldalain.

### 30.6 Lokalizáció
- Az alkalmazás elsődleges nyelve **magyar**.
- Dátumok és számok magyar formátumban jelennek meg (ÉÉÉÉ.HH.NN; ezres elválasztó: szóköz, tizedes: vessző).
- Angol nyelvi változat a jövőbeni bővítési lehetőségek között szerepel.

---

## 31. Biztonsági követelmények

### 31.1 Hitelesítés
- Kizárólag Google/Gmail OAuth 2.0 / OpenID Connect alapú bejelentkezés.
- Munkamenet token (JWT) alapú; lejárat: 8 óra (konfigurálható).
- Refresh token biztonságos HttpOnly cookie-ban tárolva.
- Jelszókezelés, jelszómegadás nincs; a hitelesítés teljes egészében Google-nál.
- Minden bejelentkezési kísérletkor a rendszer ellenőrzi, hogy az autentikált Google-fiók e-mail címéhez létezik-e aktív, `ACCEPTED` státuszú felhasználói fiók. Ha nem létezik, a bejelentkezés megtagadva és a felhasználó tájékoztató üzenetet kap: „Hozzáféréshez meghívó szükséges. Kérj segítséget az adminisztrátortól."
- Meghívó nélküli belépési kísérlet naplózódik (e-mail cím, IP, időbélyeg).

### 31.2 Jogosultságkezelés
- Minden API végponton backend-oldali RBAC ellenőrzés (nem csak frontend).
- Jogosulatlan hozzáférési kísérlet naplózva és 403 HTTP válasszal visszautasítva.
- **Horizontális hatókör-izoláció:** minden felhasználó csak a hozzárendelt hatókörének (Foundation / Owner / Platform) adataihoz fér hozzá. A backend minden API-végponton ellenőrzi a kért entitás `OwnerId` és `FoundationId` mezőit a JWT-claim-ekkel szemben.
- **Vertikális hatókör-szétválasztás:** Foundation-szintű felhasználó nem érheti el Owner-szintű API-kat, Owner-szintű felhasználó nem érheti el Platform-szintű API-kat. A platform-, owner- és üzleti API-végpontok külön JWT „audience" értékkel rendelkeznek.
- A felhasználó hatóköre soha nem származhat kliensoldali bemenetből; mindig a tokenből származtatott, szerveroldalon ellenőrzött `OwnerId` / `FoundationId` / `Scope` claim alapján kerül kiszámításra.
- Break-glass hozzáférés esetén (lásd 5.5 és 26.1.5) az ideiglenes Owner-hozzáférés külön ellenőrzött és audit-flaggel ellátott.

### 31.3 Adatátvitel
- HTTPS (TLS 1.2+) kötelező minden kommunikációhoz.
- HTTP-ről automatikus átirányítás HTTPS-re.

### 31.4 Adattárolás
- Jelszó nem tárolódik a rendszerben.
- Személyes adatok (felhasználói adatok) minimalizált körben kerülnek tárolásra.
- Fájlok lokális szerveren tárolva, webszerver-hozzáférés közvetlen URL-en nem engedélyezett (csak bejelentkezett API-n keresztül).

### 31.5 Input validáció
- Minden felhasználói bevitel szerver oldalon is validált (nem csak kliens oldalon).
- SQL injection, XSS és CSRF elleni védelem alapkövetelmény.
- Fájlok MIME type ellenőrzése feltöltéskor (nemcsak fájlkiterjesztés alapján).

### 31.6 Naplózás biztonsági szempontból
- Sikertelen bejelentkezési kísérletek naplózva (IP, időbélyeg, Google account).
- Jogosultsági hibák naplózva.
- A napló nem tartalmaz érzékeny adatokat (pl. tokenek szövegét).

---

## 32. Adatkezelési és fájltárolási követelmények

### 32.1 Adatkezelési alapelvek
- Az adatkezelés az Európai Unió GDPR rendeletének és a magyar jogszabályoknak megfelelő.
- A rendszer **multi-tenant háromszintű hierarchia** szerint épül fel: Platform → Owner → Foundation. Az adatelkülönítés Owner és Foundation szinten egyaránt érvényes (shared-database / shared-schema modell `OwnerId` és `FoundationId` discriminator oszlopokkal, és kötelező adatbázis-szintű hatókör-szűréssel minden üzleti entitásra).
- Owner-ek közti adatszivárgás megakadályozása minden lekérdezés alapkövetelménye; az architektúra-validáció és az integrációs tesztek explicit ellenőrzik, hogy egyetlen lekérdezés sem futhat hatókör-szűrés nélkül.
- Személyes adatok: bejelentkezett felhasználók neve, e-mail címe, profilképe (Google-tól szinkronizált).

### 32.2 Adatmegőrzés
- Pályázati adatok és dokumentumok: a pályázat lezárásától számított legalább **10 év**.
- Audit napló: legalább **5 év**.
- Törölt/archivált rekordok: soft delete, adatok megőrződnek.

### 32.3 Fájltárolás
- Fájlok lokális fájlrendszeren tárolva, dedikált könyvtárstruktúrában.
- Könyvtárstruktúra ajánlott felépítése: `/uploads/{owner_id}/{foundation_id}/{év}/{pályázat_id}/{lépés_id}/{fájlnév_uuid}` (az `owner_id` és `foundation_id` szegmensek biztosítják a fájlszintű tenant-elkülönítést is)
- A webszerver nem szolgálja ki közvetlenül a feltöltött fájlokat; csak az API-n keresztül érhetők el (autentikált végponton).
- Rendszeres backup: napi biztonsági mentés ajánlott.

### 32.4 Adatexport
- Rendszergazda exportálhatja az összes pályázati adatot JSON formátumban (teljes adatexport).
- Egyes pályázatok adatai exportálhatók PDF vagy Excel formátumban (összefoglaló nézet).

---

## 33. Integrációs követelmények

### 33.1 Google OAuth / OpenID Connect
- Kötelező integráció a bejelentkezéshez.
- Szükséges Google API scope-ok: `openid`, `email`, `profile`.
- Refresh token kezelés: hosszú munkamenet támogatásához.

### 33.2 SMTP / E-mail küldés
- Értesítési e-mailek küldéséhez SMTP szerver szükséges.
- Ajánlott: Google Workspace SMTP (az alapítvány Gmail domainjéről küldve).
- Alternatíva: külső tranzakciós e-mail szolgáltató (pl. SendGrid, Mailgun).

### 33.3 Swagger / OpenAPI
- A backend API teljes mértékben dokumentált Swagger/OpenAPI 3.0 formátumban.
- A Swagger UI fejlesztési és tesztelési környezetben elérhető, éles rendszerben opcionálisan letiltható.

### 33.4 Nem tervezett integrációk (jelen verzióban)
- Gmail API (e-mail szinkronizáció)
- Számlázó rendszerek
- Banki API-k
- Dokumentumgeneráló rendszerek

Ezek bővítési lehetőségként szerepelnek a 35. fejezetben.

---

## 34. Nyitott kérdések

Az alábbi pontok üzleti döntést igényelnek, vagy pontosításra szorulnak a fejlesztés megkezdése előtt:

| # | Kérdés | Szakmai feltételezés (jelenleg alkalmazott) | Döntés szükséges |
|---|---|---|---|
| NK-01 | Szükséges-e az Elnök jóváhagyása a pályázati anyag beadásához, vagy ez Pályázati munkatárs önálló hatásköre? | Elnök jóváhagyása szükséges (konfigurálható) | Igen |
| NK-02 | Mi az elszámolás 80%-os küszöbértékének pontos üzleti szabálya? Blokkoló vagy csak figyelmeztető? | Figyelmeztető, nem blokkoló | Igen |
| NK-03 | Kell-e a rendszernek e-maileket küldeni, vagy elegendő a belső értesítési rendszer? | Mindkettő szükséges (e-mail kikapcsolható felhasználónként) | Igen |
| NK-04 | Több alapítvány is használja a rendszert (multi-tenant), vagy kizárólag egy szervezet? | **LEZÁRVA:** Multi-tenant, háromszintű felügyeleti hierarchiával: Platform → Owner (tulajdonos) → Foundation (alapítvány). Lásd 4., 5. és 26. fejezet. | – |
| NK-05 | A szerződő cég megadható-e szabadon (szöveges mező) a számlánál, vagy kötelezően az entitás-adatbázisból kell kiválasztani? | Kötelező kiválasztás vagy új létrehozás | Igen |
| NK-06 | Milyen mezők szükségesek a pályázat összefoglaló / egylapos nézetéhez (dashboard)? | Nincs feltételezés; üzleti prioritás kérdése | Igen |
| NK-07 | Szükséges-e munkafolyamat-visszalépés lehetősége (pl. nyert → beadott, ha hibás rögzítés volt)? | Csak FoundationAdmin végezhet visszalépést | Igen |
| NK-08 | A számlánál a „szállító" mezőt kötelezően a Szerződő cégek entitásból kell-e kitölteni, vagy szabadon szövegesen is megadható? | Szabadon szöveges (de opcionálisan linkelhető entitáshoz) | Igen |
| NK-09 | Szükséges-e a pályázatok között kapcsolatot kezelni (pl. alap- és kiegészítő pályázat)? | Nem tervezett | Igen |
| NK-10 | Milyen riport/statisztikai nézetek szükségesek (pl. éves összesítő, pályáztatónkénti statisztika)? | Nincs részletezve; bővítési lehetőség | Igen |
| NK-11 | A Google-fiók domain korlátozott-e? (Csak az alapítvány Google Workspace domainjéről lehet belépni?) | **LEZÁRVA:** A meghívásos modell bevezetésével domain-korlátozás helyett konkrét e-mail cím szintű hozzáférés-kezelés valósul meg. Bármelyik Gmail-fiók meghívható, de csak meghívott e-mail cím tud belépni. | – |
| NK-12 | Szükséges-e a fájlok vírusellenőrzése (antivirus scan) feltöltéskor? | Nem tervezett az alap verzióban | Igen |
| NK-13 | Egy felhasználó (Google-fiók) tartozhat-e egyszerre több Owner-hez? | **LEZÁRVA:** Nem. Külön Owner-hez tartozás külön Google-fiókot igényel. (Adatszivárgási kockázat csökkentés.) | – |
| NK-14 | Owner-en belül egy felhasználó automatikusan lát-e minden alapítványt, vagy csak amelyikbe expliciten meghívták? | **LEZÁRVA:** Csak amelyikbe expliciten meghívták (least privilege). | – |
| NK-15 | A Pályáztatók és a Szerződő cégek nyilvántartása Owner-szintű (megosztott) vagy alapítvány-szintű? | **LEZÁRVA:** Alapértelmezésben alapítvány-szintű (adatelkülönítés egyszerűbb). Owner-szintű sablonmásolás opcionálisan elérhető új alapítvány létrehozásakor (lásd 26.2). | – |
| NK-16 | Megengedett-e a kódszótár-hierarchia (Owner-szintű alapértelmezett + alapítvány-szintű felülírás)? | **LEZÁRVA:** Igen. Új alapítvány az Owner-szintű sablont örökli; alapítvány-szinten felülírható és bővíthető. | – |
| NK-17 | Lehet-e ugyanaz a felhasználó egyszerre OwnerAdmin és FoundationAdmin (saját alapítványában)? | **LEZÁRVA:** Igen, de a két szerepkör **különálló kinevezés**, és külön audit-bejegyzéssel jár. | – |
| NK-18 | PlatformAdmin „break-glass" hozzáférése Owner üzleti adataihoz: engedélyezett-e és milyen feltételekkel? | **LEZÁRVA:** Engedélyezett. Feltételek: kötelező szöveges indoklás, érintett OwnerAdmin automatikus értesítése, kiemelt audit-bejegyzés, alapértelmezett 24 órás időkorlát. | – |
| NK-19 | Szükséges-e Owner-szintű branding (logó, szervezetnév) az alapítvány-szintű mellé? | **LEZÁRVA:** Nem; csak alapítvány-szintű branding. Owner-szinten csak technikai metaadatok. | – |
| NK-20 | Owner-szintű előfizetés / számlázás a magtermék része-e? | **LEZÁRVA:** Nem; az SaaS-szolgáltató és az Owner közti kereskedelmi kapcsolat a rendszeren kívül kerül kezelésre. Ha későbbi bővítés válik szükségessé, külön FS-fejezet készül hozzá. | – |

---

## 35. Későbbi bővítési lehetőségek

Az alábbi funkciók az alaprendszer terjedelmébe nem tartoznak bele, de az architektúra tervezésekor érdemes figyelembe venni őket:

| # | Bővítés | Leírás |
|---|---|---|
| B-01 | Gmail API integráció | Az alapítvány Gmail-fiókjából automatikusan szinkronizálhatók a pályázathoz kapcsolódó e-mailek. |
| B-02 | Dashboard és riportok | Éves összesítők, pályáztatónkénti statisztikák, elnyert összegek trendje, grafikonos megjelenítés. |
| B-03 | Dokumentumgenerálás | Sablonból automatikusan generált elszámolási, szerződési vagy összefoglaló dokumentumok. |
| ~~B-04~~ | ~~Multi-tenant architektúra~~ | **ÁTHELYEZVE A MAGTERMÉKBE** (lásd 4., 5., 26. fejezet és NK-04 lezárása). |
| B-05 | Banki kivonat importálás | Banki adatok (CSV/XML) automatikus importálásával a kifizetések összevezetése a számlákkal. |
| B-06 | Elektronikus aláírás | Szerződések elektronikus aláírásának támogatása (pl. DocuSign, eIDAS-kompatibilis megoldás). |
| B-07 | Mobil alkalmazás | Native iOS/Android app a munkafolyamat mobil eszközről való kezeléséhez (különösen igazolási fotókhoz). |
| B-08 | Angol nyelvű felület | Többnyelvűség támogatása i18n keretrendszer bevezetésével. |
| B-09 | Szervezeti hierarchia | Osztályok, csoportok kezelése, delegált jogosultsági szintek. |
| B-10 | Pályázati naptár nézet | Beadási és elköltési határidők naptár formátumú megjelenítése. |
| B-11 | API külső rendszerek felé | Nyílt REST API harmadik fél integrációkhoz (pl. könyvelő szoftver, projektmenedzsment eszköz). |
| B-12 | Pályázati sablon | Visszatérő pályázatokhoz felhasználható sablon, amely előre kitölti az adatokat. |

---

*— Dokumentum vége —*

**Verzió:** 1.0  
**Utolsó módosítás:** 2025  
**Állapot:** Tervezet – jóváhagyásra vár  
