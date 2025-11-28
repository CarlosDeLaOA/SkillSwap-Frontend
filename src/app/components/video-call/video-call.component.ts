import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoCallService } from '../../services/video-call.service';
import { TranscriptionService } from '../../services/transcription.service';
import { IVideoCallConfig, IVideoCallData, IScreenShareStatus } from '../../interfaces';
import { ParticipantsModalComponent } from '../participants-modal/participants-modal.component';
import { DocumentsModalComponent } from '../documents-modal/documents-modal.component';
import { CollaborativeDocumentComponent } from '../collaborative-document/collaborative-document.component';

interface JitsiParticipant {
  id: string;
  displayName: string;
  initials: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, ParticipantsModalComponent, DocumentsModalComponent, CollaborativeDocumentComponent],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss'
})
export class VideoCallComponent implements OnInit, OnDestroy {

  //#region Properties
  sessionId: number = 0;
  videoCallData: IVideoCallData | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  isConnected: boolean = false;
  cameraEnabled: boolean = true; 
  microphoneEnabled: boolean = true; 
  canShareScreen: boolean = false;
  isSharing: boolean = false;
  showControls: boolean = true;
  retryCount: number = 0;
  maxRetries: number = 3;
  showPermissionDialog: boolean = true;
  showEndSessionModal: boolean = false;
  
  // Modales
  showParticipantsModal: boolean = false;
  showDocumentsModal: boolean = false;
  showNotesPanel: boolean = false; 
  
  // Participantes conectados
  jitsiParticipants: JitsiParticipant[] = [];
  
  // Timer de sesión
  sessionTimer: string = '00:00';
  private timerInterval: any;
  private sessionStartTime: Date | null = null;
  
  // Grabación de audio
  isRecording: boolean = false;
  recordingDuration: string = '00:00';
  private recordingStartTime: Date | null = null;
  private recordingInterval: any;
  
  // Colores para participantes
  participantColors: string[] = [
    'linear-gradient(135deg, #8b9eea 0%, #8b6bb8 100%)',
    'linear-gradient(135deg, #ff9eb5 0%, #ff7a8c 100%)',
    'linear-gradient(135deg, #7ed3ff 0%, #5bc8ff 100%)',
    'linear-gradient(135deg, #a5886b 0%, #8b6f52 100%)',
    'linear-gradient(135deg, #7bdb8e 0%, #5bc96f 100%)',
  ];


  showCustomAlert: boolean = false;
  customAlertTitle: string = '';
  customAlertMessage: string = '';
  customAlertType: 'info' | 'success' | 'warning' | 'error' = 'info';
  customAlertConfirmText: string = 'Aceptar';
  customAlertCancelText: string = '';
  customAlertOnConfirm: (() => void) | null = null;
  customAlertOnCancel: (() => void) | null = null;

  
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimeout: any;
  //#endregion

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoCallService: VideoCallService,
    private transcriptionService: TranscriptionService
  ) {}

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = +params['sessionId'];
      this.requestMediaPermissions();
    });

    this.setupHangupInterceptor();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopRecordingTimer();
    if (this.isRecording) {
      this.stopRecording();
    }
    this.leaveCall();
    
    // Limpiar toast timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }
  //#endregion

  
  private displayToast(message: string, type: 'success' | 'error' = 'success'): void {
    
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;


    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  closeToast(): void {
    this.showToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }
  //#endregion

  //#region Custom Alert System (Para confirmaciones)
  private showAlert(
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    confirmText: string = 'Aceptar',
    cancelText: string = '',
    onConfirm?: () => void,
    onCancel?: () => void
  ): void {
    this.customAlertTitle = title;
    this.customAlertMessage = message;
    this.customAlertType = type;
    this.customAlertConfirmText = confirmText;
    this.customAlertCancelText = cancelText;
    this.customAlertOnConfirm = onConfirm || null;
    this.customAlertOnCancel = onCancel || null;
    this.showCustomAlert = true;
  }

  confirmCustomAlert(): void {
    this.showCustomAlert = false;
    if (this.customAlertOnConfirm) {
      this.customAlertOnConfirm();
    }
  }

  cancelCustomAlert(): void {
    this.showCustomAlert = false;
    if (this.customAlertOnCancel) {
      this.customAlertOnCancel();
    }
  }

  getAlertIcon(): string {
    switch (this.customAlertType) {
      case 'success': return 'bx-check-circle';
      case 'warning': return 'bx-error-circle';
      case 'error': return 'bx-x-circle';
      default: return 'bx-info-circle';
    }
  }

  getAlertColor(): string {
    switch (this.customAlertType) {
      case 'success': return '#AAE16B';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#504AB7';
    }
  }

  getFormattedMessage(): string {
    return this.customAlertMessage.replace(/\n/g, '<br>');
  }
  //#endregion

  //#region Permissions
  async requestMediaPermissions(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      console.log(' MODO DESARROLLO: Iniciando sin verificar dispositivos...');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log(' Dispositivos disponibles');
        stream.getTracks().forEach(track => track.stop());
        this.cameraEnabled = true;
        this.microphoneEnabled = true;
      } catch (error: any) {
        console.warn(' No hay dispositivos, continuando de todos modos...');
        this.cameraEnabled = false;
        this.microphoneEnabled = false;
      }

      this.showPermissionDialog = false;
      await this.initializeVideoCall();

    } catch (error: any) {
      console.error(' Error:', error);
      this.showPermissionDialog = false;
      this.cameraEnabled = false;
      this.microphoneEnabled = false;
      await this.initializeVideoCall();
    }
  }
  //#endregion

  //#region Video Call Initialization
  async initializeVideoCall(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      console.log(' Iniciando videollamada para sesión:', this.sessionId);

      const config: IVideoCallConfig = {
        sessionId: this.sessionId,
        joinLink: '',
        cameraEnabled: this.cameraEnabled,
        microphoneEnabled: this.microphoneEnabled
      };

      await this.joinVideoCall(config);

    } catch (error: any) {
      this.handleError(error);
    }
  }

  private async joinVideoCall(config: IVideoCallConfig): Promise<void> {
    try {
      console.log('📡 Conectando al backend...');

      const response = await this.videoCallService.joinVideoCall(config).toPromise();
      
      if (!response) {
        throw new Error('No se recibieron datos de la videollamada');
      }
      
      this.videoCallData = response;
      console.log(' Datos recibidos:', this.videoCallData);

      if (this.videoCallData.isModerator) {
        const shareStatus = await this.videoCallService.validateScreenShare(this.sessionId).toPromise();
        this.canShareScreen = shareStatus?.canShareScreen || false;
      }

      this.isConnected = true;
      this.isLoading = false;

      await this.delay(100);

      console.log('🎬 Inicializando Jitsi...');

      const initialized = await this.videoCallService.initializeJitsi('jitsi-container', this.videoCallData);

      if (!initialized) {
        throw new Error('No se pudo inicializar Jitsi');
      }

      console.log(' Jitsi inicializado correctamente');
      
      this.setupJitsiParticipantListeners();
      this.startTimer();
      
      this.retryCount = 0;

    } catch (error: any) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Reintento ${this.retryCount}/${this.maxRetries}...`);
        await this.delay(2000);
        await this.joinVideoCall(config);
      } else {
        this.handleError(error);
      }
    }
  }
  //#endregion

  //#region Jitsi Participant Management
  private setupJitsiParticipantListeners(): void {
    const jitsiApi = this.videoCallService.jitsiApi;
    if (!jitsiApi) return;

    console.log(' Configurando listeners de participantes...');

    jitsiApi.addEventListener('videoConferenceJoined', async (participant: any) => {
      console.log(' Usuario local unido:', participant);
      this.addLocalParticipant(participant);
      
      setTimeout(() => {
        this.forceHideJitsiFilmstrip();
      }, 500);
      
      setTimeout(async () => {
        const isVideoMuted = await jitsiApi.isVideoMuted();
        if (!isVideoMuted) {
          await this.attachLocalVideoToSidebar();
        } else {
          console.log(' Cámara apagada al unirse, esperando que se encienda...');
        }
      }, 1500);
    });

    jitsiApi.addEventListener('participantJoined', (participant: any) => {
      console.log(' Participante se unió:', participant);
      this.addRemoteParticipant(participant);
    });

    jitsiApi.addEventListener('participantLeft', (participant: any) => {
      console.log(' Participante salió:', participant);
      this.removeParticipant(participant.id);
    });

    jitsiApi.addEventListener('videoMuteStatusChanged', async (data: any) => {
      console.log(' Estado de video cambió:', data);
      
      if (data.id === undefined || data.id === jitsiApi.getMyUserId()) {
        this.updateParticipantVideoStatus('local', !data.muted);
        
        if (!data.muted) {
          setTimeout(async () => {
            await this.attachLocalVideoToSidebar();
          }, 500);
        } else {
          const localParticipantContainer = document.getElementById('participant-video-local');
          if (localParticipantContainer) {
            localParticipantContainer.innerHTML = '';
            console.log(' Video removido del sidebar (cámara apagada)');
          }
        }
      } else {
        this.updateParticipantVideoStatus(data.id, !data.muted);
      }
    });

    jitsiApi.addEventListener('audioMuteStatusChanged', (data: any) => {
      console.log(' Estado de audio cambió:', data);
      
      if (data.id === undefined || data.id === jitsiApi.getMyUserId()) {
        this.updateParticipantAudioStatus('local', !data.muted);
      } else {
        this.updateParticipantAudioStatus(data.id, !data.muted);
      }
    });

    this.forceHideJitsiFilmstrip();
  }

  private forceHideJitsiFilmstrip(): void {
    const removeElements = () => {
      const filmstripSelectors = [
        '.filmstrip',
        '.vertical-filmstrip',
        '.horizontal-filmstrip',
        '.filmstrip__videos',
        '.remote-videos-container',
        '.filmstrip-wrapper',
        '#remoteVideos',
        '#filmstripRemoteVideos',
        '[class*="filmstrip"]',
        '[id*="filmstrip"]'
      ];

      let removedCount = 0;
      filmstripSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el: Element) => {
          el.remove();
          removedCount++;
        });
      });

      const titleSelectors = [
        '.subject',
        '.subject-text',
        '.subject-info-container',
        '.subject-text-container',
        '[class*="subject"]',
        '[class*="Subject"]',
        '[class*="conference"]',
        '[class*="Conference"]',
        '.recording-label',
        '.header-text',
        '.headerTitle',
        'div[role="heading"]',
        '[aria-label*="Conference"]',
        '[aria-label*="Session"]',
        '.labels-container',
        '[data-testid*="subject"]',
        '[data-testid*="conference"]'
      ];

      titleSelectors.forEach(selector => {
        const elements = document.querySelectorAll(`#jitsi-container ${selector}`);
        elements.forEach((el: Element) => {
          el.remove();
          removedCount++;
        });
      });

      const allTextElements = document.querySelectorAll(
        '#jitsi-container div, #jitsi-container span, #jitsi-container p, #jitsi-container h1, #jitsi-container h2, #jitsi-container h3'
      );

      allTextElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const text = htmlEl.textContent?.trim() || '';

        if (text.includes('Skillswap') ||
            text.includes('Session') ||
            /^\d{4}$/.test(text) ||
            text.match(/Session\s+\d+/i)) {

          let current: HTMLElement | null = htmlEl;
          const toRemove: HTMLElement[] = [];
          
          for (let i = 0; i < 5 && current; i++) {
            toRemove.push(current);
            current = current.parentElement;
          }
          
          toRemove.forEach(elem => {
            if (elem && elem.parentNode) {
              elem.remove();
              removedCount++;
            }
          });
          
          console.log(' Eliminados elementos con texto:', text);
        }
      });

      if (removedCount > 0) {
        console.log(` ${removedCount} elementos eliminados del DOM`);
      }
    };

    removeElements();
    setTimeout(removeElements, 100);
    setTimeout(removeElements, 300);
    setTimeout(removeElements, 500);
    setTimeout(removeElements, 1000);
    setTimeout(removeElements, 2000);

    setInterval(removeElements, 500);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            const text = element.textContent?.trim() || '';

            if (text.includes('Skillswap') ||
                text.includes('Session') ||
                /^\d{4}$/.test(text) ||
                element.className.includes('subject') ||
                element.className.includes('conference') ||
                element.className.includes('filmstrip')) {
              console.log('🗑️ Eliminando elemento nuevo:', text || element.className);
              element.remove();
            }
          }
        });
      });
    });

    const jitsiContainer = document.getElementById('jitsi-container');
    if (jitsiContainer) {
      observer.observe(jitsiContainer, {
        childList: true,
        subtree: true
      });
      console.log(' MutationObserver activo - eliminará títulos automáticamente');
    }
  }

  private async attachLocalVideoToSidebar(): Promise<void> {
    try {
      console.log('========================================');
      console.log(' INICIANDO CAPTURA DE VIDEO LOCAL');
      console.log('========================================');
      
      const jitsiApi = this.videoCallService.jitsiApi;
      if (!jitsiApi) {
        console.warn(' Jitsi API no disponible');
        return;
      }

      const localParticipant = this.jitsiParticipants.find(p => p.id === 'local');
      console.log(' Participante local en array:', localParticipant ? 'SÍ' : 'NO');
      
      if (!localParticipant) {
        console.error(' Participante local no existe en el array');
        return;
      }

      const isVideoMuted = await jitsiApi.isVideoMuted();
      console.log(' Estado de video:', isVideoMuted ? 'APAGADO' : 'ENCENDIDO');

      if (isVideoMuted) {
        console.warn(' La cámara está apagada, no hay video para capturar');
        localParticipant.hasVideo = false;
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });

        console.log(' Stream de video obtenido');
        console.log('   Tracks de video:', stream.getVideoTracks().length);

        if (stream.getVideoTracks().length === 0) {
          console.error(' No hay tracks de video en el stream');
          return;
        }

        const containerId = 'participant-video-local';
        const localParticipantContainer = document.getElementById(containerId);
        
        console.log(' Buscando contenedor:', containerId);
        console.log('   Encontrado:', localParticipantContainer ? 'SÍ' : 'NO');

        if (!localParticipantContainer) {
          console.error(' Contenedor del participante local no encontrado');
          
          const allContainers = document.querySelectorAll('[id^="participant-video-"]');
          console.log('   Contenedores en DOM:', allContainers.length);
          allContainers.forEach(container => {
            console.log('      -', container.id);
          });
          
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log(' Contenedor encontrado:', localParticipantContainer.id);

        localParticipantContainer.innerHTML = '';
        console.log(' Contenedor limpiado');

        const sidebarVideo = document.createElement('video');
        sidebarVideo.srcObject = stream;
        sidebarVideo.autoplay = true;
        sidebarVideo.muted = true;
        sidebarVideo.playsInline = true;
        sidebarVideo.style.width = '100%';
        sidebarVideo.style.height = '100%';
        sidebarVideo.style.objectFit = 'cover';
        sidebarVideo.style.borderRadius = '15px';

        localParticipantContainer.appendChild(sidebarVideo);

        console.log(' Video agregado al contenedor');

        await sidebarVideo.play();
        console.log(' Video reproduciéndose en sidebar');

        localParticipant.hasVideo = true;
        console.log(' Estado del participante actualizado - hasVideo: true');

        console.log('========================================');
        console.log(' CAPTURA COMPLETADA EXITOSAMENTE');
        console.log('========================================');

      } catch (mediaError: any) {
        console.error(' Error al obtener stream de video:', mediaError);
        
        if (mediaError.name === 'NotAllowedError') {
          console.error('   El usuario denegó el permiso de la cámara');
        } else if (mediaError.name === 'NotFoundError') {
          console.error('   No se encontró dispositivo de cámara');
        }
      }

    } catch (error) {
      console.error('========================================');
      console.error(' ERROR AL CAPTURAR VIDEO LOCAL');
      console.error('   Error:', error);
      console.error('========================================');
    }
  }

  private addLocalParticipant(data: any): void {
    const displayName = data.displayName || this.videoCallData?.displayName || 'Tú';
    const initials = this.getInitials(displayName);

    const localParticipant: JitsiParticipant = {
      id: 'local',
      displayName: displayName,
      initials: initials,
      hasVideo: this.cameraEnabled,
      hasAudio: this.microphoneEnabled
    };

    const exists = this.jitsiParticipants.find(p => p.id === 'local');
    if (!exists) {
      this.jitsiParticipants.unshift(localParticipant);
      console.log(' Participante local agregado');
    }
  }

  private addRemoteParticipant(data: any): void {
    const displayName = data.displayName || 'Participante';
    const initials = this.getInitials(displayName);

    const remoteParticipant: JitsiParticipant = {
      id: data.id,
      displayName: displayName,
      initials: initials,
      hasVideo: false,
      hasAudio: false
    };

    const exists = this.jitsiParticipants.find(p => p.id === data.id);
    if (!exists) {
      this.jitsiParticipants.push(remoteParticipant);
      console.log(' Participante remoto agregado:', displayName);
    }
  }

  private removeParticipant(participantId: string): void {
    const index = this.jitsiParticipants.findIndex(p => p.id === participantId);
    if (index !== -1) {
      const removed = this.jitsiParticipants.splice(index, 1)[0];
      console.log('🗑 Participante removido:', removed.displayName);
    }
  }

  private updateParticipantVideoStatus(participantId: string, hasVideo: boolean): void {
    const participant = this.jitsiParticipants.find(p => p.id === participantId);
    if (participant) {
      participant.hasVideo = hasVideo;
      console.log(`📹 ${participant.displayName} - Video: ${hasVideo ? 'ON' : 'OFF'}`);
    }
  }

  private updateParticipantAudioStatus(participantId: string, hasAudio: boolean): void {
    const participant = this.jitsiParticipants.find(p => p.id === participantId);
    if (participant) {
      participant.hasAudio = hasAudio;
      console.log(`🎤 ${participant.displayName} - Audio: ${hasAudio ? 'ON' : 'OFF'}`);
    }
  }

  private getInitials(name: string): string {
    if (!name || name.trim() === '') return '??';
    
    const parts = name.trim().split(/\s+/);
    
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getParticipantColor(index: number): string {
    return this.participantColors[index % this.participantColors.length];
  }
  //#endregion

  //#region  Recording Management
  async startRecording(): Promise<void> {
    if (!this.videoCallData?.isModerator) {
      this.showAlert(
        'Permiso Denegado',
        'Solo el instructor puede iniciar la grabación de la sesión.',
        'warning'
      );
      return;
    }

    this.showAlert(
      'Iniciar Grabación',
      '¿Deseas comenzar a grabar el audio de esta sesión?\n\n' +
      'Se capturará:\n' +
      '• Tu micrófono\n' +
      '• Audio de todos los participantes\n' +
      '• Todo el contenido de audio de la videollamada\n\n' +
      'Asegúrate de tener el micrófono encendido durante la grabación.',
      'info',
      'Iniciar Grabación',
      'Cancelar',
      async () => {
        try {
          console.log(' Iniciando proceso de grabación...');
          
          try {
            await this.videoCallService.clearRecording(this.sessionId).toPromise();
            console.log(' Grabaciones previas limpiadas');
          } catch (error) {
            console.log(' No había grabaciones previas');
          }
          
          const response = await this.videoCallService.startRecording(this.sessionId).toPromise();
          
          if (response && response.success) {
            console.log(' Backend notificado:', response.data);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const started = await this.videoCallService.startNativeAudioRecording(this.sessionId);
            
            if (started) {
              this.isRecording = true;
              this.recordingStartTime = new Date();
              this.startRecordingTimer();
              
              console.log(' Grabación iniciada exitosamente');
              
             
              this.displayToast('Grabación iniciada', 'success');
            } else {
              await this.videoCallService.stopRecording(this.sessionId).toPromise();
              this.showAlert(
                'Error al Iniciar',
                'No se pudo iniciar la grabación. Por favor, intenta nuevamente.',
                'error'
              );
            }
          }
        } catch (error) {
          console.error(' Error:', error);
          this.showAlert(
            'Error de Grabación',
            'Ocurrió un error al iniciar la grabación. Por favor, intenta de nuevo.',
            'error'
          );
        }
      }
    );
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      console.log(' stopRecording llamado pero NO está grabando, ignorando');
      return;
    }

    console.log('========================================');
    console.log('⏹ DETENIENDO GRABACIÓN - INICIO');
    console.log('========================================');

    this.isRecording = false;
    this.stopRecordingTimer();
    this.recordingStartTime = null;

    try {
      console.log(' Deteniendo grabación...');
      
      this.videoCallService.stopNativeAudioRecording();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await this.videoCallService.stopRecording(this.sessionId).toPromise();
      
      if (response && response.success) {
        console.log(' Grabación detenida');
        console.log('   Duración:', response.data.durationSeconds, 'segundos');
        
    
        this.displayToast('Grabación finalizada', 'success');
        
        console.log('========================================');
        console.log(' GRABACIÓN DETENIDA - FIN');
        console.log('========================================');
      }
    } catch (error) {
      console.error(' Error al detener grabación:', error);
      
      
      this.displayToast('Error al detener la grabación', 'error');
    }
  }

  toggleRecording(): void {
    if (this.isRecording) {
      this.showAlert(
        'Detener Grabación',
        '¿Estás seguro de que deseas detener la grabación de audio?',
        'warning',
        'Detener',
        'Cancelar',
        () => {
          this.stopRecording();
        }
      );
    } else {
      this.startRecording();
    }
  }

  private startRecordingTimer(): void {
    this.recordingInterval = setInterval(() => {
      this.updateRecordingTimer();
    }, 1000);
  }

  private stopRecordingTimer(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
    this.recordingDuration = '00:00';
  }

  private updateRecordingTimer(): void {
    if (!this.recordingStartTime) return;

    const now = new Date();
    const diff = now.getTime() - this.recordingStartTime.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      this.recordingDuration = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    } else {
      this.recordingDuration = `${this.pad(minutes)}:${this.pad(seconds)}`;
    }
  }
  //#endregion

  //#region Session Timer
  private startTimer(): void {
    this.sessionStartTime = new Date();
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimer(): void {
    if (!this.sessionStartTime) return;

    const now = new Date();
    const diff = now.getTime() - this.sessionStartTime.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      this.sessionTimer = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    } else {
      this.sessionTimer = `${this.pad(minutes)}:${this.pad(seconds)}`;
    }
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }
  //#endregion

  //#region Hangup Interceptor
  private setupHangupInterceptor(): void {
    window.addEventListener('jitsi-hangup-clicked', (event: any) => {
      if (this.videoCallData?.isModerator) {
        event.preventDefault();
        this.showEndSessionModal = true;
      } else {
        this.leaveCall();
      }
    });
  }
  //#endregion

  //#region Modal Management
  openParticipantsModal(): void {
    this.showParticipantsModal = true;
  }

  closeParticipantsModal(): void {
    this.showParticipantsModal = false;
  }

  openDocumentsModal(): void {
    this.showDocumentsModal = true;
  }

  closeDocumentsModal(): void {
    this.showDocumentsModal = false;
  }
  //#endregion

  //#region Custom Buttons Actions
  toggleParticipants(): void {
    this.openParticipantsModal();
  }

  toggleChat(): void {
    if (this.videoCallService.isJitsiActive()) {
      try {
        const jitsiApi = this.videoCallService.jitsiApi;
        if (jitsiApi) {
          jitsiApi.executeCommand('toggleChat');
          console.log(' Chat toggled');
        }
      } catch (error) {
        console.error('Error al abrir chat:', error);
      }
    }
  }

  toggleDocuments(): void {
    this.openDocumentsModal();
  }
  //#endregion

  //#region Modal Actions
  closeEndSessionModal(): void {
    this.showEndSessionModal = false;
  }

  async endSessionForEveryone(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      
      await this.videoCallService.endVideoCall(this.sessionId).toPromise();
      this.showEndSessionModal = false;
      this.leaveCall();
    } catch (error) {
      console.error('Error al finalizar sesión:', error);
      this.showAlert(
        'Error al Finalizar',
        'Ocurrió un error al finalizar la sesión. Por favor, intenta de nuevo.',
        'error'
      );
    }
  }

  leaveSessionOnly(): void {
    this.showEndSessionModal = false;
    this.leaveCall();
  }
  //#endregion

  //#region Leave Call
  leaveCall(): void {
    this.stopTimer();
    this.stopRecordingTimer();
    
    if (this.isRecording) {
      this.stopRecording();
    }
    
    if (this.videoCallService.isJitsiActive()) {
      this.videoCallService.leaveVideoCall();
    }
    
    this.router.navigate(['/app/dashboard']);
  }
  //#endregion

  //#region Error Handling
  private handleError(error: any): void {
    console.error(' Error en videollamada:', error);
    
    if (error.status === 401) {
      this.errorMessage = 'Usuario no autenticado. Redirigiendo a login...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else if (error.status === 400) {
      this.errorMessage = 'Enlace no válido o sesión no disponible';
    } else if (error.status === 403) {
      this.errorMessage = 'La sesión aún no está disponible. Espera a que el instructor la active.';
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'Error al conectar a la videollamada. Intenta de nuevo.';
    }

    this.isLoading = false;
    this.isConnected = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  //#endregion

  //#region Notes Management
  toggleNotes(): void {
    this.showNotesPanel = !this.showNotesPanel;
  }

  closeNotes(): void {
    this.showNotesPanel = false;
  }
  //#endregion

  //#region Transcription Management
/**
 *  Descarga la transcripción como archivo .txt
 */
downloadTranscription(): void {
  if (!this.videoCallData?.isModerator) {
    this.displayToast('Solo el instructor puede descargar', 'error');
    return;
  }

  this.showAlert(
    'Descargar Transcripción',
    '¿Deseas descargar la transcripción de esta sesión?\n\n' +
    'Se descargará un archivo .txt con el contenido completo.',
    'info',
    'Descargar',
    'Cancelar',
    () => {
      console.log(' Solicitando transcripción...');
      
      this.transcriptionService.getTranscription(this.sessionId).subscribe({
        next: (response: any) => {
          if (response && response.data && response.data.transcription) {
            const transcription = response.data.transcription;
            const wordCount = response.data.wordCount || 0;
            const duration = response.data.durationSeconds || 0;
            
            console.log(' Transcripción obtenida');
            console.log('   Palabras:', wordCount);
            console.log('   Duración:', duration, 'segundos');
            
            // Crear contenido con metadata
            const metadata = `===========================================
TRANSCRIPCIÓN DE SESIÓN - SKILLSWAP
===========================================
Sesión: #${this.sessionId}
Palabras: ${wordCount}
Duración: ${Math.floor(duration / 60)} minutos ${duration % 60} segundos
Fecha: ${new Date().toLocaleString('es-ES')}
===========================================

`;
            
            const fullContent = metadata + transcription;
            const fileName = `transcripcion_sesion_${this.sessionId}_${new Date().getTime()}.txt`;
            
            // Crear blob y descargar
            const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log(' Archivo descargado:', fileName);
            this.displayToast('Transcripción descargada exitosamente', 'success');
            
          } else {
            console.warn(' No hay transcripción disponible');
            this.displayToast('No hay transcripción disponible para esta sesión', 'error');
          }
        },
        error: (error: any) => {
          console.error(' Error al descargar transcripción:', error);
          
          if (error.status === 404) {
            this.displayToast('No hay transcripción disponible aún', 'error');
          } else {
            this.displayToast('Error al descargar transcripción', 'error');
          }
        }
      });
    }
  );
}
//#endregion
}