
export interface IdentifiedUseCase {
  category: 'Platform Use Case' | 'Business Use Case';
  name: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface UseCaseAnalysisResult {
  identifiedUseCases: IdentifiedUseCase[];
  summary: string;
}

export interface UseCaseAnalysisState {
  isAnalyzing: boolean;
  result: UseCaseAnalysisResult | null;
  error: string | null;
}

/**
 * Analyzes customer use case content to identify relevant Databricks use cases
 */
export async function analyzeUseCases(customerContent: string, industry: string): Promise<UseCaseAnalysisResult> {
  if (!customerContent.trim()) {
    throw new Error('Customer content cannot be empty');
  }

  try {
    const response = await fetch('/api/analyze-use-cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerContent: customerContent.trim(),
        industry
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const apiResponse = data.response.data;

    // Try to parse JSON response
    let analysisResult: UseCaseAnalysisResult;
    
    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = apiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : apiResponse;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      // If JSON parsing fails, create a fallback response
      analysisResult = {
        identifiedUseCases: [
          {
            category: 'Platform Use Case',
            name: 'Data Analytics',
            description: 'General data analytics and processing needs identified',
            confidence: 'low'
          }
        ],
        summary: 'Unable to parse detailed analysis. Raw response: ' + apiResponse.substring(0, 200) + '...',
      };
    }

    // Validate the response structure
    if (!analysisResult.identifiedUseCases || !Array.isArray(analysisResult.identifiedUseCases)) {
      throw new Error('Invalid analysis response structure');
    }

    // Ensure each use case has required fields
    analysisResult.identifiedUseCases = analysisResult.identifiedUseCases.filter(useCase => 
      useCase.name && useCase.description && useCase.category && useCase.confidence
    );

    return analysisResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Use case analysis failed: ${error.message}`);
    }
    throw new Error('Use case analysis failed: Unknown error occurred');
  }
}