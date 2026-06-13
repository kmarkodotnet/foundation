# User Story-k – Pályázatkezelő Rendszer

**Kapcsolódó dokumentum:** `functional-specification.md` v1.0  
**Verzió:** 1.0  
**Státusz:** Tervezet  

---

## Jelölések és konvenciók

### Story formátum
```
US-XXX | [Modul] Rövid cím
Mint [szerepkör],
szeretnék [tevékenység],
hogy [üzleti cél / érték].

Elfogadási kritériumok:
- AC1: ...
- AC2: ...

Prioritás: [Magas / Közepes / Alacsony]
Méret becslés: [XS / S / M / L / XL]
Függőségek: [US-XXX, ...]
Kapcsolódó FS fejezet: [X.X]
```

### Prioritás definíciók
- **Magas** – Az alap munkafolyamat működéséhez elengedhetetlen (MVP).
- **Közepes** – Fontos, de a rendszer alapszinten nélküle is használható.
- **Alacsony** – Kényelmi funkció, bővítési jellegű.

### Méret becslés (story pointok tájékoztató jellege)
- **XS** – Triviális, < fél nap
- **S** – Egyszerű, ~1 nap
- **M** – Közepes, 2–3 nap
- **L** – Összetett, ~1 hét
- **XL** – Komplex, több sprint

---

## Tartalomjegyzék

- [EPIC-01: Hitelesítés és felhasználókezelés](#epic-01-hitelesítés-és-felhasználókezelés) *(US-001 – US-007)*
- [EPIC-02: Pályázati felhívások kezelése](#epic-02-pályázati-felhívások-kezelése)
- [EPIC-03: Pályázati anyag és beadás](#epic-03-pályázati-anyag-és-beadás)
- [EPIC-04: Pályázati eredmény kezelése](#epic-04-pályázati-eredmény-kezelése)
- [EPIC-05: Értesítő és szerződéskötés (pályáztatóval)](#epic-05-értesítő-és-szerződéskötés-pályáztatóval)
- [EPIC-06: Költési terv és ötletelés](#epic-06-költési-terv-és-ötletelés)
- [EPIC-07: Alvállalkozói szerződések](#epic-07-alvállalkozói-szerződések)
- [EPIC-08: Számlák és fizetések](#epic-08-számlák-és-fizetések)
- [EPIC-09: Esemény és teljesítés igazolása](#epic-09-esemény-és-teljesítés-igazolása)
- [EPIC-10: Elszámolás](#epic-10-elszámolás)
- [EPIC-11: Dokumentumkezelés](#epic-11-dokumentumkezelés)
- [EPIC-12: E-mail csatolások](#epic-12-e-mail-csatolások)
- [EPIC-13: Megjegyzések](#epic-13-megjegyzések)
- [EPIC-14: Pályáztatók kezelése](#epic-14-pályáztatók-kezelése)
- [EPIC-15: Szerződő cégek kezelése](#epic-15-szerződő-cégek-kezelése)
- [EPIC-16: Kódszótárak kezelése](#epic-16-kódszótárak-kezelése)
- [EPIC-17: Keresés, szűrés, listázás](#epic-17-keresés-szűrés-listázás)
- [EPIC-18: Értesítések és határidőfigyelés](#epic-18-értesítések-és-határidőfigyelés)
- [EPIC-19: Audit napló](#epic-19-audit-napló)
- [EPIC-20: Adminisztrációs funkciók](#epic-20-adminisztrációs-funkciók) *(US-160 – US-165)*

---

## EPIC-01: Hitelesítés és felhasználókezelés

---

### US-001 | [Auth] Google-fiókkal való bejelentkezés

Mint **bármely felhasználó**,  
szeretnék Google-fiókommal bejelentkezni a rendszerbe,  
hogy ne kelljen külön jelszót kezelnem, és biztonságosan hozzáférhessek a pályázati adatokhoz.

**Elfogadási kritériumok:**
- AC1: A bejelentkezési oldalon megjelenik a „Bejelentkezés Google-fiókkal" gomb.
- AC2: A gombra kattintva Google OAuth 2.0 folyamat indul.
- AC3: Sikeres hitelesítés után a rendszer ellenőrzi, hogy az e-mail cím rendelkezik-e aktív fiókkal; ha igen, a felhasználó átkerül a főoldalra (dashboard).
- AC4: Ha a bejelentkező Google-fiók e-mail cím nem rendelkezik aktív, elfogadott fiókkal, a bejelentkezés megtagadva és a következő üzenet jelenik meg: „Hozzáféréshez meghívó szükséges. Kérj segítséget az adminisztrátortól."
- AC5: Ha a felhasználó fiókja inaktív, bejelentkezési kísérlet után hibaüzenet jelenik meg: „A fiókod inaktív. Kérj segítséget az adminisztrátortól."
- AC6: A munkamenet 8 óra inaktivitás után automatikusan lejár, és a felhasználó visszakerül a bejelentkezési oldalra.
- AC7: Meghívó nélküli belépési kísérlet naplózódik (e-mail cím, IP, időbélyeg).

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** –  
**FS fejezet:** 31.1

---

### US-002 | [Auth] Kijelentkezés

Mint **bejelentkezett felhasználó**,  
szeretnék kijelentkezni a rendszerből,  
hogy biztonságosan lezárjam a munkamenetemet.

**Elfogadási kritériumok:**
- AC1: A navigációs sávban elérhető a „Kijelentkezés" opció (profil menü alatt).
- AC2: Kijelentkezés után a munkamenet-token érvénytelenítésre kerül.
- AC3: Kijelentkezés után a rendszer visszairányít a bejelentkezési oldalra.
- AC4: A „Vissza" gomb megnyomása nem jeleníti meg újra a védett oldalakat.

**Prioritás:** Magas  
**Méret:** XS  
**Függőségek:** US-001  
**FS fejezet:** 31.1

---

### US-003 | [Auth] Jogosultság nélküli hozzáférés megakadályozása

Mint **rendszer**,  
szeretném megakadályozni, hogy jogosulatlan felhasználók hozzáférjenek védett adatokhoz,  
hogy az adatbiztonság és a RBAC szabályok érvényesüljenek.

**Elfogadási kritériumok:**
- AC1: Bejelentkezés nélkül a védett oldalakra navigálva a rendszer átirányít a bejelentkezési oldalra.
- AC2: Ha a felhasználónak nincs jogosultsága egy műveletre (pl. törlés), a gomb nem jelenik meg az UI-on.
- AC3: Ha valaki közvetlenül API-n próbál jogosulatlan műveletet végrehajtani, 403 HTTP választ kap.
- AC4: Minden sikertelen jogosultság-ellenőrzés naplózódik az audit naplóba.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-001  
**FS fejezet:** 5.1, 31.2

---

### US-004 | [Profil] Saját profil megtekintése

Mint **bejelentkezett felhasználó**,  
szeretném megtekinteni a saját profilomat,  
hogy lássam a Google-fiókomból szinkronizált adataimat és a hozzám rendelt szerepkört.

**Elfogadási kritériumok:**
- AC1: A profil oldal elérhető a navigációs sávban lévő profilkép/névre kattintva.
- AC2: Megjelenik: teljes név, e-mail cím, profilkép, szerepkör, utolsó bejelentkezés időpontja.
- AC3: A szerepkör nem módosítható a felhasználó által (csak olvasható).
- AC4: Az értesítési beállítások szerkeszthetők és menthetők.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-001  
**FS fejezet:** 25

---

### US-005 | [Profil] Értesítési beállítások testreszabása

Mint **bejelentkezett felhasználó**,  
szeretném beállítani, hogy milyen típusú értesítéseket kapjak e-mailben,  
hogy csak a számomra releváns értesítések érkezzenek.

**Elfogadási kritériumok:**
- AC1: A profil oldalon elérhető az „Értesítési beállítások" szekció.
- AC2: Minden értesítési típus (határidő közeleg, eredmény rögzítve, jóváhagyás szükséges stb.) külön be/kikapcsolható.
- AC3: A beállítások mentése után azonnal életbe lépnek.
- AC4: Az összes e-mail értesítés egyszerre kikapcsolható egy „Összes letiltása" kapcsolóval.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-004  
**FS fejezet:** 25, 28.3

---

### US-006 | [Auth] Meghívó-alapú belépési feltétel érvényesítése

Mint **rendszer**,  
szeretném megakadályozni, hogy meghívó nélküli Google-fiókkal bárki hozzáférjen a rendszerhez,  
hogy kizárólag az Admin által jóváhagyott személyek férhessenek hozzá az alkalmazáshoz.

**Elfogadási kritériumok:**
- AC1: Google OAuth sikeres hitelesítése után a backend ellenőrzi, hogy az autentikált e-mail cím szerepel-e aktív (`ACCEPTED`) fiókként az adatbázisban.
- AC2: Ha nem szerepel, a backend 403-as választ ad; a frontend a következő hibaoldalt jeleníti meg: „Hozzáféréshez meghívó szükséges. Kérj segítséget az adminisztrátortól."
- AC3: A sikertelen belépési kísérlet naplózódik az audit naplóban (e-mail cím, IP-cím, időbélyeg).
- AC4: Az elutasított felhasználó Google-fiókjából nem kerül sor semmilyen adat tárolására a rendszerben.
- AC5: A bejelentkezési oldalon nem jelenik meg regisztrációs lehetőség; csak a „Bejelentkezés Google-fiókkal" gomb érhető el.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-001  
**FS fejezet:** 26.1, 31.1

---

### US-007 | [Auth] Meghívó elfogadása és fiók aktiválása

Mint **meghívott felhasználó**,  
szeretnék a kapott meghívó linken keresztül regisztrálni a rendszerbe,  
hogy hozzáférhessek az alkalmazáshoz a számomra előre beállított szerepkörrel.

**Elfogadási kritériumok:**
- AC1: A meghívó e-mailben szereplő link a bejelentkezési oldalra irányít, ahol a Google OAuth folyamat indul el.
- AC2: Sikeres Google-hitelesítés után a rendszer ellenőrzi, hogy a bejelentkezett e-mail cím megegyezik-e a meghívóban szereplővel.
- AC3: Egyezés esetén a fiók automatikusan létrejön az előre beállított szerepkörrel, és a felhasználó átkerül a főoldalra.
- AC4: Eltérés esetén hibaüzenet jelenik meg: „A Google-fiókod e-mail címe nem egyezik a meghívóban szereplő címmel. Jelentkezz be azzal a fiókkal, amelyre a meghívót kaptad."
- AC5: Lejárt meghívó linkre kattintva a felhasználó tájékoztató oldalt lát: „Ez a meghívó lejárt. Kérj új meghívót az adminisztrátortól."
- AC6: Visszavont (`REVOKED`) meghívó esetén a felhasználó tájékoztató üzenetet kap.
- AC7: Sikeres aktiválás után a meghívó státusza `ACCEPTED`-re vált; a link többé nem használható.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-006, US-164  
**FS fejezet:** 26.1, 31.1

---

## EPIC-02: Pályázati felhívások kezelése

---

### US-010 | [Felhívás] Új pályázati felhívás rögzítése

Mint **pályázati munkatárs**,  
szeretnék új pályázati felhívást rögzíteni a rendszerben,  
hogy megkezdődjön a pályázat életciklusa és nyomon követhető legyen a folyamat.

**Elfogadási kritériumok:**
- AC1: Az „Új pályázat" gomb elérhető a pályázatok listanézeten.
- AC2: Az űrlap tartalmazza a kötelező mezőket: pályáztató (legördülő, autocomplete), pályázat címe, beadási határidő.
- AC3: Az opcionális mezők szerkeszthetők: azonosító, leírás, típus (kódszótár), összeg minimum/maximum, elköltési határidő, egyéb metaadatok.
- AC4: Ha a pályáztató nem szerepel a listában, közvetlenül az űrlapról indítható egy új pályáztató rögzítési folyamat (modal).
- AC5: Mentés után a pályázat `DRAFT` állapotban jelenik meg a listán.
- AC6: Hiányzó kötelező mező esetén a mezők piros szegéllyel és hibaüzenettel jelöltek; a mentés nem engedélyezett.
- AC7: Sikeres mentés után a rendszer átnavigál az újonnan létrehozott pályázat részletező oldalára.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-003, US-060 (pályáztatók)  
**FS fejezet:** 10

---

### US-011 | [Felhívás] Pályázati felhívás adatainak szerkesztése

Mint **pályázati munkatárs**,  
szeretném módosítani egy meglévő pályázati felhívás adatait,  
hogy javíthassam a hibákat vagy frissíthessem az időközben megváltozott információkat.

**Elfogadási kritériumok:**
- AC1: A pályázat részletező oldalán elérhető a „Szerkesztés" gomb (jogosult felhasználók számára).
- AC2: Az összes mező szerkeszthető (kivéve a rendszer által generált mezők: létrehozva, létrehozta).
- AC3: Mentés után a módosítás rögzítésre kerül az audit naplóban (régi és új értékkel).
- AC4: Ha a pályázat `LOCKED` állapotban van, a szerkesztés nem elérhető (csak Admin számára).
- AC5: Módosítás megszakítható a „Mégse" gombbal; el nem mentett változtatások elvezetnek.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-010  
**FS fejezet:** 10

---

### US-012 | [Felhívás] Pályázati felhívás megtekintése

Mint **megtekintő (vagy bármely szerepkör)**,  
szeretném megtekinteni egy pályázati felhívás összes adatát,  
hogy tájékozódhassak a pályázat részleteiről anélkül, hogy módosítanék valamit.

**Elfogadási kritériumok:**
- AC1: A pályázat részletező oldala minden jogosult felhasználó számára elérhető (olvasási jog alapján).
- AC2: Az oldal megjeleníti az összes rögzített adatot strukturáltan, a munkafolyamat-lépések áttekintő nézetével együtt.
- AC3: A csatolt dokumentumok, e-mailek és megjegyzések listája megjelenik a releváns lépéseknél.
- AC4: Az aktuális munkafolyamat-lépés vizuálisan kiemelten jelenik meg.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-010  
**FS fejezet:** 10

---

### US-013 | [Felhívás] Pályázati felhívás archiválása

Mint **adminisztrátor**,  
szeretnék egy pályázatot archiválni,  
hogy a tévesen rögzített vagy elavult pályázatok ne zavarják az aktív listát, de az adataik megmaradjanak.

**Elfogadási kritériumok:**
- AC1: Az archiválás opció csak Admin felhasználó számára elérhető.
- AC2: Archiválás előtt megerősítő dialog jelenik meg: „Biztosan archiválni szeretnéd ezt a pályázatot? Ez a művelet visszavonható."
- AC3: Archivált pályázat az alapértelmezett listanézetből eltűnik, de szűréssel megtalálható.
- AC4: Archivált pályázaton módosítás nem végezhető (kivéve visszaállítás).
- AC5: Az archiválás naplózódik az audit naplóban.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-010  
**FS fejezet:** 10, 8.1

---

## EPIC-03: Pályázati anyag és beadás

---

### US-020 | [Beadás] Pályázati anyag adatainak rögzítése

Mint **pályázati munkatárs**,  
szeretném rögzíteni a pályázati anyag elkészítésének és beadásának adatait,  
hogy dokumentálva legyen, mikor és hogyan adtuk be a pályázatot.

**Elfogadási kritériumok:**
- AC1: A pályázat munkafolyamat nézetén a [2. Beadás] lépés aktiválható, ha a [1. Felhívás] lépés `COMPLETED` állapotban van.
- AC2: Az űrlap tartalmazza: pályázati anyag leírása (kötelező), beadás módja (kódszótár, opcionális), beadás időpontja (kötelező a lépés lezárásához).
- AC3: A lépés menthető beadás időpontja nélkül is (`ACTIVE` marad); csak az időpont rögzítésekor kerül `COMPLETED` állapotba.
- AC4: A pályázat állapota a lépés lezárásakor `SUBMITTED`-re vált.
- AC5: A beadás ténye és időpontja megjelenik a pályázat összefoglaló nézetén.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-010  
**FS fejezet:** 11

---

### US-021 | [Beadás] Pályázati anyag jóváhagyása

Mint **elnök**,  
szeretném jóváhagyni a pályázati anyag beadását,  
hogy a beadás csak az elnöki jóváhagyás után kerüljön véglegesítésre.

**Elfogadási kritériumok:**
- AC1: A [2. Beadás] lépésen megjelenik a „Jóváhagyásra vár" státusz-jelzés, ha a beadás időpontja rögzítve van, de jóváhagyás még nem történt.
- AC2: Az Elnök és Admin számára megjelenik a „Jóváhagyás" gomb a lépésen.
- AC3: Jóváhagyás után a lépés `COMPLETED` állapotba kerül és a pályázat `SUBMITTED`-re vált.
- AC4: A jóváhagyás visszavonható mindaddig, amíg az eredmény nincs rögzítve.
- AC5: A jóváhagyás tényéről értesítés kerül a pályázati munkatárshoz.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-020  
**FS fejezet:** 11.3

---

## EPIC-04: Pályázati eredmény kezelése

---

### US-030 | [Eredmény] Pályázati eredmény rögzítése – nyert

Mint **pályázati munkatárs**,  
szeretném rögzíteni, hogy a pályázatunkat nyertük,  
hogy a folyamat továbblépjen a szerződéskötés és pénzfelhasználás fázisába.

**Elfogadási kritériumok:**
- AC1: A [3. Eredmény] lépés elérhető, ha a [2. Beadás] lépés `COMPLETED`.
- AC2: Az eredmény mező kötelező (Nyert / Nem nyert enum).
- AC3: „Nyert" választásakor az elnyert összeg mező kötelezővé válik.
- AC4: Mentés után a pályázat állapota `WON` lesz.
- AC5: A [4]–[9] lépések aktiválódnak és elérhetővé válnak.
- AC6: Az Elnök értesítést kap az eredmény rögzítéséről.
- AC7: Az elnyert összeg megjelenik a pályázat összefoglalójában és a lista nézetben.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-020  
**FS fejezet:** 12

---

### US-031 | [Eredmény] Pályázati eredmény rögzítése – nem nyert

Mint **pályázati munkatárs**,  
szeretném rögzíteni, hogy a pályázatunkat elvesztettük,  
hogy a folyamat lezáruljon és a pályázat archiválhatóvá váljon.

**Elfogadási kritériumok:**
- AC1: „Nem nyert" választásakor az elnyert összeg mező nem jelenik meg.
- AC2: Mentés után a pályázat állapota `LOST` lesz.
- AC3: A [4]–[9] munkafolyamat-lépések szürkítve, „Nem alkalmazható" felirattal jelennek meg.
- AC4: A pályázat manuálisan lezárható `CLOSED_LOST` állapotba (Admin vagy Elnök jogkörrel).
- AC5: Lezárás után az összes lépés `LOCKED` állapotba kerül.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-020  
**FS fejezet:** 12, 7.5

---

### US-032 | [Eredmény] Eredmény korrekciója

Mint **adminisztrátor**,  
szeretném módosítani egy tévesen rögzített eredményt,  
hogy a pályázat a valós döntésnek megfelelő állapotba kerüljön.

**Elfogadási kritériumok:**
- AC1: Az eredmény módosítható mindaddig, amíg a pályázat nincs `CLOSED` állapotban.
- AC2: Ha az eredmény `Nyert`-ről `Nem nyert`-re változik, figyelmeztető üzenet jelenik meg: „A módosítás lezárja a folyamat [4]–[9] lépéseit. Biztosan folytatod?"
- AC3: A módosítás naplózódik az audit naplóban.
- AC4: `CLOSED` állapotú pályázaton csak Admin módosíthat.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-030, US-031  
**FS fejezet:** 12.4

---

## EPIC-05: Értesítő és szerződéskötés (pályáztatóval)

---

### US-040 | [Szerz./Pályáztató] Értesítő és szerződési adatok rögzítése

Mint **pályázati munkatárs**,  
szeretném rögzíteni a pályáztatótól kapott értesítő és a kötött szerződés adatait,  
hogy dokumentálva legyen a támogatásról szóló megállapodás.

**Elfogadási kritériumok:**
- AC1: A [4. Értesítő/Szerződés] lépés csak `WON` állapotú pályázatnál aktív.
- AC2: Az űrlap tartalmazza: szerződés azonosítója (opcionális), szerződéskötés időpontja (opcionális), értesítő érkezett (boolean), értesítő időpontja (opcionális).
- AC3: A lépés manuálisan jelölhető `COMPLETED`-nek, ha minden adat rögzítve van.
- AC4: A lépés kihagyható az „Ezt a lépést kihagyom" gombbal, amely megjelenít egy megjegyzés-beviteli mezőt az indokhoz.
- AC5: Kihagyott (`SKIPPED`) lépés visszaállítható `ACTIVE`-ra Admin vagy Elnök jogkörrel.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-030  
**FS fejezet:** 13

---

### US-041 | [Szerz./Pályáztató] Lépés kihagyása indokkal

Mint **pályázati munkatárs**,  
szeretném kihagyni az értesítő/szerződéskötési lépést, ha a pályáztató nem köt formális szerződést,  
hogy a folyamat továbblépjen a kihagyott lépés blokkolása nélkül.

**Elfogadási kritériumok:**
- AC1: A „Lépés kihagyása" gombra kattintva megjelenik egy modal az indok megadásához (szabad szöveg, opcionális).
- AC2: Kihagyás megerősítése után a lépés `SKIPPED` állapotba kerül.
- AC3: A lépésen megjelenik a „Kihagyva" badge és az indok (ha meg lett adva).
- AC4: A folyamat továbblép a következő lépésre.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-040  
**FS fejezet:** 7.3, 13.4

---

## EPIC-06: Költési terv és ötletelés

---

### US-050 | [Költési terv] Új költési terv létrehozása tételekkel

Mint **pályázati munkatárs**,  
szeretnék költési tervet összeállítani a pályázati összeg felhasználásához,  
hogy egyértelműen meghatározzuk, mire és mennyit költünk.

**Elfogadási kritériumok:**
- AC1: A [5. Költési terv] lépés elérhető `WON` állapotú pályázatnál (a [4] lépés után).
- AC2: Legalább 1 tétel felvétele szükséges a lépés lezárásához.
- AC3: Minden tételhez megadható: név (kötelező), típus (Esemény / Tárgyi jószág / Egyéb, kötelező), tervezett összeg (kötelező), leírás (opcionális).
- AC4: Az összes tétel tervezett összegének összege vizuálisan összehasonlításra kerül az elnyert összeggel (pl. „Tervezett: 850 000 Ft / Elnyert: 1 000 000 Ft – 150 000 Ft szabad keret").
- AC5: Ha a tervezett összeg meghaladja az elnyert összeget, figyelmeztető sárga jelzés jelenik meg (nem blokkoló).
- AC6: A tételek sorrendbe rendezhetők drag-and-drop-pal.

**Prioritás:** Magas  
**Méret:** L  
**Függőségek:** US-030  
**FS fejezet:** 14

---

### US-051 | [Költési terv] Tétel módosítása és törlése

Mint **pályázati munkatárs**,  
szeretném módosítani vagy törölni a költési terv egyes tételeit,  
hogy a terv a változó körülményeknek megfelelően frissíthető legyen.

**Elfogadási kritériumok:**
- AC1: Minden tétel sorában elérhető a „Szerkesztés" és „Törlés" ikon.
- AC2: Ha egy tételhez már kapcsolt számla vagy szerződés létezik, a tétel nem törölhető; hibaüzenet jelenik meg: „A tétel nem törölhető, mert kapcsolt számla/szerződés létezik."
- AC3: Módosítás szerkesztőpanelen történik (inline szerkesztés vagy modal).
- AC4: Módosítás mentése után az összesítő automatikusan frissül.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-050  
**FS fejezet:** 14

---

### US-052 | [Költési terv] Elnöki jóváhagyás a költési tervhez

Mint **elnök**,  
szeretném jóváhagyni az összeállított költési tervet,  
hogy a pénzfelhasználás megkezdése előtt az elnökség szintjén is megerősítésre kerüljön a tervezet.

**Elfogadási kritériumok:**
- AC1: A [5. Költési terv] lépésen megjelenik a „Jóváhagyásra küldés" gomb (Pályázati munkatárs számára), ha legalább 1 tétel rögzítve van.
- AC2: Jóváhagyásra küldés után az Elnök értesítést kap.
- AC3: Az Elnök a lépés nézetéből jóváhagyhatja vagy visszautasíthatja a tervet (megjegyzéssel).
- AC4: Jóváhagyás után a lépés `COMPLETED` állapotba kerül.
- AC5: Visszautasítás esetén a lépés `ACTIVE` marad és a megjegyzés megjelenik.

**Prioritás:** Közepes  
**Méret:** M  
**Függőségek:** US-050  
**FS fejezet:** 14.5

---

## EPIC-07: Alvállalkozói szerződések

---

### US-055 | [Alvállalk. szerz.] Új alvállalkozói szerződés rögzítése

Mint **pályázati munkatárs**,  
szeretnék alvállalkozói szerződést rögzíteni egy külső céggel,  
hogy dokumentálva legyen a pályázati célból igénybe vett szolgáltatás megrendelése.

**Elfogadási kritériumok:**
- AC1: A [6. Alvállalkozói szerz.] lépés elérhető `WON` állapotú pályázatnál.
- AC2: Az űrlap tartalmazza: szerződő cég (entitás hivatkozás, kötelező, autocomplete), szerződéskötés időpontja (kötelező), összeg (kötelező), azonosító (opcionális), kapcsolt költési terv tétel (opcionális).
- AC3: Ha a szerződő cég nem szerepel a listában, közvetlenül indítható az új cég rögzítése (modal).
- AC4: Egy pályázathoz több szerződés is hozzáadható.
- AC5: A lépés kihagyható, ha nincsenek alvállalkozói szerződések.
- AC6: Az összes szerződés összege megjelenik összesítőben.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-050, US-070 (szerződő cégek)  
**FS fejezet:** 15

---

### US-056 | [Alvállalk. szerz.] Alvállalkozói szerződés törlése

Mint **pályázati munkatárs**,  
szeretnék egy tévesen rögzített alvállalkozói szerződést törölni,  
hogy a pontatlan adatok ne terheljék a pályázati nyilvántartást.

**Elfogadási kritériumok:**
- AC1: Szerződés törölhető, ha nincs hozzá rögzített számla.
- AC2: Ha van kapcsolt számla, a törlés megakadályozott: „A szerződés nem törölhető, mert X db számla kapcsolódik hozzá."
- AC3: Törlés előtt megerősítő kérdés jelenik meg.
- AC4: Törlés naplózódik az audit naplóban.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-055  
**FS fejezet:** 15.4

---

## EPIC-08: Számlák és fizetések

---

### US-060 | [Számla] Új számla rögzítése

Mint **pénzügyes**,  
szeretnék új számlát rögzíteni a pályázati keretből teljesített kifizetéshez,  
hogy a pénzügyi teljesítés dokumentálva és nyomon követhető legyen.

**Elfogadási kritériumok:**
- AC1: A [7. Számlák] lépés elérhető `WON` állapotú pályázatnál.
- AC2: Kötelező mezők: szállító neve (szabad szöveg), számla sorszáma, kiállítás dátuma, összeg.
- AC3: Opcionális mezők: fizetve (boolean, default: nem), fizetés időpontja, kapcsolt alvállalkozói szerződés, kapcsolt költési terv tétel, megjegyzés.
- AC4: Ha „Fizetve = igen", a fizetés időpontja kötelezővé válik.
- AC5: Ha a fizetés időpontja korábbi a kiállítás dátumánál, figyelmeztető validáció jelenik meg (nem blokkoló).
- AC6: Az összes rögzített számla összege és az elnyert összeggel való összevetése megjelenik a lépés tetején.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-030  
**FS fejezet:** 16

---

### US-061 | [Számla] Fizetési státusz frissítése

Mint **pénzügyes**,  
szeretném frissíteni egy számla fizetési státuszát (nem fizetett → fizetett),  
hogy a pénzügyi nyilvántartás mindig naprakész legyen.

**Elfogadási kritériumok:**
- AC1: A számla listán közvetlenül elérhető egy „Megjelölés fizetettnek" gyorsgomb az „Igen" értékre váltáshoz.
- AC2: A gyorsgombra kattintva egy mini-modal nyílik, ahol a fizetés dátuma megadható.
- AC3: Mentés után a számla listán a fizetési státusz vizuálisan frissül (pl. zöld jel).
- AC4: A változás naplózódik az audit naplóban.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-060  
**FS fejezet:** 16

---

### US-062 | [Számla] Számla törlése

Mint **pénzügyes**,  
szeretnék egy tévesen rögzített számlát törölni,  
hogy a hibás adatok ne torzítsák a pénzügyi összesítőket.

**Elfogadási kritériumok:**
- AC1: Számla csak akkor törölhető, ha a pályázat nincs `LOCKED` állapotban.
- AC2: Törlés előtt megerősítő dialog jelenik meg az összeg és sorszám megjelenítésével.
- AC3: Törlés után az összesítő automatikusan frissül.
- AC4: Törlés soft delete; az audit naplóban megmarad.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-060  
**FS fejezet:** 16

---

### US-063 | [Számla] Pénzügyi összesítő megtekintése

Mint **pénzügyes vagy elnök**,  
szeretném egy pillantással áttekinteni a pályázat teljes pénzügyi helyzetét,  
hogy lássam, mennyit fizettünk ki, mennyi van még hátra és esetleg hol van eltérés a tervtől.

**Elfogadási kritériumok:**
- AC1: A [7. Számlák] lépés tetején megjelenik egy összesítő panel: elnyert összeg, tervezett összeg, rögzített számlák összege, ebből fizetett, fizetetlen, egyenleg (elnyert − számlák összege).
- AC2: Az összesítő vizuálisan jelzi, ha a számlák összege meghaladja az elnyert összeget (piros szín).
- AC3: A számla lista szűrhető: fizetve / nem fizetve; rendezhető: dátum, összeg szerint.

**Prioritás:** Közepes  
**Méret:** M  
**Függőségek:** US-060  
**FS fejezet:** 16.6

---

## EPIC-09: Esemény és teljesítés igazolása

---

### US-065 | [Igazolás] Esemény vagy tárgyi teljesítés igazolásának rögzítése

Mint **pályázati munkatárs**,  
szeretném rögzíteni, hogy az esemény megtörtént vagy a tárgyi ellenszolgáltatás megérkezett, és fotóval igazolni,  
hogy a pályáztató felé dokumentálva legyen a teljesítés ténye.

**Elfogadási kritériumok:**
- AC1: A [8. Igazolás] lépés elérhető `WON` állapotú pályázatnál.
- AC2: Az igazolás típusa kötelező: Esemény / Tárgyi teljesítés.
- AC3: Esemény típusnál az esemény időpontja kötelező; Tárgyi típusnál a megérkezés időpontja kötelező.
- AC4: Legalább 1 fotó feltöltése kötelező; a feltöltés nélkül a rekord nem menthető.
- AC5: Feltöltött fotók bélyegképként jelennek meg az igazolás rekordján.
- AC6: Egy pályázathoz több igazolás is hozzáadható (pl. több esemény).
- AC7: A lépés kihagyható, ha a pályázat természete nem igényel ilyen igazolást.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-060  
**FS fejezet:** 17

---

### US-066 | [Igazolás] Fotók megtekintése és letöltése

Mint **elnök vagy megtekintő**,  
szeretném megtekinteni és letölteni az igazoláshoz csatolt fotókat,  
hogy meggyőződjek a teljesítés tényéről.

**Elfogadási kritériumok:**
- AC1: A feltöltött fotók bélyegképként jelennek meg; kattintásra teljes méretű előnézet nyílik (lightbox).
- AC2: Minden fotó egyenként letölthető.
- AC3: Az összes fotó egyszerre letölthető ZIP fájlban.
- AC4: A fotók megtekintéséhez bejelentkezés és olvasási jogosultság szükséges.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-065  
**FS fejezet:** 17

---

## EPIC-10: Elszámolás

---

### US-070 | [Elszámolás] Elszámolás rögzítése

Mint **pénzügyes**,  
szeretném rögzíteni a pályáztató felé benyújtott elszámolás adatait,  
hogy dokumentálva legyen a pénzügyi és tartalmi beszámoló ténye.

**Elfogadási kritériumok:**
- AC1: A [9. Elszámolás] lépés elérhető `WON` állapotú pályázatnál.
- AC2: Kötelező mező: elszámolás időpontja.
- AC3: Opcionális mezők: elszámolás módja (kódszótár), összefoglaló leírás, megjegyzés.
- AC4: Ha a rögzített számlák összege nem éri el az elnyert összeg 80%-át, figyelmeztető üzenet jelenik meg: „A rögzített számlák összege X%, ami nem éri el az elnyert összeg 80%-át. Biztosan folytatod?" (nem blokkoló).
- AC5: A rögzítés után az Elnök jóváhagyási értesítést kap.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-060  
**FS fejezet:** 18

---

### US-071 | [Elszámolás] Elnöki jóváhagyás és pályázat lezárása

Mint **elnök**,  
szeretném jóváhagyni az elszámolást és lezárni a pályázatot,  
hogy a folyamat hivatalosan befejezettnek minősüljön és az adatok `LOCKED` állapotba kerüljenek.

**Elfogadási kritériumok:**
- AC1: Az Elnök a saját értesítéséből vagy a pályázat részletes nézetéből eléri a jóváhagyási funkciót.
- AC2: Jóváhagyás gombra kattintva megerősítő dialog jelenik meg: „Biztosan lezárod a pályázatot? Ez után módosítás nem lehetséges."
- AC3: Jóváhagyás után a pályázat `CLOSED_WON` állapotba kerül.
- AC4: Minden munkafolyamat-lépés `LOCKED` állapotba kerül; szerkesztés nem elérhető (Admin kivételével).
- AC5: A lezárás naplózódik az audit naplóban.
- AC6: A jóváhagyás visszavonható mindaddig, amíg a pályázat ténylegesen `CLOSED_WON` állapotba nem vált (konfigurálható ablak).

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-070  
**FS fejezet:** 18.4

---

## EPIC-11: Dokumentumkezelés

---

### US-080 | [Dok.] Dokumentum feltöltése pályázati lépéshez

Mint **pályázati munkatárs**,  
szeretnék dokumentumot feltölteni egy adott pályázati lépéshez,  
hogy a folyamathoz tartozó összes irat egy helyen, könnyen visszakereshetően tárolódjon.

**Elfogadási kritériumok:**
- AC1: Minden munkafolyamat-lépés nézetén elérhető egy „Dokumentum hozzáadása" gomb.
- AC2: Feltöltéskor kötelező a dokumentumtípus megadása (kódszótár alapján).
- AC3: Az opcionális „Megjelenítési név" kitölthető; ha üresen marad, az eredeti fájlnév jelenik meg.
- AC4: Megengedett formátumok: PDF, DOCX, XLSX, JPG, PNG, TIFF, MSG, EML (max. 50 MB).
- AC5: Nem megengedett formátum esetén: „Ez a fájlformátum nem támogatott. Megengedett formátumok: PDF, DOCX, XLSX, JPG, PNG, TIFF, MSG, EML."
- AC6: 50 MB-t meghaladó fájl esetén: „A fájl mérete meghaladja a 50 MB-os korlátot."
- AC7: Feltöltés alatt progress bar jelenik meg; sikeres feltöltés után a dokumentum azonnal megjelenik a listában.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-010  
**FS fejezet:** 19

---

### US-081 | [Dok.] Dokumentum letöltése és előnézete

Mint **bármely jogosult felhasználó**,  
szeretném letölteni vagy előnézetben megtekinteni a pályázathoz csatolt dokumentumokat,  
hogy hozzáférhessek a szükséges iratokhoz böngészőből.

**Elfogadási kritériumok:**
- AC1: A dokumentum listában minden fájl mellett elérhető a „Letöltés" gomb.
- AC2: Kép típusú fájlok (JPG, PNG) esetén elérhető az „Előnézet" gomb (lightbox megjelenítés).
- AC3: PDF fájlok esetén az előnézet böngészőbeli PDF nézetben nyílik meg.
- AC4: A dokumentumok közvetlen URL-ről nem érhetők el; csak bejelentkezett API-n keresztül tölthetők le.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-080  
**FS fejezet:** 19.5

---

### US-082 | [Dok.] Dokumentum új verziójának feltöltése

Mint **pályázati munkatárs**,  
szeretném egy meglévő dokumentum frissített verzióját feltölteni,  
hogy a legújabb változat elérhető legyen, de a korábbi verziók is megőrződjenek.

**Elfogadási kritériumok:**
- AC1: Meglévő dokumentum sorában elérhető az „Új verzió feltöltése" opció.
- AC2: Új verzió feltöltésekor az előző verzió „Archív" állapotba kerül, az új „Aktív" lesz.
- AC3: A dokumentum részletes nézetén elérhető a verziótörténet listája (verzió száma, feltöltés dátuma, feltöltötte).
- AC4: Archív verziók is letölthetők.

**Prioritás:** Közepes  
**Méret:** M  
**Függőségek:** US-080  
**FS fejezet:** 19.3

---

### US-083 | [Dok.] Dokumentum archiválása

Mint **adminisztrátor**,  
szeretnék egy dokumentumot archiválni,  
hogy a tévesen feltöltött vagy elavult fájl ne jelenjen meg az aktív listában, de az adat megmaradjon.

**Elfogadási kritériumok:**
- AC1: Dokumentum archiválása csak Admin számára elérhető.
- AC2: Archivált dokumentum az alapértelmezett listából eltűnik, de szűréssel megtalálható.
- AC3: Az archiválás naplózódik az audit naplóban.
- AC4: Fájl fizikailag nem kerül törlésre a szerveren.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-080  
**FS fejezet:** 19.5

---

## EPIC-12: E-mail csatolások

---

### US-090 | [E-mail] E-mail manuális rögzítése pályázati lépéshez

Mint **pályázati munkatárs**,  
szeretnék manuálisan rögzíteni egy, a pályázathoz kapcsolódó e-mail lényeges adatait,  
hogy a levelezési előzmények a pályázati aktában nyomon követhetők legyenek.

**Elfogadási kritériumok:**
- AC1: Minden munkafolyamat-lépés nézetén elérhető az „E-mail hozzáadása" gomb.
- AC2: Kötelező mezők: tárgy, feladó e-mail cím, küldés dátuma, irány (Bejövő / Kimenő).
- AC3: Opcionális mezők: tartalom összefoglalója (szabad szöveg), csatolt .eml vagy .msg fájl.
- AC4: Az e-mail rekord mentés után azonnal megjelenik a lépés e-mail listájában, időrendben (legújabb felül).

**Prioritás:** Közepes  
**Méret:** M  
**Függőségek:** US-010  
**FS fejezet:** 20

---

### US-091 | [E-mail] E-mail fájl feltöltése és előnézete

Mint **pályázati munkatárs**,  
szeretnék az e-mailt .eml vagy .msg formátumban feltölteni,  
hogy az eredeti levél tartalma is megőrzésre kerüljön.

**Elfogadási kritériumok:**
- AC1: Az e-mail rögzítő űrlapon lehetséges .eml / .msg fájl feltöltése (opcionális).
- AC2: Ha .eml fájl van feltöltve, megjelenik egy „Előnézet" gomb.
- AC3: Az előnézet megnyitásakor a levél legfontosabb mezői (feladó, tárgy, dátum, törzs) strukturáltan jelennek meg.
- AC4: A fájl letölthető a rekordból.

**Prioritás:** Alacsony  
**Méret:** M  
**Függőségek:** US-090  
**FS fejezet:** 20.2

---

### US-092 | [E-mail] E-mail rekord törlése

Mint **pályázati munkatárs**,  
szeretnék egy tévesen rögzített e-mail rekordot törölni,  
hogy a hibás adatok ne terheljék a kommunikációs előzményeket.

**Elfogadási kritériumok:**
- AC1: E-mail rekord törölhető az azt rögzítő felhasználó által és az Admin által.
- AC2: Törlés előtt megerősítő kérdés jelenik meg.
- AC3: Törlés után a csatolt fájl is törlődik (soft delete).
- AC4: A törlés naplózódik az audit naplóban.

**Prioritás:** Alacsony  
**Méret:** S  
**Függőségek:** US-090  
**FS fejezet:** 20.4

---

## EPIC-13: Megjegyzések

---

### US-095 | [Megjegyzés] Megjegyzés hozzáadása pályázati lépéshez

Mint **bármely jogosult felhasználó (Admin, Elnök, Munkatárs, Pénzügyes)**,  
szeretnék megjegyzést fűzni egy pályázati lépéshez,  
hogy rögzítsem a döntések mögötti kontextust, észrevételeket és teendőket.

**Elfogadási kritériumok:**
- AC1: Minden munkafolyamat-lépés nézetén elérhető a megjegyzés szekció.
- AC2: Megjegyzés hozzáadása egyetlen kattintással elérhető szövegmező megjelenítésével.
- AC3: A megjegyzés szerzője és időpontja automatikusan rögzítésre kerül.
- AC4: A megjegyzések időrendben (legrégebbi felül) jelennek meg, chat-szerű elrendezésben.
- AC5: Mentés után a szövegmező kiürül és a megjegyzés azonnal megjelenik a listában.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-010  
**FS fejezet:** 21

---

### US-096 | [Megjegyzés] Saját megjegyzés szerkesztése és törlése

Mint **megjegyzést rögzítő felhasználó**,  
szeretném szerkeszteni vagy törölni a saját megjegyzésemet,  
hogy javíthassam az elírásokat vagy visszavonjam az elavult megjegyzést.

**Elfogadási kritériumok:**
- AC1: Saját megjegyzés sorában elérhető a „Szerkesztés" és „Törlés" ikon.
- AC2: Más felhasználók megjegyzésein nem jelenik meg szerkesztési opció (kivéve Admin).
- AC3: Törölt megjegyzés helyén „[Megjegyzés törölve]" felirat jelenik meg; a tartalom nem látható.
- AC4: Törlés naplózódik az audit naplóban.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-095  
**FS fejezet:** 21.3

---

## EPIC-14: Pályáztatók kezelése

---

### US-100 | [Pályáztató] Új pályáztató rögzítése

Mint **pályázati munkatárs**,  
szeretnék új pályáztatót rögzíteni a rendszerben,  
hogy a jövőbeni pályázatoknál újra felhasználható, konzisztens partneradatokkal dolgozhassunk.

**Elfogadási kritériumok:**
- AC1: A Pályáztatók modul elérhető a navigációból.
- AC2: „Új pályáztató" gombbal megnyíló form tartalmaz: megnevezés (kötelező, egyedi), leírás, telefonszám, e-mail cím (érvényes formátum ellenőrzéssel), státusz (default: Aktív).
- AC3: Ha a megnevezés már létezik, hibaüzenet jelenik meg: „Ez a pályáztató már szerepel a rendszerben."
- AC4: Mentés után az új pályáztató azonnal választható a pályázat rögzítő űrlapon.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** –  
**FS fejezet:** 22

---

### US-101 | [Pályáztató] Pályáztató adatainak szerkesztése

Mint **pályázati munkatárs**,  
szeretném frissíteni egy pályáztató adatait,  
hogy a kontaktinformációk mindig naprakészek legyenek.

**Elfogadási kritériumok:**
- AC1: A pályáztató részletes nézetén elérhető a „Szerkesztés" gomb.
- AC2: Minden mező szerkeszthető.
- AC3: Módosítás naplózódik az audit naplóban.

**Prioritás:** Közepes  
**Méret:** XS  
**Függőségek:** US-100  
**FS fejezet:** 22

---

### US-102 | [Pályáztató] Pályáztató inaktiválása

Mint **adminisztrátor**,  
szeretnék egy pályáztatót inaktiválni,  
hogy a már nem aktív pályáztatók ne zavarják a kiválasztó listákat.

**Elfogadási kritériumok:**
- AC1: Az inaktiválás csak Admin számára elérhető.
- AC2: Aktív pályázathoz kapcsolt pályáztató nem törölhető, csak inaktiválható; figyelmeztetés jelenik meg.
- AC3: Inaktív pályáztató nem jelenik meg az új pályázat rögzítésekor a legördülő listában (kivéve, ha szűrés „Inaktív is" opció be van kapcsolva).
- AC4: Meglévő pályázatokon a pályáztató neve megmarad, de „(inaktív)" jelöléssel látható.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-100  
**FS fejezet:** 22.5

---

### US-103 | [Pályáztató] Pályáztató részletező oldal megtekintése

Mint **bármely jogosult felhasználó**,  
szeretném megtekinteni egy pályáztató adatait és az összes hozzá kapcsolt pályázatot,  
hogy áttekintsem az adott szervezettel való kapcsolatunk történetét.

**Elfogadási kritériumok:**
- AC1: A pályáztató nevére kattintva megnyílik a részletező oldal.
- AC2: Az oldal tartalmazza: megnevezés, leírás, kontaktadatok, kapcsolt pályázatok listája (névvel, állapottal, elnyert összeggel).
- AC3: A kapcsolt pályázatok listájából közvetlenül navigálható az adott pályázat.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-100  
**FS fejezet:** 22.4

---

## EPIC-15: Szerződő cégek kezelése

---

### US-110 | [Szerz. cég] Új szerződő cég rögzítése

Mint **pályázati munkatárs vagy pénzügyes**,  
szeretnék új szerződő céget rögzíteni a rendszerben,  
hogy az alvállalkozói szerződéseknél és számláknál visszakereshető, pontos partneradatokkal dolgozhassunk.

**Elfogadási kritériumok:**
- AC1: A Szerződő cégek modul elérhető a navigációból.
- AC2: „Új szerződő cég" form tartalmazza: megnevezés (kötelező, egyedi), adószám (opcionális, formátum-figyelmeztetéssel: 12345678-1-23), cím, telefonszám, e-mail, státusz (default: Aktív).
- AC3: Ha a megnevezés már létezik, hibaüzenet jelenik meg.
- AC4: Az adószám formátuma nem megfelelő esetén figyelmeztető üzenet jelenik meg (de nem blokkoló).

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** –  
**FS fejezet:** 23

---

### US-111 | [Szerz. cég] Szerződő cég részletező oldal

Mint **bármely jogosult felhasználó**,  
szeretném megtekinteni egy szerződő cég adatait és a hozzá kapcsolt összes szerződést,  
hogy átlássam az adott céggel való pénzügyi kapcsolatainkat.

**Elfogadási kritériumok:**
- AC1: A részletező oldal tartalmazza: cégnév, adószám, cím, kontaktadatok, státusz.
- AC2: Megjelenik a kapcsolt szerződések listája pályázatonkénti bontásban (pályázat neve, szerződés összege, dátuma).
- AC3: A kapcsolt szerződések összesítője (darabszám, teljes szerződéses összeg) megjelenik összefoglaló panelként.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-110  
**FS fejezet:** 23.4

---

### US-112 | [Szerz. cég] Szerződő cég inaktiválása

Mint **adminisztrátor**,  
szeretnék egy szerződő céget inaktiválni,  
hogy az már nem aktív partnerek ne zavarják az élő kiválasztó listákat.

**Elfogadási kritériumok:**
- AC1: Aktív szerződéssel rendelkező cég nem törölhető, csak inaktiválható; figyelmeztető üzenet jelenik meg.
- AC2: Inaktív cég nem jelenik meg az alvállalkozói szerződés rögzítésekor a legördülő listában.
- AC3: Meglévő szerződéseken és számlákon a cég neve megmarad „(inaktív)" jelöléssel.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-110  
**FS fejezet:** 23.5

---

## EPIC-16: Kódszótárak kezelése

---

### US-120 | [Kódszótár] Kódszótár elemek kezelése

Mint **adminisztrátor**,  
szeretném kezelni a rendszer kódszótárainak elemeit (hozzáadás, módosítás, inaktiválás, sorba rendezés),  
hogy az alkalmazásban használt értékkészletek mindig naprakészek és a szervezet igényeihez igazítottak legyenek.

**Elfogadási kritériumok:**
- AC1: Az Admin menüből elérhető a Kódszótárak oldal, amely listázza az összes kódszótárat.
- AC2: Kódszótár kiválasztásakor megjelennek az elemei (kód, megnevezés, sorrend, státusz).
- AC3: Új elem hozzáadható: kód (egyedi a szótáron belül, kötelező), megnevezés (kötelező), leírás (opcionális), státusz (default: Aktív).
- AC4: Elem sorrendje drag-and-drop-pal módosítható; a sorrend azonnal mentésre kerül.
- AC5: Inaktív elem esetén az elem szürke háttérrel megjelenik az admin listán, de nem jelenik meg a kiválasztó listákban.
- AC6: Rendszer-szintű kódszótár (pl. Dokumentumtípus) esetén az egész szótár nem törölhető; kizárólag elemek kezelése lehetséges.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** –  
**FS fejezet:** 24

---

### US-121 | [Kódszótár] Új egyedi kódszótár létrehozása

Mint **adminisztrátor**,  
szeretnék teljesen új kódszótárat létrehozni egyedi üzleti szükségletre,  
hogy a rendszer az alapítvány saját kategóriáit is tudja kezelni.

**Elfogadási kritériumok:**
- AC1: A Kódszótárak oldalon elérhető az „Új kódszótár" gomb.
- AC2: A kódszótár neve egyedi kell legyen.
- AC3: Létrehozás után az új szótár azonnal elérhető az elemkezelő felületen.
- AC4: Saját kódszótár teljes egészében törölhető, ha nincs hozzá kapcsolt rekord a rendszerben.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-120  
**FS fejezet:** 24.6

---

## EPIC-17: Keresés, szűrés, listázás

---

### US-130 | [Lista] Pályázatok listanézete szűréssel

Mint **bármely jogosult felhasználó**,  
szeretném a pályázatok listáját szűrni és rendezni,  
hogy gyorsan megtaláljam a keresett pályázatot a sok rekord között.

**Elfogadási kritériumok:**
- AC1: A pályázatok listanézete alapértelmezetten az aktív (nem lezárt, nem archivált) pályázatokat mutatja.
- AC2: Elérhető szűrők: pályázat neve / azonosítója (szabad szöveg), pályáztató (legördülő), típus (kódszótár), állapot (multi-select checkbox), beadási határidő (dátumtartomány), elnyert összeg (sáv).
- AC3: Rendezési lehetőségek: beadási határidő, elnyert összeg, legutóbb módosítva, állapot.
- AC4: Az aktív szűrők vizuálisan jelöltek (badge-ek a szűrőpanel felett); egyenként törölhetők.
- AC5: Az „Összes szűrő törlése" gomb visszaállítja az alapértelmezett nézetet.
- AC6: A szűrők állapota URL-paraméterben tárolódik (könyvjelzőzhető és megosztható nézet).

**Prioritás:** Magas  
**Méret:** L  
**Függőségek:** US-010  
**FS fejezet:** 27.1

---

### US-131 | [Lista] Globális keresés

Mint **bármely jogosult felhasználó**,  
szeretnék a teljes rendszerben keresni egyetlen keresőmezőből,  
hogy gyorsan megtaláljak bármilyen rekordot (pályázat, pályáztató, szerződő cég, dokumentum) anélkül, hogy navigálnom kellene.

**Elfogadási kritériumok:**
- AC1: A navigációs sávban állandóan látható egy keresőmező (ikon + szövegmező).
- AC2: Keresés indítható Enterre vagy a keresőikonra kattintva (minimum 3 karakter után).
- AC3: Az eredmények csoportosítva jelennek meg: Pályázatok, Pályáztatók, Szerződő cégek.
- AC4: Minden találatnál megjelenik a rekord neve, állapota (ha van) és egy közvetlen link.
- AC5: Ha nincs találat, az üzenet: „Nem található rekord a(z) „[keresőkifejezés]" kifejezésre."

**Prioritás:** Közepes  
**Méret:** M  
**Függőségek:** US-010, US-100, US-110  
**FS fejezet:** 27.2

---

### US-132 | [Lista] Pályázatok exportálása Excelbe

Mint **elnök vagy pénzügyes**,  
szeretném a szűrt pályázatlistát Excel-fájlba exportálni,  
hogy a pályázati adatokat offline elemzésre, riportálásra felhasználhassam.

**Elfogadási kritériumok:**
- AC1: A pályázatok listanézetén elérhető az „Exportálás (.xlsx)" gomb.
- AC2: Az export a jelenleg aktív szűrőknek megfelelő rekordokat tartalmazza.
- AC3: Az export oszlopai megegyeznek a listanézet látható oszlopaival.
- AC4: A fájl letöltése automatikusan indul; a fájlnév tartalmazza a dátumot (pl. `palyazatok_20250314.xlsx`).
- AC5: Üres lista esetén az export gomb inaktív.

**Prioritás:** Közepes  
**Méret:** M  
**Függőségek:** US-130  
**FS fejezet:** 27.3

---

## EPIC-18: Értesítések és határidőfigyelés

---

### US-140 | [Értesítés] Beadási határidő közeledtének jelzése

Mint **pályázati munkatárs**,  
szeretnék értesítést kapni, ha egy pályázat beadási határideje közeleg,  
hogy időben el tudjuk készíteni és be tudjuk adni a pályázatot.

**Elfogadási kritériumok:**
- AC1: 7 nappal a beadási határidő előtt rendszerértesítés és e-mail értesítés kerül kiküldésre a Pályázati munkatársnak és az Elnöknek.
- AC2: 1 nappal az elmaradt beadási határidő után a Pályázati munkatárs és az Admin kap értesítést.
- AC3: A pályázat listanézeten a határidőhöz közel kerülő pályázatok piros/sárga figyelmeztető ikonnal jelöltek.
- AC4: Az értesítés tartalmazza: pályázat nevét, határidő dátumát, közvetlen linket a pályázatra.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-010  
**FS fejezet:** 28.1

---

### US-141 | [Értesítés] Elköltési határidő közeledtének jelzése

Mint **pénzügyes**,  
szeretnék értesítést kapni, ha a pályázati összeg elköltési határideje közeleg,  
hogy időben biztosítsuk a számlák beérkezését és a kifizetések teljesítését.

**Elfogadási kritériumok:**
- AC1: 14 nappal az elköltési határidő előtt a Pénzügyes és az Elnök értesítést kap.
- AC2: Az értesítés tartalmazza az aktuális pénzügyi egyenleget (elnyert összeg vs. rögzített számlák).
- AC3: Az értesítések csak `WON` állapotú, lezáratlan pályázatokra vonatkoznak.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-030  
**FS fejezet:** 28.1

---

### US-142 | [Értesítés] Rendszerértesítések megtekintése

Mint **bármely bejelentkezett felhasználó**,  
szeretném az összes nekem szóló rendszerértesítést egy helyen megtekinteni és olvasottnak jelölni,  
hogy ne maradjak le egyetlen fontos eseményről sem.

**Elfogadási kritériumok:**
- AC1: A navigációs sávban megjelenik egy harang ikon az olvasatlan értesítések számával (badge).
- AC2: A harang ikonra kattintva megnyílik az értesítések panel (legújabb felül).
- AC3: Minden értesítésen látható: típus ikon, szöveg, időbélyeg.
- AC4: Értesítésre kattintva a rendszer az érintett pályázatra / lépésre navigál, és az értesítés automatikusan olvasottnak jelölődik.
- AC5: Az „Összes olvasottnak jelölése" gombbal egyszerre jelölhetők olvasottnak az értesítések.
- AC6: Az értesítések panel üresen is megjelenik, „Nincs új értesítésed" szöveggel.

**Prioritás:** Közepes  
**Méret:** M  
**Függőségek:** US-001  
**FS fejezet:** 28.2

---

### US-143 | [Értesítés] Jóváhagyási értesítés az elnöknek

Mint **elnök**,  
szeretnék értesítést kapni, amikor egy pályázati lépés a jóváhagyásomat igényli,  
hogy ne kelljen folyamatosan bejelentkezni és ellenőrizni, hanem értesítés vezessen oda.

**Elfogadási kritériumok:**
- AC1: Elszámolás jóváhagyásra küldésekor az Elnök rendszer- és e-mail értesítést kap.
- AC2: Pályázati anyag jóváhagyásra küldésekor az Elnök értesítést kap.
- AC3: Költési terv jóváhagyásra küldésekor az Elnök értesítést kap.
- AC4: Az értesítés szövegéből egyértelműen kiderül a pályázat neve és a szükséges teendő.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-021, US-052, US-071  
**FS fejezet:** 28.1

---

## EPIC-19: Audit napló

---

### US-150 | [Audit] Audit napló megtekintése

Mint **adminisztrátor**,  
szeretném megtekinteni a rendszer összes adatmódosítási eseményét az audit naplóban,  
hogy visszakövethessem, ki, mikor, mit változtatott a rendszerben.

**Elfogadási kritériumok:**
- AC1: Az Audit napló oldal elérhető az Admin menüből.
- AC2: Minden bejegyzés tartalmazza: időbélyeg, felhasználó (név + e-mail), művelettípus, entitás típusa, entitás azonosítója / neve, módosított mező, régi érték, új érték.
- AC3: Szűrési lehetőségek: felhasználó, dátumtartomány, entitás típus (pályázat, számla, szerződés stb.), művelettípus (létrehozás, módosítás, törlés, állapotváltás).
- AC4: Az audit napló exportálható CSV formátumban.
- AC5: Az audit napló rekordjai módosíthatatlanok és törölhetetlenek.

**Prioritás:** Közepes  
**Méret:** M  
**Függőségek:** US-003  
**FS fejezet:** 29

---

### US-151 | [Audit] Pályázat-szintű audit napló

Mint **elnök**,  
szeretném megtekinteni egy adott pályázat módosítási előzményeit,  
hogy átlássam a pályázat életciklusa során bekövetkezett változásokat.

**Elfogadási kritériumok:**
- AC1: A pályázat részletes nézetén elérhető egy „Előzmények" / „Audit" tab (Admin és Elnök számára).
- AC2: Az oldal csak az adott pályázathoz kapcsolódó audit napló bejegyzéseket mutatja.
- AC3: A bejegyzések időrendben (legújabb felül) jelennek meg.
- AC4: Minden bejegyzés kibontható a részletek megtekintéséhez (régi és új értékek összehasonlítása).

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-150  
**FS fejezet:** 29.4

---

## EPIC-20: Adminisztrációs funkciók

---

### US-160 | [Admin] Felhasználók listázása és áttekintése

Mint **adminisztrátor**,  
szeretnék áttekinteni az összes regisztrált felhasználót,  
hogy lássam, kik férnek hozzá a rendszerhez, milyen szerepkörrel és mikor léptek be utoljára.

**Elfogadási kritériumok:**
- AC1: A Felhasználók oldal elérhető az Admin menüből.
- AC2: A lista tartalmazza: profilkép, teljes név, e-mail cím, szerepkör, státusz (aktív/inaktív), utolsó bejelentkezés.
- AC3: A lista szűrhető névre, e-mailre és szerepkörre.
- AC4: Aktív és inaktív felhasználók egy listán jelennek meg, de vizuálisan megkülönböztetve.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-001  
**FS fejezet:** 26.1

---

### US-161 | [Admin] Felhasználói szerepkör hozzárendelése

Mint **adminisztrátor**,  
szeretnék szerepkört rendelni egy felhasználóhoz,  
hogy a rendszerbe belépő személy az alapítványban betöltött pozíciójának megfelelő jogosultságokkal dolgozhasson.

**Elfogadási kritériumok:**
- AC1: A felhasználó sorában elérhető a „Szerepkör módosítása" opció.
- AC2: A szerepkör legördülő listából választható: Admin, Elnök, Pályázati munkatárs, Pénzügyes, Megtekintő.
- AC3: Mentés után a változás azonnal életbe lép; a felhasználó következő oldalbetöltésekor az új jogosultságokkal dolgozik.
- AC4: Legalább 1 aktív Admin felhasználónak mindig lennie kell; az utolsó Admin szerepkörének eltávolítása megakadályozott.
- AC5: A módosítás naplózódik az audit naplóban.

**Prioritás:** Magas  
**Méret:** S  
**Függőségek:** US-160  
**FS fejezet:** 26.1

---

### US-162 | [Admin] Felhasználó inaktiválása és reaktiválása

Mint **adminisztrátor**,  
szeretnék felhasználót inaktiválni (ha elhagyja a szervezetet) vagy reaktiválni (ha visszatér),  
hogy a hozzáférések naprakészek legyenek anélkül, hogy adatokat törölnék.

**Elfogadási kritériumok:**
- AC1: A felhasználó sorában elérhető az „Inaktiválás" / „Reaktiválás" gomb.
- AC2: Inaktivált felhasználó nem tud bejelentkezni; Google auth után hibaüzenetet kap.
- AC3: Admin nem inaktiválhatja saját fiókját.
- AC4: Inaktivált felhasználó adatai (megjegyzések, feltöltések) megmaradnak.
- AC5: Inaktiválás / reaktiválás naplózódik az audit naplóban.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** US-161  
**FS fejezet:** 26.1

---

### US-163 | [Admin] Rendszerbeállítások kezelése

Mint **adminisztrátor**,  
szeretném módosítani a rendszer alap beállításait (értesítési határidők, fájlméret korlát, szervezet neve),  
hogy a rendszer viselkedése az alapítvány igényeihez igazítható legyen.

**Elfogadási kritériumok:**
- AC1: A Rendszerbeállítások oldal elérhető az Admin menüből.
- AC2: Módosítható beállítások: értesítési előfigyelmeztetés napjainak száma (default: 7), maximum fájlméret MB-ban (default: 50), szervezet neve (megjelenik a UI-ban), meghívó érvényességi ideje órában (default: 72).
- AC3: Módosítás mentése után az értékek azonnal érvénybe lépnek.
- AC4: Érvénytelen értékek (pl. negatív szám) esetén validációs hibaüzenet jelenik meg.

**Prioritás:** Közepes  
**Méret:** S  
**Függőségek:** –  
**FS fejezet:** 26.2

---

### US-164 | [Admin] Felhasználói meghívó létrehozása és kiküldése

Mint **adminisztrátor**,  
szeretnék új felhasználót meghívni a rendszerbe e-mail cím és szerepkör megadásával,  
hogy csak általam jóváhagyott személyek férhessenek hozzá az alkalmazáshoz.

**Elfogadási kritériumok:**
- AC1: Az „Új meghívó" gomb elérhető a Felhasználók listázása oldalon.
- AC2: A meghívó űrlap tartalmazza: e-mail cím (kötelező, érvényes formátum), szerepkör (kötelező, legördülő: Admin / Elnök / Pályázati munkatárs / Pénzügyes / Megtekintő).
- AC3: Ha az adott e-mail cím már rendelkezik aktív fiókkal, a rendszer hibaüzenetet jelenít meg és nem küld meghívót.
- AC4: Ha az adott e-mail cím már rendelkezik `PENDING` státuszú meghívóval, a rendszer figyelmezteti az Admint és felajánlja az újraküldést.
- AC5: Sikeres meghívó létrehozás után a rendszer elküldi a meghívó e-mailt az időkorlátozott, egyszer használatos tokennel.
- AC6: A meghívó e-mail tartalmazza a rendszer nevét, a meghívott szerepkört és az elfogadási linket.
- AC7: Sikeres küldés után visszajelzés jelenik meg: „Meghívó elküldve: [e-mail cím]".

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-160  
**FS fejezet:** 26.1, 28.1

---

### US-165 | [Admin] Meghívók listázása és kezelése

Mint **adminisztrátor**,  
szeretném áttekinteni a kiküldött meghívókat és kezelni a függőben lévőket,  
hogy nyomon követhessem, ki fogadta el a meghívást, és szükség esetén újra küldhessek vagy visszavonhassak.

**Elfogadási kritériumok:**
- AC1: A Felhasználók oldalon elérhető egy „Meghívók" tab vagy szekció, amely listázza az összes meghívót.
- AC2: A lista oszlopai: e-mail cím, szerepkör, státusz (`PENDING` / `ACCEPTED` / `EXPIRED` / `REVOKED`), kiküldés időpontja, lejárat időpontja.
- AC3: Szűrés lehetséges státusz szerint.
- AC4: `PENDING` státuszú meghívónál elérhető a „Visszavonás" gomb; visszavonás után a státusz `REVOKED`-ra vált.
- AC5: `EXPIRED` vagy `REVOKED` státuszú meghívónál elérhető az „Újraküldés" gomb; újraküldés új tokent generál, az érvényességi idő visszaáll, a státusz `PENDING`-re vált.
- AC6: `ACCEPTED` státuszú meghívónál semmilyen módosítási lehetőség nem érhető el.
- AC7: Visszavonás és újraküldés naplózódik az audit naplóban.

**Prioritás:** Magas  
**Méret:** M  
**Függőségek:** US-164  
**FS fejezet:** 26.1

---

## Story-k összesítő táblázata

| Story ID | Modul | Cím (rövid) | Prioritás | Méret | Szerepkör |
|---|---|---|---|---|---|
| US-001 | Auth | Google bejelentkezés | Magas | M | Minden |
| US-002 | Auth | Kijelentkezés | Magas | XS | Minden |
| US-003 | Auth | Jogosultság megakadályozása | Magas | M | Rendszer |
| US-004 | Profil | Saját profil megtekintése | Közepes | S | Minden |
| US-005 | Profil | Értesítési beállítások | Közepes | S | Minden |
| US-006 | Auth | Meghívó-alapú belépési feltétel | Magas | S | Rendszer |
| US-007 | Auth | Meghívó elfogadása és fiók aktiválás | Magas | M | Meghívott |
| US-010 | Felhívás | Új felhívás rögzítése | Magas | M | Munkatárs |
| US-011 | Felhívás | Felhívás szerkesztése | Magas | S | Munkatárs |
| US-012 | Felhívás | Felhívás megtekintése | Magas | M | Minden |
| US-013 | Felhívás | Felhívás archiválása | Közepes | S | Admin |
| US-020 | Beadás | Beadás adatainak rögzítése | Magas | M | Munkatárs |
| US-021 | Beadás | Beadás jóváhagyása | Közepes | S | Elnök |
| US-030 | Eredmény | Nyert eredmény rögzítése | Magas | M | Munkatárs |
| US-031 | Eredmény | Nem nyert eredmény rögzítése | Magas | S | Munkatárs |
| US-032 | Eredmény | Eredmény korrekciója | Közepes | S | Admin |
| US-040 | Szerz./Pályáztató | Értesítő/szerződés rögzítése | Magas | M | Munkatárs |
| US-041 | Szerz./Pályáztató | Lépés kihagyása | Magas | S | Munkatárs |
| US-050 | Költési terv | Költési terv létrehozása | Magas | L | Munkatárs |
| US-051 | Költési terv | Tétel módosítása/törlése | Magas | S | Munkatárs |
| US-052 | Költési terv | Elnöki jóváhagyás | Közepes | M | Elnök |
| US-055 | Alvállalk. szerz. | Új alvállalkozói szerz. | Magas | M | Munkatárs |
| US-056 | Alvállalk. szerz. | Szerz. törlése | Közepes | S | Munkatárs |
| US-060 | Számla | Új számla rögzítése | Magas | M | Pénzügyes |
| US-061 | Számla | Fizetési státusz frissítése | Magas | S | Pénzügyes |
| US-062 | Számla | Számla törlése | Közepes | S | Pénzügyes |
| US-063 | Számla | Pénzügyi összesítő | Közepes | M | Pénzügyes |
| US-065 | Igazolás | Esemény igazolás rögzítése | Magas | M | Munkatárs |
| US-066 | Igazolás | Fotók megtekintése | Közepes | S | Minden |
| US-070 | Elszámolás | Elszámolás rögzítése | Magas | M | Pénzügyes |
| US-071 | Elszámolás | Elnöki jóváhagyás + lezárás | Magas | M | Elnök |
| US-080 | Dokumentum | Dokumentum feltöltése | Magas | M | Munkatárs |
| US-081 | Dokumentum | Letöltés és előnézet | Magas | S | Minden |
| US-082 | Dokumentum | Új verzió feltöltése | Közepes | M | Munkatárs |
| US-083 | Dokumentum | Archiválás | Közepes | S | Admin |
| US-090 | E-mail | E-mail manuális rögzítése | Közepes | M | Munkatárs |
| US-091 | E-mail | E-mail fájl feltöltése | Alacsony | M | Munkatárs |
| US-092 | E-mail | E-mail rekord törlése | Alacsony | S | Munkatárs |
| US-095 | Megjegyzés | Megjegyzés hozzáadása | Magas | S | Minden |
| US-096 | Megjegyzés | Saját megjegyzés szerkesztése | Közepes | S | Minden |
| US-100 | Pályáztató | Új pályáztató rögzítése | Magas | S | Munkatárs |
| US-101 | Pályáztató | Pályáztató szerkesztése | Közepes | XS | Munkatárs |
| US-102 | Pályáztató | Pályáztató inaktiválása | Közepes | S | Admin |
| US-103 | Pályáztató | Részletező oldal | Közepes | S | Minden |
| US-110 | Szerz. cég | Új szerz. cég rögzítése | Magas | S | Munkatárs |
| US-111 | Szerz. cég | Részletező oldal | Közepes | S | Minden |
| US-112 | Szerz. cég | Inaktiválás | Közepes | S | Admin |
| US-120 | Kódszótár | Elemek kezelése | Magas | M | Admin |
| US-121 | Kódszótár | Új szótár létrehozása | Közepes | S | Admin |
| US-130 | Lista | Szűrés és rendezés | Magas | L | Minden |
| US-131 | Lista | Globális keresés | Közepes | M | Minden |
| US-132 | Lista | Excel export | Közepes | M | Elnök |
| US-140 | Értesítés | Beadási határidő jelzése | Magas | M | Munkatárs |
| US-141 | Értesítés | Elköltési határidő jelzése | Magas | S | Pénzügyes |
| US-142 | Értesítés | Értesítések megtekintése | Közepes | M | Minden |
| US-143 | Értesítés | Jóváhagyási értesítés | Közepes | S | Elnök |
| US-150 | Audit | Audit napló megtekintése | Közepes | M | Admin |
| US-151 | Audit | Pályázat-szintű audit | Közepes | S | Elnök |
| US-160 | Admin | Felhasználók listázása | Magas | S | Admin |
| US-161 | Admin | Szerepkör hozzárendelése | Magas | S | Admin |
| US-162 | Admin | Inaktiválás/reaktiválás | Közepes | S | Admin |
| US-163 | Admin | Rendszerbeállítások | Közepes | S | Admin |
| US-164 | Admin | Meghívó létrehozása és küldése | Magas | M | Admin |
| US-165 | Admin | Meghívók listázása és kezelése | Magas | M | Admin |

---

## Javasolt sprint-csoportosítás (MVP-re fókuszálva)

### Sprint 1 – Alapinfrastruktúra és hitelesítés
US-001, US-002, US-003, US-006, US-007, US-160, US-161, US-162, US-164, US-165

### Sprint 2 – Pályázatkezelés alapjai
US-010, US-011, US-012, US-100, US-101, US-120

### Sprint 3 – Munkafolyamat: felhívástól az eredményig
US-020, US-021, US-030, US-031, US-040, US-041

### Sprint 4 – Dokumentumkezelés és megjegyzések
US-080, US-081, US-095, US-096

### Sprint 5 – Nyertes pályázat folyamata (pénzügyi rész)
US-050, US-051, US-055, US-060, US-061

### Sprint 6 – Elszámolás, igazolás, lezárás
US-065, US-070, US-071, US-052, US-056

### Sprint 7 – Keresés, szűrés, értesítések
US-130, US-131, US-140, US-141, US-142

### Sprint 8 – Kényelmi funkciók, audit, finomítás
US-082, US-083, US-090, US-110, US-111, US-121, US-132, US-150, US-151, US-163

---

*— Dokumentum vége —*

**Verzió:** 1.0  
**Kapcsolódó FS:** functional-specification.md v1.0  
**Story-k száma összesen:** 58  
