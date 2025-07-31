import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Edit2 } from 'lucide-react';
import { CustomerValidationResult } from '../services/customerValidation';

interface CustomerValidationProps {
  validationState: {
    isValidating: boolean;
    result: CustomerValidationResult | null;
    error: string | null;
  };
  onConfirm: () => void;
  onEdit: () => void;
  isVisible: boolean;
}

const CustomerValidation: React.FC<CustomerValidationProps> = ({
  validationState,
  onConfirm,
  onEdit,
  isVisible
}) => {
  const { isValidating, result, error } = validationState;

  if (!isVisible || (!result && !error)) return null;

  return (
    <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium">Validation Error</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={onEdit}
                className="mt-3 text-red-700 hover:text-red-800 text-sm font-medium underline"
              >
                Edit customer details
              </button>
            </div>
          </div>
        </div>
      )}

      {result && !isValidating && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-green-800 font-medium mb-3">Customer Information Found</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Company
                    </label>
                    <p className="text-green-800 font-medium">{result.companyName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Region
                    </label>
                    <p className="text-green-800">{result.region}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Industry
                    </label>
                    <p className="text-green-800">{result.industry}</p>
                  </div>
                </div>

                {result.additionalInfo && (
                  <div className="mb-4">
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Additional Information
                    </label>
                    <p className="text-green-700 text-sm mt-1">{result.additionalInfo}</p>
                  </div>
                )}

                {result.suggestions && (
                  <div className="mb-4">
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Suggestions
                    </label>
                    <p className="text-green-700 text-sm mt-1">{result.suggestions}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Confidence:
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.confidence === 'high' 
                      ? 'bg-green-200 text-green-800'
                      : result.confidence === 'medium'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {result.confidence.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {result.confidence !== 'low' && (
                  <button
                    onClick={onConfirm}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Confirm & Continue
                  </button>
                  )}

                  <button
                    onClick={onEdit}
                    className="flex items-center space-x-2 text-green-700 hover:text-green-800 font-medium py-2 px-4 rounded-xl border border-green-300 hover:border-green-400 transition-all duration-200"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerValidation;