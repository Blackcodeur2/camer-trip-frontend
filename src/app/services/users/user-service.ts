import { inject, Injectable } from '@angular/core';
import { User } from '../../models/user';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaginatedUsers {
  current_page: number;
  data: User[];
  total: number;
  per_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface UsersApiResponse {
  statut: boolean;
  data: PaginatedUsers;
}

@Injectable({
  providedIn: 'root',
})

export class UserService { 
  private http = inject(HttpClient);
    private readonly API = environment.apiUrl;

    getUsers(page: number = 1): Observable<UsersApiResponse> {
        return this.http.get<UsersApiResponse>(`${this.API}/admin/users?page=${page}`);
    }

    createUser(userData: Partial<User>): Observable<User> {
        return this.http.post<User>(`${this.API}/admin/users`, userData);
    }
}
