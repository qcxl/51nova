<template>
  <div class="page-container">
    <TabNav />
    <div class="page-content">
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <div v-else>
        <div class="novel-detail-header">
          <div class="novel-cover-lg"></div>
          <div class="novel-meta-info">
            <h1 class="novel-title-lg">{{ novel?.title }}</h1>
            <p class="novel-author">{{ novel?.author }}</p>
            <div class="novel-tags">
              <span v-for="tag in (novel?.tags || '').split(',')" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <p class="novel-desc">{{ novel?.description }}</p>
            <div class="novel-stats">
              <span>📖 {{ novel?.chapter_count || 0 }} 章</span>
              <span>📝 {{ (novel?.word_count || 0).toLocaleString() }} 字</span>
              <span>{{ novel?.is_end ? '✅ 已完结' : '📝 连载中' }}</span>
            </div>
            <button class="read-btn" @click="startReading">开始阅读</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api/client'
import TabNav from '@/components/TabNav.vue'
import type { Novel } from '@/types'
const route = useRoute()
const router = useRouter()
const novel = ref<Novel | null>(null)
const loading = ref(true)
function startReading() {
  if (novel.value) router.push(`/novel/${novel.value.id}/chapter/0`)
}
onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const resp = await api.novelDetail(id)
    novel.value = resp._decrypted?.data || resp
  } catch {} finally { loading.value = false }
})
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; }
.page-content { padding: 20px; max-width: 800px; margin: 0 auto; }
.novel-detail-header { display: flex; gap: 24px; margin-bottom: 32px; }
@media (max-width: 640px) { .novel-detail-header { flex-direction: column; } }
.novel-cover-lg { width: 180px; height: 250px; border-radius: var(--radius-md); background: linear-gradient(135deg,#1a2440,#0d1b3e); flex-shrink: 0; }
.novel-meta-info { flex: 1; }
.novel-title-lg { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.novel-author { color: var(--accent); font-size: 14px; margin-bottom: 8px; }
.novel-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.tag { padding: 2px 10px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border); font-size: 11px; color: var(--text-secondary); }
.novel-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 12px; }
.novel-stats { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
.read-btn { padding: 12px 32px; border-radius: 24px; border: none; background: var(--accent); color: var(--text-inverse); font-size: 15px; font-weight: 600; cursor: pointer; }
.loading-state { text-align: center; padding: 60px; }
.spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
