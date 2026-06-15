<template>
  <div class="page-container">
    <TabNav />
    <div class="page-content">
      <div class="section-header">
        <h2 class="section-title"><span class="accent-line"></span>📖 小说</h2>
        <button v-if="!loading && !error" class="more-btn" @click="$router.push('/search')">🔍 发现更多</button>
      </div>

      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>加载中...</p></div>
      <div v-else-if="error" class="error-state">
        <p>⚠️ {{ error }}</p>
        <button class="btn-retry" @click="fetchNovels">重试</button>
      </div>

      <div v-else class="novel-list">
        <div v-for="novel in novels" :key="novel.id" class="novel-card" @click="$router.push(`/novel/${novel.id}`)">
          <div class="novel-thumb" :style="novel.thumbnail ? { backgroundImage: `url(${novel.thumbnail})`, backgroundSize: 'cover' } : {}"></div>
          <div class="novel-info">
            <div class="novel-title">{{ novel.title || '未知标题' }}</div>
            <div class="novel-author">{{ novel.author || '匿名作者' }}</div>
            <div class="novel-meta">
              <span>📖 {{ novel.chapter_count || 0 }} 章</span>
              <span>👁 {{ formatNum(novel.view_count || novel.rating || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, checkResponse } from '@/api/client'
import TabNav from '@/components/TabNav.vue'
import { useAppStore } from '@/stores/app'

const novels = ref<any[]>([])
const loading = ref(true)
const error = ref('')

function formatNum(n: number) {
  if (!n) return '0'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString()
}

async function fetchNovels() {
  loading.value = true; error.value = ''
  const store = useAppStore()
  if (!store.initialized) await store.initApp()
  try {
    const resp = await api.novelHome()
    const { data, error: err } = checkResponse(resp)
    if (err) { error.value = err; return }
    novels.value = (data as any)?.list || (data as any)?.data || (data as any) || []
  } catch (e: any) {
    error.value = e.response?.status === 503 ? 'API 服务器不可用' : (e.message || '加载失败')
  } finally { loading.value = false }
}

onMounted(fetchNovels)
</script>

<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; width: 100%; }
.page-content { padding: 0 20px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 20px; background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent-glow); }
.more-btn { padding: 6px 14px; border-radius: 14px; font-size: 12px; color: var(--accent); background: rgba(0,212,255,0.08); border: 1px solid var(--accent-dim); cursor: pointer; }
.novel-list { display: flex; flex-direction: column; gap: 12px; padding-bottom: 40px; }
.novel-card { display: flex; gap: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; cursor: pointer; transition: 0.2s; }
.novel-card:hover { border-color: var(--accent-dim); }
.novel-thumb { width: 80px; height: 110px; border-radius: var(--radius-sm); background: linear-gradient(135deg,#1a2440,#0d1b3e); flex-shrink: 0; }
.novel-info { flex: 1; min-width: 0; }
.novel-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.novel-author { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.novel-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); }
.loading-state, .error-state { text-align: center; padding: 60px 0; color: var(--text-secondary); }
.spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry { margin-top: 12px; padding: 8px 20px; border-radius: 18px; background: var(--accent); color: #fff; border: none; font-size: 13px; cursor: pointer; }
</style>
