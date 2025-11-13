import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LearningSessionService } from '../../services/learning-session.service';
import { ILearningSession } from '../../interfaces';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss']
})
export class SessionDetailComponent implements OnInit {
  
  session: ILearningSession | null = null;
  sessionId: number = 0;
  isLoading: boolean = true;
  errorMessage: string = '';

  languageNames: { [key: string]: string } = {
    'es': 'Español',
    'en': 'Inglés',
    'fr': 'Francés',
    'de': 'Alemán',
    'pt': 'Portugués'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learningSessionService: LearningSessionService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = +params['id'];
      this.loadSession();
    });
  }

  loadSession(): void {
    this.isLoading = true;
    
    this.learningSessionService.getAvailableSessions().subscribe({
      next: (response: any) => {
        const sessions = response.data || response;
        this.session = sessions.find((s: ILearningSession) => s.id === this.sessionId);
        
        if (!this.session) {
          this.errorMessage = 'Sesión no encontrada';
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading session:', error);
        this.errorMessage = 'Error al cargar la sesión';
        this.isLoading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getLanguageName(code: string): string {
    return this.languageNames[code] || code;
  }

  getAvailableSpots(): number {
    if (!this.session) return 0;
    return this.session.maxCapacity - (this.session.bookings?.length || 0);
  }

  goBack(): void {
    this.router.navigate(['/app/sessions']);
  }
}