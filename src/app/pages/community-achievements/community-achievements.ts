import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityCredentialService } from '../../services/community-credential.service';
import { ICommunityCredential } from '../../interfaces/index';

/**
 * Componente para visualizar los logros (credenciales) de una comunidad
 */
@Component({
  selector: 'app-community-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './community-achievements.component.html',
  styleUrls: ['./community-achievements.component.scss']
})
export class CommunityAchievementsComponent implements OnInit {
  //#region Properties
  communityId!: number;
  credentials: ICommunityCredential[] = [];
  selectedCredential: ICommunityCredential | null = null;
  showModal = false;
  loading = false;
  error = false;
  //#endregion

  //#region Constructor
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private credentialService: CommunityCredentialService
  ) {}
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Inicializa el componente y carga las credenciales
   */
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.communityId = +params['id'];
      if (this.communityId) {
        this.loadCredentials();
      }
    });
  }
  //#endregion

  //#region Public Methods
  /**
   * Carga las credenciales de la comunidad desde el backend
   */
  loadCredentials(): void {
    this.loading = true;
    this.error = false;

    this.credentialService.getCommunityCredentials(this.communityId).subscribe({
      next: (data) => {
        this.credentials = data;
        this.loading = false;
        console.log('✅ Credenciales cargadas:', data);
      },
      error: (err) => {
        console.error('❌ Error al cargar credenciales:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  /**
   * Navega de regreso a la página principal de la comunidad
   */
  goBack(): void {
    this.router.navigate(['/app/community', this.communityId]);
  }

  /**
   * Abre el modal con los detalles de una credencial
   */
  openCredentialDetail(credential: ICommunityCredential): void {
    this.selectedCredential = credential;
    this.showModal = true;
  }

  /**
   * Cierra el modal de detalles
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedCredential = null;
  }

  /**
   * Formatea una fecha ISO a formato legible en español
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
 * Maneja el error de carga de imagen del badge
 * Reemplaza la imagen con un ícono de Boxicons
 */
onBadgeError(event: any): void {
  event.target.style.display = 'none';
  const parent = event.target.parentElement;
  if (parent && !parent.querySelector('.fallback-icon')) {
    const icon = document.createElement('i');
    icon.className = 'bx bxs-badge-check fallback-icon';
    icon.style.fontSize = '64px';
    icon.style.color = '#aae16b';
    parent.appendChild(icon);
  }
}

/**
 * Maneja la carga exitosa de la imagen del badge
 * Asegura que la imagen sea visible cuando carga
 */
onBadgeLoad(event: any): void {
  event.target.style.opacity = '1';
}
  //#endregion
}