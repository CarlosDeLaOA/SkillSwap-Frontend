import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EditConfirmationModalComponent, EditInfo } from '../../components/edit-confirmation-modal/edit-confirmation-modal.component';

interface Session {
  id: number;
  title: string;
  description: string;
  scheduledDatetime: string;
  durationMinutes: number;
  status: string;
  videoCallLink: string | null;
  skillName: string;
  maxCapacity: number;
  currentBookings: number;
  availableSpots: number;
  isPremium: boolean;
  skillcoinsCost: number;
  creationDate: string;
}

interface PageResponse {
  content: Session[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

@Component({
  selector: 'app-instructor-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, EditConfirmationModalComponent],
  templateUrl: './instructor-sessions.component.html',
  styleUrls: ['./instructor-sessions.component.scss']
})
export class InstructorSessionsComponent implements OnInit {
  private apiUrl = 'http://localhost:8080/api/instructor/sessions';

  // Datos
  sessions: Session[] = [];
  filteredSessions: Session[] = [];
  totalPages: number = 0;
  totalElements: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 6;

  // Filtros
  selectedStatus: string = 'SCHEDULED';
  searchTerm: string = '';

  // Estado
  isLoading: boolean = false;
  errorMessage: string = '';

  // Modal de edición
  showEditModal: boolean = false;
  editingSession: Session | null = null;
  editForm = {
    description: '',
    durationMinutes: 0
  };
  editErrors: any = {};

  // Modal de confirmación de éxito
  showSuccessModal: boolean = false;
  successEditInfo: EditInfo | null = null;

  Math = Math;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  /**
   * Carga las sesiones con filtros y paginación
   */
  loadSessions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const params: any = {
      page: this.currentPage - 1, // Backend usa 0-indexed
      size: this.itemsPerPage
    };

    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }

    this.http.get<PageResponse>(`${this.apiUrl}`, { headers, params }).subscribe({
      next: (response) => {
        console.log(' Sesiones cargadas:', response);
        
        this.sessions = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.currentPage = response.number + 1; // Convertir a 1-indexed
        this.filteredSessions = [...this.sessions];
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error(' Error cargando sesiones:', error);
        this.errorMessage = 'Error al cargar las sesiones. Por favor, intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Cambia el filtro de estado
   */
  changeStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadSessions();
  }

  /**
   * Maneja la búsqueda
   */
  onSearch(): void {
    if (! this.searchTerm.trim()) {
      this.filteredSessions = [...this.sessions];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredSessions = this.sessions.filter(session =>
        session.title.toLowerCase().includes(term) ||
        session.description.toLowerCase().includes(term) ||
        session.skillName.toLowerCase().includes(term)
      );
    }
  }

  /**
   * Navega a una página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadSessions();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Página anterior
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Genera números de página
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, this.currentPage + 2);
      
      if (this.currentPage <= 3) {
        endPage = maxPagesToShow;
      } else if (this.currentPage >= this.totalPages - 2) {
        startPage = this.totalPages - maxPagesToShow + 1;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  /**
   * Abre modal de edición
   */
  openEditModal(session: Session): void {
    if (session.status !== 'SCHEDULED') {
      alert('Solo puedes editar sesiones programadas');
      return;
    }

    this.editingSession = session;
    this.editForm = {
      description: session.description,
      durationMinutes: session.durationMinutes
    };
    this.editErrors = {};
    this.showEditModal = true;
  }

  /**
   * Cierra modal de edición
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingSession = null;
    this.editForm = { description: '', durationMinutes: 0 };
    this.editErrors = {};
  }

  /**
   * Valida formulario
   */
  validateForm(): boolean {
    this.editErrors = {};
    let isValid = true;

    if (!this.editForm.description || this.editForm.description.trim().length < 10) {
      this.editErrors.description = 'La descripción debe tener al menos 10 caracteres';
      isValid = false;
    }

    if (this.editForm.description.length > 500) {
      this.editErrors.description = 'La descripción no puede exceder 500 caracteres';
      isValid = false;
    }

    if (!this.editForm.durationMinutes || isNaN(this.editForm.durationMinutes)) {
      this.editErrors.durationMinutes = 'La duración debe ser un número válido';
      isValid = false;
    } else if (this.editForm.durationMinutes < 15) {
      this.editErrors.durationMinutes = 'La duración mínima es de 15 minutos';
      isValid = false;
    } else if (this.editForm.durationMinutes > 480) {
      this.editErrors.durationMinutes = 'La duración máxima es de 480 minutos';
      isValid = false;
    }

    return isValid;
  }

saveChanges(): void {
  if (!this.editingSession || !this.validateForm()) return;

  this.isLoading = true;

  const token = localStorage.getItem('authToken');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.put<any>(
    `${this.apiUrl}/${this.editingSession.id}`,
    this.editForm,
    { headers }
  ).subscribe({
    next: (response) => {
      console.log(' Sesión actualizada:', response);
      
      // Preparar información para el modal de éxito
      const changesApplied: string[] = [];
      
      if (response.changes?.description) {
        changesApplied.push('Descripción actualizada');
      }
      
      if (response.changes?.durationMinutes) {
        changesApplied.push(`Duración cambiada a ${response.durationMinutes} minutos`);
      }

      if (changesApplied.length === 0) {
        changesApplied.push('Cambios aplicados correctamente');
      }

      this.successEditInfo = {
        sessionTitle: this.editingSession! .title,
        changesApplied: changesApplied
      };

      console.log(' Datos del modal:', this.successEditInfo); // ← AGREGAR ESTO

      // Cerrar modal de edición
      this.closeEditModal();
      
      // Mostrar modal de éxito
      this.showSuccessModal = true;
      
      console.log(' Modal de éxito activado:', this.showSuccessModal); // ← AGREGAR ESTO
      
      // Recargar sesiones después de 3 segundos
      setTimeout(() => {
        this.loadSessions();
      }, 3000);

      this.isLoading = false;
    },
    error: (error) => {
      console.error(' Error:', error);
      const errorMsg = error.error?.message || 'Error al actualizar';
      
      if (errorMsg.includes('participantes')) {
        this.editErrors.durationMinutes = errorMsg;
      } else {
        alert(errorMsg);
      }
      
      this.isLoading = false;
    }
  });
}

  /**
   * Maneja el cierre del modal de éxito
   */
  onSuccessModalClose(): void {
    this.showSuccessModal = false;
    this.successEditInfo = null;
  }

  /**
   * Formatea fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Clase CSS según estado
   */
  getStatusClass(status: string): string {
    const classes: any = {
      'SCHEDULED': 'status-scheduled',
      'ACTIVE': 'status-active',
      'FINISHED': 'status-finished',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || '';
  }

  /**
   * Texto estado en español
   */
  getStatusText(status: string): string {
    const texts: any = {
      'SCHEDULED': 'Programada',
      'ACTIVE': 'En curso',
      'FINISHED': 'Completada',
      'CANCELLED': 'Cancelada'
    };
    return texts[status] || status;
  }

  /**
   * Formatea fecha corta (DD/MM/YYYY)
   */
  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formatea hora corta (HH:MM)
   */
  formatTimeShort(dateString: string): string {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}