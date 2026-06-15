<template>
  <div class="page-container"><div class="page-content">
    <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
    <div v-else>
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2>{{ seed?.title }}</h2>
      <p class="text-muted">短剧详情 — 功能开发中</p>
    </div>
  </div></div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
const route = useRoute()
const seed = ref<any>(null)
const loading = ref(true)
onMounted(async () => {
  try { const resp = await api.seedDetail(Number(route.params.id)); seed.value = resp._decrypted?.data || resp } catch {}
  finally { loading.value = false }
})
</script>
<style scoped>
.page-container{max-width:1400px;margin:0 auto}.page-content{max-width:640px;margin:0 auto;padding:20px}
.back-btn{padding:6px 14px;border-radius:14px;border:1px solid var(--border);background:transparent;color:inherit;font-size:13px;cursor:pointer;margin-bottom:16px}
.text-muted{color:var(--text-secondary);margin-top:8px}
.loading-state{text-align:center;padding:60px}.spinner{width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
