// backend/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

let articles = []; // In-memory store

const OPENROUTER_API_KEY = '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';
const NEWSDATA_API_KEY = 'pub_85088583de17c86ec98e77987110eeb5ea978';

async function getSentiment(text) {
    const prompt = `Classify the sentiment of this article as one of the following: POSITIVE, NEGATIVE, or NEUTRAL. Just respond with the one word only.\n\nArticle:\n"${text}"`;

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
            temperature: 0.5,
            max_tokens: 250
        })
    });

    const result = await response.json();
    const raw = result.choices?.[0]?.message?.content?.trim().toUpperCase() || "NEUTRAL";
    if (raw.includes("NEGATIVE")) return "NEGATIVE";
    if (raw.includes("POSITIVE")) return "POSITIVE";
    if (raw.includes("NEUTRAL")) return "NEUTRAL";
    return "NEUTRAL";
}

async function getCustomGPTResponse(text, sentiment) {
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
                { role: "system", content: "You generate thoughtful, calming, or perspective-shifting reflections on news stories." },
                { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 400,
            stop_sequences: []
        })
    });

    const result = await response.json();
    return result.choices?.[0]?.message?.content?.trim() || "";
}

app.post('/fetch-news', async (req, res) => {
    try {
        const { keyword = "technology" } = req.body;
        const newsUrl = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(keyword)}&language=en&country=us&category=top&size=5`;

        const newsRes = await fetch(newsUrl);
        const newsData = await newsRes.json();
        const newsArticles = newsData.results || [];

        let addedCount = 0;

        for (const n of newsArticles) {
            if (articles.some(a => a.url === n.link)) continue;

            const title = n.title || "";
            const description = n.description || "";
            const url = n.link;
            const image = n.image_url || "";
            const text = `${title}. ${description}`;

            const sentiment = await getSentiment(text);
            const aiResponse = await getCustomGPTResponse(text, sentiment);

            const article = { title, description, image, url, sentiment, aiResponse, timestamp: Date.now() };
            articles.push(article);
            addedCount++;
        }

        res.status(201).json({ message: "NewsData articles fetched and saved", count: addedCount });
    } catch (error) {
        console.error("❌ Error fetching NewsData articles:", error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.post('/articles', (req, res) => {
    const { title, description, image, url, sentiment, aiResponse } = req.body;
    if (!title || !url || !sentiment || !aiResponse) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const article = { title, description, image, url, sentiment, aiResponse, timestamp: Date.now() };
    articles.push(article);
    console.log("✅ New article saved:", article);
    res.status(201).json({ message: 'Article saved successfully' });
});

app.delete('/articles', (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'Missing article URL' });
    }

    const beforeCount = articles.length;
    articles = articles.filter(a => a.url !== url);
    const afterCount = articles.length;

    if (beforeCount === afterCount) {
        return res.status(404).json({ error: 'Article not found' });
    }

    console.log(`🗑 Deleted article with URL: ${url}`);
    res.json({ message: 'Article deleted successfully' });
});

app.get('/articles', (req, res) => {
    res.json(articles);
});

app.listen(PORT, () => {
    console.log(`NewsLens backend listening on port ${PORT}`);
});
