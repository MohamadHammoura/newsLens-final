// src/services/aiService.ts

const GEMINI_API_KEY = 'AIzaSyCdM3GwuZxOvpEPEOJzXk9EP14vBvvTqWg';

export async function getSentiment(text: string): Promise<string> {
  const prompt = `Classify the sentiment of this article as one of the following: POSITIVE, NEGATIVE, or NEUTRAL.\n\nArticle:\n"${text}"`;

  console.log('text', text);

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
  console.log("Sentiment Analysis Result:", result);
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || "NEUTRAL";

  return content;
}

// ✅ Step 2: Generate an emotional, helpful message using Gemini
export async function getCustomGPTResponse(text: string, sentiment: string): Promise<string> {
  let prompt = "";

  switch (sentiment.toUpperCase()) {
    case "NEGATIVE":
      prompt = `This article discusses a heavy or difficult event. Please respond with a thoughtful, emotionally intelligent message that helps the reader process it with hope, compassion, or perspective.\n\nArticle summary: "${text}"`;
      break;

    case "POSITIVE":
      prompt = `This article shares something uplifting or encouraging. Please respond with a warm, celebratory message that inspires gratitude or positive action.\n\nArticle summary: "${text}"`;
      break;

    case "NEUTRAL":
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
  console.log("Gemini Response:", result);

  if (result.error) {
    console.error("Gemini Generation Error:", result.error);
    return defaultFallback(sentiment);
  }

  return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || defaultFallback(sentiment);
}

function defaultFallback(sentiment: string): string {
  switch (sentiment.toUpperCase()) {
    case "NEGATIVE":
      return "Take a breath — even heavy news can lead to clarity and growth. 🌱";
    case "POSITIVE":
      return "This is good news — let it land and ripple outward. ☀️";
    default:
      return "A good moment to pause and reflect. 🧘";
  }
}