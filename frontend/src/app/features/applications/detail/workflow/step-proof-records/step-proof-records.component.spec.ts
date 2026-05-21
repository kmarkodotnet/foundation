import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthService } from '../../../../../core/auth/auth.service';
import type { CurrentUser } from '../../../../../core/auth/models/user.model';
import { ProofRecordDto, WorkflowStep } from '../../../models/application.model';
import { ProofRecordService } from '../../../services/proof-record.service';
import { StepProofRecordsComponent } from './step-proof-records.component';

const MOCK_STEP: WorkflowStep = {
  id: 'step-8',
  stepType: 'Proof',
  status: 'Active',
  order: 8,
  isSkippable: true,
  skippedReason: null,
  completedAt: null,
  completedByUserName: null,
  approvedAt: null,
  approvedByUserName: null,
  rejectionNote: null,
};

const MOCK_PHOTO = {
  id: 'photo-1',
  fileName: 'kep.jpg',
  contentType: 'image/jpeg',
  fileSizeBytes: 204800,
};

const MOCK_RECORD: ProofRecordDto = {
  id: 'record-1',
  applicationId: 'app-1',
  proofType: 'Event',
  eventDate: '2025-10-01',
  description: 'Rendezvény lezajlott.',
  createdByUserId: 'user-1',
  createdAt: '2025-10-01T12:00:00Z',
  photos: [MOCK_PHOTO],
};

describe('StepProofRecordsComponent', () => {
  let fixture: ComponentFixture<StepProofRecordsComponent>;
  let component: StepProofRecordsComponent;
  let proofRecordSpy: jasmine.SpyObj<ProofRecordService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockCurrentUser: CurrentUser = {
    userId: 'user-1',
    email: 'test@test.com',
    name: 'Teszt Felhasználó',
    role: 'PalyazatiMunkatars',
  };

  beforeEach(async () => {
    proofRecordSpy = jasmine.createSpyObj<ProofRecordService>(
      'ProofRecordService',
      ['getProofRecords', 'createProofRecord', 'getPhoto', 'downloadAll']
    );
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    proofRecordSpy.getProofRecords.and.returnValue(of([]));
    proofRecordSpy.getPhoto.and.returnValue(of(new Blob([''], { type: 'image/jpeg' })));
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as ReturnType<MatDialog['open']>);

    await TestBed.configureTestingModule({
      imports: [StepProofRecordsComponent],
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: ProofRecordService, useValue: proofRecordSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        {
          provide: AuthService,
          useValue: { currentUser: signal<CurrentUser | null>(mockCurrentUser) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StepProofRecordsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('applicationId', 'app-1');
    fixture.componentRef.setInput('step', MOCK_STEP);

    fixture.detectChanges();
  });

  it('should create and load proof records on init', () => {
    expect(component).toBeTruthy();
    expect(proofRecordSpy.getProofRecords).toHaveBeenCalledWith('app-1');
    expect(component.loading()).toBeFalse();
  });

  // -------------------------------------------------------------------------
  // proofTypeLabel
  // -------------------------------------------------------------------------

  describe('proofTypeLabel', () => {
    it('should return "Esemény" for Event type', () => {
      expect(component.proofTypeLabel('Event')).toBe('Esemény');
    });

    it('should return "Tárgyi teljesítés" for Asset type', () => {
      expect(component.proofTypeLabel('Asset')).toBe('Tárgyi teljesítés');
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

  // -------------------------------------------------------------------------
  // canModify
  // -------------------------------------------------------------------------

  describe('canModify', () => {
    it('should be true for PalyazatiMunkatars role', () => {
      expect(component.canModify()).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // openAddForm — dialog is opened
  // -------------------------------------------------------------------------

  describe('openAddForm', () => {
    it('should open dialog when called', () => {
      component.openAddForm();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should add returned record to records signal', () => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(MOCK_RECORD),
      } as ReturnType<MatDialog['open']>);

      component.openAddForm();

      expect(component.records().length).toBe(1);
      expect(component.records()[0].id).toBe('record-1');
    });

    it('should load thumbnails for newly added record photos', () => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(MOCK_RECORD),
      } as ReturnType<MatDialog['open']>);
      proofRecordSpy.getPhoto.and.returnValue(of(new Blob([''], { type: 'image/jpeg' })));

      component.openAddForm();

      expect(proofRecordSpy.getPhoto).toHaveBeenCalledWith('app-1', 'record-1', 'photo-1');
    });

    it('should not add record when dialog returns null', () => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(null),
      } as ReturnType<MatDialog['open']>);

      component.openAddForm();

      expect(component.records().length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Thumbnail loading
  // -------------------------------------------------------------------------

  describe('loadThumbnailsForRecord', () => {
    it('should call getPhoto for each photo in a record', () => {
      proofRecordSpy.getPhoto.calls.reset();
      component.loadThumbnailsForRecord(MOCK_RECORD);
      expect(proofRecordSpy.getPhoto).toHaveBeenCalledWith('app-1', 'record-1', 'photo-1');
    });

    it('should store blob URL in thumbnailUrls map', () => {
      const testBlob = new Blob(['test'], { type: 'image/jpeg' });
      proofRecordSpy.getPhoto.and.returnValue(of(testBlob));

      component.loadThumbnailsForRecord(MOCK_RECORD);

      expect(component.thumbnailUrls().has('photo-1')).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // Lightbox
  // -------------------------------------------------------------------------

  describe('lightbox', () => {
    beforeEach(() => {
      component.records.set([MOCK_RECORD]);
      component.thumbnailUrls.set(new Map([['photo-1', 'blob:http://example.com/123']]));
    });

    it('should open lightbox when photo has a URL', () => {
      component.openLightbox(MOCK_RECORD, 0);
      expect(component.lightboxPhoto()).not.toBeNull();
      expect(component.lightboxPhoto()?.recordId).toBe('record-1');
    });

    it('should close lightbox on closeLightbox()', () => {
      component.openLightbox(MOCK_RECORD, 0);
      component.closeLightbox();
      expect(component.lightboxPhoto()).toBeNull();
    });

    it('should not open lightbox when thumbnail URL is not loaded yet', () => {
      component.thumbnailUrls.set(new Map()); // no URLs
      component.openLightbox(MOCK_RECORD, 0);
      expect(component.lightboxPhoto()).toBeNull();
    });
  });
});
