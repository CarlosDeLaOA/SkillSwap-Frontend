import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FilterModalComponent } from '../../components/filter-modal/filter-modal.component';
import { SessionCardComponent } from '../../components/session-card/session-card.component';
import { LearningSessionService } from '../../services/learning-session.service';
import { KnowledgeAreaService } from '../../services/knowledge-area.service';
import { ILearningSession, IKnowledgeArea, IResponse } from '../../interfaces';

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
  
  //<editor-fold desc="Properties">
  searchTerm: string = '';
  sessions: ILearningSession[] = [];
  filteredSessions: ILearningSession[] = [];
  paginatedSessions: ILearningSession[] = [];
  knowledgeAreas: IKnowledgeArea[] = [];
  availableLanguages: string[] = []; // Idiomas dinámicos extraídos de las sesiones
  
  activeFilters = {
    categoryIds: [] as number[],
    languages: [] as string[]
  };
  
  // Propiedades de paginación
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;
  
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Exponer Math para usarlo en el template
  Math = Math;
  //</editor-fold>

  //<editor-fold desc="Constructor">
  constructor(
    private modalService: NgbModal,
    private learningSessionService: LearningSessionService,
    private knowledgeAreaService: KnowledgeAreaService
  ) {}
  //</editor-fold>

  //<editor-fold desc="Lifecycle Hooks">
  ngOnInit() {
    this.loadKnowledgeAreas();
    this.loadSessions();
  }
  //</editor-fold>

  //<editor-fold desc="Data Loading Methods">
  loadKnowledgeAreas() {
    this.knowledgeAreaService.getAllKnowledgeAreas().subscribe({
      next: (response: any) => {
        console.log('Knowledge Areas Response:', response);
        
        // Verificar si la respuesta tiene la estructura de GlobalResponseHandler
        if (response && response.data) {
          this.knowledgeAreas = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          // Si es un array directo
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

  loadSessions() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.learningSessionService.getAvailableSessions().subscribe({
      next: (response: any) => {
        console.log('Sessions Response:', response);
        
        // Verificar si la respuesta tiene la estructura de GlobalResponseHandler
        if (response && response.data) {
          this.sessions = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          // Si es un array directo
          this.sessions = response;
        } else {
          console.error('Unexpected sessions response format:', response);
          this.sessions = [];
        }
        
        // Extraer idiomas únicos de las sesiones
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
  extractAvailableLanguages() {
    const languagesSet = new Set<string>();
    
    this.sessions.forEach(session => {
      if (session.language) {
        languagesSet.add(session.language);
      }
    });
    
    this.availableLanguages = Array.from(languagesSet).sort();
  }
  //</editor-fold>

  //<editor-fold desc="Search and Filter Methods">
  onSearch() {
    this.currentPage = 1; // Reset a la primera página al buscar
    this.applyFilters();
  }

  openFilterModal() {
    const modalRef = this.modalService.open(FilterModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
    
    modalRef.componentInstance.currentFilters = { ...this.activeFilters };
    modalRef.componentInstance.knowledgeAreas = this.knowledgeAreas;
    modalRef.componentInstance.availableLanguages = this.availableLanguages; // Pasar idiomas dinámicos
    
    modalRef.result.then(
      (filters) => {
        console.log('Filters received from modal:', filters);
        this.activeFilters = filters;
        this.currentPage = 1; // Reset a la primera página al filtrar
        this.applyFilters();
      },
      () => {
        // Modal dismissed
      }
    );
  }

  applyFilters() {
    if (!Array.isArray(this.sessions)) {
      console.error('Sessions is not an array:', this.sessions);
      this.filteredSessions = [];
      this.updatePagination();
      return;
    }

    this.filteredSessions = this.sessions.filter(session => {
      // Filtro de búsqueda por texto
      const matchesSearch = !this.searchTerm || 
        session.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.skill?.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.skill?.knowledgeArea?.name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Filtro por categoría (Knowledge Area ID)
      const matchesCategory = this.activeFilters.categoryIds.length === 0 ||
        (session.skill?.knowledgeArea?.id && 
         this.activeFilters.categoryIds.includes(session.skill.knowledgeArea.id));
      
      // Filtro por idioma
      const matchesLanguage = this.activeFilters.languages.length === 0 ||
        this.activeFilters.languages.includes(session.language);
      
      return matchesSearch && matchesCategory && matchesLanguage;
    });

    console.log('Filtered sessions:', this.filteredSessions.length);
    this.updatePagination();
  }
  //</editor-fold>

  //<editor-fold desc="Pagination Methods">
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredSessions.length / this.itemsPerPage);
    
    // Asegurar que currentPage esté en rango válido
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    
    this.updatePaginatedSessions();
  }

  updatePaginatedSessions() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSessions = this.filteredSessions.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedSessions();
      
      // Scroll suave hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas alrededor de la página actual
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
  //</editor-fold>

  //<editor-fold desc="Event Handlers">
  onRegister(sessionId: number) {
    console.log('Registrarse en sesión:', sessionId);
    // TODO: Implementar lógica de registro (crear booking)
  }
  //</editor-fold>
}