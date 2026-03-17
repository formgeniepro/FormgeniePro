import { ParsedForm, FormItem, QuestionType, ChoiceOption } from '../types';

/**
 * Extracts the Microsoft Forms form ID from a public forms URL.
 * Supports formats:
 *   https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX
 *   https://forms.office.com/r/XXXX
 *   https://forms.cloud.microsoft/r/XXXX
 *   https://forms.cloud.microsoft/pages/responsepage.aspx?id=XXXX
 */
export const extractMsFormId = (url: string): string | null => {
  try {
    const parsed = new URL(url.trim());
    const idParam = parsed.searchParams.get('id') || parsed.searchParams.get('Id');
    if (idParam) return decodeURIComponent(idParam);

    const shortMatch = parsed.pathname.match(/\/r\/([^/?#]+)/i);
    if (shortMatch) return shortMatch[1];

    return null;
  } catch {
    return null;
  }
};

/**
 * Determines if a URL is a Microsoft Forms URL.
 */
export const isMicrosoftFormsUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return lower.includes('forms.office.com') || lower.includes('forms.microsoft.com') || lower.includes('forms.cloud.microsoft');
};

/**
 * Maps Microsoft Forms question type STRINGS to our QuestionType enum.
 * The runtime API returns string types like "Question.Choice", "Question.TextField", etc.
 */
const mapMsQuestionType = (msType: string, questionInfo: any): QuestionType => {
  const t = (msType || '').toLowerCase();

  if (t.includes('choice')) {
    // Check if it allows multiple values (checkboxes vs radio)
    if (questionInfo?.ChoiceType === 2 || questionInfo?.allowMultipleValues) return QuestionType.CHECKBOXES;
    return QuestionType.MULTIPLE_CHOICE;
  }
  if (t.includes('textfield') || t.includes('text') || t.includes('open')) {
    // Check if it's a long answer (paragraph) via questionInfo
    if (questionInfo?.IsLongAnswer || questionInfo?.IsMultiLine || questionInfo?.isMultiLine) return QuestionType.PARAGRAPH;
    return QuestionType.SHORT_ANSWER;
  }
  if (t.includes('date')) return QuestionType.DATE;
  if (t.includes('rating') || t.includes('nps')) return QuestionType.LINEAR_SCALE;
  if (t.includes('ranking')) return QuestionType.MULTIPLE_CHOICE;
  if (t.includes('matrix') || t.includes('likert')) return QuestionType.MULTIPLE_CHOICE_GRID;
  if (t.includes('file') || t.includes('upload')) return QuestionType.FILE_UPLOAD;
  if (t.includes('dropdown') || t.includes('combobox')) return QuestionType.DROPDOWN;
  if (t.includes('section') || t.includes('header')) return QuestionType.SECTION_HEADER;

  // Fallback: if it has choices, treat as MC
  if (questionInfo?.Choices && questionInfo.Choices.length > 0) return QuestionType.MULTIPLE_CHOICE;

  return QuestionType.SHORT_ANSWER; // Default to short answer instead of UNKNOWN
};

/**
 * Parses the questionInfo JSON string from a question.
 * questionInfo contains the actual choices, scale info, etc.
 */
const parseQuestionInfo = (raw: any): any => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw; // Already an object
};

/**
 * Parses Microsoft Forms API JSON (form + questions combined) into ParsedForm.
 */
export const parseMicrosoftFormData = (
  formMeta: any,
  questionsData: any[],
  formId: string,
  originalUrl: string
): ParsedForm => {
  const title = formMeta?.title || formMeta?.name || 'Untitled Form';
  const description = formMeta?.description || '';

  // Use the submit URL extracted from the form page config, falling back to the legacy pattern
  const actionUrl = formMeta?.submitUrl || `https://forms.office.com/formapi/api/${encodeURIComponent(formId)}/responses`;

  let itemIndex = 0;
  const items: FormItem[] = [];

  // Sort questions by their order property to match the original form design
  const sortedQuestions = [...(questionsData || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const q of sortedQuestions) {
    const qInfo = parseQuestionInfo(q.questionInfo);
    const msType: string = q.type || '';
    const qType = mapMsQuestionType(msType, qInfo);

    if (qType === QuestionType.FILE_UPLOAD) {
      itemIndex++;
      continue; // Skip file uploads
    }

    // ── Parse choices from questionInfo.Choices ──
    let options: ChoiceOption[] = [];
    if (
      [QuestionType.MULTIPLE_CHOICE, QuestionType.CHECKBOXES, QuestionType.DROPDOWN].includes(qType)
    ) {
      const choices = qInfo.Choices || q.choices || [];
      if (Array.isArray(choices)) {
          options = choices.map((c: any, ci: number) => ({
            label: c.Description || c.description || c.text || `Option ${ci + 1}`,
            id: c.Description || c.description || c.text || `choice_${ci}`,
          }));
      }
    }

    // ── Parse Likert / Matrix rows & columns ──
    let rows: { label: string; id?: string }[] = [];
    let columns: { label: string; id?: string }[] = [];
    if (qType === QuestionType.MULTIPLE_CHOICE_GRID) {
      const matrixRows = qInfo.Rows || q.rows || [];
      const matrixColumns = qInfo.Columns || q.columns || [];
      
      if (Array.isArray(matrixRows)) {
        rows = matrixRows.map((r: any, ri: number) => ({
          label: r.Description || r.description || r.text || `Row ${ri + 1}`,
          id: r.Id?.toString() || r.id?.toString() || `row_${ri}`,
        }));
      }
      if (Array.isArray(matrixColumns)) {
        columns = matrixColumns.map((c: any, ci: number) => ({
          label: c.Description || c.description || c.text || `Col ${ci + 1}`,
          id: c.Id?.toString() || c.id?.toString() || `col_${ci}`,
        }));
      }
    }

    // ── Linear scale (NPS / rating) ──
    let scaleStart: number | undefined;
    let scaleEnd: number | undefined;
    if (qType === QuestionType.LINEAR_SCALE) {
      scaleStart = qInfo.Min ?? qInfo.min ?? 1;
      scaleEnd = qInfo.Max ?? qInfo.max ?? (qInfo.RatingCount ?? qInfo.ratingCount ?? 5);
    }

    const item: FormItem = {
      id: q.id?.toString() || `ms_q_${itemIndex}`,
      submissionId: q.id?.toString() || `ms_q_${itemIndex}`,
      index: itemIndex,
      type: qType,
      title: q.title || q.formsProRTQuestionTitle || q.questionText || '',
      description: q.subtitle || q.formsProRTSubtitle || q.hint || '',
      required: q.required === true || q.isRequired === true,
      options,
      rows,
      columns,
      scaleStart,
      scaleEnd,
    };

    items.push(item);
    itemIndex++;
  }

  return {
    title,
    description,
    formId,
    documentTitle: title,
    actionUrl,
    formSource: 'microsoft',
    items,
  };
};
