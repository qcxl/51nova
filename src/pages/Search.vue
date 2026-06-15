<template>
  <div class="page-container">
    <div class="page-content">
      <div class="search-box">
        <input v-model="query" class="search-input" placeholder="搜索视频、图片、小说..."
          @keyup.enter="doSearch" autofocus />
        <button class="search-btn" @click="doSearch">搜索</button>
      </div>
      <div v-if="!query && !results.length" class="hot-section">
        <h3 class="section-title"><span class="accent-line"></span>🔥 热搜词</h3>
        <div v-if="hotLoading" class="loading-state"><div class="spinner"></div></div>
        <div v-else class="hot-list">
          <span v-for="(h, i) in hotWords" :key="i" class="hot-word" @click="query = h; doSearch()">
            <span class="hot-rank">{{ i + 1 }}</span>{{ h }}
          </span>
        </div>
      </div>
      <div v-if="results.length" class="results-section">
        <h3 class="section-title">搜索结果 ({{ results.length }})</h3>
        <div class="result-item" v-for="r in results" :key="r.id" @click="goToResult(r)">
          <div class="result-info">
            <div class="result-title">{{ r.title }}</div>
            <div class="result-desc">{{ r.description || r.content || '' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'

const router = useRouter()
const query = ref('')
const hotWords = ref<string[]>([])
const hotLoading = ref(true)
const results = ref<any[]>([])

onMounted(async () => {
  try {
    const resp = await api.hotSearch()
    hotWords.value = resp._decrypted?.data?.list || resp._decrypted?.data || []
  } catch { hotWords.value = ['热门推荐', '精选', '最新', '排行榜'] }
  finally { hotLoading.value = false }
})

async function doSearch() {
  if (!query.value.trim()) return
  try {
    const resp = await api.post('/api/search/hotSearch') as any
    results.value = (resp._decrypted?.data?.list || []).filter((r: any) =>
      r.title?.includes(query.value) || r.content?.includes(query.value)
    )
  } catch { results.value = [] }
}

function goToResult(r: any) {
  if (r.id) router.push(`/mv/${r.id}`)
}
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; }
.page-content { max-width: 640px; margin: 0 auto; padding: 40px 20px; }
.search-box { display: flex; gap: 8px; margin-bottom: 24px; }
.search-input { flex: 1; padding: 12px 18px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; color: var(--text-primary); font-size: 16px; outline: none; }
.search-input:focus { border-color: var(--accent); }
.search-btn { padding: 12px 24px; border-radius: 24px; border: none; background: var(--accent); color: var(--text-inverse); font-size: 14px; font-weight: 600; cursor: pointer; }
.section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 18px; background: var(--accent); border-radius: 2px; }
.hot-list { display: flex; flex-wrap: wrap; gap: 10px; }
.hot-word { padding: 6px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; font-size: 13px; cursor: pointer; transition: 0.15s; display: flex; align-items: center; gap: 6px; }
.hot-word:hover { border-color: var(--accent); }
.hot-rank { color: var(--accent); font-weight: 700; font-family: var(--font-mono); }
.result-item { padding: 14px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.result-item:hover { opacity: 0.8; }
.result-title { font-size: 15px; font-weight: 600; }
.result-desc { font-size: 13px; color: var(--text-secondary); margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.loading-state { text-align: center; padding: 20px; }
.spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
