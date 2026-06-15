<template>
  <div class="page-container">
    <div class="page-content">
      <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
      <div v-else-if="post">
        <button class="back-btn" @click="$router.back()">← 返回</button>
        <div class="post-content"><p>{{ post.content }}</p></div>
        <div class="post-stats">
          <button class="action-btn" @click="toggleLike">👍 {{ post.like_count || 0 }}</button>
          <button class="action-btn">💬 {{ post.comment_count || 0 }}</button>
        </div>
        <div class="comment-section">
          <h3>评论</h3>
          <div class="comment-input-row">
            <input v-model="commentText" class="comment-input" placeholder="说点什么..." @keyup.enter="submitComment" />
          </div>
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <div class="comment-body">
              <div class="comment-user">{{ c.nickname || '用户' }}</div>
              <div class="comment-text">{{ c.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
const route = useRoute()
const post = ref<any>(null)
const comments = ref<any[]>([])
const loading = ref(true)
const commentText = ref('')
onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const resp = await api.postDetail(id)
    post.value = resp._decrypted?.data || resp
  } catch {} finally { loading.value = false }
})
async function toggleLike() { if (post.value) await api.communityLike(post.value.id) }
async function submitComment() {
  if (!commentText.value.trim() || !post.value) return
  await api.communityComment(post.value.id, commentText.value)
  commentText.value = ''
}
</script>
<style scoped>
.page-container { max-width: 1400px; margin: 0 auto; }
.page-content { max-width: 640px; margin: 0 auto; padding: 20px; }
.back-btn { padding: 6px 14px; border-radius: 14px; border: 1px solid var(--border); background: transparent; color: inherit; font-size: 13px; cursor: pointer; margin-bottom: 16px; }
.post-content { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 16px; line-height: 1.7; }
.post-stats { display: flex; gap: 8px; margin-bottom: 20px; }
.action-btn { padding: 8px 16px; border-radius: 18px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 13px; cursor: pointer; }
.comment-section h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.comment-input-row { margin-bottom: 16px; }
.comment-input { width: 100%; padding: 10px 16px; border-radius: 18px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 14px; outline: none; }
.comment-item { padding: 10px 0; border-bottom: 1px solid var(--border); }
.comment-user { font-size: 13px; font-weight: 600; }
.comment-text { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.loading-state { text-align: center; padding: 60px; }
.spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
