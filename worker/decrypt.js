/**
 * 51NOVA Image Decrypt Module
 *
 * 实现 decryptImg2 算法：
 *   1. parsePassphrase — 解析 Base64 密码
 *   2. 密钥材料 XOR 处理
 *   3. swapByteLocation — 字节置换
 *   4. AES-128-CBC 解密（硬编码 IV）
 *
 * 密码: JCQ0JBYRQBcXEkITQkATERQRHRI2MxcqCTw2FwEJ
 * 算法来源: libsojm.so (Go, ARM64) IDA Pro 逆向
 */

// 16 字节置换表 (10 张)
const PERMUTATION_TABLES = [
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

/** Base64 解码 */
function b64decode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad) s += '='.repeat(4 - pad)
  const binStr = atob(s)
  const bytes = new Uint8Array(binStr.length)
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i)
  return bytes
}

/**
 * parsePassphrase — 解析 Base64 密码
 * 输入: Base64 编码的密码字符串
 * 返回: { xorSegment, keyData, bit, xorSum }
 */
function parsePassphrase(b64pass) {
  const decoded = b64decode(b64pass)
  if (decoded.length < 30) throw new Error('pass length error')

  // XOR 最后 10 字节与 0x46
  const segStart = decoded.length - 10
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

  const flag = decoded.slice(0, 4)
  const bit = flag[2] // ∈ {16, 24, 32}
  if (![16, 24, 32].includes(bit)) throw new Error(`invalid bit: ${bit}`)

  const keyData = decoded.slice(4, 4 + bit)
  const xorSegment = decoded.slice(segStart, segStart + 10)

  return { xorSegment, keyData, bit, xorSum }
}

/**
 * swapByteLocation — 字节置换
 * result[j] = data[permTable[index][j]]
 */
function swapByteLocation(data, xorKey) {
  let keySum = 0
  for (let i = 0; i < xorKey.length; i++) keySum += xorKey[i]
  const tableIndex = keySum % 10
  const bit = data.length
  const table = PERMUTATION_TABLES[tableIndex]
  const result = new Uint8Array(bit)
  for (let j = 0; j < bit; j++) {
    result[j] = data[table[j]]
  }
  return result
}

/**
 * AES-128-CBC 解密 (Web Crypto API)
 */
async function aesCbcDecrypt(keyBytes, ivBytes, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  )
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: ivBytes },
    key,
    data
  )
  return new Uint8Array(decrypted)
}

/**
 * decryptImg2 — 新版图片解密
 *
 * @param {Uint8Array} encryptedData - 加密图片二进制数据
 * @param {string} passphraseB64 - Base64 编码密码
 * @returns {Promise<Uint8Array>} 解密后的图片数据
 */
export async function decryptImg2(encryptedData, passphraseB64) {
  // 1. 解析密码
  const { xorSegment, keyData, bit, xorSum } = parsePassphrase(passphraseB64)

  // 2. XOR 密钥材料与 xorSum
  const keyBuffer = new Uint8Array(keyData)
  for (let i = 0; i < bit; i++) {
    keyBuffer[i] ^= xorSum
  }

  // 3. 字节置换
  const aesKey = swapByteLocation(keyBuffer, xorSegment)

  // 4. 硬编码 IV
  const iv = new TextEncoder().encode('97b60394abc2fbe1')

  // 5. AES-128-CBC 解密
  const plaintext = await aesCbcDecrypt(aesKey.slice(0, 16), iv, encryptedData)

  return plaintext
}

/**
 * decryptImgOld — 旧版图片解密 (AES-256-CFB + EVP_BytesToKey)
 * 用于 crypt=true 的 API 二次解密
 */
export async function decryptImgOld(hexData, passphraseB64) {
  const { xorSegment, keyData, bit, xorSum } = parsePassphrase(passphraseB64)

  // XOR 密钥材料
  const keyBuffer = new Uint8Array(keyData)
  for (let i = 0; i < bit; i++) {
    for (let j = 0; j < 10; j++) {
      keyBuffer[i] ^= xorSegment[j]
    }
  }

  // 字节置换
  const swapped = swapByteLocation(keyBuffer, xorSegment)

  // EVP_BytesToKey 密钥派生
  const salt = swapped
  const keyIv = await evpBytesToKey(salt, 32, 16)
  const aesKey = keyIv.slice(0, 32)
  const iv = keyIv.slice(32, 48)

  // Hex 解码
  const hexStr = typeof hexData === 'string' ? hexData : new TextDecoder().decode(hexData)
  const raw = hexToBytes(hexStr.trim())

  // AES-256-CFB 解密 (使用 Web Crypto API)
  // 注意: CFB 模式需要手动实现
  const plaintext = await aesCfbDecrypt(aesKey, iv, raw)
  return plaintext
}

/**
 * EVP_BytesToKey — OpenSSL 密钥派生 (MD5 迭代)
 */
async function evpBytesToKey(salt, keySize, ivSize) {
  let digest = new Uint8Array(0)
  let total = 0
  while (total < keySize + ivSize) {
    const md5Input = total === 0
      ? salt
      : concatBytes(digest.slice(-16), salt)
    const hash = md5(md5Input)
    digest = concatBytes(digest, hash)
    total += 16
  }
  return digest.slice(0, keySize + ivSize)
}

/**
 * MD5 哈希 (RFC 1321) — 基于 spark-md5 内核
 * 纯 JS，适用于 Cloudflare Worker
 */
function md5(data) {
  const bytes = Array.from(data)
  const n = bytes.length
  const bitLen = n * 8

  // 填充
  bytes.push(0x80)
  while ((bytes.length + 8) % 64 !== 0) bytes.push(0)
  for (let i = 0; i < 8; i++) bytes.push((bitLen >>> (i * 8)) & 0xFF)

  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476

  // md5cycle 核心 (来自 spark-md5)
  function cycle(k) {
    let [aa, bb, cc, dd] = [a, b, c, d]

    const op = (v, s, t, i, fn) => {
      v = v + fn(bb, cc, dd) + k[i] + t | 0
      v = (v << s | v >>> (32 - s)) + bb | 0
      return v
    }

    // Round 1 (FF)
    a = op(a, 7, -680876936, 0,  (x,y,z) => (x & y) | (~x & z))
    d = op(d, 12, -389564586, 1, (x,y,z) => (x & y) | (~x & z))
    c = op(c, 17, 606105819, 2,  (x,y,z) => (x & y) | (~x & z))
    b = op(b, 22, -1044525330, 3, (x,y,z) => (x & y) | (~x & z))
    a = op(a, 7, -176418897, 4,  (x,y,z) => (x & y) | (~x & z))
    d = op(d, 12, 1200080426, 5, (x,y,z) => (x & y) | (~x & z))
    c = op(c, 17, -1473231341, 6, (x,y,z) => (x & y) | (~x & z))
    b = op(b, 22, -45705983, 7,   (x,y,z) => (x & y) | (~x & z))
    a = op(a, 7, 1770035416, 8,  (x,y,z) => (x & y) | (~x & z))
    d = op(d, 12, -1958414417, 9, (x,y,z) => (x & y) | (~x & z))
    c = op(c, 17, -42063, 10,    (x,y,z) => (x & y) | (~x & z))
    b = op(b, 22, -1990404162, 11,(x,y,z) => (x & y) | (~x & z))
    a = op(a, 7, 1804603682, 12, (x,y,z) => (x & y) | (~x & z))
    d = op(d, 12, -40341101, 13, (x,y,z) => (x & y) | (~x & z))
    c = op(c, 17, -1502002290, 14,(x,y,z) => (x & y) | (~x & z))
    b = op(b, 22, 1236535329, 15, (x,y,z) => (x & y) | (~x & z))

    // Round 2 (GG)
    a = op(a, 5, -165796510, 1,   (x,y,z) => (x & z) | (y & ~z))
    d = op(d, 9, -1069501632, 6,  (x,y,z) => (x & z) | (y & ~z))
    c = op(c, 14, 643717713, 11,  (x,y,z) => (x & z) | (y & ~z))
    b = op(b, 20, -373897302, 0,  (x,y,z) => (x & z) | (y & ~z))
    a = op(a, 5, -701558691, 5,   (x,y,z) => (x & z) | (y & ~z))
    d = op(d, 9, 38016083, 10,    (x,y,z) => (x & z) | (y & ~z))
    c = op(c, 14, -660478335, 15, (x,y,z) => (x & z) | (y & ~z))
    b = op(b, 20, -405537848, 4,  (x,y,z) => (x & z) | (y & ~z))
    a = op(a, 5, 568446438, 9,    (x,y,z) => (x & z) | (y & ~z))
    d = op(d, 9, -1019803690, 14, (x,y,z) => (x & z) | (y & ~z))
    c = op(c, 14, -187363961, 3,  (x,y,z) => (x & z) | (y & ~z))
    b = op(b, 20, 1163531501, 8,  (x,y,z) => (x & z) | (y & ~z))
    a = op(a, 5, -1444681467, 13, (x,y,z) => (x & z) | (y & ~z))
    d = op(d, 9, -51403784, 2,    (x,y,z) => (x & z) | (y & ~z))
    c = op(c, 14, 1735328473, 7,  (x,y,z) => (x & z) | (y & ~z))
    b = op(b, 20, -1926607734, 12,(x,y,z) => (x & z) | (y & ~z))

    // Round 3 (HH)
    a = op(a, 4, -378558, 5,      (x,y,z) => x ^ y ^ z)
    d = op(d, 11, -2022574463, 8, (x,y,z) => x ^ y ^ z)
    c = op(c, 16, 1839030562, 11, (x,y,z) => x ^ y ^ z)
    b = op(b, 23, -35309556, 14,  (x,y,z) => x ^ y ^ z)
    a = op(a, 4, -1530992060, 1,  (x,y,z) => x ^ y ^ z)
    d = op(d, 11, 1272893353, 4,  (x,y,z) => x ^ y ^ z)
    c = op(c, 16, -155497632, 7,  (x,y,z) => x ^ y ^ z)
    b = op(b, 23, -1094730640, 10,(x,y,z) => x ^ y ^ z)
    a = op(a, 4, 681279174, 13,   (x,y,z) => x ^ y ^ z)
    d = op(d, 11, -358537222, 0,  (x,y,z) => x ^ y ^ z)
    c = op(c, 16, -722521979, 3,  (x,y,z) => x ^ y ^ z)
    b = op(b, 23, 76029189, 6,    (x,y,z) => x ^ y ^ z)
    a = op(a, 4, -640364487, 9,   (x,y,z) => x ^ y ^ z)
    d = op(d, 11, -421815835, 12, (x,y,z) => x ^ y ^ z)
    c = op(c, 16, 530742520, 15,  (x,y,z) => x ^ y ^ z)
    b = op(b, 23, -995338651, 2,  (x,y,z) => x ^ y ^ z)

    // Round 4 (II)
    a = op(a, 6, -198630844, 0,   (x,y,z) => y ^ (x | ~z))
    d = op(d, 10, 1126891415, 7,  (x,y,z) => y ^ (x | ~z))
    c = op(c, 15, -1416354905, 14,(x,y,z) => y ^ (x | ~z))
    b = op(b, 21, -57434055, 5,   (x,y,z) => y ^ (x | ~z))
    a = op(a, 6, 1700485571, 12,  (x,y,z) => y ^ (x | ~z))
    d = op(d, 10, -1894986606, 3, (x,y,z) => y ^ (x | ~z))
    c = op(c, 15, -1051523, 10,   (x,y,z) => y ^ (x | ~z))
    b = op(b, 21, -2054922799, 1, (x,y,z) => y ^ (x | ~z))
    a = op(a, 6, 1873313359, 8,   (x,y,z) => y ^ (x | ~z))
    d = op(d, 10, -30611744, 15,  (x,y,z) => y ^ (x | ~z))
    c = op(c, 15, -1560198380, 6, (x,y,z) => y ^ (x | ~z))
    b = op(b, 21, 1309151649, 13, (x,y,z) => y ^ (x | ~z))
    a = op(a, 6, -145523070, 4,   (x,y,z) => y ^ (x | ~z))
    d = op(d, 10, -1120210379, 11,(x,y,z) => y ^ (x | ~z))
    c = op(c, 15, 718787259, 2,   (x,y,z) => y ^ (x | ~z))
    b = op(b, 21, -343485551, 9,  (x,y,z) => y ^ (x | ~z))

    a = a + aa | 0; b = b + bb | 0; c = c + cc | 0; d = d + dd | 0
  }

  for (let i = 0; i < bytes.length; i += 64) {
    const w = []
    for (let j = 0; j < 16; j++) w[j] = bytes[i+j*4] | (bytes[i+j*4+1] << 8) | (bytes[i+j*4+2] << 16) | (bytes[i+j*4+3] << 24)
    cycle(w)
  }

  return new Uint8Array([a, b, c, d].flatMap(n => [n & 0xFF, (n>>8)&0xFF, (n>>16)&0xFF, (n>>24)&0xFF]))
}

/** AES-CFB 解密 (手动实现) */
async function aesCfbDecrypt(keyBytes, iv, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt'])
  const blockSize = 16
  const result = new Uint8Array(data.length)
  let feedback = new Uint8Array(iv)

  for (let i = 0; i < data.length; i += blockSize) {
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: feedback.slice(0, 16) },
      key,
      new Uint8Array(blockSize)
    )
    const keystream = new Uint8Array(encrypted).slice(0, blockSize)
    for (let j = 0; j < blockSize && i + j < data.length; j++) {
      result[i + j] = data[i + j] ^ keystream[j]
    }
    feedback = data.slice(i, i + blockSize)
  }

  return result
}

/** 工具函数 */
function concatBytes(a, b) {
  const c = new Uint8Array(a.length + b.length)
  c.set(a)
  c.set(b, a.length)
  return c
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}
