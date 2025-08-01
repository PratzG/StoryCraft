import express from 'express';
import fetch from 'node-fetch';
import { callPerplexityAPI } from '../services/perplexity.js';
import { exportToGoogleScript, formatStoryDataForExport } from '../services/googleScriptExport.js';
import { config } from '../config/index.js';
import { callDatabricksLLM } from '../services/databricks.js';

const router = express.Router();

// Customer validation endpoint
router.post('/validate-customer', async (req, res) => {
  try {
    const { customerDetails } = req.body;
    
    if (!customerDetails || !customerDetails.trim()) {
      return res.status(400).json({ error: 'Customer details are required' });
    }

    const prompt = `

You are a business research assistant. I will provide you with customer details, and you need to search for and validate information about this company.

- Pick the company you found closest to the entered information. Make sure to fix typos in name.
- If you find multiple possible companies, pick one with highest confience. High or medium
- If no one is a clear choice (higher confidence than others), then set all fields to "NA" and confidence to "low".
- Output only that in JSON format
- Do not provide multiple JSON results or extra narrative text outside of the JSON object.

Please search for the company and provide the following information in a structured JSON format:

{
  "companyName": "Company (exact match) or NA if confidence is low",
  "region": "Primary geographic region/country where they operate or NA if confidence is low",
  "industry": "Primary industry/sector: Ideally pick the main industry names or NA if confidence is low",
  "confidence": "high/medium/low - your confidence in the accuracy of this information",
  "additionalInfo": "Any relevant additional context about the company summarized in 30 words or less",
  "suggestions": "If the company name seems unclear, suggest the most likely correct company name. Leave empty if clear"
}

Customer details provided: ${customerDetails.trim()}
`;

    const data = await callPerplexityAPI(prompt, {
      temperature: 0.1,
      max_tokens: 800
    });

    res.json({response: data});
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

**Business Use Cases samples:**
- Main Data Specific business use cases applicable to ${industry} industry


Customer instruction/or content to analyze: ${customerContent.trim()}

POINTS TO REMEMBER -
Focus on identifying use cases that are explicitly mentioned or strongly implied in the customer's description, if available. 
Be specific about how each use case relates to their stated needs. 
If no business use cases are discussed in content shared, build based on your discretion and share at least 3 business use cases. Respond as JSON and nothing else.
`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.2,
      max_tokens: 1200
    });

    res.json({response}) ;
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

    const prompt = `You are a content analysis expert. I will provide you with customer notes and a specific use case name. 
    Your task is to extract only the content that directly relates to or references the given use case.

    Please analyze the content and return only the portions that are directly relevant to the specified use case. 
    If no relevant content is found, return "Insufficient data shared."

    Use Case: ${useCaseName.trim()}
    Customer Notes: ${customerNotes.trim()}

    Return only the filtered content that directly speaks about this use case, maintaining the original context and meaning.`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.1,
      max_tokens: 600
    });

    res.json({response});
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

    const useCaseTypeSpecificInstruction = {
      "Business Use Case": `
      - Problem: Business challenges, operational inefficiencies, market pressures
      - Solution: Data-driven business capabilities, AI/ML applications, decision-making improvements in context of problem and problem suggestions
      - Impact: 
        Business metrics - revenue growth, cost savings, operational efficiency, competitive advantage.
        Impact statements must include actual measurable values (percentages, savings, speed, performance metrics)
        If NO numeric values are present in customer content, impactConfidence MUST be 0.3 (do not exceed 0.3)
      `,
      "Platform Use Case": `
      - Problem: Technical challenges, infrastructure limitations, scalability issues
      - Solution: Databricks platform capabilities, technical architecture, modernization approach in context of problem and problem suggestions
      - Impact: 
        Technical metrics - performance gains, cost reduction, team productivity improvements. 
        Impact statements must include actual numeric metrics (e.g., 25% faster queries, $1M savings)
        If NO numeric values are found in customer content, impactConfidence MUST be 0.3 (do not exceed 0.3).
        `
    }

    const prompt = `
    You are a Databricks solutions expert creating customer success stories. 
    Analyze the provided customer content and generate three key story elements.

    **Content Requirements:**
    ${useCaseTypeSpecificInstruction[useCaseCategory.trim()]}

    **Critical Instructions:**
    1. Use past tense (the customer "faced", "implemented", "achieved").
    2. Confidence scores (0.0-1.0) reflect how well the provided content supports each section.
    3. In suggestions, provide specific suggestions for missing information in context of Databricks and the customer.
    4. **For the Impact section:**
      - If the content lacks numeric values, set "impactConfidence" to 0.3
      - Only include impact statements that directly come from customer content
    5. Only provide information present in the Customer Content Section.

    **Required JSON Response:**

    {
      "problemStatement": "Past tense description of the specific challenge the customer faced in a 30-35 word statement",
      "databricksSolution": "Past tense description of how customer solved the problem with Databricks capabilities, specifically addressing the pain points, in a 30-35 word statement", 
      "impact": "2 separate impact statements, each 10 words maximum, separated by || (double pipe). First impact statement || Second impact statement",
      "problemConfidence": 0.0-1.0,
      "solutionConfidence": 0.0-1.0,
      "impactConfidence": 0.0-1.0,
      "problemSuggestions": ["specific data needed"],
      "solutionSuggestions": ["specific data needed"],
      "impactSuggestions": ["specific data needed"]
    }

    **Analysis Context:**
    - Use Case: ${useCaseName.trim()}
    - Category: ${useCaseCategory.trim()}
    - Customer Content (Shared by me, the account executive): ${filteredContent.trim()}

    Return ONLY the JSON object. No extra text.
    `;

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
        You are a Databricks solutions expert tasked with improving customer success story content. 
        You will receive existing content and specific feedback about what's missing or needs improvement.
        Your task is to enhance the content by conducting online or local research to find relevant information that addresses the feedback. 
        Create a compelling 30-35 word statement in past tense describing the specific challenge the customer faced.

        **STRICT REQUIREMENTS:**
        - The "improvedContent" must be between 30 and 35 words (inclusive).
        - Count the words and ensure the statement is within range. If not, adjust until it fits.

        **Required JSON Response:
        {
          "improvedContent": "Enhanced content (30-35 words) in past tense.",
          "placeholdersUsed": ["List of placeholders used and what they represent"]
        }
      `,
      solution: `
        You are a Databricks solutions expert tasked with improving customer success story content. 
        You will receive existing content and specific feedback about what's missing or needs improvement.
        Your task is to enhance the content by conducting online or local research to find relevant information that addresses the feedback. 

        Create a compelling 30-35 word statement in past tense describing how Databricks solved the problem.

        **STRICT REQUIREMENTS:**
        - The "improvedContent" must be between 30 and 35 words (inclusive).
        - Count the words and ensure the statement is within range. If not, adjust until it fits.

        **Required JSON Response:
        {
          "improvedContent": "Enhanced content (30-35 words) in past tense describing how Databricks solved the problem.",
          "placeholdersUsed": ["List of placeholders used and what they represent"]
        }
      `,
      impact: `
        You are an expert business analyst tasked with improving content by incorporating quantifiable, benchmark-backed outcomes.

        **Step-by-Step Process:**
        1. Analyze currentContent and identify gaps based on AI feedback. Elevate conversation to business metrics.
        2. Define measurable variables depending on use case category
          - Platform Use Case - Cost, Productivity, Performance etc.
          - Business Use Case - Use case specific business KPI
        3. Use internal benchmarks or search or infer from external research (cite credible sources).
        4. Combine currentContent with quantified outcomes into improvedContent (two statements, max 10 words each).
        5. Provide reasoning in details (max 70 words).

        **Internal Benchmarks For Reference:
        1. Data engineer, analyst and scientist productivity gain 35%. Source: Databricks benchmarks and TEI report.
        2. ML use cases reach market faster by 30%. Source: Databricks benchmarks.
        3. Insight available to the end user 30% faster. Source: Databricks benchmarks.

        **Required JSON Response:**
        {
          "improvedContent": "Statement 1 (10 words max) || Statement 2 (10 words max)",
          "researchFindings": "Credible citations used (max 10 words each) separated by |",
          "placeholdersUsed": ["List of placeholders and their meaning"],
          "details": "Explain reasoning and logic, referencing benchmarks, max 60-70 words."
        }
      `
    };


    const prompt = `Main Instructions:
    ${sectionInstructions[section]}

    **Instructions:
    1. Analyze the existing content and feedback.
    2. Preserve all factual elements of the original content unless they are incorrect or irrelevant.
    3. Enhance and expand the original content by logically incorporating the feedback points, ensuring the improved version remains directly correlated to the original.
    4. If data is missing, fill gaps using research or XX-style placeholders.
    5. Follow the exact formatting requirements specified in the section instructions.
    6. Use past tense throughout.

    **Context:**
    - Section: ${section}
    - Current Content: ${currentContent.trim()}
    - AI Feedback: ${feedback.join('; ')}
    - Use Case: ${useCaseName.trim()}
    - Category: ${useCaseCategory.trim()}

    Focus on making the content more compelling and specific while maintaining accuracy. Address each feedback point.
    Make sure that there is clear and logical reference to current content in the improved content.
    Return ONLY the JSON object. No extra text.`;

    const data = await callPerplexityAPI(prompt, {
      temperature: 0.4,
      max_tokens: 1000
    });

    res.json({response: data});

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

    **Customer Context:
    - Company: ${useCaseData.customerInfo?.companyName || 'Customer'}
    - Industry: ${useCaseData.customerInfo?.industry || 'Technology'}
    - Region: ${useCaseData.customerInfo?.region || 'Global'}

    **Use Case Details:
    - Use Case: ${useCaseData.useCaseName}
    - Category: ${useCaseData.useCaseCategory}
    - Problem: ${useCaseData.problemStatement}
    - Solution: ${useCaseData.databricksSolution}
    - Impact: ${useCaseData.impact}

    **Requirements:
    1. **Summary**: Create a compelling 18-20 word summary that captures the essence of the success story
    2. **Detailed Story**: Write a 180-200 word narrative that tells the complete customer success story
    3. Seperate story into two segments with a new line, but do not add double new lines in story anywhere.

    **Story Structure for Detailed Story:
    - Start with customer context and challenge
    - Describe the Databricks solution implementation
    - Highlight the measurable impact and benefits
    - Use engaging, professional tone suitable for customer-facing materials
    - Focus on business value and outcomes

    Required JSON Response:
    {
      "summary": "18-20 word compelling summary of the customer success story",
      "detailedStory": "180-200 word detailed narrative of the complete customer success story"
    }

    Make the story compelling, professional, and focused on the customer's journey and achievements with Databricks.
    Return ONLY the JSON object. No extra text`;

    const response = await callPerplexityAPI(prompt, {
      temperature: 0.4,
      max_tokens: 600
    });

    res.json({ response: response.data });
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