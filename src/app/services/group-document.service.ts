import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GroupSessionDocument {
  id: number;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  sessionDate: string;
  uploadDate: string;
  description: string;
  active: boolean;
  formattedFileSize: string;
  learningCommunity: {
    id: number;
    name: string;
  };
  learningSession: {  //  Ahora puede ser null
    id: number;
    title: string;
  } | null;
  uploadedBy: {
    id: number;
    fullName: string;
    profilePhotoUrl: string;
  };
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  data: GroupSessionDocument;
}

export interface DocumentListResponse {
  success: boolean;
  data: GroupSessionDocument[];
  count: number;
}

export interface DocumentGroupedBySessionResponse {
  success: boolean;
  data: { [sessionTitle: string]: GroupSessionDocument[] };  //  Ahora es string
}

export interface DocumentGroupedByDateResponse {
  success: boolean;
  data: { [date: string]: GroupSessionDocument[] };
}

export interface StorageStatsResponse {
  success: boolean;
  data: {
    usedBytes: number;
    availableBytes: number;
    maxBytes: number;
    usedFormatted: string;
    availableFormatted: string;
    maxFormatted: string;
    usagePercentage: number;
    documentCount: number;
  };
}

/**
 * Servicio para gestionar documentos de sesiones grupales
 */
@Injectable({
  providedIn: 'root'
})
export class GroupDocumentService {

  private apiUrl = `${environment.apiUrl}/group-documents`;

  constructor(private http: HttpClient) {}

  //#region Upload Methods

  /**
   * Sube un documento PDF a una sesión de grupo
   * ⭐ MODIFICADO: sessionId ahora puede ser null
   */
  uploadDocument(
    file: File,
    communityId: number,
    sessionId: number | null,  //  Acepta null
    sessionDate?: string,
    description?: string
  ): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('communityId', communityId.toString());
    
    // ⭐ Solo agregar sessionId si no es null
    if (sessionId !== null) {
      formData.append('sessionId', sessionId.toString());
    }

    if (sessionDate) {
      formData.append('sessionDate', sessionDate);
    }

    if (description) {
      formData.append('description', description);
    }

    return this.http.post<DocumentUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  //#endregion

  //#region List Methods

  /**
   * Obtiene todos los documentos de una comunidad ordenados por fecha descendente
   */
  getDocumentsByCommunity(communityId: number): Observable<DocumentListResponse> {
    return this.http.get<DocumentListResponse>(`${this.apiUrl}/community/${communityId}`);
  }

  /**
   * Obtiene documentos agrupados por sesión
   */
  getDocumentsGroupedBySession(communityId: number): Observable<DocumentGroupedBySessionResponse> {
    return this.http.get<DocumentGroupedBySessionResponse>(
      `${this.apiUrl}/community/${communityId}/by-session`
    );
  }

  /**
   * Obtiene documentos agrupados por fecha
   */
  getDocumentsGroupedByDate(communityId: number): Observable<DocumentGroupedByDateResponse> {
    return this.http.get<DocumentGroupedByDateResponse>(
      `${this.apiUrl}/community/${communityId}/by-date`
    );
  }

  /**
   * Obtiene documentos de una sesión específica
   */
  getDocumentsBySession(sessionId: number, communityId: number): Observable<DocumentListResponse> {
    return this.http.get<DocumentListResponse>(
      `${this.apiUrl}/session/${sessionId}? communityId=${communityId}`
    );
  }

  //#endregion

  //#region Download Methods

  /**
   * Descarga un documento
   */
  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Obtiene la URL para visualizar un documento en el navegador
   */
  getViewUrl(documentId: number): string {
    return `${this.apiUrl}/${documentId}/view`;
  }

  //#endregion

  //#region Storage Methods

  /**
   * Obtiene estadísticas de almacenamiento de una comunidad
   */
  getStorageStats(communityId: number): Observable<StorageStatsResponse> {
    return this.http.get<StorageStatsResponse>(
      `${this.apiUrl}/community/${communityId}/storage`
    );
  }

  //#endregion

  /**
 * Elimina un documento con razón
 *  Ahora envía razón
 */
deleteDocument(documentId: number, reason: string): Observable<{ success: boolean; message: string }> {
  return this.http.delete<{ success: boolean; message: string }>(
    `${this.apiUrl}/${documentId}`,
    { body: { reason: reason } }
  );
}

/**
 * Obtiene documentos borrados de una comunidad
 * 
 */
getDeletedDocuments(communityId: number): Observable<DocumentListResponse> {
  return this.http.get<DocumentListResponse>(
    `${this.apiUrl}/community/${communityId}/deleted`
  );
}

  //#endregion

  //#region Utility Methods

  /**
   * Valida que el archivo sea un PDF válido
   */
  validatePdfFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No se seleccionó ningún archivo' };
    }

    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Solo se permiten archivos PDF' };
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'El archivo excede el tamaño máximo de 100MB' };
    }

    return { valid: true };
  }

  /**
   * Formatea el tamaño de archivo a formato legible
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  //#endregion
}