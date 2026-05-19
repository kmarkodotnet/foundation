import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, shareReplay, tap } from 'rxjs';
import { NotificationPreferencesDto, UserProfileDto } from '../../core/auth/models/auth-result.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  private readonly profile$ = this.refresh$.pipe(
    switchMap(() => this.http.get<UserProfileDto>(`${environment.apiUrl}/auth/me`)),
    shareReplay(1)
  );

  getProfile(): Observable<UserProfileDto> {
    return this.profile$;
  }

  updateNotificationPreferences(
    prefs: NotificationPreferencesDto
  ): Observable<NotificationPreferencesDto> {
    return this.http
      .put<NotificationPreferencesDto>(
        `${environment.apiUrl}/auth/me/notification-preferences`,
        prefs
      )
      .pipe(tap(() => this.refresh$.next()));
  }
}
