# GrantManagement – Docker telepítési útmutató

Raspberry Pi 4/5 (ARM64) és x86-64 Linux szerverekre egyaránt.

---

## Előfeltételek

```bash
# Docker Engine (nem Desktop) telepítése
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose v2 ellenőrzése (beépített a modern Docker-be)
docker compose version
```

Minimális hardver: Raspberry Pi 4, 2 GB RAM, 8 GB szabad hely.

---

## 1. Repo klónozás

```bash
git clone <repo-url> grant-management
cd grant-management
```

---

## 2. Környezeti változók beállítása

```bash
cp .env.example .env
nano .env          # vagy: vim .env
```

**Kötelezően módosítandó értékek:**

| Változó | Leírás |
|---|---|
| `DB_PASSWORD` | PostgreSQL jelszó (erős, véletlenszerű) |
| `JWT_SECRET` | Min. 32 karakter, véletlenszerű (pl. `openssl rand -base64 40`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `SMTP_USER` / `SMTP_PASSWORD` | Gmail: App Password szükséges |
| `ALLOWED_ORIGIN` | A szerver elérési URL-je, pl. `http://192.168.1.100:8080` |

**JWT_SECRET generálás:**
```bash
openssl rand -base64 40
```

**Google OAuth beállítás:**  
A Google Cloud Console-ban (`console.cloud.google.com`) az Authorized redirect URIs-hoz hozzá kell adni:
```
http://<szerver-ip>:<FRONTEND_PORT>/auth/callback
```

---

## 3. Build és indítás

```bash
# Teljes build (első alkalommal ~5–15 perc Raspberry Pi-n)
docker compose build

# Háttérben futtatás
docker compose up -d

# Logok követése
docker compose logs -f

# Csak egy szolgáltatás logjai
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

---

## 4. EF Core adatbázis migráció

> **Fontos:** Az alkalmazás Production módban NEM futtatja automatikusan a migrációkat.  
> Az első indítás után manuálisan kell futtatni.

```bash
# Ellenőrzés: fut-e a backend konténer
docker compose ps

# Migráció futtatása a backend konténerben
docker compose exec backend dotnet ef database update \
    --project /app \
    --connection "Host=postgres;Port=5432;Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASSWORD}"
```

> **Alternatíva – dotnet ef a host gépen:**
> Ha a host gépen van .NET SDK és dotnet-ef telepítve:
> ```bash
> cd backend/src/GrantManagement.Infrastructure
> dotnet ef database update \
>     --startup-project ../GrantManagement.API \
>     -- "Host=<szerver-ip>;Port=5432;Database=GrantManagement;Username=grantapp;Password=<DB_PASSWORD>"
> ```

---

## 5. Elérés

Az alkalmazás elérhető:  
```
http://<szerver-ip>:<FRONTEND_PORT>
```

Alapértelmezett port: **8080** (módosítható a `.env`-ben: `FRONTEND_PORT=8080`)

Swagger UI (csak ha `ASPNETCORE_ENVIRONMENT=Development`):
```
http://<szerver-ip>:<FRONTEND_PORT>/swagger
```

Hangfire Dashboard:
```
http://<szerver-ip>:<FRONTEND_PORT>/hangfire
```

---

## 6. Hasznos parancsok

```bash
# Konténerek állapota
docker compose ps

# Leállítás (adatok megmaradnak)
docker compose down

# Leállítás + összes adat törlése (!)
docker compose down -v

# Újraépítés és újraindítás (kód változás után)
docker compose build backend
docker compose up -d backend

# PostgreSQL közvetlen elérés
docker compose exec postgres psql -U grantapp -d GrantManagement

# Backend konténerbe belépés
docker compose exec backend bash

# Feltöltött fájlok helye (volume)
docker volume inspect grant-management_uploads
```

---

## 7. Frissítés

```bash
git pull
docker compose build
docker compose up -d

# Migráció futtatása, ha az adatbázisséma változott
docker compose exec backend dotnet ef database update ...
```

---

## 8. Hibakeresés

### Backend nem indul el
```bash
docker compose logs backend
```
Leggyakoribb okok:
- Hibás connection string (DB_PASSWORD typo)
- PostgreSQL még nem indult el (depends_on healthcheck alapú, de időbe telik)
- Hiányzó migráció

### "connection refused" a frontend API hívásoknál
- Az `ALLOWED_ORIGIN` értéke egyezzen a tényleges elérési URL-lel
- `docker compose ps` – fut-e a backend?

### ARM64 build hiba
```bash
# Ha buildx nincs beállítva
docker buildx create --use
docker compose build
```

---

## 9. Architektúra összefoglaló

```
Böngésző
    │
    ▼
[frontend:80] ← host:8080
  Nginx
    ├── /          → Angular SPA (static)
    ├── /api/      → proxy → backend:8080
    └── /hubs/     → proxy → backend:8080 (WebSocket)
                                │
                           [backend:8080]
                           .NET 8 API
                                │
                           [postgres:5432]
                           PostgreSQL 16
```

Konténerek kommunikációja a `grantnet` Docker bridge hálózaton keresztül történik.  
A PostgreSQL és a backend NEM érhető el közvetlenül a host hálózatáról.

---

## 10. Biztonság (éles üzem előtt)

- [ ] `.env` fájl jogosultságai: `chmod 600 .env`
- [ ] Hangfire dashboard hozzáférés korlátozása (jelenleg nyilvános)
- [ ] Erős, véletlenszerű `DB_PASSWORD` és `JWT_SECRET`
- [ ] Google OAuth redirect URI pontosan beállítva
- [ ] Reverse proxy (Nginx/Caddy) HTTPS terminálás, ha publikus szerveren fut
- [ ] Rendszeres backup: `docker compose exec postgres pg_dump ...`
