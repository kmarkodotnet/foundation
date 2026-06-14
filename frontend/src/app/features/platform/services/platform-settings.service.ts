import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlatformSettings, UpdatePlatformSettingsRequest } from '../models/platform-settings.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformSettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/platform/settings`;

  get() {
    return this.http.get<PlatformSettings>(this.base);
  }

  update(request: UpdatePlatformSettingsRequest) {
    return this.http.patch<PlatformSettings>(this.base, request);
  }
}
