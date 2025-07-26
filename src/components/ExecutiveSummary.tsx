import React from 'react';
import { FileText, Download, Loader2, RotateCcw } from 'lucide-react';

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
  onExport: () => void;
  isExporting: boolean;
  exportResult?: ExportResult | null;
  onReset: () => void; // New prop for resetting the app
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  isExportEnabled,
  onExport,
  isExporting,
  exportResult,
  onReset,
}) => {
  // Flatten exportResult structure if nested
  const actualResult = exportResult?.exportResult ? exportResult.exportResult : exportResult;
  const hasUrl = !!actualResult?.success && !!actualResult?.url;
  console.log('ExecutiveSummary exportResult:', exportResult);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-500 p-2 rounded-xl">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Generate Story</h2>
        </div>

        <div className="space-y-6">
          {/* Status Message */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
            {hasUrl ? (
              <p className="text-green-600 font-medium">
                ✓ Document is ready!
                <a
                  href={actualResult?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline ml-1"
                >
                  Click here to download
                </a>
                .
              </p>
            ) : isExportEnabled ? (
              <p className="text-green-600 font-medium">
                ✓ All use cases validated - Ready to export customer story
              </p>
            ) : (
              <p className="text-gray-500 italic">
                Complete and validate all use case details to enable export
              </p>
            )}
          </div>

          {/* Export Button */}
          {!hasUrl && (
            <button
              onClick={onExport}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:bg-gray-400"
              disabled={!isExportEnabled || isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Stories...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Export for Customer</span>
                </>
              )}
            </button>
          )}

          {/* Reset Button */}
          {hasUrl && (
            <button
              onClick={onReset}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset and Start Over</span>
            </button>
          )}

          {/* Disabled message */}
          {!isExportEnabled && !hasUrl && (
            <p className="text-xs text-gray-400 text-center">
              Complete and validate all use case details to enable export
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;