import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import CustomerStoryForm from './components/CustomerStoryForm';
import ExecutiveSummary from './components/ExecutiveSummary';
import {
  generateAllStories,
  exportStoriesToGoogleScript,
  UseCaseStoryData,
} from './services/storyGeneration';
import { validationManager } from './services/validationManager';

/** Result returned by the Google Apps Script export endpoint */
interface ExportResult {
  success: boolean;
  url?: string; // defined only when success === true
}

/** Local UI state that controls the export banner & button */
interface ExportState {
  isEnabled: boolean; // all use‑cases validated
  isExporting: boolean; // request in flight
  result: ExportResult | null; // latest export outcome (or null before first run)
}

function App() {
  /* --------------------------------------------------
   * UI state
   * -------------------------------------------------- */
  const [exportState, setExportState] = useState<ExportState>({
    isEnabled: false,
    isExporting: false,
    result: null,
  });

  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [useCaseContents, setUseCaseContents] = useState<Record<string, any>>({});
  const [aiResearchFindings, setAiResearchFindings] = useState<Record<string, string[]>>({});

  /* --------------------------------------------------
   * Handlers
   * -------------------------------------------------- */
  
  const handleReset = () => {
    window.location.reload();
  };

  const handleExportEnabledChange = (isEnabled: boolean) =>
    setExportState((prev) => ({ ...prev, isEnabled }));

  const handleExport = useCallback(async () => {
    // Clear any previous result and show spinner
    setExportState((prev) => ({ ...prev, isExporting: true, result: null }));

    try {
      /* 1️⃣  Gather only fully‑validated use‑cases */
      const validatedUseCases = validationManager.getValidatedUseCasesData();
      if (!validatedUseCases.length) throw new Error('No validated use cases found for export');

      /* 2️⃣  Shape the payload expected by storyGeneration */
      const storyInput: UseCaseStoryData[] = validatedUseCases.map(
        ({ useCaseKey, useCaseName, useCaseCategory }) => {
          const content = useCaseContents[useCaseKey] ?? {};
          return {
            useCaseName,
            useCaseCategory,
            problemStatement: content.problemStatement ?? '',
            databricksSolution: content.databricksSolution ?? '',
            impact: content.impact ?? '',
            customerInfo: customerInfo ?? {
              companyName: 'Unknown Customer',
              region: 'Unknown',
              industry: 'Unknown',
            },
          };
        },
      );

      /* 3️⃣  Generate story text for each use‑case */
      const stories = await generateAllStories(storyInput);

      /* 4️⃣  Kick off export to Google Apps Script */
      const exportResult: ExportResult = await exportStoriesToGoogleScript(
        stories,
        customerInfo,
        useCaseContents,
        aiResearchFindings,
      );

      /* 5️⃣  Persist result so ExecutiveSummary can render link */
      setExportState((prev) => ({ ...prev, result: exportResult }));
      console.log('Setting exportState.result:', exportResult);
    } catch (err) {
      console.error('Export failed:', err);
      window.alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExportState((prev) => ({ ...prev, isExporting: false }));
    }
  }, [customerInfo, useCaseContents, aiResearchFindings]);

  /* --------------------------------------------------
   * Render
   * -------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          <div className="lg:col-span-2">
            <CustomerStoryForm
              onExportEnabledChange={handleExportEnabledChange}
              onCustomerInfoChange={setCustomerInfo}
              onUseCaseContentsChange={setUseCaseContents}
              onAiResearchFindingsChange={setAiResearchFindings}
            />
          </div>

          <div className="lg:col-span-1">
            <ExecutiveSummary
              isExportEnabled={exportState.isEnabled}
              onExport={handleExport}
              isExporting={exportState.isExporting}
              exportResult={exportState.result}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;