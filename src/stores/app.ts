import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { User, AppConfig } from '@/types'

export const useAppStore = defineStore('app', () => {
  const bootstrapped = ref(false)
  const token = ref(localStorage.getItem('51nova_token') || '')
  const user = ref<User | null>(null)
  const config = ref<AppConfig | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isVip = computed(() => user.value?.is_vip ?? false)

  async function initApp(): Promise<boolean> {
    try {
      const configResp = await api.getConfig()
      config.value = configResp._decrypted?.data || configResp
      const infoResp = await api.baseInfo()
      const raw = infoResp._decrypted?.data || infoResp
      // crypt=true 响应可能自带 token
      if (raw.token) {
        token.value = raw.token
        localStorage.setItem('51nova_token', raw.token)
      }
      user.value = {
        ...raw,
        _cached_at: infoResp._decrypted?.req_time || Date.now(),
      }
      return true
    } catch (e) {
      console.warn('App init failed:', e)
      return false
    }
  }

  async function login(username: string, password: string): Promise<boolean> {
    const resp = await api.login(username, password)
    const inner = resp._decrypted
    if (inner?.status === 1 && inner.data?.token) {
      token.value = inner.data.token
      localStorage.setItem('51nova_token', inner.data.token)
      user.value = inner.data
      return true
    }
    return false
  }

  async function register(
    username: string,
    password: string,
    sex = 1,
    nickname = ''
  ): Promise<boolean> {
    const resp = await api.register(username, password, sex, nickname)
    return resp._decrypted?.status === 1
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('51nova_token')
  }

  return {
    bootstrapped,
    token,
    user,
    config,
    isLoggedIn,
    isVip,
    initApp,
    login,
    register,
    logout,
  }
})
