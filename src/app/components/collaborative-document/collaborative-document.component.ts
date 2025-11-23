import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { CollaborativeDocumentService, DocumentMessage, DocumentResponse } from '../../services/collaborative-document.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-collaborative-document',
  standalone: true,
  imports: [CommonModule, QuillModule, FormsModule],
  templateUrl: './collaborative-document.component.html',
  styleUrls: ['./collaborative-document.component.scss']
})
export class CollaborativeDocumentComponent implements OnInit, OnDestroy {

  @Input() sessionId!: number;

  //#region Properties
  private quillInstance: any = null;
  
  // Collaborative cursors
  private userColors: Map<string, string> = new Map();
  private readonly COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];
  private colorIndex = 0;

  // Document data
  document: DocumentResponse | null = null;
  documentId: string = '';
  content: string = '';
  version: number = 0;

  // State
  isLoading: boolean = true;
  isSaving: boolean = false;
  errorMessage: string = '';
  
  // Active users
  activeUsers: Map<string, string> = new Map();

  // Quill configuration
  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]
  };

  // WebSocket
  private wsSubscription: Subscription | null = null;
  private updateTimeout: any = null;
  private readonly UPDATE_DELAY = 300;
  private isRemoteUpdate: boolean = false;

  // Current user
  private currentUser = {
    id: '',
    name: ''
  };
  //#endregion

  constructor(
    private documentService: CollaborativeDocumentService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  //#region Lifecycle Hooks
  ngOnInit(): void {
    console.log('Initiating collaborative document component');
    console.log('Session ID:', this.sessionId);
    
    this.loadCurrentUser();
    this.loadDocument();
  }

  ngOnDestroy(): void {
    console.log('Disconnecting collaborative document component');
    this.disconnect();
  }
  //#endregion

  //#region Editor Setup
  onEditorCreated(quill: any): void {
    console.log('Quill editor created');
    
    this.quillInstance = quill;
    
    if (this.content) {
      quill.setText(this.content);
    }
    
    // Listen to text changes
    quill.on('text-change', (delta: any, oldDelta: any, source: string) => {
      if (source === 'user' && !this.isRemoteUpdate) {
        this.onLocalChange();
      }
    });

    // Listen to cursor changes
    quill.on('selection-change', (range: any, oldRange: any, source: string) => {
      if (range && source === 'user') {
        this.sendCursorUpdate(range.index, range.length);
      }
    });
  }
  //#endregion

  //#region User Management
  private loadCurrentUser(): void {
    console.log('Loading current user data');
    
    // Get email from JWT token
    const token = localStorage.getItem('access_token');
    let userEmail = '';
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userEmail = payload.sub || '';
        console.log('Email from token:', userEmail);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    const uniqueId = userEmail || ('user_' + Math.random().toString(36).substring(2, 15));
    
    // Initialize with temporary value
    this.currentUser = {
      id: uniqueId,
      name: userEmail ? userEmail.split('@')[0] : 'Anonymous User'
    };
    
    console.log('Temporary user:', this.currentUser.name);
    
    // Fetch full name from backend
    this.http.get<any>('http://localhost:8080/persons/me').subscribe({
      next: (response) => {
        const personData = response.data || response;
        console.log('Backend data received:', personData);
        
        if (personData.fullName) {
          this.currentUser.name = personData.fullName;
          console.log('Name updated:', this.currentUser.name);
          
          // Resend USER_JOIN with correct name
          if (this.documentId) {
            const updateMessage: DocumentMessage = {
              documentId: this.documentId,
              content: '',
              version: this.version,
              userId: this.currentUser.id,
              userName: this.currentUser.name,
              action: 'USER_JOIN',
              timestamp: Date.now()
            };
            this.documentService.sendUserJoin(updateMessage);
          }
        }
      },
      error: (error) => {
        console.warn('Could not fetch name from backend:', error);
        console.log('Using email-based name:', this.currentUser.name);
      }
    });
  }

  private getUserColor(userId: string): string {
    if (!this.userColors.has(userId)) {
      const color = this.COLORS[this.colorIndex % this.COLORS.length];
      this.userColors.set(userId, color);
      this.colorIndex++;
    }
    return this.userColors.get(userId)!;
  }
  //#endregion

  //#region Document Management
  private loadDocument(): void {
    this.isLoading = true;
    
    this.documentService.getOrCreateDocument(this.sessionId).subscribe({
      next: (response) => {
        console.log('Document loaded');
        
        this.document = response.data;
        this.documentId = response.data.documentId;
        this.content = response.data.content || '';
        this.version = response.data.version;
        
        if (this.quillInstance) {
          this.quillInstance.setText(this.content);
        }
        
        this.connectWebSocket();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading document:', error);
        this.errorMessage = 'Error loading document';
        this.isLoading = false;
      }
    });
  }

  exportDocument(): void {
    const blob = new Blob([this.content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-notes-${this.sessionId}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  //#endregion

  //#region WebSocket Management
  private connectWebSocket(): void {
    this.wsSubscription = this.documentService.connect(this.documentId).subscribe({
      next: (message: DocumentMessage) => {
        this.handleWebSocketMessage(message);
      },
      error: (error) => {
        console.error('WebSocket error:', error);
      }
    });

    setTimeout(() => {
      const joinMessage: DocumentMessage = {
        documentId: this.documentId,
        content: '',
        version: this.version,
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        action: 'USER_JOIN',
        timestamp: Date.now()
      };
      
      this.documentService.sendUserJoin(joinMessage);
    }, 1000);
  }

  private handleWebSocketMessage(message: DocumentMessage): void {
    console.log('Message received:', message.action, 'from', message.userName);

    if (message.userId === this.currentUser.id) {
      return;
    }

    switch (message.action) {
      case 'UPDATE':
        console.log('Updating content from server');
        
        if (this.quillInstance) {
          this.isRemoteUpdate = true;
          
          const selection = this.quillInstance.getSelection();
          this.quillInstance.setText(message.content);
          
          if (selection) {
            this.quillInstance.setSelection(selection.index, 0);
          }
          
          this.content = message.content;
          this.version = message.version;
          
          console.log('Updated to version', this.version);
          
          setTimeout(() => {
            this.isRemoteUpdate = false;
          }, 100);
        }
        break;

      case 'CURSOR_MOVE':
        this.showRemoteCursor(message);
        break;

      case 'USER_JOIN':
        this.activeUsers.set(message.userId, message.userName);
        console.log(message.userName, 'joined');
        break;

      case 'USER_LEAVE':
        this.activeUsers.delete(message.userId);
        this.removeRemoteCursor(message.userId);
        console.log(message.userName, 'left');
        break;
    }
  }

  private disconnect(): void {
    const leaveMessage: DocumentMessage = {
      documentId: this.documentId,
      content: '',
      version: this.version,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'USER_LEAVE',
      timestamp: Date.now()
    };
    
    this.documentService.sendUserLeave(leaveMessage);

    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    
    this.documentService.disconnect();
  }
  //#endregion

  //#region Content Updates
  private onLocalChange(): void {
    console.log('Local change detected');
    
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      this.sendUpdate();
    }, this.UPDATE_DELAY);
  }

  private sendUpdate(): void {
    if (!this.quillInstance) return;
    
    const currentContent = this.quillInstance.getText();
    this.content = currentContent;
    this.version++;
    
    const message: DocumentMessage = {
      documentId: this.documentId,
      content: this.content,
      version: this.version,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'UPDATE',
      timestamp: Date.now()
    };

    console.log('Sending version', this.version);
    this.documentService.sendUpdate(message);
    
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
    }, 1000);
  }
  //#endregion

  //#region Cursor Management
  private sendCursorUpdate(index: number, length: number): void {
    const message: DocumentMessage = {
      documentId: this.documentId,
      content: JSON.stringify({ index, length }),
      version: this.version,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'CURSOR_MOVE',
      timestamp: Date.now()
    };
    
    this.documentService.sendCursorUpdate(message);
  }

  private showRemoteCursor(message: DocumentMessage): void {
    if (!this.quillInstance) return;
    
    try {
      const cursorData = JSON.parse(message.content);
      const color = this.getUserColor(message.userId);
      
      this.removeRemoteCursor(message.userId);
      
      const cursorId = `cursor-${message.userId}`;
      const cursor = document.createElement('div');
      cursor.id = cursorId;
      cursor.className = 'remote-cursor';
      cursor.style.cssText = `
        position: absolute;
        width: 2px;
        height: 20px;
        background-color: ${color};
        z-index: 1000;
        pointer-events: none;
      `;
      
      const label = document.createElement('div');
      label.className = 'cursor-label';
      label.textContent = message.userName;
      label.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        background-color: ${color};
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        white-space: nowrap;
        font-family: Arial, sans-serif;
      `;
      
      cursor.appendChild(label);
      
      const bounds = this.quillInstance.getBounds(cursorData.index);
      cursor.style.left = bounds.left + 'px';
      cursor.style.top = bounds.top + 'px';
      
      const editorElement = this.quillInstance.root.parentElement;
      editorElement?.appendChild(cursor);
      
      setTimeout(() => {
        this.removeRemoteCursor(message.userId);
      }, 5000);
      
    } catch (error) {
      console.error('Error showing remote cursor:', error);
    }
  }

  private removeRemoteCursor(userId: string): void {
    const cursorId = `cursor-${userId}`;
    const existingCursor = document.getElementById(cursorId);
    if (existingCursor) {
      existingCursor.remove();
    }
  }
  //#endregion
}