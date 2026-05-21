import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ProofRecordDto } from '../../../models/application.model';
import { ProofRecordService } from '../../../services/proof-record.service';
import { ProofRecordFormDialogComponent } from './proof-record-form-dialog.component';

const MOCK_RESULT: ProofRecordDto = {
  id: 'record-1',
  applicationId: 'app-1',
  proofType: 'Event',
  eventDate: '2025-10-01',
  description: null,
  createdByUserId: 'user-1',
  createdAt: '2025-10-01T12:00:00Z',
  photos: [],
};

describe('ProofRecordFormDialogComponent', () => {
  let fixture: ComponentFixture<ProofRecordFormDialogComponent>;
  let component: ProofRecordFormDialogComponent;
  let proofRecordSpy: jasmine.SpyObj<ProofRecordService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ProofRecordFormDialogComponent, ProofRecordDto | null>>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    proofRecordSpy = jasmine.createSpyObj<ProofRecordService>(
      'ProofRecordService',
      ['createProofRecord']
    );
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ProofRecordFormDialogComponent, ProofRecordDto | null>>(
      'MatDialogRef',
      ['close']
    );
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [ProofRecordFormDialogComponent],
      providers: [
        provideNoopAnimations(),
        provideNativeDateAdapter(),
        { provide: ProofRecordService, useValue: proofRecordSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MAT_DIALOG_DATA, useValue: { applicationId: 'app-1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProofRecordFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Save button disabled state
  // -------------------------------------------------------------------------

  describe('submit disabled when no files selected', () => {
    it('should not call createProofRecord when selectedFiles is empty', () => {
      component.form.patchValue({
        proofType: 'Event',
        eventDate: new Date('2025-10-01'),
      });
      // No files selected — selectedFiles().length === 0
      component.submit();
      expect(proofRecordSpy.createProofRecord).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // File validation — invalid format
  // -------------------------------------------------------------------------

  describe('onFilesSelected — format validation', () => {
    it('should reject files with unsupported format', () => {
      const invalidFile = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
      const event = { target: { files: [invalidFile], value: '' } } as unknown as Event;

      component.onFilesSelected(event);

      expect(component.fileErrors().length).toBeGreaterThan(0);
      expect(component.fileErrors()[0]).toContain('Ez a fájlformátum nem támogatott.');
      expect(component.selectedFiles().length).toBe(0);
    });

    it('should accept JPEG files', () => {
      const validFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [validFile], value: '' } } as unknown as Event;

      component.onFilesSelected(event);

      expect(component.selectedFiles().length).toBe(1);
      expect(component.fileErrors().length).toBe(0);
    });

    it('should accept PNG files', () => {
      const validFile = new File(['data'], 'photo.png', { type: 'image/png' });
      const event = { target: { files: [validFile], value: '' } } as unknown as Event;

      component.onFilesSelected(event);

      expect(component.selectedFiles().length).toBe(1);
    });

    it('should accept TIFF files', () => {
      const validFile = new File(['data'], 'photo.tif', { type: 'image/tiff' });
      const event = { target: { files: [validFile], value: '' } } as unknown as Event;

      component.onFilesSelected(event);

      expect(component.selectedFiles().length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // File validation — size limit
  // -------------------------------------------------------------------------

  describe('onFilesSelected — size validation', () => {
    it('should reject files larger than 50 MB', () => {
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 51 * 1024 * 1024 });

      const event = { target: { files: [largeFile], value: '' } } as unknown as Event;
      component.onFilesSelected(event);

      expect(component.fileErrors()[0]).toContain('A fájl mérete meghaladja az 50 MB-os korlátot.');
      expect(component.selectedFiles().length).toBe(0);
    });

    it('should accept files exactly at 50 MB limit', () => {
      const edgeFile = new File([''], 'ok.jpg', { type: 'image/jpeg' });
      Object.defineProperty(edgeFile, 'size', { value: 50 * 1024 * 1024 });

      const event = { target: { files: [edgeFile], value: '' } } as unknown as Event;
      component.onFilesSelected(event);

      expect(component.selectedFiles().length).toBe(1);
      expect(component.fileErrors().length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // removeFile
  // -------------------------------------------------------------------------

  describe('removeFile', () => {
    it('should remove a file at the given index', () => {
      const fileA = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
      const fileB = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
      component.selectedFiles.set([fileA, fileB]);

      component.removeFile(0);

      expect(component.selectedFiles().length).toBe(1);
      expect(component.selectedFiles()[0].name).toBe('b.jpg');
    });
  });

  // -------------------------------------------------------------------------
  // submit — success
  // -------------------------------------------------------------------------

  describe('submit', () => {
    beforeEach(() => {
      component.form.patchValue({
        proofType: 'Event',
        eventDate: new Date('2025-10-01'),
        notes: '',
      });
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      component.selectedFiles.set([file]);
    });

    it('should call createProofRecord with FormData', () => {
      proofRecordSpy.createProofRecord.and.returnValue(of(MOCK_RESULT));

      component.submit();

      expect(proofRecordSpy.createProofRecord).toHaveBeenCalledWith('app-1', jasmine.any(FormData));
    });

    it('should close dialog with result on success', () => {
      proofRecordSpy.createProofRecord.and.returnValue(of(MOCK_RESULT));

      component.submit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(MOCK_RESULT);
    });

    it('should show success snackbar', () => {
      proofRecordSpy.createProofRecord.and.returnValue(of(MOCK_RESULT));

      component.submit();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Igazolás sikeresen rögzítve.',
        'Bezár',
        jasmine.any(Object)
      );
    });

    it('should show error snackbar and not close dialog on failure', () => {
      proofRecordSpy.createProofRecord.and.returnValue(throwError(() => new Error('server error')));

      component.submit();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Nem sikerült rögzíteni az igazolást.',
        'Bezár',
        jasmine.objectContaining({ panelClass: ['gm-snack-error'] })
      );
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should not call service when form is invalid', () => {
      component.form.controls.proofType.setValue(null);

      component.submit();

      expect(proofRecordSpy.createProofRecord).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Form validation
  // -------------------------------------------------------------------------

  describe('form validation', () => {
    it('should be invalid when proofType is not set', () => {
      component.form.patchValue({ eventDate: new Date() });
      expect(component.form.controls.proofType.hasError('required')).toBeTrue();
    });

    it('should be invalid when eventDate is not set', () => {
      component.form.patchValue({ proofType: 'Event' });
      expect(component.form.controls.eventDate.hasError('required')).toBeTrue();
    });

    it('should be valid when proofType and eventDate are set', () => {
      component.form.patchValue({ proofType: 'Event', eventDate: new Date() });
      expect(component.form.valid).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // fileSizeLabel
  // -------------------------------------------------------------------------

  describe('fileSizeLabel', () => {
    it('should display bytes for small files', () => {
      expect(component.fileSizeLabel(512)).toBe('512 B');
    });

    it('should display KB for medium files', () => {
      expect(component.fileSizeLabel(2048)).toBe('2.0 KB');
    });

    it('should display MB for large files', () => {
      expect(component.fileSizeLabel(5 * 1024 * 1024)).toBe('5.0 MB');
    });
  });
});
