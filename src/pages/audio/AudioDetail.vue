<template>
  <div class="page-container">
    <div class="page-content">
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <div v-else>
        <div class="audio-player">
          <div class="audio-cover-lg"></div>
          <h2 class="audio-title-lg">{{ audio?.title }}</h2>
          <p class="audio-author-lg">{{ audio?.author }}</p>
          <audio v-if="currentSrc" :src="currentSrc" controls class="native-player"></audio>
        </div>
        <h3 class="chapter-title">章节列表</h3>
        <div v-for="ch in chapters" :key="ch.id"
          :class="['chapter-item', { active: currentChapter === ch.id }]"
          @click="playChapter(ch.id, ch.src)">
          <span>{{ ch.title }}</span>
          <span class="chapter-duration">{{ ch.duration || '--:--' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
const route = useRoute()
const audio = ref<any>(null)
const chapters = ref<any[]>([])
const currentChapter = ref(0)
const currentSrc = ref('')
const loading = ref(true)
onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const resp = await api.audioDetail(id)
    audio.value = resp._decrypted?.data?.row || resp._decrypted?.data
    chapters.value = resp._decrypted?.data?.list || []
  } catch {} finally { loading.value = false }
})
async function playChapter(id: number, src?: string) {
  currentChapter.value = id
  if (src) currentSrc.value = src
}
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; }
.page-content { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
.audio-player { text-align: center; margin-bottom: 32px; }
.audio-cover-lg { width: 200px; height: 200px; border-radius: var(--radius-lg); background: linear-gradient(135deg, #1a2440, #0d1b3e); margin: 0 auto 16px; }
.audio-title-lg { font-size: 20px; font-weight: 700; }
.audio-author-lg { color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; }
.native-player { width: 100%; }
.chapter-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.chapter-item { display: flex; justify-content: space-between; padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 6px; cursor: pointer; transition: 0.15s; }
.chapter-item:hover { border-color: var(--accent-dim); }
.chapter-item.active { border-color: var(--accent); color: var(--accent); }
.chapter-duration { color: var(--text-muted); font-size: 12px; font-family: var(--font-mono); }
.loading-state { text-align: center; padding: 40px; }
.spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
