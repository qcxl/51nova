/**
 * 51NOVA Cloudflare Worker — 全量 API 代理
 *
 * 职责：
 * 1. CORS 代理所有 API 请求（解决 GitHub Pages 跨域问题）
 * 2. Session 缓存（复用 GET 握手 session）
 * 3. 图片 AES 解密代理
 * 4. m3u8 双重 Base64 解码
 */

import { decryptImg2 } from './decrypt.js'

// 图片解密密码（生产环境应使用 Workers Secrets）
const IMG_PASSPHRASE = 'JCQ0JBYRQBcXEkITQkATERQRHRI2MxcqCTw2FwEJ'

// 上游 API 服务器列表（故障切换）
const API_SERVERS = [
  'https://api1.fkxbvttqa.cc/api.php',
  'https://api3.fkxbvttqa.cc/api.php',
  'https://bak.fxcvlyzc.cc/api.php',
]

// 允许的来源域（生产环境替换为实际域名）
const ALLOWED_ORIGINS = [
  'https://weifeng.github.io',
  'https://51nova.workers.dev',
  'http://localhost:3000',
  'http://localhost:5173',
  null, // 允许无 Origin 头（直接调用）
]

// Cookie 缓存（全局变量）
let sessionCookies = ''
let sessionTimestamp = 0
const SESSION_TTL = 10 * 60 * 1000 // 10 分钟

/** 检查 Origin 是否在允许列表中 */
function isOriginAllowed(origin) {
  if (!origin) return true
  return ALLOWED_ORIGINS.some(o => o && origin.startsWith(o))
}

/** 构建 CORS 响应头 */
function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  } else {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0]
  }
  return headers
}

/** 生成通用 JSON 响应 */
function jsonResponse(data, status = 200, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname
    const origin = request.headers.get('Origin')
    const targetParam = url.searchParams.get('target')

    // ===== CORS 预检 =====
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) })
    }

    // 非预检请求检查 Origin
    if (origin && !isOriginAllowed(origin)) {
      return jsonResponse({ error: 'Origin not allowed' }, 403, origin)
    }

    // ===== 图片解密代理 =====
    if (path === '/image') {
      const imgUrl = url.searchParams.get('url')
      if (!imgUrl) return jsonResponse({ error: 'Missing url param' }, 400, origin)
      try {
        const resp = await fetch(imgUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; LRA-AL00)' },
        })
        const buffer = await resp.arrayBuffer()
        const decrypted = await decryptImg2(new Uint8Array(buffer), IMG_PASSPHRASE)
        const padLen = decrypted[decrypted.length - 1]
        const unpadded = padLen < 16 ? decrypted.slice(0, decrypted.length - padLen) : decrypted
        return new Response(unpadded, {
          headers: {
            ...corsHeaders(origin),
            'Content-Type': resp.headers.get('Content-Type') || 'image/png',
            'Cache-Control': 'public, max-age=86400',
          },
        })
      } catch (e) {
        return jsonResponse({ error: 'Image decode failed' }, 500, origin)
      }
    }

    // ===== m3u8 解码代理 =====
    if (path === '/m3u8') {
      const m3u8Url = url.searchParams.get('url')
      const token = url.searchParams.get('token')
      if (!m3u8Url) return jsonResponse({ error: 'Missing url param' }, 400, origin)
      try {
        const fetchUrl = token ? `${m3u8Url}&verify_token=${token}` : m3u8Url
        const resp = await fetch(fetchUrl)
        const text = await resp.text()
        const decoded = decodeM3U8(text)
        return new Response(decoded, {
          headers: {
            ...corsHeaders(origin),
            'Content-Type': 'application/vnd.apple.mpegurl',
          },
        })
      } catch (e) {
        return jsonResponse({ error: 'M3U8 decode failed' }, 500, origin)
      }
    }

    // ===== 通用 API 代理 =====
    if (path === '/api-proxy' && targetParam) {
      const apiPath = decodeURIComponent(targetParam)
      try {
        await ensureSession()

        const serverIndex = Math.floor(Math.random() * API_SERVERS.length)
        const apiUrl = API_SERVERS[serverIndex]

        const formData = await request.formData()
        const resp = await fetch(apiUrl + apiPath, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': sessionCookies,
            'User-Agent': 'okhttp-okgo/jeasonlzy',
          },
          body: formData,
        })

        const setCookie = resp.headers.get('Set-Cookie')
        if (setCookie) {
          sessionCookies = setCookie
          sessionTimestamp = Date.now()
        }

        const responseText = await resp.text()
        return new Response(responseText, {
          headers: {
            ...corsHeaders(origin),
            'Content-Type': 'application/json',
          },
        })
      } catch (e) {
        return jsonResponse({ error: 'Proxy failed' }, 502, origin)
      }
    }

    // ===== 默认响应 =====
    return new Response('51NOVA Worker — use /api-proxy, /image, or /m3u8', {
      headers: corsHeaders(origin),
    })
  },
}

/** 确保 session 有效 */
async function ensureSession() {
  if (sessionCookies && (Date.now() - sessionTimestamp) < SESSION_TTL) return
  for (const server of API_SERVERS) {
    try {
      const resp = await fetch(server, { method: 'GET' })
      const cookie = resp.headers.get('Set-Cookie')
      if (cookie) {
        sessionCookies = cookie
        sessionTimestamp = Date.now()
        return
      }
    } catch (e) {
      console.warn(`Handshake failed for ${server}:`, e)
    }
  }
}

/** 双重 Base64 解码 m3u8 */
function decodeM3U8(encrypted) {
  try {
    const cleaned = encrypted.replace(/[^A-Za-z0-9+/=]/g, '')
    const level1 = atob(cleaned)
    const b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    const clean2 = level1.split('').filter(c => b64Chars.includes(c)).join('')
    return atob(clean2)
  } catch {
    return encrypted
  }
}
