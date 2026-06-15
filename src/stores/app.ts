import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { User, AppConfig } from '@/types'

export const useAppStore = defineStore('app', () => {
  const bootstrapped = ref(false)
  const initialized = ref(false)
  const token = ref(localStorage.getItem('51nova_token') || '')
  const user = ref<User | null>(null)
  const config = ref<AppConfig | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isVip = computed(() => user.value?.is_vip ?? false)

  // 初始化 Promise 缓存，确保多个组件同时等待时只执行一次 init
  let _initPromise: Promise<boolean> | null = null

  async function initApp(): Promise<boolean> {
    // 已初始化完成则直接返回
    if (initialized.value) return true
    // 已有进行中的初始化则复用 Promise
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
      try {
        // Step 1: getconfig
        const configResp = await api.getConfig()
        config.value = configResp._decrypted?.data || configResp

        // Step 2: base_info（自动注册）
        const infoResp = await api.baseInfo()
        const raw = infoResp._decrypted?.data || infoResp
        if (raw.token) {
          token.value = raw.token
          localStorage.setItem('51nova_token', raw.token)
        }
        user.value = {
          ...raw,
          _cached_at: infoResp._decrypted?.req_time || Date.now(),
        }

        initialized.value = true
        return true
      } catch (e) {
        console.warn('App init failed:', e)
        return false
      }
    })()

    return _initPromise
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
    initialized,
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
