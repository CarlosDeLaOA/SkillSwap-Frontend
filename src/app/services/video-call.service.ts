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

  
  async initializeJitsi(containerId: string, videoCallData: IVideoCallData): Promise<boolean> {
    try {
      await this.waitForJitsi();

      const container = document.getElementById(containerId);
      if (!container) {
        console.error(' Contenedor no encontrado');
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
          
        
          prejoinPageEnabled: false,
          
          
          disableDeepLinking: true,
          enableNoisyMicDetection: true,
          enableWelcomePage: false,
          enableClosePage: false,
          
          // Permisos
          disableInviteFunctions: !videoCallData.isModerator,
          
         
          doNotStoreRoom: true,
          enableInsecureRoomNameWarning: false,
          disableProfile: true,
          requireDisplayName: false,
          
          remoteVideoMenu: {
            disableKick: !videoCallData.isModerator
          }
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

      console.log('🚀 Creando instancia de Jitsi API...');
      this.jitsiApi = new (window as any).JitsiMeetExternalAPI(videoCallData.domain, options);

      // Event listeners
      this.setupJitsiEventListeners(videoCallData);

      console.log(' Jitsi inicializado exitosamente');
      return true;

    } catch (error) {
      console.error(' Error al inicializar Jitsi:', error);
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

    this.jitsiApi.addListener('participantJoined', (participant: any) => {
      console.log(' Participante se unió:', participant.displayName);
    });

    this.jitsiApi.addListener('participantLeft', (participant: any) => {
      console.log(' Participante salió:', participant.displayName);
    });

    this.jitsiApi.addListener('videoConferenceJoined', (data: any) => {
      console.log(' Unido a videollamada:', data);
    });

    this.jitsiApi.addListener('videoConferenceLeft', (data: any) => {
      console.log(' Salió de videollamada:', data);
      this.leaveVideoCall();
    });

    this.jitsiApi.addListener('screenSharingStatusChanged', (status: any) => {
      console.log(' Estado de compartir pantalla:', status);
    });

    this.jitsiApi.addListener('recordingStatusChanged', (status: any) => {
      console.log('⏺ Estado de grabación:', status);
    });

    this.jitsiApi.addListener('errorOccurred', (error: any) => {
      console.error(' Error en Jitsi:', error);
    });
  }
  //#endregion
}