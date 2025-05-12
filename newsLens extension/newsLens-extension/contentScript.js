const GEMINI_API_KEY = 'AIzaSyCdM3GwuZxOvpEPEOJzXk9EP14vBvvTqWg';

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'runAnalysis') {
    runAnalysisOnPage();
  } else if (request.type === 'articleAnalyzed') {
    refreshOverlayFromStorage();
  }
});

(async function () {
  const url = window.location.href;
  
  // Check if this is likely an article page
  const isArticlePage = isArticleUrl(url) && hasArticleContent();
  if (!isArticlePage) return;

  const { detectionEnabled } = await chrome.storage.local.get(['detectionEnabled']);
  if (!detectionEnabled) return;

  // Run analysis immediately
  runAnalysisOnPage();
})();

function isArticleUrl(url) {
  // Check for common article URL patterns
  const articlePatterns = [
    /\d{4}\/\d{2}\/\d{2}/, // Date pattern
    /\/article\//,
    /\/story\//,
    /\/news\//,
    /\d+$/, // Ends with number
    /[a-z0-9-]+-[a-z0-9-]+$/ // Slug pattern
  ];
  
  return articlePatterns.some(pattern => pattern.test(url));
}

function hasArticleContent() {
  // Check for common article content indicators
  const title = document.title;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const articleTag = document.querySelector('article');
  const mainContent = document.querySelector('main');
  
  return (
    title && 
    title.length > 10 && 
    (description || articleTag || mainContent)
  );
}

async function refreshOverlayFromStorage() {
  const { lastArticle } = await chrome.storage.local.get(['lastArticle']);
  const currentUrl = window.location.href;
  if (!lastArticle || lastArticle.url !== currentUrl) return;

  removeExistingOverlay();
  showOverlay(lastArticle.sentiment, lastArticle.aiResponse);
}

async function runAnalysisOnPage() {
  const url = window.location.href;
  if (!/\d/.test(url)) return;

  const title = document.title;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const image = document.querySelector('meta[property="og:image"]')?.content || '';
  if (!title || title.length < 10) return;

  const article = { title, description, image, url };
  const text = `${title}. ${description}`;

  const sentiment = await getSentiment(text);
  const aiResponse = await getCustomGPTResponse(text, sentiment);

  chrome.storage.local.set({
    lastArticle: { ...article, sentiment, aiResponse, timestamp: Date.now() }
  });

  // Send to backend API
  try {
    await fetch("http://localhost:3001/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description,
        image,
        url,
        sentiment,
        aiResponse
      })
    });
    console.log("✅ Article sent to backend");
  } catch (error) {
    console.error("❌ Failed to send article to backend:", error);
  }

  removeExistingOverlay();
  showOverlay(sentiment, aiResponse);
}

function showOverlay(sentiment, aiResponse) {
  const container = document.createElement("div");
  container.id = "newsLensOverlay";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.maxWidth = "300px";
  container.style.zIndex = "10000";
  container.style.background = "#fff";
  container.style.border = "1px solid #ccc";
  container.style.borderRadius = "8px";
  container.style.padding = "12px";
  container.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
  container.style.fontFamily = "sans-serif";
  container.style.fontSize = "14px";
  container.style.color = "#222";

  container.innerHTML = `
    <strong>🧠 NewsLens AI</strong><br>
    <strong>Sentiment:</strong> ${sentiment}<br>
    <em>${aiResponse}</em>
    <div style="margin-top: 8px; text-align: right;">
      <button id="closeOverlay" style="padding: 4px 8px; font-size: 12px; cursor: pointer;">Dismiss</button>
    </div>
  `;

  document.body.appendChild(container);
  document.getElementById("closeOverlay").addEventListener("click", () => container.remove());
}

function removeExistingOverlay() {
  const existing = document.getElementById("newsLensOverlay");
  if (existing) existing.remove();
}

async function getSentiment(text) {
  const prompt = `Classify the sentiment of this article as one of the following: POSITIVE, NEGATIVE, or NEUTRAL. Just respond with the one word only.\n\nArticle:\n"${text}"`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  const result = await response.json();
  const raw = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || "NEUTRAL";

  // Extract just the label if it's buried in a sentence
  if (raw.includes("NEGATIVE")) return "NEGATIVE";
  if (raw.includes("POSITIVE")) return "POSITIVE";
  if (raw.includes("NEUTRAL")) return "NEUTRAL";

  return "NEUTRAL"; // fallback
}

async function getCustomGPTResponse(text, sentiment) {
  const { responseLength = 'medium' } = await chrome.storage.local.get('responseLength');
  const tokenMap = { short: 60, medium: 100, long: 160 };

  let prompt = "";

  switch (sentiment) {
    case "NEGATIVE":
      prompt = `This article discusses a heavy or difficult event. Please respond with a thoughtful, emotionally intelligent message that helps the reader process it with hope, compassion, or perspective.\n\nArticle summary: "${text}"`;
      break;
    case "POSITIVE":
      prompt = `This article shares something uplifting or encouraging. Please respond with a warm, celebratory message that inspires gratitude or positive action.\n\nArticle summary: "${text}"`;
      break;
    default:
      prompt = `This article is neutral in tone. Please offer a short reflection or thoughtful question that encourages deeper thinking or curiosity.\n\nArticle summary: "${text}"`;
      break;
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  const result = await response.json();

  // 🧠 Debug log to inspect Gemini's raw response
  console.log("🧠 Gemini API raw result:", result);

  return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}
