import fetch from 'node-fetch';

/**
 * Export story data to Google Apps Script
 * @param {Array} storyData - Array of story objects matching the required schema
 */
export async function exportToGoogleScript(storyData) {
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1UdhWiITGucXc5H8Ut1uRxWfu5cXq3PtB6QBQLtD6jvvy3o2YSfRlPNIwcIK8DgMY/exec';
  
  // Validate input
  if (!storyData || !Array.isArray(storyData) || storyData.length === 0) {
    throw new Error('Story data is required and must be a non-empty array');
  }

  console.log('📤 Exporting story data to Google Apps Script:', {
    totalUseCases: storyData.length,
    useCases: storyData.map(data => data.description)
  });

  try {
    // Send all data in a single POST
    const formData = new URLSearchParams();
    formData.append('data', JSON.stringify(storyData));

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${responseText}`);
    }

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (result.status !== 'success') {
      throw new Error(result.message || 'Unknown error occurred');
    }

    console.log(`✅ Export successful: Deck created at ${result.url}`);
    return {
      success: true,
      totalExported: storyData.length,
      url: result.url
    };

  } catch (error) {
    console.error('💥 Google Apps Script export failed:', error);
    throw new Error(`Google Apps Script export failed: ${error.message}`);
  }
}

/**
 * Format story data for Google Apps Script export
 */
export function formatStoryDataForExport(storyGenerationResults, customerInfo, useCaseContents, aiResearchFindings = {}) {
  if (!Array.isArray(storyGenerationResults) || storyGenerationResults.length === 0) {
    throw new Error('Story generation results are required');
  }

  return storyGenerationResults.map(storyResult => {
    const useCaseKey = storyResult.useCaseKey;
    const useCaseContent = useCaseContents[useCaseKey] || {};
    const researchFindings = aiResearchFindings[useCaseKey] || [];
    
    // Parse use case name from key (format: "UseCaseName-Category")
    const useCaseName = useCaseKey.split('-').slice(0, -1).join('-') || 'Unknown Use Case';
    
    // Split impact into two statements
    const impactStatements = (useCaseContent.impact || '').split('||').map(s => s.trim()).filter(s => s.length > 0);
    const is1 = impactStatements[0] || '';
    const is2 = impactStatements[1] || '';
    
    // Consolidate AI recommendations/suggestions
    const allSuggestions = [
      ...(useCaseContent.problemSuggestions || []),
      ...(useCaseContent.solutionSuggestions || []),
      ...(useCaseContent.impactSuggestions || [])
    ].filter(suggestion => suggestion && suggestion.trim().length > 0);
    
    const notes = allSuggestions.length > 0 
      ? `AI Recommendations: ${allSuggestions.join('; ')}`
      : 'No specific AI recommendations provided.';
    
    // Consolidate research findings from AI edits
    const sources = Array.isArray(researchFindings) && researchFindings.length > 0
      ? researchFindings.join('; ')
      : 'No additional research sources used.';

    return {
      customerName: customerInfo?.companyName || 'Unknown Customer',
      description: useCaseName,
      databricksRole: storyResult.storyContent?.summary || '',
      challenge: useCaseContent.problemStatement || '',
      solution: useCaseContent.databricksSolution || '',
      is1: is1,
      is2: is2,
      notes: notes,
      story: storyResult.storyContent?.detailedStory || '',
      sources: sources
    };
  });
}

/**
 * Test function with sample data
 */
export async function testExport() {
  const sampleData = [
    {
      customerName: 'Acme Energy',
      description: 'Leading renewable energy producer',
      databricksRole: 'Data Platform Lead',
      challenge: 'Fragmented data silos',
      solution: 'Unified lakehouse on Databricks',
      is1: 'Predictive maintenance',
      is2: 'ETL automation',
      notes: 'Add quantitative targets (% uplift etc.)',
      story: 'Acme used Databricks to unify 5 disparate data lakes, cutting costs by 30%.',
      sources: 'Gartner Data Report 2024, Internal benchmarks'
    },
    {
      customerName: 'Globex Retail',
      description: 'Omni‑channel electronics retailer',
      databricksRole: 'Head of Analytics',
      challenge: 'Slow merchandising insights',
      solution: 'Real‑time sales analytics',
      is1: 'Dynamic pricing',
      is2: 'Stock‑out prediction',
      notes: 'Focus on reducing markdown losses',
      story: 'Globex reduced out-of-stock events by 20% in 3 months via Databricks-powered pipelines.',
      sources: 'McKinsey Retail 2024, Internal BI data'
    }
  ];

  try {
    const result = await exportToGoogleScript(sampleData);
    console.log('Test Export Result:', result);
  } catch (error) {
    console.error('Test Export Failed:', error);
  }
}