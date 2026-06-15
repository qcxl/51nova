<template>
  <div class="page-container">
    <div class="page-content">
      <div class="profile-header">
        <div class="profile-avatar">{{ (store.user?.nickname || 'U')[0] }}</div>
        <h2>{{ store.user?.nickname || '游客' }}</h2>
        <p class="profile-desc">{{ store.user?.person_signnatrue || '这个人很懒，什么都没留下' }}</p>
      </div>
      <div class="profile-stats">
        <div class="stat-item"><span class="stat-value">{{ formatNum(store.user?.fans_count) }}</span><span class="stat-label">粉丝</span></div>
        <div class="stat-item"><span class="stat-value">{{ formatNum(store.user?.followed_count) }}</span><span class="stat-label">关注</span></div>
        <div class="stat-item"><span class="stat-value">{{ formatNum(store.user?.fabulous_count) }}</span><span class="stat-label">获赞</span></div>
      </div>
      <div class="profile-menu">
        <router-link to="/tasks" class="menu-item">🎯 每日签到</router-link>
        <router-link to="/profile" class="menu-item">⭐ 我的收藏</router-link>
        <router-link to="/settings" class="menu-item">⚙️ 设置</router-link>
        <a v-if="store.isLoggedIn" class="menu-item" style="color:var(--danger)" @click="handleLogout">🚪 退出登录</a>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
const router = useRouter()
const store = useAppStore()
function formatNum(n: number) { if (!n) return '0'; if (n >= 10000) return (n/10000).toFixed(1)+'万'; return n.toLocaleString() }
function handleLogout() { store.logout(); router.push('/') }
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; width: 100%; }
.page-content { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; }
.profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg,var(--accent),var(--accent-sub)); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; margin: 0 auto 16px; box-shadow: 0 0 20px var(--accent-glow); }
.profile-desc { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.profile-stats { display: flex; justify-content: center; gap: 40px; margin: 24px 0; }
.stat-item { display: flex; flex-direction: column; }
.stat-value { font-size: 20px; font-weight: 700; font-family: var(--font-mono); }
.stat-label { font-size: 12px; color: var(--text-secondary); }
.profile-menu { margin-top: 24px; }
.menu-item { display: block; padding: 14px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 8px; text-decoration: none; color: var(--text-primary); font-size: 14px; text-align: left; cursor: pointer; transition: 0.2s; }
.menu-item:hover { border-color: var(--accent-dim); }
</style>
