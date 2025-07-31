import React, { useState } from "react";
import {
  Target,
  Building,
  FileText,
  Lightbulb,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Sparkles,
  Edit2,
  X,
} from "lucide-react";
import { IdentifiedUseCase } from "../services/useCaseAnalysis";
import {
  GeneratedContent,
  ContentGenerationState,
  processUseCaseContent,
  aiEditContent,
  AIEditResult,
} from "../services/contentGeneration";
import { validationManager } from "../services/validationManager";

/* -------------------- Types -------------------- */
type Section = "problem" | "solution" | "impact";

type ContentSectionProps = {
  title: string;
  icon: React.ReactNode;
  section: Section;
  confidence?: number;
  suggestions?: string[];
  isLoading?: boolean;
  hasError?: boolean;
  colorScheme: "red" | "blue" | "green";
  placeholder: string;

  // state coming from parent
  isAccepted: boolean;
  isEditing: boolean;
  isAiEditing: boolean;
  content: string;

  // handlers
  onEdit: (s: Section) => void;
  onCancel: (s: Section) => void;
  onSave: (s: Section) => void;
  onAccept: (s: Section) => void;
  onAiEdit: (s: Section) => void;
  onChange: (s: Section, v: string) => void;
};

/* -------------------- Pure memoized section -------------------- */
const ContentSection: React.FC<ContentSectionProps> = React.memo(
  ({
    title,
    icon,
    section,
    confidence,
    suggestions,
    isLoading,
    hasError,
    colorScheme,
    placeholder,
    isAccepted,
    isEditing,
    isAiEditing,
    content,
    onEdit,
    onCancel,
    onSave,
    onAccept,
    onAiEdit,
    onChange,
  }) => {
    const colors = {
      red: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: "text-red-600",
      },
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: "text-blue-600",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
        icon: "text-green-600",
      },
    }[colorScheme];

    const isLowConfidence =
      confidence !== undefined && confidence < 0.7 && !isAccepted;

    // Format only for display (not editing)
    const displayContent = content.includes("||")
      ? content
          .split("||")
          .map((s) => s.trim())
          .filter(Boolean)
          .join("\n\n")
      : content;

    return (
      <div className={`${colors.bg} ${colors.border} border rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={colors.icon}>{icon}</div>
            <h5 className={`font-semibold ${colors.text} text-lg`}>{title}</h5>
          </div>

          <div className="flex items-center space-x-3">
            {confidence !== undefined &&
              (confidence >= 0.7 || isAccepted ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm font-medium">
                    Validated
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700 text-sm font-medium">
                    Needs More Data
                  </span>
                </div>
              ))}

            {isAiEditing && (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-blue-600 text-sm font-medium">
                  AI Editing...
                </span>
              </div>
            )}

            <button
              onClick={() => (isEditing ? onCancel(section) : onEdit(section))}
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-lg transition-all duration-200 group flex-shrink-0"
              title={isEditing ? "Cancel editing" : `Edit ${title.toLowerCase()}`}
            >
              {isEditing ? (
                <X className="w-4 h-4 text-gray-600 group-hover:text-gray-700" />
              ) : (
                <Edit2 className="w-4 h-4 text-gray-600 group-hover:text-gray-700" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[100px]">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => onChange(section, e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-800"
              />
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onSave(section)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => onCancel(section)}
                  className="text-gray-600 hover:text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : displayContent ? (
            <p className="text-gray-800 whitespace-pre-line">{displayContent}</p>
          ) : !isLoading && !hasError ? (
            <p className="text-gray-400 text-sm italic">{placeholder}</p>
          ) : null}
        </div>

        {displayContent && isLowConfidence && !isEditing && (
          <div className="flex items-center justify-end space-x-3 mt-4">
            <button
              onClick={() => onAccept(section)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => onAiEdit(section)}
              disabled={isAiEditing}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
            >
              {isAiEditing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>AI Powered POV</span>
            </button>
          </div>
        )}

        {displayContent &&
          confidence !== undefined &&
          confidence < 0.7 &&
          suggestions &&
          suggestions.length > 0 &&
          !isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-800 text-sm font-semibold">
                      AI Feedback
                    </span>
                  </div>
                  <ul className="text-blue-700 text-sm list-disc list-inside space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  }
);

/* -------------------- Main component -------------------- */
interface UseCaseDetailsProps {
  selectedUseCases: IdentifiedUseCase[];
  isVisible: boolean;
  customerNotes: string;
  onValidationChange: () => void;
  finalizedCustomer: any;
  onUseCaseContentsChange: (contents: Record<string, any>) => void;
  onAiResearchFindingsChange: (findings: Record<string, string[]>) => void;
}

const UseCaseDetails: React.FC<UseCaseDetailsProps> = ({
  selectedUseCases,
  isVisible,
  customerNotes,
  onValidationChange,
  finalizedCustomer,
  onUseCaseContentsChange,
  onAiResearchFindingsChange,
}) => {
  console.log("UseCaseDetails re-rendered");

  const [currentPage, setCurrentPage] = useState(0);
  const [contentStates, setContentStates] = useState<
    Map<string, ContentGenerationState>
  >(new Map());
  const [generatedContents, setGeneratedContents] = useState<
    Map<string, GeneratedContent>
  >(new Map());
  const [editingStates, setEditingStates] = useState<
    Map<string, { problem: boolean; solution: boolean; impact: boolean }>
  >(new Map());
  const [editedContents, setEditedContents] = useState<
    Map<
      string,
      {
        problemStatement?: string;
        databricksSolution?: string;
        impact?: string;
      }
    >
  >(new Map());
  const [originalEditContents, setOriginalEditContents] = useState<
    Map<
      string,
      {
        problemStatement?: string;
        databricksSolution?: string;
        impact?: string;
      }
    >
  >(new Map());
  const [aiEditingStates, setAiEditingStates] = useState<
    Map<string, { problem: boolean; solution: boolean; impact: boolean }>
  >(new Map());
  const [aiResearchFindings, setAiResearchFindings] = useState<
    Record<string, string[]>
  >({});

  const navigationRef = React.useRef<HTMLDivElement>(null);
  const [, forceRerender] = React.useReducer((x) => x + 1, 0);

  /* Push up only when generated contents change */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const obj: Record<string, any> = {};
    generatedContents.forEach((content, key) => {
      const edited = editedContents.get(key) || {};
      obj[key] = { ...content, ...edited };
    });
    onUseCaseContentsChange(obj);
    // we purposely omit editedContents to avoid firing on keystroke
  }, [generatedContents, onUseCaseContentsChange]);

  React.useEffect(() => {
    onAiResearchFindingsChange(aiResearchFindings);
  }, [aiResearchFindings, onAiResearchFindingsChange]);

  if (!isVisible || selectedUseCases.length === 0) return null;

  const currentUseCase = selectedUseCases[currentPage];
  const totalPages = selectedUseCases.length;
  const useCaseKey = `${currentUseCase.name}-${currentUseCase.category}`;

  const currentContentState = contentStates.get(useCaseKey) || {
    isGenerating: false,
    result: null,
    error: null,
  };
  const currentGeneratedContent = generatedContents.get(useCaseKey);
  const currentEditingState = editingStates.get(useCaseKey) || {
    problem: false,
    solution: false,
    impact: false,
  };
  const currentEditedContent = editedContents.get(useCaseKey) || {};
  const currentAiEditState = aiEditingStates.get(useCaseKey) || {
    problem: false,
    solution: false,
    impact: false,
  };

  /* ---------- Helpers ---------- */
  const sectionField = (s: Section) =>
    s === "problem"
      ? "problemStatement"
      : s === "solution"
      ? "databricksSolution"
      : "impact";

  const handlePrevious = () =>
    setCurrentPage((p) => (p > 0 ? p - 1 : totalPages - 1));
  const handleNext = () =>
    setCurrentPage((p) => (p < totalPages - 1 ? p + 1 : 0));

  const generateContent = async (useCase: IdentifiedUseCase) => {
    const key = `${useCase.name}-${useCase.category}`;

    setContentStates(
      (prev) =>
        new Map(prev.set(key, { isGenerating: true, result: null, error: null }))
    );

    try {
      const result = await processUseCaseContent(
        useCase.name,
        useCase.category,
        customerNotes
      );

      setContentStates(
        (prev) =>
          new Map(prev.set(key, { isGenerating: false, result, error: null }))
      );
      setGeneratedContents((prev) => new Map(prev.set(key, result)));

      validationManager.initializeUseCase(key, useCase.name, useCase.category);
      checkUseCaseValidation(key, result);
    } catch (error) {
      setContentStates(
        (prev) =>
          new Map(
            prev.set(key, {
              isGenerating: false,
              result: null,
              error:
                error instanceof Error
                  ? error.message
                  : "Content generation failed",
            })
          )
      );
    }
  };

  const handleAccept = (section: Section) => {
    const validationChanged = validationManager.updateSectionValidation(
      useCaseKey,
      section,
      true
    );
    if (validationChanged) onValidationChange();
    forceRerender();
  };

  const checkUseCaseValidation = (
    key: string,
    gen?: GeneratedContent
  ) => {
    const c = gen || generatedContents.get(key);
    if (!c) return;

    let changed = false;
    if (validationManager.updateSectionValidation(key, "problem", c.problemConfidence >= 0.7)) changed = true;
    if (validationManager.updateSectionValidation(key, "solution", c.solutionConfidence >= 0.7)) changed = true;
    if (validationManager.updateSectionValidation(key, "impact", c.impactConfidence >= 0.7)) changed = true;
    if (changed) onValidationChange();
  };

  const handleAiEdit = async (section: Section) => {
    const currentGenerated = generatedContents.get(useCaseKey);
    if (!currentGenerated) return;

    const flags = aiEditingStates.get(useCaseKey) || {
      problem: false,
      solution: false,
      impact: false,
    };
    setAiEditingStates(
      (prev) => new Map(prev.set(useCaseKey, { ...flags, [section]: true }))
    );

    try {
      const field = sectionField(section);
      const suggestionsField =
        section === "problem"
          ? "problemSuggestions"
          : section === "solution"
          ? "solutionSuggestions"
          : "impactSuggestions";

      const rawText =
        currentEditedContent[field] || (currentGenerated as any)[field] || "";
      const suggestions: string[] =
        (currentGenerated as any)[suggestionsField] || [];

      const aiEditResult: AIEditResult = await aiEditContent(
        section,
        rawText,
        suggestions,
        currentUseCase.name,
        customerNotes
      );

      setGeneratedContents((prev) => {
        const updated = { ...prev.get(useCaseKey)! };
        (updated as any)[field] = aiEditResult.improvedContent;
        (updated as any)[`${section}Confidence`] = 1;
        return new Map(prev.set(useCaseKey, updated));
      });

      setEditedContents((prev) => {
        const changed = { ...(prev.get(useCaseKey) || {}) };
        changed[field] = aiEditResult.improvedContent;
        return new Map(prev.set(useCaseKey, changed));
      });

      if (validationManager.updateSectionValidation(useCaseKey, section, true)) {
        onValidationChange();
      }

      setAiResearchFindings((prev) => {
        const prevF = prev[useCaseKey] || [];
        return { ...prev, [useCaseKey]: [...prevF, aiEditResult.researchFindings] };
      });
    } catch (err) {
      console.error("AI edit failed:", err);
    } finally {
      setAiEditingStates(
        (prev) =>
          new Map(
            prev.set(useCaseKey, { ...flags, [section]: false })
          )
      );
    }
  };

  const handleEdit = (section: Section) => {
    const ed = editingStates.get(useCaseKey) || {
      problem: false,
      solution: false,
      impact: false,
    };
    const field = sectionField(section);

    // save original
    const current = currentEditedContent[field] ?? currentGeneratedContent?.[field] ?? "";
    const orig = originalEditContents.get(useCaseKey) || {};
    setOriginalEditContents((prev) =>
      new Map(prev.set(useCaseKey, { ...orig, [field]: current }))
    );

    setEditingStates((prev) =>
      new Map(prev.set(useCaseKey, { ...ed, [section]: true }))
    );

    if (!currentEditedContent[field]) {
      setEditedContents((prev) =>
        new Map(
          prev.set(useCaseKey, {
            ...currentEditedContent,
            [field]: current,
          })
        )
      );
    }
  };

  const handleSave = (section: Section) => {
    const ed = editingStates.get(useCaseKey) || {
      problem: false,
      solution: false,
      impact: false,
    };
    setEditingStates((prev) =>
      new Map(prev.set(useCaseKey, { ...ed, [section]: false }))
    );

    const cg = generatedContents.get(useCaseKey);
    if (cg) checkUseCaseValidation(useCaseKey, cg);

    // Optionally push up here too if desired
    const obj: Record<string, any> = {};
    generatedContents.forEach((content, key) => {
      const edited = editedContents.get(key) || {};
      obj[key] = { ...content, ...edited };
    });
    onUseCaseContentsChange(obj);
  };

  const handleCancel = (section: Section) => {
    const ed = editingStates.get(useCaseKey) || {
      problem: false,
      solution: false,
      impact: false,
    };
    const field = sectionField(section);

    setEditingStates((prev) =>
      new Map(prev.set(useCaseKey, { ...ed, [section]: false }))
    );

    const original = originalEditContents.get(useCaseKey);
    if (original && original[field]) {
      setEditedContents((prev) =>
        new Map(
          prev.set(useCaseKey, {
            ...currentEditedContent,
            [field]: original[field],
          })
        )
      );
    }
  };

  const handleContentChange = (section: Section, value: string) => {
    const field = sectionField(section);
    setEditedContents((prev) => {
      const next = new Map(prev);
      const current = next.get(useCaseKey) || {};
      next.set(useCaseKey, { ...current, [field]: value });
      return next;
    });
  };

  /* Generate all on mount/visible */
  React.useEffect(() => {
    if (isVisible && selectedUseCases.length > 0) {
      (async () => {
        const promises = selectedUseCases.map(async (u) => {
          const key = `${u.name}-${u.category}`;
          if (contentStates.get(key)?.result || contentStates.get(key)?.isGenerating) return;

          setContentStates(
            (prev) =>
              new Map(prev.set(key, { isGenerating: true, result: null, error: null }))
          );
          try {
            const result = await processUseCaseContent(u.name, u.category, customerNotes);
            setContentStates(
              (prev) =>
                new Map(prev.set(key, { isGenerating: false, result, error: null }))
            );
            setGeneratedContents((prev) => new Map(prev.set(key, result)));

            validationManager.initializeUseCase(key, u.name, u.category);
            checkUseCaseValidation(key, result);
          } catch (error) {
            setContentStates(
              (prev) =>
                new Map(
                  prev.set(key, {
                    isGenerating: false,
                    result: null,
                    error:
                      error instanceof Error ? error.message : "Content generation failed",
                  })
                )
            );
          }
        });

        await Promise.allSettled(promises);
      })();
    }

    if (isVisible && navigationRef.current) {
      navigationRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isVisible, selectedUseCases]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (isVisible && navigationRef.current) {
      navigationRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentPage, isVisible]);

  /* Stable icons */
  const fileTextIcon = <FileText className="w-5 h-5" />;
  const lightBulbIcon = <Lightbulb className="w-5 h-5" />;
  const trendingUpIcon = <TrendingUp className="w-5 h-5" />;

  /* Helper to build props per section */
  const buildSectionProps = (section: Section) => {
    const field = sectionField(section);
    const raw =
      currentEditedContent[field] ??
      currentGeneratedContent?.[field] ??
      "";

    return {
      section,
      content: raw,
      isAccepted:
        validationManager.getAllValidationData().get(useCaseKey)?.validationState[
          section
        ] ?? false,
      isEditing: currentEditingState[section],
      isAiEditing: currentAiEditState[section],
      confidence:
        section === "problem"
          ? currentGeneratedContent?.problemConfidence
          : section === "solution"
          ? currentGeneratedContent?.solutionConfidence
          : currentGeneratedContent?.impactConfidence,
      suggestions:
        section === "problem"
          ? currentGeneratedContent?.problemSuggestions
          : section === "solution"
          ? currentGeneratedContent?.solutionSuggestions
          : currentGeneratedContent?.impactSuggestions,
    };
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
      {/* Header with Navigation */}
      <div ref={navigationRef} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Target className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Use Case Details</h3>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevious}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <span className="text-sm text-gray-600 font-medium">
              {currentPage + 1} of {totalPages}
            </span>

            <button
              onClick={handleNext}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Use Case Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-3">
          {currentUseCase.category === "Platform Use Case" ? (
            <Target className="w-5 h-5 text-blue-600 mt-1" />
          ) : (
            <Building className="w-5 h-5 text-green-600 mt-1" />
          )}
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h4 className="text-lg font-semibold text-gray-900">
                {currentUseCase.name}
              </h4>
              {currentContentState.isGenerating && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-blue-600 text-sm font-medium">Analyzing...</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2">{currentUseCase.description}</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                currentUseCase.category === "Platform Use Case"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {currentUseCase.category}
            </span>
          </div>
        </div>
      </div>

      {/* Content Generation Error */}
      {currentContentState.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-red-800">Content Generation Error</h5>
                <p className="text-red-600 text-sm mt-1">{currentContentState.error}</p>
              </div>
            </div>
            <button
              onClick={() => generateContent(currentUseCase)}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="space-y-6">
        <ContentSection
          title="Problem Statement"
          icon={fileTextIcon}
          colorScheme="red"
          placeholder="Describe the specific problem or challenge this use case addressed. What pain points did the customer face? What were the limitations or inefficiencies?"
          isLoading={currentContentState.isGenerating}
          hasError={!!currentContentState.error}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleSave}
          onAccept={handleAccept}
          onAiEdit={handleAiEdit}
          onChange={handleContentChange}
          {...buildSectionProps("problem")}
        />

        <ContentSection
          title="Databricks Solution"
          icon={lightBulbIcon}
          colorScheme="blue"
          placeholder="Explain how Databricks solved this problem. What specific features, capabilities, or approaches did Databricks provide? How did it address the customer's needs?"
          isLoading={currentContentState.isGenerating}
          hasError={!!currentContentState.error}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleSave}
          onAccept={handleAccept}
          onAiEdit={handleAiEdit}
          onChange={handleContentChange}
          {...buildSectionProps("solution")}
        />

        <ContentSection
          title="Impact"
          icon={trendingUpIcon}
          colorScheme="green"
          placeholder="Describe the measurable impact and benefits achieved. Include specific metrics, improvements in efficiency, cost savings, or business outcomes that were realized."
          isLoading={currentContentState.isGenerating}
          hasError={!!currentContentState.error}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleSave}
          onAccept={handleAccept}
          onAiEdit={handleAiEdit}
          onChange={handleContentChange}
          {...buildSectionProps("impact")}
        />
      </div>

      {/* Page Indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                idx === currentPage ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UseCaseDetails;
