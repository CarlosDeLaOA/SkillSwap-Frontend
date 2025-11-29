import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupDocumentService } from '../../services/group-document.service';
import {
  IGroupSessionDocument,
  IStorageStats
} from '../../interfaces';

interface DocumentType {
  id: string;
  name: string;
  icon: string;
}

/**
 * Componente para gestionar documentos de sesiones grupales
 * Permite subir, visualizar, descargar y eliminar documentos PDF
 */
@Component({
  selector: 'app-group-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-documents.component.html',
  styleUrls: ['./group-documents.component.scss']
})
export class GroupDocumentsComponent implements OnInit {

  //#region Inputs
  @Input() communityId!:number;
  @Input() communityName: string='';
  //#endregion

  //#region Properties
  documents: IGroupSessionDocument[]=[];
  groupedDocuments: { [key: string]: IGroupSessionDocument[] }={};
  storageStats: IStorageStats|null=null;

  isLoading: boolean=true;
  isUploading: boolean=false;
  showUploadModal: boolean=false;

  selectedFile: File|null=null;
  uploadDescription: string='';
  uploadSessionId: number|null=null;
  uploadSessionDate: string='';

  viewMode: 'list'|'byDate'|'bySession'|'deleted'='byDate';

  errorMessage: string='';
  successMessage: string='';

  availableSessions: { id: number; title: string }[]=[];

  documentTypes: DocumentType[]=[
    { id: 'support', name: 'Material de Apoyo / Repaso', icon: 'bx-book' },
    { id: 'session', name: 'Documento de Sesión', icon: 'bx-video' }
  ];
  selectedDocumentType: string='support';

  showDeleteModal: boolean=false;
  documentToDelete: IGroupSessionDocument|null=null;
  deleteReason: string='';
  isDeleting: boolean=false;
  //#endregion

  //#region Constructor
  constructor(private documentService: GroupDocumentService) {}
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    if (this.communityId) {
      this.loadDocuments();
      this.loadStorageStats();
    }
  }
  //#endregion

  //#region Load Methods
  /**
   * Carga los documentos según el modo de vista seleccionado
   */
  loadDocuments(): void {
    this.isLoading=true;
    this.errorMessage='';

    if (this.viewMode==='deleted') {
      this.loadDeletedDocuments();
    } else if (this.viewMode==='byDate') {
      this.loadDocumentsGroupedByDate();
    } else if (this.viewMode==='bySession') {
      this.loadDocumentsGroupedBySession();
    } else {
      this.loadDocumentsList();
    }
  }

  /**
   * Carga lista plana de documentos
   */
  private loadDocumentsList(): void {
    this.documentService.getDocumentsByCommunity(this.communityId).subscribe({
      next: (response)=>{
        if (response.success) {
          this.documents=response.data;
          this.extractAvailableSessions();
        }
        this.isLoading=false;
      },
      error: (error)=>{
        console.error('Error al cargar documentos:', error);
        this.errorMessage='Error al cargar los documentos';
        this.isLoading=false;
      }
    });
  }

  /**
   * Carga documentos agrupados por fecha
   */
  private loadDocumentsGroupedByDate(): void {
    this.documentService.getDocumentsGroupedByDate(this.communityId).subscribe({
      next: (response)=>{
        if (response.success) {
          this.groupedDocuments=response.data;
          this.flattenGroupedDocuments();
        }
        this.isLoading=false;
      },
      error: (error)=>{
        console.error('Error al cargar documentos:', error);
        this.errorMessage='Error al cargar los documentos';
        this.isLoading=false;
      }
    });
  }

  /**
   * Carga documentos agrupados por sesión
   */
  private loadDocumentsGroupedBySession(): void {
    this.documentService.getDocumentsGroupedBySession(this.communityId).subscribe({
      next: (response)=>{
        if (response.success) {
          this.groupedDocuments=response.data;
          this.flattenGroupedDocuments();
        }
        this.isLoading=false;
      },
      error: (error)=>{
        console.error('Error al cargar documentos:', error);
        this.errorMessage='Error al cargar los documentos';
        this.isLoading=false;
      }
    });
  }

  /**
   * Carga documentos borrados
   */
  private loadDeletedDocuments(): void {
    this.documentService.getDeletedDocuments(this.communityId).subscribe({
      next: (response)=>{
        if (response.success) {
          this.documents=response.data;
          this.groupedDocuments={};
        }
        this.isLoading=false;
      },
      error: (error)=>{
        console.error('Error al cargar documentos borrados:', error);
        this.errorMessage='Error al cargar el historial de documentos borrados';
        this.isLoading=false;
      }
    });
  }

  /**
   * Convierte documentos agrupados a lista plana
   */
  private flattenGroupedDocuments(): void {
    this.documents=[];
    for (const docs of Object.values(this.groupedDocuments)) {
      this.documents.push(...docs);
    }
    this.extractAvailableSessions();
  }

  /**
   * Extrae las sesiones disponibles de los documentos
   */
  private extractAvailableSessions(): void {
    const sessionsMap=new Map<number, string>();
    this.documents.forEach(doc=>{
      if (doc.learningSession) {
        sessionsMap.set(doc.learningSession.id, doc.learningSession.title);
      }
    });
    this.availableSessions=Array.from(sessionsMap.entries()).map(([id, title])=>({ id, title }));
  }

  /**
   * Carga estadísticas de almacenamiento
   */
  loadStorageStats(): void {
    this.documentService.getStorageStats(this.communityId).subscribe({
      next: (response)=>{
        if (response.success) {
          this.storageStats=response.data;
        }
      },
      error: (error)=>{
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }
  //#endregion

  //#region Upload Methods
  /**
   * Abre el modal de subida
   */
  openUploadModal(): void {
    this.showUploadModal=true;
    this.selectedFile=null;
    this.uploadDescription='';
    this.uploadSessionId=null;
    this.uploadSessionDate='';
    this.selectedDocumentType='support';
    this.errorMessage='';
    this.successMessage='';
  }

  /**
   * Cierra el modal de subida
   */
  closeUploadModal(): void {
    this.showUploadModal=false;
    this.selectedFile=null;
    this.uploadDescription='';
    this.errorMessage='';
  }

  /**
   * Maneja la selección de archivo
   */
  onFileSelected(event: any): void {
    const file=event.target.files[0];
    if (file) {
      const validation=this.documentService.validatePdfFile(file);
      if (validation.valid) {
        this.selectedFile=file;
        this.errorMessage='';
      } else {
        this.selectedFile=null;
        this.errorMessage=validation.error||'Archivo inválido';
      }
    }
  }

  /**
   * Sube el documento seleccionado
   */
  uploadDocument(): void {
    if (!this.selectedFile) {
      this.errorMessage='Selecciona un archivo PDF';
      return;
    }

    if (this.selectedDocumentType==='session'&&!this.uploadSessionId) {
      this.errorMessage='Selecciona una sesión';
      return;
    }

    this.isUploading=true;
    this.errorMessage='';

    const sessionId=this.selectedDocumentType==='session' ? this.uploadSessionId : null;
    const sessionDate=this.uploadSessionDate||new Date().toISOString();

    this.documentService.uploadDocument(
      this.selectedFile,
      this.communityId,
      sessionId,
      sessionDate,
      this.uploadDescription
    ).subscribe({
      next: (response)=>{
        if (response.success) {
          this.successMessage='Documento subido exitosamente';
          this.closeUploadModal();
          this.loadDocuments();
          this.loadStorageStats();
          setTimeout(()=>this.successMessage='', 3000);
        } else {
          this.errorMessage=response.message||'Error al subir el documento';
        }
        this.isUploading=false;
      },
      error: (error)=>{
        console.error('Error al subir documento:', error);
        if (error.status===413) {
          this.errorMessage='El archivo excede el límite de almacenamiento del grupo (100MB)';
        } else if (error.status===400) {
          this.errorMessage='Solo se permiten archivos PDF';
        } else if (error.status===403) {
          this.errorMessage='No tienes permisos para subir documentos';
        } else {
          this.errorMessage=error.error?.message||'Error al subir el documento';
        }
        this.isUploading=false;
      }
    });
  }
  //#endregion

  //#region Download Methods
  /**
   * Descarga un documento desde Cloudinary
   */
  downloadDocument(document: IGroupSessionDocument): void {
    this.documentService.downloadDocument(document.id).subscribe({
      next: ()=>{
        console.log('Descarga iniciada');
      },
      error: (error)=>{
        console.error('Error al descargar:', error);
        this.errorMessage='Error al descargar el documento';
        setTimeout(()=>this.errorMessage='', 3000);
      }
    });
  }

  /**
   * Abre documento en nueva pestaña para visualizar desde Cloudinary
   */
  viewDocument(document: IGroupSessionDocument): void {
    this.documentService.viewDocument(document.id).subscribe({
      next: ()=>{
        console.log('Documento abierto');
      },
      error: (error)=>{
        console.error('Error al visualizar:', error);
        this.errorMessage='Error al visualizar el documento';
        setTimeout(()=>this.errorMessage='', 3000);
      }
    });
  }
  //#endregion

  //#region Delete Methods
  /**
   * Abre el modal de confirmación de borrado
   */
  openDeleteModal(document: IGroupSessionDocument): void {
    this.documentToDelete=document;
    this.deleteReason='';
    this.showDeleteModal=true;
    this.errorMessage='';
  }

  /**
   * Cierra el modal de confirmación de borrado
   */
  closeDeleteModal(): void {
    this.showDeleteModal=false;
    this.documentToDelete=null;
    this.deleteReason='';
    this.errorMessage='';
  }

  /**
   * Confirma y ejecuta el borrado del documento
   */
  confirmDelete(): void {
    if (!this.documentToDelete) return;

    if (!this.deleteReason.trim()) {
      this.errorMessage='Debes proporcionar una razón para eliminar el documento';
      return;
    }

    this.isDeleting=true;
    this.errorMessage='';

    this.documentService.deleteDocument(this.documentToDelete.id, this.deleteReason).subscribe({
      next: (response)=>{
        if (response.success) {
          this.successMessage='Documento eliminado exitosamente';
          this.closeDeleteModal();
          this.loadDocuments();
          this.loadStorageStats();
          setTimeout(()=>this.successMessage='', 3000);
        } else {
          this.errorMessage=response.message||'Error al eliminar';
        }
        this.isDeleting=false;
      },
      error: (error)=>{
        console.error('Error al eliminar:', error);
        this.errorMessage='Error al eliminar el documento';
        this.isDeleting=false;
      }
    });
  }

  /**
   * Elimina un documento - abre modal de confirmación
   */
  deleteDocument(document: IGroupSessionDocument): void {
    this.openDeleteModal(document);
  }
  //#endregion

  //#region View Methods
  /**
   * Cambia el modo de visualización
   */
  changeViewMode(mode: 'list'|'byDate'|'bySession'|'deleted'): void {
    this.viewMode=mode;
    this.loadDocuments();
  }

  /**
   * Obtiene las claves del objeto agrupado
   */
  getGroupKeys(): string[] {
    return Object.keys(this.groupedDocuments).sort().reverse();
  }
  //#endregion

  //#region Utility Methods
  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return this.documentService.formatDate(dateString);
  }

  /**
   * Formatea el tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    return this.documentService.formatFileSize(bytes);
  }

  /**
   * Obtiene las iniciales del nombre
   */
  getInitials(fullName: string): string {
    if (!fullName) return '?';
    const names=fullName.split(' ');
    if (names.length>=2) {
      return (names[0][0]+names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  /**
   * Genera un color basado en el ID
   */
  getUserColor(userId: number): string {
    const colors=['#504AB7', '#AAE16B', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[userId%colors.length];
  }

  /**
   * Formatea la fecha del grupo para mostrar
   */
  formatGroupDate(dateKey: string): string {
    try {
      const date=new Date(dateKey);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateKey;
    }
  }

  /**
   * Verifica si el documento es material de apoyo
   */
  isSupportMaterial(doc: IGroupSessionDocument): boolean {
    return doc.learningSession===null;
  }

  /**
   * Obtiene el label del tipo de documento
   */
  getDocumentTypeLabel(doc: IGroupSessionDocument): string {
    if (doc.learningSession) {
      return doc.learningSession.title;
    }
    return 'Material de Apoyo';
  }
  //#endregion
}