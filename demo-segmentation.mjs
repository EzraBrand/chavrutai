#!/usr/bin/env node

/**
 * Demo script for LLM-based segmentation pipeline
 * Tests the segmentation functionality with sample Talmud text
 */

// Import the segmentation functionality
import { 
  createSegmentationService,
  createConsensusSegmentation,
  formatTalmudParallels 
} from '../client/src/lib/segmentation/index.js';

// Sample Talmud texts for testing
const sampleTexts = {
  hebrew: "רבי יוחנן אמר מה שכתוב ויעש אלהים את שני המאורות הגדולים אבל הלא כתיב את המאור הגדול ואת המאור הקטן",
  english: "R' Yochanan said: What is the meaning of the verse 'And God made the two great lights'? But is it not written 'the great light and the small light'?",
  parallel: "One who studies Torah in this world - his Torah protects him. One who does not study Torah in this world - his Torah does not protect him."
};

async function testBasicSegmentation() {
  console.log('🔍 Testing Basic Segmentation\n');
  
  const service = createSegmentationService({
    language: 'english',
    textType: 'talmud',
    approach: 'boundary_markers'
  });

  try {
    const result = await service.segmentText(sampleTexts.english);
    
    console.log('✅ Segmentation successful!');
    console.log(`Original: ${result.originalText}`);
    console.log(`Segments (${result.segments.length}):`);
    
    result.segments.forEach(segment => {
      console.log(`  ${segment.id}: "${segment.text}" (${segment.type || 'unknown'})`);
    });
    
    console.log(`Validation: ${result.metadata.validationPassed ? '✅ Passed' : '❌ Failed'}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Basic segmentation failed:', error.message);
  }
}

async function testHebrewSegmentation() {
  console.log('🔍 Testing Hebrew Segmentation\n');
  
  const service = createSegmentationService({
    language: 'hebrew',
    textType: 'talmud',
    approach: 'boundary_markers'
  });

  try {
    const result = await service.segmentText(sampleTexts.hebrew);
    
    console.log('✅ Hebrew segmentation successful!');
    console.log(`Original: ${result.originalText}`);
    console.log(`Segments (${result.segments.length}):`);
    
    result.segments.forEach(segment => {
      console.log(`  ${segment.id}: "${segment.text}" (${segment.type || 'unknown'})`);
    });
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Hebrew segmentation failed:', error.message);
  }
}

async function testParallelDetection() {
  console.log('🔍 Testing Parallel Structure Detection\n');
  
  const service = createSegmentationService({
    language: 'english',
    textType: 'talmud',
    enableParallelDetection: true
  });

  try {
    const result = await service.segmentText(sampleTexts.parallel);
    
    console.log('✅ Parallel detection successful!');
    console.log(`Original: ${result.originalText}`);
    
    const formatted = formatTalmudParallels(result.segments);
    console.log('Formatted parallels:');
    console.log(formatted);
    
    if (result.metadata.parallelStructures && result.metadata.parallelStructures.length > 0) {
      console.log('Detected parallel structures:');
      result.metadata.parallelStructures.forEach(parallel => {
        console.log(`  Type: ${parallel.type}, Segments: ${parallel.segments.join(', ')}`);
      });
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Parallel detection failed:', error.message);
  }
}

async function testConsensusSegmentation() {
  console.log('🔍 Testing Consensus Segmentation\n');
  
  const consensus = createConsensusSegmentation({
    language: 'english',
    textType: 'talmud'
  });

  try {
    const result = await consensus.segmentWithConsensus(sampleTexts.english, 3);
    
    console.log('✅ Consensus segmentation successful!');
    console.log(`Agreement level: ${(result.agreementLevel * 100).toFixed(1)}%`);
    console.log(`Conflicting boundaries: ${result.conflictingBoundaries.length}`);
    console.log(`Final segments: ${result.finalSegmentation.segments.length}`);
    
    console.log('Final segmentation:');
    result.finalSegmentation.segments.forEach(segment => {
      console.log(`  ${segment.id}: "${segment.text}"`);
    });
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Consensus segmentation failed:', error.message);
  }
}

async function runDemo() {
  console.log('🚀 LLM-Based Talmud Segmentation Pipeline Demo\n');
  console.log('===============================================\n');
  
  await testBasicSegmentation();
  await testHebrewSegmentation();
  await testParallelDetection();
  await testConsensusSegmentation();
  
  console.log('🎉 Demo completed!\n');
  console.log('Note: This demo uses mock LLM responses for testing.');
  console.log('In production, integrate with actual LLM services like OpenAI or Anthropic.');
}

// Run the demo
runDemo().catch(console.error);