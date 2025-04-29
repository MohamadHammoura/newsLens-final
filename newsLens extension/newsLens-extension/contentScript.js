const OPENROUTER_API_KEY = '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';

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'runAnalysis') {
    runAnalysisOnPage();
  } else if (request.type === 'articleAnalyzed') {
    refreshOverlayFromStorage();
  }
});

(async function () {
  const url = window.location.href;
  if (!/\d/.test(url)) return;

  const { detectionEnabled } = await chrome.storage.local.get(['detectionEnabled']);
  if (!detectionEnabled) return;

  refreshOverlayFromStorage();
})();

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
  const prompt = `Classify the sentiment of this article as one of the following: POSITIVE, NEGATIVE, or NEUTRAL.\n\nArticle:\n"${text}"`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku",
      messages: [
        { role: "system", content: "You classify the emotional tone of text as: Neutral, Positive, or Negative" },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 100
    })
  });

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim().toUpperCase() || "NEUTRAL";
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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku",
      messages: [
        { role: "system", content: "You are a wise, emotionally intelligent assistant helping users emotionally process news articles." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: tokenMap[responseLength] || 100
    })
  });

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim() || "";
}