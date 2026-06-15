/**
 * API 连通性测试
 * 验证完整加密/解密链路
 * 运行: npx tsx scripts/test-api.ts
 */
import { md5, sha256 } from '../src/utils/crypto'

async function main() {
  console.log('=== 51NOVA API 连通性测试 ===\n')

  // 1. 测试 MD5
  console.log('[1/4] MD5 算法验证')
  const tests: [string, string][] = [
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['hello', '5d41402abc4b2a76b9719d911017c592'],
    ['51NOVA', 'c68572179a9b25a551fa555b120b89b1'],
  ]
  let allMd5Ok = true
  for (const [input, expected] of tests) {
    const result = md5(input)
    const ok = result === expected
    if (!ok) { allMd5Ok = false; console.log(`  ❌ md5('${input}') = ${result} (expected ${expected})`) }
  }
  if (allMd5Ok) console.log('  ✅ MD5 全部通过')

  // 2. 测试签名
  console.log('\n[2/4] 签名算法验证')
  const testEnc = 'testEncryptedData=='
  const testTs = 1781342813058
  const sig = await sign(testEnc, testTs)
  console.log(`  sign(enc, ${testTs}) = ${sig}`)

  // 3. 测试 GET 握手
  console.log('\n[3/4] GET 握手')
  try {
    const resp = await fetch('https://api3.fkxbvttqa.cc/api.php', { method: 'GET' })
    const cookie = resp.headers.get('Set-Cookie') || '(none)'
    console.log(`  HTTP ${resp.status}, Set-Cookie: ${cookie.substring(0, 60)}...`)
  } catch (e: any) {
    console.log(`  ❌ 握手失败: ${e.message}`)
    return
  }

  // 4. 测试加密 POST
  console.log('\n[4/4] 加密 POST — /api/home/getconfig')
  try {
    // 构建加密 payload
    const inner = {
      oauth_type: 'android',
      oauth_id: 'test1234567890abcdef1234567890ab',
      version: '2.1.1',
      build_affcode: 'gw',
      theme: '',
      device_brand: 'Test',
      device_model: 'TestDevice',
      aff_x_code: 'avTyp',
      token: '',
      bundle_id: 'com.cepec.vechsb',
    }
    const enc = await aesEncrypt(JSON.stringify(inner))
    const ts = Date.now()
    const sig2 = await sign(enc, ts)
    const params = new URLSearchParams()
    params.set('_ver', 'v1')
    params.set('data', enc)
    params.set('timestamp', String(ts))
    params.set('sign', sig2)

    const resp = await fetch('https://api3.fkxbvttqa.cc/api.php/api/home/getconfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const result = await resp.json()
    console.log(`  HTTP ${resp.status}, errcode=${result.errcode}`)

    if (result.data) {
      const decrypted = await aesDecrypt(result.data)
      const parsed = JSON.parse(decrypted)
      console.log(`  status=${parsed.status}, version=${parsed.data?.version?.version || '?'}`)
      if (parsed.status === 1) console.log('  ✅ API 加密通信链路完全正常！')
      else console.log(`  ⚠️ 业务失败: ${parsed.msg}`)
    }
  } catch (e: any) {
    console.log(`  ❌ POST 失败: ${e.message}`)
  }

  console.log('\n=== 测试完成 ===')
}

// 复制加密函数（避免依赖问题）
import { createHash } from 'crypto'
// 使用 Node.js crypto 模块
async function sha256(text: string): Promise<string> {
  return createHash('sha256').update(text).digest('hex')
}
function md5(text: string): string {
  const SparkMD5 = require('spark-md5')
  return SparkMD5.hash(text)
}
async function sign(encData: string, ts: number): Promise<string> {
  const raw = `_ver=v1&data=${encData}&timestamp=${ts}70xk285k3njrxqrg`
  const h = await sha256(raw)
  return md5(h)
}

// AES 加密（Node.js）
import crypto from 'crypto'
const KEY = '70xk285k3njrxqrg'
const IV = 'wlhpb7emalhux1ej'
function aesEncrypt(plain: string): string {
  const cipher = crypto.createCipheriv('aes-128-cbc', KEY, IV)
  return cipher.update(plain, 'utf8', 'base64') + cipher.final('base64')
}
function aesDecrypt(b64: string): string {
  const decipher = crypto.createDecipheriv('aes-128-cbc', KEY, IV)
  return decipher.update(b64, 'base64', 'utf8') + decipher.final('utf8')
}

main().catch(console.error)
