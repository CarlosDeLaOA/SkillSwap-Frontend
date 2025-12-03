import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityWebsocketService } from '../../services/community-websocket.service';
import { CommunityMessageService } from '../../services/community-message.service';
import { CommunityService } from '../../services/community.service';
import { Subscription } from 'rxjs';
import { GroupDocumentsComponent } from '../../components/group-documents/group-documents.component';

/**
 * Componente principal de la comunidad con chat en tiempo real
 */
@Component({
  selector: 'app-community-main',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GroupDocumentsComponent
  ],
  templateUrl: './community-main.component.html',
  styleUrls: ['./community-main.component.scss']
})
export class CommunityMainComponent implements OnInit, OnDestroy, AfterViewChecked {

  //#region Fields
  @ViewChild('messageContainer') private messageContainer! : ElementRef;

  communityId: number = 0;
  currentUserId: number = 0;
  currentUserLearnerId: number = 0;
  messages: any[] = [];
  participants: any[] = [];
  newMessageContent: string = '';
  activeTab: 'chat' | 'documents' = 'chat';
  showParticipants: boolean = false;
  showInviteModal: boolean = false;
  isLoading: boolean = true;
  isLoadingMessages: boolean = true;
  isLoadingParticipants: boolean = false;
  isSendingInvites: boolean = false;
  communityName: string = '';
  communityCreatorId: number = 0;

  newMemberEmails: string = '';
  inviteResult: { success: boolean; message: string } | null = null;

  private wsSubscription?: Subscription;
  private shouldScrollToBottom: boolean = false;
  private userColors: Map<number, string> = new Map();
  //#endregion

  //#region Constructor
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wsService: CommunityWebsocketService,
    private messageService: CommunityMessageService,
    private communityService: CommunityService
  ) {}
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Inicializa el componente
   */
  ngOnInit(): void {
    const authPersonStr = localStorage.getItem('authPerson');
    if (authPersonStr) {
      const authPerson = JSON.parse(authPersonStr);
      this.currentUserId = authPerson.id;
      if (authPerson. learner) {
        this.currentUserLearnerId = authPerson.learner.id;
      }
    }

    this.route.params.subscribe(params => {
      this.communityId = +params['id'];
      if (this.communityId) {
        this. loadCommunityData();
        this.loadMessages();
        this. loadParticipants();
        this.connectToWebSocket();
      }
    });
  }

  /**
   * Se ejecuta después de cada verificación de la vista
   */
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Limpia recursos al destruir el componente
   */
  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription. unsubscribe();
    }
    this.wsService.disconnect();
  }
  //#endregion

  //#region Public Methods
  /**
   * Cambia entre tabs de chat y documentos
   * @param tab Tab a activar
   */
  public setActiveTab(tab: 'chat' | 'documents'): void {
    this. activeTab = tab;
  }

  /**
   * Alterna la visibilidad del panel de participantes
   */
  public toggleParticipants(): void {
    this.showParticipants = !this.showParticipants;
  }

  /**
   * Abre el modal de invitación
   */
  public openInviteModal(): void {
    this. showInviteModal = true;
    this.newMemberEmails = '';
    this.inviteResult = null;
  }

  /**
   * Cierra el modal de invitación
   */
  public closeInviteModal(): void {
    this. showInviteModal = false;
    this.newMemberEmails = '';
    this.inviteResult = null;
  }

  /**
   * Envía invitaciones a nuevos miembros
   */
  public sendInvitations(): void {
    if (! this.isCreator()) {
      this. inviteResult = {
        success: false,
        message: 'Solo el creador de la comunidad puede invitar nuevos miembros'
      };
      return;
    }

    if (this.newMemberEmails.trim() === '') {
      this.inviteResult = {
        success: false,
        message: 'Por favor ingresa al menos un email'
      };
      return;
    }

    const emails = this.newMemberEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email. length > 0);

    if (emails.length === 0) {
      this.inviteResult = {
        success: false,
        message: 'Por favor ingresa emails válidos'
      };
      return;
    }

    this.isSendingInvites = true;
    this.communityService.inviteNewMembers(this. communityId, emails).subscribe({
      next: (response) => {
        this.isSendingInvites = false;
        if (response.success) {
          const summary = response.invitationsSummary;
          let message = 'Invitaciones enviadas exitosamente';
          if (summary) {
            message = `Se enviaron ${summary.successfulInvitations} invitaciones correctamente`;
            if (summary.failedInvitations > 0) {
              message += ` y ${summary.failedInvitations} fallaron`;
            }
          }
          this.inviteResult = {
            success: true,
            message: message
          };
          setTimeout(() => {
            this.closeInviteModal();
            this.loadParticipants();
          }, 2000);
        } else {
          this.inviteResult = {
            success: false,
            message: response.message || 'Error al enviar invitaciones'
          };
        }
      },
      error: (error) => {
        console.error('Error sending invitations:', error);
        this.isSendingInvites = false;
        this.inviteResult = {
          success: false,
          message: error.error?.message || 'Error al enviar invitaciones'
        };
      }
    });
  }

  /**
   * Envía un nuevo mensaje
   */
  public sendMessage(): void {
    if (this.newMessageContent.trim() === '') {
      return;
    }

    this.wsService.sendMessage(
      this.communityId,
      this.currentUserId,
      this.newMessageContent. trim()
    );

    this.newMessageContent = '';
  }

  /**
   * Maneja el evento de presionar Enter en el textarea
   * @param event Evento del teclado
   */
  public onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Verifica si un mensaje es del usuario actual
   * @param senderId ID del remitente
   * @returns true si es del usuario actual
   */
  public isOwnMessage(senderId: number): boolean {
    return senderId === this.currentUserId;
  }

  /**
   * Verifica si el usuario actual es el creador de la comunidad
   * @returns true si es el creador
   */
  public isCreator(): boolean {
    return this.currentUserId === this. communityCreatorId;
  }

  /**
   * Obtiene las iniciales de un nombre
   * @param fullName Nombre completo
   * @returns Iniciales
   */
  public getInitials(fullName: string): string {
    if (!fullName) return '?';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]). toUpperCase();
    }
    return names[0][0]. toUpperCase();
  }

  /**
   * Genera un color único y vibrante basado en el ID del usuario
   * @param userId ID del usuario
   * @returns Color en formato HSL
   */
  public getUserColor(userId: number): string {
    if (!this.userColors.has(userId)) {
      const goldenRatio = 137.508;
      const hue = (userId * goldenRatio) % 360;
      const saturation = 70 + (userId % 20);
      const lightness = 50 + (userId % 15);
      this. userColors.set(userId, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return this. userColors.get(userId)!;
  }

  /**
   * Formatea la fecha del mensaje
   * @param date Fecha en formato ISO
   * @returns Fecha formateada
   */
  public formatMessageDate(date: string): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now. getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 48) {
      return 'Ayer ' + messageDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      }) + ' ' + messageDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Obtiene el rol traducido
   * @param role Rol del participante
   * @returns Rol traducido
   */
  public getRoleLabel(role: string): string {
    return role === 'CREATOR' ? 'Creador' : 'Miembro';
  }

  /**
   * Obtiene la URL de la foto de perfil o null
   * @param photoUrl URL de la foto
   * @returns URL o null
   */
  public getProfilePhotoUrl(photoUrl: string | null | undefined): string | null {
    if (!photoUrl || photoUrl. trim() === '') {
      return null;
    }
    return photoUrl;
  }

 
  //#region Private Methods
  /**
   * Carga los datos de la comunidad
   */
  private loadCommunityData(): void {
    this.communityService.getMyCommunities().subscribe({
      next: (response) => {
        const community = response.data. find(c => c.id === this. communityId);
        if (community) {
          this. communityName = community.name;
        }
        this. isLoading = false;
      },
      error: (error) => {
        console.error('Error loading community data:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga los mensajes anteriores
   */
  private loadMessages(): void {
    this.isLoadingMessages = true;
    this. messageService.getRecentMessages(this. communityId, 100).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages = response. data;
          this.shouldScrollToBottom = true;
        }
        this.isLoadingMessages = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoadingMessages = false;
      }
    });
  }

  /**
   * Carga la lista de participantes
   */
  private loadParticipants(): void {
    this.isLoadingParticipants = true;
    this. messageService.getParticipants(this. communityId).subscribe({
      next: (response) => {
        if (response.success) {
          this.participants = response.data;
          const creator = this.participants.find(p => p.role === 'CREATOR');
          if (creator) {
            this.communityCreatorId = creator. id;
          }
        }
        this.isLoadingParticipants = false;
      },
      error: (error) => {
        console.error('Error loading participants:', error);
        this. isLoadingParticipants = false;
      }
    });
  }

  /**
   * Conecta al WebSocket y escucha nuevos mensajes
   */
  private connectToWebSocket(): void {
    this. wsSubscription = this.wsService.connect(this.communityId). subscribe({
      next: (message) => {
        if (message.success) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      },
      error: (error) => {
        console. error('WebSocket error:', error);
      }
    });
  }

  /**
   * Hace scroll hasta el final del contenedor de mensajes
   */
  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

 /**
 * Navega a la página de logros de la comunidad
 */
navigateToAchievements(): void {
  console.log(' Método navigateToAchievements() ejecutado');
  console.log('Community ID:', this.communityId);
  console.log('Ruta a navegar:', ['/app/community', this.communityId, 'achievements']);
  
  this.router.navigate(['/app/community', this.communityId, 'achievements'])
    .then(success => {
      console.log('Navegación exitosa:', success);
    })
    .catch(error => {
      console.error('Error en navegación:', error);
    });
}
  //#endregion
}