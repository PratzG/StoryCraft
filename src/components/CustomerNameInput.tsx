import React from 'react';
import { User, Edit2, MapPin, Building, Loader2 } from 'lucide-react';
import { CustomerValidationResult } from '../services/customerValidation';

interface CustomerNameInputProps {
  value: string;
  onChange: (value: string) => void;
  isEditable: boolean;
  onEdit?: () => void;
  validatedCustomer?: CustomerValidationResult | null;
  isValidating?: boolean;
}

const CustomerNameInput: React.FC<CustomerNameInputProps> = ({ 
  value, 
  onChange, 
  isEditable, 
  onEdit,
  validatedCustomer,
  isValidating = false
}) => {
  return (
    <div className="space-y-3">
      <label className="flex items-center space-x-3 text-lg font-medium text-gray-900">
        <User className="w-5 h-5 text-gray-600" />
        <span>Customer Details</span>
        {isValidating && (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-blue-600 text-sm font-medium">
              Researching...
            </span>
          </div>
        )}
      </label>
      
      <div className="relative flex items-center space-x-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Be as specific as possible - company name, region..."
          readOnly={!isEditable}
          className={`flex-1 px-4 py-4 text-lg border rounded-2xl outline-none transition-all duration-200 placeholder-gray-400 ${
            isEditable 
              ? 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white cursor-text' 
              : 'border-gray-100 bg-gray-100 text-gray-700 cursor-default'
          }`}
        />
        
        {!isEditable && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-lg transition-all duration-200 group flex-shrink-0"
            title="Edit customer name"
          >
            <Edit2 className="w-4 h-4 text-gray-600 group-hover:text-gray-700" />
          </button>
        )}
      </div>
      
      {validatedCustomer && !isEditable && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                Company
              </label>
              <p className="text-green-800 font-medium">{validatedCustomer.companyName}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div>
                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Region
                </label>
                <p className="text-green-800">{validatedCustomer.region}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div>
                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Industry
                </label>
                <p className="text-green-800">{validatedCustomer.industry}</p>
              </div>
            </div>
          </div>
          
          {validatedCustomer.additionalInfo && (
            <div className="mb-4">
              <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                Additional Information
              </label>
              <p className="text-green-700 text-sm mt-1">{validatedCustomer.additionalInfo}</p>
            </div>
          )}
          
          {validatedCustomer.suggestions && (
            <div className="mb-4">
              <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                Suggestions
              </label>
              <p className="text-green-700 text-sm mt-1">{validatedCustomer.suggestions}</p>
            </div>
          )}

          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
              Confidence:
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              validatedCustomer.confidence === 'high' 
                ? 'bg-green-200 text-green-800'
                : validatedCustomer.confidence === 'medium'
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-red-200 text-red-800'
            }`}>
              {validatedCustomer.confidence.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerNameInput;