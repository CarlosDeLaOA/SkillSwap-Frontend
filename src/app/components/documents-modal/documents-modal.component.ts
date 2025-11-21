import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Document {
  id?: number;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  url?: string;
}

@Component({
  selector: 'app-documents-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content documents-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>
            <i class='bx bx-file'></i>
            Documentos de la Sesión
          </h2>
          <button class="modal-close" (click)="close()">
            <i class='bx bx-x'></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="upload-section">
            <input 
              type="file" 
              #fileInput 
              (change)="onFileSelected($event)"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              hidden>
            <button class="btn-upload" (click)="fileInput.click()">
              <i class='bx bx-upload'></i>
              Subir Documento
            </button>
            <p class="upload-info">Máximo 10MB - PDF, DOC, DOCX, JPG, PNG</p>
          </div>

          <div *ngIf="uploading" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="uploadProgress"></div>
            </div>
            <span>Subiendo... {{ uploadProgress }}%</span>
          </div>

          <div class="documents-list">
            <div *ngIf="documents.length === 0" class="empty-state">
              <i class='bx bx-folder-open'></i>
              <p>No hay documentos subidos</p>
            </div>

            <div *ngFor="let doc of documents" class="document-item">
              <div class="doc-icon">
                <i [class]="getFileIcon(doc.type)"></i>
              </div>
              <div class="doc-info">
                <span class="doc-name">{{ doc.name }}</span>
                <span class="doc-meta">
                  {{ formatFileSize(doc.size) }} • {{ doc.uploadedBy }}
                </span>
              </div>
              <div class="doc-actions">
                <button class="btn-icon" (click)="downloadDocument(doc)" title="Descargar">
                  <i class='bx bx-download'></i>
                </button>
                <button 
                  *ngIf="canDelete(doc)" 
                  class="btn-icon btn-danger" 
                  (click)="deleteDocument(doc)"
                  title="Eliminar">
                  <i class='bx bx-trash'></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      animation: fadeIn 0.2s ease;
    }

    .documents-modal {
      max-width: 600px;
      max-height: 700px;
      width: 90%;
      display: flex;
      flex-direction: column;
    }

    .modal-content {
      background: #2c2c2c;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      padding: 20px 25px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 20px;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;

        i {
          font-size: 24px;
        }
      }
    }

    .modal-close {
      background: transparent;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: rotate(90deg);
      }
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      max-height: 600px;
    }

    .upload-section {
      text-align: center;
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      border: 2px dashed rgba(255, 255, 255, 0.2);
      margin-bottom: 25px;
    }

    .btn-upload {
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;

      i {
        font-size: 20px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }
    }

    .upload-info {
      margin-top: 12px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
    }

    .upload-progress {
      margin-bottom: 20px;
      
      .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.3s ease;
      }

      span {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .documents-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: rgba(255, 255, 255, 0.5);

      i {
        font-size: 80px;
        margin-bottom: 15px;
        opacity: 0.5;
      }

      p {
        font-size: 16px;
      }
    }

    .document-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .doc-icon {
      width: 45px;
      height: 45px;
      border-radius: 10px;
      background: rgba(102, 126, 234, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 24px;
        color: #667eea;
      }
    }

    .doc-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .doc-name {
      font-size: 15px;
      font-weight: 600;
      color: white;
    }

    .doc-meta {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
    }

    .doc-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      i {
        font-size: 18px;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      &.btn-danger {
        &:hover {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class DocumentsModalComponent implements OnInit {
  @Input() sessionId: number = 0;
  @Input() isModerator: boolean = false;
  @Input() currentUserId: number = 0;
  @Output() closeModal = new EventEmitter<void>();

  documents: Document[] = [];
  uploading: boolean = false;
  uploadProgress: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  close(): void {
    this.closeModal.emit();
  }

  loadDocuments(): void {
    this.http.get<any>(`${environment.apiUrl}/videocall/sessions/${this.sessionId}/documents`)
      .subscribe({
        next: (response) => {
          this.documents = response.data || [];
        },
        error: (error) => {
          console.error('Error al cargar documentos:', error);
        }
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'image/jpeg', 
      'image/png'
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo PDF, DOC, DOCX, JPG, PNG.');
      return;
    }

    this.uploadDocument(file);
  }

  uploadDocument(file: File): void {
    this.uploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${environment.apiUrl}/videocall/sessions/${this.sessionId}/documents`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploading = false;
          this.uploadProgress = 0;
          this.loadDocuments();
        }
      },
      error: (error) => {
        console.error('Error al subir:', error);
        this.uploading = false;
        this.uploadProgress = 0;
        alert('Error al subir el documento');
      }
    });
  }

  downloadDocument(doc: Document): void {
    this.http.get(`${environment.apiUrl}/videocall/sessions/${this.sessionId}/documents/${doc.id}/download`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar:', error);
        alert('Error al descargar el documento');
      }
    });
  }

  deleteDocument(doc: Document): void {
    if (confirm(`¿Eliminar "${doc.name}"?`)) {
      this.http.delete(`${environment.apiUrl}/videocall/sessions/${this.sessionId}/documents/${doc.id}`)
        .subscribe({
          next: () => {
            this.loadDocuments();
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el documento');
          }
        });
    }
  }

  canDelete(doc: Document): boolean {
    return this.isModerator || doc.uploadedBy === 'currentUser';
  }

  getFileIcon(type: string): string {
    if (type.includes('pdf')) return 'bx bxs-file-pdf';
    if (type.includes('word') || type.includes('doc')) return 'bx bxs-file-doc';
    if (type.includes('image')) return 'bx bxs-image';
    return 'bx bxs-file';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}