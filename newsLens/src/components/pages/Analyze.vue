<template>
  <div>
    <h1>Article Preview</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div style="margin-bottom: 2rem; border-bottom: 2px solid #aaa; padding-bottom: 1rem;">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
        <img v-if="image" :src="image" alt="Article image" style="max-width: 300px" />
        <p><a :href="url" target="_blank">Read Original</a></p>
        <p>__Sentiment: {{ sentiment }}</p>
        <p>AI Response: {{ aiResponse }}</p>

        <div v-if="sentiment === 'NEGATIVE' && recommendation">
          <h3>🌈 Here’s something more uplifting:</h3>
          <h4>{{ recommendation.title }}</h4>
          <p>{{ recommendation.description }}</p>
          <a :href="recommendation.url" target="_blank">Read it here</a>

          <blockquote style="margin-top: 1em; font-style: italic;">
            “No matter how dark the night, the sun will rise.” 🌅
          </blockquote>
        </div>
      </div>

      <h2>Previously Viewed Articles</h2>
      <div v-for="item in filteredFeed" :key="item.url" style="margin-bottom: 2rem; border-bottom: 1px solid #ccc; padding-bottom: 1rem;">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
        <img v-if="item.image" :src="item.image" alt="Article image" style="max-width: 300px" />
        <p><strong>__Sentiment:</strong> {{ item.sentiment }}</p>
        <p><strong>AI Response:</strong> {{ item.aiResponse }}</p>
        <p><small>{{ formatDate(item.timestamp) }}</small></p>
        <a :href="item.url" target="_blank">Read Original</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getSentiment, getCustomGPTResponse } from '../services/aiService';

const route = useRoute();
const loading = ref(true);

const title = ref('');
const description = ref('');
const image = ref('');
const url = ref('');
const sentiment = ref('');
const aiResponse = ref('');
const recommendation = ref<any>(null);
const filteredFeed = ref<any[]>([]);

onMounted(async () => {
  title.value = decodeURIComponent(route.query.title as string || '');
  description.value = decodeURIComponent(route.query.description as string || '');
  image.value = decodeURIComponent(route.query.image as string || '');
  url.value = decodeURIComponent(route.query.url as string || '');

  const text = `${title.value}. ${description.value}`;
  sentiment.value = await getSentiment(text);
  aiResponse.value = await getCustomGPTResponse(text, sentiment.value);

  const stored = localStorage.getItem('aiNewsFeed');
  let feed = stored ? JSON.parse(stored) : [];

  // Remove article if it already exists
  feed = feed.filter((item: any) => item.url !== url.value);

  // Pin the current article to the top
  feed.unshift({
    title: title.value,
    description: description.value,
    image: image.value,
    url: url.value,
    sentiment: sentiment.value,
    aiResponse: aiResponse.value,
    timestamp: Date.now()
  });

  localStorage.setItem('aiNewsFeed', JSON.stringify(feed));

  // Update local list for previously viewed
  filteredFeed.value = feed.slice(1); // exclude the pinned one

  // Get positive recommendation (not the same article)
  const positives = feed.filter((item: any) => item.sentiment === 'POSITIVE' && item.url !== url.value);
  recommendation.value = positives[0] || null;

  loading.value = false;
});

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}
</script>
