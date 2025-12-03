import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, Message, Stomp } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class CommunityWebsocketService {

  private stompClient: Client | null = null;
  private messageSubject = new Subject<any>();
  private connected = false;
  private currentCommunityId: number | null = null;

  constructor() {}

  public connect(communityId: number): Observable<any> {
    if (this.connected && this.currentCommunityId === communityId) {
      return this.messageSubject.asObservable();
    }

    if (this.stompClient && this.connected) {
      this.disconnect();
    }

    this.currentCommunityId = communityId;

    const socket = new SockJS('http://localhost:8080/ws-chat');

    this.stompClient = Stomp.over(() => socket);

    //  FIX ERROR (debug no es call signature)
    (this.stompClient as any).debug = () => {};

    this.stompClient.onConnect = () => {
      this.connected = true;
      console.log(' Connected WebSocket');

      this.stompClient?.subscribe(
        `/topic/community/${communityId}`,
        (message: Message) => {
          const payload = JSON.parse(message.body);
          console.log(' Message:', payload);
          this.messageSubject.next(payload);
        }
      );
    };

    this.stompClient.onStompError = (frame) => {
      console.error(' STOMP Error:', frame);
      this.connected = false;
    };

    this.stompClient.activate();

    return this.messageSubject.asObservable();
  }

  public sendMessage(communityId: number, senderId: number, content: string): void {
    if (!this.stompClient || !this.connected) {
      console.error(' Not connected');
      return;
    }

    const message = { senderId, content };

    //  FIX: send() ya no existe → usar publish()
    this.stompClient.publish({
      destination: `/app/chat/${communityId}`,
      body: JSON.stringify(message)
    });
  }

  public disconnect(): void {
    if (this.stompClient && this.connected) {

      //  FIX: disconnect(callback) YA NO EXISTE
      this.stompClient.deactivate();

      console.log(' Disconnected');
      this.connected = false;
      this.currentCommunityId = null;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
