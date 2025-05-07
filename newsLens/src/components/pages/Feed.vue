<template>
  <div>
    <h1>📚 Your AI News Feed</h1>

    <!-- Search bar -->
    <form @submit.prevent="fetchNews">
      <input
          v-model="searchQuery"
          type="text"
          placeholder="Search news (e.g. sports,fitness)"
          style="padding: 8px; width: 250px; margin-right: 10px;"
      />
      <button type="submit" style="padding: 8px;">Fetch News</button>
    </form>

    <!-- Sentiment filter -->
    <label for="sentimentFilter" style="display: block; margin-top: 1rem;">
      <strong>Filter by Sentiment:</strong>
    </label>
    <select id="sentimentFilter" v-model="selectedSentiment" style="margin-bottom: 1rem;">
      <option value="">All</option>
      <option value="POSITIVE">Positive</option>
      <option value="NEGATIVE">Negative</option>
      <option value="NEUTRAL">Neutral</option>
    </select>

    <!-- News feed -->
    <div v-for="article in filteredFeed" :key="article.url" style="margin-bottom: 2rem;">
      <h2>{{ article.title }}</h2>
      <p>{{ article.description }}</p>
      <img :src="article.image" alt="thumbnail" style="max-width: 200px;" />
      <p><strong>Sentiment:</strong> {{ article.sentiment }}</p>
      <blockquote>{{ article.aiResponse }}</blockquote>
      <a :href="article.url" target="_blank">Read Original</a>
      <div style="margin-top: 0.5rem;">
        <button @click="deleteArticle(article.url)" style="color: white; background: red; border: none; padding: 6px 12px; cursor: pointer;">
          Delete
        </button>
      </div>
      <hr />
    </div>
  </div>
</template>



<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const feed = ref<any[]>([])
const selectedSentiment = ref('')
const searchQuery = ref('')

const filteredFeed = computed(() => {
  if (!selectedSentiment.value) return feed.value
  return feed.value.filter(article =>
      article.sentiment?.toUpperCase().trim() === selectedSentiment.value
  )
})

async function loadArticles() {
  try {
    const response = await fetch("http://localhost:3001/articles")
    const data = await response.json()
    feed.value = data
  } catch (err) {
    console.error("❌ Failed to fetch articles:", err)
  }
}

async function fetchNews() {
  try {
    const response = await fetch("http://localhost:3001/fetch-news", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ keyword: searchQuery.value || "technology" })
    })
    const result = await response.json()
    console.log("✅ News fetched:", result)
    await loadArticles()
  } catch (error) {
    console.error("❌ Failed to fetch news:", error)
  }
}

async function deleteArticle(url: string) {
  try {
    const response = await fetch("http://localhost:3001/articles", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed: ${text}`)
    }

    feed.value = feed.value.filter(a => a.url !== url)
    console.log("✅ Article deleted")
  } catch (error) {
    console.error("❌ Failed to delete article:", error)
  }
}

onMounted(loadArticles)
</script>


