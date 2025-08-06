// Speech-to-Text Transcription Service - BF-003 Implementation

import { 
  ScopeCapture, 
  TranscriptionOptions, 
  ConstructionTerminology, 
  DEFAULT_CONSTRUCTION_TERMS,
  VoiceMeasurement 
} from './types';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  segments?: TranscriptionSegment[];
  measurements: VoiceMeasurement[];
  corrections: TranscriptionCorrection[];
}

export interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface TranscriptionCorrection {
  original: string;
  corrected: string;
  reason: string;
  confidence: number;
}

export class TranscriptionService {
  private constructionTerms: ConstructionTerminology;
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;

  constructor(customTerms?: Partial<ConstructionTerminology>) {
    this.constructionTerms = {
      ...DEFAULT_CONSTRUCTION_TERMS,
      ...customTerms
    };
    
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize Web Speech API for real-time transcription
   */
  private initializeSpeechRecognition(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Running in Node.js environment - speech recognition not available');
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      // Enhanced settings for construction environments
      this.recognition.maxAlternatives = 3;
    }
  }

  /**
   * Start real-time speech recognition
   */
  async startRealTimeTranscription(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not available');
    }

    if (this.isListening) {
      throw new Error('Already listening');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not initialized'));
        return;
      }

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Apply construction terminology corrections
        const correctedFinal = this.applyConstructionCorrections(finalTranscript);
        const correctedInterim = this.applyConstructionCorrections(interimTranscript);

        if (finalTranscript) {
          onResult(correctedFinal, true);
        } else if (interimTranscript) {
          onResult(correctedInterim, false);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        const errorMessage = this.getSpeechErrorMessage(event.error);
        if (onError) onError(errorMessage);
      };

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('Speech recognition started');
        resolve();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        console.log('Speech recognition ended');
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        reject(error);
      }
    });
  }

  /**
   * Stop real-time transcription
   */
  stopRealTimeTranscription(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Transcribe audio blob (simulated - would use external API in production)
   */
  async transcribeAudio(
    audioBlob: Blob, 
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    console.log('Transcribing audio blob:', audioBlob.size, 'bytes');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate transcription result (in production, would call external API)
      const simulatedTranscription = this.generateSimulatedTranscription();
      
      // Apply construction terminology corrections
      const correctedText = this.applyConstructionCorrections(simulatedTranscription.text);
      
      // Extract measurements
      const measurements = this.extractMeasurements(correctedText);
      
      // Generate corrections log
      const corrections = this.generateCorrections(simulatedTranscription.text, correctedText);
      
      return {
        text: correctedText,
        confidence: simulatedTranscription.confidence,
        measurements,
        corrections,
        segments: simulatedTranscription.segments
      };
      
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error(`Transcription failed: ${error}`);
    }
  }

  /**
   * Apply construction-specific terminology corrections
   */
  private applyConstructionCorrections(text: string): string {
    let correctedText = text;
    
    // Apply direct corrections from terminology database
    Object.entries(this.constructionTerms.corrections).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      correctedText = correctedText.replace(regex, correct);
    });
    
    // Apply common construction term corrections
    const commonCorrections: Record<string, string> = {
      'by four': '2x4',
      'by six': '2x6', 
      'by eight': '2x8',
      'by ten': '2x10',
      'by twelve': '2x12',
      'two by four': '2x4',
      'two by six': '2x6',
      'two by eight': '2x8',
      'stud wall': 'stud wall',
      'dry wall': 'drywall',
      'sheet rock': 'sheetrock',
      'five eighth': '5/8"',
      'half inch': '1/2"',
      'three quarter': '3/4"',
      'quarter inch': '1/4"'
    };
    
    Object.entries(commonCorrections).forEach(([pattern, replacement]) => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      correctedText = correctedText.replace(regex, replacement);
    });
    
    return correctedText;
  }

  /**
   * Extract measurements from transcribed text
   */
  private extractMeasurements(text: string): VoiceMeasurement[] {
    const measurements: VoiceMeasurement[] = [];
    
    // Pattern for "number by number feet/inches" (e.g., "20 by 30 feet")
    const dimensionPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:by|x|times)\s*(\d+(?:\.\d+)?)\s*(feet|foot|ft|inches|inch|in)/gi,
      /(\d+(?:\.\d+)?)\s*(feet|foot|ft|inches|inch|in)\s*(?:by|x|times)\s*(\d+(?:\.\d+)?)\s*(feet|foot|ft|inches|inch|in)/gi,
      /(\d+(?:\.\d+)?)\s*(?:by|x|times)\s*(\d+(?:\.\d+)?)/gi
    ];
    
    // Pattern for single measurements (e.g., "150 linear feet")
    const singleMeasurementPatterns = [
      /(\d+(?:\.\d+)?)\s*(linear\s*feet|running\s*feet|square\s*feet|cubic\s*feet|sq\s*ft|cu\s*ft|feet|foot|ft)/gi,
      /(\d+(?:\.\d+)?)\s*(each|piece|pieces|unit|units|item|items)/gi
    ];
    
    let id = 1;
    
    // Extract dimensional measurements
    dimensionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, num1, num2OrUnit, unit] = match;
        
        let quantity: number;
        let measurementUnit: string;
        let type: 'linear' | 'square' | 'cubic' | 'count';
        
        if (unit) {
          // Format: "20 by 30 feet"
          quantity = parseFloat(num1) * parseFloat(num2OrUnit);
          measurementUnit = this.normalizeUnit(unit);
          type = measurementUnit.includes('sq') || measurementUnit.includes('SF') ? 'square' : 'linear';
        } else {
          // Format: "20 by 30" (assume square feet)
          quantity = parseFloat(num1) * parseFloat(num2OrUnit);
          measurementUnit = 'SF';
          type = 'square';
        }
        
        measurements.push({
          id: `measurement_${id++}`,
          rawText: fullMatch,
          parsedValue: quantity,
          unit: measurementUnit,
          type,
          confidence: 0.8,
          context: this.getContext(text, match.index, 20)
        });
      }
    });
    
    // Extract single measurements
    singleMeasurementPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, number, unit] = match;
        
        measurements.push({
          id: `measurement_${id++}`,
          rawText: fullMatch,
          parsedValue: parseFloat(number),
          unit: this.normalizeUnit(unit),
          type: this.determineType(unit),
          confidence: 0.9,
          context: this.getContext(text, match.index, 20)
        });
      }
    });
    
    return measurements;
  }

  /**
   * Normalize measurement units to standard abbreviations
   */
  private normalizeUnit(unit: string): string {
    const unitLower = unit.toLowerCase().replace(/\s+/g, ' ');
    
    const unitMappings: Record<string, string> = {
      'feet': 'LF',
      'foot': 'LF',
      'ft': 'LF',
      'linear feet': 'LF',
      'running feet': 'LF',
      'square feet': 'SF',
      'sq ft': 'SF',
      'cubic feet': 'CF',
      'cu ft': 'CF',
      'inches': 'IN',
      'inch': 'IN',
      'in': 'IN',
      'each': 'EA',
      'piece': 'EA',
      'pieces': 'EA',
      'unit': 'EA',
      'units': 'EA',
      'item': 'EA',
      'items': 'EA'
    };
    
    return unitMappings[unitLower] || unit.toUpperCase();
  }

  /**
   * Determine measurement type from unit
   */
  private determineType(unit: string): 'linear' | 'square' | 'cubic' | 'count' {
    const unitLower = unit.toLowerCase();
    
    if (unitLower.includes('square') || unitLower.includes('sq')) return 'square';
    if (unitLower.includes('cubic') || unitLower.includes('cu')) return 'cubic';
    if (unitLower.includes('each') || unitLower.includes('piece') || unitLower.includes('unit') || unitLower.includes('item')) return 'count';
    return 'linear';
  }

  /**
   * Get context around a match for better understanding
   */
  private getContext(text: string, index: number, contextLength: number): string {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + contextLength);
    return text.substring(start, end).trim();
  }

  /**
   * Generate corrections log
   */
  private generateCorrections(original: string, corrected: string): TranscriptionCorrection[] {
    const corrections: TranscriptionCorrection[] = [];
    
    // Simple approach: look for differences
    if (original !== corrected) {
      Object.entries(this.constructionTerms.corrections).forEach(([wrong, correct]) => {
        if (original.toLowerCase().includes(wrong.toLowerCase()) && 
            corrected.toLowerCase().includes(correct.toLowerCase())) {
          corrections.push({
            original: wrong,
            corrected: correct,
            reason: 'Construction terminology correction',
            confidence: 0.9
          });
        }
      });
    }
    
    return corrections;
  }

  /**
   * Generate simulated transcription (for testing - replace with real API)
   */
  private generateSimulatedTranscription(): { text: string; confidence: number; segments: TranscriptionSegment[] } {
    const sampleTranscriptions = [
      "We need to install hardwood flooring in the living room that's about 20 by 15 feet. Also need to frame out a new wall using 2x4 studs with drywall on both sides.",
      "The bathroom renovation includes removing the old tile which is about 8 by 10 feet and installing new ceramic tile flooring. We'll also need to replace 3 plumbing fixtures.",
      "Kitchen remodel requires removing existing cabinets and installing new custom cabinets along the 12 foot wall. Countertops will be granite approximately 25 square feet.",
      "Exterior work includes 200 linear feet of chain link fencing around the backyard and painting the house exterior which is about 2500 square feet of siding.",
      "Concrete work for the new garage slab measuring 24 by 24 feet with 6 inch thick concrete. Foundation will require excavation about 3 feet deep."
    ];
    
    const randomTranscription = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
    
    return {
      text: randomTranscription,
      confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
      segments: this.generateSegments(randomTranscription)
    };
  }

  /**
   * Generate segments for simulated transcription
   */
  private generateSegments(text: string): TranscriptionSegment[] {
    const words = text.split(' ');
    const segments: TranscriptionSegment[] = [];
    let currentTime = 0;
    
    for (let i = 0; i < words.length; i += 5) {
      const segmentWords = words.slice(i, i + 5);
      const segmentText = segmentWords.join(' ');
      const duration = segmentWords.length * 0.5; // Rough estimate
      
      segments.push({
        text: segmentText,
        startTime: currentTime,
        endTime: currentTime + duration,
        confidence: 0.8 + Math.random() * 0.15
      });
      
      currentTime += duration;
    }
    
    return segments;
  }

  /**
   * Get user-friendly error message
   */
  private getSpeechErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'network': 'Network error - check your internet connection',
      'audio-capture': 'Microphone access denied or unavailable',
      'not-allowed': 'Microphone permission denied',
      'no-speech': 'No speech detected - try speaking louder',
      'aborted': 'Speech recognition was cancelled',
      'bad-grammar': 'Speech recognition grammar error'
    };
    
    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  /**
   * Update construction terminology
   */
  updateTerminology(updates: Partial<ConstructionTerminology>): void {
    this.constructionTerms = {
      ...this.constructionTerms,
      ...updates
    };
  }

  /**
   * Get current terminology database
   */
  getTerminology(): ConstructionTerminology {
    return { ...this.constructionTerms };
  }

  /**
   * Check if real-time transcription is supported
   */
  static isRealTimeSupported(): boolean {
    if (typeof window === 'undefined') {
      return false; // Node.js environment
    }
    return !!(('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window));
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.recognition = null;
    this.isListening = false;
  }
}