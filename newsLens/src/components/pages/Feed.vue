<template>
    <div>
      <h1>📚 Your AI News Feed</h1>
      <div v-for="article in feed" :key="article.url" style="margin-bottom: 2rem;">
        <h2>{{ article.title }}</h2>
        <p>{{ article.description }}</p>
        <img :src="article.image" alt="thumbnail" style="max-width: 200px;" />
        <p><strong>Sentiment:</strong> {{ article.sentiment }}</p>
        <blockquote>{{ article.aiResponse }}</blockquote>
        <a :href="article.url" target="_blank">Read Original</a>
        <hr />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  
  const feed = ref<any[]>([]);
  
  onMounted(() => {
    const stored = localStorage.getItem('aiNewsFeed');
    if (stored) {
      feed.value = JSON.parse(stored);
    }
  });
  </script>