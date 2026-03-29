/**
 * Segmented Text Display Component
 * Demonstrates LLM-based segmentation in the UI
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Eye, RefreshCw } from 'lucide-react';
import { EnhancedTextProcessor } from '@/lib/enhanced-text-processor';
import type { SegmentationResult } from '@shared/segmentation';

interface SegmentedTextDisplayProps {
  text: string;
  language?: 'hebrew' | 'english';
  textType?: 'talmud' | 'biblical' | 'commentary';
  showSegmentBoundaries?: boolean;
  showParallels?: boolean;
}

export function SegmentedTextDisplay({
  text,
  language = 'english',
  textType = 'talmud',
  showSegmentBoundaries = false,
  showParallels = true
}: SegmentedTextDisplayProps) {
  const [segmentation, setSegmentation] = useState<SegmentationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useConsensus, setUseConsensus] = useState(false);
  const [parallelFormatted, setParallelFormatted] = useState<string | null>(null);

  useEffect(() => {
    if (text) {
      performSegmentation();
    }
  }, [text, useConsensus]);

  const performSegmentation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await EnhancedTextProcessor.processWithSegmentation(text, {
        useConsensus,
        textType,
        formatParallels: showParallels
      });
      
      setSegmentation(result.segmentation || null);
      setParallelFormatted(result.parallelFormatted || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Segmentation failed');
    } finally {
      setLoading(false);
    }
  };

  const renderSegmentedText = () => {
    if (!segmentation) return text;

    return segmentation.segments.map((segment, index) => {
      const isParallel = segment.isParallel;
      const confidence = segment.confidence || 0.8;
      
      return (
        <span
          key={segment.id}
          className={`
            segment
            ${isParallel && showParallels ? 'parallel-segment' : ''}
            ${segment.type ? `segment-${segment.type}` : ''}
            ${confidence < 0.5 ? 'low-confidence' : ''}
            ${showSegmentBoundaries ? 'show-boundaries' : ''}
          `}
          data-segment-id={segment.id}
          data-confidence={confidence}
          title={`Type: ${segment.type || 'unknown'}, Confidence: ${(confidence * 100).toFixed(1)}%`}
        >
          {showSegmentBoundaries && index > 0 && (
            <span className="boundary-marker">|</span>
          )}
          {segment.text}
          {segment.type === 'question' && ' '}
        </span>
      );
    });
  };

  const renderParallelStructures = () => {
    if (!segmentation?.metadata.parallelStructures?.length || !showParallels) {
      return null;
    }

    return (
      <div className="parallel-structures mt-4">
        <h4 className="font-medium text-sm mb-2">Detected Parallel Structures:</h4>
        {segmentation.metadata.parallelStructures.map((parallel, index) => (
          <div key={index} className="parallel-structure mb-2 p-2 bg-blue-50 rounded">
            <Badge variant="outline" className="mb-1">{parallel.type}</Badge>
            <div className="text-sm">
              Segments: {parallel.segments.join(', ')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSegmentList = () => {
    if (!segmentation) return null;

    return (
      <div className="segment-list mt-4">
        <h4 className="font-medium text-sm mb-2">Segments ({segmentation.segments.length}):</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {segmentation.segments.map((segment) => (
            <div key={segment.id} className="text-xs p-2 bg-gray-50 rounded flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {segment.id}
              </Badge>
              <span className="flex-1 truncate">"{segment.text}"</span>
              <Badge variant="outline" className="text-xs">
                {segment.type || 'unknown'}
              </Badge>
              <span className="text-gray-500">
                {((segment.confidence || 0.8) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="segmented-text-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">LLM-Based Text Segmentation</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseConsensus(!useConsensus)}
              className={useConsensus ? 'bg-blue-50' : ''}
            >
              <Zap className="h-4 w-4 mr-1" />
              {useConsensus ? 'Consensus' : 'Single Pass'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={performSegmentation}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {segmentation && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Language: {language}</span>
            <span>Type: {textType}</span>
            <span>Model: {segmentation.metadata.segmentationModel}</span>
            <Badge variant={segmentation.metadata.validationPassed ? "default" : "destructive"}>
              {segmentation.metadata.validationPassed ? 'Valid' : 'Invalid'}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="error-message p-3 bg-red-50 border border-red-200 rounded mb-4 text-red-700 text-sm">
            <strong>Segmentation Error:</strong> {error}
          </div>
        )}

        <div className="segmented-text mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSegmentBoundaries(!showSegmentBoundaries)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showSegmentBoundaries ? 'Hide' : 'Show'} Boundaries
            </Button>
          </div>

          <div 
            className={`
              text-content p-4 bg-gray-50 rounded leading-relaxed
              ${language === 'hebrew' ? 'hebrew-text' : 'english-text'}
              ${showSegmentBoundaries ? 'show-segment-boundaries' : ''}
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Segmenting text...</span>
              </div>
            ) : (
              renderSegmentedText()
            )}
          </div>
        </div>

        {parallelFormatted && showParallels && (
          <div className="parallel-formatted mb-4">
            <h4 className="font-medium text-sm mb-2">Talmud Parallel Format:</h4>
            <pre className="text-sm bg-blue-50 p-3 rounded whitespace-pre-wrap">
              {parallelFormatted}
            </pre>
          </div>
        )}

        {renderParallelStructures()}
        {renderSegmentList()}

        {segmentation && (
          <div className="metadata mt-4 p-3 bg-gray-50 rounded text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>Approach: {segmentation.metadata.approach}</div>
              <div>Segments: {segmentation.segments.length}</div>
              <div>Boundaries: {segmentation.boundaries?.length || 0}</div>
              <div>Checksum: {segmentation.checksum.substring(0, 8)}...</div>
            </div>
          </div>
        )}
      </CardContent>

      <style jsx>{`
        .segment {
          transition: all 0.2s ease;
          border-radius: 2px;
          padding: 1px 2px;
        }

        .segment:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }

        .parallel-segment {
          background-color: rgba(34, 197, 94, 0.1);
          border-left: 2px solid rgba(34, 197, 94, 0.5);
          padding-left: 4px;
          margin-left: 2px;
        }

        .segment-speech_attribution {
          color: #dc2626;
          font-weight: 500;
        }

        .segment-question {
          color: #2563eb;
          font-style: italic;
        }

        .segment-result_clause {
          color: #059669;
        }

        .low-confidence {
          opacity: 0.7;
          border-bottom: 1px dotted #f59e0b;
        }

        .boundary-marker {
          color: #6b7280;
          font-weight: bold;
          margin: 0 2px;
        }

        .show-segment-boundaries .segment {
          border: 1px solid rgba(59, 130, 246, 0.3);
          margin: 2px;
          padding: 2px 4px;
        }

        .hebrew-text {
          direction: rtl;
          text-align: right;
          font-family: 'David Libre', 'Times New Roman', serif;
        }

        .english-text {
          direction: ltr;
          text-align: left;
        }
      `}</style>
    </Card>
  );
}

export default SegmentedTextDisplay;