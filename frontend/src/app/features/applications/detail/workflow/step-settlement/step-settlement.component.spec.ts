import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import type { CurrentUser } from '../../../../../core/auth/models/user.model';
import {
  ApplicationDetail,
  ApplicationStatus,
  SettlementDto,
  WorkflowStep,
} from '../../../models/application.model';
import { SettlementService } from '../../../services/settlement.service';
import { StepSettlementComponent } from './step-settlement.component';

const MOCK_STEP: WorkflowStep = {
  id: 'step-9',
  stepType: 'Settlement',
  status: 'Active',
  order: 9,
  isSkippable: false,
  skippedReason: null,
  completedAt: null,
  completedByUserName: null,
  approvedAt: null,
  approvedByUserName: null,
  rejectionNote: null,
};

const MOCK_SETTLEMENT: SettlementDto = {
  id: 'settlement-1',
  applicationId: 'app-1',
  settlementDate: '2025-11-01',
  settlementMethodId: null,
  description: 'Elszámolás leírása',
  notes: 'Megjegyzés',
  invoiceCoveragePercent: 95,
  hasLowCoverageWarning: false,
  approvedAt: null,
  approvedByUserId: null,
  createdAt: '2025-11-01T10:00:00Z',
  updatedAt: '2025-11-01T10:00:00Z',
};

const MOCK_APP_DETAIL: ApplicationDetail = {
  id: 'app-1',
  title: 'Teszt Pályázat',
  identifier: 'P-001',
  description: null,
  status: 'ClosedWon' as ApplicationStatus,
  granterId: 'granter-1',
  granterName: 'Teszt Pályáztató',
  applicationTypeName: null,
  minAmount: null,
  maxAmount: null,
  submissionDeadline: '2025-01-01',
  spendingDeadline: null,
  otherMetadata: null,
  awardedAmount: 5000000,
  resultDate: null,
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Admin',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-11-01T10:00:00Z',
  workflowSteps: [],
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

describe('StepSettlementComponent', () => {
  let fixture: ComponentFixture<StepSettlementComponent>;
  let component: StepSettlementComponent;
  let settlementServiceSpy: jasmine.SpyObj<SettlementService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockAdminUser: CurrentUser = {
    userId: 'user-1',
    email: 'admin@test.com',
    name: 'Admin Felhasználó',
    role: 'Admin',
  };

  const mockPenzugyesUser: CurrentUser = {
    userId: 'user-2',
    email: 'penzugyes@test.com',
    name: 'Pénzügyes Felhasználó',
    role: 'Penzugyes',
  };

  const mockElnokUser: CurrentUser = {
    userId: 'user-3',
    email: 'elnok@test.com',
    name: 'Elnök Felhasználó',
    role: 'Elnok',
  };

  function createComponent(user: CurrentUser = mockAdminUser): void {
    settlementServiceSpy = jasmine.createSpyObj<SettlementService>('SettlementService', [
      'getSettlement',
      'saveSettlement',
      'requestApproval',
      'approveSettlement',
    ]);
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    settlementServiceSpy.getSettlement.and.returnValue(of(null));
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(false),
    } as MatDialogRef<unknown>);

    TestBed.configureTestingModule({
      imports: [StepSettlementComponent],
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: SettlementService, useValue: settlementServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        {
          provide: AuthService,
          useValue: { currentUser: signal<CurrentUser | null>(user) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StepSettlementComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('applicationId', 'app-1');
    fixture.componentRef.setInput('step', MOCK_STEP);

    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.resetTestingModule();
    createComponent();
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  it('should create and load settlement on init', () => {
    expect(component).toBeTruthy();
    expect(settlementServiceSpy.getSettlement).toHaveBeenCalledWith('app-1');
    expect(component.loading()).toBeFalse();
  });

  it('should patch form when settlement is loaded', () => {
    settlementServiceSpy.getSettlement.and.returnValue(of(MOCK_SETTLEMENT));
    component.ngOnInit();

    expect(component.settlement()).toEqual(MOCK_SETTLEMENT);
    expect(component.settlementForm.get('description')?.value).toBe('Elszámolás leírása');
    expect(component.settlementForm.get('notes')?.value).toBe('Megjegyzés');
  });

  // -------------------------------------------------------------------------
  // Form validation
  // -------------------------------------------------------------------------

  describe('form validation', () => {
    it('should be invalid when settlementDate is empty', () => {
      component.settlementForm.get('settlementDate')?.setValue(null);
      expect(component.settlementForm.invalid).toBeTrue();
    });

    it('should be valid when settlementDate is set', () => {
      component.settlementForm.get('settlementDate')?.setValue(new Date('2025-11-01'));
      expect(component.settlementForm.get('settlementDate')?.valid).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // Role-based permissions
  // -------------------------------------------------------------------------

  describe('canModify', () => {
    it('should be true for Admin', () => {
      expect(component.canModify()).toBeTrue();
    });

    it('should be true for Penzugyes', async () => {
      await TestBed.resetTestingModule();
      createComponent(mockPenzugyesUser);
      expect(component.canModify()).toBeTrue();
    });

    it('should be false for Elnok', async () => {
      await TestBed.resetTestingModule();
      createComponent(mockElnokUser);
      expect(component.canModify()).toBeFalse();
    });
  });

  describe('canApprove', () => {
    it('should be true for Admin', () => {
      expect(component.canApprove()).toBeTrue();
    });

    it('should be true for Elnok', async () => {
      await TestBed.resetTestingModule();
      createComponent(mockElnokUser);
      expect(component.canApprove()).toBeTrue();
    });

    it('should be false for Penzugyes', async () => {
      await TestBed.resetTestingModule();
      createComponent(mockPenzugyesUser);
      expect(component.canApprove()).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // Coverage warning (us-070-FE-1)
  // -------------------------------------------------------------------------

  describe('coverage warning', () => {
    it('should show coverage warning banner when hasLowCoverageWarning is true', () => {
      const settlementWithWarning: SettlementDto = {
        ...MOCK_SETTLEMENT,
        hasLowCoverageWarning: true,
        invoiceCoveragePercent: 60,
      };
      settlementServiceSpy.getSettlement.and.returnValue(of(settlementWithWarning));

      component.ngOnInit();
      fixture.detectChanges();

      const warningEl = fixture.nativeElement.querySelector('.coverage-warning');
      expect(warningEl).toBeTruthy();
      expect(warningEl.textContent).toContain('60%');
    });

    it('should not show coverage warning banner when hasLowCoverageWarning is false', () => {
      settlementServiceSpy.getSettlement.and.returnValue(of(MOCK_SETTLEMENT));

      component.ngOnInit();
      fixture.detectChanges();

      const warningEl = fixture.nativeElement.querySelector('.coverage-warning');
      expect(warningEl).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // saveSettlement (us-070-FE-1)
  // -------------------------------------------------------------------------

  describe('saveSettlement', () => {
    it('should call SettlementService.saveSettlement with correct data', () => {
      const savedSettlement: SettlementDto = { ...MOCK_SETTLEMENT };
      settlementServiceSpy.saveSettlement.and.returnValue(of(savedSettlement));

      component.settlementForm.setValue({
        settlementDate: new Date('2025-11-01'),
        description: 'Teszt leírás',
        notes: 'Teszt megjegyzés',
      });

      component.saveSettlement();

      expect(settlementServiceSpy.saveSettlement).toHaveBeenCalledWith('app-1', {
        settlementDate: '2025-11-01',
        description: 'Teszt leírás',
        notes: 'Teszt megjegyzés',
      });
    });

    it('should not call saveSettlement when form is invalid', () => {
      component.settlementForm.get('settlementDate')?.setValue(null);
      component.saveSettlement();
      expect(settlementServiceSpy.saveSettlement).not.toHaveBeenCalled();
    });

    it('should update settlement signal on success', () => {
      const savedSettlement: SettlementDto = { ...MOCK_SETTLEMENT };
      settlementServiceSpy.saveSettlement.and.returnValue(of(savedSettlement));

      component.settlementForm.setValue({
        settlementDate: new Date('2025-11-01'),
        description: '',
        notes: '',
      });
      component.saveSettlement();

      expect(component.settlement()).toEqual(savedSettlement);
      expect(component.saving()).toBeFalse();
    });

    it('should show error snack bar on save failure', () => {
      settlementServiceSpy.saveSettlement.and.returnValue(throwError(() => new Error('Network error')));

      component.settlementForm.setValue({
        settlementDate: new Date('2025-11-01'),
        description: '',
        notes: '',
      });
      component.saveSettlement();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Nem sikerült menteni az elszámolást.',
        'Bezár',
        jasmine.objectContaining({ duration: 5000 })
      );
    });
  });

  // -------------------------------------------------------------------------
  // requestApproval (us-070-FE-1)
  // -------------------------------------------------------------------------

  describe('requestApproval', () => {
    it('should call SettlementService.requestApproval', () => {
      settlementServiceSpy.requestApproval.and.returnValue(of(undefined));
      component.requestApproval();
      expect(settlementServiceSpy.requestApproval).toHaveBeenCalledWith('app-1');
    });

    it('should show success snack bar on request approval success', () => {
      settlementServiceSpy.requestApproval.and.returnValue(of(undefined));
      component.requestApproval();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Jóváhagyási kérés elküldve az Elnöknek.',
        'Bezár',
        jasmine.objectContaining({ duration: 4000 })
      );
    });

    it('should show error snack bar on request approval failure', () => {
      settlementServiceSpy.requestApproval.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      component.requestApproval();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Nem sikerült elküldeni a jóváhagyási kérést.',
        'Bezár',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should not call requestApproval while already requesting', () => {
      component.requestingApproval.set(true);
      component.requestApproval();
      expect(settlementServiceSpy.requestApproval).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Approval flow (us-071-FE-1)
  // -------------------------------------------------------------------------

  describe('openApprovalConfirm and submitApproval', () => {
    it('should open confirm dialog on openApprovalConfirm()', () => {
      component.openApprovalConfirm();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should call approveSettlement with isApproved=true when dialog confirmed', () => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(true),
      } as MatDialogRef<unknown>);
      settlementServiceSpy.approveSettlement.and.returnValue(of(MOCK_APP_DETAIL));

      component.openApprovalConfirm();

      expect(settlementServiceSpy.approveSettlement).toHaveBeenCalledWith('app-1', {
        isApproved: true,
      });
    });

    it('should NOT call approveSettlement when dialog is cancelled', () => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(false),
      } as MatDialogRef<unknown>);

      component.openApprovalConfirm();

      expect(settlementServiceSpy.approveSettlement).not.toHaveBeenCalled();
    });

    it('should emit applicationUpdated on successful approval', () => {
      const emitted: ApplicationDetail[] = [];
      component.applicationUpdated.subscribe((app) => emitted.push(app));

      settlementServiceSpy.approveSettlement.and.returnValue(of(MOCK_APP_DETAIL));
      component.submitApproval();

      expect(emitted.length).toBe(1);
      expect(emitted[0].status).toBe('ClosedWon');
    });

    it('should show error snack bar on approval failure', () => {
      settlementServiceSpy.approveSettlement.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      component.submitApproval();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Nem sikerült lezárni a pályázatot.',
        'Bezár',
        jasmine.objectContaining({ duration: 5000 })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Rejection flow (us-071-FE-1)
  // -------------------------------------------------------------------------

  describe('submitRejection', () => {
    it('should call approveSettlement with isApproved=false and rejectionNote', () => {
      settlementServiceSpy.approveSettlement.and.returnValue(of(MOCK_APP_DETAIL));

      component.rejectionNoteControl.setValue('Hiányos dokumentáció.');
      component.submitRejection();

      expect(settlementServiceSpy.approveSettlement).toHaveBeenCalledWith('app-1', {
        isApproved: false,
        rejectionNote: 'Hiányos dokumentáció.',
      });
    });

    it('should not call approveSettlement when rejectionNote is empty', () => {
      component.rejectionNoteControl.setValue('');
      component.submitRejection();
      expect(settlementServiceSpy.approveSettlement).not.toHaveBeenCalled();
    });

    it('should emit applicationUpdated on successful rejection', () => {
      const emitted: ApplicationDetail[] = [];
      component.applicationUpdated.subscribe((app) => emitted.push(app));

      settlementServiceSpy.approveSettlement.and.returnValue(of(MOCK_APP_DETAIL));
      component.rejectionNoteControl.setValue('Hiányos dokumentáció.');
      component.submitRejection();

      expect(emitted.length).toBe(1);
    });

    it('should reset rejection form on successful rejection', () => {
      settlementServiceSpy.approveSettlement.and.returnValue(of(MOCK_APP_DETAIL));
      component.showRejectionForm.set(true);
      component.rejectionNoteControl.setValue('Hiányos dokumentáció.');

      component.submitRejection();

      expect(component.showRejectionForm()).toBeFalse();
      expect(component.rejectionNoteControl.value).toBeNull();
    });

    it('should show error snack bar on rejection failure', () => {
      settlementServiceSpy.approveSettlement.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      component.rejectionNoteControl.setValue('Hiányos dokumentáció.');
      component.submitRejection();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Nem sikerült visszautasítani.',
        'Bezár',
        jasmine.objectContaining({ duration: 5000 })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Rejection form toggle
  // -------------------------------------------------------------------------

  describe('openRejectionForm / cancelRejection', () => {
    it('should show rejection form on openRejectionForm()', () => {
      component.openRejectionForm();
      expect(component.showRejectionForm()).toBeTrue();
    });

    it('should hide rejection form and reset control on cancelRejection()', () => {
      component.showRejectionForm.set(true);
      component.rejectionNoteControl.setValue('Teszt');

      component.cancelRejection();

      expect(component.showRejectionForm()).toBeFalse();
      expect(component.rejectionNoteControl.value).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // isEditable
  // -------------------------------------------------------------------------

  describe('isEditable', () => {
    it('should be true when step is Active and not locked', () => {
      fixture.componentRef.setInput('step', { ...MOCK_STEP, status: 'Active' });
      fixture.componentRef.setInput('isLocked', false);
      expect(component.isEditable()).toBeTrue();
    });

    it('should be false when step is Completed', () => {
      fixture.componentRef.setInput('step', { ...MOCK_STEP, status: 'Completed' });
      expect(component.isEditable()).toBeFalse();
    });

    it('should be false when isLocked is true', () => {
      fixture.componentRef.setInput('isLocked', true);
      expect(component.isEditable()).toBeFalse();
    });
  });
});
