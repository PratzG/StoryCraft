import React from 'react';
import { Brain, CheckCircle, AlertCircle, Loader2, Target, Building, Plus, X } from 'lucide-react';
import { UseCaseAnalysisResult, IdentifiedUseCase } from '../services/useCaseAnalysis';

interface UseCaseAnalysisProps {
  analysisState: {
    isAnalyzing: boolean;
    result: UseCaseAnalysisResult | null;
    error: string | null;
  };
  selectedUseCases: IdentifiedUseCase[];
  onUseCaseSelection: (useCase: IdentifiedUseCase, isSelected: boolean) => void;
  onConfirm: () => void;
  isVisible: boolean;
  onAddCustomUseCase?: (useCase: IdentifiedUseCase) => void;
}

const UseCaseAnalysis: React.FC<UseCaseAnalysisProps> = ({
  analysisState,
  selectedUseCases,
  onUseCaseSelection,
  onConfirm,
  isVisible,
  onAddCustomUseCase
}) => {
  const { isAnalyzing, result, error } = analysisState;
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [customUseCase, setCustomUseCase] = React.useState({
    name: '',
    description: '',
    category: 'Business Use Case' as 'Platform Use Case' | 'Business Use Case'
  });

  if (!isVisible || (!result && !error)) return null;

  const isUseCaseSelected = (useCase: IdentifiedUseCase) => {
    return selectedUseCases.some(selected => 
      selected.name === useCase.name && selected.category === useCase.category
    );
  };

  const handleAddCustomUseCase = () => {
    if (!customUseCase.name.trim() || !customUseCase.description.trim()) return;
    
    const newUseCase: IdentifiedUseCase = {
      ...customUseCase,
      confidence: 'high' // Custom use cases are marked as high confidence
    };
    
    if (onAddCustomUseCase) {
      onAddCustomUseCase(newUseCase);
    }
    
    // Reset form and close
    setCustomUseCase({
      name: '',
      description: '',
      category: 'Business Use Case'
    });
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setCustomUseCase({
      name: '',
      description: '',
      category: 'Business Use Case'
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium">Analysis Error</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && !isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-blue-800 font-medium mb-2">Use Case Analysis Complete</h4>
              
              {result.summary && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                    Summary
                  </label>
                  <p className="text-blue-700 text-sm mt-1">{result.summary}</p>
                </div>
              )}

              {result.identifiedUseCases.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-3 block">
                    Identified Databricks Use Cases
                  </label>
                  <div className="space-y-3">
                    {result.identifiedUseCases.map((useCase, index) => (
                      <div key={index} className={`bg-white rounded-xl p-4 border transition-all duration-200 cursor-pointer hover:shadow-md ${
                        isUseCaseSelected(useCase) 
                          ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50' 
                          : 'border-blue-200 hover:border-blue-300'
                      }`}
                      onClick={() => onUseCaseSelection(useCase, !isUseCaseSelected(useCase))}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isUseCaseSelected(useCase)}
                            onChange={(e) => onUseCaseSelection(useCase, e.target.checked)}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {useCase.category === 'Platform Use Case' ? (
                              <Target className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Building className="w-4 h-4 text-green-600" />
                            )}
                            <h5 className="font-medium text-gray-900">{useCase.name}</h5>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{useCase.description}</p>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              useCase.category === 'Platform Use Case'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {useCase.category}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              useCase.confidence === 'high' 
                                ? 'bg-green-200 text-green-800'
                                : useCase.confidence === 'medium'
                                ? 'bg-yellow-200 text-yellow-800'
                                : 'bg-red-200 text-red-800'
                            }`}>
                              {useCase.confidence}
                            </span>
                          </div>
                          </div>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Custom Use Case Button */}
                  {!showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-xl border border-blue-300 hover:border-blue-400 transition-all duration-200 bg-white hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Custom Use Case</span>
                    </button>
                  )}
                  
                  {/* Add Custom Use Case Form */}
                  {showAddForm && (
                    <div className="mt-4 bg-white rounded-xl p-4 border border-blue-300 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Add Custom Use Case</h5>
                        <button
                          onClick={handleCancelAdd}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Use Case Name
                          </label>
                          <input
                            type="text"
                            value={customUseCase.name}
                            onChange={(e) => setCustomUseCase(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter use case name (5 words or less)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={customUseCase.description}
                            onChange={(e) => setCustomUseCase(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of the use case..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={customUseCase.category}
                            onChange={(e) => setCustomUseCase(prev => ({ 
                              ...prev, 
                              category: e.target.value as 'Platform Use Case' | 'Business Use Case' 
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          >
                            <option value="Business Use Case">Business Use Case</option>
                            <option value="Platform Use Case">Platform Use Case</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-3 pt-2">
                          <button
                            onClick={handleAddCustomUseCase}
                            disabled={!customUseCase.name.trim() || !customUseCase.description.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                          >
                            Add Use Case
                          </button>
                          <button
                            onClick={handleCancelAdd}
                            className="text-gray-600 hover:text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-start pt-2">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-blue-700">
                    {selectedUseCases.length} use case{selectedUseCases.length !== 1 ? 's' : ''} selected
                  </span>
                <button
                    onClick={onConfirm}
                    disabled={selectedUseCases.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                    <span>Confirm Selected Use Cases</span>
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

export default UseCaseAnalysis;