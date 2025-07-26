import express from 'express';
import fetch from 'node-fetch';
import { callPerplexityAPI } from '../services/perplexity.js';
import { exportToGoogleScript, formatStoryDataForExport } from '../services/googleScriptExport.js';
import { config } from '../config/index.js';

const router = express.Router();

// Customer validation endpoint
router.post('/validate-customer', async (req, res) => {
  try {
    const { customerDetails } = req.body;
    
    if (!customerDetails || !customerDetails.trim()) {
      return res.status(400).json({ error: 'Customer details are required' });
    }

    const prompt = `You are a business research assistant. I will provide you with customer details, and you need to search for and validate information about this company.

Please search for the company and provide the following information in a structured JSON format (if confidence is high):

{
  "companyName": "Popular company name",
  "region": "Primary geographic region/country where they operate",
  "industry": "Primary industry/sector: Ideally pick the main industry names",
  "confidence": "high/medium/low - your confidence in the accuracy of this information",
  "additionalInfo": "Any relevant additional context about the company in 30 wrods or less",
  "suggestions": "If the company name seems unclear, suggest the most likely correct company name. Leave empty if clear"
}

Customer details provided: ${customerDetails.trim()}

If you cannot find reliable information about this company, set confidence to "low" and explain what additional details would help identify the company more accurately.
If confidence is low, also set company name, region, additional info and industry to "NA".
Focus on finding the most current and accurate information available.`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.1,
      max_tokens: 800
    });

    res.json({ response });
  } catch (error) {
    console.error('Customer validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use case analysis endpoint
router.post('/analyze-use-cases', async (req, res) => {
  try {
    const { customerContent, industry } = req.body;
    
    if (!customerContent || !customerContent.trim()) {
      return res.status(400).json({ error: 'Customer content is required' });
    }

    console.log("Inside the API: "+industry);

    const prompt = `You are a Databricks solutions expert. I will provide you with customer content describing their use cases in free flow notes. Your task is to analyze this content and identify which specific Databricks use cases are being mentioned.

Please analyze the content and return a JSON response with the following structure:

{
  "identifiedUseCases": [
    {
      "category": "Platform Use Case" or "Business Use Case",
      "name": "Specific use case name in 5 words or less",
      "description": "Brief description of the use case in 15 words or less with context within ${industry} industry",
      "confidence": "high/medium/low"
    }
  ],
  "summary": "Brief summary of the overall data shared. Keep less than 20 words"
}

Here are examples of Databricks use cases to look for:

**Platform Use Cases are limited to -
- Data Warehousing: Modern data warehouse, data lakehouse architecture, SQL analytics
- AI Factory: Churning out AI use cases in quick succession
- <Workload> Migration or Migration from <Incumbent Technology>

**Business Use Cases should include:**
- Main business use cases applicable to ${industry} industry


Customer instruction/or content to analyze: ${customerContent.trim()}

POINTS TO REMEMBER -
Focus on identifying use cases that are explicitly mentioned or strongly implied in the customer's description, if available. 
Be specific about how each use case relates to their stated needs. 
If any single use case has both business or platform angle, prioritize business use case name. 
If no use case is discussed in content shared, build based on your discretion and share at least 3 business use cases and 2 platform use cases
`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.2,
      max_tokens: 1200
    });

    res.json({ response });
  } catch (error) {
    console.error('Use case analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Content filtering endpoint
router.post('/filter-content', async (req, res) => {
  try {
    const { useCaseName, customerNotes } = req.body;
    
    if (!useCaseName || !customerNotes || !useCaseName.trim() || !customerNotes.trim()) {
      return res.status(400).json({ error: 'Use case name and customer notes are required' });
    }

    const prompt = `You are a content analysis expert. I will provide you with customer notes and a specific use case name. Your task is to extract only the content that directly relates to or references the given use case.

Please analyze the content and return only the portions that are directly relevant to the specified use case. If no relevant content is found, return "No specific content found for this use case."

Use Case: ${useCaseName.trim()}
Customer Notes: ${customerNotes.trim()}

Return only the filtered content that directly speaks about this use case, maintaining the original context and meaning.`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.1,
      max_tokens: 600
    });

    res.json({ response });
  } catch (error) {
    console.error('Content filtering error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Content generation endpoint
router.post('/generate-content', async (req, res) => {
  try {
    const { useCaseName, useCaseCategory, filteredContent } = req.body;
    
    if (!useCaseName || !useCaseCategory || !filteredContent || 
        !useCaseName.trim() || !useCaseCategory.trim() || !filteredContent.trim()) {
      return res.status(400).json({ error: 'Use case name, category, and filtered content are required' });
    }

    const prompt = `You are a Databricks solutions expert creating customer success stories. Analyze the provided customer content and generate three key story elements with confidence scores based on how well the content supports each section.

**Content Requirements by Use Case Type:**

**For Platform Use Cases:**
- Problem: Technical challenges, infrastructure limitations, scalability issues
- Solution: Databricks platform capabilities, technical architecture, modernization approach
- Impact: Technical metrics - performance gains, cost reduction, team productivity improvements. All Impact statements should be measurable with numbers.

**For Business Use Cases:**
- Problem: Business challenges, operational inefficiencies, market pressures
- Solution: Data-driven business capabilities, AI/ML applications, decision-making improvements  
- Impact: Business metrics - revenue growth, cost savings, operational efficiency, competitive advantage. Impact statements should be measurable with numbers.

**Critical Instructions:**
1. Use past tense (the customer "faced", "implemented", "achieved")
2. Confidence scores (0.0-1.0) reflect how well the provided content supports each section
3. If confidence < 0.7, provide specific suggestions for missing information
4. If Impact section does not have numbers, Impact section's confidence is always below 0.5

**Required JSON Response:**

{
  "problemStatement": "Past tense description of the specific challenge the customer faced in a 35-40 word statement",
  "databricksSolution": "Past tense description of how Databricks solved the problem in a 35-40 word statement", 
  "impact": "First 20-word impact statement||Second 20-word impact statement",
  "problemConfidence": 0.0-1.0,
  "solutionConfidence": 0.0-1.0,
  "impactConfidence": 0.0-1.0,
  "problemSuggestions": ["specific data needed if confidence < 0.7"],
  "solutionSuggestions": ["specific data needed if confidence < 0.7"],
  "impactSuggestions": ["specific data needed if confidence < 0.7"]
}

**Analysis Context:**
- Use Case: ${useCaseName.trim()}
- Category: ${useCaseCategory.trim()}
- Customer Content: ${filteredContent.trim()}`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.3,
      max_tokens: 1500
    });

    res.json({ response });
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI edit content endpoint
router.post('/ai-edit-content', async (req, res) => {
  try {
    const { section, currentContent, feedback, useCaseName, useCaseCategory } = req.body;
    
    if (!section || !currentContent || !feedback || !useCaseName || !useCaseCategory ||
        !currentContent.trim() || !Array.isArray(feedback) || feedback.length === 0) {
      return res.status(400).json({ error: 'All fields are required and feedback must be a non-empty array' });
    }

    const sectionInstructions = {
      problem: `
                Create a compelling 35-40 word statement in past tense describing the specific challenge the customer faced.

                **Required JSON Response:**
                {
                  "improvedContent": "Enhanced content that addresses the feedback points in a compelling 35-40 word statement in past tense describing how Databricks solved the problem.",
                  "researchFindings": "Research sources sperated by a |. Example: A | B | C etc.",
                  "placeholdersUsed": ["List of any placeholders used and what they represent"]
                }
      `,
      solution: `
                Create a compelling 35-40 word statement in past tense describing how Databricks solved the problem.

                **Required JSON Response:**
                {
                  "improvedContent": "Enhanced content that addresses the feedback points in a compelling 35-40 word statement in past tense describing how Databricks solved the problem.",
                  "researchFindings": "Research sources sperated by a |. Example: A | B | C etc.",
                  "placeholdersUsed": ["List of any placeholders used and what they represent"]
                }
      `,
      impact: `                
                **Required JSON Response:**
                {
                  "improvedContent": "Enhanced content that addresses the feedback points as 2 separate impact statements, each 20 words maximum, separated by || (double pipe). Each statement should describe one measurable outcomes and one kpi in past tense.",
                  "researchFindings": "Research sources sperated by a |. Example: A | B | C etc.",
                  "placeholdersUsed": ["List of any placeholders used and what they represent"]
                }

                Internal Benchmarks - 
                1. Data team (DE DA and DS) productivity gain 35%. Source: Databricks internal benchmarks and TEI report.
                2. Estimated Time to market improvement 30%. Source: Databricks internal benchmarks.
                3. Estimate Faster time to insight imrovement 30%. Source: Databricks internal benchmarks

                Use placeholders when specific data isn't available:
                - Performance improvements: "XX% faster processing"
                - Cost savings: "$XX,XXX cost reduction" 
                - Time savings: "XX hours saved per week"
                - Revenue impact: "$XX million revenue increase"
                - Efficiency gains: "XX% improvement in efficiency"
      `
    };

    const prompt = `You are a Databricks solutions expert tasked with improving customer success story content based on AI feedback. You will receive existing content and specific feedback about what's missing or needs improvement.
Your task is to enhance the content by conducting online research to find relevant information that addresses the feedback. If specific data cannot be found through research, use XX style placeholders.

${sectionInstructions[section]}

**Instructions:**
1. Analyze the existing content and feedback
2. Research relevant information to address the feedback points
3. Follow the exact formatting requirements above
4. Use past tense throughout

**Context:**
- Section: ${section}
- Current Content: ${currentContent.trim()}
- AI Feedback: ${feedback.join('; ')}
- Use Case: ${useCaseName.trim()}
- Category: ${useCaseCategory.trim()}

Focus on making the content more compelling and specific while maintaining accuracy. Address each feedback point systematically.`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.4,
      max_tokens: 600
    });

    res.json({ response });
  } catch (error) {
    console.error('AI edit content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Story generation endpoint
router.post('/generate-story', async (req, res) => {
  try {
    const { useCaseData } = req.body;
    
    if (!useCaseData || !useCaseData.useCaseName || !useCaseData.problemStatement || 
        !useCaseData.databricksSolution || !useCaseData.impact) {
      return res.status(400).json({ error: 'Complete use case data is required' });
    }

    const prompt = `You are a Databricks marketing expert creating compelling customer success stories. Based on the provided use case data, generate both a concise summary and a detailed story.

**Customer Context:**
- Company: ${useCaseData.customerInfo?.companyName || 'Customer'}
- Industry: ${useCaseData.customerInfo?.industry || 'Technology'}
- Region: ${useCaseData.customerInfo?.region || 'Global'}

**Use Case Details:**
- Use Case: ${useCaseData.useCaseName}
- Category: ${useCaseData.useCaseCategory}
- Problem: ${useCaseData.problemStatement}
- Solution: ${useCaseData.databricksSolution}
- Impact: ${useCaseData.impact}

**Requirements:**
1. **Summary**: Create a compelling 20-22 word summary that captures the essence of the success story
2. **Detailed Story**: Write a 200-250 word narrative that tells the complete customer success story

**Story Structure for Detailed Story:**
- Start with customer context and challenge
- Describe the Databricks solution implementation
- Highlight the measurable impact and benefits
- Use engaging, professional tone suitable for customer-facing materials
- Focus on business value and outcomes

**Required JSON Response:**
{
  "summary": "20-25 word compelling summary of the customer success story",
  "detailedStory": "200-250 word detailed narrative of the complete customer success story"
}

Make the story compelling, professional, and focused on the customer's journey and achievements with Databricks.`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.4,
      max_tokens: 600
    });

    res.json({ response });
  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export stories to Google Apps Script
router.post('/export-stories', async (req, res) => {
  try {
    const { storyGenerationResults, customerInfo, useCaseContents, aiResearchFindings } = req.body;
    
    if (!storyGenerationResults || !Array.isArray(storyGenerationResults) || storyGenerationResults.length === 0) {
      return res.status(400).json({ error: 'Story generation results are required' });
    }

    console.log('📥 Received export request:', {
      storiesCount: storyGenerationResults.length,
      customerInfo: customerInfo?.companyName,
      useCaseContentsKeys: Object.keys(useCaseContents || {}),
      aiResearchKeys: Object.keys(aiResearchFindings || {})
    });

    // Format the data for Google Apps Script
    const formattedData = formatStoryDataForExport(
      storyGenerationResults,
      customerInfo,
      useCaseContents || {},
      aiResearchFindings || {}
    );

    // Export to Google Apps Script
    const exportResult = await exportToGoogleScript(formattedData);

    console.log('✅ Export completed successfully:', exportResult);

    res.json({
      success: true,
      message: `Successfully exported ${exportResult.totalExported} use case stories`,
      exportResult
    });

  } catch (error) {
    console.error('Export to Google Apps Script failed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Value story endpoint (existing Google Apps Script proxy)
router.post('/value-story', async (req, res) => {
  console.log('Incoming payload →', req.body);

  try {
    // Apps Script expects URL-encoded form data
    const form = new URLSearchParams();
    Object.entries(req.body).forEach(([k, v]) => form.append(k, v ?? ''));

    const rsp = await fetch(config.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });

    const raw = await rsp.text();
    console.log('← Apps Script status', rsp.status, raw);

    // Try to parse JSON; fall back to passthrough text
    let payload;
    try { 
      payload = JSON.parse(raw); 
    } catch { 
      payload = { status: 'error', message: 'Non-JSON response', raw }; 
    }

    res.json(payload);

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err?.message ?? 'Unknown' });
  }
});

export default router;