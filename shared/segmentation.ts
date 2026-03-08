/**
 * LLM-Based Phrase Segmentation Types and Schemas
 * Core principle: Text Preservation - LLM outputs only boundary markers
 */

import { z } from "zod";

// Segment types based on Talmud structure
export const SegmentTypeSchema = z.enum([
  "speech_attribution",      // "R' Yochanan said"
  "imperative_clause",      // "Let there be light" 
  "result_clause",          // "and there was light"
  "temporal_phrase",        // "In the beginning"
  "subject_phrase",         // "God"
  "verb_phrase",           // "created"
  "object_phrase",         // "the heaven and the earth"
  "quotation",             // Direct quotes from Tanakh
  "parallel_a",            // First part of parallel structure
  "parallel_b",            // Second part of parallel structure
  "commentary",            // Rabbinic commentary
  "question",              // Talmudic questions
  "answer",                // Talmudic answers
  "proof",                 // Proof text or reasoning
  "objection",             // Counter-arguments
  "resolution"             // Resolution of disputes
]);

export type SegmentType = z.infer<typeof SegmentTypeSchema>;

// Individual text segment
export const TextSegmentSchema = z.object({
  id: z.number(),
  start: z.number(),
  end: z.number(),
  text: z.string(),
  type: SegmentTypeSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  isParallel: z.boolean().optional()
});

export type TextSegment = z.infer<typeof TextSegmentSchema>;

// Boundary position for marker-based approach
export const BoundarySchema = z.object({
  position: z.number(),
  type: z.enum(["phrase", "clause", "sentence", "parallel"]),
  confidence: z.number().min(0).max(1).optional()
});

export type Boundary = z.infer<typeof BoundarySchema>;

// Segmentation result
export const SegmentationResultSchema = z.object({
  originalText: z.string(),
  checksum: z.string(),
  boundaries: z.array(BoundarySchema).optional(),
  segments: z.array(TextSegmentSchema),
  metadata: z.object({
    segmentationModel: z.string(),
    timestamp: z.string(),
    validationPassed: z.boolean(),
    approach: z.enum(["boundary_markers", "index_based", "span_based"]),
    language: z.enum(["hebrew", "english"]),
    textType: z.enum(["talmud", "biblical", "commentary"]),
    parallelStructures: z.array(z.object({
      segments: z.array(z.number()), // segment IDs
      type: z.enum(["contrast", "enumeration", "elaboration"])
    })).optional()
  })
});

export type SegmentationResult = z.infer<typeof SegmentationResultSchema>;

// LLM prompt configuration
export const SegmentationConfigSchema = z.object({
  model: z.string().default("gpt-4"),
  temperature: z.number().min(0).max(2).default(0.1),
  maxTokens: z.number().positive().default(1000),
  approach: z.enum(["boundary_markers", "index_based", "span_based"]).default("boundary_markers"),
  language: z.enum(["hebrew", "english"]),
  textType: z.enum(["talmud", "biblical", "commentary"]).default("talmud"),
  enableParallelDetection: z.boolean().default(true),
  contextExamples: z.array(z.object({
    text: z.string(),
    expectedSegments: z.array(TextSegmentSchema)
  })).optional()
});

export type SegmentationConfig = z.infer<typeof SegmentationConfigSchema>;

// Validation error types
export const ValidationErrorSchema = z.object({
  type: z.enum([
    "text_mismatch",
    "checksum_failure", 
    "invalid_boundaries",
    "overlapping_segments",
    "missing_segments",
    "malformed_output"
  ]),
  message: z.string(),
  position: z.number().optional(),
  segment: TextSegmentSchema.optional()
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// Multi-pass consensus result
export const ConsensusResultSchema = z.object({
  finalSegmentation: SegmentationResultSchema,
  agreementLevel: z.number().min(0).max(1),
  passResults: z.array(SegmentationResultSchema),
  conflictingBoundaries: z.array(z.object({
    position: z.number(),
    votes: z.array(z.object({
      model: z.string(),
      boundary: BoundarySchema
    }))
  }))
});

export type ConsensusResult = z.infer<typeof ConsensusResultSchema>;