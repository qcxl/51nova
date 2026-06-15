/** API 通用响应封装 */
export interface ApiResponse<T = any> {
  errcode: number
  data: string          // AES 加密数据
  timestamp: number
  sign: string
  _decrypted?: ApiInner<T>
  _decryptError?: string // 解密失败时的错误信息（框架内用）
}

/** API 内层响应 */
export interface ApiInner<T = any> {
  status: number
  data: T
  msg?: string
  crypt?: boolean
  needLogin?: boolean
  isLogin?: boolean
  req_time?: number
}

/** 用户信息 */
export interface User {
  uid: number
  username: string
  nickname: string
  is_reg: 0 | 1
  role_id: number
  regdate: number
  expired_at: number
  coins: string
  coins_total: string
  g_coins: string
  tui_coins: string
  vip_level: number
  is_vip: boolean
  auth_status: number
  fans_count: number
  followed_count: number
  fabulous_count: number
  avatar_url: string
  person_signnatrue: string
  token?: string
  aff_code: string
  invite_by_code: string
  girl_free_num: number
  ai_free_num: number
  new_user?: boolean
  /** 最近一次用户信息刷新的 req_time 时间戳，用于缓存计算 */
  _cached_at?: number
}

/** 视频信息 */
export interface Video {
  id: number
  fan_id: string
  uid: number
  title: string
  duration: number
  is_free: 0 | 1
  is_aw: 0 | 1
  like: number
  comment: number
  favorite_num: number
  rating: number
  view_count?: number
  cover_thumb_url: string
  play_url: {
    encrypt_url: string
    verify_token: string
  }
  pay_url_full?: {
    encrypt_url: string
    verify_token: string
  }
  tags_list: string[]
}

/** 图片集 */
export interface Picture {
  id: number
  title: string
  desc: string
  thumb: string
  category_id: number
  tags: string
  view_count: number
  coins: number
  works_num: number
  img: ImageItem[]
}

export interface ImageItem {
  id: number
  picture_id: number
  img_url: string
  order: number
  is_pay: 0 | 1
}

/** 小说 */
export interface Novel {
  id: number
  title: string
  description: string
  author: string
  tags: string
  thumbnail: string
  chapter_count: number
  word_count: number
  is_end: 0 | 1
}

export interface Chapter {
  id: number
  novel_id: number
  title: string
  order: number
  content?: string
  is_free: 0 | 1
}

/** 社区帖子 */
export interface Post {
  id: number
  uid: number
  nickname: string
  content: string
  images?: string[]
  like_count: number
  comment_count: number
  is_like: 0 | 1
  is_favorite: 0 | 1
  created_at: string
}

export interface Comment {
  id: number
  uid: number
  nickname: string
  content: string
  like_count: number
  created_at: string
}

/** 应用配置 */
export interface AppConfig {
  version: {
    id: number
    version: string
    apk: string
    must: 0 | 1
  }
  domain_name: string
  github_url?: string
  click_app_id?: string
  maintain_switch: 0 | 1
}
