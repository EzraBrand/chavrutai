/**
 * LLM-Based Phrase Segmentation Pipeline
 * Main exports for the segmentation system
 */

// Core services
export { SegmentationService, createSegmentationService } from './service';
export { ConsensusSegmentation, createConsensusSegmentation } from './consensus';

// Utilities
export { 
  SegmentationValidator,
  SegmentationTextProcessor,
  validateSegmentation,
  formatTalmudParallels,
  mergeSmallSegments,
  splitLongSegments
} from './utils';

// Re-export types from shared
export type {
  SegmentationResult,
  SegmentationConfig,
  TextSegment,
  Boundary,
  ValidationError,
  ConsensusResult,
  SegmentType
} from '@shared/segmentation';