export enum QuestionType {
  SHORT_ANSWER = 'SHORT_ANSWER',
  PARAGRAPH = 'PARAGRAPH',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOXES = 'CHECKBOXES',
  DROPDOWN = 'DROPDOWN',
  LINEAR_SCALE = 'LINEAR_SCALE',
  DATE = 'DATE',
  TIME = 'TIME',
  SECTION_HEADER = 'SECTION_HEADER',
  FILE_UPLOAD = 'FILE_UPLOAD',
  MULTIPLE_CHOICE_GRID = 'MULTIPLE_CHOICE_GRID',
  CHECKBOX_GRID = 'CHECKBOX_GRID',
  UNKNOWN = 'UNKNOWN'
}

export interface ChoiceOption {
  label: string;
  id?: string;
}

export interface GridDimension {
  label: string;
  id?: string; // This corresponds to the entry ID for the row
}

export interface FormItem {
  id: string; // Internal ID
  submissionId?: string; // The "entry.XXXX" ID for simple questions
  index: number;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  limitOneResponsePerColumn?: boolean; // Validates that a column can only be selected once across all rows
  isPageBreak?: boolean; // Identifies if this item triggers a new page (Section Break vs Title)
  options?: ChoiceOption[]; // For Choice questions
  scaleStart?: number; // For Linear Scale
  scaleEnd?: number;
  scaleStartLabel?: string;
  scaleEndLabel?: string;
  rows?: GridDimension[]; // For Grids
  columns?: GridDimension[]; // For Grids
}

export interface ParsedForm {
  title: string;
  description: string;
  formId?: string;
  documentTitle?: string;
  actionUrl?: string; // The URL to POST data to
  fbzx?: string; // Google Form Security Token
  formSource?: 'google' | 'microsoft'; // Tracks which platform this form came from
  items: FormItem[];
}

export interface GenerationState {
  status: 'idle' | 'fetching_html' | 'analyzing' | 'success' | 'error';
  message?: string;
}