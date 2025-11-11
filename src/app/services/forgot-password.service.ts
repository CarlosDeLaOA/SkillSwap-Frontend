import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth/password/reset`;

  request(email: string) {
    const params = new HttpParams().set('email', email);
    return this.http.post(`${this.base}/request`, null, { params, responseType: 'text' });
  }

  verify(email: string, code: string) {
    const params = new HttpParams().set('email', email).set('code', code);
    return this.http.post(`${this.base}/verify`, null, { params, responseType: 'text' });
  }

  confirm(email: string, code: string, newPassword: string) {
    const params = new HttpParams()
      .set('email', email)
      .set('code', code)
      .set('newPassword', newPassword);
    return this.http.post(`${this.base}/confirm`, null, { params, responseType: 'text' });
  }
}
