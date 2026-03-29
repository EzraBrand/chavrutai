/**
 * Segmentation utilities and validation functions
 */

import { 
  SegmentationResult, 
  TextSegment, 
  ValidationError,
  Boundary 
} from "@shared/segmentation";

/**
 * Comprehensive validation functions
 */
export class SegmentationValidator {
  
  /**
   * Validate segmentation with comprehensive checks
   */
  static validateSegmentation(result: SegmentationResult): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Text integrity check
    errors.push(...this.validateTextIntegrity(result));
    
    // Segment consistency checks
    errors.push(...this.validateSegmentConsistency(result));
    
    // Boundary validity checks
    errors.push(...this.validateBoundaries(result));
    
    return errors;
  }

  /**
   * Validate text integrity - ensure original text is preserved
   */
  static validateTextIntegrity(result: SegmentationResult): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check if segments can reconstruct original text
    const reconstructed = result.segments.map(s => s.text).join(' ');
    const normalizedOriginal = result.originalText.replace(/\s+/g, ' ').trim();
    const normalizedReconstructed = reconstructed.replace(/\s+/g, ' ').trim();
    
    if (normalizedOriginal !== normalizedReconstructed) {
      errors.push({
        type: "text_mismatch",
        message: `Text integrity failed. Original: "${normalizedOriginal.substring(0, 100)}...", Reconstructed: "${normalizedReconstructed.substring(0, 100)}..."`
      });
    }
    
    // Checksum validation
    const calculatedChecksum = this.generateChecksum(result.originalText);
    if (result.checksum !== calculatedChecksum) {
      errors.push({
        type: "checksum_failure",
        message: "Checksum validation failed - text may have been modified"
      });
    }
    
    return errors;
  }

  /**
   * Validate segment consistency
   */
  static validateSegmentConsistency(result: SegmentationResult): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check for overlapping segments
    for (let i = 0; i < result.segments.length - 1; i++) {
      const current = result.segments[i];
      const next = result.segments[i + 1];
      
      if (current.end > next.start) {
        errors.push({
          type: "overlapping_segments",
          message: `Segments ${current.id} and ${next.id} overlap (${current.end} > ${next.start})`,
          segment: current
        });
      }
    }
    
    // Check for gaps between segments
    for (let i = 0; i < result.segments.length - 1; i++) {
      const current = result.segments[i];
      const next = result.segments[i + 1];
      
      if (current.end < next.start && (next.start - current.end) > 1) {
        const gapText = result.originalText.slice(current.end, next.start);
        if (gapText.trim()) {
          errors.push({
            type: "missing_segments",
            message: `Gap between segments ${current.id} and ${next.id}: "${gapText}"`,
            position: current.end
          });
        }
      }
    }
    
    // Validate segment positions are within text bounds
    for (const segment of result.segments) {
      if (segment.start < 0 || segment.end > result.originalText.length) {
        errors.push({
          type: "invalid_boundaries",
          message: `Segment ${segment.id} has invalid boundaries (${segment.start}, ${segment.end})`,
          segment
        });
      }
    }
    
    return errors;
  }

  /**
   * Validate boundary positions
   */
  static validateBoundaries(result: SegmentationResult): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!result.boundaries) return errors;
    
    for (const boundary of result.boundaries) {
      // Check if boundary position is valid
      if (boundary.position < 0 || boundary.position > result.originalText.length) {
        errors.push({
          type: "invalid_boundaries",
          message: `Boundary at position ${boundary.position} is out of bounds`,
          position: boundary.position
        });
      }
      
      // Check if boundary falls on word boundary (not mid-word)
      if (boundary.position > 0 && boundary.position < result.originalText.length) {
        const charBefore = result.originalText[boundary.position - 1];
        const charAfter = result.originalText[boundary.position];
        
        if (this.isWordCharacter(charBefore) && this.isWordCharacter(charAfter)) {
          errors.push({
            type: "invalid_boundaries",
            message: `Boundary at position ${boundary.position} splits a word`,
            position: boundary.position
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Check if character is a word character (letter or digit)
   */
  private static isWordCharacter(char: string): boolean {
    return /[\w\u0590-\u05FF]/.test(char); // Include Hebrew characters
  }

  /**
   * Generate checksum for text
   */
  private static generateChecksum(text: string): string {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

/**
 * Text processing utilities for segmentation
 */
export class SegmentationTextProcessor {
  
  /**
   * Format segments with Talmud-specific parallel detection
   */
  static formatTalmudParallels(segments: TextSegment[]): string {
    const formatted: string[] = [];
    let i = 0;
    
    while (i < segments.length) {
      const current = segments[i];
      
      // Check if this starts a parallel structure
      if (i < segments.length - 1) {
        const parallel = this.detectParallelPair(current, segments[i + 1]);
        if (parallel) {
          formatted.push(this.formatParallelPair(current, segments[i + 1], parallel.type));
          i += 2; // Skip the next segment as it's part of the parallel
          continue;
        }
      }
      
      // Regular segment formatting
      formatted.push(current.text);
      i++;
    }
    
    return formatted.join('\n');
  }

  /**
   * Detect if two segments form a parallel structure
   */
  private static detectParallelPair(segment1: TextSegment, segment2: TextSegment): { type: string } | null {
    const text1 = segment1.text.toLowerCase();
    const text2 = segment2.text.toLowerCase();
    
    // Look for contrasting patterns
    if ((text1.includes("not") || text1.includes("no")) !== 
        (text2.includes("not") || text2.includes("no"))) {
      return { type: "contrast" };
    }
    
    // Look for enumeration patterns (first/second, one/another, etc.)
    const enumerationWords = ["first", "second", "one", "another", "some", "others"];
    const hasEnumeration1 = enumerationWords.some(word => text1.includes(word));
    const hasEnumeration2 = enumerationWords.some(word => text2.includes(word));
    
    if (hasEnumeration1 && hasEnumeration2) {
      return { type: "enumeration" };
    }
    
    return null;
  }

  /**
   * Format parallel pair with bullet points
   */
  private static formatParallelPair(segment1: TextSegment, segment2: TextSegment, type: string): string {
    // Extract the contrasting elements
    const text1 = segment1.text;
    const text2 = segment2.text;
    
    if (type === "contrast") {
      // Try to extract the key contrasting elements
      const contrast1 = this.extractContrastElement(text1);
      const contrast2 = this.extractContrastElement(text2);
      
      return `- A - ${contrast1}\n- B - ${contrast2}`;
    }
    
    return `- ${text1}\n- ${text2}`;
  }

  /**
   * Extract the key contrasting element from text
   */
  private static extractContrastElement(text: string): string {
    // Simple heuristic - return the text after common prefixes
    const prefixes = ["r' ", "rabbi ", "the ", "and ", "but ", "however "];
    
    let cleaned = text.toLowerCase().trim();
    for (const prefix of prefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length);
        break;
      }
    }
    
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  /**
   * Merge segments that are too small or fragmented
   */
  static mergeSmallSegments(segments: TextSegment[], minLength: number = 10): TextSegment[] {
    const merged: TextSegment[] = [];
    let i = 0;
    
    while (i < segments.length) {
      let current = segments[i];
      
      // If segment is too small, try to merge with next
      while (i + 1 < segments.length && current.text.trim().length < minLength) {
        const next = segments[i + 1];
        
        // Merge the segments
        current = {
          ...current,
          end: next.end,
          text: current.text + ' ' + next.text,
          confidence: Math.min(current.confidence || 0, next.confidence || 0)
        };
        
        i++;
      }
      
      merged.push(current);
      i++;
    }
    
    return merged;
  }

  /**
   * Split segments that are too long
   */
  static splitLongSegments(segments: TextSegment[], maxLength: number = 200): TextSegment[] {
    const result: TextSegment[] = [];
    let nextId = Math.max(...segments.map(s => s.id)) + 1;
    
    for (const segment of segments) {
      if (segment.text.length <= maxLength) {
        result.push(segment);
        continue;
      }
      
      // Split on sentence boundaries within the segment
      const sentences = segment.text.match(/[^.!?]+[.!?]+/g) || [segment.text];
      let currentStart = segment.start;
      
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed) {
          result.push({
            id: nextId++,
            start: currentStart,
            end: currentStart + trimmed.length,
            text: trimmed,
            type: segment.type,
            confidence: segment.confidence
          });
          
          currentStart += sentence.length;
        }
      }
    }
    
    return result;
  }
}

/**
 * Export utility functions
 */
export const validateSegmentation = SegmentationValidator.validateSegmentation;
export const formatTalmudParallels = SegmentationTextProcessor.formatTalmudParallels;
export const mergeSmallSegments = SegmentationTextProcessor.mergeSmallSegments;
export const splitLongSegments = SegmentationTextProcessor.splitLongSegments;