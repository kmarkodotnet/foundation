# Domain Modell – Pályázatkezelő Rendszer

**Kapcsolódó dokumentumok:** `functional-specification.md` v1.0, `architecture-plan.md` v1.0  
**Verzió:** 1.0  
**Státusz:** Tervezet  

---

## Tartalomjegyzék

1. [Domain modellezési elvek](#1-domain-modellezési-elvek)
2. [Bounded Context-ek és domain térkép](#2-bounded-context-ek-és-domain-térkép)
3. [Aggregátok, entitások, value object-ek](#3-aggregátok-entitások-value-object-ek)
4. [Aggregát részletes leírások](#4-aggregát-részletes-leírások)
   - 4.1 Application aggregát (Pályázat)
   - 4.2 Granter aggregát (Pályáztató)
   - 4.3 Vendor aggregát (Szerződő cég)
   - 4.4 CodeList aggregát (Kódszótár)
   - 4.5 AppUser aggregát (Felhasználó)
   - 4.6 Notification aggregát (Értesítés)
   - 4.7 AuditLog (csak olvasható napló)
5. [Value Object-ek részletes leírása](#5-value-object-ek-részletes-leírása)
6. [Domain Events](#6-domain-events)
7. [Domain Services](#7-domain-services)
8. [Repository interfészek](#8-repository-interfészek)
9. [Domain szabályok és invariánsok katalógusa](#9-domain-szabályok-és-invariánsok-katalógusa)
10. [Teljes adatbázis séma (EF Core Code First)](#10-teljes-adatbázis-séma-ef-core-code-first)
11. [Entitás kapcsolati diagram (ERD)](#11-entitás-kapcsolati-diagram-erd)
12. [C# domain osztályok – teljes implementáció](#12-c-domain-osztályok--teljes-implementáció)

---

## 1. Domain modellezési elvek

### 1.1 DDD taktikai minták alkalmazása

Ez a domain modell a **Domain-Driven Design (DDD)** taktikai mintáira épül, de pragmatikus módon: csak azokat a mintákat alkalmazzuk, amelyek valódi értéket adnak ennél a rendszernél. A rendszer mérete (small-medium, single-tenant) nem indokolja a teljes DDD ökoszisztéma bevezetését.

| Alkalmazott DDD minta | Indok |
|---|---|
| **Aggregát + Aggregát gyökér** | A pályázat egy komplex, belső konzisztenciát igénylő objektumgráf. Az `Application` az egyértelmű aggregát gyökér. |
| **Entitás** | Olyan objektumok, amelyeknek identitásuk van és az életciklus során változhatnak. |
| **Value Object** | Olyan objektumok, amelyeket értékük azonosít, nem identitásuk (pl. `Money`, `TaxNumber`, `EmailAddress`). |
| **Domain Event** | Az aggregáton belül bekövetkező üzletileg releváns állapotváltozások jelzésére. |
| **Domain Service** | Olyan üzleti logika, amely több aggregátot érint, vagy nem természetes módon illik egy aggregátba. |
| **Repository** | Az aggregátok tartós tároláson való elérésének absztrakciója. |

**Nem alkalmazott minták (és miért nem):**

| Minta | Elutasítás indoka |
|---|---|
| **Saga / Process Manager** | A munkafolyamat lineáris és jól definiált; nincs szükség elosztott tranzakcióra. |
| **CQRS read model** | A lekérdezési igények nem bonyolultak; az EF Core projection query-k elegendők. |
| **Event Sourcing** | Az audit napló teljesíti a nyomon követési igényt anélkül, hogy az event sourcing komplexitását bevezetnénk. |

### 1.2 Ubiquitous Language (Egységes fogalomkészlet)

A kódnak és a dokumentumoknak ugyanazt a nyelvet kell használniuk. A domain fogalomtár az FS 3. fejezetéből ered, és a C# kódban is ezek az elnevezések szerepelnek (ahol szükséges, az angol megfelelők):

| Magyar fogalom | C# entitás/enum neve | Megjegyzés |
|---|---|---|
| Pályázat | `Application` | Fő aggregát gyökér |
| Pályázati felhívás | `Application` (lépés adatai) | Az [1] lépés adatai az `Application`-ban tárolódnak |
| Munkafolyamat lépés | `WorkflowStep` | Entitás az `Application` aggregáton belül |
| Pályáztató | `Granter` | Önálló aggregát |
| Szerződő cég | `Vendor` | Önálló aggregát |
| Alvállalkozói szerződés | `VendorContract` | Entitás az `Application` aggregáton belül |
| Költési terv | `BudgetPlan` | Entitás az `Application` aggregáton belül |
| Költési terv tétel | `BudgetItem` | Entitás a `BudgetPlan`-en belül |
| Számla | `Invoice` | Entitás az `Application` aggregáton belül |
| Teljesítés igazolása | `ProofRecord` | Entitás az `Application` aggregáton belül |
| Elszámolás | `Settlement` | Entitás az `Application` aggregáton belül |
| Dokumentum | `Document` | Entitás a `WorkflowStep`-en belül |
| E-mail csatolás | `EmailAttachment` | Entitás a `WorkflowStep`-en belül |
| Megjegyzés | `Comment` | Entitás a `WorkflowStep`-en belül |
| Kódszótár | `CodeList` | Önálló aggregát |
| Felhasználó | `AppUser` | Önálló aggregát |
| Értesítés | `Notification` | Önálló aggregát |
| Audit napló | `AuditLog` | Append-only, nem aggregát |

---

## 2. Bounded Context-ek és domain térkép

### 2.1 Bounded Context-ek azonosítása

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GRANT MANAGEMENT SYSTEM                            │
│                           (Single Bounded Context)                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    CORE DOMAIN                                        │  │
│  │                                                                        │  │
│  │   A rendszer üzleti értékének magja. Ez a legtöbb fejlesztési         │  │
│  │   figyelmet igénylő terület.                                           │  │
│  │                                                                        │  │
│  │   ┌─────────────────────────────────────────────────────────────┐    │  │
│  │   │  APPLICATION MANAGEMENT                                      │    │  │
│  │   │                                                               │    │  │
│  │   │  Application (aggregát gyökér)                               │    │  │
│  │   │  ├── WorkflowStep (x9)                                       │    │  │
│  │   │  │   ├── Document (0..N)                                     │    │  │
│  │   │  │   ├── Comment (0..N)                                      │    │  │
│  │   │  │   └── EmailAttachment (0..N)                              │    │  │
│  │   │  ├── BudgetPlan (0..1)                                       │    │  │
│  │   │  │   └── BudgetItem (1..N)                                   │    │  │
│  │   │  ├── VendorContract (0..N)                                   │    │  │
│  │   │  ├── Invoice (0..N)                                          │    │  │
│  │   │  ├── ProofRecord (0..N)                                      │    │  │
│  │   │  └── Settlement (0..1)                                       │    │  │
│  │   └─────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────┐  ┌────────────────────────────────────────┐   │
│  │   SUPPORTING DOMAIN    │  │         GENERIC SUBDOMAIN              │   │
│  │                        │  │                                        │   │
│  │  Granter (Pályáztató)  │  │  AppUser + RBAC (Felhasználókezelés)  │   │
│  │  Vendor (Szerz. cég)   │  │  CodeList (Kódszótárak)               │   │
│  │                        │  │  Notification (Értesítések)            │   │
│  │  Ezek az entitások     │  │  AuditLog (Naplózás)                  │   │
│  │  támogatják a Core-t,  │  │                                        │   │
│  │  de önálló életciklust │  │  Ezek általános technikai              │   │
│  │  is élnek.             │  │  képességek, nem üzleti mag.           │   │
│  └────────────────────────┘  └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Miért egyetlen Bounded Context?

A rendszer **single-tenant**, egyetlen szervezet számára készül, és a domain fogalmak konzisztensen átjárnak a különböző aldomainek között (pl. `Granter` az `Application`-ban is és a `Vendor` az `Invoice`-ban is megjelenik). Több BC bevezetése ebben a méretben ún. **distributed monolith** anti-patternhez vezetne, ami csak komplikálná a kódbázist valódi előny nélkül.

---

## 3. Aggregátok, entitások, value object-ek

### 3.1 Aggregát összefoglaló táblázat

| Aggregát gyökér | Belső entitások | Belső value object-ek | Életciklus |
|---|---|---|---|
| `Application` | `WorkflowStep`, `Document`, `Comment`, `EmailAttachment`, `BudgetPlan`, `BudgetItem`, `VendorContract`, `Invoice`, `ProofRecord`, `Settlement` | `Money`, `ApplicationResult`, `WorkflowStepData` | Felhívástól elszámolásig |
| `Granter` | – | `ContactInfo` | Független, újra felhasználható |
| `Vendor` | – | `ContactInfo`, `TaxNumber` | Független, újra felhasználható |
| `CodeList` | `CodeListItem` | – | Adminisztrátor kezeli |
| `AppUser` | – | `NotificationPreferences` | Google auth-hoz kötött |
| `Notification` | – | – | Per-user, olvasás után archivált |

### 3.2 Aggregáthatárok döntési elvei

**Application – miért egyetlen nagy aggregát?**

A DDD egyik leggyakoribb hibája, hogy minden entitásból külön aggregátot csinálnak. Az `Application` aggregát nagy, de indokolt:

1. **Tranzakciós konzisztencia:** A `WorkflowStep` státusza és az `Application` státusza egyszerre kell változzon. Külön aggregátként ezt elosztott tranzakció vagy saga kellene.
2. **Invariánsok átfogóak:** Pl. "a tervezett összeg nem haladhatja meg az elnyert összeget" – ez `BudgetItem` és `Application.AwardedAmount` között feszül. Egyetlen aggregáton belül triviálisan ellenőrizhető.
3. **Betöltési stratégia:** Az `Application` aggregát **soha nem töltjük be teljes egészében egy lövésre**. EF Core projekció query-k és explicit `.Include()` hívások gondoskodnak arról, hogy csak a szükséges részek kerüljenek memóriába.

**Granter és Vendor – miért önálló aggregát?**

Mert **több `Application`-hoz is kapcsolódhatnak**, saját életciklusuk van (inaktiválható, szerkeszthető a pályázatoktól függetlenül), és az `Application` aggregát nem "tulajdonolja" őket – csak hivatkozik rájuk az ID-jukon keresztül.

> **Aggregát határelv:** Aggregátok közötti hivatkozás mindig **ID alapú**, soha nem objektum referencia. Az `Application` tartalmazza a `GranterId`-t (UUID), nem a `Granter` objektumot.

---

## 4. Aggregát részletes leírások

### 4.1 Application aggregát (Pályázat)

Ez a rendszer **központi, legkomplexebb aggregátja**. Az egész pályázati életciklusnak ez az egyedüli konzisztenciahatára.

#### Aggregát belső struktúra

```
Application  ◄─── AGGREGÁT GYÖKÉR
│
├── status: ApplicationStatus                    ← enum, aggregát szintű állapot
├── granterId: Guid                              ← ID hivatkozás (nem objektum!)
├── applicationTypeId: Guid?                     ← ID hivatkozás CodeListItem-re
│
├── callData: CallStepData                       ← [1] Felhívás adatok (value object)
├── submissionData: SubmissionStepData?          ← [2] Beadás adatok
├── resultData: ResultStepData?                  ← [3] Eredmény adatok
│
├── workflowSteps: IReadOnlyList<WorkflowStep>   ← 9 lépés, mindig mind jelen van
│
├── budgetPlan: BudgetPlan?                      ← [5] Costs. terv (1:1, csak nyert)
│   └── items: IReadOnlyList<BudgetItem>
│
├── granterContract: GranterContract?            ← [4] Pályáztató szerz. (1:1, opt.)
│
├── vendorContracts: IReadOnlyList<VendorContract>  ← [6] Alvállalk. szerz. (1:N)
│
├── invoices: IReadOnlyList<Invoice>             ← [7] Számlák (1:N)
│
├── proofRecords: IReadOnlyList<ProofRecord>     ← [8] Igazolások (1:N)
│
└── settlement: Settlement?                      ← [9] Elszámolás (1:1, opt.)
```

**Megjegyzés:** A `WorkflowStep`-eken belüli `Document`, `Comment`, `EmailAttachment` szintén az aggregát részei, de a lista-lekérdezésekhez (pl. pályázatok listája) **soha nem töltjük be őket** – csak a részletes nézethez.

#### Application állapotgép (invariánsvezérelt)

```
DRAFT
  │
  │  [RecordSubmission()] – beadás időpontja rögzítve
  ▼
IN_PROGRESS ──────────────────────────────────────────────────┐
  │                                                            │
  │  [CompleteSubmissionStep()] – beadás lezárva              │ (visszaállítás, Admin)
  ▼                                                            │
SUBMITTED                                                      │
  │                              │                            │
  │  [RecordWon()]               │  [RecordLost()]            │
  ▼                              ▼                            │
WON                             LOST                          │
  │                              │                            │
  │  (folyamat folytatódik)       │  [ManualClose()]          │
  │                              ▼                            │
  │                        CLOSED_LOST                        │
  │                                                           │
  │  [ApproveSettlement()] – elszámolás jóváhagyva            │
  ▼                                                           │
CLOSED_WON ◄────────────────────────────────────────────────┘
  │
  │  [Archive()] – csak Admin
  ▼
ARCHIVED
```

**Invariánsok (mindig teljesülniük kell):**

| # | Invariáns | Ellenőrzés helye |
|---|---|---|
| INV-01 | `AwardedAmount` csak akkor lehet kitöltve, ha `Status >= WON` | `RecordResult()` metódus |
| INV-02 | `BudgetPlan` csak `WON` státusznál hozható létre | `CreateBudgetPlan()` metódus |
| INV-03 | `BudgetPlan.TotalPlanned` nem haladhatja meg az `AwardedAmount`-ot (soft warn) | `AddBudgetItem()` metódus |
| INV-04 | `Invoice` összegek összege nem haladhatja meg az `AwardedAmount`-ot (soft warn) | `AddInvoice()` metódus |
| INV-05 | `CLOSED_WON` / `CLOSED_LOST` állapotban a lépések `LOCKED`-ra állnak | `ApproveSettlement()` / `ManualClose()` |
| INV-06 | `ARCHIVED` állapotban semmilyen módosítás nem megengedett (csak Admin) | `EnsureNotArchived()` guard |
| INV-07 | Egy `Application`-hoz egy adott `StepType`-ból pontosan 1 `WorkflowStep` létezhet | `WorkflowStep` creation |
| INV-08 | `ProofRecord` csak legalább 1 fotó dokumentummal menthető | `AddProofRecord()` metódus |
| INV-09 | `Settlement` csak akkor hagyható jóvá, ha az elszámolás időpontja kitöltött | `ApproveSettlement()` metódus |
| INV-10 | `VendorContract` nem törölhető, ha hozzá kapcsolódó `Invoice` létezik | `RemoveVendorContract()` metódus |

#### Application – nyilvános metódusok (viselkedés-vezérelt design)

```csharp
// Az Application aggregát CSAK ezen a metódus-interfészen keresztül módosítható.
// Közvetlen property setter-ek privátok vagy protected.

public class Application : AggregateRoot<Guid>
{
    // ── Életciklus ────────────────────────────────────────────────────────
    public static Application Create(CreateApplicationParams p, AppUser createdBy);
    public void UpdateCallData(CallStepData data, AppUser updatedBy);

    // ── Munkafolyamat vezérlés ────────────────────────────────────────────
    public void RecordSubmission(SubmissionStepData data, AppUser by);
    public void ApproveSubmission(AppUser approver);
    public void RecordResult(ApplicationResult result, AppUser by);
    public void SkipStep(WorkflowStepType stepType, string? reason, AppUser by);
    public void ReactivateStep(WorkflowStepType stepType, AppUser by);

    // ── Nyertes folyamat ──────────────────────────────────────────────────
    public void RecordGranterContract(GranterContractData data, AppUser by);
    public BudgetPlan CreateBudgetPlan(AppUser by);
    public void AddBudgetItem(BudgetItemParams p, AppUser by);
    public void UpdateBudgetItem(Guid itemId, BudgetItemParams p, AppUser by);
    public void RemoveBudgetItem(Guid itemId, AppUser by);
    public void ReorderBudgetItems(IList<Guid> orderedIds, AppUser by);
    public void ApproveBudgetPlan(AppUser approver);

    // ── Pénzügyi műveletek ────────────────────────────────────────────────
    public VendorContract AddVendorContract(VendorContractParams p, AppUser by);
    public void UpdateVendorContract(Guid contractId, VendorContractParams p, AppUser by);
    public void RemoveVendorContract(Guid contractId, AppUser by);

    public Invoice AddInvoice(InvoiceParams p, AppUser by);
    public void UpdateInvoice(Guid invoiceId, InvoiceParams p, AppUser by);
    public void MarkInvoicePaid(Guid invoiceId, DateOnly paidAt, AppUser by);
    public void RemoveInvoice(Guid invoiceId, AppUser by);

    // ── Teljesítés igazolása ──────────────────────────────────────────────
    public ProofRecord AddProofRecord(ProofRecordParams p, AppUser by);
    public void RemoveProofRecord(Guid proofId, AppUser by);

    // ── Elszámolás ────────────────────────────────────────────────────────
    public void RecordSettlement(SettlementParams p, AppUser by);
    public void ApproveSettlement(AppUser approver);

    // ── Dokumentumok, megjegyzések, e-mailek ─────────────────────────────
    public Document AttachDocument(WorkflowStepType stepType, DocumentParams p, AppUser by);
    public void ArchiveDocument(Guid documentId, AppUser by);
    public Document UploadNewDocumentVersion(Guid docId, DocumentParams p, AppUser by);

    public Comment AddComment(WorkflowStepType stepType, string text, AppUser by);
    public void EditComment(Guid commentId, string newText, AppUser by);
    public void DeleteComment(Guid commentId, AppUser by);

    public EmailAttachment AttachEmail(WorkflowStepType stepType, EmailAttachmentParams p, AppUser by);
    public void RemoveEmailAttachment(Guid emailId, AppUser by);

    // ── Lezárás ───────────────────────────────────────────────────────────
    public void ManualClose(AppUser by);     // LOST → CLOSED_LOST
    public void Archive(AppUser by);         // Admin only

    // ── Kalkulált tulajdonságok (csak olvasható) ──────────────────────────
    public Money TotalPlannedAmount { get; }
    public Money TotalInvoicedAmount { get; }
    public Money TotalPaidAmount { get; }
    public Money RemainingBudget { get; }
    public decimal InvoiceCoveragePercent { get; }  // az elszámolás 80%-os figyeléséhez
    public bool IsLocked { get; }
    public WorkflowStep? CurrentActiveStep { get; }
}
```

---

### 4.2 Granter aggregát (Pályáztató)

Önálló életciklus, független az `Application`-tól. Referenciák az `Application`-ból ID-n keresztül érkeznek.

```csharp
public class Granter : AggregateRoot<Guid>
{
    public string Name { get; private set; }           // max 300 kar., egyedi
    public string? Description { get; private set; }
    public ContactInfo Contact { get; private set; }   // value object
    public GranterStatus Status { get; private set; }  // Active | Inactive
    public byte[] RowVersion { get; private set; }     // optimista konkurencia

    // Metódusok
    public static Granter Create(string name, string? description, ContactInfo contact);
    public void Update(string name, string? description, ContactInfo contact);
    public void Deactivate();
    public void Reactivate();

    // Invariáns: inaktív pályáztató nem rendelhető új Application-höz
    // (ezt az Application.Create() ellenőrzi a Granter.Status alapján)
}

public enum GranterStatus { Active, Inactive }
```

---

### 4.3 Vendor aggregát (Szerződő cég)

```csharp
public class Vendor : AggregateRoot<Guid>
{
    public string Name { get; private set; }           // max 300 kar., egyedi
    public TaxNumber? TaxNumber { get; private set; }  // value object
    public string? Address { get; private set; }
    public ContactInfo Contact { get; private set; }   // value object
    public VendorStatus Status { get; private set; }

    // Metódusok
    public static Vendor Create(string name, TaxNumber? taxNumber,
                                 string? address, ContactInfo contact);
    public void Update(string name, TaxNumber? taxNumber,
                       string? address, ContactInfo contact);
    public void Deactivate();
    public void Reactivate();
}

public enum VendorStatus { Active, Inactive }
```

---

### 4.4 CodeList aggregát (Kódszótár)

```csharp
public class CodeList : AggregateRoot<Guid>
{
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public bool IsSystem { get; private set; }         // rendszer-szintű, nem törölhető
    private readonly List<CodeListItem> _items = new();
    public IReadOnlyList<CodeListItem> Items => _items.AsReadOnly();

    // Metódusok
    public static CodeList Create(string name, string? description, bool isSystem = false);
    public CodeListItem AddItem(string code, string name, string? description);
    public void UpdateItem(Guid itemId, string name, string? description);
    public void DeactivateItem(Guid itemId);
    public void ActivateItem(Guid itemId);
    public void ReorderItems(IList<Guid> orderedItemIds);

    // Invariáns: IsSystem == true → Delete() dob DomainException-t
    public void Delete();
}

public class CodeListItem : Entity<Guid>
{
    public Guid CodeListId { get; private set; }
    public string Code { get; private set; }           // egyedi a CodeList-en belül
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public int Order { get; private set; }
    public CodeListItemStatus Status { get; private set; }

    // Invariáns: Code egyedi a CodeList-en belül
    // (CodeList.AddItem() ellenőrzi)
}

public enum CodeListItemStatus { Active, Inactive }
```

---

### 4.5 AppUser aggregát (Felhasználó)

A felhasználó egy "thin aggregat" – az üzleti logika nagy részét a RBAC policy-k hordozzák, nem maga az entitás.

```csharp
public class AppUser : AggregateRoot<Guid>
{
    public string GoogleId { get; private set; }       // Google sub claim, egyedi
    public string Email { get; private set; }
    public string Name { get; private set; }
    public string? ProfilePictureUrl { get; private set; }
    public UserRole Role { get; private set; }
    public UserStatus Status { get; private set; }
    public NotificationPreferences NotificationPrefs { get; private set; }  // value object
    public DateTimeOffset? LastLoginAt { get; private set; }

    // Metódusok
    public static AppUser CreateFromGoogle(string googleId, string email, string name,
                                            string? pictureUrl, UserRole defaultRole);
    public void SyncFromGoogle(string name, string? pictureUrl);  // login-kor frissítés
    public void AssignRole(UserRole newRole, AppUser assignedBy);
    public void Deactivate(AppUser deactivatedBy);
    public void Reactivate(AppUser reactivatedBy);
    public void RecordLogin(DateTimeOffset loginAt);
    public void UpdateNotificationPreferences(NotificationPreferences prefs);

    // Segédmetódusok (domain logikához használják)
    public bool IsAdmin() => Role == UserRole.Admin;
    public bool CanApprove() => Role is UserRole.Admin or UserRole.Elnok;
    public bool CanManageInvoices() => Role is UserRole.Admin or UserRole.Penzugyes;
    public bool CanWriteApplications() => Role is UserRole.Admin
                                       or UserRole.PalyazatiMunkatars;

    // Invariáns: az utolsó aktív Admin nem deaktiválható
    // (ezt az Application Service ellenőrzi: "van-e még aktív Admin?")
}

public enum UserRole
{
    Admin = 1,
    Elnok = 2,
    PalyazatiMunkatars = 3,
    Penzugyes = 4,
    Megtekinto = 5
}

public enum UserStatus { Active, Inactive }
```

---

### 4.6 Notification aggregát (Értesítés)

Kis, könnyen kezelhető aggregát. A létrehozása mindig domain event-ből vagy background job-ból indul.

```csharp
public class Notification : AggregateRoot<Guid>
{
    public Guid UserId { get; private set; }               // ID hivatkozás AppUser-re
    public NotificationType Type { get; private set; }
    public string Title { get; private set; }
    public string Body { get; private set; }
    public Guid? RelatedEntityId { get; private set; }     // pl. Application.Id
    public string? RelatedEntityType { get; private set; } // pl. "Application"
    public bool IsRead { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? ReadAt { get; private set; }

    public static Notification Create(Guid userId, NotificationType type,
                                       string title, string body,
                                       Guid? relatedEntityId = null,
                                       string? relatedEntityType = null);
    public void MarkAsRead();
}

public enum NotificationType
{
    SubmissionDeadlineApproaching,
    SubmissionDeadlineMissed,
    SpendingDeadlineApproaching,
    ResultRecorded,
    SettlementAwaitingApproval,
    ApprovalRequired,
    NewComment,
    DocumentUploaded
}
```

---

### 4.7 AuditLog (Append-only napló)

Az `AuditLog` **nem aggregát** – nem módosítható és nem törölhető. Saját "repository"-ja csak `Add` és olvasási műveleteket tartalmaz.

```csharp
public class AuditLog  // Nem örököl AggregateRoot-ból!
{
    public long Id { get; private set; }               // BIGSERIAL, nem UUID
    public string EntityType { get; private set; }
    public Guid EntityId { get; private set; }
    public AuditAction Action { get; private set; }
    public string? FieldName { get; private set; }
    public string? OldValue { get; private set; }
    public string? NewValue { get; private set; }
    public Guid UserId { get; private set; }
    public string? IpAddress { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    // Privát konstruktor – csak a factory metóduson keresztül hozható létre
    private AuditLog() { }

    public static AuditLog Record(string entityType, Guid entityId, AuditAction action,
                                   Guid userId, string? ipAddress,
                                   string? fieldName = null,
                                   string? oldValue = null,
                                   string? newValue = null)
    {
        return new AuditLog
        {
            EntityType = entityType,
            EntityId   = entityId,
            Action     = action,
            UserId     = userId,
            IpAddress  = ipAddress,
            FieldName  = fieldName,
            OldValue   = oldValue,
            NewValue   = newValue,
            CreatedAt  = DateTimeOffset.UtcNow
        };
    }
}

public enum AuditAction { Create, Update, Delete, StatusChange, Approve, Login }
```

---

## 5. Value Object-ek részletes leírása

A value object-ek **immutable**-ok, `==` összehasonlítás értékalapú, és saját validációs logikájuk van.

### 5.1 Money

```csharp
public sealed record Money
{
    public decimal Amount { get; }
    public string Currency { get; } = "HUF";  // Jelen verzióban csak HUF

    public Money(decimal amount, string currency = "HUF")
    {
        if (amount < 0)
            throw new DomainException("A pénzösszeg nem lehet negatív.");
        if (string.IsNullOrWhiteSpace(currency))
            throw new DomainException("A devizanem megadása kötelező.");
        Amount = amount;
        Currency = currency.ToUpperInvariant();
    }

    public static Money Zero => new(0, "HUF");
    public static Money FromHuf(decimal amount) => new(amount, "HUF");

    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Subtract(Money other)
    {
        EnsureSameCurrency(other);
        return new Money(Amount - other.Amount, Currency);
    }

    public bool IsGreaterThan(Money other)
    {
        EnsureSameCurrency(other);
        return Amount > other.Amount;
    }

    public decimal PercentageOf(Money total)
    {
        if (total.Amount == 0) return 0;
        return (Amount / total.Amount) * 100;
    }

    private void EnsureSameCurrency(Money other)
    {
        if (Currency != other.Currency)
            throw new DomainException($"Devizanem eltérés: {Currency} vs {other.Currency}");
    }

    public override string ToString() => $"{Amount:N0} {Currency}";
}
```

### 5.2 TaxNumber (Adószám)

```csharp
public sealed record TaxNumber
{
    // Magyar adószám formátum: 12345678-1-23
    private static readonly Regex _pattern =
        new(@"^\d{8}-\d-\d{2}$", RegexOptions.Compiled);

    public string Value { get; }
    public bool IsValid { get; }

    public TaxNumber(string value)
    {
        Value = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
        IsValid = _pattern.IsMatch(Value);
        // Nem dobunk exception-t érvénytelen formátumra – az FS figyelmeztető (nem blokkoló)
    }

    public override string ToString() => Value;
}
```

### 5.3 EmailAddress

```csharp
public sealed record EmailAddress
{
    public string Value { get; }

    public EmailAddress(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Az e-mail cím nem lehet üres.");
        if (!value.Contains('@') || !value.Contains('.'))
            throw new DomainException($"Érvénytelen e-mail cím formátum: {value}");
        Value = value.Trim().ToLowerInvariant();
    }

    public override string ToString() => Value;
}
```

### 5.4 ContactInfo

```csharp
public sealed record ContactInfo
{
    public string? PhoneNumber { get; }
    public EmailAddress? Email { get; }

    public ContactInfo(string? phoneNumber, EmailAddress? email)
    {
        PhoneNumber = phoneNumber?.Trim();
        Email = email;
    }

    public static ContactInfo Empty => new(null, null);
}
```

### 5.5 ApplicationResult

```csharp
public sealed record ApplicationResult
{
    public ApplicationOutcome Outcome { get; }        // Won | Lost
    public DateOnly ResultDate { get; }
    public string? ResultIdentifier { get; }           // döntési szám
    public Money? AwardedAmount { get; }              // csak Won esetén

    private ApplicationResult() { }

    public static ApplicationResult Won(
        DateOnly resultDate,
        Money awardedAmount,
        string? resultIdentifier = null)
    {
        if (awardedAmount.Amount <= 0)
            throw new DomainException("A nyertes pályázat összege pozitív kell legyen.");

        return new ApplicationResult
        {
            Outcome = ApplicationOutcome.Won,
            ResultDate = resultDate,
            AwardedAmount = awardedAmount,
            ResultIdentifier = resultIdentifier
        };
    }

    public static ApplicationResult Lost(
        DateOnly resultDate,
        string? resultIdentifier = null)
    {
        return new ApplicationResult
        {
            Outcome = ApplicationOutcome.Lost,
            ResultDate = resultDate,
            ResultIdentifier = resultIdentifier
        };
    }
}

public enum ApplicationOutcome { Won, Lost }
```

### 5.6 NotificationPreferences

```csharp
public sealed record NotificationPreferences
{
    public bool EmailOnDeadlineApproaching { get; init; } = true;
    public bool EmailOnDeadlineMissed { get; init; } = true;
    public bool EmailOnResultRecorded { get; init; } = true;
    public bool EmailOnApprovalRequired { get; init; } = true;
    public bool EmailOnNewComment { get; init; } = false;
    public bool EmailOnDocumentUploaded { get; init; } = false;

    public static NotificationPreferences Default => new();
    public static NotificationPreferences AllDisabled => new()
    {
        EmailOnDeadlineApproaching = false,
        EmailOnDeadlineMissed = false,
        EmailOnResultRecorded = false,
        EmailOnApprovalRequired = false,
        EmailOnNewComment = false,
        EmailOnDocumentUploaded = false
    };
}
```

### 5.7 Step-specifikus adatok (step data value object-ek)

Az egyes munkafolyamat-lépések specifikus adatait önálló value object-ek tárolják az `Application` aggregáton belül. Ezek EF Core-ban **owned entity**-ként mappelhetők (inline az `Applications` táblában, külön tábla nélkül).

```csharp
// [1] Felhívás
public sealed record CallStepData
{
    public string? Description { get; init; }
    public Guid? ApplicationTypeId { get; init; }
    public Money? MinAmount { get; init; }
    public Money? MaxAmount { get; init; }
    public DateTimeOffset SubmissionDeadline { get; init; }
    public DateOnly? SpendingDeadline { get; init; }
    public string? OtherMetadata { get; init; }
}

// [2] Beadás
public sealed record SubmissionStepData
{
    public string Description { get; init; }
    public Guid? SubmissionMethodId { get; init; }   // kódszótár
    public DateTimeOffset SubmittedAt { get; init; }
    public Guid SubmittedByUserId { get; init; }
}

// [4] Pályáztató szerződés
public sealed record GranterContractData
{
    public string? ContractIdentifier { get; init; }
    public DateOnly? ContractDate { get; init; }
    public bool NotificationReceived { get; init; }
    public DateOnly? NotificationDate { get; init; }
}

// [9] Elszámolás paraméterek
public sealed record SettlementParams
{
    public DateOnly SettlementDate { get; init; }
    public Guid? SettlementMethodId { get; init; }   // kódszótár
    public string? Summary { get; init; }
}
```

---

## 6. Domain Events

A domain event-ek az aggregát belső állapotváltozásait kommunikálják a többi rendszerrész felé (értesítési rendszer, audit napló). Az aggregát a `RaiseDomainEvent()` metódussal regisztrálja az eseményeket; a tényleges dispatch az `AppDbContext.SaveChanges()` után történik.

### 6.1 Domain Event alaposztály

```csharp
public abstract record DomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```

### 6.2 Application aggregát eseményei

```csharp
// Pályázat létrehozva
public record ApplicationCreated(
    Guid ApplicationId,
    string Title,
    Guid GranterId,
    DateTimeOffset SubmissionDeadline,
    Guid CreatedByUserId
) : DomainEvent;

// Pályázat beadva (lépés lezárva)
public record ApplicationSubmitted(
    Guid ApplicationId,
    DateTimeOffset SubmittedAt,
    Guid SubmittedByUserId
) : DomainEvent;

// Pályázat eredménye nyert
public record ApplicationWon(
    Guid ApplicationId,
    Money AwardedAmount,
    DateOnly ResultDate,
    Guid RecordedByUserId
) : DomainEvent;

// Pályázat eredménye nem nyert
public record ApplicationLost(
    Guid ApplicationId,
    DateOnly ResultDate,
    Guid RecordedByUserId
) : DomainEvent;

// Jóváhagyás szükséges (beadás, költési terv, elszámolás)
public record ApprovalRequired(
    Guid ApplicationId,
    WorkflowStepType StepType,
    Guid RequestedByUserId
) : DomainEvent;

// Elszámolás jóváhagyva → pályázat lezárva
public record SettlementApproved(
    Guid ApplicationId,
    Guid ApprovedByUserId,
    DateTimeOffset ApprovedAt
) : DomainEvent;

// Dokumentum feltöltve
public record DocumentAttached(
    Guid ApplicationId,
    WorkflowStepType StepType,
    Guid DocumentId,
    string FileName,
    Guid UploadedByUserId
) : DomainEvent;

// Megjegyzés hozzáadva
public record CommentAdded(
    Guid ApplicationId,
    WorkflowStepType StepType,
    Guid CommentId,
    Guid AuthorUserId
) : DomainEvent;

// Beadási határidő figyelmeztető (background job generálja)
public record SubmissionDeadlineAlert(
    Guid ApplicationId,
    DateTimeOffset Deadline,
    int DaysRemaining
) : DomainEvent;
```

### 6.3 Eseménykezelők (Event Handlers)

```
Domain Event                    →  Handler(ek)
─────────────────────────────────────────────────────────────────────────
ApplicationCreated              →  (audit log automatikus)
ApplicationSubmitted            →  NotifyElnokOfSubmission
ApplicationWon                  →  NotifyElnokAndAdminOfResult
ApplicationLost                 →  NotifyElnokAndAdminOfResult
ApprovalRequired                →  SendApprovalRequestToElnok
SettlementApproved              →  NotifyTeamOfClosure,
                                   LockAllWorkflowSteps
DocumentAttached                →  NotifyApplicationOwner
CommentAdded                    →  NotifyLastStepModifier
SubmissionDeadlineAlert         →  SendDeadlineNotificationsToTeam
```

---

## 7. Domain Services

Domain service-ek ott szükségesek, ahol az üzleti logika **több aggregátot érint** vagy természetes módon nem illik egyetlen aggregátba.

### 7.1 WorkflowOrchestrationService

```csharp
/// <summary>
/// A munkafolyamat állapotátmeneteit vezényli. Az Application aggregát egyes
/// metódusai ebbe delegálják a lépések közötti konzisztencia-ellenőrzést.
/// </summary>
public interface IWorkflowOrchestrationService
{
    /// Létrehozza a 9 WorkflowStep-et egy új Application-höz
    IReadOnlyList<WorkflowStep> CreateInitialSteps(Guid applicationId);

    /// Ellenőrzi, hogy egy lépés lezárható-e (kötelező adatok megvannak-e)
    WorkflowTransitionResult ValidateCompletion(
        WorkflowStep step, Application application);

    /// Negatív eredmény esetén a [4]-[9] lépések inaktiválása
    void HandleNegativeResult(Application application);

    /// Elszámolás jóváhagyásakor minden lépés LOCKED-ra állítása
    void LockAllSteps(Application application);

    /// Következő aktív lépés meghatározása (kihagyott lépéseket ugró logika)
    WorkflowStep? DetermineNextActiveStep(Application application);
}
```

### 7.2 BudgetValidationService

```csharp
/// <summary>
/// A pályázati büdzsé konzisztenciáját ellenőrzi. "Soft" validáció –
/// figyelmeztet, de nem akadályoz meg.
/// </summary>
public interface IBudgetValidationService
{
    /// Visszaadja, hogy a tervezett összeg hány %-a az elnyert összegnek
    BudgetValidationResult ValidateBudgetPlan(
        Money awardedAmount, IEnumerable<BudgetItem> items);

    /// Visszaadja, hogy a számlák összege hány %-a az elnyert összegnek
    InvoiceCoverageResult ValidateInvoiceCoverage(
        Money awardedAmount, IEnumerable<Invoice> invoices);
}

public record BudgetValidationResult(
    bool ExceedsAwardedAmount,
    Money TotalPlanned,
    Money AwardedAmount,
    Money Difference
);

public record InvoiceCoverageResult(
    decimal CoveragePercent,    // 0–100
    bool MeetsThreshold,        // >= 80%
    Money TotalInvoiced,
    Money AwardedAmount
);
```

### 7.3 ApplicationAccessPolicy

```csharp
/// <summary>
/// Aggregát-szintű hozzáférési döntések, amelyek az AppUser szerepkörétől
/// és az Application állapotától is függenek.
/// Különbözik az API-szintű policy-ktől – ez domain-szintű szabályokat tartalmaz.
/// </summary>
public interface IApplicationAccessPolicy
{
    bool CanModify(Application application, AppUser user);
    bool CanApprove(Application application, WorkflowStepType stepType, AppUser user);
    bool CanSkipStep(WorkflowStep step, AppUser user);
    bool CanReactivateStep(WorkflowStep step, AppUser user);
    bool CanDeleteComment(Comment comment, AppUser user);
    bool CanArchiveDocument(Document document, AppUser user);
}
```

---

## 8. Repository interfészek

A repository-k **aggregát-szintűek**: egy repository egy aggregátot kezel. Soha nem ad vissza olyan objektumot, amely egy másik aggregát részét képezi.

```csharp
// Alap interfész
public interface IRepository<TAggregateRoot, TId>
    where TAggregateRoot : AggregateRoot<TId>
{
    Task<TAggregateRoot?> GetByIdAsync(TId id, CancellationToken ct = default);
    Task AddAsync(TAggregateRoot aggregate, CancellationToken ct = default);
    Task UpdateAsync(TAggregateRoot aggregate, CancellationToken ct = default);
    Task<bool> ExistsAsync(TId id, CancellationToken ct = default);
}

// Application Repository – a leggazdagabb interfész
public interface IApplicationRepository : IRepository<Application, Guid>
{
    // Lekérdezések (projekciók – nem tölti be az egész aggregátot)
    Task<PagedResult<ApplicationListProjection>> GetListAsync(
        ApplicationFilter filter,
        Pagination pagination,
        CancellationToken ct = default);

    Task<ApplicationDetailProjection?> GetDetailProjectionAsync(
        Guid id, CancellationToken ct = default);

    // Aggregát betöltése módosításhoz (a szükséges részekkel együtt)
    Task<Application?> GetForWorkflowUpdateAsync(
        Guid id,
        WorkflowStepType stepType,
        CancellationToken ct = default);

    Task<Application?> GetWithFinancialsAsync(
        Guid id, CancellationToken ct = default);

    Task<Application?> GetWithFullWorkflowAsync(
        Guid id, CancellationToken ct = default);

    // Határidő-figyelő job-hoz
    Task<IList<ApplicationDeadlineProjection>> GetApplicationsWithDeadlineAsync(
        DateOnly targetDate, DeadlineType type,
        CancellationToken ct = default);

    // Keresés
    Task<IList<SearchResultProjection>> SearchAsync(
        string searchTerm, CancellationToken ct = default);

    // Export
    Task<IList<ApplicationExportProjection>> GetForExportAsync(
        ApplicationFilter filter, CancellationToken ct = default);
}

// Granter Repository
public interface IGranterRepository : IRepository<Granter, Guid>
{
    Task<PagedResult<Granter>> GetListAsync(
        string? nameFilter, bool? activeOnly,
        Pagination pagination, CancellationToken ct = default);

    Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null,
        CancellationToken ct = default);

    Task<Granter?> GetByNameAsync(string name, CancellationToken ct = default);
}

// Vendor Repository
public interface IVendorRepository : IRepository<Vendor, Guid>
{
    Task<PagedResult<Vendor>> GetListAsync(
        string? nameFilter, bool? activeOnly,
        Pagination pagination, CancellationToken ct = default);

    Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null,
        CancellationToken ct = default);

    Task<bool> HasActiveContractsAsync(Guid vendorId,
        CancellationToken ct = default);
}

// CodeList Repository
public interface ICodeListRepository : IRepository<CodeList, Guid>
{
    Task<IList<CodeList>> GetAllWithItemsAsync(CancellationToken ct = default);
    Task<CodeList?> GetWithItemsAsync(Guid id, CancellationToken ct = default);
    Task<IList<CodeListItem>> GetActiveItemsByCodeListAsync(
        Guid codeListId, CancellationToken ct = default);
}

// AppUser Repository
public interface IAppUserRepository : IRepository<AppUser, Guid>
{
    Task<AppUser?> GetByGoogleIdAsync(string googleId,
        CancellationToken ct = default);
    Task<AppUser?> GetByEmailAsync(string email,
        CancellationToken ct = default);
    Task<int> CountActiveAdminsAsync(CancellationToken ct = default);
    Task<IList<AppUser>> GetByRoleAsync(UserRole role,
        CancellationToken ct = default);
}

// Notification Repository
public interface INotificationRepository
{
    Task AddAsync(Notification notification, CancellationToken ct = default);
    Task AddRangeAsync(IList<Notification> notifications,
        CancellationToken ct = default);
    Task<PagedResult<Notification>> GetForUserAsync(
        Guid userId, bool? unreadOnly, Pagination pagination,
        CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId,
        CancellationToken ct = default);
    Task MarkAsReadAsync(Guid notificationId,
        CancellationToken ct = default);
    Task MarkAllAsReadAsync(Guid userId,
        CancellationToken ct = default);
}

// AuditLog – csak append és read
public interface IAuditLogRepository
{
    Task AddAsync(AuditLog entry, CancellationToken ct = default);
    Task AddRangeAsync(IList<AuditLog> entries,
        CancellationToken ct = default);
    Task<PagedResult<AuditLog>> GetAsync(
        AuditLogFilter filter, Pagination pagination,
        CancellationToken ct = default);
    Task<PagedResult<AuditLog>> GetForEntityAsync(
        string entityType, Guid entityId,
        Pagination pagination, CancellationToken ct = default);
}
```

---

## 9. Domain szabályok és invariánsok katalógusa

Az összes üzleti szabály katalogizálva, a kód elhelyezésével együtt.

### 9.1 Application aggregát szabályai

| Szabály ID | Leírás | Típus | Elhelyezés | FS fejezet |
|---|---|---|---|---|
| BR-APP-01 | Pályázat csak aktív Granter-hez rendelhető | Hard | `Application.Create()` | 22.5 |
| BR-APP-02 | `MinAmount` ≤ `MaxAmount`, ha mindkettő kitöltött | Hard | `CallStepData` konstruktor | 10.3 |
| BR-APP-03 | `SpendingDeadline` ≥ `SubmissionDeadline` (ha kitöltött) | Hard | `CallStepData` konstruktor | 10.3 |
| BR-APP-04 | Beadás csak aktív (`ACTIVE`) lépésnél rögzíthető | Hard | `RecordSubmission()` | 11.4 |
| BR-APP-05 | Eredmény rögzítéséhez az eredmény dátuma és típusa kötelező | Hard | `RecordResult()` | 12.4 |
| BR-APP-06 | `AwardedAmount` kötelező, ha `Outcome == Won` | Hard | `ApplicationResult.Won()` | 12.3 |
| BR-APP-07 | `AwardedAmount > 0` ha `Won` | Hard | `ApplicationResult.Won()` | 12.3 |
| BR-APP-08 | Tervezett összeg > elnyert összeg esetén figyelmeztetés | Soft | `IBudgetValidationService` | 14.5 |
| BR-APP-09 | Számlák összege > elnyert összeg esetén figyelmeztetés | Soft | `IBudgetValidationService` | 16.4 |
| BR-APP-10 | Számla fizetési dátuma ≥ kiállítás dátuma | Hard | `Invoice` konstruktor | 16.3 |
| BR-APP-11 | `isPaid == true` esetén `paidAt` kötelező | Hard | `Invoice.MarkPaid()` | 16.3 |
| BR-APP-12 | `ProofRecord`-hoz legalább 1 fotó dokumentum kötelező | Hard | `Application.AddProofRecord()` | 17.4 |
| BR-APP-13 | Elszámolás < 80% fedezettségnél figyelmeztetés | Soft | `IBudgetValidationService` | 18.4 |
| BR-APP-14 | `VendorContract` nem törölhető, ha kapcsolódó számla létezik | Hard | `Application.RemoveVendorContract()` | 15.4 |
| BR-APP-15 | `BudgetItem` nem törölhető, ha kapcsolódó számla vagy szerz. létezik | Hard | `Application.RemoveBudgetItem()` | 14.5 |
| BR-APP-16 | `LOCKED` állapotban minden mutáló metódus `DomainException`-t dob | Hard | `Application.EnsureNotLocked()` | 8.3 |
| BR-APP-17 | `ARCHIVED` állapotban minden mutáló metódus `DomainException`-t dob | Hard | `Application.EnsureNotArchived()` | 8.1 |
| BR-APP-18 | Kihagyható lépés visszaállítható, nem kihagyható nem (`CALL`, `SUBMISSION`, `RESULT`, `INVOICES`, `SETTLEMENT`) | Hard | `Application.ReactivateStep()` | 7.3 |
| BR-APP-19 | Egy alkalmazáshoz egy adott `StepType`-ból csak 1 `WorkflowStep` létezhet | Hard | `WorkflowOrchestrationService` | 7.2 |

### 9.2 Granter és Vendor szabályai

| Szabály ID | Leírás | Típus | Elhelyezés |
|---|---|---|---|
| BR-GRN-01 | `Name` egyedi a rendszerben | Hard | Repository szint (`IGranterRepository.ExistsByNameAsync`) |
| BR-GRN-02 | Inaktív Granter-hez nem rendelhető új Application | Hard | `Application.Create()` |
| BR-VND-01 | `Name` egyedi a rendszerben | Hard | Repository szint |
| BR-VND-02 | Aktív szerződéssel rendelkező Vendor nem deaktiválható (figyelmeztetés) | Soft | Application Service szint |

### 9.3 AppUser szabályai

| Szabály ID | Leírás | Típus | Elhelyezés |
|---|---|---|---|
| BR-USR-01 | Legalább 1 aktív Admin mindig létezzen | Hard | Application Service (`IAppUserRepository.CountActiveAdminsAsync`) |
| BR-USR-02 | Admin nem deaktiválhatja saját fiókját | Hard | Application Service |
| BR-USR-03 | Saját szerepkör nem módosítható a felhasználó által | Hard | API szintű policy |

### 9.4 CodeList szabályai

| Szabály ID | Leírás | Típus | Elhelyezés |
|---|---|---|---|
| BR-CDL-01 | Rendszer-szintű CodeList nem törölhető | Hard | `CodeList.Delete()` |
| BR-CDL-02 | `Code` egyedi a CodeList-en belül | Hard | `CodeList.AddItem()` |
| BR-CDL-03 | Inaktív CodeListItem nem jelenik meg a kiválasztó listákban | Hard | Repository szint (szűrés aktív elemekre) |

---

## 10. Teljes adatbázis séma (EF Core Code First)

### 10.1 Összes tábla összefoglalója

| Tábla neve | Aggregát | Típus | Sor-becslés |
|---|---|---|---|
| `Applications` | Application | Aggregát gyökér | ~100-500 |
| `WorkflowSteps` | Application | Entitás | ~900-4500 (9x) |
| `Documents` | Application/WorkflowStep | Entitás | ~1000-10000 |
| `Comments` | Application/WorkflowStep | Entitás | ~500-5000 |
| `EmailAttachments` | Application/WorkflowStep | Entitás | ~200-2000 |
| `BudgetPlans` | Application | Entitás (1:1) | ~100-500 |
| `BudgetItems` | Application/BudgetPlan | Entitás | ~300-2000 |
| `GranterContracts` | Application | Entitás (1:1) | ~80-400 |
| `VendorContracts` | Application | Entitás | ~200-1000 |
| `Invoices` | Application | Entitás | ~500-3000 |
| `ProofRecords` | Application | Entitás | ~200-1000 |
| `Settlements` | Application | Entitás (1:1) | ~80-400 |
| `Granters` | Granter | Aggregát | ~20-200 |
| `Vendors` | Vendor | Aggregát | ~50-500 |
| `CodeLists` | CodeList | Aggregát | ~10 |
| `CodeListItems` | CodeList | Entitás | ~100 |
| `AppUsers` | AppUser | Aggregát | ~5-50 |
| `Notifications` | Notification | Aggregát | ~1000-50000 |
| `AuditLogs` | – | Append-only | ~50000+ |

### 10.2 Teljes DDL séma

```sql
-- ══════════════════════════════════════════════════════════════
-- REFERENCIA ENTITÁSOK (ezekre hivatkoznak mások)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "AppUsers" (
    "Id"                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "GoogleId"               VARCHAR(128) NOT NULL UNIQUE,
    "Email"                  VARCHAR(320) NOT NULL UNIQUE,
    "Name"                   VARCHAR(300) NOT NULL,
    "ProfilePictureUrl"      TEXT,
    "Role"                   SMALLINT     NOT NULL,         -- UserRole enum
    "Status"                 SMALLINT     NOT NULL DEFAULT 1,  -- 1=Active, 0=Inactive
    "NotifEmailDeadline"     BOOLEAN      NOT NULL DEFAULT TRUE,
    "NotifEmailMissed"       BOOLEAN      NOT NULL DEFAULT TRUE,
    "NotifEmailResult"       BOOLEAN      NOT NULL DEFAULT TRUE,
    "NotifEmailApproval"     BOOLEAN      NOT NULL DEFAULT TRUE,
    "NotifEmailComment"      BOOLEAN      NOT NULL DEFAULT FALSE,
    "NotifEmailDocument"     BOOLEAN      NOT NULL DEFAULT FALSE,
    "LastLoginAt"            TIMESTAMPTZ,
    "CreatedAt"              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE "Granters" (
    "Id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"        VARCHAR(300) NOT NULL UNIQUE,
    "Description" TEXT,
    "Phone"       VARCHAR(50),
    "Email"       VARCHAR(320),
    "Status"      SMALLINT     NOT NULL DEFAULT 1,
    "CreatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "RowVersion"  BYTEA        NOT NULL DEFAULT '\x00000001'
);

CREATE TABLE "Vendors" (
    "Id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"        VARCHAR(300) NOT NULL UNIQUE,
    "TaxNumber"   VARCHAR(20),
    "Address"     TEXT,
    "Phone"       VARCHAR(50),
    "Email"       VARCHAR(320),
    "Status"      SMALLINT     NOT NULL DEFAULT 1,
    "CreatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "RowVersion"  BYTEA        NOT NULL DEFAULT '\x00000001'
);

CREATE TABLE "CodeLists" (
    "Id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"        VARCHAR(100) NOT NULL UNIQUE,
    "Description" TEXT,
    "IsSystem"    BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE "CodeListItems" (
    "Id"          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "CodeListId"  UUID         NOT NULL REFERENCES "CodeLists"("Id") ON DELETE RESTRICT,
    "Code"        VARCHAR(50)  NOT NULL,
    "Name"        VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Order"       INT          NOT NULL DEFAULT 0,
    "Status"      SMALLINT     NOT NULL DEFAULT 1,
    "CreatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "UpdatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE ("CodeListId", "Code")
);

-- ══════════════════════════════════════════════════════════════
-- CORE: APPLICATION AGGREGÁT
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "Applications" (
    "Id"                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Alapadatok ([1] Felhívás + metaadatok)
    "Title"                  VARCHAR(500)  NOT NULL,
    "Identifier"             VARCHAR(100),
    "Description"            TEXT,
    "OtherMetadata"          TEXT,

    -- Összeg intervallum
    "MinAmount"              DECIMAL(18,2),
    "MaxAmount"              DECIMAL(18,2),
    "AmountCurrency"         CHAR(3)       NOT NULL DEFAULT 'HUF',

    -- Határidők
    "SubmissionDeadline"     TIMESTAMPTZ   NOT NULL,
    "SpendingDeadline"       DATE,

    -- Állapot
    "Status"                 VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    "IsArchived"             BOOLEAN       NOT NULL DEFAULT FALSE,

    -- Hivatkozások
    "GranterId"              UUID          NOT NULL REFERENCES "Granters"("Id"),
    "ApplicationTypeId"      UUID          REFERENCES "CodeListItems"("Id"),

    -- [2] Beadás adatok (owned entity)
    "Sub_Description"        TEXT,
    "Sub_MethodId"           UUID          REFERENCES "CodeListItems"("Id"),
    "Sub_SubmittedAt"        TIMESTAMPTZ,
    "Sub_SubmittedByUserId"  UUID          REFERENCES "AppUsers"("Id"),

    -- [3] Eredmény adatok (owned entity)
    "Res_Outcome"            SMALLINT,     -- NULL=döntés előtt, 1=Won, 2=Lost
    "Res_ResultDate"         DATE,
    "Res_ResultIdentifier"   VARCHAR(100),
    "Res_AwardedAmount"      DECIMAL(18,2),

    -- [4] Pályáztató szerződés (owned entity)
    "GC_ContractIdentifier"  VARCHAR(100),
    "GC_ContractDate"        DATE,
    "GC_NotifReceived"       BOOLEAN,
    "GC_NotifDate"           DATE,

    -- Audit
    "CreatedByUserId"        UUID          NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UpdatedAt"              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "RowVersion"             BYTEA         NOT NULL DEFAULT '\x00000001'
);

-- Indexek
CREATE INDEX idx_app_status          ON "Applications"("Status") WHERE "IsArchived" = FALSE;
CREATE INDEX idx_app_granter         ON "Applications"("GranterId");
CREATE INDEX idx_app_deadline        ON "Applications"("SubmissionDeadline");
CREATE INDEX idx_app_spending        ON "Applications"("SpendingDeadline") WHERE "SpendingDeadline" IS NOT NULL;
CREATE INDEX idx_app_created_by      ON "Applications"("CreatedByUserId");
CREATE INDEX idx_app_fulltext        ON "Applications" USING GIN (
    to_tsvector('hungarian', "Title" || ' ' || COALESCE("Identifier", ''))
);

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "WorkflowSteps" (
    "Id"                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"       UUID        NOT NULL REFERENCES "Applications"("Id") ON DELETE CASCADE,
    "StepType"            VARCHAR(30) NOT NULL,
    "Status"              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "Order"               SMALLINT    NOT NULL,
    "IsSkippable"         BOOLEAN     NOT NULL,
    "SkippedReason"       TEXT,
    "CompletedAt"         TIMESTAMPTZ,
    "CompletedByUserId"   UUID        REFERENCES "AppUsers"("Id"),
    "ApprovedAt"          TIMESTAMPTZ,
    "ApprovedByUserId"    UUID        REFERENCES "AppUsers"("Id"),
    "CreatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("ApplicationId", "StepType")
);

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "Documents" (
    "Id"                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"       UUID         NOT NULL REFERENCES "Applications"("Id"),
    "WorkflowStepId"      UUID         NOT NULL REFERENCES "WorkflowSteps"("Id"),
    "DocumentTypeId"      UUID         NOT NULL REFERENCES "CodeListItems"("Id"),
    "DisplayName"         VARCHAR(500),
    "OriginalFileName"    VARCHAR(500) NOT NULL,
    "StoragePath"         TEXT         NOT NULL,
    "ContentType"         VARCHAR(200) NOT NULL,
    "FileSizeBytes"       BIGINT       NOT NULL,
    "Version"             INT          NOT NULL DEFAULT 1,
    "IsLatestVersion"     BOOLEAN      NOT NULL DEFAULT TRUE,
    "ParentDocumentId"    UUID         REFERENCES "Documents"("Id"),
    "IsArchived"          BOOLEAN      NOT NULL DEFAULT FALSE,
    "UploadedByUserId"    UUID         NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_step         ON "Documents"("WorkflowStepId") WHERE "IsArchived" = FALSE;
CREATE INDEX idx_doc_application  ON "Documents"("ApplicationId");
CREATE INDEX idx_doc_latest       ON "Documents"("WorkflowStepId", "IsLatestVersion")
    WHERE "IsLatestVersion" = TRUE AND "IsArchived" = FALSE;

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "Comments" (
    "Id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"    UUID        NOT NULL REFERENCES "Applications"("Id"),
    "WorkflowStepId"   UUID        NOT NULL REFERENCES "WorkflowSteps"("Id"),
    "Text"             TEXT        NOT NULL,
    "IsDeleted"        BOOLEAN     NOT NULL DEFAULT FALSE,
    "CreatedByUserId"  UUID        NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comment_step ON "Comments"("WorkflowStepId") WHERE "IsDeleted" = FALSE;

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "EmailAttachments" (
    "Id"               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"    UUID         NOT NULL REFERENCES "Applications"("Id"),
    "WorkflowStepId"   UUID         NOT NULL REFERENCES "WorkflowSteps"("Id"),
    "Subject"          VARCHAR(500) NOT NULL,
    "FromEmail"        VARCHAR(320) NOT NULL,
    "SentAt"           TIMESTAMPTZ  NOT NULL,
    "Direction"        SMALLINT     NOT NULL,  -- 1=Inbound, 2=Outbound
    "BodySummary"      TEXT,
    "FilePath"         TEXT,                   -- .eml / .msg ha feltöltve
    "IsDeleted"        BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedByUserId"  UUID         NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "BudgetPlans" (
    "Id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"    UUID        NOT NULL UNIQUE REFERENCES "Applications"("Id"),
    "ApprovedAt"       TIMESTAMPTZ,
    "ApprovedByUserId" UUID        REFERENCES "AppUsers"("Id"),
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "BudgetItems" (
    "Id"              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    "BudgetPlanId"    UUID          NOT NULL REFERENCES "BudgetPlans"("Id") ON DELETE CASCADE,
    "ApplicationId"   UUID          NOT NULL REFERENCES "Applications"("Id"),
    "Name"            VARCHAR(300)  NOT NULL,
    "ItemType"        SMALLINT      NOT NULL,  -- 1=Event, 2=Asset, 3=Other
    "PlannedAmount"   DECIMAL(18,2) NOT NULL,
    "Currency"        CHAR(3)       NOT NULL DEFAULT 'HUF',
    "Description"     TEXT,
    "Order"           INT           NOT NULL DEFAULT 0,
    "CreatedAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budgetitem_plan ON "BudgetItems"("BudgetPlanId");
CREATE INDEX idx_budgetitem_app  ON "BudgetItems"("ApplicationId");

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "VendorContracts" (
    "Id"               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"    UUID          NOT NULL REFERENCES "Applications"("Id"),
    "VendorId"         UUID          NOT NULL REFERENCES "Vendors"("Id"),
    "ContractDate"     DATE          NOT NULL,
    "ContractIdentifier" VARCHAR(100),
    "Amount"           DECIMAL(18,2) NOT NULL,
    "Currency"         CHAR(3)       NOT NULL DEFAULT 'HUF',
    "BudgetItemId"     UUID          REFERENCES "BudgetItems"("Id"),
    "CreatedByUserId"  UUID          NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendorcontract_app    ON "VendorContracts"("ApplicationId");
CREATE INDEX idx_vendorcontract_vendor ON "VendorContracts"("VendorId");

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "Invoices" (
    "Id"               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"    UUID          NOT NULL REFERENCES "Applications"("Id"),
    "SupplierName"     VARCHAR(300)  NOT NULL,
    "InvoiceNumber"    VARCHAR(100)  NOT NULL,
    "IssuedDate"       DATE          NOT NULL,
    "Amount"           DECIMAL(18,2) NOT NULL,
    "Currency"         CHAR(3)       NOT NULL DEFAULT 'HUF',
    "IsPaid"           BOOLEAN       NOT NULL DEFAULT FALSE,
    "PaidAt"           DATE,
    "VendorContractId" UUID          REFERENCES "VendorContracts"("Id"),
    "BudgetItemId"     UUID          REFERENCES "BudgetItems"("Id"),
    "IsArchived"       BOOLEAN       NOT NULL DEFAULT FALSE,
    "CreatedByUserId"  UUID          NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_invoice_paid CHECK (
        "IsPaid" = FALSE OR ("IsPaid" = TRUE AND "PaidAt" IS NOT NULL)
    ),
    CONSTRAINT chk_invoice_dates CHECK (
        "PaidAt" IS NULL OR "PaidAt" >= "IssuedDate"
    )
);

CREATE INDEX idx_invoice_app    ON "Invoices"("ApplicationId") WHERE "IsArchived" = FALSE;
CREATE INDEX idx_invoice_paid   ON "Invoices"("ApplicationId", "IsPaid");
CREATE INDEX idx_invoice_vendor ON "Invoices"("VendorContractId") WHERE "VendorContractId" IS NOT NULL;

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "ProofRecords" (
    "Id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"    UUID        NOT NULL REFERENCES "Applications"("Id"),
    "ProofType"        SMALLINT    NOT NULL,  -- 1=Event, 2=AssetDelivery
    "EventDate"        DATE,                  -- ProofType=Event esetén
    "DeliveryDate"     DATE,                  -- ProofType=Asset esetén
    "Description"      TEXT,
    "BudgetItemId"     UUID        REFERENCES "BudgetItems"("Id"),
    "IsDeleted"        BOOLEAN     NOT NULL DEFAULT FALSE,
    "CreatedByUserId"  UUID        NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_proof_date CHECK (
        ("ProofType" = 1 AND "EventDate" IS NOT NULL) OR
        ("ProofType" = 2 AND "DeliveryDate" IS NOT NULL)
    )
);

-- Megjegyzés: ProofRecord fotói a Documents táblában tárolódnak
-- (WorkflowStepId = PROOF lépés, DocumentType = "Fotó")

-- ──────────────────────────────────────────────────────────────

CREATE TABLE "Settlements" (
    "Id"                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "ApplicationId"      UUID        NOT NULL UNIQUE REFERENCES "Applications"("Id"),
    "SettlementDate"     DATE        NOT NULL,
    "SettlementMethodId" UUID        REFERENCES "CodeListItems"("Id"),
    "Summary"            TEXT,
    "ApprovedAt"         TIMESTAMPTZ,
    "ApprovedByUserId"   UUID        REFERENCES "AppUsers"("Id"),
    "CreatedByUserId"    UUID        NOT NULL REFERENCES "AppUsers"("Id"),
    "CreatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- ÉRTESÍTÉSEK
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "Notifications" (
    "Id"                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"              UUID         NOT NULL REFERENCES "AppUsers"("Id"),
    "Type"                SMALLINT     NOT NULL,
    "Title"               VARCHAR(300) NOT NULL,
    "Body"                TEXT         NOT NULL,
    "RelatedEntityId"     UUID,
    "RelatedEntityType"   VARCHAR(50),
    "IsRead"              BOOLEAN      NOT NULL DEFAULT FALSE,
    "CreatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "ReadAt"              TIMESTAMPTZ
);

CREATE INDEX idx_notif_user_unread ON "Notifications"("UserId", "IsRead")
    WHERE "IsRead" = FALSE;
CREATE INDEX idx_notif_user_all    ON "Notifications"("UserId", "CreatedAt" DESC);

-- ══════════════════════════════════════════════════════════════
-- AUDIT NAPLÓ
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "AuditLogs" (
    "Id"           BIGSERIAL    PRIMARY KEY,
    "EntityType"   VARCHAR(50)  NOT NULL,
    "EntityId"     UUID         NOT NULL,
    "Action"       SMALLINT     NOT NULL,
    "FieldName"    VARCHAR(100),
    "OldValue"     TEXT,
    "NewValue"     TEXT,
    "UserId"       UUID         NOT NULL,  -- Szándékosan nincs FK: user törlés esetén is megmarad
    "UserEmail"    VARCHAR(320) NOT NULL,  -- Denormalizált, a napló önállósága miatt
    "IpAddress"    VARCHAR(45),
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON "AuditLogs"("EntityType", "EntityId");
CREATE INDEX idx_audit_user   ON "AuditLogs"("UserId");
CREATE INDEX idx_audit_time   ON "AuditLogs"("CreatedAt" DESC);

-- Particionálás dátum szerint (éves megőrzés, 5 év)
-- (production-ban ajánlott: pg_partman használatával)
```

---

## 11. Entitás kapcsolati diagram (ERD)

```
AppUsers ──────────────────────────────────────────────────────────────────────┐
  │                                                                             │
  │ 1:N                                                                         │
  ▼                                                                             │
Granters ──── 1:N ──── Applications ──── 1:9 ──── WorkflowSteps              │
  │                        │    │    │                    │                    │
  │                        │    │    │                    ├── 0:N ─ Documents  │
  │                        │    │    │                    ├── 0:N ─ Comments   │
  │                        │    │    │                    └── 0:N ─ EmailAttachments
  │                        │    │    │
  │                        │    │    ├── 0:1 ─ BudgetPlan ── 1:N ─ BudgetItems
  │                        │    │    │                              │
  │                        │    │    ├── 0:N ─ VendorContracts ◄──┤ (opt. FK)
  │                        │    │    │              │              │
  │                        │    │    │              │              └── 0:N ─ Invoices
Vendors ─────────────── 1:N ─ VendorContracts      │                         │
  │                        │    │    │         (opt. FK)              (opt. FK)
  │                        │    │    │
  │                        │    │    ├── 0:N ─ ProofRecords
  │                        │    │    │
  │                        │    │    └── 0:1 ─ Settlement
  │                        │    │
  │                        │    └── Owned: CallStepData, SubmissionStepData,
  │                        │                ResultData, GranterContractData
  │                        │
CodeLists ── 1:N ── CodeListItems
  │                        │
  └───────────── FK ───────┘  (ApplicationTypeId, DocumentTypeId, stb.)


Notifications ──── N:1 ──── AppUsers
AuditLogs     ──── N:1 ──── AppUsers (gyenge FK, denormalizált email)
```

---

## 12. C# domain osztályok – teljes implementáció

### 12.1 Alap osztályok

```csharp
// ── Absztrakt alap ────────────────────────────────────────────────────────────

public abstract class Entity<TId>
{
    public TId Id { get; protected set; }
    protected Entity(TId id) => Id = id;
    protected Entity() { }  // EF Core-hoz
}

public abstract class AggregateRoot<TId> : Entity<TId>
{
    private readonly List<DomainEvent> _domainEvents = new();
    public IReadOnlyList<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void RaiseDomainEvent(DomainEvent domainEvent)
        => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents()
        => _domainEvents.Clear();

    protected AggregateRoot(TId id) : base(id) { }
    protected AggregateRoot() { }
}

// ── Shared infrastruktúra ─────────────────────────────────────────────────────

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
    public DomainException(string message, Exception inner) : base(message, inner) { }
}

public class NotFoundException : Exception
{
    public NotFoundException(string entityName, object id)
        : base($"{entityName} nem található: {id}") { }
}
```

### 12.2 WorkflowStep entitás

```csharp
public class WorkflowStep : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public WorkflowStepType StepType { get; private set; }
    public WorkflowStepStatus Status { get; private set; }
    public int Order { get; private set; }
    public bool IsSkippable { get; private set; }
    public string? SkippedReason { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }
    public Guid? CompletedByUserId { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public Guid? ApprovedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<Document> _documents = new();
    private readonly List<Comment> _comments = new();
    private readonly List<EmailAttachment> _emailAttachments = new();

    public IReadOnlyList<Document> Documents => _documents.AsReadOnly();
    public IReadOnlyList<Comment> Comments => _comments.AsReadOnly();
    public IReadOnlyList<EmailAttachment> EmailAttachments => _emailAttachments.AsReadOnly();

    private WorkflowStep() { }

    internal WorkflowStep(Guid applicationId, WorkflowStepType stepType,
                           int order, bool isSkippable)
    {
        Id = Guid.NewGuid();
        ApplicationId = applicationId;
        StepType = stepType;
        Status = WorkflowStepStatus.Pending;
        Order = order;
        IsSkippable = isSkippable;
        CreatedAt = UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Activate()
    {
        if (Status != WorkflowStepStatus.Pending && Status != WorkflowStepStatus.Skipped)
            throw new DomainException($"A lépés nem aktiválható ({Status} állapotból).");
        Status = WorkflowStepStatus.Active;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Complete(AppUser by)
    {
        if (Status != WorkflowStepStatus.Active)
            throw new DomainException("Csak aktív lépés zárható le.");
        Status = WorkflowStepStatus.Completed;
        CompletedAt = DateTimeOffset.UtcNow;
        CompletedByUserId = by.Id;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Skip(string? reason, AppUser by)
    {
        if (!IsSkippable)
            throw new DomainException($"A(z) {StepType} lépés nem hagyható ki.");
        if (Status != WorkflowStepStatus.Active)
            throw new DomainException("Csak aktív lépés hagyható ki.");
        Status = WorkflowStepStatus.Skipped;
        SkippedReason = reason;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Lock()
    {
        Status = WorkflowStepStatus.Locked;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void SetNotApplicable()
    {
        Status = WorkflowStepStatus.NotApplicable;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void AddDocument(Document document) => _documents.Add(document);
    internal void AddComment(Comment comment) => _comments.Add(comment);
    internal void AddEmailAttachment(EmailAttachment email) => _emailAttachments.Add(email);

    public bool IsLocked => Status == WorkflowStepStatus.Locked;
    public bool IsCompleted => Status == WorkflowStepStatus.Completed;
    public bool RequiresApproval => StepType is WorkflowStepType.Submission
                                              or WorkflowStepType.BudgetPlan
                                              or WorkflowStepType.Settlement;
}

public enum WorkflowStepType
{
    Call             = 1,
    Submission       = 2,
    Result           = 3,
    GranterContract  = 4,
    BudgetPlan       = 5,
    VendorContracts  = 6,
    Invoices         = 7,
    Proof            = 8,
    Settlement       = 9
}

public enum WorkflowStepStatus
{
    Pending        = 0,
    Active         = 1,
    Completed      = 2,
    Skipped        = 3,
    Locked         = 4,
    NotApplicable  = 5
}

public enum ApplicationStatus
{
    Draft       = 0,
    InProgress  = 1,
    Submitted   = 2,
    Won         = 3,
    Lost        = 4,
    ClosedWon   = 5,
    ClosedLost  = 6,
    Archived    = 7
}
```

### 12.3 Invoice entitás

```csharp
public class Invoice : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public string SupplierName { get; private set; }
    public string InvoiceNumber { get; private set; }
    public DateOnly IssuedDate { get; private set; }
    public Money Amount { get; private set; }
    public bool IsPaid { get; private set; }
    public DateOnly? PaidAt { get; private set; }
    public Guid? VendorContractId { get; private set; }
    public Guid? BudgetItemId { get; private set; }
    public bool IsArchived { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Invoice() { }

    internal static Invoice Create(Guid applicationId, InvoiceParams p, AppUser by)
    {
        if (p.Amount.Amount <= 0)
            throw new DomainException("A számla összege pozitív kell legyen.");

        return new Invoice
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            SupplierName = p.SupplierName,
            InvoiceNumber = p.InvoiceNumber,
            IssuedDate = p.IssuedDate,
            Amount = p.Amount,
            IsPaid = false,
            VendorContractId = p.VendorContractId,
            BudgetItemId = p.BudgetItemId,
            CreatedByUserId = by.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void MarkPaid(DateOnly paidAt)
    {
        if (paidAt < IssuedDate)
            throw new DomainException("A fizetési dátum nem lehet korábbi a kiállítás dátumánál.");
        IsPaid = true;
        PaidAt = paidAt;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Archive() { IsArchived = true; UpdatedAt = DateTimeOffset.UtcNow; }
}
```

### 12.4 EF Core konfiguráció példa (Application)

```csharp
public class ApplicationConfiguration : IEntityTypeConfiguration<Application>
{
    public void Configure(EntityTypeBuilder<Application> builder)
    {
        builder.ToTable("Applications");
        builder.HasKey(a => a.Id);

        // Konkurrencia token
        builder.Property(a => a.RowVersion)
               .IsRowVersion();

        // Soft delete global filter
        builder.HasQueryFilter(a => !a.IsArchived);

        // Owned entity: CallStepData (inline az Applications táblában)
        builder.OwnsOne(a => a.CallData, call =>
        {
            call.Property(c => c.SubmissionDeadline).HasColumnName("SubmissionDeadline").IsRequired();
            call.Property(c => c.SpendingDeadline).HasColumnName("SpendingDeadline");
            call.OwnsOne(c => c.MinAmount, money =>
            {
                money.Property(m => m.Amount).HasColumnName("MinAmount").HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency).HasColumnName("AmountCurrency").HasMaxLength(3);
            });
            // ...
        });

        // Owned entity: SubmissionStepData
        builder.OwnsOne(a => a.SubmissionData, sub =>
        {
            sub.Property(s => s.Description).HasColumnName("Sub_Description");
            sub.Property(s => s.SubmittedAt).HasColumnName("Sub_SubmittedAt");
            // ...
        });

        // Navigációs tulajdonságok
        builder.HasMany(a => a.WorkflowSteps)
               .WithOne()
               .HasForeignKey(ws => ws.ApplicationId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Granter>()
               .WithMany()
               .HasForeignKey(a => a.GranterId)
               .OnDelete(DeleteBehavior.Restrict);

        // Kalkulált mezők – csak olvasható, DB-ben nem tárolva
        builder.Ignore(a => a.TotalPlannedAmount);
        builder.Ignore(a => a.TotalInvoicedAmount);
        builder.Ignore(a => a.TotalPaidAmount);
        builder.Ignore(a => a.RemainingBudget);
        builder.Ignore(a => a.IsLocked);
        builder.Ignore(a => a.CurrentActiveStep);
    }
}
```

### 12.5 Application aggregát – teljes implementáció

Ez a rendszer legkritikusabb osztálya. Minden üzleti szabály és invariáns itt érvényesül.

```csharp
public class Application : AggregateRoot<Guid>
{
    // ── Alaptulajdonságok ─────────────────────────────────────────────────────
    public string Title { get; private set; }
    public ApplicationStatus Status { get; private set; }
    public bool IsArchived { get; private set; }
    public Guid GranterId { get; private set; }
    public Guid? ApplicationTypeId { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public byte[] RowVersion { get; private set; }

    // ── Owned step adatok ─────────────────────────────────────────────────────
    public CallStepData CallData { get; private set; }
    public SubmissionStepData? SubmissionData { get; private set; }
    public ApplicationResult? Result { get; private set; }
    public GranterContractData? GranterContractData { get; private set; }

    // ── Gyűjtemények ──────────────────────────────────────────────────────────
    private readonly List<WorkflowStep> _workflowSteps = new();
    private readonly List<VendorContract> _vendorContracts = new();
    private readonly List<Invoice> _invoices = new();
    private readonly List<ProofRecord> _proofRecords = new();

    public IReadOnlyList<WorkflowStep> WorkflowSteps => _workflowSteps.AsReadOnly();
    public IReadOnlyList<VendorContract> VendorContracts => _vendorContracts.AsReadOnly();
    public IReadOnlyList<Invoice> Invoices => _invoices.AsReadOnly();
    public IReadOnlyList<ProofRecord> ProofRecords => _proofRecords.AsReadOnly();

    public BudgetPlan? BudgetPlan { get; private set; }
    public Settlement? Settlement { get; private set; }

    private Application() { } // EF Core

    // ── Factory ───────────────────────────────────────────────────────────────

    public static Application Create(
        string title,
        Guid granterId,
        CallStepData callData,
        Guid? applicationTypeId,
        AppUser createdBy,
        IWorkflowOrchestrationService workflowService)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("A pályázat neve nem lehet üres.");

        var application = new Application
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            GranterId = granterId,
            ApplicationTypeId = applicationTypeId,
            CallData = callData,
            Status = ApplicationStatus.Draft,
            IsArchived = false,
            CreatedByUserId = createdBy.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var steps = workflowService.CreateInitialSteps(application.Id);
        application._workflowSteps.AddRange(steps);
        // Az első lépés (Call) azonnal aktívra állítódik
        application._workflowSteps
            .Single(s => s.StepType == WorkflowStepType.Call)
            .Activate();

        application.RaiseDomainEvent(new ApplicationCreated(
            application.Id, title, granterId,
            callData.SubmissionDeadline, createdBy.Id));

        return application;
    }

    // ── Felhívás adatok frissítése ────────────────────────────────────────────

    public void UpdateCallData(CallStepData callData)
    {
        EnsureNotLocked();
        EnsureNotArchived();
        CallData = callData ?? throw new DomainException("A felhívás adatok nem lehetnek üresek.");
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateTitle(string title)
    {
        EnsureNotLocked();
        EnsureNotArchived();
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("A pályázat neve nem lehet üres.");
        Title = title.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Beadás ────────────────────────────────────────────────────────────────

    public void RecordSubmission(SubmissionStepData data, AppUser by)
    {
        EnsureNotLocked();
        EnsureNotArchived();

        var step = GetStep(WorkflowStepType.Submission);
        if (step.Status == WorkflowStepStatus.Pending)
            step.Activate();

        SubmissionData = data;
        Status = ApplicationStatus.InProgress;
        UpdatedAt = DateTimeOffset.UtcNow;

        RaiseDomainEvent(new ApprovalRequired(Id, WorkflowStepType.Submission, by.Id));
    }

    public void ApproveSubmission(AppUser approver)
    {
        EnsureNotLocked();
        if (!approver.CanApprove())
            throw new DomainException("Nincs jóváhagyási jogosultsága.");

        var step = GetStep(WorkflowStepType.Submission);
        step.Complete(approver);
        Status = ApplicationStatus.Submitted;
        UpdatedAt = DateTimeOffset.UtcNow;

        RaiseDomainEvent(new ApplicationSubmitted(Id, DateTimeOffset.UtcNow, approver.Id));
    }

    // ── Eredmény ──────────────────────────────────────────────────────────────

    public void RecordResult(ApplicationResult result, AppUser by,
                              IWorkflowOrchestrationService workflowService)
    {
        EnsureNotLocked();
        EnsureNotArchived();
        if (Status != ApplicationStatus.Submitted)
            throw new DomainException("Eredmény csak beadott pályázatnál rögzíthető.");

        Result = result;
        var resultStep = GetStep(WorkflowStepType.Result);
        resultStep.Activate();
        resultStep.Complete(by);

        if (result.Outcome == ApplicationOutcome.Won)
        {
            Status = ApplicationStatus.Won;
            // A [4]–[9] lépések aktiválhatóvá válnak
            GetStep(WorkflowStepType.GranterContract).Activate();
            GetStep(WorkflowStepType.BudgetPlan).Activate();
            GetStep(WorkflowStepType.VendorContracts).Activate();
            GetStep(WorkflowStepType.Invoices).Activate();
            GetStep(WorkflowStepType.Proof).Activate();
            GetStep(WorkflowStepType.Settlement).Activate();

            RaiseDomainEvent(new ApplicationWon(
                Id, result.AwardedAmount!, result.ResultDate, by.Id));
        }
        else
        {
            workflowService.HandleNegativeResult(this);
            Status = ApplicationStatus.Lost;
            RaiseDomainEvent(new ApplicationLost(Id, result.ResultDate, by.Id));
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Pályáztató szerződés ──────────────────────────────────────────────────

    public void RecordGranterContract(GranterContractData data, AppUser by)
    {
        EnsureNotLocked();
        EnsureWon();
        GranterContractData = data;
        GetStep(WorkflowStepType.GranterContract).Complete(by);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Lépés kihagyása / visszaállítása ─────────────────────────────────────

    public void SkipStep(WorkflowStepType stepType, string? reason, AppUser by)
    {
        EnsureNotLocked();
        EnsureNotArchived();
        var step = GetStep(stepType);
        step.Skip(reason, by);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ReactivateStep(WorkflowStepType stepType, AppUser by)
    {
        EnsureNotArchived();
        if (!by.IsAdmin() && !by.CanApprove())
            throw new DomainException("Lépés visszaállítása Admin vagy Elnök jogkört igényel.");
        var step = GetStep(stepType);
        step.Activate();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Költési terv ──────────────────────────────────────────────────────────

    public BudgetPlan CreateBudgetPlan(AppUser by)
    {
        EnsureNotLocked();
        EnsureWon();
        if (BudgetPlan != null)
            throw new DomainException("A pályázathoz már létezik költési terv.");

        BudgetPlan = Domain.BudgetPlan.Create(Id, by);
        UpdatedAt = DateTimeOffset.UtcNow;
        return BudgetPlan;
    }

    public void AddBudgetItem(BudgetItemParams p, AppUser by)
    {
        EnsureNotLocked();
        EnsureWon();
        if (BudgetPlan == null)
            throw new DomainException("Előbb hozza létre a költési tervet.");

        BudgetPlan.AddItem(p, by);

        // Soft figyelmeztetés – domain event-tel jelezzük a service rétegnek
        if (BudgetPlan.TotalPlanned.IsGreaterThan(Result!.AwardedAmount!))
            RaiseDomainEvent(new BudgetExceedsAwardedAmount(
                Id, BudgetPlan.TotalPlanned, Result.AwardedAmount));

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RemoveBudgetItem(Guid itemId, AppUser by)
    {
        EnsureNotLocked();
        // Ellenőrzés: van-e kapcsolódó számla vagy szerződés?
        bool hasLinkedInvoice = _invoices.Any(i => i.BudgetItemId == itemId && !i.IsArchived);
        bool hasLinkedContract = _vendorContracts.Any(c => c.BudgetItemId == itemId);
        if (hasLinkedInvoice || hasLinkedContract)
            throw new DomainException(
                "A tétel nem törölhető, mert kapcsolódó számla vagy szerződés létezik hozzá.");

        BudgetPlan?.RemoveItem(itemId);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ApproveBudgetPlan(AppUser approver)
    {
        EnsureNotLocked();
        if (!approver.CanApprove())
            throw new DomainException("Nincs jóváhagyási jogosultsága.");
        if (BudgetPlan == null || !BudgetPlan.Items.Any())
            throw new DomainException("Üres költési terv nem hagyható jóvá.");

        BudgetPlan.Approve(approver);
        GetStep(WorkflowStepType.BudgetPlan).Complete(approver);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Alvállalkozói szerződések ─────────────────────────────────────────────

    public VendorContract AddVendorContract(VendorContractParams p, AppUser by)
    {
        EnsureNotLocked();
        EnsureWon();
        var contract = VendorContract.Create(Id, p, by);
        _vendorContracts.Add(contract);
        UpdatedAt = DateTimeOffset.UtcNow;
        return contract;
    }

    public void RemoveVendorContract(Guid contractId, AppUser by)
    {
        EnsureNotLocked();
        var contract = _vendorContracts.FirstOrDefault(c => c.Id == contractId)
            ?? throw new NotFoundException(nameof(VendorContract), contractId);

        bool hasLinkedInvoice = _invoices.Any(i => i.VendorContractId == contractId && !i.IsArchived);
        if (hasLinkedInvoice)
            throw new DomainException(
                "A szerződés nem törölhető, mert kapcsolódó számla létezik hozzá. " +
                "Előbb archiválja a számlát.");

        _vendorContracts.Remove(contract);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Számlák ───────────────────────────────────────────────────────────────

    public Invoice AddInvoice(InvoiceParams p, AppUser by)
    {
        EnsureNotLocked();
        EnsureWon();

        var invoice = Invoice.Create(Id, p, by);
        _invoices.Add(invoice);

        // Soft figyelmeztetés
        var totalAfter = TotalInvoicedAmount.Add(invoice.Amount);
        if (totalAfter.IsGreaterThan(Result!.AwardedAmount!))
            RaiseDomainEvent(new InvoicesTotalExceedsAwardedAmount(
                Id, totalAfter, Result.AwardedAmount));

        UpdatedAt = DateTimeOffset.UtcNow;
        return invoice;
    }

    public void MarkInvoicePaid(Guid invoiceId, DateOnly paidAt, AppUser by)
    {
        EnsureNotLocked();
        var invoice = GetInvoice(invoiceId);
        invoice.MarkPaid(paidAt);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RemoveInvoice(Guid invoiceId, AppUser by)
    {
        EnsureNotLocked();
        var invoice = GetInvoice(invoiceId);
        invoice.Archive();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Teljesítés igazolása ──────────────────────────────────────────────────

    public ProofRecord AddProofRecord(ProofRecordParams p, AppUser by)
    {
        EnsureNotLocked();
        EnsureWon();
        if (!p.PhotoDocumentIds.Any())
            throw new DomainException("Igazoláshoz legalább egy fotó csatolása kötelező.");

        var proof = ProofRecord.Create(Id, p, by);
        _proofRecords.Add(proof);
        UpdatedAt = DateTimeOffset.UtcNow;
        return proof;
    }

    public void RemoveProofRecord(Guid proofId, AppUser by)
    {
        EnsureNotLocked();
        var proof = _proofRecords.FirstOrDefault(p => p.Id == proofId && !p.IsDeleted)
            ?? throw new NotFoundException(nameof(ProofRecord), proofId);
        proof.Delete();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Dokumentumok ──────────────────────────────────────────────────────────

    public Document AttachDocument(WorkflowStepType stepType, DocumentParams p, AppUser by)
    {
        EnsureNotArchived();
        var step = GetStep(stepType);
        if (step.IsLocked)
            throw new DomainException("Lezárt lépéshez nem csatolható dokumentum.");

        var document = Document.Create(Id, step.Id, p, by);
        step.AddDocument(document);

        RaiseDomainEvent(new DocumentAttached(Id, stepType, document.Id, p.OriginalFileName, by.Id));
        UpdatedAt = DateTimeOffset.UtcNow;
        return document;
    }

    public Document UploadNewDocumentVersion(Guid existingDocId, DocumentParams p, AppUser by)
    {
        EnsureNotArchived();
        var existingDoc = FindDocument(existingDocId)
            ?? throw new NotFoundException(nameof(Document), existingDocId);
        if (existingDoc.Step.IsLocked)
            throw new DomainException("Lezárt lépés dokumentumához nem tölthető fel új verzió.");

        existingDoc.MarkAsOldVersion();
        var newDoc = Document.CreateNextVersion(Id, existingDoc.WorkflowStepId,
                                                 existingDoc, p, by);
        existingDoc.Step.AddDocument(newDoc);
        UpdatedAt = DateTimeOffset.UtcNow;
        return newDoc;
    }

    public void ArchiveDocument(Guid documentId, AppUser by)
    {
        if (!by.IsAdmin())
            throw new DomainException("Dokumentum archiválása Admin jogkört igényel.");
        var doc = FindDocument(documentId)
            ?? throw new NotFoundException(nameof(Document), documentId);
        doc.Archive();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Megjegyzések ──────────────────────────────────────────────────────────

    public Comment AddComment(WorkflowStepType stepType, string text, AppUser by)
    {
        EnsureNotArchived();
        if (string.IsNullOrWhiteSpace(text))
            throw new DomainException("A megjegyzés szövege nem lehet üres.");

        var step = GetStep(stepType);
        var comment = Comment.Create(Id, step.Id, text, by);
        step.AddComment(comment);

        RaiseDomainEvent(new CommentAdded(Id, stepType, comment.Id, by.Id));
        UpdatedAt = DateTimeOffset.UtcNow;
        return comment;
    }

    public void EditComment(Guid commentId, string newText, AppUser by)
    {
        EnsureNotArchived();
        var comment = FindComment(commentId)
            ?? throw new NotFoundException(nameof(Comment), commentId);

        if (comment.CreatedByUserId != by.Id && !by.IsAdmin())
            throw new DomainException("Csak saját megjegyzés szerkeszthető.");
        if (string.IsNullOrWhiteSpace(newText))
            throw new DomainException("A megjegyzés szövege nem lehet üres.");

        comment.Edit(newText);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void DeleteComment(Guid commentId, AppUser by)
    {
        EnsureNotArchived();
        var comment = FindComment(commentId)
            ?? throw new NotFoundException(nameof(Comment), commentId);

        if (comment.CreatedByUserId != by.Id && !by.IsAdmin())
            throw new DomainException("Csak saját megjegyzés törölhető.");

        comment.Delete();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── E-mail csatolások ─────────────────────────────────────────────────────

    public EmailAttachment AttachEmail(WorkflowStepType stepType,
                                       EmailAttachmentParams p, AppUser by)
    {
        EnsureNotArchived();
        var step = GetStep(stepType);
        var email = EmailAttachment.Create(Id, step.Id, p, by);
        step.AddEmailAttachment(email);
        UpdatedAt = DateTimeOffset.UtcNow;
        return email;
    }

    public void RemoveEmailAttachment(Guid emailId, AppUser by)
    {
        EnsureNotArchived();
        var email = FindEmailAttachment(emailId)
            ?? throw new NotFoundException(nameof(EmailAttachment), emailId);

        if (email.CreatedByUserId != by.Id && !by.IsAdmin())
            throw new DomainException("Csak saját e-mail csatolás törölhető.");

        email.Delete();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Elszámolás ────────────────────────────────────────────────────────────

    public void RecordSettlement(SettlementParams p, AppUser by)
    {
        EnsureNotLocked();
        EnsureWon();
        if (Settlement != null)
            throw new DomainException("A pályázathoz már létezik elszámolás.");

        Settlement = Domain.Settlement.Create(Id, p, by);
        UpdatedAt = DateTimeOffset.UtcNow;

        RaiseDomainEvent(new ApprovalRequired(Id, WorkflowStepType.Settlement, by.Id));
    }

    public void ApproveSettlement(AppUser approver,
                                   IWorkflowOrchestrationService workflowService)
    {
        if (!approver.CanApprove())
            throw new DomainException("Nincs jóváhagyási jogosultsága.");
        if (Settlement == null)
            throw new DomainException("Nincs rögzített elszámolás a jóváhagyáshoz.");

        Settlement.Approve(approver);
        workflowService.LockAllSteps(this);
        Status = ApplicationStatus.ClosedWon;
        UpdatedAt = DateTimeOffset.UtcNow;

        RaiseDomainEvent(new SettlementApproved(Id, approver.Id, DateTimeOffset.UtcNow));
    }

    // ── Lezárás ───────────────────────────────────────────────────────────────

    public void ManualClose(AppUser by,
                             IWorkflowOrchestrationService workflowService)
    {
        if (Status != ApplicationStatus.Lost)
            throw new DomainException("Csak 'Nem nyert' állapotú pályázat zárható le manuálisan.");

        workflowService.LockAllSteps(this);
        Status = ApplicationStatus.ClosedLost;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Archive(AppUser by)
    {
        if (!by.IsAdmin())
            throw new DomainException("Archiválás Admin jogkört igényel.");

        IsArchived = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    // ── Kalkulált tulajdonságok ───────────────────────────────────────────────

    public Money TotalPlannedAmount =>
        BudgetPlan?.TotalPlanned ?? Money.Zero;

    public Money TotalInvoicedAmount =>
        _invoices
            .Where(i => !i.IsArchived)
            .Aggregate(Money.Zero, (sum, inv) => sum.Add(inv.Amount));

    public Money TotalPaidAmount =>
        _invoices
            .Where(i => !i.IsArchived && i.IsPaid)
            .Aggregate(Money.Zero, (sum, inv) => sum.Add(inv.Amount));

    public Money RemainingBudget =>
        Result?.AwardedAmount != null
            ? Result.AwardedAmount.Subtract(TotalInvoicedAmount)
            : Money.Zero;

    public decimal InvoiceCoveragePercent =>
        Result?.AwardedAmount != null && Result.AwardedAmount.Amount > 0
            ? TotalInvoicedAmount.PercentageOf(Result.AwardedAmount)
            : 0;

    public bool IsLocked =>
        Status is ApplicationStatus.ClosedWon
               or ApplicationStatus.ClosedLost
               or ApplicationStatus.Archived;

    public WorkflowStep? CurrentActiveStep =>
        _workflowSteps
            .Where(s => s.Status == WorkflowStepStatus.Active)
            .OrderBy(s => s.Order)
            .FirstOrDefault();

    // ── Guard metódusok ───────────────────────────────────────────────────────

    private void EnsureNotLocked()
    {
        if (IsLocked)
            throw new DomainException(
                "A pályázat lezárt állapotban van; módosítás nem lehetséges.");
    }

    private void EnsureNotArchived()
    {
        if (IsArchived)
            throw new DomainException("Archivált pályázat nem módosítható.");
    }

    private void EnsureWon()
    {
        if (Result?.Outcome != ApplicationOutcome.Won)
            throw new DomainException(
                "Ez a művelet csak nyertes pályázaton hajtható végre.");
    }

    // ── Belső keresők ─────────────────────────────────────────────────────────

    private WorkflowStep GetStep(WorkflowStepType stepType) =>
        _workflowSteps.FirstOrDefault(s => s.StepType == stepType)
        ?? throw new DomainException($"Munkafolyamat lépés nem található: {stepType}");

    private Invoice GetInvoice(Guid invoiceId) =>
        _invoices.FirstOrDefault(i => i.Id == invoiceId && !i.IsArchived)
        ?? throw new NotFoundException(nameof(Invoice), invoiceId);

    private Document? FindDocument(Guid documentId) =>
        _workflowSteps
            .SelectMany(s => s.Documents)
            .FirstOrDefault(d => d.Id == documentId);

    private Comment? FindComment(Guid commentId) =>
        _workflowSteps
            .SelectMany(s => s.Comments)
            .FirstOrDefault(c => c.Id == commentId && !c.IsDeleted);

    private EmailAttachment? FindEmailAttachment(Guid emailId) =>
        _workflowSteps
            .SelectMany(s => s.EmailAttachments)
            .FirstOrDefault(e => e.Id == emailId && !e.IsDeleted);
}
```

---

### 12.6 BudgetPlan és BudgetItem entitások

```csharp
public class BudgetPlan : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public Guid? ApprovedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private readonly List<BudgetItem> _items = new();
    public IReadOnlyList<BudgetItem> Items => _items.AsReadOnly();

    public Money TotalPlanned =>
        _items.Aggregate(Money.Zero, (sum, item) => sum.Add(item.PlannedAmount));

    public bool IsApproved => ApprovedAt.HasValue;

    private BudgetPlan() { }

    internal static BudgetPlan Create(Guid applicationId, AppUser by)
    {
        return new BudgetPlan
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void AddItem(BudgetItemParams p, AppUser by)
    {
        if (IsApproved)
            throw new DomainException("Jóváhagyott költési terv nem módosítható.");
        if (string.IsNullOrWhiteSpace(p.Name))
            throw new DomainException("A tétel neve kötelező.");
        if (p.PlannedAmount.Amount <= 0)
            throw new DomainException("A tervezett összeg pozitív kell legyen.");

        int nextOrder = _items.Any() ? _items.Max(i => i.Order) + 1 : 1;
        _items.Add(new BudgetItem(Guid.NewGuid(), Id, ApplicationId, p, nextOrder));
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void UpdateItem(Guid itemId, BudgetItemParams p)
    {
        if (IsApproved)
            throw new DomainException("Jóváhagyott költési terv nem módosítható.");
        var item = _items.FirstOrDefault(i => i.Id == itemId)
            ?? throw new NotFoundException(nameof(BudgetItem), itemId);
        item.Update(p);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void RemoveItem(Guid itemId)
    {
        if (IsApproved)
            throw new DomainException("Jóváhagyott költési terv nem módosítható.");
        var item = _items.FirstOrDefault(i => i.Id == itemId)
            ?? throw new NotFoundException(nameof(BudgetItem), itemId);
        _items.Remove(item);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void ReorderItems(IList<Guid> orderedIds)
    {
        if (orderedIds.Count != _items.Count)
            throw new DomainException("A sorba rendezési lista nem egyezik a tételek számával.");
        for (int i = 0; i < orderedIds.Count; i++)
        {
            var item = _items.FirstOrDefault(x => x.Id == orderedIds[i])
                ?? throw new DomainException($"Ismeretlen tétel azonosító: {orderedIds[i]}");
            item.SetOrder(i + 1);
        }
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Approve(AppUser approver)
    {
        if (!_items.Any())
            throw new DomainException("Üres költési terv nem hagyható jóvá.");
        ApprovedAt = DateTimeOffset.UtcNow;
        ApprovedByUserId = approver.Id;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public class BudgetItem : Entity<Guid>
{
    public Guid BudgetPlanId { get; private set; }
    public Guid ApplicationId { get; private set; }
    public string Name { get; private set; }
    public BudgetItemType ItemType { get; private set; }
    public Money PlannedAmount { get; private set; }
    public string? Description { get; private set; }
    public int Order { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private BudgetItem() { }

    internal BudgetItem(Guid id, Guid budgetPlanId, Guid applicationId,
                         BudgetItemParams p, int order)
    {
        Id = id;
        BudgetPlanId = budgetPlanId;
        ApplicationId = applicationId;
        Name = p.Name.Trim();
        ItemType = p.ItemType;
        PlannedAmount = p.PlannedAmount;
        Description = p.Description;
        Order = order;
        CreatedAt = UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Update(BudgetItemParams p)
    {
        Name = p.Name.Trim();
        ItemType = p.ItemType;
        PlannedAmount = p.PlannedAmount;
        Description = p.Description;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void SetOrder(int order)
    {
        Order = order;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public enum BudgetItemType { Event = 1, Asset = 2, Other = 3 }
```

---

### 12.7 VendorContract entitás

```csharp
public class VendorContract : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public Guid VendorId { get; private set; }
    public DateOnly ContractDate { get; private set; }
    public string? ContractIdentifier { get; private set; }
    public Money Amount { get; private set; }
    public Guid? BudgetItemId { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private VendorContract() { }

    internal static VendorContract Create(Guid applicationId,
                                           VendorContractParams p, AppUser by)
    {
        if (p.Amount.Amount <= 0)
            throw new DomainException("A szerződés összege pozitív kell legyen.");

        return new VendorContract
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            VendorId = p.VendorId,
            ContractDate = p.ContractDate,
            ContractIdentifier = p.ContractIdentifier,
            Amount = p.Amount,
            BudgetItemId = p.BudgetItemId,
            CreatedByUserId = by.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void Update(VendorContractParams p)
    {
        VendorId = p.VendorId;
        ContractDate = p.ContractDate;
        ContractIdentifier = p.ContractIdentifier;
        Amount = p.Amount;
        BudgetItemId = p.BudgetItemId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
```

---

### 12.8 Document, Comment, EmailAttachment entitások

```csharp
public class Document : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public Guid WorkflowStepId { get; private set; }
    public Guid DocumentTypeId { get; private set; }
    public string? DisplayName { get; private set; }
    public string OriginalFileName { get; private set; }
    public string StoragePath { get; private set; }
    public string ContentType { get; private set; }
    public long FileSizeBytes { get; private set; }
    public int Version { get; private set; }
    public bool IsLatestVersion { get; private set; }
    public Guid? ParentDocumentId { get; private set; }
    public bool IsArchived { get; private set; }
    public Guid UploadedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    // Navigáció a WorkflowStep-hez (csak aggregáton belül)
    internal WorkflowStep Step { get; set; } = null!;

    private Document() { }

    internal static Document Create(Guid applicationId, Guid workflowStepId,
                                     DocumentParams p, AppUser by)
    {
        return new Document
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            WorkflowStepId = workflowStepId,
            DocumentTypeId = p.DocumentTypeId,
            DisplayName = p.DisplayName,
            OriginalFileName = p.OriginalFileName,
            StoragePath = p.StoragePath,
            ContentType = p.ContentType,
            FileSizeBytes = p.FileSizeBytes,
            Version = 1,
            IsLatestVersion = true,
            UploadedByUserId = by.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    internal static Document CreateNextVersion(Guid applicationId, Guid workflowStepId,
                                                Document previous, DocumentParams p, AppUser by)
    {
        return new Document
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            WorkflowStepId = workflowStepId,
            DocumentTypeId = p.DocumentTypeId,
            DisplayName = p.DisplayName ?? previous.DisplayName,
            OriginalFileName = p.OriginalFileName,
            StoragePath = p.StoragePath,
            ContentType = p.ContentType,
            FileSizeBytes = p.FileSizeBytes,
            Version = previous.Version + 1,
            IsLatestVersion = true,
            ParentDocumentId = previous.Id,
            UploadedByUserId = by.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void MarkAsOldVersion()
    {
        IsLatestVersion = false;
    }

    internal void Archive()
    {
        IsArchived = true;
    }
}

// ─────────────────────────────────────────────────────────────────────────────

public class Comment : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public Guid WorkflowStepId { get; private set; }
    public string Text { get; private set; }
    public bool IsDeleted { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private Comment() { }

    internal static Comment Create(Guid applicationId, Guid workflowStepId,
                                    string text, AppUser by)
    {
        return new Comment
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            WorkflowStepId = workflowStepId,
            Text = text.Trim(),
            IsDeleted = false,
            CreatedByUserId = by.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void Edit(string newText)
    {
        Text = newText.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    internal void Delete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

// ─────────────────────────────────────────────────────────────────────────────

public class EmailAttachment : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public Guid WorkflowStepId { get; private set; }
    public string Subject { get; private set; }
    public string FromEmail { get; private set; }
    public DateTimeOffset SentAt { get; private set; }
    public EmailDirection Direction { get; private set; }
    public string? BodySummary { get; private set; }
    public string? FilePath { get; private set; }   // .eml / .msg ha feltöltve
    public bool IsDeleted { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    private EmailAttachment() { }

    internal static EmailAttachment Create(Guid applicationId, Guid workflowStepId,
                                            EmailAttachmentParams p, AppUser by)
    {
        return new EmailAttachment
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            WorkflowStepId = workflowStepId,
            Subject = p.Subject,
            FromEmail = p.FromEmail,
            SentAt = p.SentAt,
            Direction = p.Direction,
            BodySummary = p.BodySummary,
            FilePath = p.FilePath,
            CreatedByUserId = by.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void Delete() => IsDeleted = true;
}

public enum EmailDirection { Inbound = 1, Outbound = 2 }
```

---

### 12.9 ProofRecord és Settlement entitások

```csharp
public class ProofRecord : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public ProofType ProofType { get; private set; }
    public DateOnly? EventDate { get; private set; }
    public DateOnly? DeliveryDate { get; private set; }
    public string? Description { get; private set; }
    public Guid? BudgetItemId { get; private set; }
    public bool IsDeleted { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    // A fotók a WorkflowSteps[Proof].Documents-ben tárolódnak
    // A ProofRecordParams tartalmazza, hogy mely Document ID-k a fotók
    public IReadOnlyList<Guid> PhotoDocumentIds { get; private set; } = [];

    private ProofRecord() { }

    internal static ProofRecord Create(Guid applicationId, ProofRecordParams p, AppUser by)
    {
        if (p.ProofType == ProofType.Event && p.EventDate == null)
            throw new DomainException("Esemény típusú igazoláshoz az esemény dátuma kötelező.");
        if (p.ProofType == ProofType.AssetDelivery && p.DeliveryDate == null)
            throw new DomainException("Tárgyi teljesítés igazoláshoz az átvétel dátuma kötelező.");
        if (!p.PhotoDocumentIds.Any())
            throw new DomainException("Igazoláshoz legalább egy fotó kötelező.");

        return new ProofRecord
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            ProofType = p.ProofType,
            EventDate = p.EventDate,
            DeliveryDate = p.DeliveryDate,
            Description = p.Description,
            BudgetItemId = p.BudgetItemId,
            PhotoDocumentIds = p.PhotoDocumentIds.ToList().AsReadOnly(),
            CreatedByUserId = by.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void Delete()
    {
        IsDeleted = true;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public enum ProofType { Event = 1, AssetDelivery = 2 }

// ─────────────────────────────────────────────────────────────────────────────

public class Settlement : Entity<Guid>
{
    public Guid ApplicationId { get; private set; }
    public DateOnly SettlementDate { get; private set; }
    public Guid? SettlementMethodId { get; private set; }
    public string? Summary { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public Guid? ApprovedByUserId { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public bool IsApproved => ApprovedAt.HasValue;

    private Settlement() { }

    internal static Settlement Create(Guid applicationId, SettlementParams p, AppUser by)
    {
        return new Settlement
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            SettlementDate = p.SettlementDate,
            SettlementMethodId = p.SettlementMethodId,
            Summary = p.Summary,
            CreatedByUserId = by.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }

    internal void Approve(AppUser approver)
    {
        if (IsApproved)
            throw new DomainException("Az elszámolás már jóvá van hagyva.");
        ApprovedAt = DateTimeOffset.UtcNow;
        ApprovedByUserId = approver.Id;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
```

---

### 12.10 Params rekordok (Command/Application réteg határán)

Ezek a rekordok a command réteg és a domain réteg közötti adatátadást végzik. Nem value object-ek (nem tartalmaznak üzleti logikát), de immutable-ok.

```csharp
public record BudgetItemParams(
    string Name,
    BudgetItemType ItemType,
    Money PlannedAmount,
    string? Description
);

public record VendorContractParams(
    Guid VendorId,
    DateOnly ContractDate,
    string? ContractIdentifier,
    Money Amount,
    Guid? BudgetItemId
);

public record InvoiceParams(
    string SupplierName,
    string InvoiceNumber,
    DateOnly IssuedDate,
    Money Amount,
    Guid? VendorContractId,
    Guid? BudgetItemId
);

public record ProofRecordParams(
    ProofType ProofType,
    DateOnly? EventDate,
    DateOnly? DeliveryDate,
    string? Description,
    Guid? BudgetItemId,
    IList<Guid> PhotoDocumentIds
);

public record DocumentParams(
    Guid DocumentTypeId,
    string? DisplayName,
    string OriginalFileName,
    string StoragePath,
    string ContentType,
    long FileSizeBytes
);

public record EmailAttachmentParams(
    string Subject,
    string FromEmail,
    DateTimeOffset SentAt,
    EmailDirection Direction,
    string? BodySummary,
    string? FilePath
);
```

---

### 12.11 WorkflowOrchestrationService implementáció

```csharp
public class WorkflowOrchestrationService : IWorkflowOrchestrationService
{
    // Lépés definíciók: (típus, sorrend, kihagyható-e)
    private static readonly IReadOnlyList<(WorkflowStepType Type, int Order, bool IsSkippable)>
        StepDefinitions = new[]
        {
            (WorkflowStepType.Call,            1, false),
            (WorkflowStepType.Submission,      2, false),
            (WorkflowStepType.Result,          3, false),
            (WorkflowStepType.GranterContract, 4, true),
            (WorkflowStepType.BudgetPlan,      5, false),
            (WorkflowStepType.VendorContracts, 6, true),
            (WorkflowStepType.Invoices,        7, false),
            (WorkflowStepType.Proof,           8, true),
            (WorkflowStepType.Settlement,      9, false),
        };

    public IReadOnlyList<WorkflowStep> CreateInitialSteps(Guid applicationId)
    {
        return StepDefinitions
            .Select(def => new WorkflowStep(applicationId, def.Type,
                                             def.Order, def.IsSkippable))
            .ToList()
            .AsReadOnly();
    }

    public WorkflowTransitionResult ValidateCompletion(
        WorkflowStep step, Application application)
    {
        var errors = new List<string>();

        switch (step.StepType)
        {
            case WorkflowStepType.Submission:
                if (application.SubmissionData?.SubmittedAt == null)
                    errors.Add("A beadás időpontja kötelező a lépés lezárásához.");
                break;

            case WorkflowStepType.Result:
                if (application.Result == null)
                    errors.Add("Az eredmény rögzítése kötelező.");
                break;

            case WorkflowStepType.BudgetPlan:
                if (application.BudgetPlan == null || !application.BudgetPlan.Items.Any())
                    errors.Add("Legalább egy költési terv tétel szükséges.");
                break;

            case WorkflowStepType.Invoices:
                if (!application.Invoices.Any(i => !i.IsArchived))
                    errors.Add("Legalább egy számla rögzítése kötelező.");
                break;

            case WorkflowStepType.Proof:
                if (!application.ProofRecords.Any(p => !p.IsDeleted))
                    errors.Add("Legalább egy teljesítési igazolás szükséges.");
                break;

            case WorkflowStepType.Settlement:
                if (application.Settlement == null)
                    errors.Add("Az elszámolás rögzítése kötelező.");
                break;
        }

        return errors.Any()
            ? WorkflowTransitionResult.Failure(errors)
            : WorkflowTransitionResult.Success();
    }

    public void HandleNegativeResult(Application application)
    {
        foreach (var step in application.WorkflowSteps
                     .Where(s => s.Order >= 4))
        {
            step.SetNotApplicable();
        }
    }

    public void LockAllSteps(Application application)
    {
        foreach (var step in application.WorkflowSteps)
            step.Lock();
    }

    public WorkflowStep? DetermineNextActiveStep(Application application)
    {
        // Kihagyott lépéseket kihagyjuk
        return application.WorkflowSteps
            .Where(s => s.Status == WorkflowStepStatus.Pending)
            .OrderBy(s => s.Order)
            .FirstOrDefault();
    }
}

public record WorkflowTransitionResult(bool IsSuccess, IReadOnlyList<string> Errors)
{
    public static WorkflowTransitionResult Success() =>
        new(true, Array.Empty<string>());
    public static WorkflowTransitionResult Failure(IList<string> errors) =>
        new(false, errors.ToList().AsReadOnly());
}
```

---

## 13. Projekció query-k (olvasási oldal)

A domain entitások csak write-oldalhoz kerülnek betöltésre. Olvasási célokra EF Core projekciókat (`Select()`) használunk, amelyek közvetlenül DTO-kba vetítenek anélkül, hogy az aggregátot teljes egészében memóriába töltenék.

### 13.1 ApplicationListProjection

```csharp
// Pályázatlista nézethez – csak a szükséges mezők
public record ApplicationListProjection(
    Guid Id,
    string Title,
    string? Identifier,
    string GranterName,
    string Status,
    DateTimeOffset SubmissionDeadline,
    DateOnly? SpendingDeadline,
    decimal? AwardedAmount,
    string? CurrentStepType,
    string? CurrentStepStatus,
    DateTimeOffset UpdatedAt,
    bool IsDeadlineApproaching,   // kalkulált: deadline <= most + 7 nap
    bool IsDeadlineMissed         // kalkulált: deadline < most és nincs beadva
);

// EF Core query (a Repository implementációban):
var query = _context.Applications
    .AsNoTracking()
    .Where(a => !a.IsArchived)
    .Select(a => new ApplicationListProjection(
        a.Id,
        a.Title,
        a.Identifier,
        a.Granter.Name,
        a.Status.ToString(),
        a.CallData.SubmissionDeadline,
        a.CallData.SpendingDeadline,
        a.Res_AwardedAmount,
        a.WorkflowSteps
            .Where(s => s.Status == WorkflowStepStatus.Active)
            .OrderBy(s => s.Order)
            .Select(s => s.StepType.ToString())
            .FirstOrDefault(),
        // ...
        a.CallData.SubmissionDeadline <= DateTimeOffset.UtcNow.AddDays(7)
            && a.Status == ApplicationStatus.Draft,
        a.CallData.SubmissionDeadline < DateTimeOffset.UtcNow
            && a.Status == ApplicationStatus.Draft
    ));
```

### 13.2 ApplicationDetailProjection

```csharp
// Pályázat részletes nézethez
public record ApplicationDetailProjection(
    Guid Id,
    string Title,
    string? Identifier,
    string? Description,
    string Status,
    bool IsLocked,
    bool IsArchived,

    // Granter
    Guid GranterId,
    string GranterName,

    // Felhívás adatok
    string? ApplicationTypeName,
    decimal? MinAmount,
    decimal? MaxAmount,
    DateTimeOffset SubmissionDeadline,
    DateOnly? SpendingDeadline,

    // Beadás
    DateTimeOffset? SubmittedAt,

    // Eredmény
    string? ResultOutcome,
    DateOnly? ResultDate,
    decimal? AwardedAmount,

    // Pénzügyi összesítő
    decimal TotalPlannedAmount,
    decimal TotalInvoicedAmount,
    decimal TotalPaidAmount,
    decimal RemainingBudget,
    decimal InvoiceCoveragePercent,

    // Munkafolyamat lépések
    IList<WorkflowStepSummary> WorkflowSteps,

    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public record WorkflowStepSummary(
    Guid Id,
    string StepType,
    string Status,
    int Order,
    bool IsSkippable,
    string? SkippedReason,
    DateTimeOffset? CompletedAt,
    string? CompletedByName,
    DateTimeOffset? ApprovedAt,
    string? ApprovedByName,
    int DocumentCount,
    int CommentCount,
    int EmailCount
);
```

### 13.3 Pénzügyi összesítő projekció

```csharp
public record FinancialSummaryProjection(
    Guid ApplicationId,
    decimal AwardedAmount,
    decimal TotalPlanned,
    decimal TotalInvoiced,
    decimal TotalPaid,
    decimal TotalUnpaid,
    decimal RemainingBudget,
    decimal CoveragePercent,
    bool ExceedsAwardedAmount,
    bool MeetsSettlementThreshold,  // >= 80%
    IList<InvoiceSummary> Invoices
);

public record InvoiceSummary(
    Guid Id,
    string SupplierName,
    string InvoiceNumber,
    DateOnly IssuedDate,
    decimal Amount,
    bool IsPaid,
    DateOnly? PaidAt,
    string? VendorContractIdentifier,
    string? BudgetItemName
);
```

---

## 14. Domain modell és adatbázis séma összefüggés-térkép

Az alábbi táblázat azt mutatja meg, hogy az egyes domain osztályok hogyan mappelnek az adatbázis táblákra, és mi az EF Core stratégia.

| Domain osztály | DB tábla | EF Core stratégia | Megjegyzés |
|---|---|---|---|
| `Application` | `Applications` | Root entity, owned entities inline | RowVersion concurrency |
| `CallStepData` | `Applications` (inline) | `OwnsOne()` | Owned entity, nincs saját tábla |
| `SubmissionStepData` | `Applications` (inline, Sub_ prefix) | `OwnsOne()` | Nullable owned |
| `ApplicationResult` | `Applications` (inline, Res_ prefix) | `OwnsOne()` | Nullable owned |
| `GranterContractData` | `Applications` (inline, GC_ prefix) | `OwnsOne()` | Nullable owned |
| `WorkflowStep` | `WorkflowSteps` | `HasMany()`, Cascade delete | Unique constraint (AppId+StepType) |
| `Document` | `Documents` | `HasMany()` via WorkflowStep | Global query filter (IsArchived) |
| `Comment` | `Comments` | `HasMany()` via WorkflowStep | Global query filter (IsDeleted) |
| `EmailAttachment` | `EmailAttachments` | `HasMany()` via WorkflowStep | Global query filter (IsDeleted) |
| `BudgetPlan` | `BudgetPlans` | `HasOne()`, unique AppId | 1:1 az Application-hoz |
| `BudgetItem` | `BudgetItems` | `HasMany()` via BudgetPlan | – |
| `VendorContract` | `VendorContracts` | `HasMany()` | – |
| `Invoice` | `Invoices` | `HasMany()` | DB constraint: paid→paidAt |
| `ProofRecord` | `ProofRecords` | `HasMany()` | – |
| `Settlement` | `Settlements` | `HasOne()`, unique AppId | 1:1 az Application-hoz |
| `Money` | Inline az adott táblában | `OwnsOne()` | Amount + Currency oszlopok |
| `Granter` | `Granters` | Root entity | RowVersion concurrency |
| `Vendor` | `Vendors` | Root entity | RowVersion concurrency |
| `CodeList` | `CodeLists` | Root entity | – |
| `CodeListItem` | `CodeListItems` | `HasMany()`, Unique (CodeListId+Code) | Global filter (Status=Active) |
| `AppUser` | `AppUsers` | Root entity | NotificationPreferences inline |
| `NotificationPreferences` | `AppUsers` (inline) | `OwnsOne()` | – |
| `Notification` | `Notifications` | Root entity | Partial index (UserId+IsRead) |
| `AuditLog` | `AuditLogs` | Append-only, nincs aggregát | BIGSERIAL Id |

---

## 15. Modell konzisztencia-ellenőrzési összefoglaló

Ez a fejezet egyetlen helyen összegyűjti az összes helyet, ahol a domain integritás érvényesül – mint egy "honnan jön a szabály" referencia a fejlesztőcsapat számára.

```
SZABÁLY                                    TÍPUS    HOL ÉRVÉNYESÜL
────────────────────────────────────────────────────────────────────────────
Money.Amount >= 0                          Hard     Money konstruktor
Money devizanem egyezés                    Hard     Money.Add/Subtract
TaxNumber formátum                         Soft     TaxNumber.IsValid property
EmailAddress formátum                      Hard     EmailAddress konstruktor
SubmissionDeadline <= SpendingDeadline     Hard     CallStepData konstruktor
MinAmount <= MaxAmount                     Hard     CallStepData konstruktor
AwardedAmount > 0 (ha Won)                Hard     ApplicationResult.Won()
Result kötelező Won-hoz                   Hard     ApplicationResult.Won()
Budget > AwardedAmount figyelmeztető       Soft     Domain Event (BudgetExceeds...)
Invoice összeg > AwardedAmount figyelmez.  Soft     Domain Event (InvoicesTotalExceeds...)
Invoice paidAt >= issuedDate              Hard     Invoice.MarkPaid() + DB constraint
Invoice isPaid → paidAt kötelező          Hard     Invoice.MarkPaid() + DB CHECK
ProofRecord legalább 1 fotó              Hard     Application.AddProofRecord()
ProofType.Event → EventDate kötelező     Hard     ProofRecord.Create()
ProofType.Asset → DeliveryDate kötelező  Hard     ProofRecord.Create()
BudgetItem törlés → nincs kapcsolt számla Hard     Application.RemoveBudgetItem()
VendorContract törlés → nincs számla     Hard     Application.RemoveVendorContract()
LOCKED állapot → módosítás tiltott       Hard     Application.EnsureNotLocked()
ARCHIVED állapot → módosítás tiltott     Hard     Application.EnsureNotArchived()
Won státusz szükséges pénzügyihez        Hard     Application.EnsureWon()
Granter.Name egyedi                       Hard     Repository szint
Vendor.Name egyedi                        Hard     Repository szint
CodeListItem.Code egyedi CodeList-en belül Hard     CodeList.AddItem()
Rendszer CodeList nem törölhető           Hard     CodeList.Delete()
Legalább 1 Admin felhasználó              Hard     Application Service szint
Admin nem deaktiválja önmagát             Hard     Application Service szint
Saját megjegyzés szerkesztése/törlése     Hard     Application.EditComment/DeleteComment
Megjegyzés nem üres                       Hard     Application.AddComment()
Elszámolás 80% fedezettség figyelmez.     Soft     IBudgetValidationService
Jóváhagyás jogkör (Elnök vagy Admin)      Hard     AppUser.CanApprove()
Kihagyható lépések listája                Hard     WorkflowStep.IsSkippable
Lépés visszaállítás = Admin/Elnök        Hard     Application.ReactivateStep()
────────────────────────────────────────────────────────────────────────────
```

---

---

## CR2 — Multi-tenant Owner/Foundation hierarchia (Change Request 2)

**Kapcsolódó FS-szakaszok:** 4. (szerepkörök), 5. (jogosultsági modell), 26. (admin funkciók), 29. (audit), 31.2 (jogosultság), 32.1 (adatkezelés), NK-04 + NK-13..NK-20 lezárt döntések.

**Hatókör:** ez a fejezet a meglévő (1–12.) domain modellt **kiegészíti** egy háromszintű tenancy-réteggel (Platform → Owner → Foundation). A korábban single-tenantként értelmezett aggregátumok (`Application`, `Granter`, `Vendor`, `CodeList`, `Notification`, `AuditLog`) változatlan struktúrával működnek, de mostantól mind **egy konkrét Foundation kontextusában** élnek, és minden gyökéraggregátum kötelező `OwnerId` és `FoundationId` mezővel rendelkezik. A `AppUser` aggregátum jelentősen kibővül a felhasználó↔hatókör hozzárendelésekkel.

### CR2.1 Új Bounded Context: Tenancy

A CR2 egy új, vékony Bounded Context-et vezet be `Tenancy` néven, amely a többi Bounded Context felett áll. A Tenancy felelőssége:

- Owners (tulajdonosok) lifecycle-kezelése
- Foundations (alapítványok) lifecycle-kezelése egy Owner-en belül
- Felhasználói hatókör-hozzárendelések (Platform/Owner/Foundation) kezelése
- Break-glass hozzáférés-engedélyek kiállítása és visszavonása

A Tenancy Bounded Context **nem ismer** üzleti fogalmakat (pályázat, számla, dokumentum stb.). A meglévő Application/Granter/Vendor/CodeList Bounded Context-ek a Tenancy felé csak a `FoundationId` discriminátoron keresztül kapcsolódnak.

```
┌────────────────────────────────────────────────────────────┐
│  Tenancy BC (új)                                           │
│    Platform                                                │
│      └── Owner (1 → N Foundation)                          │
│             └── Foundation                                 │
│                    ↑                                       │
│           FoundationId / OwnerId discriminator             │
│                    ↓                                       │
│  Application / Granter / Vendor / CodeList / Notification  │
│  (meglévő Bounded Context-ek, scope-olva)                  │
└────────────────────────────────────────────────────────────┘
```

### CR2.2 Új aggregátumok

#### CR2.2.1 `Owner` aggregátum (Tenancy BC)

**Aggregát gyökér.** Egy tulajdonos szervezetet képvisel, amely egy vagy több alapítványt birtokol.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `Id` | `Guid` | Aggregát gyökér ID |
| `Name` | `string` | Tulajdonos szervezet neve |
| `ContactEmail` | `EmailAddress` (VO) | Technikai kapcsolattartó |
| `Status` | `OwnerStatus` enum | `ACTIVE`, `SUSPENDED`, `ARCHIVED` |
| `CreatedAt`, `UpdatedAt` | `DateTimeOffset` | Audit-mezők |

**Domain műveletek:** `Owner.Create()`, `Suspend()`, `Reactivate()`, `Archive()`.

**Invariánsok:**
- Csak `ACTIVE` állapotú Owner alá hozható létre új Foundation.
- `Archive()` csak akkor engedélyezett, ha minden alá tartozó Foundation előzőleg `ARCHIVED` vagy migrált.

**Domain események:** `OwnerProvisioned`, `OwnerSuspended`, `OwnerReactivated`, `OwnerArchived`.

#### CR2.2.2 `Foundation` aggregátum (Tenancy BC)

**Aggregát gyökér.** Egy konkrét alapítványt képvisel, amely egy Owner alá tartozik.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `Id` | `Guid` | Aggregát gyökér ID |
| `OwnerId` | `Guid` | A szülő Owner referenciája |
| `Name` | `string` | Megjelenítendő alapítványnév |
| `LogoUri` | `string?` | Branding (NK-19 alapján csak ezen a szinten) |
| `Status` | `FoundationStatus` enum | `ACTIVE`, `ARCHIVED` |
| `CreatedAt`, `UpdatedAt` | `DateTimeOffset` | Audit-mezők |

**Domain műveletek:**

- `Foundation.Create(ownerId, name, logoUri, templateFoundationId?)` — új alapítvány létrehozása. Ha `templateFoundationId` meg van adva, **NK-15** szabály szerint a sablonalapítvány aktív `Granters` és `Vendors` aggregátumai átmásolódnak az új alapítványba (snapshot — nem referencia). A sablonalapítvány csak ugyanazon Owner-en belül választható.
- `Foundation.Rename(newName)` — átnevezés (kiváltja `FoundationRenamed` eseményt + `FOUNDATION_RENAMED` audit-bejegyzést).
- `Foundation.UpdateLogo(logoUri)` — logó URL frissítése; a fájltárolás architektúrális részleteit lásd `architecture-plan.md` CR2.F.
- `Foundation.Archive()` — archiválás **kaszkád viselkedéssel**: minden aktív `FoundationUserAssignment` automatikusan inaktiválódik (`IsActive = false`, `RevokedAt = now`). A művelet kiváltja a `FoundationArchived` domain event-et, amelyet az application service event handler dolgoz fel: invalidálja az érintett felhasználók aktív JWT-it (cache-üzenet), és audit-bejegyzéseket készít minden inaktivált hozzárendelésről (`FoundationAssignmentRevoked`).

**Invariánsok:**
- Egy Foundation legfeljebb egy Owner-hez tartozhat (immutable `OwnerId`).
- `Archive()` csak akkor engedélyezett, ha nincs aktív (nem lezárt: `IN_PROGRESS`, `SUBMITTED`, `WON`) `Application` az alapítványon belül.
- `Foundation.Create()` során az Owner-szintű kódszótár-sablon automatikusan átmásolódik (lásd CR2.2.4).
- `Foundation.Create()` `templateFoundationId` paramétere esetén a sablonalapítvány `OwnerId`-je meg kell egyezzen az új Foundation `OwnerId`-jével (Application Service szinten ellenőrzött).
- Archivált Foundation adatai **csak break-glass módban vagy Owner-szintű audit naplóból** olvashatók — query filter `IgnoreQueryFilters()` whitelist callsite-okról (architecture-plan CR2.E.2).

**Domain események:** `FoundationCreated`, `FoundationRenamed`, `FoundationArchived`, `FoundationAssignmentRevoked` (kaszkád).

#### CR2.2.3 `FoundationUserAssignment` (entitás `AppUser` aggregáton belül)

A meglévő `AppUser` aggregátumon belüli entitás. Egy felhasználó és egy alapítvány közti hozzárendelést képvisel, megadva a felhasználó szerepkörét az adott alapítványon belül.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `Id` | `Guid` | Hozzárendelés ID |
| `FoundationId` | `Guid` | Az érintett alapítvány |
| `FoundationRole` | `FoundationRole` enum | `FoundationAdmin`, `Elnok`, `PalyazatiMunkatars`, `Penzugyes`, `Megtekinto` |
| `AssignedAt` | `DateTimeOffset` | Mikor lett kiosztva |
| `AssignedByUserId` | `Guid` | Ki osztotta ki |
| `IsActive` | `bool` | Inaktiválás támogatása |

**Invariánsok:** lásd CR2.4.

#### CR2.2.4 Owner-szintű kódszótár-sablon (`OwnerCodeListTemplate`)

**Aggregát gyökér** (Tenancy BC). A `CodeList` aggregátum mellett, **Owner-szintű** sablonok az új alapítványok alapértelmezett kódszótárainak forrása (NK-16). Új Foundation létrehozásakor a sablon tételei átmásolódnak (snapshot, nem referencia).

A meglévő `CodeList` aggregátum struktúrája változatlan; a sablonok **különálló entitások** ugyanazzal a sémával, csak Owner-scope-pal.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `Id` | `Guid` | Aggregát gyökér |
| `OwnerId` | `Guid` | Szülő Owner |
| `Name` | `string` | Sablon megnevezése |
| `Items` | `IReadOnlyCollection<OwnerCodeListTemplateItem>` | Sablon-tételek (`Code`, `Label`, `SortOrder`, `IsActive`) |
| `CreatedAt`, `UpdatedAt` | `DateTimeOffset` | Audit-mezők |

**Domain műveletek:**

- `OwnerCodeListTemplate.Create(ownerId, name)` — új sablon létrehozása.
- `AddItem(code, label)`, `UpdateItem(id, ...)`, `DeactivateItem(id)` — tétel CRUD.
- `ApplyToNewFoundation(foundationId)` — új Foundation létrehozásakor automatikusan meghívott; a teljes aktív sablon átmásolódik az új Foundation `CodeList`-jébe snapshot-ként.
- `ApplyToExistingFoundation(foundationId)` — **merge-művelet** US-214 AC4: a sablon hiányzó tételeit (azonos `Code` alapján) hozzáadja az adott Foundation már létező `CodeList`-jéhez. **Meglévő tételeket nem ír felül** és nem deaktivál. Kiváltja a `CodeListTemplateApplied` domain event-et és audit-bejegyzést (`CODE_LIST_TEMPLATE_APPLIED`) készít a Foundation-szintű naplóban (érintett tételek darabszáma + lista).

**Invariánsok:**
- Egy `Code` érték a sablonon belül egyedi.
- `ApplyToExistingFoundation()` csak ugyanazon Owner-hez tartozó Foundation-re engedélyezett.
- Üres tételhalmazú sablon `Apply*` művelete `DomainException`-t dob.

**Domain események:** `OwnerCodeListTemplateCreated`, `OwnerCodeListTemplateUpdated`, `CodeListTemplateApplied`.

#### CR2.2.5 `Invitation` aggregátum (Tenancy BC)

**Aggregát gyökér.** A többszintű meghívási folyamatot reprezentálja (Platform / Owner / Foundation szintekre szóló meghívók). Egységes aggregátum mind a négy meghívó-típushoz (US-200, US-203, US-210, US-212, US-213, US-221).

| Mező | Típus | Megjegyzés |
|---|---|---|
| `Id` | `Guid` | Aggregát gyökér |
| `Email` | `EmailAddress` (VO) | Meghívott e-mail címe |
| `Scope` | `AssignmentScope` enum | `PLATFORM` / `OWNER` / `FOUNDATION` |
| `TargetOwnerId` | `Guid?` | Cél Owner (Owner/Foundation scope esetén kötelező) |
| `TargetFoundationId` | `Guid?` | Cél Foundation (Foundation scope esetén kötelező) |
| `IntendedRole` | `string` | A kiosztandó szerepkör string-reprezentációja: `PlatformAdmin`/`PlatformAuditor`/`OwnerAdmin`/`OwnerAuditor`/`FoundationAdmin`/`Elnok`/`PalyazatiMunkatars`/`Penzugyes`/`Megtekinto` |
| `EmbeddedAssignments` | `IReadOnlyCollection<EmbeddedFoundationAssignment>` | Owner-meghívóhoz kapcsolódó alapítvány-szintű hozzárendelések listája (US-213 AC3) — aktiváláskor érvényesülnek |
| `Token` | `string` | Időkorlátos, egyszer használatos elfogadási token (hash-elve tárolva) |
| `Status` | `InvitationStatus` enum | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |
| `IssuedAt` | `DateTimeOffset` | Kiállítás |
| `ExpiresAt` | `DateTimeOffset` | Default: `IssuedAt` + `PlatformSettings.InvitationValidityHours` |
| `AcceptedAt` | `DateTimeOffset?` | Elfogadás időpontja |
| `RevokedAt` | `DateTimeOffset?` | Visszavonás időpontja |
| `IssuedByUserId` | `Guid` | A meghívót kiállító `AppUser.Id` |

**Beágyazott entitás:** `EmbeddedFoundationAssignment { FoundationId: Guid, Role: FoundationRole }` — csak az Owner-meghívóban használt.

**Domain műveletek:**

- `Invitation.IssuePlatform(email, role, issuedBy)` — Platform-meghívó (Scope=PLATFORM).
- `Invitation.IssueOwner(email, targetOwnerId, role, embeddedAssignments, issuedBy)` — Owner-meghívó (Scope=OWNER, kötelezően `OwnerAdmin` vagy `OwnerAuditor` szerepkör, opcionálisan embedded alapítvány-hozzárendelésekkel).
- `Invitation.IssueFoundation(email, targetFoundationId, role, issuedBy)` — Foundation-meghívó (Scope=FOUNDATION).
- `Invitation.Accept(googleId)` — elfogadás; létrehozza vagy megnyitja a megfelelő `AppUser`-t, kiosztja a szerepköröket az `IntendedRole` + `EmbeddedAssignments` alapján. Aktiváláskor minden `EmbeddedAssignment` egy-egy `FoundationAssignmentCreated` eseményt vált ki.
- `Invitation.Revoke(revokedBy)` — visszavonás (`PENDING` → `REVOKED`).
- `Invitation.Resend()` — új token generálása + `ExpiresAt` újraszámítása (`EXPIRED`/`REVOKED` → `PENDING`).
- `Invitation.ExpireIfDue(now)` — `PENDING` állapotú meghívó lejárati ellenőrzése (Hangfire job vagy lazy ellenőrzés).

**Invariánsok (Hard, US-221 AC alapján):**

| Invariáns | Forrás | Érvényesítés |
|---|---|---|
| `Scope = PLATFORM` esetén `TargetOwnerId` és `TargetFoundationId` egyaránt `null`; `IntendedRole ∈ {PlatformAdmin, PlatformAuditor}` | US-221 AC1 | Aggregátum konstruktor |
| `Scope = OWNER` esetén `TargetOwnerId` kötelező, `TargetFoundationId` `null`; `IntendedRole ∈ {OwnerAdmin, OwnerAuditor}` | US-221 AC1 | Aggregátum konstruktor |
| `Scope = FOUNDATION` esetén `TargetFoundationId` kötelező, `IntendedRole ∈ FoundationRole` enum értékei | US-221 AC1 | Aggregátum konstruktor |
| Egy adott `Email` + `Scope` kombinációhoz egyszerre csak egy `PENDING` `Invitation` létezhet | US-221 AC4 | Application Service uniqueness check (UNIQUE index `(Email, Scope, Status WHERE Status='PENDING')`) |
| Owner-meghívó `EmbeddedAssignments` listájában minden Foundation a `TargetOwnerId`-hez tartozik | US-213 AC3 | Domain service létrehozáskor |
| Elfogadás során, ha az e-mail már egy másik Owner-hez tartozó aktív `AppUser`-höz tartozik, `Accept()` `DomainException` (NK-13) | US-221 AC3 | `Invitation.Accept()` |
| `Token` egyszer használatos: `Accept()` után új `Accept()` hívás `DomainException` | – | Status-átmenet (`ACCEPTED` terminál) |
| `Resend()` csak `EXPIRED` vagy `REVOKED` állapotból; `ACCEPTED`-ből nem | – | Status-guard |

**Hatókör-szintű kiállítási jogosultság (Application Service):**

| Meghívó scope | Ki állíthatja ki |
|---|---|
| `PLATFORM` | PlatformAdmin |
| `OWNER` | PlatformAdmin |
| `FOUNDATION` | PlatformAdmin **vagy** az érintett Owner OwnerAdmin-ja **vagy** az érintett alapítvány FoundationAdmin-ja |

A jogosultság-ellenőrzés application service szinten történik (új policies a `architecture-plan` CR2.D.3-ban: `CanIssuePlatformInvitation`, `CanIssueOwnerInvitation`, `CanIssueFoundationInvitation`).

**Domain események:** `InvitationIssued`, `InvitationAccepted`, `InvitationRevoked`, `InvitationResent`, `InvitationExpired`.

#### CR2.2.6 `PlatformSettings` aggregátum (Tenancy BC)

**Aggregát gyökér** (singleton). A platform-szintű technikai konfiguráció tárolása (US-204). A rendszerben **mindig pontosan egy** `PlatformSettings` rekord létezik, amelyet a `DataSeeder` hoz létre.

| Mező | Típus | Megjegyzés |
|---|---|---|
| `Id` | `Guid` | Aggregát gyökér (fix sentinel érték: `00000000-0000-0000-0000-000000000001`) |
| `MaxFileSizeMb` | `int` | Maximum fájlméret (default: 50) |
| `InvitationValidityHours` | `int` | Meghívó érvényessége órákban (default: 72) |
| `NotificationLeadDays` | `int` | Értesítési előfigyelmeztetés napjai (default: 7) |
| `DefaultOwnerCodeListTemplateId` | `Guid?` | Alapértelmezett Owner-szintű kódszótár-sablon (új Owner provisioningnál örökítendő) |
| `UpdatedAt` | `DateTimeOffset` | Utolsó módosítás |
| `UpdatedByUserId` | `Guid` | Utolsó módosító |

**Domain műveletek:** `PlatformSettings.Update(maxFileSizeMb, invitationValidityHours, notificationLeadDays, defaultTemplateId, updatedBy)`.

**Invariánsok (Hard, US-204 AC alapján):**
- `MaxFileSizeMb` ∈ `[1, 500]`, pozitív egész.
- `InvitationValidityHours` ∈ `[1, 720]` (max 30 nap), pozitív egész.
- `NotificationLeadDays` ∈ `[1, 90]`, pozitív egész.
- Módosítás **csak új** Owner/Foundation provisioningnál érvényesül; **a meglévő egyedi beállításokat nem írja felül** (US-204 AC3). Ezt a `Owner`/`Foundation` aggregátumok saját beállítás-snapshot mezői biztosítják (lásd CR2.3 bővítés).

**Domain események:** `PlatformSettingsUpdated`.

### CR2.3 Meglévő aggregátumok scope-kiterjesztése

Minden meglévő gyökéraggregátum (`Application`, `Granter`, `Vendor`, `CodeList`, `Notification`) új kötelező mezőket kap:

| Új mező | Típus | Megjegyzés |
|---|---|---|
| `OwnerId` | `Guid` | Származtatott a `FoundationId`-ből, de kötelezően denormalizálva az EF Core query filter optimalizációhoz |
| `FoundationId` | `Guid` | Kötelező hivatkozás a tartalmazó alapítványra |

Az `AuditLog` rekord is megkapja mindkettőt (lásd CR2.6).

A létező invariánsok mind érvényesek maradnak; a scope-mezők **immutability** szabályai:

- Egy aggregátum `FoundationId` mezője a létrehozás után **nem módosítható**. „Pályázat áthelyezése másik alapítványba" nem támogatott művelet az MVP-ben (későbbi CR-be sorolható).
- A `FoundationId` és az `OwnerId` konzisztenciáját az aggregátum létrehozásakor a domain service ellenőrzi: `OwnerId` mindig megegyezik a `Foundation.OwnerId`-vel.

**Owner / Foundation snapshot beállítások (US-204 AC3 alapján):**

Az `Owner` és `Foundation` aggregátumok provisioning időpontjában *snapshot*-ot készítenek a `PlatformSettings` releváns mezőiről. Ezt a snapshot-ot tárolják saját kötelező mezőikben (lásd CR2.10 séma), így a `PlatformSettings.Update()` művelet **nem írja felül** a meglévő Owner/Foundation beállításait:

| Aggregátum | Snapshot mező | Forrás `PlatformSettings`-ből |
|---|---|---|
| `Owner` | `OwnerSettings.MaxFileSizeMb` | `MaxFileSizeMb` (provisioningkor) |
| `Owner` | `OwnerSettings.InvitationValidityHours` | `InvitationValidityHours` (provisioningkor) |
| `Owner` | `OwnerSettings.NotificationLeadDays` | `NotificationLeadDays` (provisioningkor) |
| `Foundation` | `FoundationSettings.NotificationLeadDays` | `Owner.OwnerSettings.NotificationLeadDays` (provisioningkor) |

A Platform-szintű módosítás csak az ezt követően létrehozott Owner/Foundation rekordokra hat (US-204 AC2). Owner-szintű felülbírálás külön endpoint-on engedélyezett (`PATCH /api/v1/owner/settings`), és Owner-snapshot mezőit írja.

### CR2.4 AppUser aggregátum bővítése

A meglévő `AppUser` aggregátum jelentős bővítésen megy keresztül a felhasználó↔hatókör hozzárendelések érdekében.

**Új mezők és entitások a `AppUser` aggregátumon belül:**

| Mező / entitás | Típus | Megjegyzés |
|---|---|---|
| `OwnerId` | `Guid?` | Az Owner, amelyhez a felhasználó tartozik. `null` Platform-szintű felhasználónál. |
| `PlatformRole` | `PlatformRole?` enum | `PlatformAdmin`, `PlatformAuditor` vagy `null` |
| `OwnerRole` | `OwnerRole?` enum | `OwnerAdmin`, `OwnerAuditor` vagy `null` |
| `FoundationAssignments` | `IReadOnlyCollection<FoundationUserAssignment>` | Alapítvány-szintű hozzárendelések listája |

**Új domain műveletek:**

- `AppUser.AssignPlatformRole(PlatformRole role)`
- `AppUser.AssignOwnerRole(Guid ownerId, OwnerRole role)`
- `AppUser.AssignToFoundation(Guid foundationId, FoundationRole role, Guid assignedBy)`
- `AppUser.RevokeFoundationAssignment(Guid foundationId)`
- `AppUser.ChangeFoundationRole(Guid foundationId, FoundationRole newRole, Guid changedBy)`

**Új invariánsok (Hard):**

| Invariáns | Érvényesítés |
|---|---|
| Platform-szintű és Owner/Foundation-szintű szerepkör ugyanazon felhasználón nem keveredhet | `AppUser.AssignPlatformRole()` ellenőrzi, hogy `OwnerId == null` és `FoundationAssignments` üres; megfordítva is. |
| Egy felhasználó legfeljebb egy Owner-hez tartozhat (NK-13) | Az `OwnerId` immutable a létrehozás után; cserélni csak a teljes `AppUser` újra-provisioningjával lehet. |
| Foundation-hozzárendelés csak ugyanahhoz az Owner-hez tartozó Foundation-höz adható | `AssignToFoundation()` lekéri a `Foundation.OwnerId`-t és összeveti az `AppUser.OwnerId`-vel. |
| OwnerAdmin nem oszthat ki Owner-szintű szerepkört (NK-17 előfeltétele) | Application Service szinten ellenőrizve, nem a domain aggregátumban (mert ott a hívó identitása nincs jelen). |
| Utolsó admin szabály minden szinten | Application Service szint: `PlatformAdminCountService`, `OwnerAdminCountService`, `FoundationAdminCountService`. |
| Self-demotion tiltása | Application Service szint: kérelmező identitása ≠ érintett `AppUser.Id`. |

**Új domain események:**

- `PlatformRoleAssigned`, `PlatformRoleRevoked`
- `OwnerRoleAssigned`, `OwnerRoleRevoked`
- `FoundationAssignmentCreated`, `FoundationAssignmentRevoked`, `FoundationRoleChanged`

### CR2.5 Új enumok

```csharp
public enum OwnerStatus { Active, Suspended, Archived }
public enum FoundationStatus { Active, Archived }

public enum PlatformRole { PlatformAdmin, PlatformAuditor }
public enum OwnerRole { OwnerAdmin, OwnerAuditor }
public enum FoundationRole
{
    FoundationAdmin,     // korábban: Admin
    Elnok,
    PalyazatiMunkatars,
    Penzugyes,
    Megtekinto
}

public enum AssignmentScope { Platform, Owner, Foundation }
```

A korábbi `UserRole` enum (`Admin`, `Elnok`, ...) **deprecated**: a CR2 utáni rendszerben az `AppUser` mostantól `PlatformRole?` + `OwnerRole?` + `FoundationAssignments` kombinációval írja le a hozzáférési jogokat. A meghívási folyamatban a `AssignmentScope` jelzi, hogy melyik szintre szól a meghívó.

### CR2.6 Audit napló kiterjesztése

A meglévő `AuditLog` rekord (lásd 4.7) két kötelező új mezőt kap: `OwnerId` (`Guid?`) és `FoundationId` (`Guid?`). Mindkettő `null` lehet platform-szintű eseményeknél.

**Új művelettípusok (teljes lista — US-233 AC2 + CR2 új eseményei):**

| Művelettípus | Kiváltó | Naplózott extra adatok |
|---|---|---|
| `SCOPE_SWITCH` | `POST /me/scope-switch` | Kiinduló és új hatókör (Owner+Foundation), felhasználó |
| `SCOPE_VIOLATION` | `AuthorizationBehaviour` cross-tenant kísérlet detektál | Felhasználó, megkísérelt erőforrás, várt vs. tényleges Owner/Foundation, HTTP path |
| `BREAK_GLASS_ACCESS` | `BreakGlassGrant.Issue()` | PlatformAdmin, érintett Owner, indoklás, kezdő/lejárati időbélyeg |
| `BREAK_GLASS_REVOKED` | `BreakGlassGrant.Revoke()` | Grant ID, visszavonó felhasználó, időbélyeg |
| `BREAK_GLASS_EXPIRED` | `BreakGlassExpirationJob` | Grant ID, eredeti `ExpiresAt`, megállapítás időbélyege |
| `OWNER_PROVISIONED` | `Owner.Create()` | Owner ID, név, kezdő OwnerAdmin |
| `OWNER_SUSPENDED` | `Owner.Suspend()` | Owner ID, ki függesztette fel, indoklás (opcionális) |
| `OWNER_REACTIVATED` | `Owner.Reactivate()` | Owner ID, ki reaktiválta |
| `OWNER_ARCHIVED` | `Owner.Archive()` | Owner ID, ki archiválta |
| `FOUNDATION_CREATED` | `Foundation.Create()` | Foundation ID, név, Owner; **kettős naplózás**: Owner-szintű napló + Foundation-szintű napló (US-210 AC6) |
| `FOUNDATION_RENAMED` | `Foundation.Rename()` | Foundation ID, régi név, új név |
| `FOUNDATION_ARCHIVED` | `Foundation.Archive()` | Foundation ID, archiváló felhasználó, kaszkád-inaktivált assignment-ek száma |
| `CODE_LIST_TEMPLATE_APPLIED` | `OwnerCodeListTemplate.ApplyToExistingFoundation()` | Sablon ID, cél Foundation ID, érintett tételek listája |
| `INVITATION_ISSUED` | `Invitation.Issue*()` | Email, Scope, Target IDs, IntendedRole, IssuedBy |
| `INVITATION_ACCEPTED` | `Invitation.Accept()` | Invitation ID, elfogadó AppUser ID |
| `INVITATION_REVOKED` | `Invitation.Revoke()` | Invitation ID, visszavonó felhasználó (US-165 AC7) |
| `INVITATION_RESENT` | `Invitation.Resend()` | Invitation ID, újraküldő felhasználó, új `ExpiresAt` (US-165 AC7) |
| `INVITATION_EXPIRED` | Hangfire job | Invitation ID, eredeti `ExpiresAt` |

A meglévő művelettípusok (C/U/D, állapotváltás, bejelentkezés, szerepkör-módosítás) változatlanok, csak az új `OwnerId`/`FoundationId` mezőkkel egészülnek ki.

**Megőrzési politika (US-233 AC5 + US-205 AC5 + US-216):**

| Szint | Megőrzési idő | Törölhetőség |
|---|---|---|
| Platform-szintű napló (`OwnerId IS NULL AND FoundationId IS NULL`) | 5 év | **Nem törölhető** — sem soft, sem hard delete; nincs `DELETE` HTTP endpoint, az `AppDbContext.SaveChangesAsync` `EntityState.Deleted` detektálása `AuditLog`-ra `InvalidOperationException`-t dob |
| Owner-szintű napló (`OwnerId IS NOT NULL AND FoundationId IS NULL`) | 5 év | **Nem törölhető** (uaz) |
| Foundation-szintű napló (`FoundationId IS NOT NULL`) | 5 év | **Nem törölhető** (uaz) |

A 5 éves megőrzés Hangfire recurring job (`AuditLogRetentionJob`, napi futás) által felügyelt: a 5 évnél régebbi rekordokat **archív partícióba** mozgatja (külön `AuditLogsArchive` tábla, csak olvasható), nem törli őket. Az archiválás művelete maga `AUDIT_ARCHIVED` audit-bejegyzést készít.

**Háromszintű napló-lekérdezés** (US-233 AC3):

| Szint | Endpoint | Szűrés |
|---|---|---|
| Platform | `GET /api/v1/platform/audit-logs` | `OwnerId IS NULL OR _scope.IsPlatform` — minden cross-Owner esemény látható |
| Owner | `GET /api/v1/owner/audit-logs` | `OwnerId = _scope.OwnerId` — csak a saját Owner összes alapítvány-eseménye |
| Foundation | `GET /api/v1/foundations/{id}/audit-logs` (meglévő US-150/US-151 endpointok) | `FoundationId = _scope.FoundationId` |

**Export jogosultság** (US-205 AC4 + US-216 AC5): CSV export csak `PlatformAdmin`/`PlatformAuditor` (platform-szintű) és `OwnerAdmin`/`OwnerAuditor` (Owner-szintű) számára engedélyezett.

### CR2.7 Break-glass hozzáférés mint aggregátum

A break-glass hozzáférés a Tenancy BC-n belül önálló aggregátumként van modellezve, hogy az életciklusa, lejárata és visszavonása jól nyomon követhető legyen.

**Aggregát neve:** `BreakGlassGrant`

| Mező | Típus | Megjegyzés |
|---|---|---|
| `Id` | `Guid` | Aggregát gyökér |
| `PlatformAdminUserId` | `Guid` | Ki indította |
| `TargetOwnerId` | `Guid` | Melyik Owner-hez |
| `Reason` | `string` | Kötelező indoklás |
| `IssuedAt` | `DateTimeOffset` | Kiállítás |
| `ExpiresAt` | `DateTimeOffset` | Lejárat (default: kiállítás + 24 óra) |
| `Status` | `BreakGlassStatus` enum | `ACTIVE`, `EXPIRED`, `REVOKED` |
| `RevokedAt` | `DateTimeOffset?` | Ha visszavonva |

**Domain műveletek:** `BreakGlassGrant.Issue()`, `Revoke()`, `IsValidAt(DateTimeOffset)`.

**Invariánsok:**
- `ExpiresAt` > `IssuedAt`.
- `Reason` nem üres és minimum 20 karakter.
- `Status` automatikus átmenete `EXPIRED`-ba lejárat után (háttér-job vagy lazy ellenőrzés).

**Domain események:** `BreakGlassActivated`, `BreakGlassRevoked`.

A `BreakGlassGrant.Issue()` művelet kiváltja egy `OwnerNotificationEvent`-et, amit egy domain event handler dolgoz fel és e-mail értesítést küld az érintett OwnerAdmin-nak.

### CR2.8 Új domain események összesítve

| Esemény | Szülő aggregátum | Kiváltó |
|---|---|---|
| `OwnerProvisioned` | `Owner` | `Owner.Create()` |
| `OwnerSuspended` | `Owner` | `Owner.Suspend()` |
| `OwnerReactivated` | `Owner` | `Owner.Reactivate()` |
| `OwnerArchived` | `Owner` | `Owner.Archive()` |
| `FoundationCreated` | `Foundation` | `Foundation.Create()` |
| `FoundationRenamed` | `Foundation` | `Foundation.Rename()` |
| `FoundationArchived` | `Foundation` | `Foundation.Archive()` |
| `PlatformRoleAssigned` | `AppUser` | `AssignPlatformRole()` |
| `PlatformRoleRevoked` | `AppUser` | `RevokePlatformRole()` |
| `OwnerRoleAssigned` | `AppUser` | `AssignOwnerRole()` |
| `OwnerRoleRevoked` | `AppUser` | `RevokeOwnerRole()` |
| `FoundationAssignmentCreated` | `AppUser` | `AssignToFoundation()` |
| `FoundationAssignmentRevoked` | `AppUser` | `RevokeFoundationAssignment()` |
| `FoundationRoleChanged` | `AppUser` | `ChangeFoundationRole()` |
| `BreakGlassActivated` | `BreakGlassGrant` | `Issue()` |
| `BreakGlassRevoked` | `BreakGlassGrant` | `Revoke()` |
| `BreakGlassExpired` | `BreakGlassGrant` | `BreakGlassExpirationJob` (Hangfire) |
| `InvitationIssued` | `Invitation` | `IssuePlatform/Owner/Foundation()` |
| `InvitationAccepted` | `Invitation` | `Accept()` |
| `InvitationRevoked` | `Invitation` | `Revoke()` |
| `InvitationResent` | `Invitation` | `Resend()` |
| `InvitationExpired` | `Invitation` | Hangfire job |
| `OwnerCodeListTemplateCreated` | `OwnerCodeListTemplate` | `Create()` |
| `OwnerCodeListTemplateUpdated` | `OwnerCodeListTemplate` | `AddItem/UpdateItem/DeactivateItem` |
| `CodeListTemplateApplied` | `OwnerCodeListTemplate` | `ApplyToExistingFoundation()` |
| `PlatformSettingsUpdated` | `PlatformSettings` | `Update()` |
| `FoundationAssignmentRevoked` | `AppUser` (Foundation kaszkád) | `Foundation.Archive()` event handler |

### CR2.9 Új invariánsok katalógus-bővítése

| Invariáns | Típus | Érvényesítés helye |
|---|---|---|
| Foundation csak `ACTIVE` Owner alá hozható létre | Hard | `Foundation.Create()` |
| Foundation `Archive` csak ha nincs aktív Application | Hard | `Foundation.Archive()` + `IApplicationCountService` |
| Owner `Archive` csak ha minden Foundation `ARCHIVED` | Hard | `Owner.Archive()` + `IFoundationCountService` |
| `FoundationId` aggregátumon immutable | Hard | Konstruktor és setter visibility |
| `OwnerId` aggregátumon immutable | Hard | Konstruktor és setter visibility |
| `OwnerId` és `FoundationId` konzisztens (`Foundation.OwnerId == aggregate.OwnerId`) | Hard | Domain service létrehozáskor |
| Platform és Owner/Foundation szerepkör nem keveredik egy `AppUser`-en | Hard | `AppUser.AssignPlatformRole()` / `AssignOwnerRole()` |
| Egy `AppUser.OwnerId` immutable | Hard | Setter visibility |
| `FoundationUserAssignment.FoundationId.Owner == AppUser.Owner` | Hard | `AppUser.AssignToFoundation()` |
| Utolsó PlatformAdmin nem törölhető | Hard | Application Service |
| Utolsó OwnerAdmin Owner-enként nem törölhető | Hard | Application Service |
| Utolsó FoundationAdmin alapítványonként nem törölhető | Hard | Application Service |
| Self-demotion minden szinten tiltott | Hard | Application Service (kérelmező identitása) |
| `BreakGlassGrant.Reason` ≥ 20 karakter | Hard | `BreakGlassGrant.Issue()` |
| `BreakGlassGrant.ExpiresAt > IssuedAt` | Hard | `BreakGlassGrant.Issue()` |
| `Foundation.Archive()` aktív Application esetén tilos (`IN_PROGRESS`/`SUBMITTED`/`WON`) | Hard | `Foundation.Archive()` + `IApplicationCountService` |
| `Foundation.Archive()` kaszkád: minden aktív `FoundationUserAssignment` inaktiválódik | Hard | `Foundation.Archive()` + event handler |
| Archivált Foundation adatai csak break-glass módban vagy Owner-szintű audit naplóból olvashatók | Hard | `IgnoreQueryFilters()` whitelist (architecture-plan CR2.E.2) |
| `Foundation.Create()` `templateFoundationId` ugyanazon Owner-en belüli legyen | Hard | Application Service |
| Egy `Email` + `Scope` kombinációhoz egyszerre egy `PENDING` `Invitation` | Hard | UNIQUE index + Application Service |
| `Invitation.Accept()` elutasít, ha email már másik Owner-hez tartozó aktív `AppUser`-höz tartozik | Hard | `Invitation.Accept()` (NK-13) |
| `Invitation` `Token` egyszer használatos (`ACCEPTED` után újra `Accept` tilos) | Hard | Status-átmenet |
| `Invitation.Resend()` csak `EXPIRED`/`REVOKED` állapotból | Hard | Status-guard |
| `PlatformSettings.MaxFileSizeMb` ∈ `[1, 500]` | Hard | `PlatformSettings.Update()` |
| `PlatformSettings.InvitationValidityHours` ∈ `[1, 720]` | Hard | `PlatformSettings.Update()` |
| `PlatformSettings.NotificationLeadDays` ∈ `[1, 90]` | Hard | `PlatformSettings.Update()` |
| Platform-szintű módosítás meglévő Owner/Foundation egyedi beállításait nem írja felül | Hard | Saját snapshot-mezők Owner/Foundation szinten |
| Audit napló rekord törlése tilos minden szinten | Hard | `SaveChangesAsync` override `EntityState.Deleted` AuditLog-ra → `InvalidOperationException` |
| Audit napló megőrzési idő 5 év, utána `AuditLogsArchive` táblába mozgatás | Hard | `AuditLogRetentionJob` (Hangfire) |

### CR2.10 Adatbázis-séma kiterjesztés (EF Core)

**Új táblák:**

```
Owners                          (Id, Name, ContactEmail, Status, CreatedAt, UpdatedAt)
Foundations                     (Id, OwnerId FK, Name, LogoUri, Status, CreatedAt, UpdatedAt)
FoundationUserAssignments       (Id, AppUserId FK, FoundationId FK, FoundationRole, AssignedAt, AssignedByUserId, IsActive, RevokedAt)
OwnerCodeListTemplates          (Id, OwnerId FK, Name, CreatedAt, UpdatedAt)
OwnerCodeListTemplateItems      (Id, TemplateId FK, Code, Label, SortOrder, IsActive)
BreakGlassGrants                (Id, PlatformAdminUserId, TargetOwnerId, Reason, IssuedAt, ExpiresAt, Status, RevokedAt)
Invitations                     (Id, Email, Scope, TargetOwnerId NULL, TargetFoundationId NULL, IntendedRole,
                                 TokenHash, Status, IssuedAt, ExpiresAt, AcceptedAt NULL, RevokedAt NULL, IssuedByUserId)
InvitationEmbeddedAssignments   (Id, InvitationId FK, FoundationId FK, FoundationRole)
PlatformSettings                (Id [sentinel], MaxFileSizeMb, InvitationValidityHours, NotificationLeadDays,
                                 DefaultOwnerCodeListTemplateId FK NULL, UpdatedAt, UpdatedByUserId)
AuditLogsArchive                (ugyanaz a séma mint AuditLogs)  -- 5 év utáni archív partíció
```

**Bővülő táblák — kötelező új oszlopok (NOT NULL, indexelt):**

| Tábla | Új oszlop |
|---|---|
| `Applications` | `OwnerId`, `FoundationId` |
| `Granters` | `OwnerId`, `FoundationId` |
| `Vendors` | `OwnerId`, `FoundationId` |
| `CodeLists` | `OwnerId`, `FoundationId` |
| `Notifications` | `OwnerId`, `FoundationId` |
| `AuditLogs` | `OwnerId` (NULL), `FoundationId` (NULL) |
| `AppUsers` | `OwnerId` (NULL Platform-szinten), `PlatformRole` (NULL), `OwnerRole` (NULL) |

**Új indexek:**

- Minden scope-olt táblán: `(OwnerId, FoundationId)` összetett index a global query filter teljesítményhez.
- `FoundationUserAssignments`-en: `(AppUserId, FoundationId)` egyedi index — egy felhasználó egy alapítványban legfeljebb egy aktív hozzárendelés.
- `BreakGlassGrants`-en: `(Status, ExpiresAt)` index a lejárati job-hoz.

**EF Core global query filterek (CR2 szerint):**

A `AppDbContext.OnModelCreating()` minden tenant-scope entitásra a meglévő `!IsArchived` filter mellé hozzáadja:

```csharp
modelBuilder.Entity<Application>().HasQueryFilter(a =>
    !a.IsArchived
    && a.OwnerId == _currentScope.OwnerId
    && (_currentScope.FoundationId == null || a.FoundationId == _currentScope.FoundationId));
```

Az `_currentScope` az új `ICurrentScopeService`-en keresztül van injektálva — implementáció lásd `architecture-plan.md` CR2 fejezet.

### CR2.11 Migrációs stratégia

A meglévő single-tenant adatbázis migrálása a CR2 modellre az alábbi lépésekben történik:

1. **Default Owner létrehozása** seedingként: `Name = "Default Owner"`, `Status = ACTIVE`.
2. **Default Foundation létrehozása** a default Owner alá, az alapítvány eredeti nevével (a 26.2 alapítvány-szintű beállítások szervezetnévét örökölve).
3. **Új oszlopok hozzáadása** `OwnerId` és `FoundationId` minden táblához, eleinte `NULL`-able.
4. **Backfill SQL:** minden meglévő rekord megkapja a default Owner és Foundation ID-t.
5. **Oszlopok `NOT NULL`-ra állítása** + foreign key constraint hozzáadása.
6. **AppUsers migrációja:** a meglévő `Admin` szerepű felhasználók `FoundationAdmin` FoundationAssignment-et kapnak a default Foundation-höz; a legrégebbi `Admin` felhasználó kiegészítve `OwnerAdmin` szereppel is a default Owner-en.
7. **PlatformSettings sentinel rekord** inicializálása a meglévő `SystemSettings` értékekből (US-204).
8. **Fájlútvonal migráció (US-230 AC7):** a meglévő `/uploads/{év}/...` útvonalakat egy `FileStorageMigrationJob` (egyszeri Hangfire job) átmozgatja `/uploads/{default_owner_id}/{default_foundation_id}/{év}/...` alá; a `Document.FilePath` mezők ugyanezen tranzakcióban frissülnek. A művelet teljesen automatizált, nem igényel admin közbeavatkozást.
9. **Régi `UserRole` oszlop deprecation** — lásd CR2.13 cutover stratégia.

**Idempotencia (US-230 AC8):**

A migrációs script minden lépését idempotens módon implementálja:

- `Owner`, `Foundation`, `PlatformSettings` `INSERT` helyett `INSERT … ON CONFLICT (Id) DO NOTHING` (sentinel ID alapján).
- Oszlop-hozzáadás `ADD COLUMN IF NOT EXISTS` szintaxissal.
- Backfill `UPDATE … WHERE OwnerId IS NULL`.
- `NOT NULL` constraint hozzáadása csak akkor, ha még nem létezik (`information_schema.columns.is_nullable` ellenőrzés).
- FK constraint hozzáadása `IF NOT EXISTS` semantikával.
- Fájlútvonal-migráció minden fájlra: célútvonalon létezés-ellenőrzés, létező cél esetén a forrás csak akkor mozgatódik, ha tartalom hash megegyezik (collision-safe).

Integrációs teszt (US-230 AC8): a migráció kétszeri futtatása nem dob hibát, és a végállapot bit-szinten azonos az egyszeri futtatás után előállt állapottal.

**Rollback (US-230 AC9):** A migráció **egyirányú**, explicit dokumentált: a CR2 nem támogatja a single-tenant állapotra való visszaállást. Vészhelyzeti DR esetén csak a migráció előtt készített teljes adatbázis-snapshot visszaállítható.

### CR2.13 `UserRole` deprecation cutover stratégia

A korábbi `UserRole` enum (lásd CR2.5) több release-en át fokozatosan kerül kivezetésre, hogy a meglévő invariánsok és külső szerződések ne sérüljenek élesben.

| Fázis | Release | `AppUser.UserRole` oszlop | `AuthorizationBehaviour` viselkedés |
|---|---|---|---|
| 0 | Pre-CR2 | Aktív, kötelező | Csak `UserRole` alapján |
| 1 | **CR2 migration** | Megtartva, populálva (legacy adathoz) | Mindkettő ellenőrizve: `UserRole` **vagy** új CR2 szerepkörök (PlatformRole/OwnerRole/FoundationAssignments) |
| 2 | CR2+1 release | Megtartva, **read-only** (nem írható új workflow-ban) | Új CR2 szerepkörök elsőbbséget kapnak; `UserRole` csak fallback |
| 3 | CR2+2 release | **Dropolva** EF Core migrációval | Kizárólag új CR2 szerepkörök |

**Tesztstratégia a cutover során:**

- **Fázis 1 integráció**: a tesztsuite minden végpontra ellenőrzi, hogy a régi `UserRole`-alapú és új CR2-alapú JWT-vel ugyanazt a választ adja.
- **Fázis 2 architecture teszt**: NetArchTest szabály, amely tiltja az `AppUser.UserRole` setter hívását az `Migration*` namespace-en kívül.
- **Fázis 3 cutover gate**: integrációs teszt, hogy minden `AppUser`-en pontosan egy érvényes CR2 szerepkör-kombináció van; ha bármelyik felhasználón nincs CR2 szerepkör, a deploy elbukik.

A cutover dátumokat (release tag-ek) a `ADR-09` (architecture-plan CR2.O) rögzíti.

### CR2.12 Hivatkozott FS-szakaszok és CR2 mapping

| FS szakasz | CR2 fejezet | Megjegyzés |
|---|---|---|
| FS 4.1 PlatformAdmin/PlatformAuditor | CR2.4 (AppUser.PlatformRole) | – |
| FS 4.2 OwnerAdmin/OwnerAuditor | CR2.4 (AppUser.OwnerRole), CR2.2.1 Owner | – |
| FS 4.3 FoundationAdmin + többi | CR2.4 (AppUser.FoundationAssignments) | FoundationRole enum |
| FS 4.4 Felhasználó-hozzárendelés | CR2.4 + CR2.9 invariánsok | – |
| FS 5.1–5.3 jogosultsági mátrixok | CR2.4 enumok + Application Service | – |
| FS 5.4 hatókör-izoláció | CR2.10 EF query filterek | – |
| FS 5.5 utolsó admin / break-glass | CR2.7 BreakGlassGrant + CR2.9 invariánsok | – |
| FS 26.1 Platform admin | CR2.2.1 Owner aggregátum + CR2.6 audit | – |
| FS 26.1.3 Platform technikai beállítások | CR2.2.6 PlatformSettings + CR2.3 snapshot | – |
| FS 26.2 Owner admin | CR2.2.2 Foundation + CR2.2.4 OwnerCodeListTemplate | – |
| FS 26.3 Foundation admin | CR2.2.3 FoundationUserAssignment | – |
| FS 26.3.2 Hatókör-tudatos meghívás | CR2.2.5 Invitation aggregátum | US-221 |
| FS 26.4 Foundation switcher | (architecture-plan CR2) | Itt csak az esemény: `SCOPE_SWITCH` |
| FS 29. audit | CR2.6 + CR2.10 séma | + megőrzési politika |
| FS 31.2 jogosultság | CR2.10 query filterek | – |
| FS 32.1 multi-tenant | CR2.1 Bounded Context bevezető | – |
| FS 32.3 fájltároló | (architecture-plan CR2.F) | – |
| NK-13 (egy email → egy Owner) | CR2.4 invariánsok + CR2.2.5 `Invitation.Accept()` | – |
| NK-15 (sablonalapítvány Granters/Vendors) | CR2.2.2 `Foundation.Create(templateFoundationId)` | – |
| NK-16 (Owner-szintű kódszótár-sablon) | CR2.2.4 OwnerCodeListTemplate | – |
| NK-17 (OwnerAdmin + FoundationAdmin külön audit) | CR2.4 + CR2.8 events | US-212 AC5 |
| NK-19 (Foundation-szintű branding) | CR2.2.2 LogoUri + architecture-plan CR2.F | – |

---

*— Dokumentum vége —*

**Verzió:** 1.1 (CR2 alkalmazva)  
**Kapcsolódó dokumentumok:** `functional-specification.md` v1.1 (CR2), `architecture-plan.md` v1.1 (CR2)  
**Állapot:** Tervezet – senior review szükséges
