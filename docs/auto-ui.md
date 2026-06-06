# Automatizált UI Tesztelési Forgatókönyvek – Pályázatkezelő Rendszer

**Verzió:** 1.0  
**Kapcsolódó dokumentumok:** `functional-specification_orig.md`, `user-stories.md`  
**Tesztelési keretrendszer:** Playwright (Angular E2E)  
**Állapot:** Tervezet  

---

## Jelölések

- **TS-XXX** — Test Scenario azonosító
- **Prioritás:** Kritikus / Magas / Közepes / Alacsony
- **Szerepkör:** Admin | Elnök | Munkatárs | Pénzügyes | Megtekintő
- **Előfeltétel:** Mit kell teljesíteni a teszt futtatása előtt
- **Elvárt eredmény:** Mit kell a UI-nak mutatnia/tennie

---

## 1. HITELESÍTÉS ÉS MUNKAMENET

---

### TS-001 | Sikeres Google-bejelentkezés
**Kapcsolódó US:** US-001  
**Prioritás:** Kritikus  
**Szerepkör:** Bármely  
**Előfeltétel:** Felhasználó nincs bejelentkezve; érvényes Google-fiók létezik a rendszerben

**Lépések:**
1. Navigálj a `/login` oldalra
2. Ellenőrizd, hogy megjelenik a „Bejelentkezés Google-fiókkal" gomb
3. Kattints a gombra
4. Végezd el a Google OAuth folyamatot
5. Ellenőrizd az átirányítást

**Elvárt eredmény:**
- A bejelentkezési gomb látható az oldalon
- Google OAuth ablak megnyílik
- Sikeres auth után a felhasználó a főoldalra (`/dashboard`) kerül
- A navigációs sávban megjelenik a felhasználó neve és profilképe

---

### TS-002 | Első bejelentkezés – Megtekintő szerepkör kiosztás
**Kapcsolódó US:** US-001 (AC4)  
**Prioritás:** Kritikus  
**Szerepkör:** Új felhasználó  
**Előfeltétel:** A Google-fiók még nincs a rendszerben regisztrálva

**Lépések:**
1. Navigálj a `/login` oldalra
2. Jelentkezz be egy ismeretlen Google-fiókkal
3. Ellenőrizd a profil oldalt

**Elvárt eredmény:**
- A rendszer automatikusan létrehozza a felhasználót
- A szerepkör `Megtekintő`
- A felhasználó hozzáfér az oldalhoz, de nem lát szerkesztési funkciókat

---

### TS-003 | Inaktív fiók bejelentkezési kísérlete
**Kapcsolódó US:** US-001 (AC5)  
**Prioritás:** Kritikus  
**Szerepkör:** Inaktív felhasználó  
**Előfeltétel:** A felhasználó fiókja Admin által inaktiválva

**Lépések:**
1. Navigálj a `/login` oldalra
2. Jelentkezz be az inaktív Google-fiókkal
3. Ellenőrizd a hibaüzenetet

**Elvárt eredmény:**
- A rendszer nem enged be a dashboardra
- Megjelenik: „A fiókod inaktív. Kérj segítséget az adminisztrátortól."
- A felhasználó a login oldalon marad

---

### TS-004 | Munkamenet lejárata
**Kapcsolódó US:** US-001 (AC6)  
**Prioritás:** Magas  
**Szerepkör:** Bármely bejelentkezett  
**Előfeltétel:** Felhasználó be van jelentkezve

**Lépések:**
1. Szimuláld a JWT token lejáratát (idő manipulálásával vagy token törlésével)
2. Próbálj navigálni egy védett oldalra

**Elvárt eredmény:**
- A rendszer átirányít a `/login` oldalra
- A navigáció nem enged a védett oldalakra

---

### TS-005 | Kijelentkezés
**Kapcsolódó US:** US-002  
**Prioritás:** Kritikus  
**Szerepkör:** Bármely bejelentkezett  
**Előfeltétel:** Felhasználó be van jelentkezve

**Lépések:**
1. Kattints a profil menüre a navigációban
2. Kattints a „Kijelentkezés" opcióra
3. Nyomd meg a böngésző „Vissza" gombját

**Elvárt eredmény:**
- Munkamenet érvénytelenítve
- Átirányítás a `/login` oldalra
- „Vissza" gomb után nem jelenik meg védett oldal tartalma

---

### TS-006 | Védett oldal bejelentkezés nélküli elérése
**Kapcsolódó US:** US-003 (AC1)  
**Prioritás:** Kritikus  
**Szerepkör:** Anonim  
**Előfeltétel:** Nincs aktív munkamenet

**Lépések:**
1. Navigálj közvetlenül a `/applications` oldalra bejelentkezés nélkül

**Elvárt eredmény:**
- Átirányítás a `/login` oldalra
- A védett tartalom nem jelenik meg

---

### TS-007 | Jogosulatlan API-hívás
**Kapcsolódó US:** US-003 (AC3)  
**Prioritás:** Magas  
**Szerepkör:** Megtekintő  
**Előfeltétel:** Megtekintő felhasználó be van jelentkezve

**Lépések:**
1. Megtekintőként navigálj egy pályázat részletes oldalára
2. Ellenőrizd, hogy a „Törlés" gomb nem jelenik meg az UI-on
3. Közvetlen API hívással próbálj törlést végrehajtani (DELETE request)

**Elvárt eredmény:**
- UI-on a törlés gomb nem látható
- API 403 HTTP választ ad
- A naplóba kerül a jogosulatlan kísérlet

---

## 2. FELHASZNÁLÓI PROFIL

---

### TS-010 | Saját profil megtekintése
**Kapcsolódó US:** US-004  
**Prioritás:** Közepes  
**Szerepkör:** Bármely bejelentkezett  
**Előfeltétel:** Felhasználó be van jelentkezve

**Lépések:**
1. Kattints a navigációs sávban a profilképre/névre
2. Válaszd a „Profil" opciót

**Elvárt eredmény:**
- Megjelenik: teljes név, e-mail cím, profilkép, szerepkör, utolsó bejelentkezés
- A szerepkör mező csak olvasható (nem szerkeszthető)
- Az értesítési beállítások szerkeszthetők

---

### TS-011 | Értesítési beállítások módosítása
**Kapcsolódó US:** US-005  
**Prioritás:** Közepes  
**Szerepkör:** Bármely bejelentkezett  
**Előfeltétel:** Felhasználó a profil oldalon van

**Lépések:**
1. Navigálj a profil oldalra
2. Kapcsolj ki egy értesítési típust (pl. „Beadási határidő közeleg")
3. Kattints a „Mentés" gombra
4. Frissítsd az oldalt

**Elvárt eredmény:**
- A beállítás mentésre kerül
- Oldal frissítés után is megmarad a kikapcsolt állapot
- Az „Összes letiltása" kapcsoló egyszerre kapcsolja ki az összes e-mail értesítést

---

## 3. PÁLYÁZATI FELHÍVÁSOK

---

### TS-020 | Új pályázati felhívás rögzítése – sikeres eset
**Kapcsolódó US:** US-010  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Legalább 1 pályáztató létezik a rendszerben; felhasználó be van jelentkezve

**Lépések:**
1. Navigálj a pályázatok listanézetére
2. Kattints az „Új pályázat" gombra
3. Töltsd ki a kötelező mezőket:
   - Pályáztató: válassz egyet a legördülőből
   - Pályázat címe: „Teszt Pályázat 2026"
   - Beadási határidő: jövőbeli dátum
4. Kattints a „Mentés" gombra

**Elvárt eredmény:**
- A rendszer átnavigál az új pályázat részletező oldalára
- Az állapot `DRAFT`
- A pályázat megjelenik a listanézetben
- A beadási határidő és hátralévő napok száma látható

---

### TS-021 | Új pályázati felhívás – kötelező mezők validáció
**Kapcsolódó US:** US-010 (AC6)  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Felhasználó az új pályázat űrlapon van

**Lépések:**
1. Hagyj üresen minden mezőt
2. Kattints a „Mentés" gombra

**Elvárt eredmény:**
- A mentés nem hajtódik végre
- Piros szegély és hibaüzenet jelenik meg minden kötelező mezőnél: Pályáztató, Pályázat címe, Beadási határidő

---

### TS-022 | Összeg minimum > maximum validáció
**Kapcsolódó US:** US-010  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Felhasználó az új pályázat űrlapon van

**Lépések:**
1. Töltsd ki a kötelező mezőket
2. Pályázati összeg minimum: `500000`
3. Pályázati összeg maximum: `200000` (kisebb mint a minimum)
4. Kattints a „Mentés" gombra

**Elvárt eredmény:**
- Validációs hiba: „A maximum összeg nem lehet kisebb a minimum összegnél."
- A mentés megakadályozott

---

### TS-023 | Pályázati felhívás szerkesztése
**Kapcsolódó US:** US-011  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Legalább 1 pályázat `DRAFT` állapotban létezik

**Lépések:**
1. Navigálj a pályázat részletező oldalára
2. Kattints a „Szerkesztés" gombra
3. Módosítsd a pályázat leírását
4. Kattints a „Mentés" gombra
5. Kattints a „Mégse" gombra (második szerkesztésnél)

**Elvárt eredmény:**
- Mentés után a módosítás látható az oldalon
- Audit naplóba kerül a változás
- „Mégse" gomb után az el nem mentett változtatások elvesznek

---

### TS-024 | Pályázat archiválása
**Kapcsolódó US:** US-013  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** Legalább 1 pályázat létezik

**Lépések:**
1. Admin-ként navigálj a pályázat részletező oldalára
2. Kattints az „Archiválás" gombra
3. A megjelenő dialog-ban erősítsd meg

**Elvárt eredmény:**
- Megerősítő dialog megjelenik szöveggel
- Archiválás után a pályázat eltűnik az alapértelmezett listából
- Archivált szűrővel megtalálható
- Az archivált pályázat szerkeszthetetlen
- Audit napló bejegyzés keletkezik

---

### TS-025 | 7 napos határidő figyelmeztető ikon
**Kapcsolódó US:** US-010 (AC FS 10.6)  
**Prioritás:** Magas  
**Szerepkör:** Bármely  
**Előfeltétel:** Létezik pályázat, amelynek beadási határideje 5 nap múlva van

**Lépések:**
1. Navigálj a pályázatok listanézetére

**Elvárt eredmény:**
- A 7 napon belüli határidejű pályázat soránál figyelmeztető ikon jelenik meg
- A hátralévő napok száma látható

---

## 4. PÁLYÁZATI ANYAG ÉS BEADÁS

---

### TS-030 | Beadás adatainak rögzítése – lépés lezárása
**Kapcsolódó US:** US-020  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `DRAFT` állapotban; [1. Felhívás] lépés `COMPLETED`

**Lépések:**
1. Navigálj a pályázat munkafolyamat nézetére
2. Kattints a [2. Beadás] lépésre
3. Töltsd ki: leírás (kötelező), beadás módja (opcionális)
4. Mentsd el (beadás időpontja nélkül) → lépés `ACTIVE` marad
5. Add meg a beadás időpontját
6. Mentsd el

**Elvárt eredmény:**
- Időpont nélkül a lépés `ACTIVE` marad
- Időpont megadása után a lépés `COMPLETED` lesz
- A pályázat állapota `SUBMITTED`-re vált
- Az összefoglaló nézetben megjelenik a beadás időpontja

---

### TS-031 | Beadás jóváhagyása elnök által
**Kapcsolódó US:** US-021  
**Prioritás:** Magas  
**Szerepkör:** Elnök  
**Előfeltétel:** Beadás időpontja rögzítve; jóváhagyás még nem történt

**Lépések:**
1. Elnökként navigálj a pályázat [2. Beadás] lépéséhez
2. Ellenőrizd a „Jóváhagyásra vár" státusz-jelzést
3. Kattints a „Jóváhagyás" gombra

**Elvárt eredmény:**
- A „Jóváhagyás" gomb látható Elnöknél és Adminnél
- Jóváhagyás után a lépés `COMPLETED`, pályázat `SUBMITTED`
- Értesítés kerül a pályázati munkatárshoz

---

## 5. PÁLYÁZATI EREDMÉNY

---

### TS-040 | Nyert eredmény rögzítése
**Kapcsolódó US:** US-030  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `SUBMITTED` állapotban

**Lépések:**
1. Navigálj a [3. Eredmény] lépéshez
2. Válaszd az „Eredmény" mezőnél: „Nyert"
3. Töltsd ki az elnyert összeg mezőt: `2000000`
4. Add meg az eredmény időpontját
5. Kattints a „Mentés" gombra

**Elvárt eredmény:**
- Az elnyert összeg mező `Nyert` választáskor kötelezővé válik
- Mentés után a pályázat állapota `WON`
- A [4]–[9] munkafolyamat-lépések aktívak lesznek
- Az Elnök értesítést kap
- Az elnyert összeg megjelenik a listanézetben

---

### TS-041 | Nyert eredmény – elnyert összeg nélkül nem menthető
**Kapcsolódó US:** US-030 (AC3)  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** [3. Eredmény] lépésnél vagyunk

**Lépések:**
1. Válaszd: „Nyert"
2. Hagyd üresen az elnyert összeg mezőt
3. Kattints a „Mentés" gombra

**Elvárt eredmény:**
- Mentés megakadályozva
- Hibaüzenet: „Nyert eredménynél az elnyert összeg megadása kötelező."

---

### TS-042 | Nem nyert eredmény rögzítése
**Kapcsolódó US:** US-031  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `SUBMITTED` állapotban

**Lépések:**
1. Navigálj a [3. Eredmény] lépéshez
2. Válaszd: „Nem nyert"
3. Mentsd el

**Elvárt eredmény:**
- Elnyert összeg mező nem jelenik meg
- Pályázat állapota: `LOST`
- A [4]–[9] lépések szürkítve, „Nem alkalmazható" felirattal jelennek meg
- A lista nézetben az eredmény ikon frissül

---

### TS-043 | Eredmény korrekciója Admin által
**Kapcsolódó US:** US-032  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** Pályázat `WON` állapotban (eredmény már rögzítve)

**Lépések:**
1. Adminként navigálj a [3. Eredmény] lépéshez
2. Módosítsd az eredményt „Nyert"-ről „Nem nyert"-re
3. Erősítsd meg a figyelmeztető dialógban

**Elvárt eredmény:**
- Figyelmeztető dialog jelenik meg: „A módosítás lezárja a folyamat [4]–[9] lépéseit."
- A módosítás naplózódik az audit naplóban
- `CLOSED` állapotú pályázaton csak Admin módosíthat

---

## 6. ÉRTESÍTŐ ÉS SZERZŐDÉSKÖTÉS

---

### TS-050 | Értesítő/szerződési adatok rögzítése
**Kapcsolódó US:** US-040  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `WON` állapotban

**Lépések:**
1. Navigálj a [4. Értesítő/Szerződés] lépéshez
2. Töltsd ki az opcionális mezőket
3. Jelöld a lépést `COMPLETED`-nek

**Elvárt eredmény:**
- A lépés csak `WON` állapotú pályázatnál aktív
- A lépés manuálisan jelölhető elvégzettnek

---

### TS-051 | Lépés kihagyása indokkal
**Kapcsolódó US:** US-041  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** [4. Értesítő/Szerződés] lépésnél vagyunk

**Lépések:**
1. Kattints az „Ezt a lépést kihagyom" gombra
2. A megjelenő modalban add meg az indokot
3. Erősítsd meg a kihagyást

**Elvárt eredmény:**
- Modal megjelenik az indok beviteli mezővel
- Kihagyás után a lépés `SKIPPED` állapotú
- „Kihagyva" badge látható az indokkal
- A folyamat a következő lépésre lép

---

### TS-052 | Kihagyott lépés visszaállítása
**Kapcsolódó US:** US-040 (AC5)  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** A [4.] lépés `SKIPPED` állapotban van

**Lépések:**
1. Admin vagy Elnökként navigálj a kihagyott lépéshez
2. Kattints a „Visszaállítás aktívra" opcióra

**Elvárt eredmény:**
- A lépés visszakerül `ACTIVE` állapotba
- A kihagyás badge eltűnik

---

## 7. KÖLTÉSI TERV

---

### TS-060 | Új költési terv tételekkel – sikeres eset
**Kapcsolódó US:** US-050  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `WON` állapotban; elnyert összeg: 1 000 000 Ft

**Lépések:**
1. Navigálj a [5. Költési terv] lépéshez
2. Kattints az „Új tétel hozzáadása" gombra
3. Töltsd ki: Tétel neve: „Rendezvény bérlés", Típus: „Esemény", Összeg: `500000`
4. Adj hozzá egy második tételt: „Laptop", Típus: „Tárgyi jószág", Összeg: `300000`
5. Mentsd el a lépést

**Elvárt eredmény:**
- A tételek megjelennek a listán
- Összesítő: „Tervezett: 800 000 Ft / Elnyert: 1 000 000 Ft – 200 000 Ft szabad keret"
- A lépés lezárható (legalább 1 tétel van)

---

### TS-061 | Költési terv – túllépési figyelmeztetés
**Kapcsolódó US:** US-050 (AC5)  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `WON`; elnyert összeg: 1 000 000 Ft

**Lépések:**
1. Adj hozzá tételeket, amelyek összege meghaladja az 1 000 000 Ft-ot (pl. 1 200 000 Ft)

**Elvárt eredmény:**
- Sárga figyelmeztető jelzés jelenik meg (nem blokkoló)
- A mentés nem akadályozott
- Az összesítőben negatív egyenleg látható piros színnel

---

### TS-062 | Tétel törlése – kapcsolt számla esetén megakadályozva
**Kapcsolódó US:** US-051 (AC2)  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Tételhez kapcsolt számla létezik

**Lépések:**
1. Navigálj a [5. Költési terv] lépéshez
2. Kattints egy kapcsolt számlával rendelkező tétel „Törlés" ikonára

**Elvárt eredmény:**
- Hibaüzenet: „A tétel nem törölhető, mert kapcsolt számla/szerződés létezik."
- A tétel megmarad

---

### TS-063 | Tételek drag-and-drop sorrendezése
**Kapcsolódó US:** US-050 (AC6)  
**Prioritás:** Közepes  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Legalább 2 tétel létezik a költési tervben

**Lépések:**
1. Húzz egy tételt a lista első pozíciójáról a második pozícióra

**Elvárt eredmény:**
- A tételek sorrendje vizuálisan frissül
- Mentés után az új sorrend megmarad

---

### TS-064 | Elnöki jóváhagyás a költési tervhez
**Kapcsolódó US:** US-052  
**Prioritás:** Közepes  
**Szerepkör:** Elnök  
**Előfeltétel:** Legalább 1 tétel létezik; Munkatárs jóváhagyásra küldte

**Lépések:**
1. Munkatársként kattints a „Jóváhagyásra küldés" gombra
2. Elnökként fogadd az értesítést
3. Navigálj a [5. Költési terv] lépéshez
4. Kattints a „Jóváhagyás" gombra

**Elvárt eredmény:**
- Munkatársnál megjelenik a „Jóváhagyásra küldés" gomb
- Elnök értesítést kap
- Jóváhagyás után a lépés `COMPLETED`
- Visszautasítás esetén a lépés `ACTIVE` marad, megjegyzés megjelenik

---

## 8. ALVÁLLALKOZÓI SZERZŐDÉSEK

---

### TS-070 | Új alvállalkozói szerződés rögzítése
**Kapcsolódó US:** US-055  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `WON`; legalább 1 szerződő cég létezik

**Lépések:**
1. Navigálj a [6. Alvállalkozói szerz.] lépéshez
2. Kattints az „Új szerződés" gombra
3. Töltsd ki: Szerződő cég (autocomplete, kötelező), Szerződéskötés dátuma, Összeg: `500000`
4. Mentsd el

**Elvárt eredmény:**
- A szerződés megjelenik a listán
- Összesítő frissül
- Több szerződés hozzáadható

---

### TS-071 | Alvállalkozói szerződés törlése – kapcsolt számla esetén tiltva
**Kapcsolódó US:** US-056  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Szerződéshez kapcsolt számla létezik

**Lépések:**
1. Kattints a szerződés „Törlés" ikonjára

**Elvárt eredmény:**
- Hibaüzenet: „A szerződés nem törölhető, mert X db számla kapcsolódik hozzá."
- A törlés megakadályozott

---

### TS-072 | Alvállalkozói szerződés törlése – nincs kapcsolt számla
**Kapcsolódó US:** US-056  
**Prioritás:** Közepes  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Szerződéshez nem kapcsolódik számla

**Lépések:**
1. Kattints a szerződés „Törlés" ikonjára
2. Erősítsd meg a megerősítő dialogban

**Elvárt eredmény:**
- Megerősítő kérdés jelenik meg
- Törlés után a szerződés eltűnik a listából
- Audit napló bejegyzés keletkezik

---

## 9. SZÁMLÁK ÉS FIZETÉSEK

---

### TS-080 | Új számla rögzítése (fizetve)
**Kapcsolódó US:** US-060  
**Prioritás:** Kritikus  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Pályázat `WON` állapotban

**Lépések:**
1. Navigálj a [7. Számlák] lépéshez
2. Kattints az „Új számla" gombra
3. Töltsd ki: Szállító: „ABC Kft", Sorszám: „SZ-2026-001", Kiállítás: `2026-01-15`, Összeg: `300000`
4. Jelöld be: „Fizetve = igen", Fizetés időpontja: `2026-01-20`
5. Mentsd el

**Elvárt eredmény:**
- A számla megjelenik a listán zöld fizetett jelöléssel
- Összesítő frissül: rögzített számlák összege, ebből fizetett

---

### TS-081 | Fizetve = igen, de fizetési dátum nélkül
**Kapcsolódó US:** US-060 (AC4)  
**Prioritás:** Kritikus  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Számlafelviteli form megnyitva

**Lépések:**
1. Töltsd ki az alapmezőket
2. Jelöld be: „Fizetve = igen"
3. Hagyd üresen a fizetés időpontja mezőt
4. Kattints a „Mentés" gombra

**Elvárt eredmény:**
- Validációs hiba: „Ha a számla fizetve van, a fizetés időpontja kötelező."
- A mentés megakadályozott

---

### TS-082 | Fizetési státusz gyors frissítése
**Kapcsolódó US:** US-061  
**Prioritás:** Magas  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Legalább 1 kifizetetlen számla létezik

**Lépések:**
1. A számla listán kattints a „Megjelölés fizetettnek" gyorsgombra
2. A mini-modalban add meg a fizetés dátumát
3. Erősítsd meg

**Elvárt eredmény:**
- Mini-modal megjelenik dátum beviteli mezővel
- Mentés után a számla zöld fizetett jelöléssel frissül
- Az összesítő automatikusan frissül
- Audit napló bejegyzés keletkezik

---

### TS-083 | Számlák szűrése fizetve / nem fizetve
**Kapcsolódó US:** US-063 (AC3)  
**Prioritás:** Közepes  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Vegyesen fizetett és nem fizetett számlák léteznek

**Lépések:**
1. A [7. Számlák] lépésnél alkalmazd a „Csak nem fizetett" szűrőt

**Elvárt eredmény:**
- Csak a kifizetetlen számlák jelennek meg
- Az összesítő panel értékei frissülnek a szűrőnek megfelelően

---

### TS-084 | Pénzügyi összesítő panel
**Kapcsolódó US:** US-063  
**Prioritás:** Közepes  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Több számla rögzítve; elnyert összeg: 1 000 000 Ft; számlák összege: 1 200 000 Ft

**Lépések:**
1. Navigálj a [7. Számlák] lépés tetejére

**Elvárt eredmény:**
- Összesítő panel látható: elnyert összeg, tervezett összeg, számlák összege, fizetett, fizetetlen, egyenleg
- Ha számlák összege > elnyert összeg, piros szín jelzi a túllépést

---

### TS-085 | Számla törlése lezárt pályázatnál tiltva
**Kapcsolódó US:** US-062  
**Prioritás:** Magas  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Pályázat `CLOSED_WON` állapotban

**Lépések:**
1. Navigálj a lezárt pályázat [7. Számlák] lépéséhez
2. Próbáld törölni az egyik számlát

**Elvárt eredmény:**
- A törlés gomb nem látható, vagy nem aktív
- A számlák nem módosíthatók

---

## 10. ESEMÉNY ÉS TELJESÍTÉS IGAZOLÁSA

---

### TS-090 | Igazolás rögzítése fotóval – sikeres eset
**Kapcsolódó US:** US-065  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `WON` állapotban

**Lépések:**
1. Navigálj a [8. Igazolás] lépéshez
2. Kattints az „Új igazolás" gombra
3. Válaszd a típust: „Esemény"
4. Add meg az esemény időpontját
5. Tölts fel legalább 1 képfájlt (JPG)
6. Mentsd el

**Elvárt eredmény:**
- Az igazolás mentve
- A fotók bélyegképként megjelennek az igazolás rekordján
- Több igazolás hozzáadható

---

### TS-091 | Igazolás mentése fotó nélkül – tiltva
**Kapcsolódó US:** US-065 (AC4)  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** [8. Igazolás] lépésnél, új igazolás form megnyitva

**Lépések:**
1. Töltsd ki a típust és időpontot
2. Ne tölts fel fotót
3. Kattints a „Mentés" gombra

**Elvárt eredmény:**
- Validációs hiba: „Legalább 1 fotó feltöltése kötelező az igazolás rögzítéséhez."
- A mentés megakadályozott

---

### TS-092 | Fotó lightbox előnézet
**Kapcsolódó US:** US-066  
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** Igazoláshoz fotók feltöltve

**Lépések:**
1. Kattints egy bélyegképre az igazolás rekordján

**Elvárt eredmény:**
- Lightbox megnyílik teljes méretű előnézettel
- Bezárás X gombbal vagy ESC billentyűvel működik
- Letöltés gomb elérhető
- ZIP letöltés az összes fotóhoz elérhető

---

## 11. ELSZÁMOLÁS

---

### TS-100 | Elszámolás rögzítése
**Kapcsolódó US:** US-070  
**Prioritás:** Kritikus  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Pályázat `WON`; legalább 1 számla rögzítve

**Lépések:**
1. Navigálj a [9. Elszámolás] lépéshez
2. Add meg az elszámolás időpontját (kötelező)
3. Töltsd ki az opcionális mezőket
4. Mentsd el

**Elvárt eredmény:**
- Az elszámolás elmentve
- Elnök jóváhagyási értesítést kap

---

### TS-101 | Elszámolás – 80%-os küszöb figyelmeztetés
**Kapcsolódó US:** US-070 (AC4)  
**Prioritás:** Magas  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Számlák összege az elnyert összeg 60%-a (pl. elnyert: 1 000 000, számlák: 600 000)

**Lépések:**
1. Navigálj a [9. Elszámolás] lépéshez
2. Adj meg elszámolás időpontját
3. Kattints a „Mentés" gombra

**Elvárt eredmény:**
- Figyelmeztető üzenet megjelenik: „A rögzített számlák összege 60%, ami nem éri el az elnyert összeg 80%-át. Biztosan folytatod?"
- A mentés nem blokkolt (el lehet fogadni a figyelmeztetést)

---

### TS-102 | Pályázat lezárása elnöki jóváhagyással
**Kapcsolódó US:** US-071  
**Prioritás:** Kritikus  
**Szerepkör:** Elnök  
**Előfeltétel:** Elszámolás rögzítve; Elnök értesítést kapott

**Lépések:**
1. Elnökként navigálj az értesítésre és kattints rá
2. A pályázat [9. Elszámolás] lépésénél kattints a „Jóváhagyás" gombra
3. Erősítsd meg a megerősítő dialogban

**Elvárt eredmény:**
- Megerősítő dialog: „Biztosan lezárod a pályázatot? Ez után módosítás nem lehetséges."
- Jóváhagyás után pályázat: `CLOSED_WON`
- Minden lépés `LOCKED`
- Szerkesztés gombok eltűnnek (Admin kivételével)
- Audit napló bejegyzés keletkezik

---

## 12. DOKUMENTUMKEZELÉS

---

### TS-110 | Dokumentum feltöltése – sikeres eset
**Kapcsolódó US:** US-080  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat bármely aktív lépésénél vagyunk

**Lépések:**
1. Kattints a „Dokumentum hozzáadása" gombra
2. Válaszd a dokumentumtípust: „Pályázati kiírás"
3. Tölts fel egy PDF fájlt (< 50 MB)
4. Opcionálisan add meg a megjelenítési nevet
5. Kattints a „Feltöltés" gombra

**Elvárt eredmény:**
- Progress bar jelenik meg feltöltés közben
- Sikeres feltöltés után a dokumentum azonnal megjelenik a listában
- A feltöltés időpontja és feltöltő neve látható

---

### TS-111 | Nem engedélyezett fájlformátum elutasítása
**Kapcsolódó US:** US-080 (AC5)  
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Dokumentum feltöltő dialog megnyitva

**Lépések:**
1. Próbálj feltölteni egy `.exe` fájlt

**Elvárt eredmény:**
- Hibaüzenet: „Ez a fájlformátum nem támogatott. Megengedett formátumok: PDF, DOCX, XLSX, JPG, PNG, TIFF, MSG, EML."
- A feltöltés megakadályozott

---

### TS-112 | 50 MB-os fájlméret korlát
**Kapcsolódó US:** US-080 (AC6)  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Dokumentum feltöltő dialog megnyitva

**Lépések:**
1. Próbálj feltölteni egy 55 MB-os PDF-et

**Elvárt eredmény:**
- Hibaüzenet: „A fájl mérete meghaladja az 50 MB-os korlátot."
- A feltöltés megakadályozott

---

### TS-113 | Dokumentum letöltése
**Kapcsolódó US:** US-081  
**Prioritás:** Magas  
**Szerepkör:** Bármely  
**Előfeltétel:** Legalább 1 dokumentum feltöltve

**Lépések:**
1. A dokumentum listánál kattints a „Letöltés" gombra

**Elvárt eredmény:**
- A fájl letöltése megkezdődik
- A dokumentum közvetlen URL-ből nem érhető el (302 vagy 403 a közvetlen URL-re)

---

### TS-114 | Kép előnézet lightbox
**Kapcsolódó US:** US-081 (AC2)  
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** JPG vagy PNG dokumentum feltöltve

**Lépések:**
1. Kattints az „Előnézet" gombra a képfájl mellett

**Elvárt eredmény:**
- Lightbox megnyílik a kép teljes méretű előnézetével
- Bezárható ESC-cel és X gombbal

---

### TS-115 | Dokumentum verziókezelés
**Kapcsolódó US:** US-082  
**Prioritás:** Közepes  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Legalább 1 dokumentum feltöltve

**Lépések:**
1. Kattints a dokumentum „Új verzió feltöltése" opciójára
2. Tölts fel egy frissített verziót

**Elvárt eredmény:**
- Az új verzió „Aktív" lesz
- A korábbi verzió „Archív" állapotba kerül
- A verziótörténet listázható (verzió szám, dátum, feltöltötte)
- Archív verzió is letölthető

---

## 13. E-MAIL CSATOLÁSOK

---

### TS-120 | E-mail manuális rögzítése
**Kapcsolódó US:** US-090  
**Prioritás:** Közepes  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Bármely aktív lépés nézeténél vagyunk

**Lépések:**
1. Kattints az „E-mail hozzáadása" gombra
2. Töltsd ki: Tárgy, Feladó, Dátum, Irány: „Bejövő"
3. Töltsd ki opcionálisan a tartalom összefoglalóját
4. Mentsd el

**Elvárt eredmény:**
- Az e-mail megjelenik az e-mail listában, időrendben (legújabb felül)
- A kötelező mezők hiányában validációs hiba jelenik meg

---

### TS-121 | E-mail törlése – csak saját vagy Admin
**Kapcsolódó US:** US-092  
**Prioritás:** Közepes  
**Szerepkör:** Munkatárs / Admin  
**Előfeltétel:** E-mail rekordok léteznek

**Lépések:**
1. Munkatárs A rögzít egy e-mailt
2. Munkatárs B próbálja törölni azt
3. Admin törli ugyanazt az e-mailt

**Elvárt eredmény:**
- Munkatárs B-nél nincs törlés opció (más felhasználó e-mailja)
- Admin törölheti bárki e-mailját
- Törlés előtt megerősítő kérdés jelenik meg
- Soft delete, audit napló bejegyzés

---

## 14. MEGJEGYZÉSEK

---

### TS-130 | Megjegyzés hozzáadása
**Kapcsolódó US:** US-095  
**Prioritás:** Magas  
**Szerepkör:** Bármely jogosult  
**Előfeltétel:** Bármely lépés nézetén vagyunk

**Lépések:**
1. A megjegyzés szekcióban kattints a beviteli mezőre
2. Írd be: „Ez egy teszt megjegyzés"
3. Kattints a „Küldés" gombra

**Elvárt eredmény:**
- A megjegyzés azonnal megjelenik chat-szerű elrendezésben
- A szerző neve és időpontja látható
- A szövegmező kiürül mentés után

---

### TS-131 | Saját megjegyzés szerkesztése és törlése
**Kapcsolódó US:** US-096  
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** Saját megjegyzés létezik

**Lépések:**
1. Kattints a saját megjegyzés „Szerkesztés" ikonjára
2. Módosítsd a szöveget
3. Mentsd el
4. Kattints a „Törlés" ikonra
5. Erősítsd meg

**Elvárt eredmény:**
- Szerkesztés opció csak saját megjegyzésnél látható (és Adminnél)
- Törlés után: „[Megjegyzés törölve]" felirat jelenik meg a tartalom helyett
- Törlés naplózódik

---

### TS-132 | Más felhasználó megjegyzésének szerkesztési kísérlete
**Kapcsolódó US:** US-096 (AC2)  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Más felhasználó megjegyzése látható

**Lépések:**
1. Nézd meg egy másik felhasználó megjegyzését

**Elvárt eredmény:**
- A „Szerkesztés" és „Törlés" ikonok nem jelennek meg a más felhasználó megjegyzésén

---

## 15. PÁLYÁZTATÓK KEZELÉSE

---

### TS-140 | Új pályáztató rögzítése
**Kapcsolódó US:** US-100  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Munkatárs be van jelentkezve

**Lépések:**
1. Navigálj a Pályáztatók modulba
2. Kattints az „Új pályáztató" gombra
3. Töltsd ki: Megnevezés (egyedi, kötelező), Leírás, E-mail (érvényes formátum)
4. Mentsd el

**Elvárt eredmény:**
- Az új pályáztató mentve és elérhető
- Az új pályáztató azonnal megjelenik az új pályázat rögzítésekor a legördülőben

---

### TS-141 | Duplikált pályáztató neve – hibakezelés
**Kapcsolódó US:** US-100 (AC3)  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** „Magyar Alapítvány" nevű pályáztató már létezik

**Lépések:**
1. Hozz létre új pályáztatót „Magyar Alapítvány" névvel

**Elvárt eredmény:**
- Hibaüzenet: „Ez a pályáztató már szerepel a rendszerben."
- A mentés megakadályozott

---

### TS-142 | Pályáztató inaktiválása
**Kapcsolódó US:** US-102  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** Pályáztató létezik, amelyhez aktív pályázat tartozik

**Lépések:**
1. Admin-ként navigálj a pályáztató oldalára
2. Kattints az „Inaktiválás" gombra

**Elvárt eredmény:**
- Inaktív pályáztató nem jelenik meg az új pályázat legördülő listájában
- Meglévő pályázatokon a pályáztató neve megmarad „(inaktív)" jelöléssel
- Aktív pályázathoz kapcsolt pályáztató törlése megakadályozott

---

### TS-143 | Pályáztató részletező oldal
**Kapcsolódó US:** US-103  
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** Pályáztató létezik kapcsolt pályázatokkal

**Lépések:**
1. Navigálj egy pályáztató részletező oldalára

**Elvárt eredmény:**
- Megjelenik: megnevezés, leírás, kontaktadatok
- Kapcsolt pályázatok listája látható (névvel, állapottal, elnyert összeggel)
- A pályázat nevére kattintva navigálhatunk az adott pályázatra

---

## 16. SZERZŐDŐ CÉGEK

---

### TS-150 | Új szerződő cég rögzítése
**Kapcsolódó US:** US-110  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Munkatárs be van jelentkezve

**Lépések:**
1. Navigálj a Szerződő cégek modulba
2. Kattints az „Új szerződő cég" gombra
3. Töltsd ki: Megnevezés (kötelező), Adószám: „12345678-1-23"
4. Mentsd el

**Elvárt eredmény:**
- A cég mentve és kereshető alvállalkozói szerződés rögzítésekor
- Adószám formátum nem megfelelő esetén figyelmeztető (de nem blokkoló)

---

### TS-151 | Szerződő cég inaktiválása – aktív szerződéssel tiltva
**Kapcsolódó US:** US-112  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** Céghez aktív alvállalkozói szerződés kapcsolódik

**Lépések:**
1. Admin-ként próbáld törölni az aktív szerződéssel rendelkező céget

**Elvárt eredmény:**
- Törlés helyett inaktiválás érhető el
- Figyelmeztető: „Aktív szerződéssel rendelkező cég nem törölhető."
- Inaktív cég nem jelenik meg az alvállalkozói szerz. legördülő listájában

---

## 17. KÓDSZÓTÁRAK

---

### TS-160 | Kódszótár elem hozzáadása
**Kapcsolódó US:** US-120  
**Prioritás:** Magas  
**Szerepkör:** Admin  
**Előfeltétel:** Admin be van jelentkezve

**Lépések:**
1. Navigálj az Admin menü → Kódszótárak oldalra
2. Válaszd a „Pályázat típusa" kódszótárat
3. Kattints az „Új elem" gombra
4. Töltsd ki: Kód: „EU", Megnevezés: „EU pályázat"
5. Mentsd el

**Elvárt eredmény:**
- Az új elem megjelenik a kódszótár listájában
- Az elem elérhető a pályázat típus legördülőben

---

### TS-161 | Kódszótár elem drag-and-drop sorrendezés
**Kapcsolódó US:** US-120 (AC4)  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** Legalább 2 elem létezik egy kódszótárban

**Lépések:**
1. Húzz egy kódszótár elemet a listán feljebb

**Elvárt eredmény:**
- Sorrend vizuálisan frissül
- A mentés automatikusan megtörténik
- Az új sorrend tükröződik a kiválasztó listákban

---

### TS-162 | Rendszer-szintű kódszótár nem törölhető
**Kapcsolódó US:** US-120 (AC6)  
**Prioritás:** Magas  
**Szerepkör:** Admin  
**Előfeltétel:** Admin a kódszótárak oldalon

**Lépések:**
1. Próbáld törölni a „Dokumentumtípus" rendszer-szintű kódszótárat

**Elvárt eredmény:**
- Törlés gomb nem aktív, vagy hibaüzenet jelenik meg
- Csak elemek kezelése lehetséges, maga a kódszótár nem törölhető

---

## 18. KERESÉS, SZŰRÉS, LISTÁZÁS

---

### TS-170 | Pályázatok listanézete – alapszűrés
**Kapcsolódó US:** US-130  
**Prioritás:** Magas  
**Szerepkör:** Bármely  
**Előfeltétel:** Több pályázat létezik különböző állapotokban

**Lépések:**
1. Navigálj a pályázatok listanézetére
2. Alkalmazd az „Állapot" szűrőt: csak `WON`

**Elvárt eredmény:**
- Csak `WON` állapotú pályázatok jelennek meg
- Az aktív szűrők badge-ként láthatók a szűrőpanel felett
- Az „Összes szűrő törlése" visszaállítja az alapnézetet

---

### TS-171 | URL-alapú szűrő állapot megőrzés
**Kapcsolódó US:** US-130 (AC6)  
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** Aktív szűrők be vannak állítva

**Lépések:**
1. Alkalmazz szűrőket (pl. állapot: `WON`, pályáztató: „Magyar Alapítvány")
2. Másold ki az URL-t
3. Nyisd meg az URL-t egy új lapon

**Elvárt eredmény:**
- Az új lapon is az elmentett szűrők vannak aktívan
- A lista azonos rekordokat mutat

---

### TS-172 | Globális keresés
**Kapcsolódó US:** US-131  
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** Léteznek pályázatok, pályáztatók és szerződő cégek

**Lépések:**
1. Kattints a navigációs sáv keresőjére
2. Gépeld be: „Teszt" (legalább 3 karakter)
3. Nyomd meg az Enter billentyűt

**Elvárt eredmény:**
- Eredmények csoportosítva: Pályázatok / Pályáztatók / Szerződő cégek
- Minden találat névvel, állapottal és közvetlen linkkel jelenik meg
- Ha nincs találat: „Nem található rekord a(z) „Teszt" kifejezésre."

---

### TS-173 | Excel export
**Kapcsolódó US:** US-132  
**Prioritás:** Közepes  
**Szerepkör:** Elnök  
**Előfeltétel:** Pályázatok léteznek; aktív szűrők be vannak állítva

**Lépések:**
1. Állíts be szűrőket a listanézeten
2. Kattints az „Exportálás (.xlsx)" gombra

**Elvárt eredmény:**
- A fájl letöltése automatikusan indul
- Fájlnév formátuma: `palyazatok_YYYYMMDD.xlsx`
- A fájl csak a szűrt rekordokat tartalmazza
- Üres lista esetén az export gomb inaktív

---

## 19. ÉRTESÍTÉSEK

---

### TS-180 | Harang ikon – olvasatlan számláló
**Kapcsolódó US:** US-142  
**Prioritás:** Magas  
**Szerepkör:** Bármely  
**Előfeltétel:** Legalább 1 olvasatlan értesítés létezik

**Lépések:**
1. Navigálj bármely oldalra
2. Nézd meg a navigációs sáv harang ikonját

**Elvárt eredmény:**
- Az ikon mellett badge jelzi az olvasatlan értesítések számát
- Ikonra kattintva megnyílik az értesítések panel (legújabb felül)
- Minden értesítésnél: típus ikon, szöveg, időbélyeg látható

---

### TS-181 | Értesítésre kattintás – navigáció az érintett lépésre
**Kapcsolódó US:** US-142 (AC4)  
**Prioritás:** Magas  
**Szerepkör:** Bármely  
**Előfeltétel:** Értesítés panel nyitva; értesítés létezik

**Lépések:**
1. Kattints egy értesítésre az értesítések panelben

**Elvárt eredmény:**
- A rendszer az érintett pályázat / lépésre navigál
- Az értesítés automatikusan olvasottnak jelölődik
- A badge számláló csökken

---

### TS-182 | Összes olvasottnak jelölése
**Kapcsolódó US:** US-142 (AC5)  
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** Több olvasatlan értesítés létezik

**Lépések:**
1. Nyisd meg az értesítések panelt
2. Kattints az „Összes olvasottnak jelölése" gombra

**Elvárt eredmény:**
- Minden értesítés olvasottnak jelölve
- Badge számláló 0-ra csökken
- A panel tartalmazza az üzenet: „Nincs új értesítésed" (ha minden olvasott)

---

### TS-183 | Beadási határidő figyelmeztető értesítés
**Kapcsolódó US:** US-140  
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat beadási határideje 6 nap múlva van; rendszer értesítő job lefutott

**Lépések:**
1. Ellenőrizd az értesítések panelt
2. Ellenőrizd a listanézet figyelmeztető ikonját

**Elvárt eredmény:**
- Rendszerértesítés: pályázat neve, határidő dátuma, közvetlen link
- E-mail értesítés is kiment a Munkatársnak és Elnöknek
- A listanézetben a pályázat során figyelmeztető ikon (sárga/piros)

---

## 20. AUDIT NAPLÓ

---

### TS-190 | Audit napló megtekintése – Admin
**Kapcsolódó US:** US-150  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** Különböző típusú műveletek elvégezve

**Lépések:**
1. Admin-ként navigálj az Admin menü → Audit napló oldalra

**Elvárt eredmény:**
- Minden bejegyzésnél látható: időbélyeg, felhasználó, művelettípus, entitás, régi/új érték
- Szűrési lehetőségek elérhetők: felhasználó, dátumtartomány, entitás típus, művelettípus
- Az audit napló rekordjai csak olvashatók (nem törölhetők, nem szerkeszthetők)

---

### TS-191 | Audit napló CSV export
**Kapcsolódó US:** US-150 (AC4)  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** Admin az audit napló oldalon

**Lépések:**
1. Alkalmazz szűrőket (pl. utóbbi 30 nap)
2. Kattints az „Exportálás CSV" gombra

**Elvárt eredmény:**
- CSV fájl letöltése megkezdődik
- A fájl a szűrőnek megfelelő bejegyzéseket tartalmazza

---

### TS-192 | Pályázat-szintű audit napló
**Kapcsolódó US:** US-151  
**Prioritás:** Közepes  
**Szerepkör:** Elnök  
**Előfeltétel:** Pályázat létezik módosítási előzményekkel

**Lépések:**
1. Elnökként navigálj egy pályázat részletező oldalára
2. Kattints az „Előzmények" / „Audit" tabra

**Elvárt eredmény:**
- Csak az adott pályázathoz kapcsolódó bejegyzések láthatók
- Legújabb felül rendezve
- Bejegyzések kibonthatók (régi és új értékek összehasonlítva)
- Munkatárs számára ez a tab nem látható

---

## 21. ADMINISZTRÁCIÓS FUNKCIÓK

---

### TS-200 | Felhasználók listázása
**Kapcsolódó US:** US-160  
**Prioritás:** Magas  
**Szerepkör:** Admin  
**Előfeltétel:** Több felhasználó létezik különböző szerepkörökkel

**Lépések:**
1. Admin-ként navigálj az Admin menü → Felhasználók oldalra

**Elvárt eredmény:**
- Lista tartalmazza: profilkép, teljes név, e-mail, szerepkör, státusz, utolsó bejelentkezés
- Aktív és inaktív felhasználók vizuálisan megkülönböztetett
- Szűrhető névre, e-mailre, szerepkörre

---

### TS-201 | Szerepkör hozzárendelése
**Kapcsolódó US:** US-161  
**Prioritás:** Kritikus  
**Szerepkör:** Admin  
**Előfeltétel:** Legalább 1 „Megtekintő" szerepkörű felhasználó létezik

**Lépések:**
1. Navigálj a Felhasználók oldalra
2. A Megtekintő felhasználó sorában válaszd a „Szerepkör módosítása" opciót
3. Válaszd: „Pályázati munkatárs"
4. Mentsd el

**Elvárt eredmény:**
- A szerepkör azonnal frissül a listán
- A felhasználó következő oldalbetöltésekor az új jogosultságokkal dolgozik
- Audit napló bejegyzés keletkezik

---

### TS-202 | Utolsó Admin szerepkörének eltávolítása – megakadályozva
**Kapcsolódó US:** US-161 (AC4)  
**Prioritás:** Kritikus  
**Szerepkör:** Admin  
**Előfeltétel:** Csak 1 aktív Admin felhasználó létezik

**Lépések:**
1. Próbáld meg az egyetlen Admin szerepkörét „Megtekintő"-re változtatni

**Elvárt eredmény:**
- Hibaüzenet: „Legalább 1 aktív Admin felhasználónak mindig léteznie kell."
- A módosítás megakadályozott

---

### TS-203 | Felhasználó inaktiválása és reaktiválása
**Kapcsolódó US:** US-162  
**Prioritás:** Magas  
**Szerepkör:** Admin  
**Előfeltétel:** Legalább 1 aktív, nem Admin felhasználó létezik

**Lépések:**
1. Kattints az „Inaktiválás" gombra egy Munkatársnál
2. Jelentkezz be az inaktivált felhasználóval
3. Reaktiváld a felhasználót

**Elvárt eredmény:**
- Inaktivált felhasználó bejelentkezési kísérlete hibaüzenetet ad
- Reaktiválás után a felhasználó újra beléphet
- Mindkét esemény naplózódik az audit naplóban

---

### TS-204 | Admin saját fiókjának inaktiválása – tiltva
**Kapcsolódó US:** US-162 (AC3)  
**Prioritás:** Magas  
**Szerepkör:** Admin  
**Előfeltétel:** Admin be van jelentkezve

**Lépések:**
1. Admin a saját felhasználói sorában próbálja az „Inaktiválás" gombot

**Elvárt eredmény:**
- Az „Inaktiválás" gomb nem aktív, vagy hibaüzenet jelenik meg
- A saját fiók inaktiválása megakadályozott

---

### TS-205 | Rendszerbeállítások módosítása
**Kapcsolódó US:** US-163  
**Prioritás:** Közepes  
**Szerepkör:** Admin  
**Előfeltétel:** Admin be van jelentkezve

**Lépések:**
1. Navigálj az Admin menü → Rendszerbeállítások oldalra
2. Módosítsd az értesítési előfigyelmeztetés napját: `14`-re
3. Módosítsd a szervezet nevét
4. Mentsd el

**Elvárt eredmény:**
- A beállítások azonnal érvénybe lépnek
- Érvénytelen értékre (pl. negatív szám) validációs hiba jelenik meg
- A szervezet neve megjelenik a UI-ban

---

## 22. RBAC JOGOSULTSÁGI MÁTRIX TESZTEK

---

### TS-210 | Megtekintő nem lát szerkesztési funkciókat
**Prioritás:** Kritikus  
**Szerepkör:** Megtekintő  
**Előfeltétel:** Megtekintő be van jelentkezve

**Lépések:**
1. Navigálj egy pályázat részletező oldalára
2. Ellenőrizd az elérhető gombokat

**Elvárt eredmény:**
- Nincs „Szerkesztés", „Törlés", „Archiválás" gomb
- Nincs „Dokumentum hozzáadása", „Megjegyzés írása" funkció
- Minden adat olvasható, de nem módosítható

---

### TS-211 | Pénzügyes nem hozhat létre pályázati anyagot
**Prioritás:** Magas  
**Szerepkör:** Pénzügyes  
**Előfeltétel:** Pénzügyes be van jelentkezve

**Lépések:**
1. Pénzügyesként navigálj a pályázatok listanézetére
2. Ellenőrizd az „Új pályázat" gomb elérhetőségét

**Elvárt eredmény:**
- „Új pályázat" gomb nem látható vagy nem elérhető Pénzügyesnél
- A pályázati adatok olvashatók, de tartalmi szerkesztés nem lehetséges

---

### TS-212 | Munkatárs nem látja az Admin menüt
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Munkatárs be van jelentkezve

**Lépések:**
1. Ellenőrizd a navigációs sávot

**Elvárt eredmény:**
- Nincs Admin menü (Felhasználók, Rendszerbeállítások, teljes Audit napló)
- A Kódszótárak oldal olvasható, de nem szerkeszthető

---

### TS-213 | Elnök jóváhagyhatja az elszámolást, de nem rögzíthet számlát
**Prioritás:** Magas  
**Szerepkör:** Elnök  
**Előfeltétel:** Elnök be van jelentkezve; számlák és elszámolás léteznek

**Lépések:**
1. Elnökként navigálj a [7. Számlák] lépéshez
2. Próbálj új számlát hozzáadni
3. Navigálj a [9. Elszámolás] lépéshez
4. Kattints a „Jóváhagyás" gombra

**Elvárt eredmény:**
- „Új számla" gomb nem látható/elérhető Elnöknél
- A jóváhagyás gomb elérhető és működik

---

## 23. TELJES MUNKAFOLYAMAT (END-TO-END)

---

### TS-300 | Teljes nyertes pályázat életciklusa
**Prioritás:** Kritikus  
**Szerepkör:** Munkatárs + Elnök + Pénzügyes  
**Előfeltétel:** Rendszer alapállapotban

**Lépések:**
1. [Munkatárs] Hozz létre új pályázatot (`DRAFT`)
2. [Munkatárs] Rögzítsd a beadás adatait → `SUBMITTED`
3. [Elnök] Hagyja jóvá a beadást
4. [Munkatárs] Rögzítsd a „Nyert" eredményt + elnyert összeg → `WON`
5. [Munkatárs] Kihagyja a [4. Értesítő] lépést
6. [Munkatárs] Hozzon létre legalább 1 tételt a [5. Költési tervben]
7. [Elnök] Hagyja jóvá a költési tervet
8. [Munkatárs] Hozzon létre alvállalkozói szerződést
9. [Pénzügyes] Rögzítsen számlát (fizetve)
10. [Munkatárs] Rögzítsen igazolást fotóval
11. [Pénzügyes] Rögzítse az elszámolást
12. [Elnök] Hagyja jóvá az elszámolást → `CLOSED_WON`

**Elvárt eredmény:**
- Minden lépés a megfelelő állapotba kerül
- A pályázat állapota végül `CLOSED_WON`
- Minden lépés `LOCKED`
- Az audit napló tartalmazza az összes eseményt
- Értesítések a megfelelő időpontokban kiküldve

---

### TS-301 | Nem nyert pályázat lezárása
**Prioritás:** Magas  
**Szerepkör:** Munkatárs + Admin  
**Előfeltétel:** Pályázat `SUBMITTED` állapotban

**Lépések:**
1. [Munkatárs] Rögzítsd a „Nem nyert" eredményt → `LOST`
2. Ellenőrizd a [4]–[9] lépések megjelenését
3. [Admin] Zárja le manuálisan → `CLOSED_LOST`

**Elvárt eredmény:**
- [4]–[9] lépések szürkítve, „Nem alkalmazható" felirattal
- `CLOSED_LOST` állapot után minden lépés `LOCKED`
- Az archivált adatok megőrződnek

---

## 24. NEGATÍV ÉS HATÁR-ESETEK

---

### TS-400 | Üres pályázatlista – informatív üzenet
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** Nincsenek pályázatok a szűrő feltételeknek megfelelően

**Lépések:**
1. Alkalmazz egy nagyon szűkítő szűrőt, amelyre nincs találat

**Elvárt eredmény:**
- Informatív üzenet jelenik meg: pl. „Nincs a szűrési feltételeknek megfelelő pályázat."
- Üres lista nem jelenik meg feliratozás nélkül

---

### TS-401 | Lezárt pályázat szerkesztési kísérlete – Munkatárs
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  
**Előfeltétel:** Pályázat `CLOSED_WON` állapotban

**Lépések:**
1. Munkatársként navigálj a lezárt pályázat bármely lépéséhez

**Elvárt eredmény:**
- Szerkesztési opciók nem elérhetők
- A lépések csak olvasható módban jelennek meg
- Admin számára elérhetők maradnak a módosítási lehetőségek

---

### TS-402 | Nagy mennyiségű adat – lista teljesítmény
**Prioritás:** Közepes  
**Szerepkör:** Bármely  
**Előfeltétel:** Legalább 100 pályázat létezik

**Lépések:**
1. Navigálj a pályázatok listanézetére
2. Mérjük az oldal betöltési idejét

**Elvárt eredmény:**
- A lista < 2 másodperc alatt betölt
- Lapozás (pagination) vagy infinite scroll működik

---

### TS-403 | Bejelentkezés nélkül dokumentum URL közvetlen elérése
**Prioritás:** Kritikus  
**Szerepkör:** Anonim  
**Előfeltétel:** Egy dokumentum URL-je ismert

**Lépések:**
1. Kijelentkezz
2. Próbáld közvetlenül megnyitni a dokumentum letöltési URL-jét

**Elvárt eredmény:**
- 401 vagy 403 HTTP válasz
- A fájl nem töltődik le
- Átirányítás a login oldalra

---

### TS-404 | Egyidejű szerkesztés – race condition
**Prioritás:** Közepes  
**Szerepkör:** Két Munkatárs  
**Előfeltétel:** Két felhasználó ugyanazon pályázatot szerkeszti egyszerre

**Lépések:**
1. Munkatárs A megnyitja a szerkesztési formot
2. Munkatárs B is megnyitja ugyanazt
3. Mindkettő megpróbál menteni

**Elvárt eredmény:**
- A rendszer kezeli az ütközést (optimistic locking vagy figyelmeztetés)
- Nem vész el adat, az utolsó mentés érvényes

---

## 25. BÖNGÉSZŐKOMPATIBILITÁS ÉS RESZPONZIVITÁS

---

### TS-500 | Chrome és Firefox alapfunkcionalitás
**Prioritás:** Magas  
**Szerepkör:** Munkatárs  

**Elvárt eredmény:**
- Az összes alapfunkció (bejelentkezés, pályázat létrehozás, dokumentum feltöltés) működik Chrome és Firefox legutóbbi 2 verziójában

---

### TS-501 | Tablet megjelenítés (768px)
**Prioritás:** Közepes  
**Szerepkör:** Bármely  

**Lépések:**
1. Állítsd a böngésző szélességét 768px-re
2. Navigálj a főbb oldalakra

**Elvárt eredmény:**
- A tartalom olvasható és használható
- A navigáció és listák megfelelően jelennek meg

---

## Teszt Futtatási Prioritás

| Prioritás | Forgatókönyvek | Megjegyzés |
|---|---|---|
| **Kritikus** | TS-001, TS-003, TS-004, TS-006, TS-020, TS-021, TS-030, TS-040, TS-041, TS-042, TS-080, TS-081, TS-091, TS-100, TS-102, TS-110, TS-111, TS-112, TS-201, TS-202, TS-210, TS-300, TS-403 | MVP előtt kötelező |
| **Magas** | TS-002, TS-005, TS-007, TS-022, TS-023, TS-031, TS-032, TS-050, TS-051, TS-061, TS-070, TS-071, TS-082, TS-090, TS-140, TS-142, TS-150, TS-160, TS-170, TS-180, TS-181, TS-183, TS-200, TS-203, TS-204, TS-211, TS-212, TS-213, TS-301, TS-401 | Sprint lezárás előtt |
| **Közepes** | Összes többi | Release validation |

---

## Playwright Konfiguráció Ajánlás

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // RBAC tesztek sorban fussanak
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'tablet',   use: { viewport: { width: 768, height: 1024 } } },
  ],
});
```

### Javasolt fixture struktúra

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts        // szerepkörönkénti auth helper
│   ├── application.fixture.ts // pályázat előkészítés
│   └── seed-data.ts           // teszt adatbázis seeder
├── tests/
│   ├── auth/
│   ├── applications/
│   ├── workflow/
│   ├── documents/
│   ├── invoices/
│   ├── notifications/
│   ├── admin/
│   └── rbac/
└── helpers/
    ├── navigation.ts
    └── assertions.ts
```

---

*— Dokumentum vége —*

**Forgatókönyvek száma:** 76  
**Verzió:** 1.0  
**Utolsó módosítás:** 2026-06-04  
