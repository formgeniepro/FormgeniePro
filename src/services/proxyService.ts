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
export const fetchMicrosoftFormData = async (url: string): Promise<{ formMeta: any; questions: any[], resolvedFormId: string }> => {
  let targetUrl = url.trim();
  if (!targetUrl.toLowerCase().startsWith('http')) targetUrl = 'https://' + targetUrl;

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

  // 1. If it's a short URL (/r/), we must follow the redirect first to get the real ID.
  // We use codetabs proxy because it natively follows redirects and we can inspect the final URL or content.
  let resolvedFormId = extractMsFormId(targetUrl);
  
  if (targetUrl.includes('/r/')) {
    try {
      // Codetabs proxy allows us to see where a request ultimately lands.
      const redirectCheckUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const res = await fetchWithTimeout(redirectCheckUrl);
      // It might give us HTML with the real URL in config, or we check if we can parse it differently,
      // but usually the proxy follows to /Pages/ResponsePage.aspx
      
      // Let's try parsing the actual page source it returns. MS Forms embeds the ID in window.FormData = {"id": "..."}
      const htmlText = await res.text();
      const match = htmlText.match(/"?id"?\s*:\s*"([a-zA-Z0-9_-]{20,})"/i);
      if (match && match[1]) {
           resolvedFormId = match[1];
      }
    } catch (e) {
      console.warn("Failed attempting to resolve short MS Form link.", e);
    }
  }

  if (!resolvedFormId || resolvedFormId.length < 15 && targetUrl.includes('/r/')) {
      // If we couldn't parse it out from HTML block, try the allorigins redirect bypass
       try {
           const redirectCheckUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
           const res = await fetchWithTimeout(redirectCheckUrl);
           const json = await res.json();
           if (json.url) {
                resolvedFormId = extractMsFormId(json.url) || resolvedFormId;
           }
       } catch (e) {
           console.warn("Failed second attempt to resolve short MS Form link.", e);
       }
  }

  if (!resolvedFormId) {
    throw new Error("Could not extract a valid Microsoft Forms ID from the URL. Please check the URL and try again.");
  }

  const proxyGenerators = [
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    // Removed corsproxy.io because it responds with 403 for Microsoft Forms API
    // Removed allorigins.win because it wraps JSON improperly and fails to parse Microsoft payloads in the browser
  ];

  // Internal MS Forms API endpoints (work for public forms)
  const metaUrl = `https://forms.office.com/formapi/api/${encodeURIComponent(resolvedFormId as string)}`;
  const questionsUrl = `https://forms.office.com/formapi/api/${encodeURIComponent(resolvedFormId as string)}/questions`;

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

  return { formMeta, questions, resolvedFormId };
};