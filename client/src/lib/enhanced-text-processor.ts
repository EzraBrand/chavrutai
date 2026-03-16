/**
 * Enhanced Text Processing with LLM-Based Segmentation
 * Integrates segmentation pipeline with existing text processing
 */

import { 
  createSegmentationService, 
  createConsensusSegmentation,
  formatTalmudParallels,
  mergeSmallSegments 
} from './segmentation';
import { 
  processHebrewText, 
  processEnglishText,
  containsHebrew 
} from './text-processing';
import type { SegmentationResult } from '@shared/segmentation';

/**
 * Enhanced text processor with segmentation capabilities
 */
export class EnhancedTextProcessor {
  
  /**
   * Process text with LLM-based segmentation
   */
  static async processWithSegmentation(
    text: string, 
    options: {
      enableSegmentation?: boolean;
      useConsensus?: boolean;
      textType?: 'talmud' | 'biblical' | 'commentary';
      formatParallels?: boolean;
    } = {}
  ): Promise<{
    processedText: string;
    segmentation?: SegmentationResult;
    parallelFormatted?: string;
  }> {
    
    const {
      enableSegmentation = true,
      useConsensus = false,
      textType = 'talmud',
      formatParallels = true
    } = options;

    // First, apply existing text processing
    const isHebrew = containsHebrew(text);
    const processedText = isHebrew ? processHebrewText(text) : processEnglishText(text);

    // If segmentation is disabled, return early
    if (!enableSegmentation) {
      return { processedText };
    }

    try {
      let segmentation: SegmentationResult;

      if (useConsensus) {
        // Use consensus segmentation for higher accuracy
        const consensusService = createConsensusSegmentation({
          language: isHebrew ? 'hebrew' : 'english',
          textType,
          enableParallelDetection: formatParallels
        });
        
        const consensusResult = await consensusService.segmentWithConsensus(text);
        segmentation = consensusResult.finalSegmentation;
      } else {
        // Use single-pass segmentation
        const service = createSegmentationService({
          language: isHebrew ? 'hebrew' : 'english',
          textType,
          enableParallelDetection: formatParallels
        });
        
        segmentation = await service.segmentText(text);
      }

      // Merge small segments for better readability
      const mergedSegments = mergeSmallSegments(segmentation.segments, 15);
      segmentation.segments = mergedSegments;

      // Format parallels if requested and Talmud text
      let parallelFormatted: string | undefined;
      if (formatParallels && textType === 'talmud') {
        parallelFormatted = formatTalmudParallels(segmentation.segments);
      }

      return {
        processedText,
        segmentation,
        parallelFormatted
      };

    } catch (error) {
      console.warn('Segmentation failed, falling back to standard processing:', error);
      return { processedText };
    }
  }

  /**
   * Process Hebrew text with segmentation
   */
  static async processHebrewWithSegmentation(
    text: string,
    options: { useConsensus?: boolean; formatParallels?: boolean } = {}
  ) {
    return this.processWithSegmentation(text, {
      ...options,
      textType: 'talmud',
      enableSegmentation: true
    });
  }

  /**
   * Process English text with segmentation
   */
  static async processEnglishWithSegmentation(
    text: string,
    options: { useConsensus?: boolean; formatParallels?: boolean } = {}
  ) {
    return this.processWithSegmentation(text, {
      ...options,
      textType: 'talmud',
      enableSegmentation: true
    });
  }

  /**
   * Get formatted segments as HTML for display
   */
  static formatSegmentsAsHTML(segments: any[], options: { 
    highlightParallels?: boolean;
    showBoundaries?: boolean;
  } = {}): string {
    const { highlightParallels = true, showBoundaries = false } = options;

    return segments.map((segment, index) => {
      let segmentClass = 'talmud-segment';
      
      // Add special classes for parallel structures
      if (highlightParallels && segment.isParallel) {
        segmentClass += ' parallel-segment';
      }
      
      // Add type-specific classes
      if (segment.type) {
        segmentClass += ` segment-${segment.type}`;
      }

      const boundaryMarker = showBoundaries ? 
        `<span class="boundary-marker" data-position="${segment.start}">|</span>` : '';

      return `<span class="${segmentClass}" data-segment-id="${segment.id}" data-confidence="${segment.confidence || 0.8}">
        ${boundaryMarker}${segment.text}
      </span>`;
    }).join('');
  }

  /**
   * Extract segment by ID from segmentation result
   */
  static getSegmentById(segmentation: SegmentationResult, id: number) {
    return segmentation.segments.find(segment => segment.id === id);
  }

  /**
   * Get segments by type
   */
  static getSegmentsByType(segmentation: SegmentationResult, type: string) {
    return segmentation.segments.filter(segment => segment.type === type);
  }

  /**
   * Get parallel structures from segmentation
   */
  static getParallelStructures(segmentation: SegmentationResult) {
    return segmentation.metadata.parallelStructures || [];
  }

  /**
   * Validate and repair segmentation if needed
   */
  static validateAndRepair(segmentation: SegmentationResult): SegmentationResult {
    // Basic repair - merge adjacent segments with same type
    const repairedSegments = [];
    let currentSegment = null;

    for (const segment of segmentation.segments) {
      if (currentSegment && 
          currentSegment.type === segment.type && 
          currentSegment.end === segment.start) {
        // Merge with current segment
        currentSegment.end = segment.end;
        currentSegment.text += ' ' + segment.text;
        currentSegment.confidence = Math.min(
          currentSegment.confidence || 0, 
          segment.confidence || 0
        );
      } else {
        if (currentSegment) {
          repairedSegments.push(currentSegment);
        }
        currentSegment = { ...segment };
      }
    }

    if (currentSegment) {
      repairedSegments.push(currentSegment);
    }

    return {
      ...segmentation,
      segments: repairedSegments
    };
  }
}

// Convenience functions
export async function segmentTalmudText(text: string, useConsensus: boolean = false) {
  return EnhancedTextProcessor.processWithSegmentation(text, {
    textType: 'talmud',
    useConsensus,
    formatParallels: true
  });
}

export async function segmentBiblicalText(text: string, useConsensus: boolean = false) {
  return EnhancedTextProcessor.processWithSegmentation(text, {
    textType: 'biblical',
    useConsensus,
    formatParallels: false
  });
}