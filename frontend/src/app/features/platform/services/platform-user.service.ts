import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InvitePlatformUserRequest, PlatformUserListItem } from '../models/platform-user.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformUserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/platform/users`;

  list() {
    return this.http.get<PlatformUserListItem[]>(this.base);
  }

  invite(request: InvitePlatformUserRequest) {
    return this.http.post<void>(`${this.base}/invite`, request);
  }
}
