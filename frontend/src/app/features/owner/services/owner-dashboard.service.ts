import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OwnerDashboardResponse } from '../models/owner-dashboard.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OwnerDashboardService {
  private readonly http = inject(HttpClient);

  getDashboard() {
    return this.http.get<OwnerDashboardResponse>(`${environment.apiUrl}/owner/reports/dashboard`);
  }
}
