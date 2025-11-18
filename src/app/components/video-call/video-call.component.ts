import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoCallService } from '../../services/video-call.service';
import { IVideoCallConfig, IVideoCallData, IScreenShareStatus } from '../../interfaces';

/**
 * Componente para videollamadas con Jitsi Meet
 */
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
  cameraEnabled: boolean = false;
  microphoneEnabled: boolean = false;
  canShareScreen: boolean = false;
  isSharing: boolean = false;
  showControls: boolean = true;
  retryCount: number = 0;
  maxRetries: number = 3;
  //#endregion

  //#region Constructor
  /**
   * Crea una instancia de VideoCallComponent
   * @param route ActivatedRoute para obtener parámetros de ruta
   * @param router Router para navegación
   * @param videoCallService Servicio de videollamadas
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoCallService: VideoCallService
  ) {}
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Inicializa el componente
   */
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = +params['sessionId'];
      this.initializeVideoCall();
    });
  }

  /**
   * Limpia recursos al destruir el componente
   */
  ngOnDestroy(): void {
    this.leaveCall();
  }
  //#endregion

  //#region Public Methods
  /**
   * Inicializa la videollamada
   */
  async initializeVideoCall(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      // Configurar videollamada directamente con el sessionId
      // El backend generará el enlace automáticamente si no existe
      const config: IVideoCallConfig = {
        sessionId: this.sessionId,
        joinLink: '', // String vacío - el backend lo ignorará y generará el enlace
        cameraEnabled: this.cameraEnabled,
        microphoneEnabled: this.microphoneEnabled
      };

      // Unirse a la videollamada
      await this.joinVideoCall(config);

    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Alterna el estado de la cámara
   */
  toggleCamera(): void {
    this.cameraEnabled = !this.cameraEnabled;
    this.videoCallService.toggleCamera(this.cameraEnabled);
  }

  /**
   * Alterna el estado del micrófono
   */
  toggleMicrophone(): void {
    this.microphoneEnabled = !this.microphoneEnabled;
    this.videoCallService.toggleMicrophone(this.microphoneEnabled);
  }

  /**
   * Inicia/detiene compartir pantalla
   */
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

  /**
   * Sale de la videollamada
   */
  leaveCall(): void {
    if (this.videoCallService.isJitsiActive()) {
      this.videoCallService.leaveVideoCall();
    }
    this.router.navigate(['/app/dashboard']);
  }

  /**
   * Finaliza la sesión (solo instructor)
   */
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

  /**
   * Alterna la visibilidad de los controles
   */
  toggleControlsVisibility(): void {
    this.showControls = !this.showControls;
  }
  //#endregion

  //#region Private Methods
  /**
   * Se une a la videollamada con reintentos
   * @param config Configuración de videollamada
   */
  private async joinVideoCall(config: IVideoCallConfig): Promise<void> {
    try {
      // Llamar al backend para unirse
      const response = await this.videoCallService.joinVideoCall(config).toPromise();
      
      if (!response) {
        throw new Error('No se recibieron datos de la videollamada');
      }
      
      this.videoCallData = response;

      // Validar permisos de compartir pantalla
      if (this.videoCallData.isModerator) {
        const shareStatus = await this.videoCallService.validateScreenShare(this.sessionId).toPromise();
        this.canShareScreen = shareStatus?.canShareScreen || false;
      }

      // Marcar como conectado PRIMERO para que Angular renderice el contenedor
      this.isConnected = true;
      this.isLoading = false;

      // Esperar a que Angular renderice el DOM
      await this.delay(100);

      // Ahora sí inicializar Jitsi
      const initialized = await this.videoCallService.initializeJitsi('jitsi-container', this.videoCallData);

      if (!initialized) {
        throw new Error('No se pudo inicializar Jitsi');
      }

      this.retryCount = 0;

    } catch (error: any) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Reintento ${this.retryCount}/${this.maxRetries}...`);
        await this.delay(2000);
        await this.joinVideoCall(config);
      } else {
        this.handleError(error);
      }
    }
  }

  /**
   * Inicia compartir pantalla
   */
  private startScreenShare(): void {
    try {
      this.videoCallService.startScreenShare();
      this.isSharing = true;
    } catch (error) {
      console.error('Error al compartir pantalla:', error);
      alert('No se pudo iniciar compartir pantalla. Verifica los permisos del navegador.');
    }
  }

  /**
   * Detiene compartir pantalla
   */
  private stopScreenShare(): void {
    this.videoCallService.stopScreenShare();
    this.isSharing = false;
  }

  /**
   * Maneja errores de la videollamada
   * @param error Error capturado
   */
  private handleError(error: any): void {
    console.error('Error en videollamada:', error);
    
    if (error.status === 401) {
      this.errorMessage = 'Usuario no autenticado. Redirigiendo a login...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } else if (error.status === 400) {
      this.errorMessage = 'Enlace no válido o sesión no disponible';
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'Error al conectar a la videollamada. Intenta de nuevo.';
    }

    this.isLoading = false;
    this.isConnected = false;
  }

  /**
   * Crea un delay
   * @param ms Milisegundos a esperar
   * @returns Promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  //#endregion
}