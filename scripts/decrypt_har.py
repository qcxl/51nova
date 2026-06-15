#!/usr/bin/env python3
"""
51NOVA API 抓包数据解密工具
用法: python3 decrypt_har.py <har文件或目录>
"""

import json
import base64
import hashlib
import sys
import os
from datetime import datetime

try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
except ImportError:
    print("请先安装 cryptography: pip3 install cryptography")
    sys.exit(1)

# ===== 加密参数（从 APK 逆向获得） =====
KEY_STR = '70xk285k3njrxqrg'
IV_STR = 'wlhpb7emalhux1ej'
KEY = KEY_STR.encode()
IV = IV_STR.encode()
API_PASSPHRASE = 'JCQ0JBYRQBcXEkITQkATERQRHRI2MxcqCTw2FwEJ'

# ===== 置换表（用于 crypt=true 二次解密） =====
PERMUTATION_TABLES = [
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


# ===== AES-128-CBC 加解密 =====
def b64_decode(s: str) -> bytes:
    s = s.replace('-', '+').replace('_', '/')
    pad = len(s) % 4
    if pad:
        s += '=' * (4 - pad)
    return base64.b64decode(s)


def aes_decrypt(data_b64: str) -> str:
    """AES-128-CBC 解密 → 返回 JSON 字符串"""
    raw = b64_decode(data_b64)
    cipher = Cipher(algorithms.AES(KEY), modes.CBC(IV))
    decryptor = cipher.decryptor()
    dec = decryptor.update(raw) + decryptor.finalize()
    pad_len = dec[-1]
    if 1 <= pad_len <= 16:
        return dec[:-pad_len].decode('utf-8')
    return dec.decode('utf-8', errors='replace')


# ===== 二次解密 (crypt=true) =====
def md5_bytes(data: bytes) -> bytes:
    m = hashlib.md5()
    m.update(data)
    return m.digest()


def parse_passphrase(b64pass: str) -> tuple:
    """解析 Base64 密码 → (xorSegment, keyData, bit, xorSum)"""
    decoded = bytearray(b64_decode(b64pass))
    if len(decoded) < 30:
        raise ValueError('pass length error')
    seg_start = len(decoded) - 10
    for i in range(seg_start, seg_start + 10):
        decoded[i] ^= 0x46
    xor_sum = 0
    for i in range(seg_start, seg_start + 10):
        xor_sum ^= decoded[i]
    for k in range(4):
        decoded[k] ^= xor_sum
    bit = decoded[2]
    if bit not in (16, 24, 32):
        raise ValueError(f'invalid bit: {bit}')
    key_data = bytes(decoded[4:4 + bit])
    xor_segment = bytes(decoded[seg_start:seg_start + 10])
    return xor_segment, key_data, bit, xor_sum


def evp_bytes_to_key(salt: bytes, key_size: int, iv_size: int) -> bytes:
    """EVP_BytesToKey — MD5 迭代密钥派生"""
    result = b''
    prev = None
    while len(result) < key_size + iv_size:
        data = salt if prev is None else prev + salt
        h = md5_bytes(data)
        result += h
        prev = h
    return result[:key_size + iv_size]


def aes256_cfb_decrypt(hex_data: str, passphrase_b64: str) -> str:
    """AES-256-CFB 二次解密（crypt=true 时使用）"""
    xor_segment, key_data, bit, xor_sum = parse_passphrase(passphrase_b64)
    # XOR 密钥材料
    key_buf = bytearray(key_data)
    for i in range(bit):
        for j in range(10):
            key_buf[i] ^= xor_segment[j]
    # 字节置换
    table_idx = sum(xor_segment) % 10
    table = PERMUTATION_TABLES[table_idx]
    swapped = bytearray(len(key_buf) if hasattr(key_buf, '__len__') else bit)
    for j in range(bit):
        swapped[j] = key_buf[table[j]]
    # EVP 密钥派生
    key_iv = evp_bytes_to_key(bytes(swapped), 32, 16)
    aes_key = key_iv[:32]
    iv = key_iv[32:48]
    # Hex 解码
    raw = bytes(int(hex_data[i:i+2], 16) for i in range(0, len(hex_data), 2))
    data_iv = raw[:16]
    ciphertext = raw[16:]
    # AES-256-CFB 解密
    return aes_cfb_decrypt(aes_key, data_iv, ciphertext).decode('utf-8')


def aes_cfb_decrypt(key: bytes, iv: bytes, data: bytes) -> bytes:
    """AES-CFB 解密实现"""
    cipher = Cipher(algorithms.AES(key), modes.ECB())
    encryptor = cipher.encryptor()
    block_size = 16
    result = bytearray()
    feedback = bytearray(iv)
    for i in range(0, len(data), block_size):
        ks = encryptor.update(bytes(feedback))
        for j in range(block_size):
            if i + j < len(data):
                result.append(data[i + j] ^ ks[j])
        feedback = bytearray(data[i:i + block_size])
    return bytes(result)


# ===== 签名验证 =====
def verify_sign(data_b64: str, ts: int, sign: str) -> bool:
    """验证签名是否正确"""
    raw = f"_ver=v1&data={data_b64}&timestamp={ts}{KEY_STR}"
    sha = hashlib.sha256(raw.encode()).hexdigest()
    expected = hashlib.md5(sha.encode()).hexdigest()
    return sign == expected


# ===== 解析请求 payload =====
def decrypt_request_params(body: str) -> dict:
    """解密请求 body 中的加密参数"""
    try:
        import urllib.parse
        params = urllib.parse.parse_qs(body)
        result = {}
        for k, v in params.items():
            if len(v) == 1:
                result[k] = v[0]
            else:
                result[k] = v
        return result
    except:
        return {'raw': body}


def decrypt_request_inner(enc_data: str) -> dict:
    """解密请求 data 字段（内层 JSON）"""
    try:
        dec = aes_decrypt(enc_data)
        return json.loads(dec)
    except:
        return {'_decrypt_error': 'AES decrypt failed'}


# ===== HAR 解析 =====
def parse_har(har_path: str) -> list:
    """解析 HAR 文件，提取 API 请求"""
    with open(har_path, 'r', encoding='utf-8') as f:
        har = json.load(f)

    entries = []
    logs = har.get('log', {})
    for entry in logs.get('entries', []):
        req = entry.get('request', {})
        res = entry.get('response', {})

        url = req.get('url', '')
        method = req.get('method', '')

        # 提取请求 body
        req_body = ''
        if req.get('postData', {}).get('text'):
            req_body = req['postData']['text']
        elif req.get('postData', {}).get('params'):
            req_body = '&'.join(f"{p['name']}={p.get('value', '')}" for p in req['postData']['params'] if 'name' in p)

        # 提取响应 body（Base64 或 text）
        res_body = ''
        res_content = res.get('content', {})
        if res_content.get('encoding') == 'base64' and res_content.get('text'):
            import base64
            try:
                res_body = base64.b64decode(res_content['text']).decode('utf-8', errors='replace')
            except:
                res_body = f"[base64 encoded, {len(res_content['text'])} chars]"
        elif res_content.get('text'):
            res_body = res_content['text']

        entries.append({
            'url': url,
            'method': method,
            'path': url.split('?')[0],
            'request_body': req_body,
            'response_body': res_body,
            'status': res.get('status'),
            'mimeType': res_content.get('mimeType', ''),
            'startedDateTime': entry.get('startedDateTime', ''),
            'time': entry.get('time', 0),
            'headers': {h['name']: h['value'] for h in req.get('headers', []) if isinstance(h, dict) and 'name' in h},
        })

    return entries


# ===== API 请求归类分析 =====
KNOWN_ENDPOINTS = {
    '/api/home/getconfig': {'name': '获取配置', 'params': []},
    '/api/users/base_info': {'name': '用户基础信息（自动注册）', 'params': []},
    '/api/users/login': {'name': '用户登录', 'params': ['username', 'password']},
    '/api/users/register': {'name': '用户注册', 'params': ['username', 'password', 'confirm_password', 'sex', 'nickname']},
    '/api/users/set_all': {'name': '设置用户资料', 'params': ['data']},
    '/api/users/toggle_follow': {'name': '关注/取消关注', 'params': ['aff']},
    '/api/users/subscribe': {'name': '订阅', 'params': ['aff']},
    '/api/users/unbind': {'name': '解绑', 'params': []},
    '/api/tabnew/follow_tab': {'name': 'Tab 导航页', 'params': []},
    '/api/tabnew/list_hyh_mv': {'name': '视频列表', 'params': ['tab_id', 'sort', 'page']},
    '/api/tabnew/tab_detail': {'name': 'Tab 详情', 'params': ['id']},
    '/api/mv/detail': {'name': '视频详情', 'params': ['id']},
    '/api/mv/favorite': {'name': '视频收藏', 'params': ['id']},
    '/api/mv/add_comment': {'name': '视频评论', 'params': ['id', 'content', 'reply_id']},
    '/api/mv/list_comment': {'name': '视频评论列表', 'params': ['id', 'page']},
    '/api/mv/list_barrage': {'name': '视频弹幕列表', 'params': ['id']},
    '/api/mv/list_rank_mv': {'name': '视频排行榜', 'params': []},
    '/api/picture/home': {'name': '图片首页', 'params': []},
    '/api/picture/detail': {'name': '图片详情', 'params': ['id']},
    '/api/picture/favorite': {'name': '图片收藏', 'params': ['id']},
    '/api/picture/like': {'name': '图片点赞', 'params': ['id']},
    '/api/picture/comment': {'name': '图片评论', 'params': ['id', 'content']},
    '/api/picture/comment_list': {'name': '图片评论列表', 'params': ['id', 'page']},
    '/api/picture/follow_series': {'name': '图片订阅系列', 'params': ['id']},
    '/api/novel/home': {'name': '小说首页', 'params': []},
    '/api/novel/detail': {'name': '小说详情', 'params': ['id']},
    '/api/novel/chaptersList': {'name': '小说章节列表', 'params': ['id', 'page']},
    '/api/novel/chapterDetail': {'name': '小说章节内容', 'params': ['id', 'chapter_id']},
    '/api/novel/favorite': {'name': '小说收藏', 'params': ['id']},
    '/api/novel/like': {'name': '小说点赞', 'params': ['id']},
    '/api/novel/comment': {'name': '小说评论', 'params': ['id', 'content']},
    '/api/novel/recommend': {'name': '小说推荐', 'params': []},
    '/api/novel/find_conf': {'name': '小说发现配置', 'params': []},
    '/api/novel/follow_series': {'name': '小说订阅系列', 'params': ['id']},
    '/api/audio/home': {'name': '音频首页', 'params': []},
    '/api/audio/detail': {'name': '音频详情', 'params': ['id']},
    '/api/audio/chapterDetail': {'name': '音频章节', 'params': ['id', 'chapter_id']},
    '/api/audio/download': {'name': '音频下载', 'params': ['id', 'chapter_id']},
    '/api/audio/find_conf': {'name': '音频发现配置', 'params': []},
    '/api/audio/follow_series': {'name': '音频订阅系列', 'params': ['id']},
    '/api/seed/nav': {'name': '短剧导航', 'params': []},
    '/api/seed/detail': {'name': '短剧详情', 'params': ['id']},
    '/api/seed/comment': {'name': '短剧评论', 'params': ['id', 'content']},
    '/api/seed/favorite': {'name': '短剧收藏', 'params': ['id']},
    '/api/community/home': {'name': '社区首页', 'params': []},
    '/api/community/post': {'name': '社区发帖', 'params': ['content', 'images']},
    '/api/community/post_detail': {'name': '社区帖子详情', 'params': ['id']},
    '/api/community/comment': {'name': '社区评论', 'params': ['id', 'content']},
    '/api/community/like': {'name': '社区点赞', 'params': ['id']},
    '/api/community/favorite': {'name': '社区收藏', 'params': ['id']},
    '/api/community/create_topic': {'name': '创建话题', 'params': ['name']},
    '/api/community/topic_detail': {'name': '话题详情', 'params': ['id']},
    '/api/community/follow_topic': {'name': '关注话题', 'params': ['id']},
    '/api/community/peer_center': {'name': '个人主页', 'params': ['uid']},
    '/api/community/pre_post_data': {'name': '发帖前数据', 'params': []},
    '/api/task/sign': {'name': '签到', 'params': []},
    '/api/task/log_list': {'name': '任务列表', 'params': []},
    '/api/task/gain': {'name': '领取任务奖励', 'params': ['id']},
    '/api/task/change': {'name': '变更任务', 'params': ['id']},
    '/api/system/download': {'name': '系统下载', 'params': ['id', 'type']},
}


def format_json(data, indent=2):
    """格式化 JSON 输出"""
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except:
            return data
    return json.dumps(data, indent=indent, ensure_ascii=False)


def analyze_entry(entry: dict, idx: int) -> dict:
    """分析单条 HAR 条目"""
    result = {
        'index': idx,
        'url': entry['url'],
        'method': entry['method'],
        'status': entry['status'],
        'path': entry['path'],
        'request_params': {},
        'request_inner': {},
        'response_encrypted': None,
        'response_decrypted': None,
        'response_crypt_second': None,
        'is_api': False,
        'matched_endpoint': None,
    }

    body = entry['request_body']
    resp = entry['response_body']

    # 解析请求
    if body and '_ver=v1' in body:
        result['is_api'] = True
        try:
            import urllib.parse
            params = urllib.parse.parse_qs(body)
            result['request_params'] = {k: v[0] if len(v) == 1 else v for k, v in params.items()}

            if params.get('data') and params['data'][0]:
                enc_data = params['data'][0]
                result['request_inner'] = decrypt_request_inner(enc_data)
        except Exception as e:
            result['request_error'] = str(e)

    # 解析响应
    if resp:
        try:
            resp_json = json.loads(resp)
            result['response_decrypted'] = resp_json

            if resp_json.get('data') and isinstance(resp_json['data'], str):
                result['response_encrypted'] = resp_json['data'][:50] + '...'
                try:
                    dec = aes_decrypt(resp_json['data'])
                    dec_json = json.loads(dec)
                    result['response_decrypted'] = dec_json

                    # 检查是否需要二次解密
                    if isinstance(dec_json, dict) and dec_json.get('crypt') and isinstance(dec_json.get('data'), str):
                        try:
                            second = aes256_cfb_decrypt(dec_json['data'], API_PASSPHRASE)
                            result['response_crypt_second'] = json.loads(second)
                        except Exception as e:
                            result['response_crypt_second_error'] = str(e)
                except Exception as e:
                    result['response_decrypt_error'] = str(e)
        except json.JSONDecodeError:
            pass

    # 匹配已知端点
    for endpoint, info in KNOWN_ENDPOINTS.items():
        if endpoint in entry['path']:
            result['matched_endpoint'] = endpoint
            break

    return result


def main():
    if len(sys.argv) < 2:
        print("用法: python3 decrypt_har.py <har文件或目录>")
        sys.exit(1)

    path = sys.argv[1]
    har_files = []
    if os.path.isfile(path):
        har_files = [path]
    elif os.path.isdir(path):
        har_files = [os.path.join(path, f) for f in os.listdir(path) if f.endswith('.har')]

    if not har_files:
        print(f"未找到 .har 文件: {path}")
        sys.exit(1)

    all_api_entries = []
    all_request_params = []
    new_endpoints = []
    mismatched_endpoints = []

    for har_file in har_files:
        print(f"\n{'='*60}")
        print(f"正在分析: {har_file}")
        print(f"{'='*60}")

        entries = parse_har(har_file)
        print(f"共 {len(entries)} 条请求\n")

        for i, entry in enumerate(entries):
            analysis = analyze_entry(entry, i)

            if analysis['is_api']:
                all_api_entries.append(analysis)

                print(f"\n--- [{i}] {analysis['matched_endpoint'] or '未知接口'} ---")
                print(f"  URL: {analysis['path']}")
                print(f"  加密请求参数: {json.dumps(analysis['request_params'], indent=2, ensure_ascii=False)}")
                print(f"  解密后参数: {json.dumps(analysis['request_inner'], indent=2, ensure_ascii=False)}")

                if analysis['response_decrypted']:
                    print(f"  解密响应:")
                    print(f"    {json.dumps(analysis['response_decrypted'], indent=2, ensure_ascii=False)}")

                if analysis['response_crypt_second']:
                    print(f"  二次解密结果: {json.dumps(analysis['response_crypt_second'], indent=2, ensure_ascii=False)[:200]}")

                # 收集请求参数
                if analysis['request_inner']:
                    req_params = set(analysis['request_inner'].keys())
                    all_request_params.append({
                        'path': analysis['path'],
                        'endpoint': analysis['matched_endpoint'],
                        'params': req_params,
                    })

                # 检查新接口
                if not analysis['matched_endpoint']:
                    new_endpoints.append(analysis)

    # 对比分析
    print(f"\n\n{'='*60}")
    print("API 对比分析报告")
    print(f"{'='*60}")

    print(f"\n📊 总请求数: {sum(len(parse_har(f)) for f in har_files)}")
    print(f"📊 API 请求数: {len(all_api_entries)}")
    print(f"📊 已知端点匹配数: {sum(1 for a in all_api_entries if a['matched_endpoint'])}")

    # 新发现的接口
    if new_endpoints:
        print(f"\n❓ 新发现的接口（文档中未记录）:")
        for ne in new_endpoints:
            print(f"  - {ne['path']}")
            if ne['request_inner']:
                print(f"    参数: {json.dumps(ne['request_inner'], indent=4, ensure_ascii=False)}")

    # 参数对比
    print(f"\n🔍 请求参数对比（抓包 vs 文档）:")

    captured = {a['path']: a for a in all_api_entries if a['request_inner']}
    for endpoint, info in sorted(KNOWN_ENDPOINTS.items()):
        actual_params = set(info['params'])
        for a in all_api_entries:
            if a['matched_endpoint'] == endpoint and a['request_inner']:
                # 公共参数过滤
                COMMON_PARAMS = {'oauth_type', 'oauth_id', 'version', 'build_affcode', 'theme', 'device_brand', 'device_model', 'aff_x_code', 'token', 'bundle_id'}
                captured_params = set(k for k in a['request_inner'].keys() if k not in COMMON_PARAMS)

                missing = actual_params - captured_params
                extra = captured_params - actual_params

                if missing or extra:
                    mismatched_endpoints.append({
                        'endpoint': endpoint,
                        'name': info['name'],
                        'documented_params': actual_params,
                        'captured_params': captured_params,
                        'missing': missing,
                        'extra': extra,
                    })

                    print(f"\n  📌 {endpoint} ({info['name']})")
                    if missing:
                        print(f"    文档有但抓包无: {missing}")
                    if extra:
                        print(f"    抓包有但文档无: {extra}")

    if not mismatched_endpoints:
        print("  ✅ 所有接口参数一致！")

    # 输出总结
    print(f"\n{'='*60}")
    print("✅ 分析完成")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
