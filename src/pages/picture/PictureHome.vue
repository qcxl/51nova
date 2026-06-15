<template>
  <div class="page-container">
    <TabNav />
    <div class="page-content">
      <div class="section-header"><h2 class="section-title"><span class="accent-line"></span>📷 推荐写真</h2></div>
      <div class="picture-grid">
        <div v-for="item in pictures" :key="item.id" class="picture-card" @click="$router.push(`/picture/${item.id}`)">
          <div class="picture-thumb"></div>
          <div class="picture-info"><div class="picture-title">{{ item.title }}</div><div class="picture-count">{{ item.works_num || 0 }} 张</div></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import TabNav from '@/components/TabNav.vue'
const pictures = ref<any[]>([])
onMounted(async () => {
  try {
    const resp = await api.pictureHome()
    pictures.value = resp._decrypted?.data?.list || []
  } catch {}
})
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; width: 100%; }
.page-content { padding: 0 20px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 20px; background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent-glow); }
.picture-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding-bottom: 40px; }
@media (max-width: 1024px) { .picture-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 640px) { .picture-grid { grid-template-columns: repeat(2, 1fr); } }
.picture-card { background: var(--bg-card); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: 0.3s; border: 1px solid var(--border); }
.picture-card:hover { transform: translateY(-4px); border-color: var(--accent-dim); }
.picture-thumb { aspect-ratio: 3/4; background: linear-gradient(135deg, #1a2440, #0d1b3e); }
.picture-info { padding: 8px 12px 12px; }
.picture-title { font-size: 13px; font-weight: 600; }
.picture-count { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
</style>
