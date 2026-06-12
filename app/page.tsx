'use client';

import { useState, useEffect, useRef } from 'react';
import ImageUpload from './components/ImageUpload';
import CustomizationAccordion from './components/CustomizationAccordion';
import LoadingIndicator from './components/LoadingIndicator';
import Timeline from './components/Timeline';

type CustomizationState = 'upload' | 'customize' | 'loading';

interface TimelineStep {
  id: string;
  imageUrl: string;
  changes: {
    added: string[];
    removed: string[];
  };
  timestamp: Date;
  selectedOptions?: Record<string, string[]>;
  prompt?: string;
}

const customizationCategories = [
  {
    id: 'wheels',
    title: 'Wheels',
    options: [
      { id: 'sport', name: 'Sport Wheels' },
      { id: 'classic', name: 'Classic Wheels' },
      { id: 'chrome', name: 'Chrome Wheels' },
      { id: 'black', name: 'Black Wheels' },
      { id: 'alloy', name: 'Alloy Wheels' },
      { id: 'carbon', name: 'Carbon Fiber Wheels' },
    ],
  },
  {
    id: 'paint',
    title: 'Paint Color',
    options: [
      { id: 'red', name: 'Racing Red' },
      { id: 'blue', name: 'Electric Blue' },
      { id: 'black', name: 'Matte Black' },
      { id: 'white', name: 'Pearl White' },
      { id: 'silver', name: 'Metallic Silver' },
      { id: 'green', name: 'Forest Green' },
      { id: 'yellow', name: 'Sunset Yellow' },
      { id: 'purple', name: 'Deep Purple' },
    ],
  },
  {
    id: 'accessories',
    title: 'Accessories',
    options: [
      { id: 'spoiler', name: 'Rear Spoiler' },
      { id: 'roof-rack', name: 'Roof Rack' },
      { id: 'tinted', name: 'Tinted Windows' },
      { id: 'stripes', name: 'Racing Stripes' },
      { id: 'hood-scoop', name: 'Hood Scoop' },
      { id: 'side-skirts', name: 'Side Skirts' },
      { id: 'diffuser', name: 'Rear Diffuser' },
      { id: 'splitter', name: 'Front Splitter' },
    ],
  },
];

// Helper function to get option name
function getOptionName(categoryId: string, optionId: string): string {
  const category = customizationCategories.find((c) => c.id === categoryId);
  const option = category?.options.find((o) => o.id === optionId);
  return option?.name || optionId;
}

export default function Home() {
  const [state, setState] = useState<CustomizationState>('upload');
  const [carImage, setCarImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const previousOptionsRef = useRef<Record<string, string[]>>({});

  // Convert file to data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Initialize timeline with original image
  const handleImageSelect = async (file: File) => {
    setCarImage(file);
    setError(null);
    const imageUrl = await fileToDataUrl(file);
    setOriginalImageUrl(imageUrl);

    const initialStep: TimelineStep = {
      id: 'original',
      imageUrl,
      changes: { added: [], removed: [] },
      timestamp: new Date(),
      selectedOptions: {},
      prompt: 'Original image - no modifications',
    };

    setTimelineSteps([initialStep]);
    setCurrentStepIndex(0);
    setSelectedOptions({});
    previousOptionsRef.current = {};
    setState('customize');
  };

  // Build prompt for a single change (add or remove)
  const buildSingleChangePrompt = (
    categoryId: string,
    optionId: string,
    isRemoval: boolean
  ): string => {
    const category = customizationCategories.find((c) => c.id === categoryId);
    const option = category?.options.find((o) => o.id === optionId);

    if (!option) return '';

    if (isRemoval) {
      if (categoryId === 'paint') {
        return `Remove the paint color customization and restore the original paint color. Maintain the original car structure and make it look realistic.`;
      } else if (categoryId === 'wheels') {
        return `Remove the wheel customization and restore the original wheels. Maintain the original car structure and make it look realistic.`;
      } else {
        return `Remove ${option.name.toLowerCase()}. Maintain the original car structure and make it look realistic.`;
      }
    } else {
      // Adding
      if (categoryId === 'paint') {
        return `Change the paint color to ${option.name.toLowerCase()}. Maintain the original car structure and make it look realistic.`;
      } else if (categoryId === 'wheels') {
        return `Replace the wheels with ${option.name.toLowerCase()}. Maintain the original car structure and make it look realistic.`;
      } else {
        return `Add ${option.name.toLowerCase()}. Maintain the original car structure and make it look realistic.`;
      }
    }
  };

  // Apply customization
  const applyCustomization = async (
    baseImage: File | string,
    prompt: string,
    categoryId?: string
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      if (typeof baseImage === 'string') {
        // Convert data URL back to blob for FormData
        const response = await fetch(baseImage);
        const blob = await response.blob();
        const file = new File([blob], 'car.jpg', { type: blob.type });
        formData.append('carImage', file);
      } else {
        formData.append('carImage', baseImage);
      }
      formData.append('prompt', prompt);
      if (categoryId) {
        formData.append('categoryId', categoryId);
      }

      const apiResponse = await fetch('/api/customize', {
        method: 'POST',
        body: formData,
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || 'Failed to customize image');
      }

      return data.imageUrl || data.image || data.data?.image;
    } catch (err) {
      throw err;
    }
  };

  // Calculate what was added/removed
  const calculateChanges = (
    current: Record<string, string[]>,
    previous: Record<string, string[]>
  ): { added: string[]; removed: string[] } => {
    const added: string[] = [];
    const removed: string[] = [];

    // Check all categories
    ['paint', 'wheels', 'accessories'].forEach((categoryId) => {
      const currentOptions = current[categoryId] || [];
      const previousOptions = previous[categoryId] || [];

      // Find added options
      currentOptions.forEach((optionId) => {
        if (!previousOptions.includes(optionId)) {
          added.push(getOptionName(categoryId, optionId));
        }
      });

      // Find removed options
      previousOptions.forEach((optionId) => {
        if (!currentOptions.includes(optionId)) {
          removed.push(getOptionName(categoryId, optionId));
        }
      });
    });

    return { added, removed };
  };

  // Handle option selection with auto-apply (incremental, one change at a time)
  const handleOptionSelect = async (categoryId: string, optionId: string, isSelected: boolean) => {
    if (isApplying || !carImage) return;

    const previousOptions = { ...selectedOptions };
    const newOptions = { ...selectedOptions };

    if (!newOptions[categoryId]) {
      newOptions[categoryId] = [];
    }

    let singleChange: { categoryId: string; optionId: string; isRemoval: boolean } | null = null;

    if (isSelected) {
      // Removing option - check if it was actually selected
      const hadOption = newOptions[categoryId].includes(optionId);
      newOptions[categoryId] = newOptions[categoryId].filter((id) => id !== optionId);

      // For paint and wheels, clear if removing
      if (categoryId === 'paint' || categoryId === 'wheels') {
        newOptions[categoryId] = [];
      }

      if (hadOption) {
        singleChange = { categoryId, optionId, isRemoval: true };
      }
    } else {
      // Adding option
      // For paint and wheels, replace existing selection
      if (categoryId === 'paint' || categoryId === 'wheels') {
        // Check if there was a previous selection that needs to be replaced
        const hadPrevious = newOptions[categoryId]?.length > 0 && newOptions[categoryId][0] !== optionId;
        if (hadPrevious) {
          // Note: We could add a step to remove the old one first, but for simplicity,
          // we'll just replace it directly
        }
        newOptions[categoryId] = [optionId];
      } else {
        // For accessories, add to array if not already present
        if (!newOptions[categoryId].includes(optionId)) {
          newOptions[categoryId] = [...newOptions[categoryId], optionId];
        }
      }

      // Only apply if this is a new addition
      if (!previousOptions[categoryId]?.includes(optionId)) {
        singleChange = { categoryId, optionId, isRemoval: false };
      }
    }

    // If no actual change, just update options and return
    if (!singleChange) {
      setSelectedOptions(newOptions);
      previousOptionsRef.current = newOptions;
      return;
    }

    setSelectedOptions(newOptions);
    setIsApplying(true);
    setError(null);

    try {
      // Get the base image from current timeline step (apply incrementally)
      const currentStep = timelineSteps[currentStepIndex];
      let baseImage: File | string;

      if (currentStep) {
        // Use the current step's image as base (incremental application)
        baseImage = currentStep.imageUrl;
      } else {
        // Fallback to original if no step exists
        baseImage = originalImageUrl || (await fileToDataUrl(carImage));
      }

      // Build prompt for single change
      const stepPrompt = buildSingleChangePrompt(
        singleChange.categoryId,
        singleChange.optionId,
        singleChange.isRemoval
      );

      // Apply customization incrementally with category awareness
      const newImageUrl = await applyCustomization(baseImage, stepPrompt, singleChange.categoryId);

      if (newImageUrl) {
        // Calculate changes for display
        const changes = calculateChanges(newOptions, previousOptions);

        // Create new timeline step
        const newStep: TimelineStep = {
          id: `step-${Date.now()}`,
          imageUrl: newImageUrl,
          changes,
          timestamp: new Date(),
          selectedOptions: { ...newOptions },
          prompt: stepPrompt,
        };

        // Remove any future steps if we're not at the end (user went back in timeline)
        const newSteps = [...timelineSteps.slice(0, currentStepIndex + 1), newStep];
        setTimelineSteps(newSteps);
        setCurrentStepIndex(newSteps.length - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Revert options on error
      setSelectedOptions(previousOptions);
    } finally {
      setIsApplying(false);
      previousOptionsRef.current = newOptions;
    }
  };

  // Handle timeline step selection
  const handleStepSelect = async (index: number) => {
    if (index === currentStepIndex || isApplying) return;

    setCurrentStepIndex(index);

    // Restore the selected options state from this step
    const step = timelineSteps[index];
    if (step?.selectedOptions) {
      setSelectedOptions(step.selectedOptions);
      previousOptionsRef.current = step.selectedOptions;
    }
  };

  const handleReset = () => {
    setState('upload');
    setCarImage(null);
    setOriginalImageUrl(null);
    setSelectedOptions({});
    setTimelineSteps([]);
    setCurrentStepIndex(0);
    setError(null);
    setIsApplying(false);
    previousOptionsRef.current = {};
  };

  // Get current image to display
  const getCurrentImage = (): string | null => {
    if (timelineSteps.length === 0) return originalImageUrl;
    return timelineSteps[currentStepIndex]?.imageUrl || originalImageUrl;
  };

  // Get current prompt to display
  const getCurrentPrompt = (): string | null => {
    if (timelineSteps.length === 0) return 'Original image - no modifications';
    return timelineSteps[currentStepIndex]?.prompt || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">customize.autos</h1>
          <p className="text-gray-600">Transform your vehicle with AI-powered customization</p>
        </div>

        {state === 'upload' && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Your Car Image</h2>
            <ImageUpload onImageSelect={handleImageSelect} selectedImage={carImage} />
          </div>
        )}

        {state === 'customize' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline - Left Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
                <div className="h-[calc(100vh-250px)] min-h-[400px]">
                  <Timeline
                    steps={timelineSteps}
                    currentStepIndex={currentStepIndex}
                    onStepSelect={handleStepSelect}
                    disabled={isApplying}
                  />
                </div>
              </div>
            </div>

            {/* Customization Options - Right Side */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Customize Your Vehicle</h2>

                  {/* Current Image Preview */}
                  {getCurrentImage() && (
                    <div className="mb-6">
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 group">
                        {isApplying ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <LoadingIndicator />
                          </div>
                        ) : (
                          <>
                            <img
                              src={getCurrentImage() || undefined}
                              alt="Current customization"
                              className="w-full h-full object-contain"
                            />
                            {getCurrentPrompt() && (
                              <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
                                <div className="text-white text-sm leading-relaxed max-w-full">
                                  <div className="font-semibold mb-2">Prompt:</div>
                                  <div className="break-words">{getCurrentPrompt()}</div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <CustomizationAccordion
                  categories={customizationCategories}
                  selectedOptions={selectedOptions}
                  onOptionSelect={handleOptionSelect}
                  disabled={isApplying}
                />

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {state === 'loading' && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <LoadingIndicator />
          </div>
        )}
      </div>
    </div>
  );
}
