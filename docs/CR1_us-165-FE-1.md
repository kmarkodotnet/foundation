# CR1_us-165-FE-1 | FE: Meghívók listázása és kezelése – Admin tab

**Story:** US-165 | [Admin] Meghívók listázása és kezelése  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Frontend  
**Priority:** Magas  
**Size estimate:** M  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-165-BE-1.md (GET/revoke/resend végpontok), CR1_us-164-FE-1.md (dialog + API service)  
**Blocks:** —

---

## Story

> Mint **adminisztrátor**, szeretném áttekinteni a kiküldött meghívókat és kezelni a függőben lévőket, hogy nyomon követhessem ki fogadta el, és szükség esetén visszavonjak vagy újraküldjek.

---

## Scope

Az Admin Felhasználók oldalon egy „Meghívók" tab hozzáadása. A tab tartalmaz egy táblázatot az összes meghívóval, státusz-szűrővel, státusz chipekkel és sor-szintű akciókkal (visszavonás, újraküldés).

---

## Implementation Checklist

### UsersComponent — tab struktúra
- [ ] `src/app/features/admin/users/users.component.html` módosítása:
  - `MatTabGroup` hozzáadása (ha még nincs): `Felhasználók` és `Meghívók` tabok
  - Alternatív: elkülönített `InvitationsComponent` a tab tartalmának
  
### InvitationsComponent (vagy beágyazott tab tartalom)
- [ ] `src/app/features/admin/users/invitations/invitations.component.ts` létrehozása:
  - `invitations` signal: `Signal<InvitationResponse[]>`
  - `statusFilter` signal: `Signal<string | null>` (null = összes)
  - `ngOnInit`: `loadInvitations()` hívása
  - `loadInvitations()`: `InvitationsApiService.getInvitations(statusFilter())` → signal frissítése
  - `revokeInvitation(id: string)`: `InvitationsApiService.revokeInvitation(id)` → snackbar + lista frissítése
  - `resendInvitation(id: string)`: `InvitationsApiService.resendInvitation(id)` → snackbar + lista frissítése
  - Loading és error state kezelés

- [ ] `src/app/features/admin/users/invitations/invitations.component.html`:
  ```html
  <!-- Szűrő -->
  <mat-button-toggle-group (change)="onFilterChange($event)">
    <mat-button-toggle value="">Összes</mat-button-toggle>
    <mat-button-toggle value="PENDING">Függőben</mat-button-toggle>
    <mat-button-toggle value="ACCEPTED">Elfogadott</mat-button-toggle>
    <mat-button-toggle value="EXPIRED">Lejárt</mat-button-toggle>
    <mat-button-toggle value="REVOKED">Visszavont</mat-button-toggle>
  </mat-button-toggle-group>

  <!-- Táblázat -->
  <mat-table [dataSource]="invitations()">
    <ng-container matColumnDef="email">
      <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
      <mat-cell *matCellDef="let inv">{{ inv.email }}</mat-cell>
    </ng-container>
    <ng-container matColumnDef="role">
      <mat-header-cell *matHeaderCellDef>Szerepkör</mat-header-cell>
      <mat-cell *matCellDef="let inv">{{ inv.role }}</mat-cell>
    </ng-container>
    <ng-container matColumnDef="status">
      <mat-header-cell *matHeaderCellDef>Státusz</mat-header-cell>
      <mat-cell *matCellDef="let inv">
        <mat-chip [color]="getStatusColor(inv.status)" selected>{{ inv.status }}</mat-chip>
      </mat-cell>
    </ng-container>
    <ng-container matColumnDef="expiresAt">
      <mat-header-cell *matHeaderCellDef>Lejárat</mat-header-cell>
      <mat-cell *matCellDef="let inv">{{ inv.expiresAt | date:'short' }}</mat-cell>
    </ng-container>
    <ng-container matColumnDef="actions">
      <mat-header-cell *matHeaderCellDef></mat-header-cell>
      <mat-cell *matCellDef="let inv">
        <button mat-icon-button *ngIf="inv.status === 'PENDING'"
                (click)="revokeInvitation(inv.id)" matTooltip="Visszavonás">
          <mat-icon>block</mat-icon>
        </button>
        <button mat-icon-button *ngIf="inv.status === 'PENDING' || inv.status === 'EXPIRED'"
                (click)="resendInvitation(inv.id)" matTooltip="Újraküldés">
          <mat-icon>send</mat-icon>
        </button>
      </mat-cell>
    </ng-container>
    <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
    <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
  </mat-table>

  <!-- Üres állapot -->
  <div *ngIf="invitations().length === 0 && !loading()">
    Nincs meghívó a kiválasztott szűrőnek megfelelően.
  </div>
  ```

- [ ] `getStatusColor(status: string)` helper metódus:
  ```typescript
  getStatusColor(status: string): ThemePalette {
    switch (status) {
      case 'PENDING': return 'primary';
      case 'ACCEPTED': return 'accent';
      case 'EXPIRED': return 'warn';
      case 'REVOKED': return undefined; // szürke
      default: return undefined;
    }
  }
  ```

### API Service bővítése
- [ ] `src/app/api/services/invitations.service.ts` bővítése:
  - `getInvitations(status?: string): Observable<InvitationResponse[]>` — `GET /api/v1/invitations?status=...`
  - `revokeInvitation(id: string): Observable<InvitationResponse>` — `PUT /api/v1/invitations/{id}/revoke`
  - `resendInvitation(id: string): Observable<InvitationResponse>` — `POST /api/v1/invitations/{id}/resend`

### Visszavonás megerősítő dialog (opcionális)
- [ ] Visszavonás előtt `MatDialog` confirm dialog:
  - „Biztosan visszavonod a(z) [email] meghívóját?"
  - Megerősítés után `revokeInvitation()` hívása

---

## UX / Behaviour Specification

| Scenario | Expected behaviour |
|---|---|
| „Meghívók" tab megnyitása | Összes meghívó betöltődik, státuszok chipként láthatók |
| PENDING sor | Visszavonás és Újraküldés ikonok láthatók |
| EXPIRED sor | Csak Újraküldés ikon látható |
| ACCEPTED sor | Nincs akciógomb |
| REVOKED sor | Nincs akciógomb |
| Visszavonás gomb | PUT /revoke → snackbar: „Meghívó visszavonva." → chip frissül REVOKED-ra |
| Újraküldés gomb | POST /resend → snackbar: „Meghívó újraküldve." → chip frissül PENDING-re |
| Szűrő: PENDING | Csak PENDING státuszú sorok láthatók |
| Üres lista | „Nincs meghívó" üzenet |

---

## Required Tests

### Unit Tests
- [ ] `InvitationsComponentTests` — betöltéskor az összes meghívó megjelenik
- [ ] `InvitationsComponentTests` — PENDING sorban Visszavonás és Újraküldés gombok láthatók
- [ ] `InvitationsComponentTests` — ACCEPTED sorban nincsenek akciógombok
- [ ] `InvitationsComponentTests` — REVOKED sorban nincsenek akciógombok
- [ ] `InvitationsComponentTests` — EXPIRED sorban csak Újraküldés gomb látható
- [ ] `InvitationsComponentTests` — visszavonás gomb → PUT hívás, snackbar megjelenik
- [ ] `InvitationsComponentTests` — újraküldés gomb → POST hívás, snackbar megjelenik
- [ ] `InvitationsComponentTests` — szűrő → GET kérés `?status=PENDING` paraméterrel
- [ ] `InvitationsComponentTests` — üres lista esetén üres állapot üzenet jelenik meg

**Coverage:** ≥80% az érintett komponenseken.

---

## Acceptance Criteria

- [ ] AC1: Az Admin felhasználók oldalon elérhető a „Meghívók" tab.
- [ ] AC2: A tab táblázatban látható: email, szerepkör, státusz (chip), lejárat.
- [ ] AC3: PENDING meghívón: Visszavonás ikon → visszavonás után chip REVOKED-ra vált.
- [ ] AC4: EXPIRED meghívón: Újraküldés ikon → újraküldés után chip PENDING-re vált.
- [ ] AC5: ACCEPTED és REVOKED meghívón nincs akciógomb.
- [ ] AC6: Szűrőváltáskor az API-t a megfelelő `?status=` paraméterrel hívja.
- [ ] AC7: Üres lista esetén informatív üres állapot üzenet jelenik meg.
