'use client';

export interface TimelineStep {
  id: string;
  imageUrl: string;
  changes: {
    added: string[];
    removed: string[];
  };
  timestamp: Date;
  selectedOptions?: Record<string, string[]>; // Track selected options at this step
  prompt?: string; // The prompt sent to the API for this step
}

interface TimelineProps {
  steps: TimelineStep[];
  currentStepIndex: number;
  onStepSelect?: (index: number) => void;
  disabled?: boolean;
}

export default function Timeline({ steps, currentStepIndex, onStepSelect, disabled = false }: TimelineProps) {
  if (steps.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <p className="text-sm">No customization history yet</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isPast = index < currentStepIndex;
            
            return (
              <div
                key={step.id}
                className={`relative flex items-start gap-4 transition-opacity ${
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'
                }`}
                onClick={() => !disabled && onStepSelect?.(index)}
              >
                {/* Timeline dot */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all ${
                    isActive
                      ? 'border-blue-600 bg-blue-600'
                      : isPast
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${
                      isActive || isPast ? 'text-white' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                {/* Step content */}
                <div
                  className={`flex-1 pb-6 transition-all ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  <div
                    className={`relative rounded-lg overflow-hidden border-2 mb-2 group ${
                      isActive ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={step.imageUrl}
                      alt={`Step ${index + 1}`}
                      className="w-full h-auto object-contain bg-gray-50"
                    />
                    {step.prompt && (
                      <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
                        <div className="text-white text-xs leading-relaxed max-w-full">
                          <div className="font-semibold mb-2 text-sm">Prompt:</div>
                          <div className="break-words">{step.prompt}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    {step.changes.added.length > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Added: {step.changes.added.join(', ')}</span>
                      </div>
                    )}
                    {step.changes.removed.length > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Removed: {step.changes.removed.join(', ')}</span>
                      </div>
                    )}
                    {step.changes.added.length === 0 && step.changes.removed.length === 0 && (
                      <div className="text-gray-400">Original image</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

