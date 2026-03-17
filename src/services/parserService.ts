import { ParsedForm, FormItem, QuestionType, ChoiceOption, GridDimension } from "../types";

export const parseFormHTML = async (htmlContent: string): Promise<ParsedForm> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Extract Form Action
    const formElement = doc.querySelector('form');
    let actionUrl = formElement?.getAttribute('action') || undefined;
    if (actionUrl && !actionUrl.startsWith("http")) {
       actionUrl = "https://docs.google.com" + actionUrl;
    }

    // 2. Extract fbzx Token (Security Token)
    // Often located in a hidden input named 'fbzx'
    const fbzxInput = doc.querySelector('input[name="fbzx"]');
    const fbzx = fbzxInput?.getAttribute('value') || undefined;

    // 3. Locate Data Script
    const scripts = Array.from(doc.getElementsByTagName('script'));
    const dataScript = scripts.find(s => s.innerHTML.includes("FB_PUBLIC_LOAD_DATA_"));
    if (!dataScript) throw new Error("Could not detect Google Form data.");

    // 4. Parse JSON
    const scriptContent = dataScript.innerHTML;
    const beginIndex = scriptContent.indexOf("[");
    const lastIndex = scriptContent.lastIndexOf(";");
    
    if (beginIndex === -1 || lastIndex === -1) {
        throw new Error("Could not parse JSON boundaries in the script content.");
    }

    const jsonString = scriptContent.substring(beginIndex, lastIndex).trim();
    const jArray = JSON.parse(jsonString);

    // Root data checks
    if (!jArray || !jArray[1]) {
        throw new Error("Invalid JSON structure: Missing root data [1]");
    }

    const title = jArray[1][8] || jArray[3] || "Untitled Form";
    const description = jArray[1][0] || "";
    const formId = jArray[14] || "";
    const documentTitle = jArray[3] || "";
    const rawItems = jArray[1][1] || [];

    const items: FormItem[] = rawItems.map((field: any, index: number) => {
        if (!field || field.length < 4) return null;

        const typeId = field[3];
        const id = field[0]?.toString() || `q-${index}`;
        const questionText = field[1] || "";
        const questionDesc = field[2] || ""; 
        
        let type = QuestionType.UNKNOWN;
        let isPageBreak = false;
        
        // Map Types
        switch (typeId) {
            case 0: type = QuestionType.SHORT_ANSWER; break;
            case 1: type = QuestionType.PARAGRAPH; break;
            case 2: type = QuestionType.MULTIPLE_CHOICE; break;
            case 3: type = QuestionType.DROPDOWN; break;
            case 4: type = QuestionType.CHECKBOXES; break;
            case 5: type = QuestionType.LINEAR_SCALE; break;
            case 6: type = QuestionType.SECTION_HEADER; break; 
            case 7: type = QuestionType.MULTIPLE_CHOICE_GRID; break;
            case 8: 
                type = QuestionType.SECTION_HEADER; 
                isPageBreak = true; 
                break;
            case 9: type = QuestionType.DATE; break;
            case 10: type = QuestionType.TIME; break;
            case 11: type = QuestionType.CHECKBOX_GRID; break;
            case 13: type = QuestionType.FILE_UPLOAD; break;
            default: type = QuestionType.UNKNOWN; break;
        }

        const rawGridData = field[4];
        
        // Attempt to get the configuration array (where ID lives)
        // For most questions: field[4][0]
        // Structural items (Type 8) often have empty field[4], so fieldConfig will be null/undefined.
        const fieldConfig = (Array.isArray(rawGridData) && rawGridData.length > 0 && Array.isArray(rawGridData[0])) 
           ? rawGridData[0] 
           : null;

        // If we lack config/ID, we can only keep it if it's a structural element (Header/PageBreak)
        // because those are needed for pageHistory calculation.
        if (!fieldConfig && type !== QuestionType.SECTION_HEADER) {
            return null;
        }

        const submissionId = fieldConfig ? fieldConfig[0]?.toString() : undefined;
        const required = fieldConfig ? fieldConfig[2] === 1 : false;
        
        let options: ChoiceOption[] = [];
        let rows: GridDimension[] = [];
        let columns: GridDimension[] = [];
        let scaleStart, scaleEnd, scaleStartLabel, scaleEndLabel;
        let limitOneResponsePerColumn = false;

        // --- GRID PARSING ---
        if ((type === QuestionType.MULTIPLE_CHOICE_GRID || type === QuestionType.CHECKBOX_GRID) && fieldConfig) {
            // Check for "Limit to 1 response per column" validation
            if (fieldConfig[4] && Array.isArray(fieldConfig[4]) && fieldConfig[4][0] === 1) {
                limitOneResponsePerColumn = true;
            }

            if (Array.isArray(rawGridData) && rawGridData.length > 0) {
                // A. Extract Columns (from the first element's nested option array)
                const columnSource = rawGridData[0]?.[1]; 
                if (Array.isArray(columnSource)) {
                    columns = columnSource.map((c: any) => ({
                        label: c[0]?.toString() || "",
                        id: c[0]?.toString()
                    }));
                }

                // B. Extract Rows (from index 0 to the end)
                rows = rawGridData.map((r: any) => ({
                    label: r[3]?.toString() || "", 
                    id: r[0]?.toString() 
                })).filter((r: any) => r.label && r.label !== "");
            }
        } 
        // --- CHOICE PARSING ---
        else if ([QuestionType.MULTIPLE_CHOICE, QuestionType.CHECKBOXES, QuestionType.DROPDOWN].includes(type) && fieldConfig) {
            const answerList = fieldConfig[1];
            if (Array.isArray(answerList)) {
                options = answerList.map((opt: any) => ({
                    label: opt[0]?.toString() || "",
                    id: opt[0]?.toString() 
                }));
            }
        }
        // --- LINEAR SCALE ---
        else if (type === QuestionType.LINEAR_SCALE && fieldConfig) {
             scaleStartLabel = fieldConfig[3] || "";
             scaleEndLabel = fieldConfig[4] || "";
             scaleStart = fieldConfig[5] !== undefined ? parseInt(fieldConfig[5]) : 1;
             scaleEnd = fieldConfig[6] !== undefined ? parseInt(fieldConfig[6]) : 5;
        }

        return {
            id,
            submissionId,
            index,
            type,
            title: questionText,
            description: questionDesc,
            required,
            limitOneResponsePerColumn,
            isPageBreak,
            options,
            scaleStart,
            scaleEnd,
            scaleStartLabel,
            scaleEndLabel,
            rows,
            columns
        };
    }).filter((i: FormItem | null): i is FormItem => i !== null);

    return { 
        title, 
        description, 
        formId, 
        documentTitle,
        actionUrl, 
        fbzx, 
        items 
    };
  } catch (error: any) {
    console.error("Parser Error:", error);
    throw new Error(`Parsing failed: ${error.message}`);
  }
};