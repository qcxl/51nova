/**
 * Device ID 管理
 * - 生成 32 位 hex device_id
 * - 持久化到 localStorage
 * - 恢复码生成/解析
 */

const DEVICE_KEY = '51nova_device_id'

/** 生成随机 device_id (32位 hex) */
function generateDeviceId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** 获取当前 device_id */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id || id.length !== 32) {
    id = generateDeviceId()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

/** 恢复码 = Base64(device_id) + 2 字符校验和 */
export function generateRecoveryCode(deviceId: string): string {
  const encoded = btoa(deviceId)
  let checksum = 0
  for (let i = 0; i < deviceId.length; i++) checksum ^= deviceId.charCodeAt(i)
  const chk = checksum.toString(16).padStart(2, '0').substring(0, 2)
  return encoded + chk
}

/** 从恢复码解析 device_id */
export function parseRecoveryCode(code: string): string | null {
  if (code.length < 24) return null
  const encoded = code.substring(0, code.length - 2)
  try {
    const decoded = atob(encoded)
    if (decoded.length !== 32) return null
    let checksum = 0
    for (let i = 0; i < decoded.length; i++) checksum ^= decoded.charCodeAt(i)
    const chk = checksum.toString(16).padStart(2, '0').substring(0, 2)
    if (code.endsWith(chk)) return decoded
    return null
  } catch {
    return null
  }
}

/** 使用恢复码恢复设备 */
export function restoreFromCode(code: string): boolean {
  const deviceId = parseRecoveryCode(code)
  if (deviceId) {
    localStorage.setItem(DEVICE_KEY, deviceId)
    return true
  }
  return false
}

/** 清空设备 ID（慎用） */
export function clearDeviceId(): void {
  localStorage.removeItem(DEVICE_KEY)
}
