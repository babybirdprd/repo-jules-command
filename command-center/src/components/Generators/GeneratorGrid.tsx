import React from 'react';
import { GENERATOR_RECIPES } from '../../constants';
import { GeneratorRecipe } from '../../types';
import { AppWindow, Globe, Server, Coffee, Box, ChevronRight } from 'lucide-react';

// Icon Map Reuse
const IconMap: Record<string, React.ElementType> = {
  AppWindow, Globe, Server, Coffee, Box
};

interface GeneratorGridProps {
  onSelect: (recipe: GeneratorRecipe) => void;
}

const GeneratorGrid: React.FC<GeneratorGridProps> = ({ onSelect }) => {
  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold mb-4 text-white">Project Generators</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GENERATOR_RECIPES.map((recipe) => {
          const Icon = IconMap[recipe.iconName] || Box;
          return (
            <button
              key={recipe.id}
              onClick={() => onSelect(recipe)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 text-left transition-all group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/20 transition-colors">
                  <Icon size={24} />
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-100 mb-1">{recipe.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{recipe.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GeneratorGrid;