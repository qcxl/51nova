<template>
  <div class="page-container">
    <TabNav />
    <div class="page-content">
      <div class="section-header">
        <h2 class="section-title"><span class="accent-line"></span>🔥 热门推荐</h2>
        <div class="sort-tabs">
          <button v-for="s in sorts" :key="s.key"
            :class="['sort-btn', { active: currentSort === s.key }]"
            @click="changeSort(s.key)">{{ s.label }}</button>
        </div>
      </div>

      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>加载中...</p></div>
      <div v-else-if="error" class="error-state">
        <p>⚠️ {{ error }}</p>
        <button class="btn-retry" @click="fetchVideos">重试</button>
      </div>
      <div v-else class="video-grid">
        <div v-for="video in videos" :key="video.id"
          class="video-card" @click="$router.push(`/mv/${video.id}`)">
          <div class="video-thumb">
            <img v-if="video.cover_thumb_url" :src="video.cover_thumb_url" alt="" />
            <div v-else class="placeholder">🎬</div>
            <span v-if="video.is_free === 0" class="badge hot">HOT</span>
            <span class="duration">{{ formatDuration(video.duration) }}</span>
          </div>
          <div class="video-info">
            <h3 class="video-title">{{ video.title }}</h3>
            <div class="video-meta">
              <span>👁 {{ formatNum(video.rating) }}</span>
              <span>👍 {{ formatNum(video.like) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import TabNav from '@/components/TabNav.vue'
import type { Video } from '@/types'

const sorts = [
  { key: 'hot', label: '🔥 热门推荐' },
  { key: 'new', label: '✨ 最新发布' },
  { key: 'rank', label: '📈 排行榜' },
]
const currentSort = ref('hot')
const videos = ref<Video[]>([])
const loading = ref(true)
const error = ref('')

function formatNum(n: number) { if (!n) return '0'; if (n >= 10000) return (n/10000).toFixed(1)+'万'; return n.toLocaleString() }
function formatDuration(s: number) { if (!s) return '00:00'; return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}` }

async function changeSort(key: string) {
  currentSort.value = key
  await fetchVideos()
}

async function fetchVideos() {
  loading.value = true; error.value = ''
  try {
    // 尝试从视频列表接口获取，回退到热门发现
    const resp = await api.post('/api/tabnew/list_hyh_mv', {
      nag_id: 3,
      sort: currentSort.value,
      page: 1,
    })
    videos.value = resp._decrypted?.data?.list || resp._decrypted?.data || []
    if (videos.value.length === 0) {
      // 回退：从推荐接口获取
      const disc = await api.post('/api/recommend/discover', { page: 1 })
      videos.value = disc._decrypted?.data?.list || []
    }
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally { loading.value = false }
}

onMounted(fetchVideos)
</script>

<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; width: 100%; }
.page-content { padding: 0 20px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.section-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 20px; background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent-glow); }
.sort-tabs { display: flex; gap: 6px; }
.sort-btn { padding: 6px 14px; border-radius: 14px; font-size: 12px; font-weight: 500; color: var(--text-secondary); background: var(--bg-card); border: 1px solid transparent; cursor: pointer; transition: 0.15s; }
.sort-btn:hover { border-color: var(--border); }
.sort-btn.active { color: var(--accent); border-color: var(--accent); background: rgba(0,212,255,0.08); }
.video-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding-bottom: 40px; }
@media (max-width: 1024px) { .video-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .video-grid { grid-template-columns: 1fr; } }
.video-card { background: var(--bg-card); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: 0.3s; border: 1px solid var(--border); }
.video-card:hover { transform: translateY(-4px); border-color: var(--accent-dim); box-shadow: 0 4px 30px rgba(0,0,0,0.3); }
.video-thumb { position: relative; aspect-ratio: 16/9; overflow: hidden; background: var(--bg-secondary); }
.video-thumb img { width: 100%; height: 100%; object-fit: cover; }
.placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 32px; background: linear-gradient(135deg, #1a2440, #0d1b3e); }
.badge { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: var(--accent); color: #fff; }
.badge.hot { background: var(--danger); }
.duration { position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.8); color: #fff; font-size: 11px; font-family: var(--font-mono); padding: 2px 6px; border-radius: 4px; }
.video-info { padding: 12px; }
.video-title { font-size: 14px; font-weight: 600; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; margin-bottom: 6px; }
.video-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-secondary); }
.loading-state, .error-state { text-align: center; padding: 60px 0; color: var(--text-secondary); }
.spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry { margin-top: 12px; padding: 8px 20px; border-radius: 18px; background: var(--accent); color: #fff; border: none; font-size: 13px; cursor: pointer; }
</style>
