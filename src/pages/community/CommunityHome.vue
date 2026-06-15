<template>
  <div class="page-container">
    <TabNav />
    <div class="page-content">
      <div class="section-header">
        <h2 class="section-title"><span class="accent-line"></span>💬 社区</h2>
        <button class="post-btn" @click="showPostForm = !showPostForm">✏️ 发布</button>
      </div>

      <!-- 发帖 -->
      <div v-if="showPostForm" class="post-form">
        <textarea v-model="postContent" class="post-textarea" placeholder="分享你的想法..." maxlength="500"></textarea>
        <div class="post-form-actions">
          <span class="char-count">{{ postContent.length }}/500</span>
          <button class="submit-btn" @click="submitPost" :disabled="!postContent.trim()">发布</button>
        </div>
      </div>

      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>加载中...</p></div>
      <div v-else-if="error" class="error-state"><p>⚠️ {{ error }}</p><button class="btn-retry" @click="fetchPosts">重试</button></div>

      <div v-else class="post-list">
        <div v-for="post in posts" :key="post.id" class="post-card" @click="$router.push(`/community/post/${post.id}`)">
          <div class="post-header">
            <span class="post-author">{{ post.nickname || '用户' }}</span>
            <span class="post-time">{{ post.created_at || '刚刚' }}</span>
          </div>
          <p class="post-text">{{ post.content }}</p>
          <div class="post-stats">
            <span>👍 {{ post.like_count || 0 }}</span>
            <span>💬 {{ post.comment_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, checkResponse } from '@/api/client'
import TabNav from '@/components/TabNav.vue'
import { useAppStore } from '@/stores/app'

const posts = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showPostForm = ref(false)
const postContent = ref('')

async function fetchPosts() {
  loading.value = true; error.value = ''
  // 等待 App 初始化完成（设备自动注册）
  const store = useAppStore()
  if (!store.initialized) await store.initApp()
  try {
    const resp = await api.communityHome()
    const { data, error: err } = checkResponse(resp)
    if (err) { error.value = err; return }
    posts.value = (data as any)?.list || (data as any) || []
  } catch (e: any) {
    error.value = e.response?.status === 503 ? 'API 服务器不可用' : (e.message || '加载失败')
  }
  finally { loading.value = false }
}

async function submitPost() {
  if (!postContent.value.trim()) return
  try {
    await api.communityPost(postContent.value)
    postContent.value = ''
    showPostForm.value = false
    await fetchPosts()
  } catch (e: any) { alert('发布失败: ' + e.message) }
}

onMounted(fetchPosts)
</script>

<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; width: 100%; }
.page-content { padding: 0 20px 40px; max-width: 720px; margin: 0 auto; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.accent-line { width: 3px; height: 20px; background: var(--accent); border-radius: 2px; box-shadow: 0 0 10px var(--accent-glow); }
.post-btn { padding: 8px 18px; border-radius: 18px; border: 1px solid var(--accent); background: transparent; color: var(--accent); font-size: 13px; cursor: pointer; }
.post-form { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px; }
.post-textarea { width: 100%; min-height: 100px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; color: var(--text-primary); font-size: 14px; resize: vertical; outline: none; }
.post-textarea:focus { border-color: var(--accent); }
.post-form-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.char-count { font-size: 12px; color: var(--text-muted); }
.submit-btn { padding: 8px 20px; border-radius: 18px; border: none; background: var(--accent); color: var(--text-inverse); font-size: 13px; font-weight: 600; cursor: pointer; }
.submit-btn:disabled { opacity: 0.5; }
.post-list { display: flex; flex-direction: column; gap: 12px; }
.post-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; cursor: pointer; transition: 0.2s; }
.post-card:hover { border-color: var(--accent-dim); }
.post-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.post-author { font-size: 13px; font-weight: 600; }
.post-time { font-size: 11px; color: var(--text-muted); }
.post-text { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.post-stats { display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); }
.loading-state, .error-state { text-align: center; padding: 60px 0; color: var(--text-secondary); }
.spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.btn-retry { margin-top: 12px; padding: 8px 20px; border-radius: 18px; background: var(--accent); color: #fff; border: none; font-size: 13px; cursor: pointer; }
</style>
