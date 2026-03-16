/**
 * Example integration with existing bilingual display component
 * Shows how to integrate segmentation with current text display
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Layers } from 'lucide-react';
import { EnhancedTextProcessor } from '@/lib/enhanced-text-processor';
import { processHebrewText, processEnglishText } from '@/lib/text-processing';
import type { SegmentationResult } from '@shared/segmentation';

interface EnhancedBilingualDisplayProps {
  hebrewText: string;
  englishText: string;
  className?: string;
}

export function EnhancedBilingualDisplay({
  hebrewText,
  englishText,
  className = ""
}: EnhancedBilingualDisplayProps) {
  const [segmentationEnabled, setSegmentationEnabled] = useState(false);
  const [hebrewSegmentation, setHebrewSegmentation] = useState<SegmentationResult | null>(null);
  const [englishSegmentation, setEnglishSegmentation] = useState<SegmentationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleSegmentation = async () => {
    if (!segmentationEnabled) {
      setLoading(true);
      try {
        // Process both Hebrew and English with segmentation
        const [hebrewResult, englishResult] = await Promise.all([
          EnhancedTextProcessor.processHebrewWithSegmentation(hebrewText, {
            useConsensus: false,
            formatParallels: true
          }),
          EnhancedTextProcessor.processEnglishWithSegmentation(englishText, {
            useConsensus: false, 
            formatParallels: true
          })
        ]);

        setHebrewSegmentation(hebrewResult.segmentation || null);
        setEnglishSegmentation(englishResult.segmentation || null);
      } catch (error) {
        console.warn('Segmentation failed:', error);
      } finally {
        setLoading(false);
      }
    }
    
    setSegmentationEnabled(!segmentationEnabled);
  };

  const renderSegmentedText = (
    text: string, 
    segmentation: SegmentationResult | null,
    isHebrew: boolean
  ) => {
    if (!segmentationEnabled || !segmentation) {
      // Fall back to original processing
      return isHebrew ? processHebrewText(text) : processEnglishText(text);
    }

    return segmentation.segments.map((segment, index) => (
      <span
        key={segment.id}
        className={`
          inline-segment
          ${segment.type === 'speech_attribution' ? 'speech-attribution' : ''}
          ${segment.type === 'question' ? 'question-segment' : ''}
          ${segment.type === 'parallel_a' || segment.type === 'parallel_b' ? 'parallel-segment' : ''}
        `}
        title={`${segment.type || 'text'} (confidence: ${((segment.confidence || 0.8) * 100).toFixed(1)}%)`}
      >
        {segment.text}
        {index < segmentation.segments.length - 1 && ' '}
      </span>
    ));
  };

  const renderParallelStructures = (segmentation: SegmentationResult | null) => {
    if (!segmentation?.metadata.parallelStructures?.length) return null;

    return (
      <div className="parallel-structures mt-2 p-2 bg-blue-50 rounded text-xs">
        <div className="flex items-center gap-1 mb-1">
          <Layers className="h-3 w-3" />
          <span className="font-medium">Parallel Structures:</span>
        </div>
        {segmentation.metadata.parallelStructures.map((parallel, index) => (
          <Badge key={index} variant="secondary" className="mr-1 text-xs">
            {parallel.type}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className={`enhanced-bilingual-display ${className}`}>
      {/* Segmentation Control */}
      <div className="segmentation-controls flex items-center gap-2 mb-4 pb-2 border-b">
        <Button
          variant={segmentationEnabled ? "default" : "outline"}
          size="sm"
          onClick={toggleSegmentation}
          disabled={loading}
        >
          <Zap className="h-4 w-4 mr-1" />
          {segmentationEnabled ? 'Segmented View' : 'Enable Segmentation'}
        </Button>
        
        {segmentationEnabled && (hebrewSegmentation || englishSegmentation) && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {hebrewSegmentation && (
              <span>Hebrew: {hebrewSegmentation.segments.length} segments</span>
            )}
            {englishSegmentation && (
              <span>English: {englishSegmentation.segments.length} segments</span>
            )}
          </div>
        )}
      </div>

      {/* Text Display */}
      <div className="text-display grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hebrew Column */}
        <div className="hebrew-column">
          <div className="text-header flex items-center justify-between mb-2">
            <h3 className="font-semibold text-primary">Hebrew Text</h3>
            {hebrewSegmentation && (
              <Badge variant="outline" className="text-xs">
                {hebrewSegmentation.metadata.validationPassed ? 'Validated' : 'Issues'}
              </Badge>
            )}
          </div>
          
          <div className="hebrew-text text-right leading-relaxed">
            {renderSegmentedText(hebrewText, hebrewSegmentation, true)}
          </div>

          {renderParallelStructures(hebrewSegmentation)}
        </div>

        {/* English Column */}
        <div className="english-column">
          <div className="text-header flex items-center justify-between mb-2">
            <h3 className="font-semibold text-primary">English Translation</h3>
            {englishSegmentation && (
              <Badge variant="outline" className="text-xs">
                {englishSegmentation.metadata.validationPassed ? 'Validated' : 'Issues'}
              </Badge>
            )}
          </div>
          
          <div className="english-text leading-relaxed">
            {renderSegmentedText(englishText, englishSegmentation, false)}
          </div>

          {renderParallelStructures(englishSegmentation)}
        </div>
      </div>

      {/* Segmentation Metadata */}
      {segmentationEnabled && (hebrewSegmentation || englishSegmentation) && (
        <div className="segmentation-metadata mt-4 p-3 bg-gray-50 rounded text-xs">
          <div className="grid grid-cols-2 gap-4">
            {hebrewSegmentation && (
              <div>
                <div className="font-medium mb-1">Hebrew Segmentation:</div>
                <div>Model: {hebrewSegmentation.metadata.segmentationModel}</div>
                <div>Approach: {hebrewSegmentation.metadata.approach}</div>
                <div>Parallel structures: {hebrewSegmentation.metadata.parallelStructures?.length || 0}</div>
              </div>
            )}
            {englishSegmentation && (
              <div>
                <div className="font-medium mb-1">English Segmentation:</div>
                <div>Model: {englishSegmentation.metadata.segmentationModel}</div>
                <div>Approach: {englishSegmentation.metadata.approach}</div>
                <div>Parallel structures: {englishSegmentation.metadata.parallelStructures?.length || 0}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .inline-segment {
          transition: background-color 0.2s ease;
          padding: 1px 2px;
          border-radius: 2px;
        }

        .inline-segment:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }

        .speech-attribution {
          color: #dc2626;
          font-weight: 500;
        }

        .question-segment {
          color: #2563eb;
          font-style: italic;
        }

        .parallel-segment {
          background-color: rgba(34, 197, 94, 0.1);
          border-left: 2px solid rgba(34, 197, 94, 0.5);
          padding-left: 4px;
          margin-left: 2px;
        }

        .hebrew-text {
          font-family: 'David Libre', 'Times New Roman', serif;
          direction: rtl;
        }

        .english-text {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
          direction: ltr;
        }

        @media (max-width: 1024px) {
          .text-display {
            grid-template-columns: 1fr;
            gap: 4rem;
          }

          .hebrew-text, .english-text {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default EnhancedBilingualDisplay;