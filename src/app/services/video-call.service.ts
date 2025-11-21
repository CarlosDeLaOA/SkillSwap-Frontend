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
  public jitsiApi: any = null;
  
  // Propiedades para grabación nativa
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStream: MediaStream | null = null;
  private userMicStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
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

  startRecording(sessionId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recording/start/${sessionId}`, {});
  }

  stopRecording(sessionId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recording/stop/${sessionId}`, {});
  }

  getRecordingStatus(sessionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recording/status/${sessionId}`);
  }

  clearRecording(sessionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/recording/clear/${sessionId}`);
  }

  uploadJitsiRecording(sessionId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('📤 Subiendo grabación de Jitsi...');
    console.log('   Archivo:', file.name);
    console.log('   Tamaño:', this.formatBytes(file.size));
    
    return this.http.post<any>(
      `${this.apiUrl}/recording/upload-jitsi-file/${sessionId}`,
      formData
    );
  }
  //#endregion

  //#region Native Browser Recording (MediaRecorder API)
  
  /**
   * ⭐ SOLUCIÓN FINAL: Captura audio directo de Jitsi + Micrófono del usuario
   */
  async startNativeAudioRecording(sessionId: number): Promise<boolean> {
    try {
      console.log('========================================');
      console.log('🎙️ INICIANDO GRABACIÓN DE AUDIO');
      console.log('   Método: Audio directo de Jitsi + Micrófono');
      console.log('========================================');

      // ⭐ PASO 1: Obtener audio de Jitsi (remoto)
      const jitsiAudioTracks = await this.getJitsiAudioTracks();
      
      // ⭐ PASO 2: Capturar micrófono del usuario (local)
      this.userMicStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        }
      });

      console.log('✅ Micrófono del usuario capturado');
      console.log('   Tracks:', this.userMicStream.getAudioTracks().length);

      // ⭐ PASO 3: Combinar audio de Jitsi + Micrófono
      this.audioContext = new AudioContext({ sampleRate: 48000 });
      const destination = this.audioContext.createMediaStreamDestination();

      // Añadir audio remoto de Jitsi
      if (jitsiAudioTracks.length > 0) {
        const jitsiStream = new MediaStream(jitsiAudioTracks);
        const jitsiSource = this.audioContext.createMediaStreamSource(jitsiStream);
        jitsiSource.connect(destination);
        console.log('✅ Audio remoto de Jitsi conectado');
      } else {
        console.warn('⚠️ No se detectó audio remoto de Jitsi');
      }

      // Añadir micrófono local
      const micSource = this.audioContext.createMediaStreamSource(this.userMicStream);
      micSource.connect(destination);
      console.log('✅ Micrófono local conectado');

      // Stream combinado
      this.recordingStream = destination.stream;

      const audioTracks = this.recordingStream.getAudioTracks();
      console.log('📊 Stream final:');
      console.log('   Audio tracks:', audioTracks.length);

      if (audioTracks.length === 0) {
        throw new Error('No se pudo crear el stream de audio combinado');
      }

      audioTracks.forEach((track: MediaStreamTrack, index: number) => {
        console.log(`   Track ${index}:`, {
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        });
      });

      // ⭐ PASO 4: Configurar MediaRecorder
      const mimeType = this.getBestAudioMimeType();
      console.log('🎵 Configurando MediaRecorder');
      console.log('   MIME Type:', mimeType);
      console.log('   Bitrate: 128 kbps');

      this.mediaRecorder = new MediaRecorder(this.recordingStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      this.audioChunks = [];

      // ⭐ EVENTOS
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('📦 Chunk recibido:', this.formatBytes(event.data.size));
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('⏹️ MediaRecorder detenido');
        console.log('   Total chunks:', this.audioChunks.length);
        
        // Detener todos los tracks
        if (this.recordingStream) {
          this.recordingStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.userMicStream) {
          this.userMicStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
          await this.audioContext.close();
        }
        
        await this.processRecordedAudio(sessionId);
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('❌ Error en MediaRecorder:', error);
      };

      this.mediaRecorder.onstart = () => {
        console.log('▶️ MediaRecorder iniciado');
        console.log('   Estado:', this.mediaRecorder?.state);
      };

      // ⭐ PASO 5: Iniciar grabación
      this.mediaRecorder.start(1000); // Capturar cada segundo

      console.log('========================================');
      console.log('✅ GRABACIÓN INICIADA EXITOSAMENTE');
      console.log('   Estado:', this.mediaRecorder.state);
      console.log('========================================');

      return true;

    } catch (error: any) {
      console.error('❌ ERROR AL INICIAR GRABACIÓN:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('❌ Permiso denegado.\n\nDebes permitir el uso del micrófono.');
      } else if (error.name === 'NotFoundError') {
        alert('❌ No se encontró dispositivo de audio.');
      } else {
        alert('❌ Error: ' + error.message);
      }
      
      return false;
    }
  }

  /**
   * ⭐ Obtiene los tracks de audio remotos de Jitsi
   */
  private async getJitsiAudioTracks(): Promise<MediaStreamTrack[]> {
    try {
      const audioTracks: MediaStreamTrack[] = [];
      
      if (!this.jitsiApi) {
        console.warn('⚠️ Jitsi API no disponible');
        return audioTracks;
      }

      // Obtener todos los participantes remotos
      const participants = await this.jitsiApi.getParticipantsInfo();
      
      console.log('👥 Participantes en Jitsi:', participants.length);

      // Obtener video containers de Jitsi
      const videoContainers = document.querySelectorAll('video');
      
      videoContainers.forEach((video: HTMLVideoElement) => {
        if (video.srcObject && video.srcObject instanceof MediaStream) {
          const stream = video.srcObject as MediaStream;
          const tracks = stream.getAudioTracks();
          
          tracks.forEach(track => {
            if (!audioTracks.find(t => t.id === track.id)) {
              audioTracks.push(track);
              console.log('🎤 Audio track encontrado:', track.label || track.id);
            }
          });
        }
      });

      return audioTracks;

    } catch (error) {
      console.error('⚠️ Error al obtener audio de Jitsi:', error);
      return [];
    }
  }

  /**
   * Obtiene el mejor MIME type para audio
   */
  private getBestAudioMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('✅ MIME type soportado:', type);
        return type;
      }
    }

    console.warn('⚠️ Usando MIME type por defecto');
    return 'audio/webm';
  }

  /**
   * Detiene la grabación
   */
  stopNativeAudioRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      console.log('========================================');
      console.log('⏹️ DETENIENDO GRABACIÓN');
      console.log('   Estado actual:', this.mediaRecorder.state);
      console.log('   Chunks capturados:', this.audioChunks.length);
      console.log('========================================');
      
      this.mediaRecorder.stop();
    } else {
      console.log('ℹ️ MediaRecorder ya está inactivo');
    }
  }

  /**
   * Procesa el audio grabado
   */
  private async processRecordedAudio(sessionId: number): Promise<void> {
    try {
      console.log('========================================');
      console.log('🔄 PROCESANDO AUDIO GRABADO');
      console.log('   Chunks totales:', this.audioChunks.length);
      
      if (this.audioChunks.length === 0) {
        console.error('❌ No hay chunks de audio');
        alert('❌ Error: No se capturó audio.\n\nAsegúrate de tener el micrófono encendido.');
        return;
      }

      const totalSize = this.audioChunks.reduce((acc, chunk) => acc + chunk.size, 0);
      console.log('📊 Tamaño total:', this.formatBytes(totalSize));

      if (totalSize < 10240) {
        console.error('⚠️ Archivo muy pequeño, probablemente no tiene audio');
        alert('⚠️ Advertencia: El archivo es muy pequeño.\n\nPosiblemente no se capturó audio.');
      }

      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      
      console.log('📦 Blob creado:');
      console.log('   Tipo:', audioBlob.type);
      console.log('   Tamaño:', this.formatBytes(audioBlob.size));

      const extension = mimeType.includes('webm') ? 'webm' : 'ogg';
      const fileName = `session_${sessionId}_${Date.now()}.${extension}`;
      const audioFile = new File([audioBlob], fileName, { type: mimeType });

      console.log('📤 Subiendo al servidor...');
      console.log('   Nombre:', fileName);
      
      await this.uploadRecordingToBackend(sessionId, audioFile);

      console.log('✅ AUDIO PROCESADO Y SUBIDO');
      console.log('========================================');

      this.audioChunks = [];
      this.mediaRecorder = null;
      this.recordingStream = null;
      this.userMicStream = null;
      this.audioContext = null;

    } catch (error) {
      console.error('❌ Error al procesar audio:', error);
      alert('❌ Error al procesar la grabación: ' + error);
    }
  }

  /**
   * Sube al backend
   */
  private async uploadRecordingToBackend(sessionId: number, audioFile: File): Promise<void> {
    try {
      console.log('📤 Preparando subida...');
      
      const formData = new FormData();
      formData.append('audio', audioFile);

      console.log('🌐 Enviando al backend...');
      console.log('   Endpoint: /recording/upload/' + sessionId);
      console.log('   Archivo:', audioFile.name);
      console.log('   Tamaño:', this.formatBytes(audioFile.size));

      const response = await this.http.post<any>(
        `${this.apiUrl}/recording/upload/${sessionId}`, 
        formData
      ).toPromise();

      console.log('✅ Respuesta del servidor:', response);
      
      if (response.success) {
        alert('✅ Grabación guardada exitosamente!\n\n' + 
              'Se está convirtiendo a MP3...');
      }

    } catch (error: any) {
      console.error('❌ Error al subir:', error);
      alert('❌ Error al subir la grabación:\n\n' + 
            (error.error?.message || error.message));
      throw error;
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
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
          startWithAudioMuted: !videoCallData.microphoneEnabled,
          startWithVideoMuted: !videoCallData.cameraEnabled,
          fileRecordingsEnabled: true,
          liveStreamingEnabled: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableClosePage: false,
          disable1On1Mode: true,
          
          filmstrip: {
            disabled: true
          },
          disableFilmstripAutohiding: true,
          
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'raisehand', 'hangup'
          ],
          disableInviteFunctions: !videoCallData.isModerator,
          doNotStoreRoom: true,
          enableInsecureRoomNameWarning: false,
          disableProfile: true,
          requireDisplayName: false,
          remoteVideoMenu: {
            disableKick: !videoCallData.isModerator,
            disableGrantModerator: !videoCallData.isModerator
          },
          buttonsWithNotifyClick: ['chat', 'participants-pane']
        },
        
        interfaceConfigOverwrite: {
          TOOLBAR_ALWAYS_VISIBLE: true,
          TOOLBAR_TIMEOUT: 4000,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'desktop', 'raisehand', 'hangup', 'chat', 'participants-pane'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          
          FILM_STRIP_MAX_HEIGHT: 0,
          VERTICAL_FILMSTRIP: false,
          DISABLE_VIDEO_BACKGROUND: false,
          VIDEO_LAYOUT_FIT: 'both',
          
          filmStripOnly: false,
          REMOTE_THUMBNAIL_RATIO: 0,
          LOCAL_THUMBNAIL_RATIO: 0
        }
      };

      this.jitsiApi = new (window as any).JitsiMeetExternalAPI(videoCallData.domain, options);
      this.setupJitsiEventListeners(videoCallData);

      setTimeout(() => {
        this.injectFilmstripHideCSS();
      }, 500);

      console.log('✅ Jitsi inicializado');
      return true;

    } catch (error) {
      console.error('❌ Error al inicializar Jitsi:', error);
      return false;
    }
  }

  private injectFilmstripHideCSS(): void {
    console.log('💉 Inyectando CSS para ocultar filmstrip...');
    
    const style = document.createElement('style');
    style.id = 'jitsi-filmstrip-hide';
    style.innerHTML = `
      #jitsi-container .filmstrip,
      #jitsi-container .vertical-filmstrip,
      #jitsi-container .horizontal-filmstrip,
      #jitsi-container .filmstrip__videos,
      #jitsi-container .remote-videos-container,
      #jitsi-container .filmstrip-wrapper,
      #jitsi-container .filmstrip-videos,
      #jitsi-container #remoteVideos,
      #jitsi-container #filmstripRemoteVideos,
      #jitsi-container #filmstripRemoteVideosContainer,
      #jitsi-container .filmstrip-remote-videos,
      #jitsi-container .filmstrip-local-video,
      #jitsi-container .filmstrip__videos__container,
      #jitsi-container .videocontainer,
      #jitsi-container .videocontainer__background,
      #jitsi-container .videocontainer__toolbar,
      #jitsi-container .videocontainer__toptoolbar,
      #jitsi-container .thumb-container,
      #jitsi-container .remote-video,
      #jitsi-container .remote-video-container,
      #jitsi-container [class*="filmstrip"],
      #jitsi-container [id*="filmstrip"],
      #jitsi-container [class*="Filmstrip"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
      }
      
      #jitsi-container .large-video-container,
      #jitsi-container #largeVideoContainer {
        width: 100% !important;
        height: 100% !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log('✅ CSS inyectado');
    
    this.forceHideFilmstripElements();
  }

  private forceHideFilmstripElements(): void {
    const hideElements = () => {
      const selectors = [
        '.filmstrip',
        '.vertical-filmstrip',
        '.horizontal-filmstrip',
        '.filmstrip__videos',
        '.remote-videos-container',
        '.filmstrip-wrapper',
        '#remoteVideos',
        '#filmstripRemoteVideos',
        '.videocontainer',
        '[class*="filmstrip"]',
        '[id*="filmstrip"]'
      ];

      let hiddenCount = 0;
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.cssText = `
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
            position: absolute !important;
            left: -9999px !important;
          `;
          hiddenCount++;
        });
      });
      
      if (hiddenCount > 0) {
        console.log(`🔒 ${hiddenCount} elementos de filmstrip ocultados`);
      }
    };

    hideElements();
    setTimeout(hideElements, 500);
    setTimeout(hideElements, 1000);
    setTimeout(hideElements, 2000);
    setTimeout(hideElements, 3000);

    const observer = new MutationObserver(hideElements);
    const jitsiContainer = document.getElementById('jitsi-container');
    if (jitsiContainer) {
      observer.observe(jitsiContainer, {
        childList: true,
        subtree: true,
        attributes: true
      });
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

    this.jitsiApi.addListener('readyToClose', () => {
      const event = new CustomEvent('jitsi-hangup-clicked', {
        detail: { isModerator: videoCallData.isModerator }
      });
      window.dispatchEvent(event);
    });

    this.jitsiApi.addListener('toolbarButtonClicked', (data: any) => {
      if (data.key === 'hangup' && videoCallData.isModerator) {
        const event = new CustomEvent('jitsi-hangup-clicked', {
          detail: { isModerator: true }
        });
        window.dispatchEvent(event);
      }
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  //#endregion
}