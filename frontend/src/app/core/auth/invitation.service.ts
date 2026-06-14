import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InvitationPreview {
  email: string;
  scope: 'Platform' | 'Owner' | 'Foundation';
  role: string | null;
  ownerId: string | null;
  ownerName: string | null;
  foundationId: string | null;
  foundationName: string | null;
  isExpired: boolean;
}

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly http = inject(HttpClient);

  getPreview(token: string): Observable<InvitationPreview> {
    return this.http.get<InvitationPreview>(
      `${environment.apiUrl}/invitations/preview/${token}`
    );
  }
}
