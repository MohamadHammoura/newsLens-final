// src/services/aiService.ts

const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function getSentiment(text: string): Promise<string> {
  const prompt = `Classify the sentiment of this article as one of the following: POSITIVE, NEGATIVE, or NEUTRAL.\n\nArticle:\n"${text}"`;

  console.log('text', text
  )

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku", // You can also try: "mistralai/mistral-7b-instruct"
      messages: [
        {
          role: "system",
          content: "You classify the emotional tone of text as: Neutral, Positive, or Negative"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    })
  });

  const result = await response.json();
  console.log("Sentiment Analysis Result:", result);
  const content = result.choices?.[0]?.message?.content?.trim().toUpperCase() || "NEUTRAL";

  return content
}

// ✅ Step 2: Generate an emotional, helpful message using OpenRouter
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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku", // You can also try: "mistralai/mistral-7b-instruct"
      messages: [
        {
          role: "system",
          content: "You are a wise, emotionally intelligent assistant helping users emotionally process news articles with clarity, hope, or reflection."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    })
  });

  const result = await response.json();

  console.log("OpenRouter Response:", result);

  if (result.error) {
    console.error("OpenRouter Generation Error:", result.error);
    
  }

  return result.choices?.[0]?.message?.content?.trim() || defaultFallback(sentiment);
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