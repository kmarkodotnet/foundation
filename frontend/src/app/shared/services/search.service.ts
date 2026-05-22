import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { GlobalSearchResult } from '../models/search.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/search`;

  globalSearch(term: string) {
    const params = new HttpParams().set('q', term);
    return this.http.get<GlobalSearchResult>(this.base, { params });
  }
}
