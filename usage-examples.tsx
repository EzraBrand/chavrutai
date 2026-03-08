/**
 * Usage Example: How to integrate segmentation with existing Talmud pages
 * This shows the minimal changes needed to add segmentation to current pages
 */

import React from 'react';
import { EnhancedBilingualDisplay } from '@/components/text/enhanced-bilingual-display';
import { SegmentedTextDisplay } from '@/components/text/segmented-text-display';

// Example: Enhanced Talmud Page with Segmentation
export function ExampleTalmudPageWithSegmentation() {
  // Sample Talmud text (would come from API in real usage)
  const hebrewText = "רבי יוחנן אמר מאי דכתיב ויעש אלהים את שני המאורות הגדולים והא כתיב את המאור הגדול ואת המאור הקטן";
  const englishText = "R' Yochanan said: What is the meaning of the verse 'And God made the two great lights'? But is it not written 'the great light and the small light'?";

  return (
    <div className="talmud-page">
      <h1>Berakhot 2a - Enhanced with Segmentation</h1>
      
      {/* Option 1: Enhanced bilingual display with segmentation toggle */}
      <section className="main-text">
        <EnhancedBilingualDisplay
          hebrewText={hebrewText}
          englishText={englishText}
        />
      </section>

      {/* Option 2: Standalone segmented text display for analysis */}
      <section className="segmentation-analysis mt-8">
        <h2 className="text-xl font-semibold mb-4">Segmentation Analysis</h2>
        <SegmentedTextDisplay
          text={englishText}
          language="english"
          textType="talmud"
          showSegmentBoundaries={true}
          showParallels={true}
        />
      </section>
    </div>
  );
}

// Example: How to modify existing SectionedBilingualDisplay
export function enhanceExistingComponent() {
  /*
  To enhance existing components with segmentation:

  1. Add segmentation imports:
     import { EnhancedTextProcessor } from '@/lib/enhanced-text-processor';

  2. Add state for segmentation:
     const [segmentationResult, setSegmentationResult] = useState(null);

  3. Add segmentation processing:
     const processTextWithSegmentation = async (text, language) => {
       try {
         const result = await EnhancedTextProcessor.processWithSegmentation(text, {
           textType: 'talmud',
           language,
           formatParallels: true
         });
         setSegmentationResult(result);
         return result.processedText;
       } catch (error) {
         // Fall back to existing processing
         return language === 'hebrew' ? processHebrewText(text) : processEnglishText(text);
       }
     };

  4. Add segmentation toggle UI:
     <Button onClick={toggleSegmentation}>
       Enable LLM Segmentation
     </Button>

  5. Render segmented text:
     {segmentationResult?.segmentation ? 
       renderSegmentedText(segmentationResult.segmentation) : 
       originalText
     }
  */
}

// Example: Server-side integration for caching segmentation results
export function serverSideIntegration() {
  /*
  For server-side integration, add to routes.ts:

  1. Import segmentation service:
     import { createSegmentationService } from '../client/src/lib/segmentation';

  2. Add segmentation endpoint:
     app.post('/api/segment-text', async (req, res) => {
       const { text, language, textType } = req.body;
       
       try {
         const service = createSegmentationService({
           language,
           textType,
           // Add actual LLM API key here
         });
         
         const result = await service.segmentText(text);
         res.json(result);
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
     });

  3. Cache segmentation results in database:
     - Add segmentation column to texts table
     - Store segmentation results alongside text
     - Invalidate cache when segmentation improves

  4. Add to existing text fetching:
     const text = await storage.getText(work, tractate, chapter, folio, side);
     
     // If segmentation not cached, generate it
     if (!text.segmentation) {
       text.segmentation = await segmentText(text.englishText);
       await storage.updateTextSegmentation(text.id, text.segmentation);
     }
  */
}

export default ExampleTalmudPageWithSegmentation;