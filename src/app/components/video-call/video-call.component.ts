import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoCallService } from '../../services/video-call.service';
import { IVideoCallConfig, IVideoCallData, IScreenShareStatus } from '../../interfaces';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
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
      this.requestMediaPermissions();
    });

    // Interceptar evento de Jitsi "hangup" para mostrar modal en Instructor
    this.setupHangupInterceptor();
  }

  ngOnDestroy(): void {
    this.leaveCall();
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

  //#region Hangup Interceptor
  private setupHangupInterceptor(): void {
    // Escuchar el evento global de Jitsi para interceptar "hangup"
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

  //#region Custom Buttons Actions (Right Side)
  /**
   * Abre/cierra el panel de participantes de Jitsi
   */
  toggleParticipants(): void {
    if (this.videoCallService.isJitsiActive()) {
      try {
        // Acceder a la API de Jitsi para ejecutar comando
        const jitsiApi = (this.videoCallService as any).jitsiApi;
        if (jitsiApi) {
          jitsiApi.executeCommand('toggleParticipantsPane');
          console.log('👥 Panel de participantes toggled');
        }
      } catch (error) {
        console.error('Error al abrir participantes:', error);
      }
    }
  }

  /**
   * Abre/cierra el chat de Jitsi
   */
  toggleChat(): void {
    if (this.videoCallService.isJitsiActive()) {
      try {
        const jitsiApi = (this.videoCallService as any).jitsiApi;
        if (jitsiApi) {
          jitsiApi.executeCommand('toggleChat');
          console.log('💬 Chat toggled');
        }
      } catch (error) {
        console.error('Error al abrir chat:', error);
      }
    }
  }

  /**
   * Funcionalidad de documentos (por implementar)
   * Tu compañera puede agregar aquí la lógica de subida de documentos
   */
  toggleDocuments(): void {
    console.log('📄 Botón de documentos clickeado');
    // Por ahora solo un mensaje, tu compañera puede implementar la funcionalidad
    alert('Funcionalidad de subida de documentos - Por implementar');
    
    // Ejemplo de cómo podría funcionar:
    // this.openDocumentUploadModal();
    // O abrir etherpad de Jitsi:
    // const jitsiApi = (this.videoCallService as any).jitsiApi;
    // if (jitsiApi) {
    //   jitsiApi.executeCommand('toggleEtherpad');
    // }
  }
  //#endregion

  //#region Modal Actions
  closeEndSessionModal(): void {
    this.showEndSessionModal = false;
  }

  async endSessionForEveryone(): Promise<void> {
    try {
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