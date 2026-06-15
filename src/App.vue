<template>
  <div class="app-shell">
    <AppHeader v-if="showHeader" />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const showHeader = computed(() => !route.meta.hideHeader)
</script>

<style>
:root {
  --bg-deep: #080c14;
  --bg-primary: #0d1321;
  --bg-secondary: #131b2e;
  --bg-card: #1a2440;
  --bg-card-hover: #1f2b4d;
  --bg-elevated: #243056;
  --bg-glass: rgba(26, 36, 64, 0.7);
  --accent: #00d4ff;
  --accent-dim: #0099cc;
  --accent-glow: rgba(0, 212, 255, 0.3);
  --accent-sub: #7c3aed;
  --text-primary: #e8edf5;
  --text-secondary: #8892b0;
  --text-muted: #4a5478;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --border: rgba(0, 212, 255, 0.12);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --font-sans: 'Inter', -apple-system, 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-sans);
  background: var(--bg-deep);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: inherit; }
input, textarea { font-family: inherit; }
.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
</style>
