import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IVideoCallConfig, IVideoCallData, IVideoCallInfo, IScreenShareStatus } from '../interfaces';

/**
 * Servicio para manejar operaciones de videollamadas con Jitsi Meet
 */
@Injectable({
  providedIn: 'root'
})
export class VideoCallService {

  //#region Properties
  private apiUrl = `${environment.apiUrl}/videocall`;
  private jitsiApi: any = null;
  //#endregion

  //#region Constructor
  /**
   * Crea una instancia de VideoCallService
   * @param http HttpClient para peticiones HTTP
   */
  constructor(private http: HttpClient) {
    this.loadJitsiScript();
  }
  //#endregion

  //#region Public Methods - API Calls
  /**
   * Une a un usuario a una videollamada
   * @param config Configuración de videollamada
   * @returns Observable con datos de la videollamada
   */
  joinVideoCall(config: IVideoCallConfig): Observable<IVideoCallData> {
    return this.http.post<any>(`${this.apiUrl}/join`, config).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtiene información de una videollamada
   * @param sessionId ID de la sesión
   * @returns Observable con información de la videollamada
   */
  getVideoCallInfo(sessionId: number): Observable<IVideoCallInfo> {
    return this.http.get<any>(`${this.apiUrl}/info/${sessionId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Valida permisos para compartir pantalla
   * @param sessionId ID de la sesión
   * @returns Observable con estado de validación
   */
  validateScreenShare(sessionId: number): Observable<IScreenShareStatus> {
    return this.http.post<any>(`${this.apiUrl}/validate-screen-share`, { sessionId }).pipe(
      map(response => ({
        canShareScreen: response.canShareScreen,
        isSharing: false,
        personId: response.personId
      }))
    );
  }

  /**
   * Finaliza una videollamada
   * @param sessionId ID de la sesión
   * @returns Observable con confirmación
   */
  endVideoCall(sessionId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/end/${sessionId}`, {});
  }
  //#endregion

  //#region Public Methods - Jitsi Integration
  /**
   * Inicializa Jitsi Meet en un contenedor
   * @param containerId ID del contenedor HTML
   * @param videoCallData Datos de la videollamada
   * @returns Promise<boolean> true si se inicializó correctamente
   */
  async initializeJitsi(containerId: string, videoCallData: IVideoCallData): Promise<boolean> {
    try {
      // Esperar a que el script de Jitsi esté cargado
      await this.waitForJitsi();

      const container = document.getElementById(containerId);
      if (!container) {
        console.error('Contenedor no encontrado');
        return false;
      }

      // Limpiar contenedor
      container.innerHTML = '';

      // Configuración de Jitsi
      const options = this.buildJitsiOptions(container, videoCallData);

      // Inicializar API de Jitsi
      this.jitsiApi = new (window as any).JitsiMeetExternalAPI(videoCallData.domain, options);

      // Configurar event listeners
      this.setupJitsiEventListeners(videoCallData);

      // Configurar controles iniciales
      this.applyInitialControls(videoCallData);

      return true;
    } catch (error) {
      console.error('Error al inicializar Jitsi:', error);
      return false;
    }
  }

  /**
   * Activa/desactiva la cámara
   * @param enabled true para activar, false para desactivar
   */
  toggleCamera(enabled: boolean): void {
    if (this.jitsiApi) {
      if (enabled) {
        this.jitsiApi.executeCommand('toggleVideo');
      } else {
        this.jitsiApi.executeCommand('toggleVideo');
      }
    }
  }

  /**
   * Activa/desactiva el micrófono
   * @param enabled true para activar, false para desactivar
   */
  toggleMicrophone(enabled: boolean): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleAudio');
    }
  }

  /**
   * Inicia compartir pantalla
   */
  startScreenShare(): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleShareScreen');
    }
  }

  /**
   * Detiene compartir pantalla
   */
  stopScreenShare(): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleShareScreen');
    }
  }

  /**
   * Abandona la videollamada
   */
  leaveVideoCall(): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('hangup');
      this.jitsiApi.dispose();
      this.jitsiApi = null;
    }
  }

  /**
   * Verifica si Jitsi está activo
   * @returns true si hay una sesión activa
   */
  isJitsiActive(): boolean {
    return this.jitsiApi !== null;
  }
  //#endregion

  //#region Private Methods
  /**
   * Carga el script de Jitsi Meet
   */
  private loadJitsiScript(): void {
    if (!(window as any).JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }

  /**
   * Espera a que el script de Jitsi esté disponible
   * @returns Promise que se resuelve cuando Jitsi está disponible
   */
  private waitForJitsi(): Promise<void> {
    return new Promise((resolve) => {
      const checkJitsi = () => {
        if ((window as any).JitsiMeetExternalAPI) {
          resolve();
        } else {
          setTimeout(checkJitsi, 100);
        }
      };
      checkJitsi();
    });
  }

  /**
   * Construye las opciones de configuración de Jitsi
   * @param container Contenedor HTML
   * @param videoCallData Datos de la videollamada
   * @returns Opciones de Jitsi
   */
  private buildJitsiOptions(container: HTMLElement, videoCallData: IVideoCallData): any {
    return {
      roomName: videoCallData.roomName,
      width: '100%',
      height: '100%',
      parentNode: container,
      jwt: videoCallData.jitsiToken,
      userInfo: {
        displayName: videoCallData.displayName,
        email: videoCallData.email
      },
      configOverwrite: {
        startWithAudioMuted: !videoCallData.microphoneEnabled,
        startWithVideoMuted: !videoCallData.cameraEnabled,
        disableDeepLinking: true,
        enableNoisyMicDetection: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        remoteVideoMenu: {
          disableKick: !videoCallData.isModerator
        },
        disableInviteFunctions: !videoCallData.isModerator,
        doNotStoreRoom: true,
        enableInsecureRoomNameWarning: false,
        enableLobbyChat: false,
        disableProfile: true
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 
          'camera', 
          'desktop', 
          'fullscreen',
          'fodeviceselection', 
          'hangup',
          'chat',
          'recording',
          'settings',
          'raisehand',
          'videoquality',
          'tileview'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        MOBILE_APP_PROMO: false,
        SHOW_CHROME_EXTENSION_BANNER: false
      }
    };
  }

  /**
   * Configura los event listeners de Jitsi
   * @param videoCallData Datos de la videollamada
   */
  private setupJitsiEventListeners(videoCallData: IVideoCallData): void {
    if (!this.jitsiApi) return;

    // Evento: Usuario se une
    this.jitsiApi.addListener('participantJoined', (participant: any) => {
      console.log('Participante se unió:', participant);
    });

    // Evento: Usuario sale
    this.jitsiApi.addListener('participantLeft', (participant: any) => {
      console.log('Participante salió:', participant);
    });

    // Evento: Videollamada lista
    this.jitsiApi.addListener('videoConferenceJoined', (data: any) => {
      console.log('Unido a videollamada:', data);
    });

    // Evento: Videollamada finalizada
    this.jitsiApi.addListener('videoConferenceLeft', (data: any) => {
      console.log('Salió de videollamada:', data);
      this.leaveVideoCall();
    });

    // Evento: Inicio/fin de compartir pantalla
    this.jitsiApi.addListener('screenSharingStatusChanged', (status: any) => {
      console.log('Estado de compartir pantalla:', status);
    });

    // Evento: Grabación iniciada/detenida
    this.jitsiApi.addListener('recordingStatusChanged', (status: any) => {
      console.log('Estado de grabación:', status);
    });
  }

  /**
   * Aplica los controles iniciales de cámara y micrófono
   * @param videoCallData Datos de la videollamada
   */
  private applyInitialControls(videoCallData: IVideoCallData): void {
    if (!this.jitsiApi) return;

    setTimeout(() => {
      if (!videoCallData.cameraEnabled) {
        this.jitsiApi.executeCommand('toggleVideo');
      }
      if (!videoCallData.microphoneEnabled) {
        this.jitsiApi.executeCommand('toggleAudio');
      }
    }, 1000);
  }
  //#endregion
}