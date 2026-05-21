import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateInvoiceRequest,
  Invoice,
  InvoiceListDto,
  MarkInvoicePaidRequest,
} from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getInvoices(appId: string): Observable<InvoiceListDto> {
    return this.http.get<InvoiceListDto>(`${this.base}/${appId}/invoices`);
  }

  createInvoice(appId: string, data: CreateInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/${appId}/invoices`, data);
  }

  markPaid(appId: string, invoiceId: string, data: MarkInvoicePaidRequest): Observable<Invoice> {
    return this.http.patch<Invoice>(
      `${this.base}/${appId}/invoices/${invoiceId}/mark-paid`,
      data
    );
  }

  deleteInvoice(appId: string, invoiceId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${appId}/invoices/${invoiceId}`);
  }
}
