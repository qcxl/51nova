<template>
  <div class="page-container"><TabNav />
    <div class="page-content">
      <div class="section-header"><h2 class="section-title"><span class="accent-line"></span>📖 小说</h2></div>
      <div class="novel-list">
        <div v-for="i in 10" :key="i" class="novel-card" @click="$router.push(`/novel/${i}`)">
          <div class="novel-thumb"></div>
          <div class="novel-info">
            <div class="novel-title">小说标题 #{{ i }}</div>
            <div class="novel-author">作者名</div>
            <div class="novel-meta"><span>📖 {{ i * 30 }} 章</span><span>👁 {{ (i * 100000).toLocaleString() }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">import TabNav from '@/components/TabNav.vue'</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; width: 100%; }
.page-content { padding: 0 20px; }
.section-header { margin-bottom: 16px; }
.section-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 20px; background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent-glow); }
.novel-list { display: flex; flex-direction: column; gap: 12px; padding-bottom: 40px; }
.novel-card { display: flex; gap: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; cursor: pointer; transition: 0.2s; }
.novel-card:hover { border-color: var(--accent-dim); }
.novel-thumb { width: 80px; height: 110px; border-radius: var(--radius-sm); background: linear-gradient(135deg,#1a2440,#0d1b3e); flex-shrink: 0; }
.novel-info { flex: 1; min-width: 0; }
.novel-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.novel-author { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.novel-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); }
</style>
