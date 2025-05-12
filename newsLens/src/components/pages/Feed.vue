<template>
  <div class="feed-container">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-6">📚 Your AI News Feed</h1>

          <!-- Search bar -->
          <v-card class="mb-6 pa-4">
            <v-form @submit.prevent="fetchNews">
              <v-row>
                <v-col cols="12" sm="8">
                  <v-text-field
                    v-model="searchQuery"
                    label="Search news (e.g. sports, fitness)"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    height="56"
                  >
                    Fetch News
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card>

          <!-- Sentiment filter -->
          <v-card class="mb-6 pa-4">
            <v-row>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="selectedSentiment"
                  :items="[
                    { title: 'All', value: '' },
                    { title: 'Positive', value: 'POSITIVE' },
                    { title: 'Negative', value: 'NEGATIVE' },
                    { title: 'Neutral', value: 'NEUTRAL' }
                  ]"
                  label="Filter by Sentiment"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>
            </v-row>
          </v-card>

          <!-- News feed -->
          <v-row>
            <v-col v-for="article in filteredFeed" :key="article.url" cols="12">
              <v-card 
                class="mb-6 article-card" 
                elevation="5"
                :class="{
                  'border-success': article.sentiment?.toUpperCase().trim() === 'POSITIVE',
                  'border-error': article.sentiment?.toUpperCase().trim() === 'NEGATIVE',
                  'border-info': article.sentiment?.toUpperCase().trim() === 'NEUTRAL'
                }"
              >
                <v-card-item class="pb-0">
                  <v-card-title class="text-h5 mb-2 font-weight-bold">{{ article.title }}</v-card-title>
                  <v-card-subtitle>
                    <v-chip
                      :color="getSentimentColor(article.sentiment)"
                      class="mb-2"
                      size="small"
                      variant="elevated"
                    >
                      {{ article.sentiment }}
                    </v-chip>
                  </v-card-subtitle>
                </v-card-item>

                <v-card-text class="pt-4">
                  <p class="mb-4 text-body-1">{{ article.description }}</p>
                  <v-img
                    :src="article.image"
                    :alt="article.title"
                    max-width="300"
                    class="mb-4 rounded-lg"
                    elevation="5"
                  ></v-img>
                  <v-card 
                    variant="outlined" 
                    class="mb-4 ai-response-card"
                    :color="getSentimentColor(article.sentiment)"
                  >
                    <v-card-text>
                      <blockquote class="text-body-1">{{ article.aiResponse }}</blockquote>
                    </v-card-text>
                  </v-card>
                </v-card-text>

                <v-card-actions class="pt-0">
                  <v-btn
                    :href="article.url"
                    target="_blank"
                    color="primary"
                    variant="elevated"
                    class="text-none"
                  >
                    Read Original
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    @click="deleteArticle(article.url)"
                    color="error"
                    variant="outlined"
                    class="text-none"
                  >
                    Delete
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
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

function getSentimentColor(sentiment: string) {
  switch (sentiment?.toUpperCase().trim()) {
    case 'POSITIVE':
      return 'success'
    case 'NEGATIVE':
      return 'error'
    case 'NEUTRAL':
      return 'info'
    default:
      return 'grey'
  }
}

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
    
    // Load existing articles
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

<style scoped>
.feed-container {
  padding: 24px 0;
}

.article-card {
  border-left: 4px solid transparent;
  transition: transform 0.2s ease-in-out;
}

.article-card:hover {
  transform: translateY(-2px);
}

.border-success {
  border-left-color: rgb(76, 175, 80) !important;
}

.border-error {
  border-left-color: rgb(244, 67, 54) !important;
}

.border-info {
  border-left-color: rgb(33, 150, 243) !important;
}

.ai-response-card {
  background-color: rgba(0, 0, 0, 0.02);
}

blockquote {
  margin: 0;
  font-style: italic;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.6;
}
</style>


