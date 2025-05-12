// background.js

const OPENROUTER_API_KEY = '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';

const NEWS_DOMAINS = [
  'cnn.com', 'bbc.com', 'nytimes.com',
  'theguardian.com', 'npr.org', 'reuters.com',
  'washingtonpost.com', 'apnews.com'
];

function isNewsSite(url) {
  return NEWS_DOMAINS.some(domain => url.includes(domain));
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("NewsLens extension installed");
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractAndSendToApp
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && isNewsSite(tab.url)) {
    chrome.storage.local.get('detectionEnabled', async ({ detectionEnabled }) => {
      console.log('[NewsLens] Tab updated:', tab.url);
      console.log('[NewsLens] detectionEnabled:', detectionEnabled);

      if (!detectionEnabled) return;

      try {
        // Check if it's an article page using content script
        const [{ result: isArticle }] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const url = window.location.href;
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
        });

        if (!isArticle) {
          console.log('[NewsLens] Not an article page, skipping analysis');
          return;
        }

        console.log('[NewsLens] Article page detected ✅');

        // Extract article info
        const [{ result: article }] = await chrome.scripting.executeScript({
          target: { tabId },
          func: extractArticleInfo
        });

        if (!article?.title) {
          console.log('[NewsLens] No article title found, skipping analysis');
          return;
        }

        const text = `${article.title}. ${article.description}`;

        console.log('[NewsLens] Sending sentiment request...');
        const sentiment = await getSentiment(text);

        console.log('[NewsLens] Sending reflection request...');
        const aiResponse = await getCustomGPTResponse(text, sentiment);

        chrome.storage.local.set({
          lastArticle: {
            ...article,
            sentiment,
            aiResponse,
            timestamp: Date.now()
          }
        });

        console.log('[NewsLens] Analysis saved to storage ✅');

        // Notify content script to show overlay
        chrome.tabs.sendMessage(tabId, { type: 'articleAnalyzed' });
      } catch (err) {
        console.error('[NewsLens] Error running analysis:', err);
      }
    });
  }
});

function extractArticleInfo() {
  const title = document.title;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const image = document.querySelector('meta[property="og:image"]')?.content || '';
  const url = window.location.href;
  return { title, description, image, url };
}

function extractAndSendToApp() {
  const title = document.title;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const image = document.querySelector('meta[property="og:image"]')?.content || '';
  const url = window.location.href;

  const baseUrl = 'http://localhost:5174/analyze';
  const params = new URLSearchParams({ title, description, image, url });

  window.open(`${baseUrl}?${params.toString()}`, '_blank');
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
      prompt = `This article discusses a heavy or difficult event. Please respond with a thoughtful, emotionally intelligent message that helps the reader process it with hope, compassion, or perspective.\n\nArticle summary: \"${text}\"`;
      break;
    case "POSITIVE":
      prompt = `This article shares something uplifting or encouraging. Please respond with a warm, celebratory message that inspires gratitude or positive action.\n\nArticle summary: \"${text}\"`;
      break;
    default:
      prompt = `This article is neutral in tone. Please offer a short reflection or thoughtful question that encourages deeper thinking or curiosity.\n\nArticle summary: \"${text}\"`;
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
