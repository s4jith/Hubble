/**
 * AI Service Usage Examples
 * 
 * This file demonstrates how to use the multi-stage AI content moderation system.
 */

import { aiService, keywordClassifier } from './index';
import { AbuseCategory } from '../../config/constants';

/**
 * Example 1: Basic Text Analysis
 */
async function example1_BasicTextAnalysis() {
  console.log('\n=== Example 1: Basic Text Analysis ===\n');
  
  const texts = [
    "Hello, how are you today?",
    "You're such a loser, nobody likes you",
    "I'm going to hurt you badly",
    "This is a great day!"
  ];

  for (const text of texts) {
    const result = await aiService.analyzeText(text);
    
    console.log(`Text: "${text}"`);
    console.log(`  Abusive: ${result.isAbusive}`);
    console.log(`  Severity: ${result.severityScore}/100`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Categories: ${result.categories.join(', ') || 'None'}`);
    console.log(`  Method: ${result.analysisMethod}`);
    console.log('');
  }
}

/**
 * Example 2: Keyword Classification Only
 */
function example2_KeywordClassification() {
  console.log('\n=== Example 2: Keyword Classification ===\n');
  
  const text = "You're ugly and nobody likes you, loser!";
  const result = keywordClassifier.classify(text);
  
  console.log(`Text: "${text}"`);
  console.log(`  Abusive: ${result.isAbusive}`);
  console.log(`  Categories: ${result.detectedCategories.join(', ')}`);
  console.log(`  Matched Keywords: ${result.matchedKeywords.join(', ')}`);
  console.log(`  Severity: ${result.severityScore}/100`);
  console.log(`  Needs Advanced Analysis: ${result.needsAdvancedAnalysis}`);
  console.log('');
}

/**
 * Example 3: Image Analysis
 */
async function example3_ImageAnalysis() {
  console.log('\n=== Example 3: Image Analysis ===\n');
  
  // Example with a base64 image or URL
  const imageUrl = 'https://example.com/image.jpg';
  
  try {
    const result = await aiService.analyzeImage(imageUrl);
    
    console.log('Image Analysis Result:');
    console.log(`  Abusive: ${result.isAbusive}`);
    console.log(`  Severity: ${result.severityScore}/100`);
    console.log(`  Categories: ${result.categories.join(', ') || 'None'}`);
    console.log(`  Method: ${result.analysisMethod}`);
    
    if (result.geminiAnalysis) {
      console.log(`  Explanation: ${result.geminiAnalysis.explanation}`);
    }
  } catch (error) {
    console.log('  Error:', error);
  }
  console.log('');
}

/**
 * Example 4: Adding Custom Keywords
 */
function example4_CustomKeywords() {
  console.log('\n=== Example 4: Adding Custom Keywords ===\n');
  
  // Add custom keywords for your specific use case
  keywordClassifier.addKeywords(AbuseCategory.HARASSMENT, [
    'custom_insult',
    'another_bad_word',
    'specific_term'
  ]);
  
  console.log('Custom keywords added to HARASSMENT category');
  
  // Test with custom keyword
  const result = keywordClassifier.classify("You're such a custom_insult!");
  console.log(`  Detected: ${result.isAbusive}`);
  console.log(`  Matched: ${result.matchedKeywords.join(', ')}`);
  console.log('');
}

/**
 * Example 5: Handling Different Severity Levels
 */
async function example5_SeverityLevels() {
  console.log('\n=== Example 5: Severity Levels ===\n');
  
  const messages = [
    { text: "damn", expected: "Low" },
    { text: "you're stupid", expected: "Medium" },
    { text: "I hate you, go kill yourself", expected: "High" },
    { text: "I will find you and hurt you", expected: "Critical" }
  ];

  for (const msg of messages) {
    const result = await aiService.analyzeText(msg.text);
    
    let severityLabel = 'Safe';
    if (result.severityScore >= 90) severityLabel = 'Critical';
    else if (result.severityScore >= 70) severityLabel = 'High';
    else if (result.severityScore >= 40) severityLabel = 'Medium';
    else if (result.severityScore > 0) severityLabel = 'Low';
    
    console.log(`Text: "${msg.text}"`);
    console.log(`  Expected: ${msg.expected}`);
    console.log(`  Detected: ${severityLabel} (${result.severityScore}/100)`);
    console.log('');
  }
}

/**
 * Example 6: Real-world Scan Workflow
 */
async function example6_RealWorldWorkflow() {
  console.log('\n=== Example 6: Real-world Workflow ===\n');
  
  // Simulate a message from a child user
  const message = "My friend said I should just end it all because nobody cares";
  
  console.log('Analyzing message from child user...');
  console.log(`Message: "${message}"\n`);
  
  // Step 1: Keyword screening
  const keywordResult = keywordClassifier.classify(message);
  console.log('Step 1 - Keyword Screening:');
  console.log(`  Found keywords: ${keywordResult.matchedKeywords.join(', ')}`);
  console.log(`  Categories: ${keywordResult.detectedCategories.join(', ')}`);
  console.log(`  Needs AI verification: ${keywordResult.needsAdvancedAnalysis}`);
  console.log('');
  
  // Step 2: Full AI analysis
  const aiResult = await aiService.analyzeText(message);
  console.log('Step 2 - AI Analysis:');
  console.log(`  Is Abusive: ${aiResult.isAbusive}`);
  console.log(`  Severity: ${aiResult.severityScore}/100`);
  console.log(`  Threat Detected: ${aiResult.threatDetected}`);
  console.log(`  Analysis Method: ${aiResult.analysisMethod}`);
  console.log('');
  
  // Step 3: Determine action
  console.log('Step 3 - Recommended Actions:');
  if (aiResult.threatDetected) {
    console.log('  🚨 CRITICAL: Notify parent immediately');
    console.log('  🚨 Create high-priority alert');
    console.log('  🚨 Consider emergency services notification');
  } else if (aiResult.isAbusive && aiResult.severityScore >= 70) {
    console.log('  ⚠️  HIGH: Send alert to parent');
    console.log('  ⚠️  Add to incident log');
  } else if (aiResult.isAbusive) {
    console.log('  ℹ️  MEDIUM: Log for parent review');
  } else {
    console.log('  ✅ SAFE: No action needed');
  }
  console.log('');
}

/**
 * Example 7: Performance Comparison
 */
async function example7_Performance() {
  console.log('\n=== Example 7: Performance Comparison ===\n');
  
  const text = "You're an idiot and everyone hates you";
  
  // Keyword-only timing
  const keywordStart = Date.now();
  const keywordResult = keywordClassifier.classify(text);
  const keywordTime = Date.now() - keywordStart;
  
  // Full AI timing
  const aiStart = Date.now();
  const aiResult = await aiService.analyzeText(text);
  const aiTime = Date.now() - aiStart;
  
  console.log('Performance Metrics:');
  console.log(`  Keyword Classification: ${keywordTime}ms`);
  console.log(`  Full AI Analysis: ${aiTime}ms`);
  console.log(`  Speed Improvement: ${(aiTime / keywordTime).toFixed(1)}x faster`);
  console.log('');
  console.log(`  Keyword Result: ${keywordResult.isAbusive}`);
  console.log(`  AI Result: ${aiResult.isAbusive}`);
  console.log(`  Method Used: ${aiResult.analysisMethod}`);
  console.log('');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   AI Content Moderation System Examples   ║');
  console.log('╚════════════════════════════════════════════╝');
  
  // Note: These examples will work when the service is properly configured
  // with Gemini API keys or in mock mode
  
  try {
    // Basic examples
    example2_KeywordClassification();
    example4_CustomKeywords();
    
    // Examples requiring AI service (may fail without API keys)
    // await example1_BasicTextAnalysis();
    // await example3_ImageAnalysis();
    // await example5_SeverityLevels();
    // await example6_RealWorldWorkflow();
    // await example7_Performance();
    
    console.log('\n✅ Examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Export functions for testing
export {
  example1_BasicTextAnalysis,
  example2_KeywordClassification,
  example3_ImageAnalysis,
  example4_CustomKeywords,
  example5_SeverityLevels,
  example6_RealWorldWorkflow,
  example7_Performance,
  runAllExamples
};

// Uncomment to run examples directly
// runAllExamples();
