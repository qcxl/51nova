<template>
  <div class="page-container">
    <TabNav />
    <div class="page-content">
      <h2 class="section-title"><span class="accent-line"></span>🎵 音频</h2>
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <div v-else class="audio-list">
        <div v-for="a in audios" :key="a.id" class="audio-card" @click="$router.push(`/audio/${a.id}`)">
          <div class="audio-cover"></div>
          <div class="audio-info">
            <div class="audio-title">{{ a.title }}</div>
            <div class="audio-author">{{ a.author }}</div>
            <div class="audio-meta">🎵 {{ a.chapter_count || 0 }} 章节</div>
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
const audios = ref<any[]>([])
const loading = ref(true)
onMounted(async () => {
  try {
    const resp = await api.audioHome()
    const { data, error: e } = checkResponse(resp); if (e) { console.warn('AudioList:', e); return }; audios.value = data?.list || data || []
  } catch {}
  finally { loading.value = false }
})
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; }
.page-content { padding: 20px; }
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 20px; background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent-glow); }
.audio-list { display: flex; flex-direction: column; gap: 10px; }
.audio-card { display: flex; gap: 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; cursor: pointer; transition: 0.2s; }
.audio-card:hover { border-color: var(--accent-dim); }
.audio-cover { width: 60px; height: 60px; border-radius: var(--radius-sm); background: linear-gradient(135deg, #1a2440, #0d1b3e); flex-shrink: 0; }
.audio-info { flex: 1; min-width: 0; }
.audio-title { font-size: 15px; font-weight: 600; }
.audio-author { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.audio-meta { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.loading-state { text-align: center; padding: 40px; }
.spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
