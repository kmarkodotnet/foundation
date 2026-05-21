import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { InvoiceService } from './invoice.service';
import {
  CreateInvoiceRequest,
  Invoice,
  InvoiceListDto,
  MarkInvoicePaidRequest,
} from '../models/application.model';
import { environment } from '../../../../environments/environment';

const MOCK_INVOICE: Invoice = {
  id: 'invoice-1',
  applicationId: 'app-123',
  supplierName: 'Acme Kft.',
  invoiceNumber: 'SZ-2025-001',
  issueDate: '2025-10-15',
  amount: 125000,
  isPaid: false,
  paymentDate: null,
  vendorContractId: null,
  budgetItemId: null,
  notes: null,
  createdAt: '2025-10-15T10:00:00Z',
};

const MOCK_SUMMARY = {
  awardedAmount: 1000000,
  totalPlanned: 850000,
  totalInvoiced: 125000,
  totalPaid: 0,
  totalUnpaid: 125000,
  balance: 875000,
};

const MOCK_LIST_DTO: InvoiceListDto = {
  summary: MOCK_SUMMARY,
  items: [MOCK_INVOICE],
};

describe('InvoiceService', () => {
  let service: InvoiceService;
  let httpMock: HttpTestingController;
  const appId = 'app-123';
  const baseUrl = `${environment.apiUrl}/applications/${appId}/invoices`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InvoiceService,
      ],
    });
    service = TestBed.inject(InvoiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // getInvoices
  // -------------------------------------------------------------------------

  describe('getInvoices', () => {
    it('should GET from the correct endpoint and return InvoiceListDto', () => {
      service.getInvoices(appId).subscribe((result) => {
        expect(result).toEqual(MOCK_LIST_DTO);
        expect(result.items.length).toBe(1);
        expect(result.summary.totalInvoiced).toBe(125000);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_LIST_DTO);
    });

    it('should return empty items when no invoices exist', () => {
      service.getInvoices(appId).subscribe((result) => {
        expect(result.items).toEqual([]);
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({ summary: MOCK_SUMMARY, items: [] });
    });
  });

  // -------------------------------------------------------------------------
  // createInvoice
  // -------------------------------------------------------------------------

  describe('createInvoice', () => {
    const request: CreateInvoiceRequest = {
      supplierName: 'Acme Kft.',
      invoiceNumber: 'SZ-2025-001',
      issueDate: '2025-10-15',
      amount: 125000,
      isPaid: false,
    };

    it('should POST to the correct endpoint with the given payload', () => {
      service.createInvoice(appId, request).subscribe((result) => {
        expect(result).toEqual(MOCK_INVOICE);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(MOCK_INVOICE);
    });

    it('should include paymentDate in the request when isPaid is true', () => {
      const paidRequest: CreateInvoiceRequest = {
        ...request,
        isPaid: true,
        paymentDate: '2025-10-20',
      };

      service.createInvoice(appId, paidRequest).subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.body.paymentDate).toBe('2025-10-20');
      req.flush(MOCK_INVOICE);
    });

    it('should include budgetItemId in the request when provided', () => {
      const requestWithBudget: CreateInvoiceRequest = {
        ...request,
        budgetItemId: 'item-1',
      };

      service.createInvoice(appId, requestWithBudget).subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.body.budgetItemId).toBe('item-1');
      req.flush(MOCK_INVOICE);
    });

    it('should return the created invoice', () => {
      service.createInvoice(appId, request).subscribe((result) => {
        expect(result.id).toBe(MOCK_INVOICE.id);
        expect(result.supplierName).toBe(MOCK_INVOICE.supplierName);
        expect(result.amount).toBe(MOCK_INVOICE.amount);
      });

      httpMock.expectOne(baseUrl).flush(MOCK_INVOICE);
    });
  });

  // -------------------------------------------------------------------------
  // markPaid
  // -------------------------------------------------------------------------

  describe('markPaid', () => {
    const invoiceId = 'invoice-1';
    const request: MarkInvoicePaidRequest = { paymentDate: '2025-10-22' };
    const markPaidUrl = `${baseUrl}/${invoiceId}/mark-paid`;

    it('should PATCH to the correct endpoint with paymentDate', () => {
      const paidInvoice = { ...MOCK_INVOICE, isPaid: true, paymentDate: '2025-10-22' };

      service.markPaid(appId, invoiceId, request).subscribe((result) => {
        expect(result.isPaid).toBeTrue();
        expect(result.paymentDate).toBe('2025-10-22');
      });

      const req = httpMock.expectOne(markPaidUrl);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(request);
      req.flush(paidInvoice);
    });

    it('should return the updated invoice with isPaid=true', () => {
      const paidInvoice = { ...MOCK_INVOICE, isPaid: true, paymentDate: '2025-10-22' };

      service.markPaid(appId, invoiceId, request).subscribe((result) => {
        expect(result.isPaid).toBeTrue();
      });

      httpMock.expectOne(markPaidUrl).flush(paidInvoice);
    });
  });

  // -------------------------------------------------------------------------
  // deleteInvoice
  // -------------------------------------------------------------------------

  describe('deleteInvoice', () => {
    const invoiceId = 'invoice-1';

    it('should DELETE to the correct endpoint', () => {
      service.deleteInvoice(appId, invoiceId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${invoiceId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
