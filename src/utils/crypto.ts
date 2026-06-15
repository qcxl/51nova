/**
 * 51NOVA Crypto SDK
 * AES-128-CBC 加密/解密 + 签名生成
 * 使用 Web Crypto API（浏览器原生，支持硬件加速）
 *
 * 包含 AES-256-CFB 二次解密（用于 crypt=true 响应）
 */

const KEY_STR = '70xk285k3njrxqrg'
const IV_STR = 'wlhpb7emalhux1ej'
const API_PASSPHRASE = 'JCQ0JBYRQBcXEkITQkATERQRHRI2MxcqCTw2FwEJ'

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

// ===== AES-256-CFB 二次解密（用于 crypt=true 响应） =====

/** 16 字节置换表 (10 张) */
const PERMUTATION_TABLES: number[][] = [
  [14, 4, 2, 0, 6, 3, 9, 7, 8, 11, 10, 5, 1, 13, 12, 15],
  [9, 0, 11, 1, 12, 5, 8, 7, 13, 6, 3, 2, 14, 4, 15, 10],
  [8, 11, 2, 14, 15, 1, 9, 6, 10, 13, 4, 3, 5, 0, 7, 12],
  [2, 10, 4, 8, 14, 1, 0, 13, 7, 3, 6, 12, 11, 9, 15, 5],
  [5, 12, 0, 15, 7, 1, 14, 10, 8, 11, 9, 3, 6, 2, 4, 13],
  [12, 1, 5, 13, 11, 9, 4, 7, 8, 14, 15, 6, 2, 10, 0, 3],
  [11, 4, 1, 8, 7, 6, 9, 3, 5, 2, 13, 10, 12, 15, 14, 0],
  [4, 7, 2, 10, 6, 8, 0, 12, 14, 1, 11, 3, 5, 13, 15, 9],
  [11, 15, 12, 4, 0, 7, 1, 9, 8, 6, 10, 3, 14, 5, 13, 2],
  [3, 8, 11, 14, 15, 9, 12, 13, 5, 10, 1, 0, 7, 2, 4, 6],
]

/**
 * parsePassphrase — 解析 Base64 密码
 * 返回 { xorSegment, keyData, bit }
 */
function parsePassphrase(b64pass: string): {
  xorSegment: Uint8Array
  keyData: Uint8Array
  bit: number
} {
  let decoded = b64ToBytes(b64pass)
  if (decoded.length < 30) throw new Error('pass length error')

  const segStart = decoded.length - 10

  // XOR 最后 10 字节与 0x46
  for (let i = segStart; i < segStart + 10; i++) {
    decoded[i] ^= 0x46
  }

  // 计算 XOR 和
  let xorSum = 0
  for (let i = segStart; i < segStart + 10; i++) {
    xorSum ^= decoded[i]
  }

  // XOR 标志头 [0:4] 与 xorSum
  for (let k = 0; k < 4; k++) {
    decoded[k] ^= xorSum
  }

  const bit = decoded[2]
  if (![16, 24, 32].includes(bit)) throw new Error(`invalid bit: ${bit}`)

  const keyData = decoded.slice(4, 4 + bit)
  const xorSegment = decoded.slice(segStart, segStart + 10)

  return { xorSegment, keyData, bit }
}

/**
 * swapByteLocation — 字节置换
 * result[j] = data[permTable[index][j]]
 */
function swapByteLocation(data: Uint8Array, xorKey: Uint8Array): Uint8Array {
  let keySum = 0
  for (let i = 0; i < xorKey.length; i++) keySum += xorKey[i]
  const tableIndex = keySum % 10
  const table = PERMUTATION_TABLES[tableIndex]
  const result = new Uint8Array(data.length)
  for (let j = 0; j < data.length; j++) {
    result[j] = data[table[j]]
  }
  return result
}

/** MD5 哈希（对 Uint8Array 输入）— 返回 16 字节 */
function md5Bytes(data: Uint8Array): Uint8Array {
  // SparkMD5.ArrayBuffer 期望 ArrayBuffer — 创建一个副本
  const copy = new ArrayBuffer(data.byteLength)
  new Uint8Array(copy).set(data)
  const hex = SparkMD5.ArrayBuffer.hash(copy)
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * EVP_BytesToKey — OpenSSL 密钥派生
 * 使用 MD5 迭代生成 key+iv
 */
function evpBytesToKey(salt: Uint8Array, keySize: number, ivSize: number): Uint8Array {
  const blocks: Uint8Array[] = []
  let prev: Uint8Array | null = null
  let total = 0
  while (total < keySize + ivSize) {
    const input = !prev
      ? salt
      : new Uint8Array([...prev, ...salt])
    const h = md5Bytes(input)
    blocks.push(h)
    prev = h
    total += 16
  }
  const result = new Uint8Array(blocks.reduce<number[]>((acc, b) => {
    acc.push(...b)
    return acc
  }, []))
  return result.slice(0, keySize + ivSize)
}

/**
 * AES-256-CFB 解密（手动实现，Web Crypto API 没有原生 CFB 模式）
 * 使用 AES-CBC 加密零块生成密钥流 → XOR 明文
 */
async function aes256CfbDecryptInner(keyBytes: Uint8Array, ivBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', toBuffer(keyBytes), { name: 'AES-CBC' }, false, ['encrypt'])
  const blockSize = 16
  const result = new Uint8Array(data.length)
  let feedback = ivBytes.slice(0, 16)

  for (let i = 0; i < data.length; i += blockSize) {
    // 加密反馈块 → 生成密钥流
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: toBuffer(new Uint8Array(blockSize)) },
      key,
      toBuffer(feedback)
    )
    const keystream = new Uint8Array(encrypted).slice(0, blockSize)

    // XOR 密钥流与密文
    for (let j = 0; j < blockSize && i + j < data.length; j++) {
      result[i + j] = data[i + j] ^ keystream[j]
    }

    // CFB 反馈 = 密文块
    feedback = data.slice(i, i + blockSize)
  }

  return result
}

/**
 * AES-256-CFB 解密 — 完整的 decryptApi 流程
 * 1. parsePassphrase → XOR → swapByteLocation
 * 2. EVP_BytesToKey → AES-256 密钥
 * 3. Hex 解码 → [16B IV][密文]
 * 4. AES-256-CFB 解密
 */
export async function aes256CfbDecrypt(hexData: string, passphraseB64: string): Promise<string> {
  // 1. 解析密码
  const { xorSegment, keyData, bit } = parsePassphrase(passphraseB64)

  // 2. XOR 密钥材料
  const keyBuffer = new Uint8Array(keyData)
  for (let i = 0; i < bit; i++) {
    for (let j = 0; j < 10; j++) {
      keyBuffer[i] ^= xorSegment[j]
    }
  }

  // 3. 字节置换
  const swapped = swapByteLocation(keyBuffer, xorSegment)

  // 4. EVP_BytesToKey → AES-256 密钥 (32B key + 16B IV)
  const keyIv = evpBytesToKey(swapped, 32, 16)
  const aesKey = keyIv.slice(0, 32)
  const iv = keyIv.slice(32, 48)

  // 5. Hex 解码 → [16B IV][密文]
  const raw = new Uint8Array(
    hexData.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || []
  )
  const dataIv = raw.slice(0, 16)
  const ciphertext = raw.slice(16)

  // 6. AES-256-CFB 解密
  const plain = await aes256CfbDecryptInner(aesKey, dataIv, ciphertext)

  return new TextDecoder().decode(plain)
}

// ===== 构建请求 payload =====

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
