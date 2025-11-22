import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoCallService } from '../../services/video-call.service';
import { IVideoCallConfig, IVideoCallData, IScreenShareStatus } from '../../interfaces';
import { ParticipantsModalComponent } from '../participants-modal/participants-modal.component';
import { DocumentsModalComponent } from '../documents-modal/documents-modal.component';

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
  imports: [CommonModule, ParticipantsModalComponent, DocumentsModalComponent],
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
  showConsentDialog: boolean = true; 
  
  // Modales
  showParticipantsModal: boolean = false;
  showDocumentsModal: boolean = false;
  
  // Participantes conectados
  jitsiParticipants: JitsiParticipant[] = [];
  
  // Timer de sesión
  sessionTimer: string = '00:00';
  private timerInterval: any;
  private sessionStartTime: Date | null = null;
  
  // ⭐ Grabación de audio
  isRecording: boolean = false;
  recordingDuration: string = '00:00';
  private recordingStartTime: Date | null = null;
  private recordingInterval: any;
  hasGivenConsent: boolean = false;
  
  // Colores para participantes
  participantColors: string[] = [
    'linear-gradient(135deg, #8b9eea 0%, #8b6bb8 100%)',
    'linear-gradient(135deg, #ff9eb5 0%, #ff7a8c 100%)',
    'linear-gradient(135deg, #7ed3ff 0%, #5bc8ff 100%)',
    'linear-gradient(135deg, #a5886b 0%, #8b6f52 100%)',
    'linear-gradient(135deg, #7bdb8e 0%, #5bc96f 100%)',
  ];
  //#endregion

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoCallService: VideoCallService
  ) {}

  //#region Lifecycle Hooks
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = +params['sessionId'];
      this.showConsentDialog = true;
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
  }
  //#endregion

  //#region Consent Management
  acceptConsent(): void {
    this.hasGivenConsent = true;
    this.showConsentDialog = false;
    this.requestMediaPermissions();
  }

  declineConsent(): void {
    this.hasGivenConsent = false;
    this.showConsentDialog = false;
    alert('Sin tu consentimiento, no podrás unirte a la sesión');
    this.router.navigate(['/app/dashboard']);
  }
  //#endregion

  //#region Permissions
  async requestMediaPermissions(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      console.log('🎤 Solicitando permisos de cámara y micrófono...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ Permisos concedidos');
      stream.getTracks().forEach(track => track.stop());

      this.showPermissionDialog = false;
      await this.initializeVideoCall();

    } catch (error: any) {
      console.error('❌ Error al solicitar permisos:', error);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.errorMessage = 'Debes permitir el acceso a la cámara y micrófono para unirte a la videollamada.';
      } else if (error.name === 'NotFoundError') {
        this.errorMessage = 'No se detectó cámara o micrófono en tu dispositivo.';
      } else {
        this.errorMessage = 'Error al acceder a los dispositivos de media: ' + error.message;
      }

      this.isLoading = false;
    }
  }
  //#endregion

  //#region Video Call Initialization
  async initializeVideoCall(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      console.log('🚀 Iniciando videollamada para sesión:', this.sessionId);

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
      console.log('✅ Datos recibidos:', this.videoCallData);

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

      console.log('✅ Jitsi inicializado correctamente');
      
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

    console.log('👂 Configurando listeners de participantes...');

    // ⭐ Evento cuando el usuario local se une
    jitsiApi.addEventListener('videoConferenceJoined', async (participant: any) => {
      console.log('✅ Usuario local unido:', participant);
      this.addLocalParticipant(participant);
      
      // ⭐ Forzar ocultación del filmstrip
      setTimeout(() => {
        this.forceHideJitsiFilmstrip();
      }, 500);
      
      // Capturar video local después de unirse
      setTimeout(async () => {
        const isVideoMuted = await jitsiApi.isVideoMuted();
        if (!isVideoMuted) {
          await this.attachLocalVideoToSidebar();
        } else {
          console.log('📹 Cámara apagada al unirse, esperando que se encienda...');
        }
      }, 1500);
    });

    // Evento cuando un participante remoto se une
    jitsiApi.addEventListener('participantJoined', (participant: any) => {
      console.log('👤 Participante se unió:', participant);
      this.addRemoteParticipant(participant);
    });

    // Evento cuando un participante se va
    jitsiApi.addEventListener('participantLeft', (participant: any) => {
      console.log('👋 Participante salió:', participant);
      this.removeParticipant(participant.id);
    });

    // ⭐ Evento cuando cambia el estado del video
    jitsiApi.addEventListener('videoMuteStatusChanged', async (data: any) => {
      console.log('📹 Estado de video cambió:', data);
      
      // Si es el usuario local, actualizar el video en el sidebar
      if (data.id === undefined || data.id === jitsiApi.getMyUserId()) {
        this.updateParticipantVideoStatus('local', !data.muted);
        
        // Re-capturar video cuando se enciende la cámara
        if (!data.muted) {
          setTimeout(async () => {
            await this.attachLocalVideoToSidebar();
          }, 500);
        } else {
          // Si se apaga la cámara, limpiar el video del sidebar
          const localParticipantContainer = document.getElementById('participant-video-local');
          if (localParticipantContainer) {
            localParticipantContainer.innerHTML = '';
            console.log('📹 Video removido del sidebar (cámara apagada)');
          }
        }
      } else {
        this.updateParticipantVideoStatus(data.id, !data.muted);
      }
    });

    // Evento cuando cambia el estado del audio
    jitsiApi.addEventListener('audioMuteStatusChanged', (data: any) => {
      console.log('🎤 Estado de audio cambió:', data);
      
      if (data.id === undefined || data.id === jitsiApi.getMyUserId()) {
        this.updateParticipantAudioStatus('local', !data.muted);
      } else {
        this.updateParticipantAudioStatus(data.id, !data.muted);
      }
    });

    // ⭐ Forzar ocultación del filmstrip
    this.forceHideJitsiFilmstrip();
  }

  /**
   * ⭐ Forzar ocultación del filmstrip de Jitsi
   */
  private forceHideJitsiFilmstrip(): void {
    const hideFilmstrip = () => {
      // Seleccionar todos los posibles elementos del filmstrip
      const selectors = [
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

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
          htmlEl.style.opacity = '0';
          htmlEl.style.height = '0';
          htmlEl.style.width = '0';
          htmlEl.style.overflow = 'hidden';
          htmlEl.style.pointerEvents = 'none';
        });
      });

      // También ocultar cualquier video container que no sea el principal
      const videoContainers = document.querySelectorAll('.videocontainer');
      videoContainers.forEach((container: Element) => {
        const htmlContainer = container as HTMLElement;
        // Solo ocultar si NO es el contenedor del video principal
        if (!htmlContainer.classList.contains('videocontainer__video')) {
          htmlContainer.style.display = 'none';
        }
      });
    };

    // Ejecutar inmediatamente
    hideFilmstrip();

    // Ejecutar después de 1 segundo (cuando Jitsi haya renderizado)
    setTimeout(hideFilmstrip, 1000);

    // Ejecutar después de 2 segundos (por si acaso)
    setTimeout(hideFilmstrip, 2000);

    // Observar cambios en el DOM y ocultar si aparece de nuevo
    const observer = new MutationObserver(hideFilmstrip);
    
    const jitsiContainer = document.getElementById('jitsi-container');
    if (jitsiContainer) {
      observer.observe(jitsiContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
  }

  /**
   * ⭐ SOLUCIÓN: Obtener video local directamente de la API de Jitsi
   */
  private async attachLocalVideoToSidebar(): Promise<void> {
    try {
      console.log('========================================');
      console.log('🎥 INICIANDO CAPTURA DE VIDEO LOCAL');
      console.log('========================================');
      
      const jitsiApi = this.videoCallService.jitsiApi;
      if (!jitsiApi) {
        console.warn('⚠ Jitsi API no disponible');
        return;
      }

      // Verificar que el participante local existe en el array
      const localParticipant = this.jitsiParticipants.find(p => p.id === 'local');
      console.log('👤 Participante local en array:', localParticipant ? 'SÍ' : 'NO');
      
      if (!localParticipant) {
        console.error('❌ Participante local no existe en el array');
        return;
      }

      // Verificar si la cámara está encendida
      const isVideoMuted = await jitsiApi.isVideoMuted();
      console.log('📹 Estado de video:', isVideoMuted ? 'APAGADO' : 'ENCENDIDO');

      if (isVideoMuted) {
        console.warn('⚠ La cámara está apagada, no hay video para capturar');
        localParticipant.hasVideo = false;
        return;
      }

      // ⭐ SOLUCIÓN: Obtener el stream directamente del navegador
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });

        console.log('✅ Stream de video obtenido');
        console.log('   Tracks de video:', stream.getVideoTracks().length);

        if (stream.getVideoTracks().length === 0) {
          console.error('❌ No hay tracks de video en el stream');
          return;
        }

        // Contenedor del participante local en el sidebar
        const containerId = 'participant-video-local';
        const localParticipantContainer = document.getElementById(containerId);
        
        console.log('📦 Buscando contenedor:', containerId);
        console.log('   Encontrado:', localParticipantContainer ? 'SÍ' : 'NO');

        if (!localParticipantContainer) {
          console.error('❌ Contenedor del participante local no encontrado');
          
          // Buscar todos los contenedores posibles
          const allContainers = document.querySelectorAll('[id^="participant-video-"]');
          console.log('   Contenedores en DOM:', allContainers.length);
          allContainers.forEach(container => {
            console.log('      -', container.id);
          });
          
          // Detener el stream si no encontramos el contenedor
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('✅ Contenedor encontrado:', localParticipantContainer.id);

        // Limpiar contenedor anterior
        localParticipantContainer.innerHTML = '';
        console.log('🧹 Contenedor limpiado');

        // Crear nuevo elemento de video
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

        console.log('✅ Video agregado al contenedor');

        // Forzar reproducción
        await sidebarVideo.play();
        console.log('▶ Video reproduciéndose en sidebar');

        // Actualizar estado del participante
        localParticipant.hasVideo = true;
        console.log('✅ Estado del participante actualizado - hasVideo: true');

        console.log('========================================');
        console.log('✅ CAPTURA COMPLETADA EXITOSAMENTE');
        console.log('========================================');

      } catch (mediaError: any) {
        console.error('❌ Error al obtener stream de video:', mediaError);
        
        if (mediaError.name === 'NotAllowedError') {
          console.error('   El usuario denegó el permiso de la cámara');
        } else if (mediaError.name === 'NotFoundError') {
          console.error('   No se encontró dispositivo de cámara');
        }
      }

    } catch (error) {
      console.error('========================================');
      console.error('❌ ERROR AL CAPTURAR VIDEO LOCAL');
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
      console.log('✅ Participante local agregado');
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
      console.log('✅ Participante remoto agregado:', displayName);
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

  //#region ⭐ Recording Management
  async startRecording(): Promise<void> {
    if (!this.hasGivenConsent) {
      alert('No se puede grabar sin el consentimiento de grabación.');
      return;
    }

    if (!this.videoCallData?.isModerator) {
      alert('Solo el instructor puede iniciar la grabación.');
      return;
    }

    const confirmed = confirm(
      '🎙 GRABACIÓN DE AUDIO DE SESIÓN\n\n' +
      '📋 Se grabará:\n' +
      '  ✅ Tu micrófono (lo que tú hablas)\n' +
      '  ✅ Audio de otros participantes\n' +
      '  ✅ Todo el audio de la videollamada\n\n' +
      '⚠ Asegúrate de:\n' +
      '  • Tener el micrófono encendido\n' +
      '  • Hablar durante la grabación para prueba\n\n' +
      '¿Iniciar grabación?'
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log('🎙 Iniciando proceso de grabación...');
      
      // Limpiar grabaciones previas
      try {
        await this.videoCallService.clearRecording(this.sessionId).toPromise();
        console.log('🧹 Grabaciones previas limpiadas');
      } catch (error) {
        console.log('⚠ No había grabaciones previas');
      }
      
      // Notificar al backend
      const response = await this.videoCallService.startRecording(this.sessionId).toPromise();
      
      if (response && response.success) {
        console.log('✅ Backend notificado:', response.data);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Iniciar grabación nativa
        const started = await this.videoCallService.startNativeAudioRecording(this.sessionId);
        
        if (started) {
          this.isRecording = true;
          this.recordingStartTime = new Date();
          this.startRecordingTimer();
          
          console.log('✅ Grabación iniciada exitosamente');
          
          alert('✅ Grabación iniciada.\n\n' +
                '🎤 Habla ahora para verificar que funciona.\n' +
                '⏺ El indicador REC aparecerá arriba.');
        } else {
          await this.videoCallService.stopRecording(this.sessionId).toPromise();
          alert('❌ No se pudo iniciar la grabación.');
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error al iniciar la grabación.');
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) return;

    try {
      console.log('⏹ Deteniendo grabación...');
      
      // Detener grabación del navegador
      this.videoCallService.stopNativeAudioRecording();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Notificar al backend
      const response = await this.videoCallService.stopRecording(this.sessionId).toPromise();
      
      if (response && response.success) {
        this.isRecording = false;
        this.stopRecordingTimer();
        this.recordingStartTime = null;
        
        console.log('✅ Grabación detenida');
        console.log('   Duración:', response.data.durationSeconds, 'segundos');
        
        alert('✅ Grabación detenida exitosamente.\n\n' +
              '⏱ Duración: ' + response.data.durationSeconds + ' segundos\n' +
              '📁 Archivo: ' + response.data.fileName + '\n\n' +
              '🔄 El audio se está procesando y convirtiendo a MP3.\n' +
              '⏳ Estará listo para transcripción en unos momentos.\n\n' +
              '💡 Revisa la consola del backend para ver el progreso detallado.');
      }
    } catch (error) {
      console.error('❌ Error al detener grabación:', error);
      
      this.isRecording = false;
      this.stopRecordingTimer();
      this.recordingStartTime = null;
      
      alert('Grabación detenida. El audio se está procesando.');
    }
  }

  toggleRecording(): void {
    if (this.isRecording) {
      if (confirm('¿Detener la grabación de audio?')) {
        this.stopRecording();
      }
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
          console.log('💬 Chat toggled');
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
      // Detener grabación si está activa
      if (this.isRecording) {
        await this.stopRecording();
      }
      
      await this.videoCallService.endVideoCall(this.sessionId).toPromise();
      this.showEndSessionModal = false;
      this.leaveCall();
    } catch (error) {
      console.error('Error al finalizar sesión:', error);
      alert('Error al finalizar la sesión');
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
    console.error('❌ Error en videollamada:', error);
    
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
}