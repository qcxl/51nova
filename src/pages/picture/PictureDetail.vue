<template>
  <div class="detail-page"><div class="detail-container">
    <button class="back-btn" @click="$router.back()">← 返回</button>
    <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
    <div v-else>
      <h2 class="img-title">{{ picture?.title }}</h2>
      <div class="gallery-view">
        <div v-for="img in images" :key="img.id" class="gallery-item">
          <div class="img-placeholder">{{ img.order }}</div>
        </div>
      </div>
    </div>
  </div></div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
const route = useRoute()
const picture = ref<any>(null)
const loading = ref(true)
const images = computed(() => picture.value?.img || [])
onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const resp = await api.pictureDetail(id)
    picture.value = resp._decrypted?.data || resp
  } catch {} finally { loading.value = false }
})
</script>
<style scoped>
.detail-page{max-width:1400px;margin:0 auto;padding:0 20px}
.detail-container{max-width:800px;margin:0 auto;padding:24px 0}
.back-btn{padding:6px 14px;border-radius:14px;border:1px solid var(--border);background:transparent;color:inherit;font-size:13px;cursor:pointer;margin-bottom:16px}
.img-title{font-size:20px;font-weight:700;margin-bottom:16px}
.gallery-view{display:flex;flex-direction:column;gap:12px}
.gallery-item{border-radius:var(--radius-md);overflow:hidden}
.img-placeholder{aspect-ratio:16/9;background:linear-gradient(135deg,#1a2440,#0d1b3e);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:24px;font-weight:700}
.loading-state{text-align:center;padding:60px}
.spinner{width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
