<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-icon">N</span>
        <span class="logo-text">51NOVA</span>
      </router-link>

      <div class="search-bar">
        <span class="search-icon">⌕</span>
        <input v-model="searchQuery" type="text" placeholder="搜索视频、图片、小说..."
          @keyup.enter="doSearch" />
      </div>

      <div class="header-actions">
        <button class="icon-btn" @click="$router.push('/tasks')" title="签到">🎯</button>
        <button v-if="!store.isLoggedIn" class="btn btn-ghost" @click="$router.push('/login')">登录</button>
        <button v-else class="avatar" @click="$router.push('/profile')">
          {{ store.user?.nickname?.[0] || 'U' }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const store = useAppStore()
const searchQuery = ref('')

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'Search', query: { q: searchQuery.value.trim() } })
  }
}
</script>

<style scoped>
.app-header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(13, 19, 33, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  display: flex; align-items: center;
  justify-content: space-between;
  height: 60px; max-width: 1400px;
  margin: 0 auto; padding: 0 20px;
  gap: 20px;
}
.logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.logo-icon {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, var(--accent), var(--accent-sub));
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800;
  box-shadow: 0 0 15px var(--accent-glow);
}
.logo-text { font-size: 20px; font-weight: 800; }
.search-bar {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 8px 16px;
  flex: 1; max-width: 360px;
  transition: border-color 0.2s;
}
.search-bar:focus-within { border-color: var(--accent); }
.search-bar input {
  background: none; border: none; color: var(--text-primary);
  font-size: 14px; width: 100%; outline: none;
}
.search-icon { color: var(--text-muted); }
.header-actions { display: flex; align-items: center; gap: 10px; }
.icon-btn {
  width: 34px; height: 34px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 16px; cursor: pointer; transition: 0.15s;
}
.icon-btn:hover { border-color: var(--accent); }
.btn-ghost {
  padding: 8px 18px; border-radius: 18px;
  font-size: 13px; font-weight: 500;
  background: transparent; border: 1px solid var(--border);
  color: var(--text-primary); cursor: pointer; transition: 0.15s;
}
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-sub));
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; cursor: pointer;
  box-shadow: 0 0 12px var(--accent-glow);
}
</style>
