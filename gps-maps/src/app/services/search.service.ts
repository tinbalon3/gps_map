import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface SearchResponse {
  status: string;
  results: SearchResult[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  searchLocation(query:any): Observable<SearchResponse> {
    return this.http.post<SearchResponse>(`${this.apiUrl}/search`,query);
  }
}