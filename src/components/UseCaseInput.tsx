import React from 'react';
import { MessageSquare, Edit2, Loader2 } from 'lucide-react';

interface UseCaseInputProps {
  value: string;
  onChange: (value: string) => void;
  isVisible: boolean;
  customerName: string;
  onContinue: () => void;
  isEditable: boolean;
  onEdit?: () => void;
  isAnalyzing?: boolean;
}

const UseCaseInput: React.FC<UseCaseInputProps> = ({ 
  value, 
  onChange, 
  isVisible, 
  customerName,
  onContinue,
  isEditable,
  onEdit,
  isAnalyzing = false
}) => {
  return (
    <div 
      className={`space-y-3 transition-all duration-500 ease-in-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 max-h-96' 
          : 'opacity-0 -translate-y-4 max-h-0 overflow-hidden'
      }`}
    >
      <label className="flex items-center space-x-3 text-lg font-medium text-gray-900">
        <MessageSquare className="w-5 h-5 text-gray-600" />
        <span>
          Tell us more about the use cases?
        </span>
        {isAnalyzing && (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            <span className="text-purple-600 text-sm font-medium">
              Analyzing...
            </span>
          </div>
        )}
      </label>
      
      <div className="relative flex items-start space-x-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="How does your customer use Databricks? You can paste your discovery notes here or ask for an outside in POV. "
          rows={6}
          readOnly={!isEditable}
          className={`flex-1 px-4 py-4 text-lg border rounded-2xl outline-none transition-all duration-200 placeholder-gray-400 resize-none ${
            isEditable 
              ? 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white cursor-text' 
              : 'border-gray-100 bg-gray-100 text-gray-700 cursor-default'
          }`}
        />
        
        {!isEditable && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-lg transition-all duration-200 group flex-shrink-0 mt-1"
            title="Edit use cases"
          >
            <Edit2 className="w-4 h-4 text-gray-600 group-hover:text-gray-700" />
          </button>
        )}
      </div>
      
      {isEditable && (
        <p className="text-sm text-gray-500 flex items-start space-x-2">
        <span className="block w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
        <span>
          Include specific details about their business context, pain points they're solving, 
          and outcomes they're trying to achieve.
        </span>
        </p>
      )}
      
      {value.trim().length > 0 && isEditable && (
        <div className="flex justify-start pt-2">
          <button
            onClick={onContinue}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default UseCaseInput;