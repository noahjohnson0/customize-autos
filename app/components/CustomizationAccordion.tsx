'use client';

import { useState } from 'react';

interface CustomizationOption {
  id: string;
  name: string;
  image?: string;
}

interface CustomizationCategory {
  id: string;
  title: string;
  options: CustomizationOption[];
}

interface CustomizationAccordionProps {
  categories: CustomizationCategory[];
  selectedOptions: Record<string, string[]>; // Changed to array to support multiple selections
  onOptionSelect: (categoryId: string, optionId: string, isSelected: boolean) => void;
  disabled?: boolean;
}

export default function CustomizationAccordion({
  categories,
  selectedOptions,
  onOptionSelect,
  disabled = false,
}: CustomizationAccordionProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(categoryId)) {
      newOpen.delete(categoryId);
    } else {
      newOpen.add(categoryId);
    }
    setOpenCategories(newOpen);
  };

  return (
    <div className="w-full space-y-2">
      {categories.map((category) => (
        <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-semibold text-gray-900">{category.title}</span>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${
                openCategories.has(category.id) ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openCategories.has(category.id) && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {category.options.map((option) => {
                  const isSelected = selectedOptions[category.id]?.includes(option.id) || false;
                  return (
                    <button
                      key={option.id}
                      onClick={() => onOptionSelect(category.id, option.id, isSelected)}
                      disabled={disabled}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      } ${
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <div className="absolute top-2 right-2">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {option.image ? (
                        <div className="aspect-square mb-2 rounded overflow-hidden bg-gray-100">
                          <img
                            src={option.image}
                            alt={option.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square mb-2 rounded bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                      <p className="text-sm font-medium text-gray-900">{option.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

