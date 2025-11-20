import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IVideoCallConfig, IVideoCallData, IVideoCallInfo, IScreenShareStatus } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class VideoCallService {

  //#region Properties
  private apiUrl = `${environment.apiUrl}/videocall`;
  private jitsiApi: any = null;
  //#endregion

  constructor(private http: HttpClient) {
    this.loadJitsiScript();
  }

  //#region Public Methods - API Calls
  joinVideoCall(config: IVideoCallConfig): Observable<IVideoCallData> {
    return this.http.post<any>(`${this.apiUrl}/join`, config).pipe(
      map(response => response.data)
    );
  }

  getVideoCallInfo(sessionId: number): Observable<IVideoCallInfo> {
    return this.http.get<any>(`${this.apiUrl}/info/${sessionId}`).pipe(
      map(response => response.data)
    );
  }

  validateScreenShare(sessionId: number): Observable<IScreenShareStatus> {
    return this.http.post<any>(`${this.apiUrl}/validate-screen-share`, { sessionId }).pipe(
      map(response => ({
        canShareScreen: response.canShareScreen,
        isSharing: false,
        personId: response.personId
      }))
    );
  }

  endVideoCall(sessionId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/end/${sessionId}`, {});
  }
  //#endregion

  //#region Jitsi Methods
  async initializeJitsi(containerId: string, videoCallData: IVideoCallData): Promise<boolean> {
    try {
      await this.waitForJitsi();

      const container = document.getElementById(containerId);
      if (!container) {
        console.error('❌ Contenedor no encontrado');
        return false;
      }

      container.innerHTML = '';

      console.log('🎬 Inicializando Jitsi Meet...');
      console.log('   Room:', videoCallData.roomName);
      console.log('   Domain:', videoCallData.domain);
      console.log('   User:', videoCallData.displayName);
      console.log('   Moderator:', videoCallData.isModerator);

      const options = {
        roomName: videoCallData.roomName,
        width: '100%',
        height: '100%',
        parentNode: container,
        
        userInfo: {
          displayName: videoCallData.displayName,
          email: videoCallData.email
        },
        
        configOverwrite: {
          // Audio y video inicial
          startWithAudioMuted: !videoCallData.microphoneEnabled,
          startWithVideoMuted: !videoCallData.cameraEnabled,
          
          // Sin prejoin
          prejoinPageEnabled: false,
          
          // Configuración general
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
          
          // ⭐ BOTONES DEL TOOLBAR (5 botones para ambos roles)
          toolbarButtons: [
            'microphone',      // 1. Micrófono
            'camera',          // 2. Cámara
            'desktop',         // 3. Compartir pantalla
            'raisehand',       // 4. Levantar mano
            'hangup'           // 5. Colgar
          ],
          
          // Permisos diferenciados
          disableInviteFunctions: !videoCallData.isModerator,
          
          // Privacidad
          doNotStoreRoom: true,
          enableInsecureRoomNameWarning: false,
          disableProfile: true,
          requireDisplayName: false,
          
          // Menú de video remoto
          remoteVideoMenu: {
            disableKick: !videoCallData.isModerator,
            disableGrantModerator: !videoCallData.isModerator
          },
          
          // Habilitar botones del lado derecho
          // Nota: Estos botones aparecen en la esquina superior derecha
          buttonsWithNotifyClick: [
            'chat',              // Chat button
            'participants-pane', // Participantes button
            // 'etherpad' puede servir como "upload documents" si lo habilitas
          ]
        },
        
        interfaceConfigOverwrite: {
          // Toolbar siempre visible
          TOOLBAR_ALWAYS_VISIBLE: true,
          TOOLBAR_TIMEOUT: 4000,
          
          // Configuración de botones adicionales (lado derecho)
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera', 
            'desktop',
            'raisehand',
            'hangup',
            'chat',              // Botón de chat (derecha)
            'participants-pane', // Botón de participantes (derecha)
            'etherpad'           // Botón de documentos/notas (derecha)
          ],
          
          // Ocultar elementos innecesarios
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          MOBILE_APP_PROMO: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          HIDE_INVITE_MORE_HEADER: true,
          
          // Desactivar notificaciones molestas
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          DISABLE_PRESENCE_STATUS: false,
          
          // Filmstrip (barra de videos pequeños) - oculto porque usamos sidebar
          FILM_STRIP_MAX_HEIGHT: 0,
          VERTICAL_FILMSTRIP: false,
          
          // Configuración de video
          VIDEO_LAYOUT_FIT: 'contain',
          
          // Configuración de iconos
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          RECENT_LIST_ENABLED: false
        }
      };

      console.log('🚀 Creando instancia de Jitsi API...');
      this.jitsiApi = new (window as any).JitsiMeetExternalAPI(videoCallData.domain, options);

      // Event listeners
      this.setupJitsiEventListeners(videoCallData);

      console.log('✅ Jitsi inicializado exitosamente');
      return true;

    } catch (error) {
      console.error('❌ Error al inicializar Jitsi:', error);
      return false;
    }
  }

  toggleCamera(enabled: boolean): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleVideo');
    }
  }

  toggleMicrophone(enabled: boolean): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleAudio');
    }
  }

  startScreenShare(): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleShareScreen');
    }
  }

  stopScreenShare(): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleShareScreen');
    }
  }

  leaveVideoCall(): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('hangup');
      this.jitsiApi.dispose();
      this.jitsiApi = null;
    }
  }

  isJitsiActive(): boolean {
    return this.jitsiApi !== null;
  }
  //#endregion

  //#region Private Methods
  private loadJitsiScript(): void {
    if (!(window as any).JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }

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

  private setupJitsiEventListeners(videoCallData: IVideoCallData): void {
    if (!this.jitsiApi) return;

    // ⭐ INTERCEPTAR EL BOTÓN DE COLGAR
    this.jitsiApi.addListener('readyToClose', () => {
      console.log('🚪 Usuario intenta colgar');
      
      // Disparar evento personalizado para que el componente lo maneje
      const event = new CustomEvent('jitsi-hangup-clicked', {
        detail: { isModerator: videoCallData.isModerator }
      });
      window.dispatchEvent(event);
    });

    this.jitsiApi.addListener('participantJoined', (participant: any) => {
      console.log('👤 Participante se unió:', participant.displayName);
    });

    this.jitsiApi.addListener('participantLeft', (participant: any) => {
      console.log('👋 Participante salió:', participant.displayName);
    });

    this.jitsiApi.addListener('videoConferenceJoined', (data: any) => {
      console.log('✅ Unido a videollamada:', data);
    });

    this.jitsiApi.addListener('videoConferenceLeft', (data: any) => {
      console.log('👋 Salió de videollamada:', data);
    });

    this.jitsiApi.addListener('screenSharingStatusChanged', (status: any) => {
      console.log('🖥️ Estado de compartir pantalla:', status);
    });

    this.jitsiApi.addListener('recordingStatusChanged', (status: any) => {
      console.log('⏺️ Estado de grabación:', status);
    });

    this.jitsiApi.addListener('errorOccurred', (error: any) => {
      console.error('❌ Error en Jitsi:', error);
    });

    // Listener para botones de toolbar clickeados
    this.jitsiApi.addListener('toolbarButtonClicked', (data: any) => {
      console.log('🔘 Botón clickeado:', data);
      
      // Si es el botón de colgar
      if (data.key === 'hangup') {
        if (videoCallData.isModerator) {
          // Prevenir el hangup por defecto y mostrar modal
          const event = new CustomEvent('jitsi-hangup-clicked', {
            detail: { isModerator: true }
          });
          window.dispatchEvent(event);
        }
      }
    });

    // Listeners para los botones del lado derecho
    this.jitsiApi.addListener('chatUpdated', (data: any) => {
      console.log('💬 Chat actualizado:', data);
    });

    this.jitsiApi.addListener('participantsPaneToggled', (data: any) => {
      console.log('👥 Panel de participantes toggled:', data);
    });
  }
  //#endregion
}