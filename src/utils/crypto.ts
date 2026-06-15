/**
 * 51NOVA Crypto SDK
 * AES-128-CBC 加密/解密 + 签名生成
 * 使用 Web Crypto API（浏览器原生，支持硬件加速）
 */

const KEY_STR = '70xk285k3njrxqrg'
const IV_STR = 'wlhpb7emalhux1ej'

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function bytesToStr(b: ArrayBuffer): string {
  return new TextDecoder().decode(b)
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
  const buf = new ArrayBuffer(bin.length)
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Wrap Uint8Array as BufferSource for Web Crypto API */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBuffer(data: Uint8Array): BufferSource {
  return data as unknown as BufferSource
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

async function importKey(keyData: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toBuffer(keyData),
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  )
}

/** AES-128-CBC 加密 → Base64 */
export async function aesEncrypt(plain: string): Promise<string> {
  const key = await importKey(strToBytes(KEY_STR))
  const iv = strToBytes(IV_STR)
  const encoded = strToBytes(plain)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: toBuffer(iv) },
    key,
    toBuffer(encoded)
  )
  return bytesToB64(new Uint8Array(encrypted))
}

/** Base64 → AES-128-CBC 解密 */
export async function aesDecrypt(b64Data: string): Promise<string> {
  const key = await importKey(strToBytes(KEY_STR))
  const iv = strToBytes(IV_STR)
  const encrypted = b64ToBytes(b64Data)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: toBuffer(iv) },
    key,
    toBuffer(encrypted)
  )
  return bytesToStr(decrypted)
}

/** SHA-256 hex */
export async function sha256(text: string): Promise<string> {
  const encoded = strToBytes(text)
  const hash = await crypto.subtle.digest('SHA-256', toBuffer(encoded))
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

import SparkMD5 from 'spark-md5'

/** MD5 哈希 (使用 spark-md5 库，RFC 1321 兼容) */
export function md5(text: string): string {
  return SparkMD5.hash(text)
}

/** 签名生成 */
export async function sign(encData: string, ts: number): Promise<string> {
  const raw = `_ver=v1&data=${encData}&timestamp=${ts}${KEY_STR}`
  const h = await sha256(raw)
  return md5(h)
}

/** 构建完整请求 payload */
export async function makePayload(
  extra: Record<string, any> = {},
  deviceId: string,
  token: string
): Promise<URLSearchParams> {
  const inner: Record<string, any> = {
    oauth_type: 'android',
    oauth_id: deviceId,
    version: '2.1.1',
    build_affcode: 'gw',
    theme: '',
    device_brand: 'Web',
    device_model: navigator.userAgent.substring(0, 64),
    aff_x_code: 'avTyp',
    token: token || '',
    bundle_id: 'com.cepec.vechsb',
    ...extra,
  }
  const enc = await aesEncrypt(JSON.stringify(inner))
  const ts = Date.now()
  const signVal = await sign(enc, ts)
  const params = new URLSearchParams()
  params.set('_ver', 'v1')
  params.set('data', enc)
  params.set('timestamp', String(ts))
  params.set('sign', signVal)
  return params
}
