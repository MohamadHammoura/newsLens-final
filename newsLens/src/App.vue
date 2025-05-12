<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const drawer = ref(false);
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>NewsLens</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="router.push('/')">
        <v-icon>mdi-home</v-icon>
      </v-btn>
      <v-btn icon @click="router.push('/analyze')">
        <v-icon>mdi-chart-box</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item
          prepend-icon="mdi-home"
          title="Home"
          value="home"
          @click="router.push('/')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-chart-box"
          title="Analysis"
          value="analysis"
          @click="router.push('/analyze')"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
/* Global styles */
body {
  margin: 0;
  padding: 0;
}
</style>
