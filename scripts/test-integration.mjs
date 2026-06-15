/**
 * 51NOVA 集成测试 v4
 * 已验证: getconfig, base_info, picture/home 可用
 * 运行: node scripts/test-integration.mjs
 */
import crypto from 'crypto'

const KEY='70xk285k3njrxqrg', IV='wlhpb7emalhux1ej', UA='okhttp-okgo/jeasonlzy'
const HOST='api3.fkxbvttqa.cc'

function aesEncrypt(p) { const c=crypto.createCipheriv('aes-128-cbc',KEY,IV); return c.update(p,'utf8','base64')+c.final('base64') }
function aesDecrypt(b) { const d=crypto.createDecipheriv('aes-128-cbc',KEY,IV); return d.update(b,'base64','utf8')+d.final('utf8') }
function md5(t) { return crypto.createHash('md5').update(t).digest('hex') }
function sha256(t) { return crypto.createHash('sha256').update(t).digest('hex') }
function sign(enc,ts) { return md5(sha256('_ver=v1&data='+enc+'&timestamp='+ts+KEY)) }

const OAUTH_ID = crypto.randomBytes(16).toString('hex')
const DELAY = 600

function rawPost(path, extra) {
  return new Promise((resolve, reject) => {
    const inner = { oauth_type:'android', oauth_id:OAUTH_ID,
      version:'2.1.1', build_affcode:'gw', theme:'', device_brand:'HONOR',
      device_model:'LRA-AL00', aff_x_code:'avTyp', token:'', bundle_id:'com.cepec.vechsb', ...extra }
    const enc = aesEncrypt(JSON.stringify(inner))
    const ts = Date.now()
    const body = '_ver=v1&data='+enc+'&timestamp='+ts+'&sign='+sign(enc,ts)
    const opts = {hostname:HOST,path:'/api.php'+path,method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(body),'User-Agent':UA}}
    const req = https.request(opts, res => {
      let d=''; res.on('data',c=>d+=c)
      res.on('end',()=>{
        if (res.statusCode!==200) return resolve({status:res.statusCode})
        try {
          const j = JSON.parse(d)
          if (j.data && typeof j.data==='string') {
            const dec = JSON.parse(aesDecrypt(j.data))
            resolve({status:200, decrypted:dec, raw:j})
          } else resolve({status:200, raw:j})
        } catch(e) { resolve({status:200, parseError:e.message, raw:d.substring(0,100)}) }
      })
    })
    req.on('error', reject)
    req.write(body); req.end()
  })
}

import https from 'https'
let passed=0, failed=0

async function test(name, fn) {
  process.stdout.write(`  ${name}... `)
  try { const r = await fn(); if (r.status===200 && r.decrypted?.status===1) { passed++; console.log('✅') }
  else if (r.status!==200) { failed++; console.log(`❌ HTTP ${r.status}`) }
  else { failed++; console.log(`❌ status=${r.decrypted?.status||'?'} ${r.decrypted?.msg||r.raw?.errcode||''}`) } }
  catch(e) { failed++; console.log(`❌ ${e.message}`) }
}

console.log('\n=== 51NOVA 集成测试 v4 ===\n')

await sleep(DELAY); await test('getconfig (配置)', () => rawPost('/api/home/getconfig'))
await sleep(DELAY); await test('base_info (用户)', () => rawPost('/api/users/base_info'))
await sleep(DELAY); await test('picture/home (图片)', () => rawPost('/api/picture/home'))
await sleep(DELAY); await test('audio/home (音频)', () => rawPost('/api/audio/home'))
await sleep(DELAY); await test('community/home (社区)', () => rawPost('/api/community/home'))
await sleep(DELAY); await test('recommend/discover', () => rawPost('/api/recommend/discover', {page:1}))
await sleep(DELAY); await test('mv/detail', () => rawPost('/api/mv/detail', {id:771401}))

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`)
if (failed===0) console.log('🎉 全链路 API 通信验证通过！')
else console.log('⚠️ 部分端点需调整参数')
