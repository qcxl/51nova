<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">注册</h1>
      <p class="login-sub">创建新账号</p>
      <form @submit.prevent="handleRegister">
        <div class="form-group"><input v-model="username" type="text" placeholder="用户名" class="form-input" required></div>
        <div class="form-group"><input v-model="password" type="password" placeholder="密码" class="form-input" required></div>
        <div class="form-group"><input v-model="nickname" type="text" placeholder="昵称（选填）" class="form-input"></div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '注册中...' : '注册' }}</button>
      </form>
      <p class="form-footer">已有账号？<router-link to="/login" class="link">登录</router-link></p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
const router = useRouter()
const store = useAppStore()
const username = ref('')
const password = ref('')
const nickname = ref('')
const error = ref('')
const loading = ref(false)
async function handleRegister() {
  error.value = ''; loading.value = true
  try {
    const ok = await store.register(username.value, password.value, 1, nickname.value)
    if (ok) { await store.login(username.value, password.value); router.push('/') }
    else error.value = '注册失败'
  } catch (e: any) { error.value = e.message || '注册失败' }
  finally { loading.value = false }
}
</script>
<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.login-card { width: 100%; max-width: 380px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 40px 32px; }
.login-title { font-size: 28px; font-weight: 800; text-align: center; margin-bottom: 4px; }
.login-sub { text-align: center; color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; }
.form-group { margin-bottom: 16px; }
.form-input { width: 100%; padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px; outline: none; }
.form-input:focus { border-color: var(--accent); }
.form-error { color: var(--danger); font-size: 13px; margin-bottom: 12px; }
.btn-primary { width: 100%; padding: 12px; border-radius: var(--radius-sm); background: var(--accent); color: var(--text-inverse); border: none; font-size: 15px; font-weight: 600; cursor: pointer; }
.form-footer { text-align: center; margin-top: 16px; font-size: 13px; color: var(--text-secondary); }
.link { color: var(--accent); text-decoration: none; }
</style>
