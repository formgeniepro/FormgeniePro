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

  const hasRows = questionInfo?.Rows || questionInfo?.rows;
  const hasCols = questionInfo?.Columns || questionInfo?.columns || questionInfo?.Choices || questionInfo?.choices;
  
  // Check for matrix/likert first even in qInfo as some "Choice" types are grids
  if (t.includes('matrix') || t.includes('likert') || (hasRows && hasCols)) {
    return QuestionType.MULTIPLE_CHOICE_GRID;
  }

  if (t.includes('choice')) {
    if (questionInfo?.ChoiceType === 2 || questionInfo?.allowMultipleValues) return QuestionType.CHECKBOXES;
    return QuestionType.MULTIPLE_CHOICE;
  }
  if (t.includes('textfield') || t.includes('text') || t.includes('open')) {
    if (questionInfo?.IsLongAnswer || questionInfo?.IsMultiLine || questionInfo?.isMultiLine) return QuestionType.PARAGRAPH;
    return QuestionType.SHORT_ANSWER;
  }
  if (t.includes('date')) return QuestionType.DATE;
  if (t.includes('rating') || t.includes('nps')) return QuestionType.LINEAR_SCALE;
  if (t.includes('ranking')) return QuestionType.MULTIPLE_CHOICE;
  if (t.includes('file') || t.includes('upload')) return QuestionType.FILE_UPLOAD;
  if (t.includes('dropdown') || t.includes('combobox')) return QuestionType.DROPDOWN;
  if (t.includes('section') || t.includes('header')) return QuestionType.SECTION_HEADER;

  // Fallback: if it has choices, treat as MC
  if (questionInfo?.Choices && questionInfo.Choices.length > 0) return QuestionType.MULTIPLE_CHOICE;

  return QuestionType.SHORT_ANSWER;
};

/**
 * Robustly extracts a label from a Microsoft Forms choice/row/column object.
 */
const extractMsLabel = (obj: any, fallback: string): string => {
  if (!obj) return fallback;
  return (
    obj.Description ||
    obj.description ||
    obj.DisplayText ||
    obj.displayText ||
    obj.Text ||
    obj.text ||
    obj.FormsProDisplayRTText ||
    fallback
  );
};

/**
 * Parses the questionInfo JSON string from a question.
 */
const parseQuestionInfo = (raw: any): any => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
};

/**
 * Parses Microsoft Forms API JSON into ParsedForm.
 */
export const parseMicrosoftFormData = (
  formMeta: any,
  questionsData: any[],
  formId: string,
  originalUrl: string
): ParsedForm => {
  // ... existing code for title, actionUrl and sortedQuestions ...
  const title = formMeta?.title || formMeta?.name || 'Untitled Form';
  const description = formMeta?.description || '';
  const actionUrl = formMeta?.submitUrl || `https://forms.office.com/formapi/api/${encodeURIComponent(formId)}/responses`;

  let itemIndex = 0;
  const items: FormItem[] = [];
  const sortedQuestions = [...(questionsData || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const itemMap = new Map<string, FormItem>();
  const orphans: any[] = [];

  // Identify all explicitly declared matrix child IDs from Standard API Matrix wrappers
  const matrixChildIds = new Set<string>();
  for (const q of sortedQuestions) {
    const qInfo = parseQuestionInfo(q.questionInfo);
    const matrixRows = qInfo?.Rows || qInfo?.rows || q.rows || [];
    if (Array.isArray(matrixRows)) {
      matrixRows.forEach((r: any) => {
        if (r.Id) matrixChildIds.add(r.Id.toString());
        if (r.id) matrixChildIds.add(r.id.toString());
      });
    }
  }

  for (const q of sortedQuestions) {
    const qInfo = parseQuestionInfo(q.questionInfo);
    const msType: string = q.type || '';
    const qIdStr = q.id?.toString() || `ms_q_${itemIndex}`;
    const parentIdStr = (qInfo.ParentQuestionId || q.parentId)?.toString();

    const qType = mapMsQuestionType(msType, qInfo);

    if (qType === QuestionType.FILE_UPLOAD) {
      itemIndex++;
      continue;
    }

    // ── Parse choices (used natively or as columns) ──
    let options: ChoiceOption[] = [];
    if ([QuestionType.MULTIPLE_CHOICE, QuestionType.CHECKBOXES, QuestionType.DROPDOWN, QuestionType.MULTIPLE_CHOICE_GRID].includes(qType) || msType.toLowerCase().includes('choice')) {
      const choices = (qInfo.Choices && qInfo.Choices.length > 0) ? qInfo.Choices : (Array.isArray(q.choices) && q.choices.length > 0 ? q.choices : []);
      options = choices.map((c: any, ci: number) => ({
        label: extractMsLabel(c, `Option ${ci + 1}`),
        id: c.Id?.toString() || c.id?.toString() || extractMsLabel(c, `choice_${ci}`),
      }));
    }

    // ── Parse Standard Likert / Matrix rows & columns ──
    let rows: { label: string; id?: string }[] = [];
    let columns: { label: string; id?: string }[] = [];
    if (qType === QuestionType.MULTIPLE_CHOICE_GRID) {
      const matrixRows = qInfo.Rows || qInfo.rows || q.rows || [];
      const matrixColumns = qInfo.Columns || qInfo.columns || qInfo.Choices || qInfo.choices || q.columns || q.choices || [];

      rows = matrixRows.map((r: any, ri: number) => ({
        label: extractMsLabel(r, `Row ${ri + 1}`),
        id: r.Id?.toString() || r.id?.toString() || extractMsLabel(r, `row_${ri}`),
      }));
      columns = matrixColumns.map((c: any, ci: number) => ({
        label: extractMsLabel(c, `Option ${ci + 1}`),
        id: c.Id?.toString() || c.id?.toString() || extractMsLabel(c, `col_${ci}`),
      }));
    }

    // ── Linear scale (NPS / rating) ──
    let scaleStart: number | undefined;
    let scaleEnd: number | undefined;
    if (qType === QuestionType.LINEAR_SCALE) {
      scaleStart = qInfo.Min ?? qInfo.min ?? 1;
      scaleEnd = qInfo.Max ?? qInfo.max ?? (qInfo.RatingCount ?? qInfo.ratingCount ?? 5);
    }

    const titleText = q.title || q.formsProRTQuestionTitle || q.questionText || '';

    const item: FormItem = {
      id: qIdStr,
      submissionId: qIdStr,
      index: itemIndex,
      type: qType,
      title: titleText,
      description: q.subtitle || q.formsProRTSubtitle || q.hint || '',
      required: q.required === true || q.isRequired === true,
      options,
      rows,
      columns,
      scaleStart,
      scaleEnd,
    };

    // If it's explicitly a child row in either Standard or Light API, attach it to its parent
    if (matrixChildIds.has(qIdStr) || parentIdStr) {
      const targetParentId = parentIdStr || Array.from(itemMap.values()).find(p => p.rows?.some(r => r.id === qIdStr))?.id;
      if (targetParentId) {
        const parentItem = itemMap.get(targetParentId);
        if (parentItem) {
          // Promote parent to a grid if it isn't one already
          if (parentItem.type !== QuestionType.MULTIPLE_CHOICE_GRID && parentItem.type !== QuestionType.CHECKBOX_GRID) {
             parentItem.type = item.type === QuestionType.CHECKBOXES ? QuestionType.CHECKBOX_GRID : QuestionType.MULTIPLE_CHOICE_GRID;
          }
          // If the Light API parent has `options` but no `columns`, move the options into columns!
          if (!parentItem.columns || parentItem.columns.length === 0) {
             parentItem.columns = [...(parentItem.options || [])];
             parentItem.options = [];
          }
          // Add this child as a row to the parent (if not already appended by Standard parsing)
          if (!parentItem.rows) parentItem.rows = [];
          if (!parentItem.rows.some(r => r.id === qIdStr)) {
             parentItem.rows.push({ label: item.title || `Row ${parentItem.rows.length + 1}`, id: qIdStr });
          }
        } else {
          // Parent not parsed yet (came out of order), store in orphans
          orphans.push({ parentId: targetParentId, childItem: item });
        }
      }
      itemIndex++;
      continue;
    }

    // Normal processing for root items
    itemMap.set(qIdStr, item);
    items.push(item);
    itemIndex++;
  }

  // Final pass for any out-of-order orphaned children
  orphans.forEach(({ parentId, childItem }) => {
     const parentItem = itemMap.get(parentId);
     if (parentItem) {
        if (parentItem.type !== QuestionType.MULTIPLE_CHOICE_GRID && parentItem.type !== QuestionType.CHECKBOX_GRID) {
            parentItem.type = childItem.type === QuestionType.CHECKBOXES ? QuestionType.CHECKBOX_GRID : QuestionType.MULTIPLE_CHOICE_GRID;
        }
        if (!parentItem.columns || parentItem.columns.length === 0) {
            parentItem.columns = [...(parentItem.options || [])];
            parentItem.options = [];
        }
        if (!parentItem.rows) parentItem.rows = [];
        if (!parentItem.rows.some((r: any) => r.id === childItem.id)) {
            parentItem.rows.push({ label: childItem.title || `Row ${parentItem.rows.length + 1}`, id: childItem.id });
        }
     }
  });

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
