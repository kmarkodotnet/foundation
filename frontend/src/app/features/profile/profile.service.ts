import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { UserProfileDto } from '../../core/auth/models/auth-result.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  private readonly profile$ = this.http
    .get<UserProfileDto>(`${environment.apiUrl}/auth/me`)
    .pipe(shareReplay(1));

  getProfile(): Observable<UserProfileDto> {
    return this.profile$;
  }
}
