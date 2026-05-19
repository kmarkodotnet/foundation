# Architektúra Terv – Pályázatkezelő Rendszer

**Kapcsolódó dokumentum:** `functional-specification.md` v1.0  
**Verzió:** 1.0  
**Státusz:** Tervezet  

---

## Tartalomjegyzék

1. [Dokumentum célja és hatóköre](#1-dokumentum-célja-és-hatóköre)
2. [Architektúrális elvek és döntések](#2-architektúrális-elvek-és-döntések)
3. [Rendszer áttekintés – magas szintű architektúra](#3-rendszer-áttekintés--magas-szintű-architektúra)
4. [Frontend architektúra (Angular)](#4-frontend-architektúra-angular)
5. [Backend architektúra (.NET 8)](#5-backend-architektúra-net-8)
6. [Domain modell és adatbázis-séma](#6-domain-modell-és-adatbázis-séma)
7. [API design](#7-api-design)
8. [Hitelesítés és jogosultságkezelés](#8-hitelesítés-és-jogosultságkezelés)
9. [Fájltárolási architektúra](#9-fájltárolási-architektúra)
10. [Értesítési rendszer architektúrája](#10-értesítési-rendszer-architektúrája)
11. [Audit naplózás architektúrája](#11-audit-naplózás-architektúrája)
12. [Munkafolyamat-motor architektúrája](#12-munkafolyamat-motor-architektúrája)
13. [Infrastruktúra és deployment](#13-infrastruktúra-és-deployment)
14. [Biztonság architektúrális szinten](#14-biztonság-architektúrális-szinten)
15. [Teljesítmény és skálázhatóság](#15-teljesítmény-és-skálázhatóság)
16. [Külső integrációk](#16-külső-integrációk)
17. [Tesztelési stratégia](#17-tesztelési-stratégia)
18. [Fejlesztési és üzemeltetési konvenciók](#18-fejlesztési-és-üzemeltetési-konvenciók)
19. [Architektúrális kockázatok és döntési napló](#19-architektúrális-kockázatok-és-döntési-napló)

---

## 1. Dokumentum célja és hatóköre

Ez a dokumentum az alapítvány pályázatkezelő rendszerének szoftverarchitektúráját írja le. Célja, hogy a fejlesztőcsapat és az architekt számára egyértelmű és implementálható iránymutatást adjon a rendszer felépítéséről, a technológiai döntések indokairól és a komponensek kapcsolatáról.

A dokumentum a `functional-specification.md` v1.0 alapján készült, és azzal együtt értelmezendő.

**Hatókör:**
- Frontend (Angular SPA) architektúrája
- Backend (.NET 8 Web API) rétegei és felelősségei
- Adatbázis-séma (PostgreSQL, EF Core)
- Hitelesítés és RBAC megvalósítás
- Fájltárolás és dokumentumkezelés
- Értesítési rendszer
- Audit napló
- Munkafolyamat-motor
- Infrastruktúra és deployment (Docker-alapú)

---

## 2. Architektúrális elvek és döntések

### 2.1 Vezérlő elvek

| Elv | Leírás |
|---|---|
| **Egyszerűség első** | A rendszer small-to-medium méretű (max. 100 user), ezért kerülni kell az over-engineering-et. A Clean Architecture elvei alkalmazandók, de mikro-service-ek helyett monolit marad. |
| **Domain-centrikus design** | A üzleti logika a domain/application rétegben él, nem a controllerekben vagy az adatbázis-sémában. |
| **Explicit munkafolyamat** | A pályázati állapotgép explicit, kódban definiált – nem dinamikusan konfigurált workflow-motor, hanem jól tesztelhető state machine. |
| **Security by default** | HTTPS mindenhol, RBAC minden API-végponton, fájlok sosem direktben elérhetők. |
| **Auditálhatóság** | Minden adatmódosítás naplózva, az entitásokon soft delete, a napló nem törölhető. |
| **Bővíthetőség** | A domain modell és a réteghatárok úgy kialakítottak, hogy a 35. fejezetben felsorolt bővítések (multi-tenant, riportok, Gmail API) later hozzáadhatók legyenek. |

### 2.2 Architektúra stílus

**Backend:** Monolit Clean Architecture (nem mikro-service), egyetlen deployable unit.  
**Frontend:** SPA (Single Page Application) Angular moduláris felépítéssel.  
**Kommunikáció:** RESTful HTTP JSON API.  
**Valós idejű értesítések:** SignalR WebSocket hub (polling fallback).

### 2.3 Technológia stack összefoglalója

| Réteg | Technológia | Verzió |
|---|---|---|
| Frontend | Angular | 17+ |
| UI komponens könyvtár | Angular Material | 17+ |
| Backend framework | ASP.NET Core Web API | .NET 8 |
| ORM | Entity Framework Core | 8.x |
| Adatbázis | PostgreSQL | 16+ |
| Valós idejű kommunikáció | SignalR (ASP.NET Core) | .NET 8 |
| Hitelesítés | Google OAuth 2.0 / OpenID Connect | – |
| JWT kezelés | Microsoft.AspNetCore.Authentication.JwtBearer | – |
| Háttérfeladatok | Hangfire | 1.8+ |
| E-mail küldés | MailKit / FluentEmail | – |
| API dokumentáció | Swashbuckle (Swagger/OpenAPI 3.0) | – |
| Excel export | ClosedXML | – |
| Konténerizáció | Docker + Docker Compose | – |
| Reverse proxy | Nginx | – |

---

## 3. Rendszer áttekintés – magas szintű architektúra

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FELHASZNÁLÓ (böngésző)                        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          NGINX (Reverse Proxy)                          │
│   - TLS termináció                                                      │
│   - /api/* → Backend (ASP.NET Core)                                     │
│   - /* → Angular SPA (statikus fájlok)                                  │
└───────────┬──────────────────────────────────────────┬──────────────────┘
            │                                          │
            ▼                                          ▼
┌───────────────────────┐                 ┌────────────────────────────┐
│   ANGULAR SPA         │                 │   ASP.NET CORE WEB API     │
│   (statikus fájlok)   │◄── WebSocket ──►│   (.NET 8)                 │
│                       │   (SignalR)      │                            │
│  - Feature modulok    │                 │  - Controllers (REST API)   │
│  - Auth (OIDC)        │── REST/HTTPS ──►│  - Application Services     │
│  - State kezelés      │                 │  - Domain Services          │
│  - Routing, Guards    │                 │  - Infrastructure réteg     │
└───────────────────────┘                 └────────────┬───────────────┘
                                                       │
                    ┌──────────────────────────────────┼──────────────────┐
                    │                                  │                  │
                    ▼                                  ▼                  ▼
         ┌──────────────────┐              ┌───────────────────┐  ┌──────────────┐
         │   POSTGRESQL     │              │   LOKÁLIS         │  │  HANGFIRE    │
         │   Adatbázis      │              │   FÁJLRENDSZER    │  │  (háttér-    │
         │                  │              │   /uploads/...    │  │   feladatok) │
         │  - Pályázat adat │              │                   │  │              │
         │  - Audit napló   │              │  - Dokumentumok   │  │  - E-mail    │
         │  - Felhasználók  │              │  - Fotók, stb.    │  │    küldés    │
         │  - Hangfire jobs │              │                   │  │  - Határidő  │
         └──────────────────┘              └───────────────────┘  │    figyelés  │
                                                                   └──────────────┘
                                                                          │
                                                                          ▼
                                                               ┌──────────────────┐
                                                               │  SMTP SZERVER    │
                                                               │  (Google SMTP /  │
                                                               │   SendGrid)      │
                                                               └──────────────────┘

        ┌────────────────────────────────────────────────────────────────────┐
        │                      KÜLSŐ SZOLGÁLTATÁSOK                          │
        │                                                                    │
        │   Google OAuth 2.0 / OpenID Connect  (hitelesítés)                │
        └────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend architektúra (Angular)

### 4.1 Alkalmazás struktúra

```
src/
├── app/
│   ├── core/                        # Singleton szolgáltatások, interceptorok
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── role.guard.ts
│   │   │   └── oidc-callback.component.ts
│   │   ├── http/
│   │   │   ├── auth.interceptor.ts  # JWT Bearer token csatolása
│   │   │   └── error.interceptor.ts # Globális hibakezelés
│   │   ├── notifications/
│   │   │   └── notification.service.ts  # SignalR kapcsolat
│   │   └── core.module.ts
│   │
│   ├── shared/                      # Újrafelhasználható komponensek
│   │   ├── components/
│   │   │   ├── file-upload/
│   │   │   ├── comment-thread/
│   │   │   ├── email-attachment/
│   │   │   ├── status-badge/
│   │   │   ├── confirm-dialog/
│   │   │   └── audit-log-viewer/
│   │   ├── pipes/
│   │   │   ├── currency-hu.pipe.ts
│   │   │   └── date-hu.pipe.ts
│   │   ├── directives/
│   │   │   └── has-role.directive.ts
│   │   └── shared.module.ts
│   │
│   ├── features/                    # Lazy-loaded feature modulok
│   │   ├── applications/            # Pályázatok (főmodul)
│   │   │   ├── list/
│   │   │   ├── detail/
│   │   │   │   ├── workflow/        # Munkafolyamat lépések
│   │   │   │   │   ├── step-call/       # [1] Felhívás
│   │   │   │   │   ├── step-submission/ # [2] Beadás
│   │   │   │   │   ├── step-result/     # [3] Eredmény
│   │   │   │   │   ├── step-contract/   # [4] Szerz./Pályáztató
│   │   │   │   │   ├── step-budget/     # [5] Költési terv
│   │   │   │   │   ├── step-vendor-contracts/ # [6] Alvállalk.
│   │   │   │   │   ├── step-invoices/   # [7] Számlák
│   │   │   │   │   ├── step-proof/      # [8] Igazolás
│   │   │   │   │   └── step-settlement/ # [9] Elszámolás
│   │   │   │   └── application-detail.component.ts
│   │   │   └── applications.module.ts
│   │   │
│   │   ├── granters/                # Pályáztatók
│   │   ├── vendors/                 # Szerződő cégek
│   │   ├── codelists/               # Kódszótárak
│   │   ├── admin/                   # Adminisztráció (felhasználók, beállítások)
│   │   ├── audit/                   # Audit napló
│   │   └── profile/                 # Felhasználói profil
│   │
│   ├── layout/
│   │   ├── navbar/
│   │   ├── sidebar/
│   │   └── notification-bell/
│   │
│   └── app-routing.module.ts
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── assets/
```

### 4.2 State management stratégia

A rendszer kis mérete (max. 100 felhasználó, ~50 párhuzamos session) miatt **NgRx nem szükséges**. A state kezelés az alábbi elveken alapul:

| Réteg | Megközelítés |
|---|---|
| Szerver-oldali adat | Angular HTTP Client + RxJS, **service-level caching** (`BehaviorSubject` + `shareReplay(1)`) |
| UI állapot (szűrők, lapozás) | URL query paraméterek (könyvjelzőzhetőség) |
| Globális auth state | `AuthService` (singleton, `BehaviorSubject<User \| null>`) |
| Értesítések | `NotificationService` (SignalR eseményekre feliratkozva, `BehaviorSubject<Notification[]>`) |
| Kódszótárak | Alkalmazás induláskor betöltve, memóriában cache-elve (ritkán változnak) |

### 4.3 Routing és lazy loading

```typescript
// app-routing.module.ts (vázlat)
const routes: Routes = [
  { path: '', redirectTo: 'applications', pathMatch: 'full' },
  {
    path: 'applications',
    loadChildren: () => import('./features/applications/applications.module'),
    canActivate: [AuthGuard]
  },
  {
    path: 'granters',
    loadChildren: () => import('./features/granters/granters.module'),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module'),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin'] }
  },
  { path: 'auth/callback', component: OidcCallbackComponent },
  { path: '**', redirectTo: 'applications' }
];
```

### 4.4 Jogosultságkezelés a frontenden

A frontend jogosultság-kezelés **kizárólag UX célokat** szolgál (gombok el/megjelenítése). A valódi védelmet a backend biztosítja.

```typescript
// has-role.directive.ts
@Directive({ selector: '[hasRole]' })
export class HasRoleDirective {
  @Input() set hasRole(roles: string[]) {
    this.viewContainer.clear();
    if (this.authService.hasAnyRole(roles)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}

// Használat a sablonban:
// <button *hasRole="['Admin', 'PalyazatiMunkatars']">Szerkesztés</button>
```

### 4.5 HTTP interceptorok

**AuthInterceptor:** Minden kimenő kéréshez csatolja a JWT Bearer tokent. Ha 401-et kap vissza, refresh token kísérlet, majd redirect bejelentkezésre.

**ErrorInterceptor:** Globális hibakezelés – 403 esetén "Nincs jogosultság" toast, 500 esetén "Szerverhiba" toast, egyéb hibák logolása.

---

## 5. Backend architektúra (.NET 8)

### 5.1 Clean Architecture rétegek

```
src/
├── GrantManagement.Domain/          # Üzleti entitások, szabályok, interfészek
│   ├── Entities/
│   │   ├── Application.cs           # Pályázat
│   │   ├── WorkflowStep.cs          # Munkafolyamat lépés
│   │   ├── Granter.cs               # Pályáztató
│   │   ├── Vendor.cs                # Szerződő cég
│   │   ├── Document.cs              # Dokumentum
│   │   ├── EmailAttachment.cs
│   │   ├── Comment.cs
│   │   ├── Invoice.cs               # Számla
│   │   ├── VendorContract.cs        # Alvállalkozói szerz.
│   │   ├── BudgetPlan.cs            # Költési terv
│   │   ├── BudgetItem.cs            # Költési terv tétel
│   │   ├── Settlement.cs            # Elszámolás
│   │   ├── ProofRecord.cs           # Igazolás
│   │   ├── CodeList.cs              # Kódszótár
│   │   ├── CodeListItem.cs
│   │   ├── AppUser.cs               # Felhasználó
│   │   └── AuditLog.cs
│   ├── Enums/
│   │   ├── ApplicationStatus.cs
│   │   ├── WorkflowStepStatus.cs
│   │   ├── WorkflowStepType.cs
│   │   ├── UserRole.cs
│   │   └── DocumentType.cs
│   ├── ValueObjects/
│   │   └── Money.cs                 # Pénzösszeg value object (összeg + deviza)
│   ├── Interfaces/
│   │   ├── Repositories/
│   │   │   ├── IApplicationRepository.cs
│   │   │   └── ... (többi repo)
│   │   └── Services/
│   │       ├── IFileStorageService.cs
│   │       └── IEmailService.cs
│   └── Exceptions/
│       ├── DomainException.cs
│       ├── NotFoundException.cs
│       └── ForbiddenException.cs
│
├── GrantManagement.Application/     # Use case-ek, DTO-k, validációk
│   ├── Applications/
│   │   ├── Commands/
│   │   │   ├── CreateApplication/
│   │   │   │   ├── CreateApplicationCommand.cs
│   │   │   │   ├── CreateApplicationCommandHandler.cs
│   │   │   │   └── CreateApplicationCommandValidator.cs
│   │   │   ├── UpdateWorkflowStep/
│   │   │   ├── AdvanceWorkflow/
│   │   │   ├── SkipWorkflowStep/
│   │   │   └── CloseApplication/
│   │   ├── Queries/
│   │   │   ├── GetApplicationList/
│   │   │   ├── GetApplicationDetail/
│   │   │   └── SearchApplications/
│   │   └── DTOs/
│   ├── Invoices/
│   ├── Documents/
│   ├── Notifications/
│   ├── AuditLogs/
│   ├── Common/
│   │   ├── Behaviours/
│   │   │   ├── ValidationBehaviour.cs    # FluentValidation pipeline
│   │   │   ├── AuthorizationBehaviour.cs # RBAC pipeline
│   │   │   └── AuditBehaviour.cs         # Audit napló pipeline
│   │   └── Mappings/
│   │       └── MappingProfile.cs         # AutoMapper profilok
│   └── Application.csproj
│
├── GrantManagement.Infrastructure/  # EF Core, fájlkezelés, e-mail, ext. services
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   ├── Configurations/          # IEntityTypeConfiguration<T>
│   │   │   ├── ApplicationConfiguration.cs
│   │   │   └── ...
│   │   ├── Migrations/
│   │   └── Repositories/
│   ├── FileStorage/
│   │   └── LocalFileStorageService.cs
│   ├── Email/
│   │   └── SmtpEmailService.cs
│   ├── Notifications/
│   │   └── SignalRNotificationService.cs
│   ├── BackgroundJobs/
│   │   └── DeadlineCheckJob.cs
│   └── Infrastructure.csproj
│
└── GrantManagement.API/             # Controllers, Middleware, DI konfiguráció
    ├── Controllers/
    │   ├── ApplicationsController.cs
    │   ├── WorkflowController.cs
    │   ├── DocumentsController.cs
    │   ├── InvoicesController.cs
    │   ├── GrantersController.cs
    │   ├── VendorsController.cs
    │   ├── CodeListsController.cs
    │   ├── UsersController.cs
    │   ├── NotificationsController.cs
    │   ├── AuditLogsController.cs
    │   └── AuthController.cs
    ├── Hubs/
    │   └── NotificationHub.cs       # SignalR hub
    ├── Middleware/
    │   ├── ExceptionMiddleware.cs
    │   └── RequestLoggingMiddleware.cs
    ├── Filters/
    │   └── ApiExceptionFilter.cs
    ├── Program.cs
    └── appsettings.json
```

### 5.2 MediatR pipeline (CQRS-lite)

A backend **MediatR** könyvtárat használ, CQRS-lite elvekkel: a Controller soha nem tartalmaz üzleti logikát, minden kérés egy Command vagy Query handler-en keresztül fut.

```
HTTP Kérés
    ↓
Controller (csak dispatch)
    ↓
MediatR Pipeline Behaviours:
  1. ValidationBehaviour  → FluentValidation szabályok futtatása
  2. AuthorizationBehaviour → RBAC ellenőrzés (policy alapján)
  3. AuditBehaviour       → Write műveletek automatikus naplózása
    ↓
Command / Query Handler  → Domain logika, repository hívások
    ↓
Repository (EF Core)
    ↓
PostgreSQL
```

### 5.3 Controller konvenciók

```csharp
// Példa Controller struktúra
[ApiController]
[Route("api/[controller]")]
[Authorize]  // Minden végpont autentikált
public class ApplicationsController : ControllerBase
{
    private readonly ISender _mediator;

    [HttpGet]
    [RequireRole(UserRole.Any)]           // Custom attribute → RBAC
    public async Task<ActionResult<PagedResult<ApplicationListDto>>> GetAll(
        [FromQuery] ApplicationFilterQuery query) { ... }

    [HttpPost]
    [RequireRole(UserRole.Admin, UserRole.PalyazatiMunkatars)]
    public async Task<ActionResult<ApplicationDto>> Create(
        CreateApplicationCommand command) { ... }

    [HttpPut("{id}")]
    [RequireRole(UserRole.Admin, UserRole.Elnok, UserRole.PalyazatiMunkatars)]
    public async Task<ActionResult<ApplicationDto>> Update(
        Guid id, UpdateApplicationCommand command) { ... }
}
```

---

## 6. Domain modell és adatbázis-séma

### 6.1 Fő entitások és kapcsolataik

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  CORE DOMAIN                                    │
│                                                                                 │
│  ┌─────────────┐    ┌───────────────────────────────────────────────────────┐  │
│  │   Granter   │    │                    Application                        │  │
│  │  (Pályázt.) │◄───│  id, title, identifier, description, status,          │  │
│  │             │    │  submissionDeadline, spendingDeadline,                 │  │
│  │  name       │    │  awardedAmount, granterId, createdBy, isArchived       │  │
│  │  email      │    └────────────────────┬──────────────────────────────────┘  │
│  │  phone      │                         │ 1:N                                 │
│  └─────────────┘              ┌──────────▼───────────┐                        │
│                                │    WorkflowStep      │                        │
│  ┌─────────────┐               │                      │                        │
│  │   Vendor    │               │  id, applicationId   │                        │
│  │  (Szerz.cég)│               │  stepType (enum)     │                        │
│  │             │               │  status (enum)       │                        │
│  │  name       │               │  completedAt         │                        │
│  │  taxNumber  │               │  skippedReason       │                        │
│  │  address    │               │  order               │                        │
│  └──────┬──────┘               └──────────┬───────────┘                        │
│         │                                 │                                    │
│         │          ┌──────────────────────┼──────────────────────────────┐    │
│         │          │                      │                              │    │
│         │    ┌─────▼────────┐   ┌─────────▼────────┐   ┌───────────────▼──┐  │
│         │    │   Document   │   │    Comment        │   │  EmailAttachment  │  │
│         │    │              │   │                   │   │                   │  │
│         │    │  id          │   │  id               │   │  id               │  │
│         │    │  stepId      │   │  stepId           │   │  stepId           │  │
│         │    │  documentType│   │  text             │   │  subject          │  │
│         │    │  fileName    │   │  createdBy        │   │  fromEmail        │  │
│         │    │  storagePath │   │  createdAt        │   │  sentAt           │  │
│         │    │  version     │   │  updatedAt        │   │  direction        │  │
│         │    │  isArchived  │   │  isDeleted        │   │  filePath         │  │
│         │    └──────────────┘   └───────────────────┘   └───────────────────┘  │
│         │                                                                       │
│         │    PÉNZÜGYI ENTITÁSOK (mind applicationId-hoz kötve)                 │
│         │                                                                       │
│         │    ┌────────────────┐   ┌───────────────────┐   ┌────────────────┐  │
│         └───►│  VendorContract│   │   BudgetPlan      │   │    Invoice     │  │
│              │                │   │                   │   │                │  │
│              │  vendorId      │   │  applicationId    │   │  applicationId │  │
│              │  contractDate  │   │  approvedAt       │   │  vendorId(opt) │  │
│              │  amount        │   │  ──────────────   │   │  contractId    │  │
│              │  identifier    │   │  BudgetItem       │   │  invoiceNumber │  │
│              │  budgetItemId  │   │    name, type     │   │  amount        │  │
│              └────────────────┘   │    amount, order  │   │  isPaid        │  │
│                                   └───────────────────┘   │  paidAt        │  │
│                                                            └────────────────┘  │
│                                                                                 │
│    ┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐ │
│    │   ProofRecord    │   │     Settlement        │   │       AuditLog       │ │
│    │                  │   │                       │   │                      │ │
│    │   applicationId  │   │   applicationId       │   │   entityType         │ │
│    │   proofType      │   │   settlementDate      │   │   entityId           │ │
│    │   eventDate      │   │   approvedAt          │   │   action             │ │
│    │   photos[]       │   │   approvedBy          │   │   userId             │ │
│    └──────────────────┘   └──────────────────────┘   │   oldValue/newValue  │ │
│                                                        │   createdAt          │ │
│    ┌──────────────────┐   ┌──────────────────────┐    └──────────────────────┘ │
│    │    AppUser       │   │      CodeList         │                            │
│    │                  │   │  ────────────────     │                            │
│    │  googleId        │   │      CodeListItem     │                            │
│    │  email, name     │   │                       │                            │
│    │  role (enum)     │   │  code, name, order    │                            │
│    │  isActive        │   │  status, isSystem     │                            │
│    └──────────────────┘   └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Kulcsentitások részletes sémája

#### Application (Pályázat)

```sql
CREATE TABLE "Applications" (
    "Id"                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "Title"               VARCHAR(500) NOT NULL,
    "Identifier"          VARCHAR(100),
    "Description"         TEXT,
    "Status"              VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    "GranterId"           UUID         NOT NULL REFERENCES "Granters"("Id"),
    "ApplicationTypeId"   UUID         REFERENCES "CodeListItems"("Id"),
    "MinAmount"           DECIMAL(18,2),
    "MaxAmount"           DECIMAL(18,2),
    "SubmissionDeadline"  TIMESTAMPTZ  NOT NULL,
    "SpendingDeadline"    DATE,
    "OtherMetadata"       TEXT,
    "AwardedAmount"       DECIMAL(18,2),
    "ResultDate"          DATE,
    "ResultIdentifier"    VARCHAR(100),
    "IsArchived"          BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedByUserId"     UUID         NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

#### WorkflowStep (Munkafolyamat lépés)

```sql
CREATE TABLE "WorkflowSteps" (
    "Id"              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"   UUID        NOT NULL REFERENCES "Applications"("Id"),
    "StepType"        VARCHAR(50) NOT NULL,   -- CALL, SUBMISSION, RESULT, stb.
    "Status"          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "Order"           INT         NOT NULL,
    "IsSkippable"     BOOLEAN     NOT NULL DEFAULT FALSE,
    "SkippedReason"   TEXT,
    "CompletedAt"     TIMESTAMPTZ,
    "CompletedByUserId" UUID      REFERENCES "AppUsers"("Id"),
    "ApprovedAt"      TIMESTAMPTZ,
    "ApprovedByUserId" UUID       REFERENCES "AppUsers"("Id"),
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_workflow_step ON "WorkflowSteps"("ApplicationId", "StepType");
```

#### AuditLog (Audit napló)

```sql
CREATE TABLE "AuditLogs" (
    "Id"           BIGSERIAL    PRIMARY KEY,
    "EntityType"   VARCHAR(100) NOT NULL,
    "EntityId"     UUID         NOT NULL,
    "Action"       VARCHAR(20)  NOT NULL,  -- CREATE, UPDATE, DELETE, STATUS_CHANGE
    "FieldName"    VARCHAR(100),
    "OldValue"     TEXT,
    "NewValue"     TEXT,
    "UserId"       UUID         NOT NULL REFERENCES "AppUsers"("Id"),
    "IpAddress"    VARCHAR(45),
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_entity ON "AuditLogs"("EntityType", "EntityId");
CREATE INDEX idx_audit_user   ON "AuditLogs"("UserId");
CREATE INDEX idx_audit_time   ON "AuditLogs"("CreatedAt");
```

### 6.3 Soft delete stratégia

Minden fő entitáson (Application, Document, Comment, EmailAttachment, AuditLog):
- `IsArchived` / `IsDeleted` boolean mező
- EF Core **Global Query Filter**: `modelBuilder.Entity<T>().HasQueryFilter(e => !e.IsArchived)`
- Az audit napló soha nem kapja meg ezt a filtert

### 6.4 Optimista konkurencia kezelés

Az Application és a WorkflowStep entitásokon EF Core **rowversion / concurrency token** kerül alkalmazásra a párhuzamos szerkesztések konfliktusának kezelésére:

```csharp
public class Application : BaseEntity
{
    [Timestamp]
    public byte[] RowVersion { get; set; }
    // ...
}
```

---

## 7. API design

### 7.1 URL struktúra

```
Alap URL: /api/v1/

Pályázatok:
  GET    /api/v1/applications                    – Lista, szűréssel
  POST   /api/v1/applications                    – Új pályázat
  GET    /api/v1/applications/{id}               – Részletek
  PUT    /api/v1/applications/{id}               – Módosítás
  DELETE /api/v1/applications/{id}               – Archiválás (soft delete)

Munkafolyamat:
  GET    /api/v1/applications/{id}/workflow      – Összes lépés állapota
  PUT    /api/v1/applications/{id}/workflow/{stepType}   – Lépés adatainak frissítése
  POST   /api/v1/applications/{id}/workflow/{stepType}/complete  – Lépés lezárása
  POST   /api/v1/applications/{id}/workflow/{stepType}/skip      – Lépés kihagyása
  POST   /api/v1/applications/{id}/workflow/{stepType}/approve   – Jóváhagyás

Pénzügyi:
  GET    /api/v1/applications/{id}/invoices      – Számla lista
  POST   /api/v1/applications/{id}/invoices      – Új számla
  PUT    /api/v1/applications/{id}/invoices/{invoiceId}
  DELETE /api/v1/applications/{id}/invoices/{invoiceId}

  GET    /api/v1/applications/{id}/vendor-contracts
  POST   /api/v1/applications/{id}/vendor-contracts
  ...

  GET    /api/v1/applications/{id}/budget-plan
  PUT    /api/v1/applications/{id}/budget-plan
  POST   /api/v1/applications/{id}/budget-plan/items
  ...

Dokumentumok:
  GET    /api/v1/applications/{id}/documents
  POST   /api/v1/applications/{id}/documents     – Fájl feltöltés (multipart/form-data)
  GET    /api/v1/applications/{id}/documents/{docId}/download
  DELETE /api/v1/applications/{id}/documents/{docId}

Megjegyzések:
  GET    /api/v1/applications/{id}/steps/{stepType}/comments
  POST   /api/v1/applications/{id}/steps/{stepType}/comments
  PUT    /api/v1/applications/{id}/steps/{stepType}/comments/{commentId}
  DELETE /api/v1/applications/{id}/steps/{stepType}/comments/{commentId}

E-mail csatolások:
  GET    /api/v1/applications/{id}/steps/{stepType}/emails
  POST   /api/v1/applications/{id}/steps/{stepType}/emails
  DELETE /api/v1/applications/{id}/steps/{stepType}/emails/{emailId}

Pályáztatók:
  GET    /api/v1/granters
  POST   /api/v1/granters
  GET    /api/v1/granters/{id}
  PUT    /api/v1/granters/{id}
  DELETE /api/v1/granters/{id}

Szerződő cégek:
  GET    /api/v1/vendors
  POST   /api/v1/vendors
  GET    /api/v1/vendors/{id}
  PUT    /api/v1/vendors/{id}
  DELETE /api/v1/vendors/{id}

Kódszótárak:
  GET    /api/v1/codelists
  POST   /api/v1/codelists
  GET    /api/v1/codelists/{id}/items
  POST   /api/v1/codelists/{id}/items
  PUT    /api/v1/codelists/{id}/items/{itemId}
  DELETE /api/v1/codelists/{id}/items/{itemId}
  PUT    /api/v1/codelists/{id}/items/reorder    – Sorba rendezés

Felhasználók (Admin):
  GET    /api/v1/users
  PUT    /api/v1/users/{id}/role
  PUT    /api/v1/users/{id}/activate
  PUT    /api/v1/users/{id}/deactivate

Értesítések:
  GET    /api/v1/notifications
  PUT    /api/v1/notifications/{id}/read
  PUT    /api/v1/notifications/read-all

Audit napló:
  GET    /api/v1/audit-logs
  GET    /api/v1/audit-logs/applications/{id}

Auth:
  GET    /api/v1/auth/me
  POST   /api/v1/auth/logout

Keresés:
  GET    /api/v1/search?q={term}

Export:
  GET    /api/v1/applications/export?{filters}  → .xlsx letöltés
```

### 7.2 Standard válasz formátumok

```json
// Sikeres lista válasz (pagination-nal)
{
  "items": [...],
  "totalCount": 42,
  "page": 1,
  "pageSize": 20
}

// Sikeres egyes entitás válasz
{
  "id": "uuid",
  "title": "...",
  ...
}

// Hiba válasz (RFC 7807 Problem Details)
{
  "type": "https://palyazat.alapitvany.hu/errors/validation",
  "title": "Validációs hiba",
  "status": 422,
  "errors": {
    "title": ["A pályázat neve nem lehet üres."],
    "submissionDeadline": ["A beadási határidő kötelező."]
  },
  "traceId": "00-abc123..."
}
```

### 7.3 Szűrési, lapozási konvenciók

```
GET /api/v1/applications
  ?page=1
  &pageSize=20
  &sortBy=submissionDeadline
  &sortDir=asc
  &status=IN_PROGRESS,WON
  &granterId=uuid
  &search=oktatás
  &deadlineFrom=2025-01-01
  &deadlineTo=2025-12-31
```

---

## 8. Hitelesítés és jogosultságkezelés

### 8.1 Google OAuth 2.0 / OIDC flow

```
Felhasználó böngészője           Angular SPA                 Backend API           Google
       │                              │                           │                    │
       │── Bejelentkezés gomb ───────►│                           │                    │
       │                              │── Redirect ──────────────────────────────────►│
       │◄── Google login oldal ───────────────────────────────────────────────────────│
       │── Google credentials ────────────────────────────────────────────────────────►│
       │                              │◄─ Authorization Code ─────────────────────────│
       │                              │── /api/v1/auth/callback (code) ──────────────►│
       │                              │                           │── Token Exchange ──►│
       │                              │                           │◄─ id_token + access│
       │                              │                           │   token             │
       │                              │                           │── Felhasználó       │
       │                              │                           │   keresés/létrehozás│
       │                              │◄── JWT (saját token) ─────│                    │
       │                              │   + Refresh (HttpOnly)    │                    │
       │◄── Redirect /applications ───│                           │                    │
```

### 8.2 JWT token tartalom

```json
{
  "sub": "google-user-id",
  "email": "user@gmail.com",
  "name": "Teszt Elek",
  "role": "PalyazatiMunkatars",
  "userId": "internal-uuid",
  "iat": 1710000000,
  "exp": 1710028800,
  "iss": "palyazat.alapitvany.hu"
}
```

### 8.3 RBAC megvalósítás a backenden

```csharp
// UserRole enum
public enum UserRole
{
    Admin,
    Elnok,
    PalyazatiMunkatars,
    Penzugyes,
    Megtekinto
}

// Permission policy-k
public static class Policies
{
    public const string CanCreateApplication   = "CanCreateApplication";
    public const string CanApproveApplication  = "CanApproveApplication";
    public const string CanManageInvoices      = "CanManageInvoices";
    public const string CanManageUsers         = "CanManageUsers";
    public const string CanViewAuditLog        = "CanViewAuditLog";
    // ...
}

// Program.cs – policy regisztráció
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.CanCreateApplication, policy =>
        policy.RequireRole(
            nameof(UserRole.Admin),
            nameof(UserRole.PalyazatiMunkatars)));

    options.AddPolicy(Policies.CanApproveApplication, policy =>
        policy.RequireRole(
            nameof(UserRole.Admin),
            nameof(UserRole.Elnok)));

    options.AddPolicy(Policies.CanManageInvoices, policy =>
        policy.RequireRole(
            nameof(UserRole.Admin),
            nameof(UserRole.Penzugyes)));
    // ...
});
```

### 8.4 Lezárt pályázat guard

Az `AuthorizationBehaviour` MediatR pipeline-ban ellenőrzi, hogy LOCKED állapotú pályázaton csak Admin hajthat végre módosítást:

```csharp
// AuthorizationBehaviour.cs
if (request is IApplicationCommand cmd)
{
    var application = await _repo.GetByIdAsync(cmd.ApplicationId);
    if (application.IsLocked() && !currentUser.IsAdmin())
        throw new ForbiddenException("Lezárt pályázat nem módosítható.");
}
```

---

## 9. Fájltárolási architektúra

### 9.1 Könyvtárstruktúra

```
/data/uploads/
├── {year}/
│   └── {application-id}/
│       └── {step-type}/
│           └── {uuid}_{original-filename}
│
/data/uploads/
├── 2025/
│   ├── 3f2a1b.../
│   │   ├── CALL/
│   │   │   └── a1b2c3_palyazati_kiiras.pdf
│   │   ├── SUBMISSION/
│   │   │   └── d4e5f6_benyujtott_palyazat.docx
│   │   └── INVOICES/
│   │       ├── g7h8i9_szamla_001.pdf
│   │       └── j0k1l2_banki_kivonat.pdf
```

### 9.2 File upload flow

```
Frontend                   API Controller             LocalFileStorageService
    │                           │                              │
    │── POST /documents ────────►│                              │
    │   (multipart/form-data)    │── MIME type ellenőrzés       │
    │                           │── Méret ellenőrzés            │
    │                           │── Vírus scan (jövőbeni)       │
    │                           │── SaveFileAsync() ───────────►│
    │                           │                   ── UUID generálás
    │                           │                   ── Könyvtár létrehozás
    │                           │                   ── Fájl írás
    │                           │◄── storagePath ───────────────│
    │                           │── Document entitás mentés     │
    │                           │── Audit napló                 │
    │◄── 201 Created ───────────│                              │
```

### 9.3 File download – biztonságos stream

A fájlok sosem érhetők el közvetlen HTTP URL-en. Kizárólag az API-n keresztül, JWT tokenes hitelesítés után:

```csharp
[HttpGet("{docId}/download")]
[Authorize]
public async Task<IActionResult> Download(Guid appId, Guid docId)
{
    var document = await _mediator.Send(new GetDocumentQuery(appId, docId));
    // RBAC ellenőrzés a handler-ben
    var stream = await _fileStorage.ReadFileAsync(document.StoragePath);
    return File(stream, document.ContentType, document.OriginalFileName);
}
```

### 9.4 Fájl verziókezelés

```
Document táblában:
  - ParentDocumentId (nullable) → az eredeti dokumentum ID-ja
  - Version (int, default: 1)
  - IsLatestVersion (bool, default: true)

Új verzió feltöltésekor:
  1. Régi rekord: IsLatestVersion = false
  2. Új rekord: ParentDocumentId = régi Id, Version = régi Version + 1, IsLatestVersion = true
  3. Mindkét fájl megőrzésre kerül a fájlrendszeren
```

---

## 10. Értesítési rendszer architektúrája

### 10.1 Komponensek

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ÉRTESÍTÉSI RENDSZER                            │
│                                                                     │
│  ┌─────────────────┐     ┌──────────────────┐    ┌───────────────┐ │
│  │  Domain Events  │────►│ NotificationService│   │  Hangfire     │ │
│  │                 │     │                  │    │  Background   │ │
│  │ ApplicationWon  │     │  CreateNotif()   │    │  Jobs         │ │
│  │ SettlementReady │     │  SendEmail()     │    │               │ │
│  │ DeadlineAlert   │     └────────┬─────────┘    │ DeadlineCheck │ │
│  └─────────────────┘              │               │  (naponta)    │ │
│                                   │               └───────┬───────┘ │
│                          ┌────────▼─────────┐            │         │
│                          │  Notifications   │◄───────────┘         │
│                          │  DB tábla        │                       │
│                          └────────┬─────────┘                       │
│                                   │                                 │
│                    ┌──────────────▼──────────────┐                  │
│                    │                             │                  │
│             ┌──────▼──────┐             ┌────────▼──────┐          │
│             │  SignalR    │             │  SMTP Email   │          │
│             │  Hub        │             │  Service      │          │
│             │  (valós idő)│             │  (aszinkron)  │          │
│             └──────┬──────┘             └───────────────┘          │
│                    │                                                │
│             ┌──────▼──────────────────────────────────┐            │
│             │  Angular: NotificationService            │            │
│             │  SignalR connection → BehaviorSubject    │            │
│             │  harang ikon badge frissítés             │            │
│             └──────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Hangfire – határidő-figyelő job

```csharp
// DeadlineCheckJob.cs (naponta fut, pl. 07:00-kor)
public class DeadlineCheckJob
{
    public async Task ExecuteAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        // Beadási határidő közeleg (7 nap)
        var approaching = await _repo.GetApplicationsWithDeadlineInDays(7);
        foreach (var app in approaching)
            await _notificationService.SendDeadlineAlertAsync(app, AlertType.SubmissionApproaching);

        // Beadási határidő elmulasztva (1 nap)
        var missed = await _repo.GetApplicationsWithMissedDeadlineDaysAgo(1);
        foreach (var app in missed)
            await _notificationService.SendDeadlineAlertAsync(app, AlertType.SubmissionMissed);

        // Elköltési határidő közeleg (14 nap)
        var spendingApproaching = await _repo.GetApplicationsWithSpendingDeadlineInDays(14);
        foreach (var app in spendingApproaching)
            await _notificationService.SendDeadlineAlertAsync(app, AlertType.SpendingApproaching);
    }
}
```

### 10.3 SignalR hub

```csharp
// NotificationHub.cs
[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // Felhasználót a saját csoportjához rendeljük
        var userId = Context.User.GetUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        await base.OnConnectedAsync();
    }
}

// Értesítés küldése egy felhasználónak
await _hubContext.Clients
    .Group($"user-{userId}")
    .SendAsync("ReceiveNotification", notificationDto);
```

---

## 11. Audit naplózás architektúrája

### 11.1 Automatikus naplózás MediatR pipeline-ban

```csharp
// AuditBehaviour.cs
public class AuditBehaviour<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : ICommand  // Csak write műveleteknél
{
    public async Task<TResponse> Handle(TRequest request, ...)
    {
        var response = await next();  // Először hajtjuk végre a műveletet

        // Utána naplózunk (az EF Change Tracker segítségével)
        var changes = _dbContext.ChangeTracker.Entries()
            .Where(e => e.State is Added or Modified or Deleted)
            .SelectMany(entry => entry.GetAuditEntries(_currentUser))
            .ToList();

        await _dbContext.AuditLogs.AddRangeAsync(changes);
        await _dbContext.SaveChangesAsync();

        return response;
    }
}
```

### 11.2 EF Core Change Tracker integráció

Az EF Core `SaveChanges()` felülírásával minden entitás-módosítás automatikusan naplózódik:

```csharp
// AppDbContext.cs
public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
{
    var auditEntries = OnBeforeSaveChanges();
    var result = await base.SaveChangesAsync(ct);
    await OnAfterSaveChanges(auditEntries, ct);
    return result;
}

private List<AuditEntry> OnBeforeSaveChanges()
{
    ChangeTracker.DetectChanges();
    var auditEntries = new List<AuditEntry>();

    foreach (var entry in ChangeTracker.Entries())
    {
        if (entry.Entity is AuditLog || entry.State == EntityState.Detached)
            continue;

        var auditEntry = new AuditEntry(entry, _currentUserService.UserId);
        foreach (var prop in entry.Properties)
        {
            auditEntry.OldValues[prop.Metadata.Name] = prop.OriginalValue;
            auditEntry.NewValues[prop.Metadata.Name] = prop.CurrentValue;
        }
        auditEntries.Add(auditEntry);
    }
    return auditEntries;
}
```

---

## 12. Munkafolyamat-motor architektúrája

### 12.1 State machine megközelítés

Az FS-ben definiált 9 lépéses, részben kihagyható munkafolyamat egy explicit, kódban definiált állapotgép. **Nem kerül alkalmazásra külső workflow-motor** (pl. Elsa, Temporal) – a folyamat kellőképpen egyszerű és stabil ahhoz, hogy belső kóddal kezeljük.

### 12.2 WorkflowService

```csharp
public class WorkflowService
{
    // Pályázat létrehozásakor generálja a lépéseket
    public List<WorkflowStep> CreateWorkflowSteps(Guid applicationId)
    {
        return new List<WorkflowStep>
        {
            new(applicationId, StepType.Call,            order: 1, isSkippable: false),
            new(applicationId, StepType.Submission,      order: 2, isSkippable: false),
            new(applicationId, StepType.Result,          order: 3, isSkippable: false),
            new(applicationId, StepType.ContractGranter, order: 4, isSkippable: true),
            new(applicationId, StepType.BudgetPlan,      order: 5, isSkippable: false),
            new(applicationId, StepType.VendorContracts, order: 6, isSkippable: true),
            new(applicationId, StepType.Invoices,        order: 7, isSkippable: false),
            new(applicationId, StepType.Proof,           order: 8, isSkippable: true),
            new(applicationId, StepType.Settlement,      order: 9, isSkippable: false),
        };
        // Megjegyzés: a [4]-[9] lépések PENDING állapotban maradnak,
        // amíg az eredmény "Nyert" nem lesz.
    }

    // Állapotátmenetek érvényességének ellenőrzése
    public bool CanTransition(WorkflowStep step, StepAction action,
                              Application application, AppUser user)
    {
        return (step.Status, action) switch
        {
            (StepStatus.Active,    StepAction.Complete) => HasRequiredData(step, application),
            (StepStatus.Active,    StepAction.Skip)     => step.IsSkippable,
            (StepStatus.Completed, StepAction.Approve)  => step.RequiresApproval && user.CanApprove(),
            (StepStatus.Skipped,   StepAction.Reactivate) => user.IsAdmin() || user.IsElnok(),
            _ => false
        };
    }

    // Negatív eredmény: lépések [4]-[9] inaktiválása
    public void HandleNegativeResult(Application application)
    {
        var stepsToDeactivate = application.WorkflowSteps
            .Where(s => s.Order >= 4)
            .ToList();

        foreach (var step in stepsToDeactivate)
            step.Status = StepStatus.NotApplicable;

        application.Status = ApplicationStatus.Lost;
    }
}
```

### 12.3 Állapotátmeneti diagram (kód szintű)

```
Pályázat állapotok (ApplicationStatus):
  DRAFT
    └──► IN_PROGRESS  (beadás megkezdése)
           └──► SUBMITTED  (beadás időpontja rögzítve)
                  ├──► WON   (eredmény = Nyert)
                  │      └──► IN_PROGRESS (szerz., költési terv, stb.)
                  │                └──► CLOSED_WON  (elszámolás jóváhagyva)
                  └──► LOST  (eredmény = Nem nyert)
                         └──► CLOSED_LOST (manuális lezárás)

  Bármely állapot ──► ARCHIVED  (Admin)

WorkflowStep állapotok (StepStatus):
  PENDING ──► ACTIVE ──► COMPLETED
                   └──► SKIPPED ──► ACTIVE (visszaállítás)
  PENDING ──► NOT_APPLICABLE  (negatív eredmény esetén)
  COMPLETED / SKIPPED ──► LOCKED  (pályázat lezárásakor)
```

---

## 13. Infrastruktúra és deployment

### 13.1 Docker Compose konfiguráció (fejlesztés + éles)

```yaml
# docker-compose.yml
version: '3.9'

services:

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - frontend_dist:/usr/share/nginx/html:ro
    depends_on:
      - api
      - frontend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    volumes:
      - frontend_dist:/app/dist

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__Default=Host=db;Database=grantmgmt;Username=app;Password=${DB_PASSWORD}
      - Google__ClientId=${GOOGLE_CLIENT_ID}
      - Google__ClientSecret=${GOOGLE_CLIENT_SECRET}
      - Jwt__Key=${JWT_SECRET_KEY}
      - Smtp__Host=${SMTP_HOST}
      - FileStorage__BasePath=/data/uploads
    volumes:
      - uploads:/data/uploads
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=grantmgmt
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  hangfire:
    # Ugyanaz az API image, de csak a Hangfire worker fut
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: ["dotnet", "GrantManagement.API.dll", "--hangfire-worker"]
    environment:
      - HANGFIRE_WORKER=true
      # ... ugyanazok az env változók mint az api service-nél
    depends_on:
      - db
    volumes:
      - uploads:/data/uploads

volumes:
  pgdata:
  uploads:
  frontend_dist:
```

### 13.2 Nginx konfiguráció (vázlat)

```nginx
server {
    listen 443 ssl http2;
    server_name palyazat.alapitvany.hu;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # Angular SPA
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    # Backend API
    location /api/ {
        proxy_pass         http://api:8080;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }

    # SignalR WebSocket
    location /hubs/ {
        proxy_pass         http://api:8080;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }
}

server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

### 13.3 Dockerfile-ok (vázlat)

**Backend Dockerfile:**
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/GrantManagement.API/GrantManagement.API.csproj", "GrantManagement.API/"]
# ... többi projekt
RUN dotnet restore "GrantManagement.API/GrantManagement.API.csproj"
COPY src/ .
RUN dotnet publish "GrantManagement.API/GrantManagement.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "GrantManagement.API.dll"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.25-alpine AS final
COPY --from=build /app/dist/grant-management /usr/share/nginx/html
```

### 13.4 Környezetek

| Környezet | Leírás | URL |
|---|---|---|
| Development | Fejlesztői gép, docker-compose dev | localhost:4200 (ng serve) |
| Staging | Éles előtti tesztkörnyezet, teljes Docker stack | staging.palyazat.alapitvany.hu |
| Production | Éles rendszer | palyazat.alapitvany.hu |

### 13.5 Backup stratégia

- **Adatbázis:** Napi `pg_dump` automatikus futtatása cron job-ból, backup fájlok titkosítva tárolva.
- **Fájlok:** `/data/uploads` könyvtár napi szinkronizálása külső tárolóra (rsync vagy hasonló).
- **Megőrzés:** 30 napos napi backup, 12 hónapos heti backup.

---

## 14. Biztonság architektúrális szinten

### 14.1 Defense in depth rétegek

```
1. réteg: Nginx
   - TLS 1.2+ kényszerítés
   - HTTP → HTTPS redirect
   - Request size limiting (pl. max 60 MB, a 50 MB fájlhoz)
   - Rate limiting (pl. /api/auth/* végpontokra)

2. réteg: ASP.NET Core Middleware
   - CORS policy (csak az engedélyezett origin-ek)
   - HSTS header
   - Content Security Policy header
   - Anti-forgery (CSRF) – SPA esetén: custom request header ellenőrzés

3. réteg: JWT hitelesítés
   - Minden /api/* végpont [Authorize]
   - Token lejárat: 8 óra
   - Refresh token: HttpOnly, Secure cookie

4. réteg: RBAC Authorization
   - Policy-alapú ellenőrzés minden sensitív endpoint-on
   - Lezárt pályázat guard a MediatR pipeline-ban

5. réteg: Input validáció
   - FluentValidation – MediatR pipeline (szerver oldal)
   - Angular reactive forms validátorok (kliens oldal, UX)
   - MIME type ellenőrzés fájlfeltöltésnél
   - Parameterized queries (EF Core – SQL injection elleni védelem)

6. réteg: Fájltárolás
   - Fájlok sosem elérhetők direktben URL-en
   - API közvetítésével, autentikált lekérés
   - UUID alapú fájlnevek (directory traversal elleni védelem)
```

### 14.2 Secrets management

Érzékeny konfigurációs értékek (DB jelszó, JWT kulcs, Google Client Secret) **soha nem kerülnek a kódtárba**. Kezelésük:

- **Fejlesztés:** .NET User Secrets (`dotnet user-secrets`)
- **Staging / Production:** Environment változók (Docker Compose `.env` fájl, vagy orchestrátor secrets)

---

## 15. Teljesítmény és skálázhatóság

### 15.1 Adatbázis indexek

Az FS-ben definiált szűrési és rendezési igények alapján kötelező indexek:

```sql
-- Pályázat lista szűrőkhöz
CREATE INDEX idx_app_status        ON "Applications"("Status");
CREATE INDEX idx_app_granter       ON "Applications"("GranterId");
CREATE INDEX idx_app_deadline      ON "Applications"("SubmissionDeadline");
CREATE INDEX idx_app_created_by    ON "Applications"("CreatedByUserId");

-- Dokumentum kereséshez
CREATE INDEX idx_doc_step          ON "Documents"("WorkflowStepId");
CREATE INDEX idx_doc_type          ON "Documents"("DocumentType");

-- Számla összesítőhöz
CREATE INDEX idx_invoice_app       ON "Invoices"("ApplicationId");
CREATE INDEX idx_invoice_paid      ON "Invoices"("IsPaid");

-- Audit napló szűrőkhöz (már definiálva a 6.2 szekcióban)

-- Értesítések
CREATE INDEX idx_notif_user_unread ON "Notifications"("UserId", "IsRead")
    WHERE "IsRead" = FALSE;
```

### 15.2 Caching stratégia

| Adat | Cache stratégia | TTL |
|---|---|---|
| Kódszótárak (CodeList + Items) | Szerver oldali in-memory cache (IMemoryCache) | 1 óra (cache invalidálás kódszótár módosításkor) |
| Felhasználó szerepköre | JWT tokenben (8 óra TTL) | JWT lejáratig |
| Pályázat lista | Nincs cache – valós idejű szűrés | – |
| Statikus Angular fájlok | Nginx cache, long-lived cache headers | 1 év (hash-elt fájlnevekkel) |

### 15.3 Fájlkiszolgálás optimalizálás

Nagy fájlok (pl. 50 MB PDF) letöltésekor **streaming** alkalmazandó (nem teljes memóriába olvasás):

```csharp
return new FileStreamResult(
    await _fileStorage.ReadFileStreamAsync(document.StoragePath),
    document.ContentType
)
{
    FileDownloadName = document.OriginalFileName,
    EnableRangeProcessing = true  // Range request támogatás (részdletöltés)
};
```

### 15.4 Skálázási lehetőségek

A jelenlegi monolit architektúra az alábbi lépésekkel skálázható, ha szükséges:

1. **Horizontális skálázás:** Több API container + Nginx load balancer (SignalR esetén sticky sessions vagy Redis backplane).
2. **Adatbázis:** PostgreSQL read replika olvasás-intenzív lekérdezésekhez (pl. riportok, exportok).
3. **Fájltárolás:** Lokális fájlrendszer helyett S3-kompatibilis objektumtároló (a `IFileStorageService` interfész ezt lehetővé teszi).

---

## 16. Külső integrációk

### 16.1 Google OAuth 2.0

```
Szükséges Google Cloud Console konfiguráció:
- OAuth 2.0 Client ID létrehozása
- Authorized redirect URIs: https://palyazat.alapitvany.hu/api/v1/auth/callback
- Scopes: openid, email, profile

NuGet: Microsoft.AspNetCore.Authentication.Google
```

### 16.2 SMTP e-mail küldés

```csharp
// appsettings.json
{
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "UseSsl": true,
    "Username": "ertesito@alapitvany.hu",
    "Password": "${SMTP_PASSWORD}",
    "FromAddress": "ertesito@alapitvany.hu",
    "FromName": "Pályázatkezelő Rendszer"
  }
}

// SmtpEmailService.cs – MailKit alapú implementáció
public class SmtpEmailService : IEmailService
{
    public async Task SendAsync(EmailMessage message)
    {
        var email = new MimeMessage();
        // ... felépítés
        using var client = new SmtpClient();
        await client.ConnectAsync(_config.Host, _config.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_config.Username, _config.Password);
        await client.SendAsync(email);
    }
}
```

### 16.3 Swagger / OpenAPI

```csharp
// Program.cs
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Pályázatkezelő API",
        Version = "v1",
        Description = "Alapítvány pályázatkezelő rendszer REST API"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    // XML dokumentáció bekapcsolása
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFile));
});

// Swagger csak nem-Production környezetben:
if (!app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1"));
}
```

---

## 17. Tesztelési stratégia

### 17.1 Tesztelési piramisok rétegei

```
                ┌─────────────────────┐
                │   E2E tesztek       │  ← Playwright (kritikus user flow-k)
                │   (~20 teszt)       │
               ─┴─────────────────────┴─
              ─                         ─
             ─   Integrációs tesztek      ─   ← xUnit + TestContainers (PostgreSQL)
            ─    (~100 teszt)              ─   (API végpontok, DB műveletek)
           ─────────────────────────────────
          ─                                 ─
         ─    Unit tesztek                   ─   ← xUnit + FluentAssertions + Moq
        ─     (~300+ teszt)                   ─   (Domain logika, WorkflowService,
       ──────────────────────────────────────   AuthorizationBehaviour, stb.)
```

### 17.2 Kritikus tesztterületek

| Terület | Teszttípus | Prioritás |
|---|---|---|
| WorkflowService állapotátmenetek | Unit | ✅ Magas |
| RBAC – minden endpoint jogosultsági szabályai | Integrációs | ✅ Magas |
| Audit napló – minden CRUD művelet naplózódik | Integrációs | ✅ Magas |
| Fájlfeltöltés validáció (MIME, méret) | Integrációs | ✅ Magas |
| Beadási határidő értesítés logika | Unit | Közepes |
| Lezárt pályázat nem módosítható | Unit + Integrációs | ✅ Magas |
| Teljes pályázati flow (felhívástól elszámolásig) | E2E | Közepes |
| Google OAuth callback | Integrációs (mock) | ✅ Magas |

### 17.3 Tesztkörnyezet

- **Integrációs tesztekhez:** `TestContainers.PostgreSQL` – minden tesztfutásnál friss, izolált PostgreSQL konténer
- **Backend unit tesztek:** `xUnit`, `Moq`, `FluentAssertions`
- **Frontend unit tesztek:** `Jest` + `Angular Testing Library`
- **E2E tesztek:** `Playwright` (Chromium, Firefox)

---

## 18. Fejlesztési és üzemeltetési konvenciók

### 18.1 Kódkonvenciók

| Terület | Konvenció |
|---|---|
| C# névadás | PascalCase osztályok/property-k, camelCase lokális változók, _prefix private fields |
| Angular névadás | kebab-case fájlnevek, PascalCase osztályok, camelCase metódusok |
| Git branch | `feature/US-XXX-rovid-leiras`, `bugfix/`, `hotfix/` |
| Commit üzenetek | `feat(applications): add workflow step skip functionality` (Conventional Commits) |
| PR méret | Max. 400 sor változtatás / PR; nagyobb refaktorok külön branch-en |

### 18.2 Adatbázis migráció konvenciók

- EF Core Code First migrációk
- Migráció neve: `{YYYYMMDDHHmm}_{leírás}` (pl. `202503141200_AddWorkflowSteps`)
- Staging-en minden deploy előtt migráció alkalmazása (`dotnet ef database update`)
- Breaking migration (oszlop törlés, típusváltás) kétlépéses: először additive migráció, majd cleanup

### 18.3 Environment konfiguráció

```
appsettings.json          → alapértelmezett, nem-titkos beállítások
appsettings.Development.json → fejlesztői overrides
appsettings.Production.json  → prod overrides (pl. Swagger letiltás)
Environment változók        → titkos értékek (DB jelszó, JWT kulcs, stb.)
```

### 18.4 Logging

- **Microsoft.Extensions.Logging** + **Serilog** strukturált naplózás
- Fejlesztés: Console sink (JSON)
- Production: File sink (`/var/log/grantmgmt/app.log`, napi rotatálással)
- Log szintek: Debug (fejlesztés), Information (production alap), Warning/Error mindig
- **Nem kerül naplózásba:** JWT token tartalom, jelszó, személyes adat (GDPR)

---

## 19. Architektúrális kockázatok és döntési napló

### 19.1 Kockázatok

| # | Kockázat | Valószínűség | Hatás | Mitigáció |
|---|---|---|---|---|
| K-01 | SignalR kapcsolat elvesztése (polling fallback) | Közepes | Alacsony | Polling fallback implementálás (30 mp), reconnect logika |
| K-02 | Fájlrendszer megtelik (50 MB-os feltöltések) | Közepes | Magas | Monitoring, disk space alert, bővítési path: S3 |
| K-03 | EF Core N+1 query probléma a komplex pályázat nézetnél | Alacsony | Közepes | Eager loading (`.Include()`), query profiling fejlesztés során |
| K-04 | Hangfire job meghibásodása esetén értesítés elmarad | Alacsony | Közepes | Hangfire retry policy, failed job dashboard, monitoring |
| K-05 | Google OAuth API változás | Alacsony | Magas | Standard OIDC library használata, ne custom implementáció |
| K-06 | Konkurens szerkesztés konfliktus | Alacsony | Közepes | EF Core optimista konkurencia kezelés (RowVersion) |

### 19.2 Architektúrális döntési napló (ADR)

| ADR | Döntés | Indok | Alternatíva |
|---|---|---|---|
| ADR-01 | Monolit Clean Architecture, nem mikro-service | Max. 100 felhasználó, kis csapat, alacsony komplexitás indokolja. Mikro-service over-engineering lenne. | Mikro-service (elutasítva) |
| ADR-02 | MediatR CQRS-lite, nem teljes CQRS | A command/query szétválasztás az olvashatóságot és tesztelhetőséget javítja, külön read/write adatbázis nélkül is. | Hagyományos service réteg (alternatíva) |
| ADR-03 | Saját JWT kiállítás, nem Google token direkt | A Google access token lejárata nem kontrollálható; saját JWT-vel rugalmasan állítható a session. | Google token pass-through (elutasítva) |
| ADR-04 | Lokális fájltárolás, nem S3 | A rendszer önálló, offline-képes maradjon; az interfész lehetővé teszi S3 migrációt later. | S3/MinIO (bővítési lehetőség) |
| ADR-05 | Hangfire háttérjob-kezelő, nem hosted service | Hangfire dashboard, retry, persistence PostgreSQL-ben – mindez built-in. | IHostedService + cron (alternatíva) |
| ADR-06 | EF Core Code First migrációk | A csapat .NET-es, az EF Core séma-verziókövetés kényelmes; a domain modell az egyedüli igazságforrás. | Database First / Flyway (elutasítva) |
| ADR-07 | Explicit state machine kódban, nem workflow-motor | A 9 lépéses, jól definiált folyamat nem igényel dinamikus konfigurálhatóságot; kódban tesztelhetőbb. | Elsa Workflow / Temporal (elutasítva) |

---

*— Dokumentum vége —*

**Verzió:** 1.0  
**Kapcsolódó dokumentumok:** `functional-specification.md` v1.0, `user-stories.md` v1.0  
**Állapot:** Tervezet – jóváhagyásra vár  
