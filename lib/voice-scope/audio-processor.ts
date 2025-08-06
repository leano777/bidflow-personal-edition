// Audio Processing and Recording - BF-003 Implementation

import { VoiceRecorderState, AudioProcessingOptions, ScopeCapture } from './types';

export class AudioProcessor {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private startTime: number = 0;
  private state: VoiceRecorderState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  };

  private options: AudioProcessingOptions = {
    noiseReduction: true,
    autoGainControl: true,
    echoCancellation: true,
    sampleRate: 44100,
    format: 'webm'
  };

  constructor(options?: Partial<AudioProcessingOptions>) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Initialize audio recording with enhanced settings for construction sites
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone access with construction-optimized settings
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: this.options.echoCancellation,
          noiseSuppression: this.options.noiseReduction,
          autoGainControl: this.options.autoGainControl,
          sampleRate: this.options.sampleRate,
          channelCount: 1, // Mono for better speech recognition
          // Enhanced settings for noisy environments
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true
        } as any
      };

      this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Setup audio context for real-time analysis
      this.setupAudioContext();
      
      // Configure MediaRecorder with optimal settings
      this.setupMediaRecorder();

      console.log('Audio processor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw new Error(`Audio initialization failed: ${error}`);
    }
  }

  /**
   * Setup audio context for real-time audio analysis
   */
  private setupAudioContext(): void {
    if (!this.audioStream) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      
      // Create analyser for audio level monitoring
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      
      // Connect nodes
      source.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      
      // Start audio level monitoring
      this.startAudioLevelMonitoring();
      
    } catch (error) {
      console.error('Failed to setup audio context:', error);
    }
  }

  /**
   * Setup MediaRecorder with optimal codec settings
   */
  private setupMediaRecorder(): void {
    if (!this.audioStream) return;

    try {
      // Determine best available codec
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported audio codec found');
      }

      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000 // Good quality for speech
      });

      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        // Will be handled by stopRecording()
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.state.error = 'Recording error occurred';
      };

      console.log('MediaRecorder setup complete with:', selectedMimeType);
    } catch (error) {
      console.error('Failed to setup MediaRecorder:', error);
      throw error;
    }
  }

  /**
   * Start audio level monitoring for visual feedback
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAudioLevel = () => {
      if (!this.analyser || this.state.error) return;

      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      
      // Convert to percentage (0-100)
      this.state.audioLevel = Math.min(100, (rms / 255) * 100);
      
      // Continue monitoring if recording
      if (this.state.isRecording || this.state.isPaused) {
        requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    if (!this.mediaRecorder) {
      throw new Error('Audio processor not initialized');
    }

    if (this.state.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      this.audioChunks = [];
      this.startTime = Date.now();
      
      this.mediaRecorder.start(1000); // Collect data every 1 second
      
      this.state = {
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioLevel: 0,
        error: undefined
      };

      // Start duration tracking
      this.startDurationTracking();
      
      // Resume audio level monitoring
      this.startAudioLevelMonitoring();

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.state.error = `Failed to start recording: ${error}`;
      throw error;
    }
  }

  /**
   * Pause recording (if supported)
   */
  pauseRecording(): void {
    if (!this.mediaRecorder || !this.state.isRecording) {
      throw new Error('No active recording to pause');
    }

    try {
      if (this.mediaRecorder.state === 'recording' && typeof this.mediaRecorder.pause === 'function') {
        this.mediaRecorder.pause();
        this.state.isPaused = true;
        console.log('Recording paused');
      } else {
        console.warn('Pause not supported by this browser');
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
      this.state.error = `Failed to pause recording: ${error}`;
    }
  }

  /**
   * Resume recording (if supported)
   */
  resumeRecording(): void {
    if (!this.mediaRecorder || !this.state.isPaused) {
      throw new Error('No paused recording to resume');
    }

    try {
      if (typeof this.mediaRecorder.resume === 'function') {
        this.mediaRecorder.resume();
        this.state.isPaused = false;
        this.startAudioLevelMonitoring();
        console.log('Recording resumed');
      } else {
        console.warn('Resume not supported by this browser');
      }
    } catch (error) {
      console.error('Failed to resume recording:', error);
      this.state.error = `Failed to resume recording: ${error}`;
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    if (!this.mediaRecorder || !this.state.isRecording) {
      throw new Error('No active recording to stop');
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not available'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder?.mimeType || 'audio/webm' 
          });
          
          this.state = {
            isRecording: false,
            isPaused: false,
            duration: this.state.duration,
            audioLevel: 0,
            error: undefined
          };

          console.log('Recording stopped, blob size:', audioBlob.size);
          resolve(audioBlob);
        } catch (error) {
          console.error('Failed to create audio blob:', error);
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Start tracking recording duration
   */
  private startDurationTracking(): void {
    const updateDuration = () => {
      if (this.state.isRecording && !this.state.isPaused) {
        this.state.duration = (Date.now() - this.startTime) / 1000; // Convert to seconds
        setTimeout(updateDuration, 100); // Update every 100ms
      }
    };
    updateDuration();
  }

  /**
   * Get current recorder state
   */
  getState(): VoiceRecorderState {
    return { ...this.state };
  }

  /**
   * Apply noise reduction to audio blob (if available)
   */
  async processAudioBlob(audioBlob: Blob): Promise<Blob> {
    // For now, return the original blob
    // In a production environment, you might want to:
    // 1. Convert to AudioBuffer
    // 2. Apply noise reduction algorithms
    // 3. Normalize audio levels
    // 4. Apply construction-site specific filtering
    
    console.log('Processing audio blob (passthrough for now):', audioBlob.size);
    return audioBlob;
  }

  /**
   * Create a ScopeCapture from recorded audio
   */
  async createScopeCapture(audioBlob: Blob, additionalData?: Partial<ScopeCapture>): Promise<ScopeCapture> {
    const processedBlob = await this.processAudioBlob(audioBlob);
    
    return {
      id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      audioBlob: processedBlob,
      transcription: '', // Will be filled by transcription service
      editedText: '',
      contextPhotos: [],
      measurements: [],
      timestamp: new Date(),
      duration: this.state.duration,
      confidence: 0,
      ...additionalData
    };
  }

  /**
   * Check if browser supports audio recording
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false; // Node.js environment
    }
    return !!(navigator.mediaDevices && 
             navigator.mediaDevices.getUserMedia && 
             window.MediaRecorder);
  }

  /**
   * Get available audio input devices
   */
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    try {
      if (this.mediaRecorder && this.state.isRecording) {
        this.mediaRecorder.stop();
      }
      
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
        this.audioStream = null;
      }
      
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      this.analyser = null;
      this.gainNode = null;
      this.mediaRecorder = null;
      
      console.log('Audio processor disposed');
    } catch (error) {
      console.error('Error during audio processor disposal:', error);
    }
  }
}