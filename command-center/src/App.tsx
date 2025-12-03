import React, { useState } from 'react';
import { JobProvider } from './context/JobContext';
import Dashboard from './components/Dashboard/Dashboard';
import GeneratorGrid from './components/Generators/GeneratorGrid';
import ScaffoldWizard from './components/Wizards/ScaffoldWizard';
import UplinkWizard from './components/Wizards/UplinkWizard';
import { GeneratorRecipe } from './types';
import { LayoutGrid, Command, Settings as SettingsIcon } from 'lucide-react';

type View = 'dashboard' | 'generators' | 'settings' | 'scaffold_wizard' | 'uplink_wizard';

function AppContent() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedRecipe, setSelectedRecipe] = useState<GeneratorRecipe | null>(null);

  const startScaffold = (recipe: GeneratorRecipe) => {
    setSelectedRecipe(recipe);
    setView('scaffold_wizard');
  };

  const finishWizard = () => {
    setView('dashboard');
    setSelectedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' && (
          <Dashboard
            onNew={() => setView('generators')}
            onUplink={() => setView('uplink_wizard')}
          />
        )}

        {view === 'generators' && (
          <GeneratorGrid onSelect={startScaffold} />
        )}

        {view === 'scaffold_wizard' && selectedRecipe && (
          <ScaffoldWizard
            recipe={selectedRecipe}
            onBack={() => setView('generators')}
            onComplete={finishWizard}
          />
        )}

        {view === 'uplink_wizard' && (
          <UplinkWizard
            onBack={() => setView('dashboard')}
            onComplete={finishWizard}
          />
        )}

        {view === 'settings' && (
            <div className="p-8 text-center opacity-50">
                <SettingsIcon size={48} className="mx-auto mb-4 text-slate-600" />
                <h2 className="text-xl font-bold">Settings</h2>
                <p className="mt-2 text-sm">API Keys & Preferences configured via ENV.</p>
            </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {/* Hide nav on wizard screens to focus user */}
      {!['scaffold_wizard', 'uplink_wizard'].includes(view) && (
        <nav className="fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 pb-safe z-30">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => setView('dashboard')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}`}
            >
              <Command size={24} />
              <span className="text-[10px] font-bold">Mission</span>
            </button>

            <button
              onClick={() => setView('generators')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'generators' ? 'text-indigo-400' : 'text-slate-500'}`}
            >
              <LayoutGrid size={24} />
              <span className="text-[10px] font-bold">Build</span>
            </button>

            <button
              onClick={() => setView('settings')}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'settings' ? 'text-indigo-400' : 'text-slate-500'}`}
            >
              <SettingsIcon size={24} />
              <span className="text-[10px] font-bold">Config</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <JobProvider>
      <AppContent />
    </JobProvider>
  );
}