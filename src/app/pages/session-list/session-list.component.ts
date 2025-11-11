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
  knowledgeAreas: IKnowledgeArea[] = [];
  activeFilters = {
    categoryIds: [] as number[],
    languages: [] as string[]
  };
  isLoading: boolean = false;
  errorMessage: string = '';
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
        
        this.filteredSessions = [...this.sessions];
        this.isLoading = false;
        
        console.log('Loaded sessions:', this.sessions);
      },
      error: (error) => {
        console.error('Error loading sessions:', error);
        this.errorMessage = 'Error al cargar las sesiones. Por favor, intenta nuevamente.';
        this.isLoading = false;
        this.sessions = [];
        this.filteredSessions = [];
      }
    });
  }
  //</editor-fold>

  //<editor-fold desc="Search and Filter Methods">
  onSearch() {
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
    
    modalRef.result.then(
      (filters) => {
        this.activeFilters = filters;
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
      return;
    }

    this.filteredSessions = this.sessions.filter(session => {
      const matchesSearch = !this.searchTerm || 
        session.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        session.skill?.name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = this.activeFilters.categoryIds.length === 0 ||
        this.activeFilters.categoryIds.includes(session.skill?.knowledgeArea?.id);
      
      const matchesLanguage = this.activeFilters.languages.length === 0 ||
        this.activeFilters.languages.includes(session.language);
      
      return matchesSearch && matchesCategory && matchesLanguage;
    });
  }
  //</editor-fold>

  //<editor-fold desc="Event Handlers">
  onRegister(sessionId: number) {
    console.log('Registrarse en sesión:', sessionId);
    // TODO: Implementar lógica de registro (crear booking)
  }
  //</editor-fold>
}