<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">51NOVA</h1>
      <p class="login-sub">登录以继续</p>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <input v-model="username" type="text" placeholder="用户名" class="form-input" required>
        </div>
        <div class="form-group">
          <input v-model="password" type="password" placeholder="密码" class="form-input" required>
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p class="form-footer">还没有账号？<router-link to="/register" class="link">注册</router-link></p>
      <p class="form-footer"><router-link to="/" class="link">先逛逛</router-link></p>
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
const error = ref('')
const loading = ref(false)
async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const ok = await store.login(username.value, password.value)
    if (ok) router.push('/')
    else error.value = '登录失败，请检查用户名和密码'
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally { loading.value = false }
}
</script>
<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.login-card { width: 100%; max-width: 380px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 40px 32px; }
.login-title { font-size: 28px; font-weight: 800; text-align: center; margin-bottom: 4px; background: linear-gradient(135deg,var(--accent),var(--accent-sub)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.login-sub { text-align: center; color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; }
.form-group { margin-bottom: 16px; }
.form-input { width: 100%; padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px; outline: none; transition: 0.2s; }
.form-input:focus { border-color: var(--accent); }
.form-error { color: var(--danger); font-size: 13px; margin-bottom: 12px; }
.btn-primary { width: 100%; padding: 12px; border-radius: var(--radius-sm); background: var(--accent); color: var(--text-inverse); border: none; font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-primary:hover { box-shadow: 0 0 20px var(--accent-glow); }
.btn-primary:disabled { opacity: 0.5; }
.form-footer { text-align: center; margin-top: 16px; font-size: 13px; color: var(--text-secondary); }
.link { color: var(--accent); text-decoration: none; }
</style>
