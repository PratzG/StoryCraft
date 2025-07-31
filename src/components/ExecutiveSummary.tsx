import React from 'react';
import { FileText, Download, Loader2, RotateCcw, Star } from 'lucide-react';

interface ExportResult {
  success: boolean;
  message?: string;
  url?: string;
  exportResult?: {
    success: boolean;
    totalExported?: number;
    url?: string;
  };
}

interface ExecutiveSummaryProps {
  isExportEnabled: boolean;
  onExport: (type: 'draft' | 'final') => void;
  isExporting: boolean;
  exportResult?: ExportResult | null;
  onReset: () => void;
  recommended?: 'draft' | 'final' | null;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  isExportEnabled,
  onExport,
  isExporting,
  exportResult,
  onReset,
  recommended = null,
}) => {
  const actualResult = exportResult?.exportResult ? exportResult.exportResult : exportResult;
  const hasUrl = !!actualResult?.success && !!actualResult?.url;

  const RecommendedBadge = () => (
    <div className="absolute -top-2 right-2 bg-yellow-400 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
      <Star className="inline w-3 h-3 mr-0.5" /> Recommended
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* HEADER */}
        <div className="flex items-center space-x-2 mb-1">
          <div className="bg-green-500 p-1 rounded-lg">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Generate Story</h2>
        </div>

        {/* STATUS SECTION */}
        <section className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center space-y-1">
          {hasUrl ? (
            <p className="text-green-600 text-sm font-medium">
              ✓ Documents are ready!
              <a
                href={actualResult?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline ml-1"
              >
                View
              </a>.
            </p>
          ) : isExportEnabled ? (
            <>
              <p className="text-green-600 text-sm font-medium">
                ✓ All use cases validated – Ready to generate.
              </p>
              {recommended === 'draft' && (
                <p className="text-xs text-blue-600">
                  We recommend creating an Exploratory Draft to refine and validate the story direction.
                </p>
              )}
              {recommended === 'final' && (
                <p className="text-xs text-green-600">
                  We recommend creating the Final Deck for a polished, customer-ready story.
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Complete and validate all use case details to enable generation.
            </p>
          )}
        </section>

        {/* EXPLORATORY DRAFT PANEL */}
        <section
          className={`relative rounded-lg border p-3 flex flex-col items-center space-y-2 ${
            recommended === 'draft' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
        >
          {recommended === 'draft' && <RecommendedBadge />}
          <h3 className="text-base font-semibold text-gray-900">Exploratory Draft</h3>
          <p className="text-xs text-gray-500 text-center">
            Use this draft to run further customer discovery and validation.
          </p>
          <button
            onClick={() => onExport('draft')}
            className={`w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              recommended === 'draft' ? 'ring-2 ring-blue-400' : ''
            }`}
            disabled={!isExportEnabled || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating Draft...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="text-sm">{hasUrl ? 'Generate Draft Again' : 'Create Draft'}</span>
              </>
            )}
          </button>
        </section>

        {/* FINAL DECK PANEL */}
        <section
          className={`relative rounded-lg border p-3 flex flex-col items-center space-y-2 ${
            recommended === 'final' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}
        >
          {recommended === 'final' && <RecommendedBadge />}
          <h3 className="text-base font-semibold text-gray-900">Final Deck</h3>
          <p className="text-xs text-gray-500 text-center">
            Final deck is polished and ready for direct customer use.
          </p>
          <button
            onClick={() => onExport('final')}
            className={`w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              recommended === 'final' ? 'ring-2 ring-green-400' : ''
            }`}
            disabled={!isExportEnabled || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating Final Deck...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="text-sm">
                  {hasUrl ? 'Generate Final Deck Again' : 'Generate Final Deck'}
                </span>
              </>
            )}
          </button>
        </section>

        {/* RESET SECTION */}
        {hasUrl && (
          <section>
            <button
              onClick={onReset}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Reset and Start Over</span>
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default ExecutiveSummary;