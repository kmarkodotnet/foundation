import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import type { CurrentUser } from '../../../../../core/auth/models/user.model';
import { VendorContract, WorkflowStep } from '../../../models/application.model';
import { BudgetPlanService } from '../../../services/budget-plan.service';
import { VendorContractService } from '../../../services/vendor-contract.service';
import { VendorService } from '../../../../vendors/services/vendor.service';
import { StepVendorContractsComponent } from './step-vendor-contracts.component';

const MOCK_STEP: WorkflowStep = {
  id: 'step-1',
  stepType: 'VendorContracts',
  status: 'Active',
  order: 6,
  isSkippable: true,
  skippedReason: null,
  completedAt: null,
  completedByUserName: null,
  approvedAt: null,
  approvedByUserName: null,
  rejectionNote: null,
};

const MOCK_CONTRACT: VendorContract = {
  id: 'contract-1',
  applicationId: 'app-1',
  vendorId: 'vendor-1',
  vendorName: 'Teszt Cég Kft.',
  contractIdentifier: 'SZ-001',
  contractDate: '2025-01-15',
  amount: 500000,
  currency: 'HUF',
  budgetItemId: null,
  budgetItemName: null,
  notes: null,
  createdByUserId: 'user-1',
  createdAt: '2025-01-15T10:00:00Z',
};

describe('StepVendorContractsComponent', () => {
  let fixture: ComponentFixture<StepVendorContractsComponent>;
  let component: StepVendorContractsComponent;
  let vendorContractSpy: jasmine.SpyObj<VendorContractService>;
  let vendorSpy: jasmine.SpyObj<VendorService>;
  let budgetPlanSpy: jasmine.SpyObj<BudgetPlanService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockCurrentUser: CurrentUser = {
    userId: 'user-1',
    email: 'test@test.com',
    name: 'Teszt Felhasználó',
    role: 'PalyazatiMunkatars',
  };

  beforeEach(async () => {
    vendorContractSpy = jasmine.createSpyObj<VendorContractService>(
      'VendorContractService',
      ['getContracts', 'createContract', 'deleteContract']
    );
    vendorSpy = jasmine.createSpyObj<VendorService>('VendorService', ['getAll']);
    budgetPlanSpy = jasmine.createSpyObj<BudgetPlanService>('BudgetPlanService', ['getBudgetPlan']);
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    vendorContractSpy.getContracts.and.returnValue(of([]));
    vendorSpy.getAll.and.returnValue(of([]));
    budgetPlanSpy.getBudgetPlan.and.returnValue(of(null));
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as ReturnType<MatDialog['open']>);

    await TestBed.configureTestingModule({
      imports: [StepVendorContractsComponent],
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: VendorContractService, useValue: vendorContractSpy },
        { provide: VendorService, useValue: vendorSpy },
        { provide: BudgetPlanService, useValue: budgetPlanSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        {
          provide: AuthService,
          useValue: { currentUser: signal<CurrentUser | null>(mockCurrentUser) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StepVendorContractsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('applicationId', 'app-1');
    fixture.componentRef.setInput('step', MOCK_STEP);

    fixture.detectChanges();
  });

  it('should create and load contracts on init', () => {
    expect(component).toBeTruthy();
    expect(vendorContractSpy.getContracts).toHaveBeenCalledWith('app-1');
  });

  // -------------------------------------------------------------------------
  // Form validation
  // -------------------------------------------------------------------------

  describe('form validation', () => {
    beforeEach(() => {
      component.openAddForm();
    });

    it('should be invalid when vendorId is missing', () => {
      component.contractForm.patchValue({ amount: 100000, contractDate: new Date() });
      expect(component.contractForm.invalid).toBeTrue();
      expect(component.contractForm.controls.vendorId.hasError('required')).toBeTrue();
    });

    it('should be invalid when amount is missing', () => {
      component.contractForm.patchValue({ vendorId: 'vendor-1', contractDate: new Date() });
      expect(component.contractForm.invalid).toBeTrue();
      expect(component.contractForm.controls.amount.hasError('required')).toBeTrue();
    });

    it('should be invalid when contractDate is missing', () => {
      component.contractForm.patchValue({ vendorId: 'vendor-1', amount: 100000 });
      expect(component.contractForm.invalid).toBeTrue();
      expect(component.contractForm.controls.contractDate.hasError('required')).toBeTrue();
    });

    it('should be invalid when amount is less than 1', () => {
      component.contractForm.patchValue({
        vendorId: 'vendor-1',
        amount: 0,
        contractDate: new Date(),
      });
      expect(component.contractForm.invalid).toBeTrue();
      expect(component.contractForm.controls.amount.hasError('min')).toBeTrue();
    });

    it('should be valid when all required fields are filled', () => {
      component.contractForm.patchValue({
        vendorId: 'vendor-1',
        amount: 100000,
        contractDate: new Date(),
      });
      expect(component.contractForm.valid).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // Submit — service call
  // -------------------------------------------------------------------------

  describe('submitContract', () => {
    beforeEach(() => {
      component.openAddForm();
      component.contractForm.patchValue({
        vendorId: 'vendor-1',
        amount: 500000,
        contractDate: new Date('2025-01-15'),
        contractIdentifier: 'SZ-001',
      });
    });

    it('should call createContract with correct payload', () => {
      vendorContractSpy.createContract.and.returnValue(of(MOCK_CONTRACT));

      component.submitContract();

      expect(vendorContractSpy.createContract).toHaveBeenCalledWith(
        'app-1',
        jasmine.objectContaining({
          vendorId: 'vendor-1',
          amount: 500000,
          currency: 'HUF',
          contractIdentifier: 'SZ-001',
        })
      );
    });

    it('should pass budgetItemId when selected', () => {
      component.contractForm.patchValue({ budgetItemId: 'item-1' });
      vendorContractSpy.createContract.and.returnValue(of(MOCK_CONTRACT));

      component.submitContract();

      expect(vendorContractSpy.createContract).toHaveBeenCalledWith(
        'app-1',
        jasmine.objectContaining({ budgetItemId: 'item-1' })
      );
    });

    it('should show success toast with correct message after saving', () => {
      vendorContractSpy.createContract.and.returnValue(of(MOCK_CONTRACT));

      component.submitContract();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Alvállalkozói szerződés rögzítve.',
        'Bezár',
        jasmine.any(Object)
      );
    });

    it('should not call createContract when form is invalid', () => {
      component.contractForm.controls.vendorId.setValue(null);

      component.submitContract();

      expect(vendorContractSpy.createContract).not.toHaveBeenCalled();
    });

    it('should close the add form after successful save', () => {
      vendorContractSpy.createContract.and.returnValue(of(MOCK_CONTRACT));

      component.submitContract();

      expect(component.showAddForm()).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // Summary panel — totalAmount
  // -------------------------------------------------------------------------

  describe('totalAmount', () => {
    it('should be 0 when no contracts exist', () => {
      component.contracts.set([]);
      expect(component.totalAmount()).toBe(0);
    });

    it('should sum all contract amounts', () => {
      component.contracts.set([
        { ...MOCK_CONTRACT, amount: 300000 },
        { ...MOCK_CONTRACT, id: 'contract-2', amount: 200000 },
      ]);
      expect(component.totalAmount()).toBe(500000);
    });

    it('should update totalAmount after new contract is added via submitContract', () => {
      const newContract = { ...MOCK_CONTRACT, amount: 750000 };
      vendorContractSpy.createContract.and.returnValue(of(newContract));

      component.openAddForm();
      component.contractForm.patchValue({
        vendorId: 'vendor-1',
        amount: 750000,
        contractDate: new Date('2025-01-15'),
      });
      component.submitContract();

      expect(component.totalAmount()).toBe(750000);
    });

    it('should recalculate totalAmount when multiple contracts are loaded', () => {
      component.contracts.set([
        { ...MOCK_CONTRACT, amount: 100000 },
        { ...MOCK_CONTRACT, id: 'contract-2', amount: 400000 },
        { ...MOCK_CONTRACT, id: 'contract-3', amount: 250000 },
      ]);
      expect(component.totalAmount()).toBe(750000);
    });
  });

  // -------------------------------------------------------------------------
  // isEditable computed signal
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
