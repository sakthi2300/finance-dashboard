import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Add auth header
    const authReq = req.clone({
      setHeaders: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      }
    });

    // Mock API responses
    if (req.url.includes('/api/')) {
      return this.handleMockApi(req);
    }

    return next.handle(authReq);
  }

  private handleMockApi(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const mockResponse = new HttpResponse({
      status: 200,
      body: { message: 'Mock response', data: [] }
    });

    return of(mockResponse).pipe(delay(300));
  }
}
