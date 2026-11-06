import React from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import { WizardStep2Travelers } from '@/components/wizard/WizardStep2Travelers';
import type { WizardData } from '@/components/wizard/types';

const initial: WizardData = {
  adults: 2,
  children: [
    { id: 'c1', type: 'child' },
    { id: 'c2', type: 'child' },
  ],
  infants: 0,
} as WizardData;

const App = () => {
  const [data, setData] = React.useState<WizardData>(initial);
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <WizardStep2Travelers data={data} onChange={(u) => setData((d) => ({ ...d, ...u }))} />
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
