
export interface CustomerValidationResult {
  companyName: string;
  region: string;
  industry: string;
  confidence: 'high' | 'medium' | 'low';
  additionalInfo: string;
  suggestions?: string;
}

export interface ValidationState {
  isValidating: boolean;
  result: CustomerValidationResult | null;
  error: string | null;
}

/**
 * Validates customer details using Perplexity AI search
 */
export async function validateCustomerDetails(customerDetails: string): Promise<CustomerValidationResult> {
  if (!customerDetails.trim()) {
    throw new Error('Customer details cannot be empty');
  }

  try {
    const response = await fetch('/api/validate-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerDetails: customerDetails.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const apiResponse = data.response;

    // Try to parse JSON response
    let validationResult: CustomerValidationResult;
    
    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = apiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : apiResponse;
      validationResult = JSON.parse(jsonString);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from text
      validationResult = {
        companyName: extractField(apiResponse, 'company', customerDetails),
        region: extractField(apiResponse, 'region', 'Unknown'),
        industry: extractField(apiResponse, 'industry', 'Unknown'),
        confidence: 'low' as const,
        additionalInfo: apiResponse,
        suggestions: 'Please provide more specific company information'
      };
    }

    // Validate required fields
    if (!validationResult.companyName || !validationResult.region || !validationResult.industry) {
      throw new Error('Incomplete validation response received');
    }

    return validationResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Customer validation failed: ${error.message}`);
    }
    throw new Error('Customer validation failed: Unknown error occurred');
  }
}

/**
 * Helper function to extract fields from text response
 */
function extractField(text: string, fieldName: string, fallback: string): string {
  const patterns = [
    new RegExp(`${fieldName}[:\\s]+([^\\n,]+)`, 'i'),
    new RegExp(`"${fieldName}"[:\\s]*"([^"]+)"`, 'i'),
    new RegExp(`${fieldName}[:\\s]*([^\\n,\\.]+)`, 'i')
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return fallback;
}