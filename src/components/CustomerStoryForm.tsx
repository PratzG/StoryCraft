import React, { useState, useEffect, useRef } from 'react';
import CustomerNameInput from './CustomerNameInput';
import UseCaseInput from './UseCaseInput';
import CustomerValidation from './CustomerValidation';
import UseCaseAnalysis from './UseCaseAnalysis';
import UseCaseDetails from './UseCaseDetails';
import { validateCustomerDetails, ValidationState, CustomerValidationResult } from '../services/customerValidation';
import { analyzeUseCases, UseCaseAnalysisState, IdentifiedUseCase } from '../services/useCaseAnalysis';
import { validationManager } from '../services/validationManager';

interface CustomerStoryFormProps {
  onExportEnabledChange: (isEnabled: boolean) => void;
  onCustomerInfoChange: (customerInfo: any) => void;
  onUseCaseContentsChange: (contents: Record<string, any>) => void;
  onAiResearchFindingsChange: (findings: Record<string, string[]>) => void;
}

const CustomerStoryForm: React.FC<CustomerStoryFormProps> = ({
  onExportEnabledChange,
  onCustomerInfoChange,
  onUseCaseContentsChange,
  onAiResearchFindingsChange
}) => {
  const [customerName, setCustomerName] = useState('');
  const [useCases, setUseCases] = useState('');
  const [showUseCases, setShowUseCases] = useState(false);
  const [showUseCaseAnalysis, setShowUseCaseAnalysis] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    result: null,
    error: null
  });
  const [useCaseAnalysisState, setUseCaseAnalysisState] = useState<UseCaseAnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null
  });
  const [selectedUseCases, setSelectedUseCases] = useState<IdentifiedUseCase[]>([]);
  const [finalizedCustomer, setFinalizedCustomer] = useState<CustomerValidationResult | null>(null);
  const [showUseCaseDetails, setShowUseCaseDetails] = useState(false);

  // Refs for auto-scrolling
  const validationRef = useRef<HTMLDivElement>(null);
  const useCaseInputRef = useRef<HTMLDivElement>(null);
  const useCaseAnalysisRef = useRef<HTMLDivElement>(null);
  const useCaseDetailsRef = useRef<HTMLDivElement>(null);


  // Derived state: Check if we are editing customer
  const isEditingCustomer = !finalizedCustomer && !showValidation;

  // Auto-scroll when sections become visible
  useEffect(() => {
    if (showValidation && validationRef.current && (validationState.result || validationState.error)) {
      validationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showValidation, validationState.result, validationState.error]);

  useEffect(() => {
    if (showUseCases && useCaseInputRef.current && !showUseCaseAnalysis) {
      useCaseInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showUseCases, showUseCaseAnalysis]);

  useEffect(() => {
    if (showUseCaseAnalysis && useCaseAnalysisRef.current && (useCaseAnalysisState.result || useCaseAnalysisState.error)) {
      useCaseAnalysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showUseCaseAnalysis, useCaseAnalysisState.result, useCaseAnalysisState.error]);

  useEffect(() => {
    if (showUseCaseDetails && useCaseDetailsRef.current) {
      useCaseDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showUseCaseDetails]);

  // Check validation state and update export enabled status
  const checkExportState = () => {
    if (selectedUseCases.length === 0) {
      onExportEnabledChange(false);
      return;
    }

    const useCaseKeys = selectedUseCases.map(uc => `${uc.name}-${uc.category}`);
    const allValidated = validationManager.areAllUseCasesValidated(useCaseKeys);

    console.log('🎯 Export state check:', {
      selectedUseCasesCount: selectedUseCases.length,
      useCaseKeys,
      allValidated,
      summary: validationManager.getValidationSummary()
    });

    onExportEnabledChange(allValidated);
  };

  // Check export state when selected use cases change
  useEffect(() => {
    checkExportState();
  }, [selectedUseCases]);

  const handleValidationChange = () => {
    console.log('🔄 Validation changed, checking export state...');
    checkExportState();
  };

  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    // Reset subsequent panels if editing customer
    if ((showValidation || showUseCases || showUseCaseAnalysis || showUseCaseDetails) && name.trim().length === 0) {
      setShowValidation(false);
      setShowUseCases(false);
      setShowUseCaseAnalysis(false);
      setShowUseCaseDetails(false);
      setValidationState({ isValidating: false, result: null, error: null });
      setFinalizedCustomer(null);
    }
  };

  const handleUseCasesChange = (cases: string) => {
    setUseCases(cases);
  };

  const handleContinue = async () => {
    if (!customerName.trim()) return;

    setShowValidation(true);
    setValidationState({ isValidating: true, result: null, error: null });

    try {
      const result = await validateCustomerDetails(customerName);
      setValidationState({ isValidating: false, result, error: null });
    } catch (error) {
      setValidationState({
        isValidating: false,
        result: null,
        error: error instanceof Error ? error.message : 'Validation failed'
      });
    }
  };

  const handleEdit = () => {
    setShowValidation(false);
    setShowUseCases(false);
    setShowUseCaseAnalysis(false);
    setShowUseCaseDetails(false);
    setValidationState({ isValidating: false, result: null, error: null });
    setFinalizedCustomer(null);
  };

  const handleConfirmCustomer = () => {
    if (validationState.result) {
      setFinalizedCustomer(validationState.result);
      onCustomerInfoChange(validationState.result);
      setCustomerName(validationState.result.companyName);
      setShowValidation(false);
      setShowUseCases(true);
    }
  };

  const handleUseCaseContinue = () => {
    if (!useCases.trim()) return;

    const industry =
      finalizedCustomer?.industry ||
      validationState.result?.industry ||
      '';

    console.log("Industry set in Customer Story Form: " + industry);

    setShowUseCaseAnalysis(true);
    setUseCaseAnalysisState({ isAnalyzing: true, result: null, error: null });

    analyzeUseCases(useCases, industry)
      .then(result => {
        setUseCaseAnalysisState({ isAnalyzing: false, result, error: null });
        const highConfidenceUseCases = result.identifiedUseCases.filter(
          useCase => useCase.confidence === 'high'
        );
        setSelectedUseCases(highConfidenceUseCases);
      })
      .catch(error => {
        setUseCaseAnalysisState({
          isAnalyzing: false,
          result: null,
          error: error instanceof Error ? error.message : 'Analysis failed'
        });
      });
  };

  const handleEditUseCases = () => {
    setShowUseCaseAnalysis(false);
    setUseCaseAnalysisState({ isAnalyzing: false, result: null, error: null });
    setSelectedUseCases([]);
  };

  const handleUseCaseSelection = (useCase: IdentifiedUseCase, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUseCases(prev => [...prev, useCase]);
    } else {
      setSelectedUseCases(prev =>
        prev.filter(selected =>
          selected.name !== useCase.name || selected.category !== useCase.category
        )
      );
    }
  };

  const handleConfirmUseCases = () => {
    setShowUseCaseAnalysis(false);
    setShowUseCaseDetails(true);
  };

  const handleAddCustomUseCase = (customUseCase: IdentifiedUseCase) => {
    if (useCaseAnalysisState.result) {
      const updatedResult = {
        ...useCaseAnalysisState.result,
        identifiedUseCases: [...useCaseAnalysisState.result.identifiedUseCases, customUseCase]
      };
      setUseCaseAnalysisState(prev => ({ ...prev, result: updatedResult }));
      setSelectedUseCases(prev => [...prev, customUseCase]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Details Panel */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8">
          <CustomerNameInput
            value={customerName}
            onChange={handleCustomerNameChange}
            isEditable={!showValidation && !showUseCases}
            onEdit={handleEdit}
            validatedCustomer={finalizedCustomer}
            isValidating={validationState.isValidating}
          />

          {customerName.trim().length > 0 && !showValidation && !showUseCases && (
            <div className="flex justify-start mt-6">
              <button
                onClick={handleContinue}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Validation Panel */}
      {showValidation && (validationState.result || validationState.error) && (
        <div ref={validationRef} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <CustomerValidation
              validationState={validationState}
              onConfirm={handleConfirmCustomer}
              onEdit={handleEdit}
              isVisible={showValidation}
            />
          </div>
        </div>
      )}

      {/* Use Case Input Panel */}
      {(showUseCases || showUseCaseDetails) && !isEditingCustomer && (
        <div ref={useCaseInputRef} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <UseCaseInput
              value={useCases}
              onChange={handleUseCasesChange}
              isVisible={showUseCases || showUseCaseDetails}
              customerName={finalizedCustomer?.companyName || customerName}
              onContinue={handleUseCaseContinue}
              isEditable={!showUseCaseAnalysis && !showUseCaseDetails}
              onEdit={showUseCaseDetails ? () => {
                setShowUseCaseDetails(false);
                setShowUseCases(true);
              } : handleEditUseCases}
              isAnalyzing={useCaseAnalysisState.isAnalyzing}
            />
          </div>
        </div>
      )}

      {/* Use Case Analysis Panel */}
      {showUseCaseAnalysis && (useCaseAnalysisState.result || useCaseAnalysisState.error) && !isEditingCustomer && (
        <div ref={useCaseAnalysisRef} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <UseCaseAnalysis
              analysisState={useCaseAnalysisState}
              selectedUseCases={selectedUseCases}
              onUseCaseSelection={handleUseCaseSelection}
              onConfirm={handleConfirmUseCases}
              isVisible={showUseCaseAnalysis}
              onAddCustomUseCase={handleAddCustomUseCase}
            />
          </div>
        </div>
      )}

      {/* Use Case Details Panel */}
      {showUseCaseDetails && !isEditingCustomer && (
        <div ref={useCaseDetailsRef} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <UseCaseDetails
              selectedUseCases={selectedUseCases}
              isVisible={showUseCaseDetails}
              customerNotes={useCases}
              onValidationChange={handleValidationChange}
              finalizedCustomer={finalizedCustomer}
              onUseCaseContentsChange={onUseCaseContentsChange}
              onAiResearchFindingsChange={onAiResearchFindingsChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerStoryForm;