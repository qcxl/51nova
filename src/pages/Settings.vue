<template>
  <div class="page-container"><div class="page-content">
    <h2 class="section-title"><span class="accent-line"></span>⚙️ 设置</h2>
    <div class="setting-item"><span>昵称</span><input v-model="nickname" class="set-input" /></div>
    <div class="setting-item"><span>签名</span><input v-model="signature" class="set-input" /></div>
    <button class="save-btn" @click="saveProfile">保存</button>
  </div></div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { api } from '@/api/client'
const store = useAppStore()
const nickname = ref('')
const signature = ref('')
onMounted(() => { nickname.value = store.user?.nickname || ''; signature.value = store.user?.person_signnatrue || '' })
async function saveProfile() {
  try {
    if (nickname.value) await api.setProfile({ nickname: nickname.value })
    if (signature.value) await api.setProfile({ person_signnatrue: signature.value })
    alert('保存成功')
  } catch { alert('保存失败') }
}
</script>
<style scoped>
.page-container{max-width:1400px;margin:0 auto}.page-content{max-width:480px;margin:0 auto;padding:40px 20px}
.section-title{font-size:20px;font-weight:700;margin-bottom:24px;display:flex;align-items:center;gap:8px}
.accent-line{width:3px;height:20px;background:var(--accent);border-radius:2px}
.setting-item{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.setting-item span{width:60px;font-size:14px;color:var(--text-secondary)}
.set-input{flex:1;padding:10px 14px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card);color:var(--text-primary);font-size:14px;outline:none}
.set-input:focus{border-color:var(--accent)}
.save-btn{padding:10px 24px;border-radius:18px;border:none;background:var(--accent);color:var(--text-inverse);font-size:14px;font-weight:600;cursor:pointer;width:100%}
</style>
