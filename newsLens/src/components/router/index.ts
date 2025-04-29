import { createRouter, createWebHistory } from 'vue-router';
import Analyze from '../pages/Analyze.vue';
import Feed from '../pages/Feed.vue';

const routes = [
  { path: '/', name: 'Feed', component: Feed },
  { path: '/analyze', name: 'Analyze', component: Analyze }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;