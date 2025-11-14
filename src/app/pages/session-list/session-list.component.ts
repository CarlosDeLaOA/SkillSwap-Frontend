import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FilterModalComponent } from '../../components/filter-modal/filter-modal.component';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { SessionDetailModalComponent } from '../../components/session-detail-modal/session-detail-modal.component';
import { LearningSessionService } from '../../services/learning-session.service';
import { KnowledgeAreaService } from '../../services/knowledge-area.service';
import { ILearningSession, IKnowledgeArea, IResponse } from '../../interfaces';

/**
 * Componente para listar y filtrar sesiones de aprendizaje disponibles
 */
@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SessionCardComponent
  ],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent implements OnInit {
  
  //#region Properties
  searchTerm: string = '';
  sessions: ILearningSession[] = [];
  filteredSessions: ILearningSession[] = [];
  paginatedSessions: ILearningSession[] = [];
  knowledgeAreas: IKnowledgeArea[] = [];
  availableLanguages: string[] = [];
  
  activeFilters = {
    categoryIds: [] as number[],
    languages: [] as string[]
  };
  
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;
  
  isLoading: boolean = false;
  errorMessage: string = '';
  
  Math = Math;
  //#endregion

  //#region Constructor
  constructor(
    private modalService: NgbModal,
    private learningSessionService: LearningSessionService,
    private knowledgeAreaService: KnowledgeAreaService
  ) {}
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.loadKnowledgeAreas();
    this.loadSessions();
  }
  //#endregion

  //#region Data Loading Methods
  /**
   * Carga todas las áreas de conocimiento disponibles
   */
  loadKnowledgeAreas(): void {
    this.knowledgeAreaService.getAllKnowledgeAreas().subscribe({
      next: (response: any) => {
        console.log('Knowledge Areas Response:', response);
        
        if (response && response.data) {
          this.knowledgeAreas = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          this.knowledgeAreas = response;
        } else {
          console.error('Unexpected knowledge areas response format:', response);
          this.knowledgeAreas = [];
        }
        
        console.log('Loaded knowledge areas:', this.knowledgeAreas);
      },
      error: (error) => {
        console.error('Error loading knowledge areas:', error);
        this.knowledgeAreas = [];
      }
    });
  }

  /**
   * Carga todas las sesiones disponibles
   */
  loadSessions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.learningSessionService.getAvailableSessions().subscribe({
      next: (response: any) => {
        console.log('Sessions Response:', response);
        
        if (response && response.data) {
          this.sessions = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          this.sessions = response;
        } else {
          console.error('Unexpected sessions response format:', response);
          this.sessions = [];
        }
        
        this.extractAvailableLanguages();
        this.filteredSessions = [...this.sessions];
        this.updatePagination();
        this.isLoading = false;
        
        console.log('Loaded sessions:', this.sessions);
        console.log('Available languages:', this.availableLanguages);
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.errorMessage = 'Error al cargar las sesiones. Por favor, intenta nuevamente.';
        this.isLoading = false;
        this.sessions = [];
        this.filteredSessions = [];
        this.paginatedSessions = [];
        this.availableLanguages = [];
      }
    });
  }
  
  /**
   * Extrae los idiomas únicos disponibles de las sesiones cargadas
   */
  extractAvailableLanguages(): void {
    const languagesSet = new Set<string>();
    
    this.sessions.forEach(session => {
      if (session.language) {
        languagesSet.add(session.language);
      }
    });
    
    this.availableLanguages = Array.from(languagesSet).sort();
  }
  //#endregion

  //#region Search and Filter Methods
  /**
   * Maneja el evento de búsqueda por texto
   */
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Abre el modal de filtros
   */
  openFilterModal(): void {
    const modalRef = this.modalService.open(FilterModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
    
    modalRef.componentInstance.currentFilters = { ...this.activeFilters };
    modalRef.componentInstance.knowledgeAreas = this.knowledgeAreas;
    modalRef.componentInstance.availableLanguages = this.availableLanguages;
    
    modalRef.result.then(
      (filters) => {
        console.log('Filters received from modal:', filters);
        this.activeFilters = filters;
        this.currentPage = 1;
        this.applyFilters();
      },
      () => {
      }
    );
  }

  /**
   * Aplica los filtros de búsqueda y categoría/idioma
   */
  applyFilters(): void {
    if (!Array.isArray(this.sessions)) {
      console.error('Sessions is not an array:', this.sessions);
      this.filteredSessions = [];
      this.updatePagination();
      return;
    }

    this.filteredSessions = this.sessions.filter(session => {
      const matchesSearch = !this.searchTerm || 
        session.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.skill?.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.skill?.knowledgeArea?.name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.activeFilters.categoryIds.length === 0 ||
        (session.skill?.knowledgeArea?.id && 
         this.activeFilters.categoryIds.includes(session.skill.knowledgeArea.id));
      
      const matchesLanguage = this.activeFilters.languages.length === 0 ||
        this.activeFilters.languages.includes(session.language);
      
      return matchesSearch && matchesCategory && matchesLanguage;
    });

    console.log('Filtered sessions:', this.filteredSessions.length);
    this.updatePagination();
  }
  //#endregion

  //#region Pagination Methods
  /**
   * Actualiza la paginación basada en las sesiones filtradas
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSessions.length / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    
    this.updatePaginatedSessions();
  }

  /**
   * Actualiza las sesiones a mostrar en la página actual
   */
  updatePaginatedSessions(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSessions = this.filteredSessions.slice(startIndex, endIndex);
  }

  /**
   * Navega a una página específica
   * @param page Número de página
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedSessions();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Navega a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Navega a la página anterior
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Genera el array de números de página a mostrar
   * @returns Array de números de página
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
  //#endregion

  //#region Event Handlers
  /**
   * Maneja el evento de registro a una sesión
   * @param sessionId ID de la sesión
   */
  onRegister(sessionId: number): void {
    console.log('Registrarse en sesión:', sessionId);
  }

  /**
   * Abre el modal de detalles de una sesión
   * @param session Sesión a mostrar
   */
  onViewDetails(session: ILearningSession): void {
    const modalRef = this.modalService.open(SessionDetailModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
      modalDialogClass: 'session-detail-modal'
    });
    
    modalRef.componentInstance.session = session;
    
    modalRef.result.then(
      (sessionId: number) => {
        console.log('Registrarse desde modal en sesión:', sessionId);
        this.onRegister(sessionId);
      },
      () => {
      }
    );
  }
  //#endregion
}