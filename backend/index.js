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

const GEMINI_API_KEY = 'AIzaSyCdM3GwuZxOvpEPEOJzXk9EP14vBvvTqWg';
const NEWSDATA_API_KEY = 'pub_85088583de17c86ec98e77987110eeb5ea978';

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
    return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
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
            if (articles.some(a => a.url === n.link || a.title === n.title)) continue;

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

    if (articles.some(a => a.url === url || a.title === title)) {
        return res.status(409).json({ error: 'Article already exists' });
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
