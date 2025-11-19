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
  styleUrls: ['./video-call.component.scss']
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
  }

  ngOnDestroy(): void {
    this.leaveCall();
  }
  //#endregion

  async requestMediaPermissions(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      console.log('🎤 Solicitando permisos de cámara y micrófono...');

      // Solicitar acceso a cámara y micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log(' Permisos concedidos');

      
      stream.getTracks().forEach(track => track.stop());

      // Ocultar diálogo de permisos
      this.showPermissionDialog = false;

     
      await this.initializeVideoCall();

    } catch (error: any) {
      console.error(' Error al solicitar permisos:', error);

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

  /**
   * Inicializa la videollamada
   */
  async initializeVideoCall(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      console.log(' Iniciando videollamada para sesión:', this.sessionId);

      //  CAMBIO: Usar los valores de permisos activados
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

  toggleCamera(): void {
    this.cameraEnabled = !this.cameraEnabled;
    this.videoCallService.toggleCamera(this.cameraEnabled);
  }

  toggleMicrophone(): void {
    this.microphoneEnabled = !this.microphoneEnabled;
    this.videoCallService.toggleMicrophone(this.microphoneEnabled);
  }

  toggleScreenShare(): void {
    if (!this.canShareScreen) {
      alert('No tienes permisos para compartir pantalla. Solo los instructores pueden hacerlo.');
      return;
    }

    if (!this.isSharing) {
      this.startScreenShare();
    } else {
      this.stopScreenShare();
    }
  }

  leaveCall(): void {
    if (this.videoCallService.isJitsiActive()) {
      this.videoCallService.leaveVideoCall();
    }
    this.router.navigate(['/app/dashboard']);
  }

  async endSession(): Promise<void> {
    if (!this.videoCallData?.isModerator) {
      alert('Solo el instructor puede finalizar la sesión');
      return;
    }

    const confirm = window.confirm('¿Estás seguro de que deseas finalizar la sesión para todos?');
    if (!confirm) return;

    try {
      await this.videoCallService.endVideoCall(this.sessionId).toPromise();
      this.leaveCall();
    } catch (error) {
      console.error('Error al finalizar sesión:', error);
      alert('Error al finalizar la sesión');
    }
  }

  toggleControlsVisibility(): void {
    this.showControls = !this.showControls;
  }
  //#endregion

  //#region Private Methods
  private async joinVideoCall(config: IVideoCallConfig): Promise<void> {
    try {
      console.log('📡 Conectando al backend...');

      const response = await this.videoCallService.joinVideoCall(config).toPromise();
      
      if (!response) {
        throw new Error('No se recibieron datos de la videollamada');
      }
      
      this.videoCallData = response;
      console.log(' Datos recibidos:', this.videoCallData);

      // Validar permisos de compartir pantalla
      if (this.videoCallData.isModerator) {
        const shareStatus = await this.videoCallService.validateScreenShare(this.sessionId).toPromise();
        this.canShareScreen = shareStatus?.canShareScreen || false;
      }

      // Marcar como conectado PRIMERO
      this.isConnected = true;
      this.isLoading = false;

      // Esperar a que Angular renderice el DOM
      await this.delay(100);

      console.log(' Inicializando Jitsi...');

      // Inicializar Jitsi
      const initialized = await this.videoCallService.initializeJitsi('jitsi-container', this.videoCallData);

      if (!initialized) {
        throw new Error('No se pudo inicializar Jitsi');
      }

      console.log(' Jitsi inicializado correctamente');
      this.retryCount = 0;

    } catch (error: any) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(` Reintento ${this.retryCount}/${this.maxRetries}...`);
        await this.delay(2000);
        await this.joinVideoCall(config);
      } else {
        this.handleError(error);
      }
    }
  }

  private startScreenShare(): void {
    try {
      this.videoCallService.startScreenShare();
      this.isSharing = true;
    } catch (error) {
      console.error('Error al compartir pantalla:', error);
      alert('No se pudo iniciar compartir pantalla. Verifica los permisos del navegador.');
    }
  }

  private stopScreenShare(): void {
    this.videoCallService.stopScreenShare();
    this.isSharing = false;
  }

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
}