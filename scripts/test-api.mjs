/**
 * API 连通性测试 (Node.js)
 * 运行: node scripts/test-api.mjs
 */
import crypto from 'crypto'

const KEY = '70xk285k3njrxqrg'
const IV  = 'wlhpb7emalhux1ej'
const BASE = 'https://api3.fkxbvttqa.cc/api.php'

function aesEncrypt(plain) {
  const c = crypto.createCipheriv('aes-128-cbc', KEY, IV)
  return c.update(plain, 'utf8', 'base64') + c.final('base64')
}

function aesDecrypt(b64) {
  const d = crypto.createDecipheriv('aes-128-cbc', KEY, IV)
  return d.update(b64, 'base64', 'utf8') + d.final('utf8')
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex')
}

function sign(enc, ts) {
  const raw = `_ver=v1&data=${enc}&timestamp=${ts}${KEY}`
  return md5(sha256(raw))
}

async function main() {
  console.log('=== 51NOVA API 测试 ===\n')

  // 1. GET 握手
  console.log('[1] GET 握手...')
  let resp = await fetch(BASE, { method: 'GET' })
  console.log(`    HTTP ${resp.status}, cookie: ${(resp.headers.get('set-cookie') || '(none)').substring(0, 50)}`)

  // 2. getconfig
  console.log('\n[2] POST /api/home/getconfig...')
  let result = await apiPost('/api/home/getconfig', {})
  console.log(`    status=${result.status}, version=${result.data?.version?.version || '?'}`)
  if (result.status === 1) console.log('    ✅ getconfig 成功')

  // 3. base_info
  console.log('\n[3] POST /api/users/base_info...')
  result = await apiPost('/api/users/base_info', {})
  console.log(`    status=${result.status}, uid=${result.data?.uid || '?'}, nickname=${result.data?.nickname || '?'}`)
  if (result.status === 1) console.log('    ✅ base_info 成功')

  // 4. video detail
  console.log('\n[4] POST /api/mv/detail (id=771401)...')
  result = await apiPost('/api/mv/detail', { id: 771401 })
  const row = result.data?.row || result.data
  if (row?.title) {
    console.log(`    ✅ 视频: ${row.title.substring(0, 50)}`)
    console.log(`    播放: ${row.play_url?.encrypt_url?.substring(0, 60)}...`)
    console.log(`    时长: ${row.duration}s, 点赞: ${row.like}`)
  } else {
    console.log(`    status=${result.status}, msg=${result.msg || '?'}`)
  }

  // 5. novel home
  console.log('\n[5] POST /api/novel/home...')
  result = await apiPost('/api/novel/home', {})
  const list = result.data?.list || []
  console.log(`    分类数: ${list.length}`)
  if (list.length > 0) console.log(`    ✅ 小说模块正常`)

  // 6. picture home
  console.log('\n[6] POST /api/picture/home...')
  result = await apiPost('/api/picture/home', {})
  const cats = result.data?.list || []
  console.log(`    分类数: ${cats.length}`)
  if (cats.length > 0) console.log(`    ✅ 图片模块正常`)

  console.log('\n=== 测试完成 ===')
}

async function apiPost(path, extra) {
  const inner = {
    oauth_type: 'android',
    oauth_id: crypto.randomBytes(16).toString('hex'),
    version: '2.1.1',
    build_affcode: 'gw',
    theme: '',
    device_brand: 'Test',
    device_model: 'TestDevice',
    aff_x_code: 'avTyp',
    token: '',
    bundle_id: 'com.cepec.vechsb',
    ...extra,
  }
  const enc = aesEncrypt(JSON.stringify(inner))
  const ts = Date.now()
  const params = new URLSearchParams()
  params.set('_ver', 'v1')
  params.set('data', enc)
  params.set('timestamp', String(ts))
  params.set('sign', sign(enc, ts))

  const resp = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  const json = await resp.json()

  if (json.data && typeof json.data === 'string') {
    try {
      const dec = JSON.parse(aesDecrypt(json.data))
      return dec
    } catch (e) {
      return { status: -1, msg: '解密失败: ' + e.message, raw: json }
    }
  }
  return { status: -1, msg: '无data字段', raw: json }
}

main().catch(console.error)
