import { extractJsonFromResponse } from '../utils/repairJSON';

export interface StoryContent {
  summary: string; // 20-25 words
  detailedStory: string; // 200-250 words
}

export interface UseCaseStoryData {
  useCaseName: string;
  useCaseCategory: string;
  problemStatement: string;
  databricksSolution: string;
  impact: string;
  customerInfo: {
    companyName: string;
    region: string;
    industry: string;
  };
}

export interface StoryGenerationResult {
  useCaseKey: string;
  storyContent: StoryContent;
}

/**
 * Generates story content (summary and detailed story) for a single use case
 */
export async function generateStoryContent(
  useCaseData: UseCaseStoryData,
  attempt: number = 1
): Promise<StoryContent> {
  if (!useCaseData.useCaseName || !useCaseData.problemStatement || !useCaseData.databricksSolution || !useCaseData.impact) {
    console.log('Story generation input:', useCaseData.useCaseName, useCaseData.databricksSolution, useCaseData.problemStatement, useCaseData.impact);
    throw new Error('All use case data fields are required for story generation');
  }

  try {
    const response = await fetch('/api/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ useCaseData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const apiResponse = data.response;

    // Try to parse JSON response
    let storyContent: StoryContent;
    try {
      storyContent = extractJsonFromResponse(apiResponse);
    } catch {
      console.log("STORY FAILURE: Raw API Response:", apiResponse);
      storyContent = {
        summary: 'Unable to generate story summary from provided content.',
        detailedStory: 'Unable to generate detailed story from provided content. Please check the use case data and try again.',
      };
    }

    // Validate required fields
    if (!storyContent.summary || !storyContent.detailedStory) {
      throw new Error('Incomplete story generation response received');
    }

    return storyContent;
  } catch (error) {
    console.warn(`Story generation attempt ${attempt} failed:`, error);
    if (attempt < 2) {
      console.log(`Retrying story generation for ${useCaseData.useCaseName}...`);
      return generateStoryContent(useCaseData, attempt + 1);
    }

    if (error instanceof Error) {
      throw new Error(`Story generation failed after 2 attempts: ${error.message}`);
    }
    throw new Error('Story generation failed: Unknown error occurred');
  }
}

/**
 * Export generated stories to Google Apps Script
 */
export async function exportStoriesToGoogleScript(
  storyResults: StoryGenerationResult[],
  customerInfo: any,
  useCaseContents: Record<string, any>,
  aiResearchFindings: Record<string, string[]> = {}
): Promise<any> {
  if (!storyResults.length) {
    throw new Error('No story results to export');
  }

  try {
    const response = await fetch('/api/export-stories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyGenerationResults: storyResults,
        customerInfo,
        useCaseContents,
        aiResearchFindings
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Google Apps Script export failed: ${error.message}`);
    }
    throw new Error('Google Apps Script export failed: Unknown error occurred');
  }
}

/**
 * Generates stories for multiple use cases in parallel
 */
export async function generateAllStories(
  useCasesData: UseCaseStoryData[]
): Promise<StoryGenerationResult[]> {
  if (!useCasesData.length) {
    throw new Error('No use case data provided for story generation');
  }

  // Filter out inactive/incomplete use cases
  const activeUseCases = useCasesData.filter(
    (uc) =>
      uc.useCaseName?.trim() &&
      uc.problemStatement?.trim() &&
      uc.databricksSolution?.trim() &&
      uc.impact?.trim()
  );

  if (!activeUseCases.length) {
    throw new Error('No active use cases with sufficient data for story generation');
  }

  try {
    // Generate stories only for active use cases
    const promises = activeUseCases.map(async (useCaseData) => {
      const useCaseKey = `${useCaseData.useCaseName}-${useCaseData.useCaseCategory}`;

      try {
        const storyContent = await generateStoryContent(useCaseData);
        return {
          useCaseKey,
          storyContent,
        };
      } catch (error) {
        console.error(`Story generation failed for ${useCaseKey}:`, error);
        return {
          useCaseKey,
          storyContent: {
            summary: `Story generation failed for ${useCaseData.useCaseName}`,
            detailedStory: `Unable to generate detailed story for ${useCaseData.useCaseName}. Error: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        };
      }
    });

    const results = await Promise.allSettled(promises);

    // Collect results
    const storyResults: StoryGenerationResult[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        storyResults.push(result.value);
      }
    });

    return storyResults;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Batch story generation failed: ${error.message}`);
    }
    throw new Error('Batch story generation failed: Unknown error occurred');
  }
}