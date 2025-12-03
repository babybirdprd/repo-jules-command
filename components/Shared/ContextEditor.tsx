import React from 'react';
import { CONTEXT_TEMPLATES } from '../../constants';

interface ContextEditorProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

const ContextEditor: React.FC<ContextEditorProps> = ({ value, onChange, label = "Agent Context (AGENTS.md)" }) => {
  
  const appendTemplate = (text: string) => {
    onChange(`${value}${text}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      
      {/* Template Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {CONTEXT_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.label}
            type="button"
            onClick={() => appendTemplate(tmpl.content)}
            className="flex-shrink-0 px-3 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs rounded-full text-indigo-400 transition-colors whitespace-nowrap"
          >
            + {tmpl.label}
          </button>
        ))}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
        placeholder="# Instructions for Jules..."
      />
    </div>
  );
};

export default ContextEditor;