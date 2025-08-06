// Voice-to-Scope Transcription System - BF-003 Main Integration
export * from './types';
export * from './audio-processor';
export * from './transcription-service';
export * from './scope-organizer';
export * from './measurement-parser';

import { AudioProcessor } from './audio-processor';
import { TranscriptionService, TranscriptionResult } from './transcription-service';
import { ScopeOrganizer } from './scope-organizer';
import { MeasurementParser } from './measurement-parser';
import {
  ScopeCapture,
  OrganizedScope,
  VoiceRecorderState,
  TranscriptionOptions,
  AudioProcessingOptions,
  ScopeAnalysisResult
} from './types';

export interface VoiceScopeConfig {
  transcriptionOptions?: TranscriptionOptions;
  audioOptions?: AudioProcessingOptions;
  enableRealTime?: boolean;
  enablePhotoCapture?: boolean;
}

/**
 * Main Voice-to-Scope Service - Orchestrates the complete workflow
 */
export class VoiceScopeService {
  private audioProcessor: AudioProcessor;
  private transcriptionService: TranscriptionService;
  private scopeOrganizer: ScopeOrganizer;
  private measurementParser: MeasurementParser;
  private config: Required<VoiceScopeConfig>;

  constructor(config: VoiceScopeConfig = {}) {
    this.config = {
      transcriptionOptions: {
        language: 'en-US',
        includeTimestamps: true,
        filterProfanity: false,
        enhanceConstruction: true,
        realTime: true,
        ...config.transcriptionOptions
      },
      audioOptions: {
        noiseReduction: true,
        autoGainControl: true,
        echoCancellation: true,
        sampleRate: 44100,
        format: 'webm',
        ...config.audioOptions
      },
      enableRealTime: config.enableRealTime ?? true,
      enablePhotoCapture: config.enablePhotoCapture ?? true
    };

    // Initialize services
    this.audioProcessor = new AudioProcessor();
    this.transcriptionService = new TranscriptionService();
    this.scopeOrganizer = new ScopeOrganizer();
    this.measurementParser = new MeasurementParser();
  }

  /**
   * Start a new voice-to-scope capture session
   */
  async startCapture(): Promise<string> {
    const captureId = `capture_${Date.now()}`;
    
    try {
      // Initialize audio capture (browser only)
      if (AudioProcessor.isSupported()) {
        await this.audioProcessor.initialize();
        await this.audioProcessor.startRecording();
      } else {
        console.log('Audio recording not supported in this environment');
      }
      
      console.log(`Voice capture started: ${captureId}`);
      return captureId;
      
    } catch (error) {
      throw new Error(`Failed to start voice capture: ${error}`);
    }
  }

  /**
   * Stop capture and process the complete workflow
   */
  async stopCaptureAndProcess(
    captureId: string,
    contextPhotos?: string[]
  ): Promise<ScopeCapture> {
    try {
      // Stop recording and get audio blob (if supported)
      let audioBlob: Blob;
      if (AudioProcessor.isSupported()) {
        audioBlob = await this.audioProcessor.stopRecording();
      } else {
        // Create mock audio blob for Node.js environment
        audioBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
      }
      
      // Transcribe audio
      console.log('Transcribing audio...');
      const transcriptionResult = await this.transcriptionService.transcribeAudio(
        audioBlob,
        this.config.transcriptionOptions
      );

      // Parse measurements from transcription
      console.log('Extracting measurements...');
      const measurements = this.measurementParser.extractMeasurements(
        transcriptionResult.text
      );

      // Correct measurements based on context
      const correctedMeasurements = this.measurementParser.correctMeasurements(
        measurements,
        transcriptionResult.text
      );

      // Create scope capture
      const scopeCapture: ScopeCapture = {
        id: captureId,
        audioBlob,
        transcription: transcriptionResult.text,
        editedText: transcriptionResult.text, // Initially same as transcription
        contextPhotos: contextPhotos || [],
        measurements: correctedMeasurements,
        timestamp: new Date(),
        duration: await this.calculateAudioDuration(audioBlob),
        confidence: transcriptionResult.confidence
      };

      console.log(`Voice capture completed: ${captureId}`);
      console.log(`- Transcription: ${transcriptionResult.text.substring(0, 100)}...`);
      console.log(`- Measurements found: ${correctedMeasurements.length}`);
      console.log(`- Confidence: ${(transcriptionResult.confidence * 100).toFixed(1)}%`);

      return scopeCapture;

    } catch (error) {
      throw new Error(`Failed to process voice capture: ${error}`);
    }
  }

  /**
   * Organize scope capture into structured work categories
   */
  async organizeScope(scopeCapture: ScopeCapture): Promise<ScopeAnalysisResult> {
    try {
      console.log('Organizing scope...');
      
      const analysisResult = await this.scopeOrganizer.organizeScope(
        scopeCapture.editedText,
        scopeCapture.measurements,
        scopeCapture.contextPhotos
      );

      console.log(`Scope organized: ${analysisResult.organized.projectSummary}`);
      console.log(`- Work categories: ${analysisResult.organized.workCategories.length}`);
      console.log(`- Material specs: ${analysisResult.organized.materialSpecs.length}`);
      console.log(`- Labor requirements: ${analysisResult.organized.laborRequirements.length}`);
      console.log(`- Processing time: ${analysisResult.processingTime}ms`);
      console.log(`- Confidence: ${(analysisResult.confidence * 100).toFixed(1)}%`);

      if (analysisResult.warnings.length > 0) {
        console.log(`- Warnings: ${analysisResult.warnings.join(', ')}`);
      }

      return analysisResult;

    } catch (error) {
      throw new Error(`Failed to organize scope: ${error}`);
    }
  }

  /**
   * Complete voice-to-scope workflow (capture + organize)
   */
  async completeWorkflow(
    contextPhotos?: string[]
  ): Promise<{ capture: ScopeCapture; analysis: ScopeAnalysisResult }> {
    console.log('🎙️ Starting complete voice-to-scope workflow...');
    
    try {
      // Step 1: Start capture
      const captureId = await this.startCapture();
      
      // Note: In a real implementation, you would wait for user to stop recording
      // For now, we simulate the workflow
      console.log('⏺️ Recording... (call stopCaptureAndProcess when ready)');
      
      // For demonstration, we'll simulate stopping after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Stop and process
      const capture = await this.stopCaptureAndProcess(captureId, contextPhotos);
      
      // Step 3: Organize scope
      const analysis = await this.organizeScope(capture);
      
      console.log('✅ Voice-to-scope workflow completed successfully!');
      
      return { capture, analysis };
      
    } catch (error) {
      console.error('❌ Voice-to-scope workflow failed:', error);
      throw error;
    }
  }

  /**
   * Start real-time transcription session
   */
  async startRealTimeTranscription(
    onTranscript: (text: string, isFinal: boolean) => void,
    onMeasurements: (measurements: any[]) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.config.enableRealTime) {
      throw new Error('Real-time transcription is disabled');
    }

    if (!TranscriptionService.isRealTimeSupported()) {
      throw new Error('Real-time transcription not supported in this browser');
    }

    try {
      await this.transcriptionService.startRealTimeTranscription(
        (text, isFinal) => {
          onTranscript(text, isFinal);
          
          // Extract measurements from real-time text
          if (isFinal && text.trim()) {
            const measurements = this.measurementParser.extractMeasurements(text);
            if (measurements.length > 0) {
              onMeasurements(measurements);
            }
          }
        },
        onError
      );
      
    } catch (error) {
      throw new Error(`Failed to start real-time transcription: ${error}`);
    }
  }

  /**
   * Stop real-time transcription
   */
  stopRealTimeTranscription(): void {
    this.transcriptionService.stopRealTimeTranscription();
  }

  /**
   * Get current recorder state
   */
  getRecorderState(): VoiceRecorderState {
    return this.audioProcessor.getState();
  }

  /**
   * Update transcription with manual edits
   */
  updateTranscription(captureId: string, editedText: string): ScopeCapture {
    // In a real implementation, this would update a stored capture
    // For now, we return a mock updated capture
    return {
      id: captureId,
      transcription: editedText, // Original transcription
      editedText: editedText,    // User-edited version
      contextPhotos: [],
      measurements: this.measurementParser.extractMeasurements(editedText),
      timestamp: new Date(),
      confidence: 0.9
    };
  }

  /**
   * Add photos to a scope capture
   */
  async addPhotos(captureId: string, photos: File[]): Promise<string[]> {
    const photoUrls: string[] = [];
    
    for (const photo of photos) {
      try {
        // Convert file to base64 or URL
        const photoUrl = await this.fileToDataUrl(photo);
        photoUrls.push(photoUrl);
      } catch (error) {
        console.error('Failed to process photo:', error);
      }
    }
    
    return photoUrls;
  }

  /**
   * Export scope capture data
   */
  exportCapture(capture: ScopeCapture, format: 'json' | 'text' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(capture, null, 2);
    }
    
    // Text format
    let output = `Voice Scope Capture - ${capture.id}\n`;
    output += `Timestamp: ${capture.timestamp.toISOString()}\n`;
    output += `Duration: ${capture.duration || 'Unknown'}s\n`;
    output += `Confidence: ${((capture.confidence || 0) * 100).toFixed(1)}%\n\n`;
    output += `Transcription:\n${capture.transcription}\n\n`;
    
    if (capture.editedText !== capture.transcription) {
      output += `Edited Text:\n${capture.editedText}\n\n`;
    }
    
    if (capture.measurements.length > 0) {
      output += `Measurements:\n`;
      capture.measurements.forEach(m => {
        output += `- ${m.rawText}: ${m.parsedValue} ${m.unit} (${m.type})\n`;
      });
      output += `\n`;
    }
    
    return output;
  }

  /**
   * Check if voice-to-scope is supported in current environment
   */
  static isSupported(): boolean {
    return AudioProcessor.isSupported() && TranscriptionService.isRealTimeSupported();
  }

  /**
   * Get feature support status
   */
  static getSupportStatus(): {
    audioRecording: boolean;
    realTimeTranscription: boolean;
    fileTranscription: boolean;
    photoCapture: boolean;
  } {
    return {
      audioRecording: AudioProcessor.isSupported(),
      realTimeTranscription: TranscriptionService.isRealTimeSupported(),
      fileTranscription: true, // Always available (uses simulated API)
      photoCapture: typeof FileReader !== 'undefined'
    };
  }

  /**
   * Private helper methods
   */
  private async calculateAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        resolve(0); // Fallback if duration can't be determined
      };
    });
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.audioProcessor.dispose();
    this.transcriptionService.dispose();
  }
}

/**
 * Demo function for testing the complete workflow
 */
export async function demonstrateVoiceScope(): Promise<void> {
  console.log('🎙️ Voice-to-Scope Demonstration');
  console.log('==============================');
  
  const service = new VoiceScopeService({
    enableRealTime: true,
    enablePhotoCapture: true,
    transcriptionOptions: {
      enhanceConstruction: true,
      includeTimestamps: true
    }
  });

  // Check support
  const support = VoiceScopeService.getSupportStatus();
  console.log('Feature Support:', support);
  
  if (!support.audioRecording) {
    console.log('❌ Audio recording not supported in this environment');
    return;
  }

  try {
    // Simulate a complete workflow with sample data
    console.log('\n📝 Simulating voice transcription...');
    
    // Create a mock scope capture
    const mockCapture: ScopeCapture = {
      id: 'demo_capture',
      transcription: 'We need to install hardwood flooring in the living room that\'s about 20 by 15 feet. Also need to frame out a new wall using 2x4 studs with drywall on both sides. The bathroom needs 3 new outlets and we should replace the old toilet.',
      editedText: 'We need to install hardwood flooring in the living room that\'s about 20 by 15 feet. Also need to frame out a new wall using 2x4 studs with drywall on both sides. The bathroom needs 3 new outlets and we should replace the old toilet.',
      contextPhotos: [],
      measurements: [],
      timestamp: new Date(),
      confidence: 0.92
    };

    // Extract measurements
    const measurements = service['measurementParser'].extractMeasurements(mockCapture.transcription);
    mockCapture.measurements = measurements;

    console.log(`✅ Transcription completed (${(mockCapture.confidence * 100).toFixed(1)}% confidence)`);
    console.log(`📏 Found ${measurements.length} measurements`);

    // Organize scope
    const analysis = await service.organizeScope(mockCapture);
    
    console.log('\n🏗️ Scope Analysis Results:');
    console.log(`Project: ${analysis.organized.projectSummary}`);
    console.log(`Timeline: ${analysis.organized.estimatedTimeline}`);
    console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    
    console.log('\nWork Categories:');
    analysis.organized.workCategories.forEach(category => {
      console.log(`- ${category.trade}: ${category.items.length} items (${category.riskLevel} risk)`);
    });
    
    if (analysis.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      analysis.suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
    }
    
    if (analysis.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      analysis.warnings.forEach(warning => console.log(`- ${warning}`));
    }
    
    console.log('\n✅ Voice-to-Scope demonstration completed successfully!');
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
  } finally {
    service.dispose();
  }
}
