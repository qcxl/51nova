/**
 * API 客户端
 * - 自动加密请求 / 解密响应
 * - 支持 Worker 代理（开发环境直连 / 生产环境走 Worker）
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { aesDecrypt } from '@/utils/crypto'
import { makePayload } from '@/utils/crypto'
import { getDeviceId } from '@/utils/device'
import { useAppStore } from '@/stores/app'

// 生产环境走 Cloudflare Worker 代理
const BASE_URL = import.meta.env.PROD
  ? '/api-proxy'
  : 'https://api3.fkxbvttqa.cc/api.php'

const client: AxiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'okhttp-okgo/jeasonlzy',
  },
})

/** GET 握手（首次调用必须） */
export async function bootstrap(): Promise<boolean> {
  const store = useAppStore()
  if (store.bootstrapped) return true
  try {
    // 生产环境 Worker 代理会自动处理 GET 握手
    if (import.meta.env.PROD) return true
    await axios.get(BASE_URL, { timeout: 10000 })
    store.bootstrapped = true
    return true
  } catch (e) {
    console.warn('Bootstrap GET failed, continuing anyway:', e)
    store.bootstrapped = true
    return true
  }
}

/** POST 加密请求 */
export async function post<T = any>(
  path: string,
  extra: Record<string, any> = {}
): Promise<T> {
  const store = useAppStore()
  const deviceId = getDeviceId()
  const token = store.token

  // 首次请求前先握手
  if (!store.bootstrapped) await bootstrap()

  // 构建 URL 和 payload
  const url = import.meta.env.PROD
    ? `${BASE_URL}?target=${encodeURIComponent(BASE_URL + path)}`
    : BASE_URL + path

  // 发送并解密
  async function send(): Promise<T> {
    const payload = await makePayload(extra, deviceId, token)
    const resp = await client.post(url, payload)
    const result = resp.data

    if (result.data && typeof result.data === 'string') {
      const decrypted = await aesDecrypt(result.data)
      result._decrypted = JSON.parse(decrypted)
    }
    return result as T
  }

  try {
    return await send()
  } catch (e) {
    const err = e as AxiosError
    if (err.response?.status === 503) {
      store.bootstrapped = false
      await bootstrap()
      return await send() // 重试一次
    }
    throw e
  }
}

/** 通用 API 封装（66+ 端点） */
export const api = {
  // ===== 配置 (2) =====
  getConfig: () => post('/api/home/getconfig'),
  systemDownload: (id: number) => post('/api/system/download', { id, type: 'mv' }),

  // ===== 用户 (8) =====
  baseInfo: () => post('/api/users/base_info'),
  login: (username: string, password: string) =>
    post('/api/users/login', { username, password }),
  register: (username: string, password: string, sex = 1, nickname = '') =>
    post('/api/users/register', { username, password, confirm_password: password, sex, nickname }),
  setProfile: (data: Record<string, any>) => post('/api/users/set_all', data),
  toggleFollow: (aff: number) => post('/api/users/toggle_follow', { aff }),
  subscribe: (aff: number) => post('/api/users/subscribe', { aff }),
  unbind: () => post('/api/users/unbind'),

  // ===== Tab 导航 (3) =====
  followTab: () => post('/api/tabnew/follow_tab'),
  listHyhMv: (nagId: number, sort = 'new', page = 1) =>
    post('/api/tabnew/list_hyh_mv', { nag_id: nagId, sort, page }),
  tabDetail: (id: number) => post('/api/tabnew/tab_detail', { id }),

  // ===== 短视频 (6) =====
  videoDetail: (id: number) => post('/api/mv/detail', { id }),
  videoFavorite: (id: number) => post('/api/mv/favorite', { id }),
  videoComment: (id: number, content: string, replyId?: number) =>
    post('/api/mv/add_comment', { id, content, reply_id: replyId }),
  videoComments: (id: number, page = 1) =>
    post('/api/mv/list_comment', { id, page }),
  videoBarrage: (id: number) => post('/api/mv/list_barrage', { id }),
  videoRank: () => post('/api/mv/list_rank_mv'),

  // ===== 图片 (7) =====
  pictureHome: () => post('/api/picture/home'),
  pictureDetail: (id: number) => post('/api/picture/detail', { id }),
  pictureFavorite: (id: number) => post('/api/picture/favorite', { id }),
  pictureLike: (id: number) => post('/api/picture/like', { id }),
  pictureComment: (id: number, content: string) =>
    post('/api/picture/comment', { id, content }),
  pictureComments: (id: number, page = 1) =>
    post('/api/picture/comment_list', { id, page }),
  pictureFollowSeries: (id: number) => post('/api/picture/follow_series', { id }),

  // ===== 小说 (10) =====
  novelHome: () => post('/api/novel/home'),
  novelDetail: (id: number) => post('/api/novel/detail', { id }),
  novelChapters: (id: number, page = 1) =>
    post('/api/novel/chaptersList', { id, page }),
  novelChapter: (id: number, chapterId: number) =>
    post('/api/novel/chapterDetail', { id, chapter_id: chapterId }),
  novelFavorite: (id: number) => post('/api/novel/favorite', { id }),
  novelLike: (id: number) => post('/api/novel/like', { id }),
  novelComment: (id: number, content: string) =>
    post('/api/novel/comment', { id, content }),
  novelRecommend: () => post('/api/novel/recommend'),
  novelFindConf: () => post('/api/novel/find_conf'),
  novelFollowSeries: (id: number) => post('/api/novel/follow_series', { id }),

  // ===== 音频 (8) =====
  audioHome: () => post('/api/audio/home'),
  audioDetail: (id: number) => post('/api/audio/detail', { id }),
  audioChapter: (id: number, chapterId: number) =>
    post('/api/audio/chapterDetail', { id, chapter_id: chapterId }),
  audioFavorite: (id: number) => post('/api/audio/favorite', { id }),
  audioLike: (id: number) => post('/api/audio/like', { id }),
  audioDownload: (id: number, chapterId: number) =>
    post('/api/audio/download', { id, chapter_id: chapterId }),
  audioFindConf: () => post('/api/audio/find_conf'),
  audioFollowSeries: (id: number) => post('/api/audio/follow_series', { id }),

  // ===== 短剧 (4) =====
  seedNav: () => post('/api/seed/nav'),
  seedDetail: (id: number) => post('/api/seed/detail', { id }),
  seedComment: (id: number, content: string) =>
    post('/api/seed/comment', { id, content }),
  seedFavorite: (id: number) => post('/api/seed/favorite', { id }),

  // ===== 社区 (11) =====
  communityHome: () => post('/api/community/home'),
  communityPost: (content: string, images?: string) =>
    post('/api/community/post', { content, images }),
  postDetail: (id: number) => post('/api/community/post_detail', { id }),
  communityComment: (id: number, content: string) =>
    post('/api/community/comment', { id, content }),
  communityLike: (id: number) => post('/api/community/like', { id }),
  communityFavorite: (id: number) => post('/api/community/favorite', { id }),
  createTopic: (name: string) => post('/api/community/create_topic', { name }),
  topicDetail: (id: number) => post('/api/community/topic_detail', { id }),
  followTopic: (id: number) => post('/api/community/follow_topic', { id }),
  peerCenter: (uid: number) => post('/api/community/peer_center', { uid }),
  prePostData: () => post('/api/community/pre_post_data'),

  // ===== 搜索 (1) =====
  hotSearch: () => post('/api/search/hotSearch'),

  // ===== 任务 (4) =====
  signIn: () => post('/api/task/sign'),
  taskList: () => post('/api/task/log_list'),
  taskGain: (id: number) => post('/api/task/gain', { id }),
  taskChange: (id: number) => post('/api/task/change', { id }),

  // 通用 POST
  post: post,
}
