<template>
  <nav class="tab-nav">
    <router-link v-for="tab in tabs" :key="tab.path"
      :to="tab.path"
      class="tab-btn"
      :class="{ active: $route.path.startsWith(tab.path) }">
      {{ tab.icon }} {{ tab.label }}
    </router-link>
  </nav>
</template>

<script setup lang="ts">
const tabs = [
  { path: '/mv', label: '视频', icon: '🔥' },
  { path: '/picture', label: '图片', icon: '📷' },
  { path: '/novel', label: '小说', icon: '📖' },
  { path: '/audio', label: '音频', icon: '🎵' },
  { path: '/community', label: '社区', icon: '💬' },
]
</script>

<style scoped>
.tab-nav {
  display: flex; gap: 4px;
  padding: 16px 0 12px;
  margin: 0 auto;
  max-width: 1400px;
  padding-left: 20px; padding-right: 20px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}
.tab-nav::-webkit-scrollbar { display: none; }
.tab-btn {
  padding: 8px 22px; border-radius: 18px;
  font-size: 14px; font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap; cursor: pointer;
  transition: all 0.2s; text-decoration: none;
}
.tab-btn:hover { color: var(--text-primary); background: var(--bg-card); }
.tab-btn.active {
  color: var(--text-inverse, #0d1321);
  background: var(--accent);
  font-weight: 600;
  box-shadow: 0 0 15px var(--accent-glow);
}
</style>
