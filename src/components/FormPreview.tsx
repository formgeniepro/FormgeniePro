import React from 'react';
import { ParsedForm } from '../types';
import { WeightedAutomation } from './WeightedAutomation';
import { MicrosoftFormsAutomation } from './MicrosoftFormsAutomation';

interface FormPreviewProps {
  form: ParsedForm;
  onBack: () => void;
}

export const FormPreview: React.FC<FormPreviewProps> = ({ form, onBack }) => {
  // Route to the appropriate automation interface based on source
  if (form.formSource === 'microsoft') {
    return <MicrosoftFormsAutomation form={form} onBack={onBack} />;
  }
  return <WeightedAutomation form={form} onBack={onBack} />;
};
