# CR1_us-163-FE-1 | FE: Rendszerbeállítások – meghívó érvényességi idő mező (US-163 delta)

**Story:** US-163 | [Admin] Rendszerbeállítások kezelése (módosítás)  
**Change Request:** CR-1 – Meghívásos belépési modell  
**Layer:** Frontend  
**Type:** MODIFICATION — meglévő us-163-FE-1.md deltája  
**Priority:** Közepes  
**Size estimate:** XS  
**Sprint:** Sprint 1  
**Depends on:** CR1_us-163-BE-1.md (SystemSettings delta: InvitationExpiryHours mező)  
**Blocks:** —

---

## Story

> Mint **adminisztrátor**, szeretném a rendszer alapparamétereit kezelni, beleértve a meghívók érvényességi idejét.

---

## Scope

A Settings oldal form-jának módosítása: `defaultUserRole` mező eltávolítása és `invitationExpiryHours` mező hozzáadása. Az `Általános` vagy `Hozzáférés` szekcióban új kártya a meghívó beállításoknak.

---

## Implementation Checklist

### Settings Form módosítása
- [ ] `src/app/features/admin/settings/settings.component.ts` módosítása:
  - Form: `defaultUserRole` FormControl **törlése**
  - Form: `invitationExpiryHours` FormControl **hozzáadása**:
    ```typescript
    invitationExpiryHours: new FormControl<number>(72, [
      Validators.required,
      Validators.min(1),
      Validators.max(168)
    ])
    ```
  - `patchValue()` hívásban: `defaultUserRole` → törlés; `invitationExpiryHours` → hozzáadás
  - Submit logika változatlan (a backend DTO már kezeli az új mezőt)

- [ ] `src/app/features/admin/settings/settings.component.html` módosítása:
  - `defaultUserRole` select/input **eltávolítása**
  - Új szekció: `Hozzáférés / Meghívó` kártya:
    ```html
    <mat-card>
      <mat-card-header>
        <mat-card-title>Hozzáférés / Meghívó</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-form-field>
          <mat-label>Meghívó érvényességi ideje (óra)</mat-label>
          <input matInput type="number" formControlName="invitationExpiryHours" min="1" max="168" />
          <mat-hint>1–168 óra között adható meg</mat-hint>
          <mat-error *ngIf="form.get('invitationExpiryHours')?.hasError('min') || form.get('invitationExpiryHours')?.hasError('max')">
            Az érvényességi időnek 1 és 168 óra között kell lennie.
          </mat-error>
          <mat-error *ngIf="form.get('invitationExpiryHours')?.hasError('required')">
            Ez a mező kötelező.
          </mat-error>
        </mat-form-field>
      </mat-card-content>
    </mat-card>
    ```
  - A „Mentés" gomb disabled marad érvénytelen érték esetén (`[disabled]="form.invalid"`)

### DTO frissítése (ha manuális, nem generált kliens)
- [ ] Ha a `SystemSettingsResponse` / `UpdateSystemSettingsRequest` DTO manuálisan van definiálva a frontenden:
  - `defaultUserRole` mező törlése
  - `invitationExpiryHours: number` mező hozzáadása
- [ ] Ha generált OpenAPI kliens: `ng generate` újrafuttatása a backend contract frissítése után

---

## UX / Behaviour Specification

| Scenario | Expected behaviour |
|---|---|
| Settings oldal betöltés | `invitationExpiryHours` mező az aktuális értékkel jelenik meg (default: 72) |
| `invitationExpiryHours = 0` | Validációs hiba, Mentés gomb disabled |
| `invitationExpiryHours = 169` | Validációs hiba, Mentés gomb disabled |
| Érvényes érték mentése | PUT kérés, snackbar: „Beállítások elmentve." |
| `defaultUserRole` mező | Nem jelenik meg az oldalon |

---

## Required Tests

### Unit Tests
- [ ] `SettingsComponentTests` — `invitationExpiryHours` mező megjelenik a formban
- [ ] `SettingsComponentTests` — `invitationExpiryHours = 0` → validációs hiba, Mentés disabled
- [ ] `SettingsComponentTests` — `invitationExpiryHours = 169` → validációs hiba, Mentés disabled
- [ ] `SettingsComponentTests` — `invitationExpiryHours = 72` → form valid
- [ ] `SettingsComponentTests` — `defaultUserRole` mező nem létezik a formban

**Coverage:** ≥80% az érintett komponensen.

---

## Acceptance Criteria

- [ ] AC1: A Settings oldalon megjelenik a `Meghívó érvényességi ideje (óra)` mező.
- [ ] AC2: A mező értéke betöltéskor a jelenlegi backend értéket tükrözi.
- [ ] AC3: 0 vagy 169+ értéknél validációs hiba jelenik meg és a Mentés gomb inaktív.
- [ ] AC4: Az `Alapértelmezett szerepkör` mező nem jelenik meg az oldalon.
- [ ] AC5: Sikeres mentés után snackbar visszajelzés jelenik meg.
