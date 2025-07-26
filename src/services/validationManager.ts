export interface ValidationState {
  problem: boolean;
  solution: boolean;
  impact: boolean;
}

export interface UseCaseValidationData {
  useCaseKey: string;
  useCaseName: string;
  useCaseCategory: string;
  validationState: ValidationState;
  isFullyValidated: boolean;
}

class ValidationManager {
  private static instance: ValidationManager;
  private storageKey = 'storycraft_validation_states';

  private constructor() {}

  static getInstance(): ValidationManager {
    if (!ValidationManager.instance) {
      ValidationManager.instance = new ValidationManager();
    }
    return ValidationManager.instance;
  }

  // Get all validation data from session storage
  getAllValidationData(): Map<string, UseCaseValidationData> {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (!stored) return new Map();
      
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    } catch (error) {
      console.error('Error reading validation data:', error);
      return new Map();
    }
  }

  // Save all validation data to session storage
  private saveValidationData(data: Map<string, UseCaseValidationData>): void {
    try {
      const obj = Object.fromEntries(data);
      sessionStorage.setItem(this.storageKey, JSON.stringify(obj));
      console.log('💾 Saved validation data:', obj);
    } catch (error) {
      console.error('Error saving validation data:', error);
    }
  }

  // Initialize use case validation data
  initializeUseCase(useCaseKey: string, useCaseName: string, useCaseCategory: string): void {
    const allData = this.getAllValidationData();
    
    if (!allData.has(useCaseKey)) {
      const newData: UseCaseValidationData = {
        useCaseKey,
        useCaseName,
        useCaseCategory,
        validationState: {
          problem: false,
          solution: false,
          impact: false
        },
        isFullyValidated: false
      };
      
      allData.set(useCaseKey, newData);
      this.saveValidationData(allData);
      console.log(`🆕 Initialized use case: ${useCaseKey}`);
    }
  }

  // Update validation state for a specific section
  updateSectionValidation(
    useCaseKey: string, 
    section: 'problem' | 'solution' | 'impact', 
    isValidated: boolean
  ): boolean {
    const allData = this.getAllValidationData();
    const useCaseData = allData.get(useCaseKey);
    
    if (!useCaseData) {
      console.warn(`⚠️ Use case not found: ${useCaseKey}`);
      return false;
    }

    // Update the specific section
    useCaseData.validationState[section] = isValidated;
    
    // Check if all sections are now validated
    const { problem, solution, impact } = useCaseData.validationState;
    const wasFullyValidated = useCaseData.isFullyValidated;
    useCaseData.isFullyValidated = problem && solution && impact;
    
    allData.set(useCaseKey, useCaseData);
    this.saveValidationData(allData);
    
    console.log(`✅ Updated ${useCaseKey}.${section} = ${isValidated}`, {
      validationState: useCaseData.validationState,
      isFullyValidated: useCaseData.isFullyValidated,
      changed: wasFullyValidated !== useCaseData.isFullyValidated
    });
    
    return useCaseData.isFullyValidated !== wasFullyValidated;
  }

  // Check if a specific use case is fully validated
  isUseCaseValidated(useCaseKey: string): boolean {
    const allData = this.getAllValidationData();
    const useCaseData = allData.get(useCaseKey);
    return useCaseData?.isFullyValidated || false;
  }

  // Check if all use cases are validated
  areAllUseCasesValidated(useCaseKeys: string[]): boolean {
    if (useCaseKeys.length === 0) return false;
    
    const allData = this.getAllValidationData();
    const result = useCaseKeys.every(key => {
      const data = allData.get(key);
      const isValidated = data?.isFullyValidated || false;
      console.log(`🔍 Checking ${key}: ${isValidated}`, data?.validationState);
      return isValidated;
    });
    
    console.log(`🎯 All use cases validated: ${result}`, {
      totalUseCases: useCaseKeys.length,
      validatedCount: useCaseKeys.filter(key => allData.get(key)?.isFullyValidated).length
    });
    
    return result;
  }

  // Get validation summary
  getValidationSummary(): {
    totalUseCases: number;
    validatedUseCases: number;
    allValidated: boolean;
  } {
    const allData = this.getAllValidationData();
    const totalUseCases = allData.size;
    const validatedUseCases = Array.from(allData.values()).filter(data => data.isFullyValidated).length;
    
    return {
      totalUseCases,
      validatedUseCases,
      allValidated: totalUseCases > 0 && validatedUseCases === totalUseCases
    };
  }

  // Clear all validation data
  clearAll(): void {
    sessionStorage.removeItem(this.storageKey);
    console.log('🗑️ Cleared all validation data');
  }

  // Get all validated use case data for export
  getValidatedUseCasesData(): UseCaseValidationData[] {
    const allData = this.getAllValidationData();
    return Array.from(allData.values()).filter(data => data.isFullyValidated);
  }
}

export const validationManager = ValidationManager.getInstance();