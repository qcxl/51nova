<template>
  <div class="detail-page">
    <div class="detail-container">
      <div class="detail-main">
        <div class="player-barrage-wrap">
          <HlsPlayer
            v-if="playUrl"
            :src="playUrl"
            :poster="video?.cover_thumb_url"
            @timeupdate="onTimeUpdate"
            @ended="onEnded"
          />
          <CanvasBarrage
            v-if="barrageOn && videoRef"
            :videoEl="videoRef"
            :speed="2"
            :showInput="true"
            @send="sendBarrage"
          />
        </div>

        <h1 class="detail-title">{{ video?.title || '加载中...' }}</h1>
        <div class="detail-meta">
          <span>👁 {{ formatNum(video?.rating) }} 次观看</span>
          <span>👍 {{ formatNum(video?.like) }}</span>
          <span>💬 {{ video?.comment || 0 }} 条评论</span>
        </div>

        <div class="action-row">
          <button class="action-btn primary">👍 点赞</button>
          <button class="action-btn" @click="toggleFavorite">⭐ 收藏</button>
          <button class="action-btn">🔗 分享</button>
          <label class="toggle-wrap">
            <span class="text-sm">弹幕</span>
            <label class="toggle-switch"><input type="checkbox" v-model="barrageOn"><span class="toggle-slider"></span></label>
          </label>
        </div>

<div class="comment-section">
          <h3>评论 ({{ video?.comment || 0 }})</h3>
          <div class="comment-input-row">
            <div class="comment-avatar"></div>
            <input v-model="commentText" class="comment-input" placeholder="说点什么..." @keyup.enter="submitComment">
          </div>
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <div class="comment-cavatar">{{ c.nickname?.[0] || 'U' }}</div>
            <div class="comment-body">
              <div class="comment-user">{{ c.nickname || '用户' }}</div>
              <div class="comment-text">{{ c.content }}</div>
              <div class="comment-footer"><span>{{ c.created_at || '刚刚' }}</span><span>👍 {{ c.like_count || 0 }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
import { buildPlayUrl } from '@/utils/media'
import HlsPlayer from '@/components/HlsPlayer.vue'
import CanvasBarrage from '@/components/CanvasBarrage.vue'

const route = useRoute()
const video = ref<any>(null)
const comments = ref<any[]>([])
const barrageOn = ref(false)
const commentText = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)

const playUrl = computed(() => {
  if (!video.value?.play_url?.encrypt_url) return ''
  return buildPlayUrl(
    video.value.play_url.encrypt_url,
    video.value.play_url.verify_token
  )
})

function formatNum(n: number) { if (!n) return '0'; if (n >= 10000) return (n/10000).toFixed(1)+'万'; return n.toLocaleString() }
function formatDuration(s: number) { if (!s) return '00:00'; return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}` }
async function toggleFavorite() { if (video.value) await api.videoFavorite(video.value.id) }
async function submitComment() { if (!commentText.value.trim() || !video.value) return; await api.videoComment(video.value.id, commentText.value); commentText.value = '' }
function onTimeUpdate(time: number, dur: number) {}
function onEnded() {}
function sendBarrage(text: string) {
  // TODO: 调用 API 发送弹幕
  console.log('barrage:', text)
}

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const resp = await api.videoDetail(id)
    video.value = resp._decrypted?.data?.row || resp._decrypted?.data
    const commResp = await api.videoComments(id)
    comments.value = commResp._decrypted?.data?.list || []
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.detail-page { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
.detail-container { max-width: 960px; margin: 0 auto; padding: 24px 0; }
.player-container {
  background: #000; border-radius: var(--radius-md); overflow: hidden;
  position: relative; aspect-ratio: 16/9;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border);
}
.center-play {
  width: 64px; height: 64px; background: rgba(0,212,255,0.9);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 26px; cursor: pointer; box-shadow: 0 0 30px var(--accent-glow);
}
.player-controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); }
.progress-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-bottom: 8px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-sub)); border-radius: 2px; position: relative; }
.control-row { display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.7); font-size: 12px; }
.flex { display: flex; }
.gap-md { gap: 12px; }
.player-barrage-wrap { position: relative; border-radius: var(--radius-md); overflow: hidden; }
.player-barrage-wrap :deep(.barrage-canvas-wrapper) { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
.player-barrage-wrap :deep(.barrage-input-row) { pointer-events: auto; }
.detail-title { font-size: 20px; font-weight: 700; margin: 16px 0 8px; }
.detail-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; }
.action-row { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
.action-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 18px;
  border-radius: 18px; font-size: 13px; cursor: pointer;
  border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary);
}
.action-btn:hover { border-color: var(--accent); }
.action-btn.primary { background: var(--accent); color: var(--text-inverse); border-color: var(--accent); }
.toggle-wrap { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.toggle-switch { position: relative; width: 40px; height: 22px; cursor: pointer; }
.toggle-switch input { display: none; }
.toggle-slider { position: absolute; inset: 0; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 11px; transition: 0.3s; }
.toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 2px; top: 2px; background: var(--text-muted); border-radius: 50%; transition: 0.3s; }
.toggle-switch input:checked + .toggle-slider { background: rgba(0,212,255,0.2); border-color: var(--accent); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); background: var(--accent); box-shadow: 0 0 10px var(--accent-glow); }
.text-sm { font-size: 13px; color: var(--text-secondary); }
.barrage-container { height: 40px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border); overflow: hidden; position: relative; margin-bottom: 20px; }
.barrage-text { position: absolute; white-space: nowrap; font-size: 13px; animation: scroll 10s linear infinite; }
@keyframes scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-200%); } }
.comment-section h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.comment-input-row { display: flex; gap: 12px; margin-bottom: 16px; }
.comment-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-sub)); flex-shrink: 0; }
.comment-input { flex: 1; background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 8px 16px; color: var(--text-primary); font-size: 14px; outline: none; }
.comment-input:focus { border-color: var(--accent); }
.comment-item { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.comment-cavatar { width: 30px; height: 30px; border-radius: 50%; background: var(--bg-elevated); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.comment-body { flex: 1; }
.comment-user { font-size: 13px; font-weight: 600; }
.comment-text { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.comment-footer { display: flex; gap: 12px; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
</style>
