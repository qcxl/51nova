<template>
  <div class="page-container">
    <div class="page-content">
      <h2 class="section-title"><span class="accent-line"></span>🎬 短剧</h2>
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <div v-else class="seed-grid">
        <div v-for="s in seeds" :key="s.id" class="seed-card" @click="$router.push(`/seed/${s.id}`)">
          <div class="seed-thumb"></div>
          <div class="seed-info">
            <div class="seed-title">{{ s.title }}</div>
            <div class="seed-meta">{{ s.episode_count || 0 }} 集</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
const seeds = ref<any[]>([])
const loading = ref(true)
onMounted(async () => {
  try {
    const resp = await api.seedNav()
    seeds.value = resp._decrypted?.data?.list || resp._decrypted?.data || []
  } catch {}
  finally { loading.value = false }
})
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; width: 100%; }
.page-content { padding: 20px; }
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 20px; background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent-glow); }
.seed-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.seed-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: 0.2s; }
.seed-card:hover { border-color: var(--accent-dim); }
.seed-thumb { aspect-ratio: 16/9; background: linear-gradient(135deg, #1a2440, #0d1b3e); }
.seed-info { padding: 12px; }
.seed-title { font-size: 14px; font-weight: 600; }
.seed-meta { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.loading-state { text-align: center; padding: 60px 0; }
.spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
