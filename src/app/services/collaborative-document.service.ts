import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export interface DocumentResponse {
  id: number;
  documentId: string;
  sessionId: number;
  content: string;
  version: number;
  sizeInBytes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface DocumentMessage {
  documentId: string;
  content: string;
  version: number;
  userId: string;
  userName: string;
  action: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollaborativeDocumentService {
  
  private apiUrl = 'http://localhost:8080/api/collaborative-documents';
  private wsUrl = 'http://localhost:8080/ws-documents';
  
  private stompClient: Client | null = null;
  private messageSubject = new Subject<DocumentMessage>();
  
  constructor(private http: HttpClient) {}

  //#region HTTP Methods

  getOrCreateDocument(sessionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/session/${sessionId}`);
  }

  updateDocument(documentId: string, content: string, version: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const body = {
      documentId: documentId,
      content: content,
      version: version
    };
    
    return this.http.put(`${this.apiUrl}/update`, body, { headers });
  }

  deactivateDocument(sessionId: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.post(`${this.apiUrl}/deactivate/${sessionId}`, {}, { headers });
  }

  //#endregion

  //#region WebSocket Methods

  connect(documentId: string): Observable<DocumentMessage> {
    console.log('Connecting to WebSocket with SockJS');
    console.log('URL:', this.wsUrl);
    console.log('Document ID:', documentId);
    
    // Create STOMP client
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl) as any,
      debug: (str) => {
        // Debug logs disabled
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });
    
    // Connect
    this.stompClient.onConnect = () => {
      console.log('WebSocket connected successfully');
      
      // Subscribe to document topic
      this.stompClient?.subscribe(`/topic/document/${documentId}`, (message) => {
        const parsedMessage: DocumentMessage = JSON.parse(message.body);
        console.log('Message received from server:', parsedMessage.action);
        this.messageSubject.next(parsedMessage);
      });
      
      console.log(`Subscribed to: /topic/document/${documentId}`);
    };
    
    this.stompClient.onStompError = (frame) => {
      console.error('WebSocket error:', frame.headers['message']);
    };
    
    this.stompClient.activate();
    
    return this.messageSubject.asObservable();
  }

  sendUpdate(message: DocumentMessage): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/document/${message.documentId}/update`,
        body: JSON.stringify(message)
      });
      console.log('UPDATE sent to server');
    } else {
      console.error('WebSocket not connected. Cannot send update.');
    }
  }

  sendUserJoin(message: DocumentMessage): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/document/${message.documentId}/join`,
        body: JSON.stringify(message)
      });
      console.log('USER_JOIN sent to server:', message.userName);
    } else {
      console.warn('WebSocket not connected. Cannot notify user join.');
    }
  }

  sendUserLeave(message: DocumentMessage): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/document/${message.documentId}/leave`,
        body: JSON.stringify(message)
      });
      console.log('USER_LEAVE sent to server:', message.userName);
    } else {
      console.warn('WebSocket not connected. Cannot notify user leave.');
    }
  }

  sendCursorUpdate(message: DocumentMessage): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: `/app/document/${message.documentId}/cursor`,
        body: JSON.stringify(message)
      });
      // No log to avoid console spam (sent constantly)
    } else {
      console.warn('WebSocket not connected. Cannot send cursor position.');
    }
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate();
      console.log('WebSocket disconnected');
    }
  }

  //#endregion
}