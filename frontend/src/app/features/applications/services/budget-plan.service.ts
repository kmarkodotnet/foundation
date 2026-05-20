import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BudgetPlan, UpsertBudgetPlanRequest } from '../models/application.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetPlanService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/applications`;

  getBudgetPlan(appId: string): Observable<BudgetPlan | null> {
    return this.http.get<BudgetPlan | null>(`${this.base}/${appId}/budget-plan`);
  }

  upsertBudgetPlan(appId: string, data: UpsertBudgetPlanRequest): Observable<BudgetPlan> {
    return this.http.put<BudgetPlan>(`${this.base}/${appId}/budget-plan`, data);
  }

  requestApproval(appId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${appId}/budget-plan/request-approval`, {});
  }
}
