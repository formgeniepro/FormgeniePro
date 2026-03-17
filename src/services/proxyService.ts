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
 * Fetches Microsoft Form data by:
 * 1. Loading the form's HTML page via CORS proxy
 * 2. Extracting the tenant-specific prefetchFormUrl from the embedded JS config
 * 3. Fetching the actual form data (title + questions) from that API URL
 *
 * This works because MS Forms embeds the exact API URL in the page HTML,
 * including tenant ID and user ID, which are required for the API to respond.
 */
export const fetchMicrosoftFormData = async (url: string): Promise<{ formMeta: any; questions: any[], resolvedFormId: string }> => {
  let targetUrl = url.trim();
  if (!targetUrl.toLowerCase().startsWith('http')) targetUrl = 'https://' + targetUrl;

  const fetchWithTimeout = async (resource: string, options: RequestInit = {}) => {
    const { timeout = 20000 } = options as any;
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

  const proxyUrl = (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`;

  // ── Step 1: Fetch the form HTML page ──
  let html = '';
  try {
    const res = await fetchWithTimeout(proxyUrl(targetUrl));
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
    html = await res.text();
  } catch (e) {
    console.warn('Primary proxy failed for MS Forms HTML, trying allorigins...', e);
    try {
      const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) throw new Error(`AllOrigins returned ${res.status}`);
      html = await res.text();
    } catch (e2) {
      throw new Error(
        "Unable to fetch the Microsoft Form page. Please check the URL is correct and the form is public."
      );
    }
  }

  if (!html || html.length < 200) {
    throw new Error("Received empty or invalid response from the Microsoft Form URL.");
  }

  // ── Step 2: Extract the prefetchFormUrl from page config ──
  // MS Forms embeds a JSON config in the HTML with the exact API endpoint to fetch form data.
  // The key is "prefetchFormUrl" which contains a tenant-specific OData URL with $expand=questions($expand=choices)
  const prefetchMatch = html.match(/"prefetchFormUrl"\s*:\s*"([^"]+)"/i);
  
  let prefetchUrl = '';
  if (prefetchMatch && prefetchMatch[1]) {
    // Unescape unicode quotes: \u0027 → '
    prefetchUrl = prefetchMatch[1]
      .replace(/\\u0027/g, "'")
      .replace(/\\u0026/g, "&")
      .replace(/\\u003c/g, "<")
      .replace(/\\u003e/g, ">");
  }

  if (!prefetchUrl) {
    throw new Error(
      "Could not find the form data endpoint in the page HTML. The form may require authentication or the URL may be incorrect."
    );
  }

  // Extract resolvedFormId from the prefetchUrl or from the original URL
  let resolvedFormId = extractMsFormId(targetUrl) || 'unknown';
  // Try to get a better ID from the prefetch URL (the OData key inside runtimeForms('...'))
  const oDataIdMatch = prefetchUrl.match(/runtimeForms\('([^']+)'\)/i);
  if (oDataIdMatch && oDataIdMatch[1]) {
    resolvedFormId = oDataIdMatch[1];
  }

  // ── Step 3: Fetch the actual form data from the prefetch URL ──
  // This single endpoint returns BOTH form metadata (title, description) AND questions with choices
  let formData: any = null;
  try {
    const res = await fetchWithTimeout(proxyUrl(prefetchUrl));
    if (!res.ok) throw new Error(`API proxy returned ${res.status}`);
    const text = await res.text();
    formData = JSON.parse(text);
  } catch (e) {
    console.warn('Primary proxy failed for MS Forms API, trying direct...', e);
    // Try fetching directly (works from Node/server contexts)
    try {
      const res = await fetchWithTimeout(prefetchUrl);
      if (!res.ok) throw new Error(`Direct API returned ${res.status}`);
      const text = await res.text();
      formData = JSON.parse(text);
    } catch (e2) {
      throw new Error(
        "Unable to fetch the Microsoft Form data. Please ensure the form is set to 'Anyone can respond' (public). If the issue persists, the form may not be accessible without a Microsoft account."
      );
    }
  }

  // ── Step 4: Extract metadata and questions from the combined response ──
  const formMeta: { title: string; description: string; id: string; submitUrl?: string } = {
    title: formData.title || formData.formsProRTTitle || 'Untitled Form',
    description: formData.description || formData.formsProRTDescription || '',
    id: formData.id || resolvedFormId,
  };

  const questions = Array.isArray(formData.questions) ? formData.questions : [];

  if (!formMeta.title && questions.length === 0) {
    throw new Error(
      "The form data was fetched but appears to be empty. Please verify the form URL."
    );
  }

  // ── Step 5: Build the submission URL from the prefetch URL pattern ──
  // Replace runtimeForms(...)?$expand=... with responses
  // e.g. .../light/runtimeForms('ID')?$expand=... → .../light/runtimeForms('ID')/responses  
  // We store this in formMeta so the parser can use it for actionUrl
  const submitUrlBase = prefetchUrl.replace(/\?\$expand.*$/, '');
  formMeta.submitUrl = submitUrlBase.replace(/runtimeForms\('[^']+'\)/, `runtimeForms('${resolvedFormId}')/responses`);

  return { formMeta, questions, resolvedFormId };
};