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
  learningSession: {
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
  data: { [sessionTitle: string]: GroupSessionDocument[] };
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
 * Maneja la subida, descarga, visualización y eliminación de documentos PDF
 * Los archivos se almacenan en Cloudinary y se sirven a través del backend como proxy
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
   * El archivo se almacena en Cloudinary y se asocia a una comunidad
   * Solo se permiten archivos PDF
   * 
   * @param file Archivo PDF a subir
   * @param communityId ID de la comunidad
   * @param sessionId ID de la sesión (null para material de apoyo)
   * @param sessionDate Fecha de la sesión (opcional)
   * @param description Descripción del documento (opcional)
   * @returns Observable con la respuesta de la subida
   */
  uploadDocument(
    file: File,
    communityId: number,
    sessionId: number | null,
    sessionDate?: string,
    description?: string
  ): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('communityId', communityId.toString());
    
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
   * 
   * @param communityId ID de la comunidad
   * @returns Observable con la lista de documentos
   */
  getDocumentsByCommunity(communityId: number): Observable<DocumentListResponse> {
    return this.http.get<DocumentListResponse>(`${this.apiUrl}/community/${communityId}`);
  }

  /**
   * Obtiene documentos agrupados por sesión
   * Los documentos sin sesión se agrupan como "Material de Apoyo"
   * 
   * @param communityId ID de la comunidad
   * @returns Observable con documentos agrupados por sesión
   */
  getDocumentsGroupedBySession(communityId: number): Observable<DocumentGroupedBySessionResponse> {
    return this.http.get<DocumentGroupedBySessionResponse>(
      `${this.apiUrl}/community/${communityId}/by-session`
    );
  }

  /**
   * Obtiene documentos agrupados por fecha de sesión
   * 
   * @param communityId ID de la comunidad
   * @returns Observable con documentos agrupados por fecha
   */
  getDocumentsGroupedByDate(communityId: number): Observable<DocumentGroupedByDateResponse> {
    return this.http.get<DocumentGroupedByDateResponse>(
      `${this.apiUrl}/community/${communityId}/by-date`
    );
  }

  /**
   * Obtiene documentos de una sesión específica
   * 
   * @param sessionId ID de la sesión
   * @param communityId ID de la comunidad
   * @returns Observable con la lista de documentos de la sesión
   */
  getDocumentsBySession(sessionId: number, communityId: number): Observable<DocumentListResponse> {
    return this.http.get<DocumentListResponse>(
      `${this.apiUrl}/session/${sessionId}?communityId=${communityId}`
    );
  }

  //#endregion

  //#region Download Methods

  /**
   * Descarga un documento PDF desde el backend (proxy)
   * El backend descarga el archivo de Cloudinary y lo sirve al cliente
   * 
   * @param documentId ID del documento
   * @returns Observable que completa cuando inicia la descarga
   */
  downloadDocument(documentId: number): Observable<void> {
    return new Observable(observer => {
      this.http.get(`${this.apiUrl}/${documentId}/download`, {
        responseType: 'blob'
      }).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'documento.pdf';
          a.click();
          window.URL.revokeObjectURL(url);
          observer.next();
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Visualiza un documento PDF desde el backend (proxy) en nueva pestaña
   * El backend descarga el archivo de Cloudinary y lo sirve al cliente
   * 
   * @param documentId ID del documento
   * @returns Observable que completa cuando se abre el documento
   */
  viewDocument(documentId: number): Observable<void> {
    return new Observable(observer => {
      this.http.get(`${this.apiUrl}/${documentId}/view`, {
        responseType: 'blob'
      }).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          observer.next();
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  //#endregion

  //#region Storage Methods

  /**
   * Obtiene estadísticas de almacenamiento de una comunidad
   * Incluye espacio usado, disponible y porcentaje de uso
   * El límite máximo es de 100MB por comunidad
   * 
   * @param communityId ID de la comunidad
   * @returns Observable con las estadísticas de almacenamiento
   */
  getStorageStats(communityId: number): Observable<StorageStatsResponse> {
    return this.http.get<StorageStatsResponse>(
      `${this.apiUrl}/community/${communityId}/storage`
    );
  }

  //#endregion

  //#region Delete Methods

  /**
   * Elimina un documento con razón (soft delete)
   * El documento se marca como inactivo y se registra la razón de eliminación
   * No se elimina físicamente de Cloudinary
   * 
   * @param documentId ID del documento
   * @param reason Razón de la eliminación
   * @returns Observable con la respuesta de la eliminación
   */
  deleteDocument(documentId: number, reason: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${documentId}`,
      { body: { reason: reason } }
    );
  }

  /**
   * Obtiene documentos borrados de una comunidad
   * Incluye información de quién los eliminó, cuándo y la razón
   * 
   * @param communityId ID de la comunidad
   * @returns Observable con la lista de documentos eliminados
   */
  getDeletedDocuments(communityId: number): Observable<DocumentListResponse> {
    return this.http.get<DocumentListResponse>(
      `${this.apiUrl}/community/${communityId}/deleted`
    );
  }

  //#endregion

  //#region Utility Methods

  /**
   * Valida que el archivo sea un PDF válido y no exceda el tamaño máximo
   * Solo se permiten archivos PDF de hasta 100MB
   * 
   * @param file Archivo a validar
   * @returns Objeto con el resultado de la validación y mensaje de error si aplica
   */
  validatePdfFile(file: File): { valid: boolean; error?: string } {
    if (! file) {
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
   * Formatea el tamaño de archivo a formato legible (B, KB, MB)
   * 
   * @param bytes Tamaño en bytes
   * @returns String con el tamaño formateado
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
   * Formatea la fecha para mostrar en formato legible en español
   * 
   * @param dateString Fecha en formato ISO string
   * @returns Fecha formateada en español (ej: 15 de enero de 2025, 14:30)
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