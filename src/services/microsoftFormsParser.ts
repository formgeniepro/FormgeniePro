import { ParsedForm, FormItem, QuestionType, ChoiceOption } from '../types';

/**
 * Extracts the Microsoft Forms form ID from a public forms.office.com URL.
 * Supports formats:
 *   https://forms.office.com/Pages/ResponsePage.aspx?id=XXXX
 *   https://forms.office.com/r/XXXX
 *   https://forms.microsoft.com/Pages/ResponsePage.aspx?id=XXXX
 */
export const extractMsFormId = (url: string): string | null => {
  try {
    const parsed = new URL(url.trim());
    // Standard format: ?id=XXXX or ?Id=XXXX
    const idParam = parsed.searchParams.get('id') || parsed.searchParams.get('Id');
    if (idParam) return decodeURIComponent(idParam);

    // Short link format: /r/{formId}
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
  return lower.includes('forms.office.com') || lower.includes('forms.microsoft.com');
};

/**
 * Maps Microsoft Forms question type numbers to our QuestionType enum.
 * Based on observed MS Forms API responses:
 *  1 = Text (short answer)
 *  2 = Text (long/paragraph)
 *  3 = Choice (single or multi)
 *  4 = Date
 *  5 = Ranking
 *  6 = Likert (grid-like rating scale)
 *  7 = NPS/Rating (numeric scale)
 *  8 = File Upload
 */
const mapMsQuestionType = (msType: number, allowMultiple?: boolean): QuestionType => {
  switch (msType) {
    case 1: return QuestionType.SHORT_ANSWER;
    case 2: return QuestionType.PARAGRAPH;
    case 3: return allowMultiple ? QuestionType.CHECKBOXES : QuestionType.MULTIPLE_CHOICE;
    case 4: return QuestionType.DATE;
    case 5: return QuestionType.MULTIPLE_CHOICE; // Ranking → treat as MC
    case 6: return QuestionType.MULTIPLE_CHOICE_GRID; // Likert
    case 7: return QuestionType.LINEAR_SCALE; // NPS / Rating
    case 8: return QuestionType.FILE_UPLOAD;
    default: return QuestionType.UNKNOWN;
  }
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

  // Build the submit action URL
  const actionUrl = `https://forms.office.com/formapi/api/${encodeURIComponent(formId)}/responses`;

  let itemIndex = 0;
  const items: FormItem[] = [];

  for (const q of (questionsData || [])) {
    const msType: number = q.type || 1;
    const allowMultiple: boolean = q.allowMultipleAnswer === true || q.isMultipleAnswer === true;
    const qType = mapMsQuestionType(msType, allowMultiple);

    if (qType === QuestionType.UNKNOWN || qType === QuestionType.FILE_UPLOAD) {
      itemIndex++;
      continue; // Skip unsupported types
    }

    // Parse options for choice questions
    let options: ChoiceOption[] = [];
    if (
      [QuestionType.MULTIPLE_CHOICE, QuestionType.CHECKBOXES, QuestionType.DROPDOWN].includes(qType) &&
      Array.isArray(q.choices)
    ) {
      options = q.choices.map((c: any, ci: number) => ({
        label: c.description || c.text || `Option ${ci + 1}`,
        id: c.id?.toString() || `choice_${ci}`,
      }));
    }

    // Parse Likert (grid) rows & columns
    let rows: { label: string; id?: string }[] = [];
    let columns: { label: string; id?: string }[] = [];
    if (qType === QuestionType.MULTIPLE_CHOICE_GRID && Array.isArray(q.rows) && Array.isArray(q.columns)) {
      rows = q.rows.map((r: any, ri: number) => ({
        label: r.text || r.description || `Row ${ri + 1}`,
        id: r.id?.toString() || `row_${ri}`,
      }));
      columns = q.columns.map((c: any, ci: number) => ({
        label: c.text || c.description || `Col ${ci + 1}`,
        id: c.id?.toString() || `col_${ci}`,
      }));
    }

    // Linear scale (NPS / rating)
    let scaleStart: number | undefined;
    let scaleEnd: number | undefined;
    if (qType === QuestionType.LINEAR_SCALE) {
      scaleStart = q.min ?? q.scaleStart ?? 1;
      scaleEnd = q.max ?? q.scaleEnd ?? (q.ratingCount ?? 5);
    }

    const item: FormItem = {
      id: q.id?.toString() || `ms_q_${itemIndex}`,
      submissionId: q.id?.toString() || `ms_q_${itemIndex}`,
      index: itemIndex,
      type: qType,
      title: q.title || q.questionText || q.description || '',
      description: q.subtitle || q.hint || '',
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
