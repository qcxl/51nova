<template>
  <div class="page-container">
    <div class="page-content">
      <h2 class="section-title"><span class="accent-line"></span>🎯 任务中心</h2>
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <div v-else>
        <button class="sign-btn" @click="doSign" :disabled="signed">
          {{ signed ? '✅ 已签到' : '🎯 每日签到' }}
        </button>
        <div v-if="tasks.length" class="task-list">
          <div v-for="t in tasks" :key="t.id" class="task-card">
            <div class="task-info">
              <div class="task-title">{{ t.title }}</div>
              <div class="task-progress" v-if="t.progress">{{ t.progress }}</div>
            </div>
            <button v-if="t.can_claim" class="claim-btn" @click="claimTask(t.id)">领取</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
const loading = ref(true)
const signed = ref(false)
const tasks = ref<any[]>([])
onMounted(async () => {
  try {
    const resp = await api.taskList()
    tasks.value = resp._decrypted?.data?.list || []
  } catch {} finally { loading.value = false }
})
async function doSign() {
  try { await api.signIn(); signed.value = true } catch {}
}
async function claimTask(id: number) {
  try { await api.taskGain(id); tasks.value = tasks.value.filter(t => t.id !== id) } catch {}
}
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; }
.page-content { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 20px; background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent-glow); }
.sign-btn { width: 100%; padding: 16px; border-radius: var(--radius-md); border: none; background: var(--accent); color: var(--text-inverse); font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 20px; }
.sign-btn:disabled { opacity: 0.5; background: var(--bg-card); color: var(--text-secondary); }
.task-list { display: flex; flex-direction: column; gap: 8px; }
.task-card { display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px 16px; }
.task-title { font-size: 14px; font-weight: 500; }
.task-progress { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.claim-btn { padding: 6px 14px; border-radius: 14px; border: 1px solid var(--accent); background: transparent; color: var(--accent); font-size: 12px; cursor: pointer; }
.loading-state { text-align: center; padding: 40px; }
.spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
