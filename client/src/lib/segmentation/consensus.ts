/**
 * Multi-Pass Consensus Segmentation
 * Runs multiple segmentation passes and finds consensus boundaries
 */

import { SegmentationService, createSegmentationService } from "./service";
import { 
  ConsensusResult, 
  SegmentationResult, 
  SegmentationConfig,
  Boundary 
} from "@shared/segmentation";

/**
 * Multi-pass consensus segmentation class
 */
export class ConsensusSegmentation {
  private baseConfig: SegmentationConfig;
  
  constructor(baseConfig: SegmentationConfig) {
    this.baseConfig = baseConfig;
  }

  /**
   * Run multi-pass segmentation with consensus
   */
  async segmentWithConsensus(text: string, passCount: number = 3): Promise<ConsensusResult> {
    const passResults: SegmentationResult[] = [];
    
    // Run multiple passes with different configurations
    for (let i = 0; i < passCount; i++) {
      const config = this.createVariantConfig(i);
      const service = new SegmentationService(config);
      
      try {
        const result = await service.segmentText(text);
        passResults.push(result);
      } catch (error) {
        console.warn(`Pass ${i + 1} failed:`, error);
        // Continue with other passes
      }
    }

    if (passResults.length === 0) {
      throw new Error("All segmentation passes failed");
    }

    // Find consensus boundaries
    const consensusBoundaries = this.findBoundaryConsensus(passResults);
    
    // Create final segmentation based on consensus
    const finalService = new SegmentationService(this.baseConfig);
    const finalSegmentation = await this.createConsensusSegmentation(text, consensusBoundaries, finalService);

    // Calculate agreement level
    const agreementLevel = this.calculateAgreementLevel(passResults, consensusBoundaries);

    // Find conflicting boundaries
    const conflictingBoundaries = this.findConflictingBoundaries(passResults);

    return {
      finalSegmentation,
      agreementLevel,
      passResults,
      conflictingBoundaries
    };
  }

  /**
   * Create variant configurations for different passes
   */
  private createVariantConfig(passIndex: number): SegmentationConfig {
    const variants: Partial<SegmentationConfig>[] = [
      { temperature: 0.1 }, // Conservative
      { temperature: 0.3 }, // Moderate
      { temperature: 0.5 }  // Creative
    ];

    const variant = variants[passIndex % variants.length];
    return { ...this.baseConfig, ...variant };
  }

  /**
   * Find consensus boundaries across multiple passes
   */
  private findBoundaryConsensus(results: SegmentationResult[]): Boundary[] {
    const boundaryVotes: Map<number, { count: number; boundaries: Boundary[] }> = new Map();

    // Collect all boundary positions and their votes
    for (const result of results) {
      if (!result.boundaries) continue;

      for (const boundary of result.boundaries) {
        const position = boundary.position;
        
        if (!boundaryVotes.has(position)) {
          boundaryVotes.set(position, { count: 0, boundaries: [] });
        }
        
        const vote = boundaryVotes.get(position)!;
        vote.count++;
        vote.boundaries.push(boundary);
      }
    }

    // Select boundaries with majority vote (> 50% of passes)
    const threshold = Math.ceil(results.length / 2);
    const consensusBoundaries: Boundary[] = [];

    for (const [position, vote] of boundaryVotes.entries()) {
      if (vote.count >= threshold) {
        // Use the most confident boundary for this position
        const bestBoundary = vote.boundaries.reduce((best, current) => 
          (current.confidence || 0) > (best.confidence || 0) ? current : best
        );
        
        consensusBoundaries.push(bestBoundary);
      }
    }

    // Sort by position
    return consensusBoundaries.sort((a, b) => a.position - b.position);
  }

  /**
   * Create final segmentation based on consensus boundaries
   */
  private async createConsensusSegmentation(
    text: string, 
    boundaries: Boundary[], 
    service: SegmentationService
  ): Promise<SegmentationResult> {
    // Create segments from consensus boundaries
    const segments = service['createSegmentsFromBoundaries'](text, boundaries);
    
    return {
      originalText: text,
      checksum: service['generateChecksum'](text),
      boundaries,
      segments,
      metadata: {
        segmentationModel: `${this.baseConfig.model}-consensus`,
        timestamp: new Date().toISOString(),
        validationPassed: true,
        approach: this.baseConfig.approach,
        language: this.baseConfig.language,
        textType: this.baseConfig.textType,
        parallelStructures: this.baseConfig.enableParallelDetection 
          ? service['detectParallelStructures'](segments) 
          : undefined
      }
    };
  }

  /**
   * Calculate agreement level between passes
   */
  private calculateAgreementLevel(results: SegmentationResult[], consensusBoundaries: Boundary[]): number {
    if (results.length === 0) return 0;

    let totalAgreement = 0;
    const consensusPositions = new Set(consensusBoundaries.map(b => b.position));

    for (const result of results) {
      if (!result.boundaries) continue;

      const resultPositions = new Set(result.boundaries.map(b => b.position));
      
      // Calculate Jaccard similarity (intersection over union)
      const intersection = new Set([...consensusPositions].filter(pos => resultPositions.has(pos)));
      const union = new Set([...consensusPositions, ...resultPositions]);
      
      const similarity = intersection.size / union.size;
      totalAgreement += similarity;
    }

    return totalAgreement / results.length;
  }

  /**
   * Find boundaries that had conflicting votes
   */
  private findConflictingBoundaries(results: SegmentationResult[]): any[] {
    const boundaryVotes: Map<number, any[]> = new Map();

    // Collect all boundary votes
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (!result.boundaries) continue;

      for (const boundary of result.boundaries) {
        const position = boundary.position;
        
        if (!boundaryVotes.has(position)) {
          boundaryVotes.set(position, []);
        }
        
        boundaryVotes.get(position)!.push({
          model: `${result.metadata.segmentationModel}-pass${i + 1}`,
          boundary
        });
      }
    }

    // Find positions with non-unanimous votes
    const conflicts: any[] = [];
    for (const [position, votes] of boundaryVotes.entries()) {
      if (votes.length > 0 && votes.length < results.length) {
        conflicts.push({
          position,
          votes
        });
      }
    }

    return conflicts;
  }
}

/**
 * Utility function to create consensus segmentation
 */
export function createConsensusSegmentation(overrides: Partial<SegmentationConfig> = {}): ConsensusSegmentation {
  const defaultConfig: SegmentationConfig = {
    model: "gpt-4",
    temperature: 0.2,
    maxTokens: 1000,
    approach: "boundary_markers",
    language: "english",
    textType: "talmud",
    enableParallelDetection: true
  };

  return new ConsensusSegmentation({ ...defaultConfig, ...overrides });
}