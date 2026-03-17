import { extractMsFormId } from './microsoftFormsParser';

/**
 * Fetches the HTML content of a Google Form URL using public CORS proxies.
 * Tries multiple proxies to ensure reliability.
 */
export const fetchUrlContent = async (url: string): Promise<string> => {
  let targetUrl = url.trim();
  
  // Ensure protocol exists
  if (!targetUrl.toLowerCase().startsWith('http')) {
    targetUrl = 'https://' + targetUrl;
  }

  // Helper to wait/timeout if a request hangs
  const fetchWithTimeout = async (resource: string, options: RequestInit = {}) => {
    const { timeout = 15000 } = options as any;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  // Array of proxy URL generators
  // 1. CodeTabs - Very reliable for simple GETs
  // 2. AllOrigins - Reliable fallback
  // 3. CorsProxy.io - Fast, sometimes blocks Google Forms
  const proxyGenerators = [
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`
  ];

  for (const generateProxyUrl of proxyGenerators) {
    try {
      const proxyUrl = generateProxyUrl(targetUrl);
      const response = await fetchWithTimeout(proxyUrl);
      
      if (!response.ok) {
        console.warn(`Proxy ${proxyUrl} failed with status ${response.status}`);
        continue;
      }
      
      const text = await response.text();
      
      // Basic validation to ensure we got HTML and not an error page or empty response
      // Google Forms always contain "FB_PUBLIC_LOAD_DATA_"
      if (text && text.length > 500 && (text.includes('FB_PUBLIC_LOAD_DATA_') || text.includes('docs.google.com/forms'))) {
        return text;
      } else {
        console.warn("Fetched content did not appear to be a valid Google Form.");
      }
    } catch (error: any) {
      console.warn(`Proxy attempt failed for ${targetUrl}:`, error);
      // Continue to next proxy
    }
  }

  throw new Error(
    "Unable to fetch the form automatically due to browser security restrictions (CORS). Please check that the form is public and the URL is correct."
  );
};

/**
 * Fetches Microsoft Form metadata and questions via CORS proxy.
 * Returns [formMeta, questionsArray].
 */
export const fetchMicrosoftFormData = async (url: string): Promise<{ formMeta: any; questions: any[] }> => {
  const formId = extractMsFormId(url);
  if (!formId) {
    throw new Error("Could not extract a valid Microsoft Forms ID from the URL. Please check the URL and try again.");
  }

  const fetchWithTimeout = async (resource: string, options: RequestInit = {}) => {
    const { timeout = 15000 } = options as any;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const proxyGenerators = [
    (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];

  // Internal MS Forms API endpoints (work for public forms)
  const metaUrl = `https://forms.office.com/formapi/api/${encodeURIComponent(formId)}`;
  const questionsUrl = `https://forms.office.com/formapi/api/${encodeURIComponent(formId)}/questions`;

  let formMeta: any = null;
  let questions: any[] = [];

  // Try to fetch form metadata
  for (const generateProxyUrl of proxyGenerators) {
    try {
      const proxyUrl = generateProxyUrl(metaUrl);
      const response = await fetchWithTimeout(proxyUrl);
      if (!response.ok) continue;

      const text = await response.text();
      let parsed: any;
      // AllOrigins wraps in {contents, status}
      try {
        const wrapper = JSON.parse(text);
        parsed = wrapper.contents ? JSON.parse(wrapper.contents) : wrapper;
      } catch {
        parsed = JSON.parse(text);
      }

      if (parsed && (parsed.title !== undefined || parsed.id !== undefined)) {
        formMeta = parsed;
        break;
      }
    } catch (e) {
      console.warn('MS Forms meta fetch failed with proxy, trying next...', e);
    }
  }

  // Try to fetch questions
  for (const generateProxyUrl of proxyGenerators) {
    try {
      const proxyUrl = generateProxyUrl(questionsUrl);
      const response = await fetchWithTimeout(proxyUrl);
      if (!response.ok) continue;

      const text = await response.text();
      let parsed: any;
      try {
        const wrapper = JSON.parse(text);
        parsed = wrapper.contents ? JSON.parse(wrapper.contents) : wrapper;
      } catch {
        parsed = JSON.parse(text);
      }

      // Questions endpoint returns an array or {value: [...]}
      if (Array.isArray(parsed)) {
        questions = parsed;
        break;
      } else if (parsed && Array.isArray(parsed.value)) {
        questions = parsed.value;
        break;
      }
    } catch (e) {
      console.warn('MS Forms questions fetch failed with proxy, trying next...', e);
    }
  }

  if (!formMeta && questions.length === 0) {
    throw new Error(
      "Unable to fetch the Microsoft Form. Please ensure the form is set to 'Anyone can respond' (public) and the URL is correct. If the issue persists, the form may not be accessible without a Microsoft account."
    );
  }

  // If meta failed but questions succeeded, create minimal meta from questions data
  if (!formMeta) {
    formMeta = { title: 'Microsoft Form', description: '' };
  }

  return { formMeta, questions };
};