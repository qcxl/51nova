/**
 * 51NOVA API 客户端
 * - 加密请求 / 解密响应（与 APK 完全一致的加密体系）
 * - 直接连接 API 服务器（服务器已开启 CORS）
 * - 内置多服务器故障切换
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { aesDecrypt, aes256CfbDecrypt } from '@/utils/crypto'
import { makePayload } from '@/utils/crypto'
import { getDeviceId } from '@/utils/device'
import { useAppStore } from '@/stores/app'

// API 服务器列表（从 getconfig 的 domain_name 字段获得）
const API_SERVERS = [
  'https://api1.fkxbvttqa.cc/api.php',
  'https://api3.fkxbvttqa.cc/api.php',
  'https://bak.fxcvlyzc.cc/api.php',
]
let activeServerIndex = 0

const client: AxiosInstance = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
})

/** POST 加密请求 → 直接发送到 API 服务器 */
export async function post<T = any>(
  path: string,
  extra: Record<string, any> = {}
): Promise<T> {
  const store = useAppStore()
  const deviceId = getDeviceId()
  const token = store.token

  async function send(): Promise<T> {
    const payload = await makePayload(extra, deviceId, token)
    const url = `${API_SERVERS[activeServerIndex]}${path}`

    try {
      const resp = await client.post(url, payload)
      const result = resp.data

      // 尝试解密外层 data 字段
      if (result.data && typeof result.data === 'string') {
        try {
          const decrypted = await aesDecrypt(result.data)
          const inner = JSON.parse(decrypted)
          result._decrypted = inner

          // crypt=true 时，内层 data 是 AES-256-CFB 加密字符串，需要二次解密
          if (inner.crypt === true && typeof inner.data === 'string') {
            try {
              const secondPass = 'JCQ0JBYRQBcXEkITQkATERQRHRI2MxcqCTw2FwEJ'
              const decrypted2 = await aes256CfbDecrypt(inner.data, secondPass)
              result._decrypted = {
                ...inner,
                data: JSON.parse(decrypted2),
              }
            } catch (e2: unknown) {
              console.warn(`[crypt] 二次解密失败 (${path}):`, e2)
            }
          }
        } catch (e: unknown) {
          console.warn(`[API] 外层解密失败 (${path}):`, e)
          result._decryptError = e instanceof Error ? e.message : String(e)
        }
      }
      return result as T
    } catch (e) {
      const err = e as AxiosError
      if (err.response?.status === 503 || err.response?.status === 403 || err.response?.status === 0) {
        // 当前服务器不可用，切换到下一个
        const failedServer = activeServerIndex
        activeServerIndex = (activeServerIndex + 1) % API_SERVERS.length
        console.warn(`[API] 服务器 ${API_SERVERS[failedServer]} 不可用，切换到 ${API_SERVERS[activeServerIndex]}`)
        return await send()  // 递归重试
      }
      throw e
    }
  }

  return await send()
}

/**
 * 检查 API 响应，返回统一格式
 */
export function checkResponse<T = any>(resp: any): { data: T | null; error: string | null } {
  if (resp._decryptError) {
    return { data: null, error: `响应解密失败: ${resp._decryptError}` }
  }
  const inner = resp._decrypted
  if (!inner) {
    return { data: null, error: '响应无数据' }
  }
  if (inner.status !== 1) {
    return { data: null, error: inner.msg || `API 返回异常 (status=${inner.status})` }
  }
  if (inner.crypt === true && typeof inner.data === 'string') {
    return { data: null, error: '数据仍需二次解密 (crypt=true)，请联系开发者' }
  }
  return { data: inner.data as T, error: null }
}

/** 通用 API 封装（159 个端点） */
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
  listHyhMv: (tabId: number, sort = 'new', page = 1) =>
    post('/api/tabnew/list_hyh_mv', { tab_id: tabId, sort, page }),
  tabDetail: (id: number) => post('/api/tabnew/tab_detail', { id }),

  // ===== 短视频 (6) =====
  videoDetail: (id: number) => post('/api/mv/detail', { id }),
  videoFavorite: (id: number) => post('/api/mv/favorite', { id }),
  videoComment: (id: number, content: string, replyId?: number) =>
    post('/api/mv/add_comment', { mv_id: id, comment: content, ...(replyId ? { c_id: replyId } : {}) }),
  videoComments: (id: number, page = 1) =>
    post('/api/mv/list_comment', { mv_id: id, page }),
  videoBarrage: (id: number) => post('/api/mv/list_barrage', { mv_id: id }),
  videoRank: () => post('/api/mv/list_rank_mv'),

  // ===== 图片 (7) =====
  pictureHome: () => post('/api/picture/home'),
  pictureDetail: (id: number) => post('/api/picture/detail', { id }),
  pictureFavorite: (id: number) => post('/api/picture/favorite', { id }),
  pictureLike: (id: number) => post('/api/picture/like', { id }),
  pictureComment: (id: number, content: string) =>
    post('/api/picture/comment', { picture_id: id, content }),
  pictureComments: (id: number, page = 1) =>
    post('/api/picture/comment_list', { id, page }),
  pictureFollowSeries: (id: number) => post('/api/picture/follow_series', { id }),

  // ===== 小说 (10) =====
  novelHome: () => post('/api/novel/home'),
  novelDetail: (id: number) => post('/api/novel/detail', { id }),
  novelChapters: (id: number, page = 1) =>
    post('/api/novel/chaptersList', { id, page, limit: 10 }),
  novelChapter: (id: number, chapterId: number) =>
    post('/api/novel/chapterDetail', { novel_id: id, chapter_id: chapterId }),
  novelFavorite: (id: number) => post('/api/novel/favorite', { id }),
  novelLike: (id: number) => post('/api/novel/like', { id }),
  novelComment: (id: number, content: string) =>
    post('/api/novel/comment', { id, content }),
  novelRecommend: (id?: number) => post('/api/novel/recommend', id ? { novel_id: id } : {}),
  novelFindConf: () => post('/api/novel/find_conf'),
  novelFollowSeries: (id: number) => post('/api/novel/follow_series', { id }),

  // ===== 音频 (8) =====
  audioHome: () => post('/api/audio/home'),
  audioDetail: (id: number) => post('/api/audio/detail', { id }),
  audioChapter: (id: number, chapterId: number) =>
    post('/api/audio/chapterDetail', { audio_id: id, chapter_id: chapterId }),
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
    post('/api/seed/comment', { seed_id: id, content }),
  seedFavorite: (id: number) => post('/api/seed/favorite', { id }),

  // ===== 社区 (11) =====
  communityHome: (pType = 0) => post('/api/community/home', { p_type: pType }),
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

  // ===== 首页/推荐 (6) =====
  recommendHomeDy: () => post('/api/recommend/homedy'),
  recommendDiscover: (type = '', page = 1) => post('/api/recommend/discover', { type, page }),
  recommendFollow: (type = '', page = 1) => post('/api/recommend/recommend_follow', { type, page }),
  recommendIndexDy: (type = '', page = 1) => post('/api/recommend/indexdy', { type, page }),
  videoRecommend: (id: number) => post('/api/mv/recommend', { id }),

  // ===== 导航 (2) =====
  navigationIndex: () => post('/api/navigation/index'),
  navigationIndexAw: () => post('/api/navigation/index_aw'),

  // ===== Tab 扩展 (3) =====
  listConstruct: (nagId: number, sort = 'new', type = 'water', page = 1) =>
    post('/api/tabnew/list_construct', { nag_id: nagId, sort, type, page, p_type: '1' }),
  followMvList: (tag = 'new', page = 1) => post('/api/tabnew/follow_mv_list', { tag, page }),
  listDiscovery: (sort = 'new', type = 'water', page = 1) => post('/api/tabnew/list_discovery', { sort, type, page }),

  // ===== 广告 (1) =====
  adsList: (type = 'hot', page = 1) => post('/api/home/ads_list', { type, page }),

  // ===== SDK 事件 (1) =====
  sdkEvent: () => post('/api/sdk/event'),

  // ===== AI 导航 (1) =====
  aiNav: () => post('/api/ai/ai_nav'),

  // ===== 社区扩展 (3) =====
  listPost: (pType = '0', tag = 'new', catId = '', page = 1) =>
    post('/api/community/list_post', { p_type: pType, tag, cat_id: catId, page }),
  listPostFollow: (pType = '0', tag = 'new', page = 1) =>
    post('/api/community/list_post_follow', { p_type: pType, tag, page }),
  topics: (tag = 'recommend', pId = '', pType = '0', more = 'no') =>
    post('/api/community/topics', { tag, p_id: pId, p_type: pType, more }),

  // ===== 图片扩展 (3) =====
  pictureConstruct: (id: number, sort = 'hot', page = 1) =>
    post('/api/picture/construct', { id, sort, page }),
  listFollowPicture: (page = 1) => post('/api/picture/list_follow_picture', { page }),
  pictureList: (id: number, page = 1) => post('/api/picture/picture_list', { id, page }),

  // ===== 小说扩展 (2) =====
  novelConstruct: (id: number, page = 1) => post('/api/novel/construct', { id, page }),
  listFollowNovel: (page = 1) => post('/api/novel/list_follow_novel', { page }),

  // ===== 音频扩展 (2) =====
  audioConstruct: (id: number, page = 1) => post('/api/audio/construct', { id, page }),
  listFollowAudio: (page = 1) => post('/api/audio/list_follow_audio', { page }),

  // 通用 POST
  post: post,
}
