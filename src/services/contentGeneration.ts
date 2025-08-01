import { extractJsonFromResponse } from '../utils/repairJSON';

export interface AIEditResult {
  improvedContent: string;
  researchFindings: string;
  placeholdersUsed: string[];
  details: string;
}

export interface GeneratedContent {
  problemStatement: string;
  databricksSolution: string;
  impact: string;
  problemConfidence: number;
  solutionConfidence: number;
  impactConfidence: number;
  problemSuggestions: string[];
  solutionSuggestions: string[];
  impactSuggestions: string[];
}

export interface ContentGenerationState {
  isGenerating: boolean;
  result: GeneratedContent | null;
  error: string | null;
}

/**
 * Filters customer notes to extract content relevant to a specific use case
 */
export async function filterUseCaseContent(
  useCaseName: string,
  customerNotes: string
): Promise<string> {
  if (!useCaseName.trim() || !customerNotes.trim()) {
    throw new Error('Use case name and customer notes are required');
  }

  try {
    const response = await fetch('/api/filter-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        useCaseName: useCaseName.trim(),
        customerNotes: customerNotes.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Content filtering failed: ${error.message}`);
    }
    throw new Error('Content filtering failed: Unknown error occurred');
  }
}

/**
 * Generates structured content for a use case based on filtered customer content
 */
export async function generateUseCaseContent(
  useCaseName: string,
  useCaseCategory: string,
  filteredContent: string
): Promise<GeneratedContent> {
  if (!useCaseName.trim() || !useCaseCategory.trim() || !filteredContent.trim()) {
    throw new Error('Use case name, category, and filtered content are required');
  }

  try {
    const response = await fetch('/api/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        useCaseName: useCaseName.trim(),
        useCaseCategory: useCaseCategory.trim(),
        filteredContent: filteredContent.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const apiResponse = data.response;

    // Try to parse JSON response
    let generatedContent: GeneratedContent;
    
    try {
      generatedContent = extractJsonFromResponse(apiResponse);
    } catch (parseError) {
      const isPlatformUseCase = useCaseCategory.toLowerCase().includes('platform');
      
      generatedContent = {
        problemStatement: 'Unable to generate problem statement from provided content.',
        databricksSolution: 'Unable to generate solution description from provided content.',
        impact: 'Unable to generate impact statement from provided content.',
        problemConfidence: 0.2,
        solutionConfidence: 0.2,
        impactConfidence: 0.2,
        problemSuggestions: [
          isPlatformUseCase 
            ? 'Please provide more specific details about technical challenges and infrastructure limitations'
            : 'Please provide more specific details about business challenges and operational inefficiencies'
        ],
        solutionSuggestions: [
          isPlatformUseCase
            ? 'Please describe specific Databricks platform features and technical capabilities used'
            : 'Please describe how Databricks enabled specific business outcomes through data and AI'
        ],
        impactSuggestions: [
          isPlatformUseCase
            ? 'Please include technical metrics like cost reduction, performance improvements, or team productivity gains'
            : 'Please include business metrics like revenue impact, KPI improvements, or operational efficiency gains'
        ]
      };
    }

    // Validate required fields
    if (!generatedContent.problemStatement || !generatedContent.databricksSolution || !generatedContent.impact) {
      throw new Error('Incomplete content generation response received');
      console.log(JSON.stringify(generatedContent));
    }

    // Ensure confidence scores are within valid range
    const validateScore = (score: number) => 
      typeof score === 'number' && score >= 0 && score <= 1 ? score : 0.5;
    
    generatedContent.problemConfidence = validateScore(generatedContent.problemConfidence);
    generatedContent.solutionConfidence = validateScore(generatedContent.solutionConfidence);
    generatedContent.impactConfidence = validateScore(generatedContent.impactConfidence);
    
    // Ensure suggestions are arrays
    const ensureArray = (suggestions: any) => 
      Array.isArray(suggestions) ? suggestions : [];
    
    generatedContent.problemSuggestions = ensureArray(generatedContent.problemSuggestions);
    generatedContent.solutionSuggestions = ensureArray(generatedContent.solutionSuggestions);
    generatedContent.impactSuggestions = ensureArray(generatedContent.impactSuggestions);

    return generatedContent;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Content generation failed: ${error.message}`);
    }
    throw new Error('Content generation failed: Unknown error occurred');
  }
}

/**
 * Complete workflow: filter content and generate structured use case content
 */
export async function processUseCaseContent(
  useCaseName: string,
  useCaseCategory: string,
  customerNotes: string
): Promise<GeneratedContent> {
  try {
    // Step 1: Filter content relevant to the use case
    const filteredContent = await filterUseCaseContent(useCaseName, customerNotes);
    
    // Step 2: Generate structured content from filtered content
    const generatedContent = await generateUseCaseContent(useCaseName, useCaseCategory, filteredContent);
    generatedContent.impact = generatedContent.impact.replace(/\|\|/g, "\n\n");
    return generatedContent;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Use case content processing failed: ${error.message}`);
      console.log()
    }
    throw new Error('Use case content processing failed: Unknown error occurred');
  }
}

/**
 * AI Edit functionality - improves content based on feedback using online research
 */
export async function aiEditContent(
  section: 'problem' | 'solution' | 'impact',
  currentContent: string,
  feedback: string[],
  useCaseName: string,
  customerNotes: string
): Promise<AIEditResult> {
  if (!currentContent.trim() || !feedback.length) {
    throw new Error('Current content and feedback are required for AI editing');
  }

  try {
    const response = await fetch('/api/ai-edit-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        section: section,
        currentContent: currentContent.trim(),
        feedback: feedback,
        useCaseName: useCaseName.trim(),
        useCaseCategory: customerNotes.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const apiResponse = data.response;

    // Try to parse JSON response
    let editResult: AIEditResult;
    
    try {
      editResult = extractJsonFromResponse(apiResponse);
    } catch (parseError) {
      // If JSON parsing fails, create a fallback response
      editResult = {
        improvedContent: apiResponse.trim() || currentContent,
        researchFindings: 'Unable to parse structured response from AI edit request',
        placeholdersUsed: [],
        details: ''
      };
    }

    // Validate required fields
    if (!editResult.improvedContent) {
      editResult.improvedContent = currentContent;
    }

    editResult.improvedContent = editResult.improvedContent.replace(/\|\|/g, "\n\n");

    // Ensure arrays are properly formatted
    if (!Array.isArray(editResult.placeholdersUsed)) {
      editResult.placeholdersUsed = [];
    }

    //Checking explainations
    console.log("====DETAILS:"+editResult.details);

    return editResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AI edit failed: ${error.message}`);
    }
    throw new Error('AI edit failed: Unknown error occurred');
  }
}