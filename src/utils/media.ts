/**
 * 媒体工具 — m3u8 解码 + 视频 URL 处理
 */

/** 双重 Base64 解码 m3u8 */
export function decodeM3u8(encrypted: string): string {
  try {
    // 第一次 Base64 解码
    const clean = encrypted.replace(/[^A-Za-z0-9+/=]/g, '')
    const level1 = atob(clean)

    // 提取纯 Base64 字符
    const b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    const clean2 = level1.split('').filter(c => b64Chars.includes(c)).join('')

    // 第二次 Base64 解码
    return atob(clean2)
  } catch {
    // 如果解码失败，尝试当成普通 m3u8 使用
    return encrypted
  }
}

/** 构造视频播放 URL（含 verify_token） */
export function buildPlayUrl(
  encryptUrl: string,
  verifyToken?: string
): string {
  if (!encryptUrl) return ''
  let url = encryptUrl
  if (verifyToken) {
    const sep = url.includes('?') ? '&' : '?'
    url += `${sep}verify_token=${verifyToken}`
  }
  return url
}

/** 获取 TS 密钥下载地址 */
export function getKeyUrl(m3u8Content: string): { uri: string; iv: string } | null {
  const match = m3u8Content.match(/#EXT-X-KEY:.+?URI="([^"]+)"(.+?IV=0x([0-9a-fA-F]+))?/)
  if (!match) return null
  return {
    uri: match[1],
    iv: match[3] || '',
  }
}

/** 构造图片代理 URL（通过 Worker 解密） */
export function buildImageProxyUrl(originalUrl: string): string {
  if (!originalUrl) return ''
  // 使用 Worker 的 /image 端点
  const workerBase = import.meta.env.VITE_WORKER_URL || 'https://dy.24tv.cc.cd'
  return `${workerBase}/image?url=${encodeURIComponent(originalUrl)}`
}
export function parseAuthKey(url: string): { timestamp: number; hash: string } | null {
  const match = url.match(/auth_key=(\d+)-[^-]+-[^-]+-([0-9a-f]+)/)
  if (!match) return null
  return { timestamp: parseInt(match[1]), hash: match[2] }
}

/** 检查 auth_key 是否过期 */
export function isAuthKeyExpired(url: string, gracePeriod = 3600): boolean {
  const auth = parseAuthKey(url)
  if (!auth) return false
  return (Date.now() / 1000) > (auth.timestamp + gracePeriod)
}
