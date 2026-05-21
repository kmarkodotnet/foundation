import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { VendorContractService } from './vendor-contract.service';
import { CreateVendorContractRequest, VendorContract } from '../models/application.model';
import { environment } from '../../../../environments/environment';

const MOCK_CONTRACT: VendorContract = {
  id: 'contract-1',
  applicationId: 'app-123',
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

describe('VendorContractService', () => {
  let service: VendorContractService;
  let httpMock: HttpTestingController;
  const appId = 'app-123';
  const baseUrl = `${environment.apiUrl}/applications/${appId}/vendor-contracts`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VendorContractService,
      ],
    });
    service = TestBed.inject(VendorContractService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // getContracts
  // -------------------------------------------------------------------------

  describe('getContracts', () => {
    it('should GET from the correct endpoint', () => {
      service.getContracts(appId).subscribe((result) => {
        expect(result).toEqual([MOCK_CONTRACT]);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush([MOCK_CONTRACT]);
    });

    it('should return an empty array when no contracts exist', () => {
      service.getContracts(appId).subscribe((result) => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush([]);
    });
  });

  // -------------------------------------------------------------------------
  // createContract
  // -------------------------------------------------------------------------

  describe('createContract', () => {
    const request: CreateVendorContractRequest = {
      vendorId: 'vendor-1',
      amount: 500000,
      currency: 'HUF',
      contractDate: '2025-01-15',
      contractIdentifier: 'SZ-001',
    };

    it('should POST to the correct endpoint with the given payload', () => {
      service.createContract(appId, request).subscribe((result) => {
        expect(result).toEqual(MOCK_CONTRACT);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(MOCK_CONTRACT);
    });

    it('should include budgetItemId in the request when provided', () => {
      const requestWithBudgetItem: CreateVendorContractRequest = {
        ...request,
        budgetItemId: 'item-1',
      };

      service.createContract(appId, requestWithBudgetItem).subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.body.budgetItemId).toBe('item-1');
      req.flush(MOCK_CONTRACT);
    });

    it('should return the created contract', () => {
      service.createContract(appId, request).subscribe((result) => {
        expect(result.id).toBe(MOCK_CONTRACT.id);
        expect(result.vendorName).toBe(MOCK_CONTRACT.vendorName);
        expect(result.amount).toBe(MOCK_CONTRACT.amount);
      });

      httpMock.expectOne(baseUrl).flush(MOCK_CONTRACT);
    });
  });

  // -------------------------------------------------------------------------
  // deleteContract
  // -------------------------------------------------------------------------

  describe('deleteContract', () => {
    const contractId = 'contract-1';

    it('should DELETE to the correct endpoint', () => {
      service.deleteContract(appId, contractId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${contractId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
