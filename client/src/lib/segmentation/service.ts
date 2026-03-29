/**
 * LLM-Based Phrase Segmentation Service
 * Implements boundary detection with text preservation
 */

import { 
  SegmentationResult, 
  SegmentationConfig, 
  TextSegment, 
  Boundary, 
  ValidationError,
  TextSegmentSchema
} from "@shared/segmentation";

/**
 * Core segmentation service class
 */
export class SegmentationService {
  private config: SegmentationConfig;
  
  constructor(config: SegmentationConfig) {
    this.config = config;
  }

  /**
   * Main segmentation entry point
   */
  async segmentText(text: string): Promise<SegmentationResult> {
    // Step 1: Validate input
    if (!text?.trim()) {
      throw new Error("Empty or invalid text provided");
    }

    // Step 2: Generate checksum for integrity validation
    const checksum = this.generateChecksum(text);

    // Step 3: Choose approach based on configuration
    let segments: TextSegment[];
    let boundaries: Boundary[] | undefined;

    switch (this.config.approach) {
      case "boundary_markers":
        const markerResult = await this.boundaryMarkersApproach(text);
        segments = markerResult.segments;
        boundaries = markerResult.boundaries;
        break;
      case "index_based":
        segments = await this.indexBasedApproach(text);
        break;
      case "span_based":
        segments = await this.spanBasedApproach(text);
        break;
      default:
        throw new Error(`Unsupported approach: ${this.config.approach}`);
    }

    // Step 4: Create result object
    const result: SegmentationResult = {
      originalText: text,
      checksum,
      boundaries,
      segments,
      metadata: {
        segmentationModel: this.config.model,
        timestamp: new Date().toISOString(),
        validationPassed: true,
        approach: this.config.approach,
        language: this.config.language,
        textType: this.config.textType,
        parallelStructures: this.config.enableParallelDetection 
          ? this.detectParallelStructures(segments) 
          : undefined
      }
    };

    // Step 5: Validate result
    const validation = this.validateSegmentation(result);
    if (validation.length > 0) {
      result.metadata.validationPassed = false;
      throw new Error(`Segmentation validation failed: ${validation.map(e => e.message).join(', ')}`);
    }

    return result;
  }

  /**
   * Approach A: Boundary Detection with Markers
   */
  private async boundaryMarkersApproach(text: string): Promise<{ segments: TextSegment[], boundaries: Boundary[] }> {
    const prompt = this.buildBoundaryMarkersPrompt(text);
    
    try {
      const llmResponse = await this.mockLLMCall(prompt);
      const markedText = this.parseBoundaryMarkersResponse(llmResponse);
      
      // Extract boundaries and create segments
      const boundaries = this.extractBoundariesFromMarkedText(markedText, text);
      const segments = this.createSegmentsFromBoundaries(text, boundaries);
      
      return { segments, boundaries };
    } catch (error) {
      throw new Error(`Boundary markers approach failed: ${error}`);
    }
  }

  /**
   * Build prompt for boundary markers approach
   */
  private buildBoundaryMarkersPrompt(text: string): string {
    const basePrompt = `
${this.config.language === "hebrew" ? "Hebrew" : "English"}: ${text}

Task: Insert | markers at phrase boundaries. Do not change any original text.

${this.getTalmudSpecificInstructions()}

Output format: Return the text with | markers inserted at phrase boundaries.
`;

    return basePrompt.trim();
  }

  /**
   * Get Talmud-specific instructions based on the comment requirements
   */
  private getTalmudSpecificInstructions(): string {
    if (this.config.textType !== "talmud") return "";

    return `
Special instructions for Talmud text:
- Talmud is written in a formulaic, laconic way with much parallelism
- Format parallels with bullet points:
  - A - X
  - B - not X
- Look for typical Talmudic patterns:
  - Speech attributions (R' X said)
  - Question-answer sequences
  - Proof texts and objections
  - Parallel legal cases
`;
  }

  /**
   * Mock LLM call - replace with actual implementation
   */
  private async mockLLMCall(prompt: string): Promise<string> {
    // For testing purposes, return a simple segmentation
    if (this.config.approach === "boundary_markers") {
      return prompt.includes("Hebrew") 
        ? "וַיֹּאמֶר אֱלֹהִים | יְהִי אוֹר | וַיְהִי אוֹר"
        : "And God said, | Let there be light: | and there was light.";
    }
    
    return JSON.stringify([12, 34]);
  }

  /**
   * Parse boundary markers response
   */
  private parseBoundaryMarkersResponse(response: string): string {
    return response.trim();
  }

  /**
   * Extract boundaries from marked text
   */
  private extractBoundariesFromMarkedText(markedText: string, originalText: string): Boundary[] {
    const boundaries: Boundary[] = [];
    let originalIndex = 0;

    for (let i = 0; i < markedText.length; i++) {
      if (markedText[i] === '|') {
        boundaries.push({
          position: originalIndex,
          type: "phrase",
          confidence: 0.8
        });
      } else if (markedText[i] === originalText[originalIndex]) {
        originalIndex++;
      }
    }

    return boundaries;
  }

  /**
   * Create segments from boundaries
   */
  private createSegmentsFromBoundaries(text: string, boundaries: Boundary[]): TextSegment[] {
    const segments: TextSegment[] = [];
    const positions = [0, ...boundaries.map(b => b.position), text.length];

    for (let i = 0; i < positions.length - 1; i++) {
      const start = positions[i];
      const end = positions[i + 1];
      const segmentText = text.slice(start, end).trim();

      if (segmentText) {
        segments.push({
          id: segments.length + 1,
          start,
          end,
          text: segmentText,
          type: this.inferSegmentType(segmentText),
          confidence: 0.8
        });
      }
    }

    return segments;
  }

  private async indexBasedApproach(text: string): Promise<TextSegment[]> {
    return [];
  }

  private async spanBasedApproach(text: string): Promise<TextSegment[]> {
    return [];
  }

  /**
   * Infer segment type from text content
   */
  private inferSegmentType(text: string): string | undefined {
    const trimmed = text.trim().toLowerCase();
    
    if (this.config.language === "hebrew") {
      if (trimmed.includes("אמר")) return "speech_attribution";
      if (trimmed.includes("מה")) return "question";
    }
    
    if (this.config.language === "english") {
      if (trimmed.includes(" said") || trimmed.includes("r'")) return "speech_attribution";
      if (trimmed.startsWith("what") || trimmed.endsWith("?")) return "question";
      if (trimmed.startsWith("and ")) return "result_clause";
      if (trimmed.includes("let there be")) return "imperative_clause";
    }

    return undefined;
  }

  /**
   * Detect parallel structures in segments
   */
  private detectParallelStructures(segments: TextSegment[]): any[] {
    const parallels: any[] = [];
    
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      
      // Look for contrasting patterns
      if (current.text.includes("not") !== next.text.includes("not")) {
        parallels.push({
          segments: [current.id, next.id],
          type: "contrast"
        });
      }
    }
    
    return parallels;
  }

  /**
   * Generate checksum for text integrity
   */
  private generateChecksum(text: string): string {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Validate segmentation result
   */
  private validateSegmentation(result: SegmentationResult): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check text integrity - be more flexible with whitespace
    const reconstructed = result.segments.map(s => s.text).join(' ');
    const normalizedOriginal = result.originalText.replace(/\s+/g, ' ').trim();
    const normalizedReconstructed = reconstructed.replace(/\s+/g, ' ').trim();

    if (normalizedOriginal !== normalizedReconstructed) {
      errors.push({
        type: "text_mismatch",
        message: `Original text does not match reconstructed text. Expected: "${normalizedOriginal}", Got: "${normalizedReconstructed}"`
      });
    }

    return errors;
  }
}

/**
 * Utility function to create segmentation service with default config
 */
export function createSegmentationService(overrides: Partial<SegmentationConfig> = {}): SegmentationService {
  const defaultConfig: SegmentationConfig = {
    model: "gpt-4",
    temperature: 0.1,
    maxTokens: 1000,
    approach: "boundary_markers",
    language: "english",
    textType: "talmud",
    enableParallelDetection: true
  };

  return new SegmentationService({ ...defaultConfig, ...overrides });
}
