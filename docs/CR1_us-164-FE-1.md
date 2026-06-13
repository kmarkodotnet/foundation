# CR1_us-164-FE-1 | FE: Meghívó létrehozása – „Új meghívó" dialog

**Story:** US-164 | [Admin] Felhasználói meghívó létrehozása és kiküldése  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Frontend  
**Priority:** Magas  
**Size estimate:** S  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-164-BE-1.md (POST /api/v1/invitations végpont)  
**Blocks:** CR1_us-165-FE-1.md

---

## Story

> Mint **adminisztrátor**, szeretnék meghívót küldeni egy adott email-címre egy meghatározott szerepkörrel, hogy az illető regisztrálhasson a rendszerbe.

---

## Scope

Az Admin Felhasználók oldal fejlécébe „Új meghívó küldése" gomb hozzáadása. A gombra kattintva megnyíló `MatDialog` tartalmaz egy email + szerepkör formot. Sikeres küldés után visszajelzés (snackbar).

---

## Implementation Checklist

### CreateInvitationDialogComponent
- [ ] `src/app/features/admin/users/create-invitation-dialog/create-invitation-dialog.component.ts` létrehozása:
  - Reaktív form:
    ```typescript
    form = new FormGroup({
      email: new FormControl<string>('', [Validators.required, Validators.email]),
      role: new FormControl<string>('', [Validators.required])
    });
    ```
  - Szerepkör opciók:
    ```typescript
    roles = [
      { value: 'PalyazatiMunkatars', label: 'Pályázati Munkatárs' },
      { value: 'Penzugyes', label: 'Pénzügyes' },
      { value: 'Elnok', label: 'Elnök' },
      { value: 'Admin', label: 'Admin' }
    ];
    ```
    *(Megtekintő szerepkör nem ajánlott meghívóhoz — az érintett funkcionális spec alapján)*
  - `submit()`: `InvitationsApiService.createInvitation({ email, role })` hívása
  - Siker: dialog bezárása, `MatSnackBar` üzenet: „Meghívó elküldve: [email]"
  - 409 hiba: form-szintű hibaüzenet: „Erre az email-re már van függőben lévő meghívó."
  - Egyéb hiba: form-szintű általános hibaüzenet
  - Loading state: submit gomb disabled + spinner az API hívás alatt

- [ ] `src/app/features/admin/users/create-invitation-dialog/create-invitation-dialog.component.html`:
  ```html
  <h2 mat-dialog-title>Új meghívó küldése</h2>
  <mat-dialog-content>
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Email cím</mat-label>
        <input matInput type="email" formControlName="email" />
        <mat-error *ngIf="form.get('email')?.hasError('required')">Kötelező mező.</mat-error>
        <mat-error *ngIf="form.get('email')?.hasError('email')">Érvényes email-cím szükséges.</mat-error>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Szerepkör</mat-label>
        <mat-select formControlName="role">
          <mat-option *ngFor="let r of roles" [value]="r.value">{{ r.label }}</mat-option>
        </mat-select>
        <mat-error *ngIf="form.get('role')?.hasError('required')">Kötelező mező.</mat-error>
      </mat-form-field>
      <mat-error *ngIf="serverError">{{ serverError }}</mat-error>
    </form>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Mégse</button>
    <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || loading">
      <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
      Küldés
    </button>
  </mat-dialog-actions>
  ```

### UsersComponent módosítása
- [ ] `src/app/features/admin/users/users.component.ts` módosítása:
  - `openCreateInvitationDialog()` metódus:
    ```typescript
    openCreateInvitationDialog(): void {
      const dialogRef = this.dialog.open(CreateInvitationDialogComponent);
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'created') {
          this.loadInvitations(); // lista frissítése
        }
      });
    }
    ```
- [ ] `src/app/features/admin/users/users.component.html` módosítása:
  - Fejlécbe gomb hozzáadása:
    ```html
    <button mat-raised-button color="primary" (click)="openCreateInvitationDialog()">
      <mat-icon>mail</mat-icon> Új meghívó küldése
    </button>
    ```

### API Service
- [ ] `src/app/api/services/invitations.service.ts` (generált vagy manuális):
  - `createInvitation(request: CreateInvitationRequest): Observable<InvitationResponse>` — `POST /api/v1/invitations`
  - `CreateInvitationRequest`: `{ email: string; role: string }`
  - `InvitationResponse`: `{ id: string; email: string; role: string; status: string; createdAt: string; expiresAt: string }`

---

## UX / Behaviour Specification

| Scenario | Expected behaviour |
|---|---|
| „Új meghívó küldése" gomb | Dialog megnyílik |
| Üres form, Küldés kattintás | Validációs hibák megjelennek, kérés nem megy el |
| Érvénytelen email | Email validációs hiba |
| Sikeres küldés | Dialog bezárul, snackbar: „Meghívó elküldve: [email]" |
| 409 – már van meghívó | Form-szintű hiba: „Erre az email-re már van függőben lévő meghívó." |
| Mégse gomb | Dialog bezárul, nem kerül küldésre meghívó |

---

## Required Tests

### Unit Tests
- [ ] `CreateInvitationDialogComponentTests` — üres email → validációs hiba
- [ ] `CreateInvitationDialogComponentTests` — érvénytelen email formátum → validációs hiba
- [ ] `CreateInvitationDialogComponentTests` — üres szerepkör → validációs hiba
- [ ] `CreateInvitationDialogComponentTests` — sikeres küldés → dialog bezárul, snackbar megjelenik
- [ ] `CreateInvitationDialogComponentTests` — 409 válasz → form-szintű hibaüzenet jelenik meg
- [ ] `UsersComponentTests` — „Új meghívó küldése" gomb látható Admin felhasználónak
- [ ] `UsersComponentTests` — gombra kattintva dialog megnyílik

**Coverage:** ≥80% az érintett komponenseken.

---

## Acceptance Criteria

- [ ] AC1: Az Admin felhasználók oldalon megjelenik az „Új meghívó küldése" gomb.
- [ ] AC2: A gombra kattintva dialog nyílik meg email + szerepkör mezőkkel.
- [ ] AC3: Érvénytelen email esetén validációs hibaüzenet jelenik meg, a küldés nem indul el.
- [ ] AC4: Sikeres küldés után snackbar visszajelzés: „Meghívó elküldve: [email]".
- [ ] AC5: Ha az email-hez már van függőben lévő meghívó (409), a form-on hibaüzenet jelenik meg.
- [ ] AC6: A Mégse gombbal a dialog bezárható meghívó küldése nélkül.
- [ ] AC7: A küldés gomb loading állapotban van az API hívás ideje alatt.
