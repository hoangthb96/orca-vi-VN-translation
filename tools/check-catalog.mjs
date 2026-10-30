#!/usr/bin/env node
// Validator — so locales/vi.json (hoặc file stage) với reference/en.json.
// Chạy:
//   node tools/check-catalog.mjs                  — kiểm catalog chính
//   node tools/check-catalog.mjs --missing        — thêm thống kê key thiếu theo namespace
//   node tools/check-catalog.mjs --full           — in TOÀN BỘ key lỗi (mặc định giới hạn 50)
//   node tools/check-catalog.mjs --stage <file>   — kiểm file stage trước khi merge
//       (tự đoán prefix: thử mọi cách map key vào en.json, báo cách nào khớp)
//
// Mọi lỗi đều in KÈM key + value EN/VI để biết chính xác hỏng ở đâu.
import { readFileSync, existsSync } from 'node:fs'

const LIMIT = process.argv.includes('--full') ? Infinity : 50
const stageIdx = process.argv.indexOf('--stage')
const STAGE = stageIdx > -1 ? process.argv[stageIdx + 1] : null

const flat = (o, p = '', m = {}) => {
  for (const k of Object.keys(o)) {
    const v = o[k]
    const q = p ? `${p}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, q, m)
    else m[q] = v
  }
  return m
}

// ---------- file load với lỗi rõ ràng ----------
function loadJson(path) {
  if (!existsSync(path)) return { err: `file không tồn tại: ${path}` }
  const buf = readFileSync(path)
  const bom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf
  let data
  try {
    data = JSON.parse(buf.toString('utf8'))
  } catch (e) {
    // JSON.parse báo vị trí ký tự → trích dòng/cột + snippet
    const posMatch = String(e.message).match(/position (\d+)/)
    let where = ''
    if (posMatch) {
      const pos = +posMatch[1]
      const text = buf.toString('utf8')
      const line = text.slice(0, pos).split('\n').length
      const col = pos - text.lastIndexOf('\n', pos - 1)
      const snippet = text.slice(Math.max(0, pos - 60), pos + 60).replace(/\n/g, '⏎')
      where = ` (dòng ${line}, cột ${col}) …${snippet}…`
    }
    return { err: `JSON hỏng${where}: ${e.message}`, bom }
  }
  return { data, bom }
}

const en = loadJson('reference/en.json')
if (en.err) { console.error('FATAL en.json —', en.err); process.exit(2) }
const EA = flat(en.data)

const vi = loadJson('locales/vi.json')
if (vi.err) { console.error('FATAL vi.json —', vi.err); process.exit(2) }
const V = flat(vi.data)

// ---------- cấu trúc file: BOM, leaf không phải chuỗi, value rỗng ----------
const structErr = []
if (vi.bom) structErr.push('vi.json có BOM UTF-8 — Orca/i18next có thể đọc sai, nên lưu không BOM')
for (const [k, v] of Object.entries(V)) {
  if (typeof v !== 'string') structErr.push(`${k}: leaf không phải chuỗi (${typeof v})`)
  else if (v === '') structErr.push(`${k}: value rỗng — nên XÓA key để fallback EN`)
}

// ---------- ORCA VALIDATOR (port nguyên văn từ Orca: shared/plugins/plugin-language-pack-artifact) ----------
// Orca fail-closed: MỘT vi phạm → checkPluginLanguagePackCatalog trả ok:false → toàn pack bị reject,
// lỗi chỉ hiện trong plugin activation error: `language pack "vi" <error>`.
// Giữ nguyên wording lỗi của Orca để log ở đây khớp với log trong app.
const ORCA_MAX_ENTRIES = 20_000
const ORCA_MAX_DEPTH = 16
const ORCA_DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const ORCA_PROTECTED_ROOT = 'auto.components.settings.'
const ORCA_PROTECTED_MODULE = /^plugin/i
// Chrome exemption — copy nguyên từ plugin-translatable-chrome.ts (Orca chỉ cho dịch các path này
// trong vùng protected; mọi path plugin* khác là security copy, cấm override).
const ORCA_EXEMPT_CHROME = new Set([
  'auto.components.settings.PluginsSettingsSection.title', 'auto.components.settings.PluginsSettingsSection.systemLabel',
  'auto.components.settings.PluginsSettingsSection.install', 'auto.components.settings.PluginsSettingsSection.loading',
  'auto.components.settings.PluginsSettingsSection.empty', 'auto.components.settings.PluginsSettingsSection.emptyTitle',
  'auto.components.settings.PluginsSettingsSection.noInstalledResults', 'auto.components.settings.PluginsSettingsSection.noInstalledResultsTitle',
  'auto.components.settings.PluginMarketplaceBrowser.manageSources', 'auto.components.settings.PluginMarketplaceBrowser.addSource',
  'auto.components.settings.PluginMarketplaceBrowser.refresh', 'auto.components.settings.PluginMarketplaceBrowser.refreshing',
  'auto.components.settings.PluginMarketplaceBrowser.loading', 'auto.components.settings.PluginMarketplaceBrowser.tryAgain',
  'auto.components.settings.PluginMarketplaceBrowser.clearSearch', 'auto.components.settings.PluginMarketplaceBrowser.empty',
  'auto.components.settings.PluginMarketplaceBrowser.emptyTitle', 'auto.components.settings.PluginMarketplaceBrowser.noInstalled',
  'auto.components.settings.PluginMarketplaceBrowser.noInstalledTitle', 'auto.components.settings.PluginMarketplaceBrowser.noResults',
  'auto.components.settings.PluginMarketplaceBrowser.noResultsTitle', 'auto.components.settings.PluginMarketplaceBrowser.noSourcesTitle',
  'auto.components.settings.PluginDevelopmentSection.title', 'auto.components.settings.PluginDevelopmentSection.add',
  'auto.components.settings.PluginDevelopmentSection.remove', 'auto.components.settings.PluginDevelopmentSection.pathLabel',
  'auto.components.settings.PluginDevelopmentSection.pathRequired', 'auto.components.settings.PluginDevelopmentSection.placeholder',
  'auto.components.settings.plugins.search.title', 'auto.components.settings.plugins.search.description',
  'auto.components.settings.plugins.search.install', 'auto.components.settings.plugins.search.permissions',
  'auto.components.settings.plugins.search.logs', 'auto.components.settings.plugins.search.development',
])
const orcaIsCatalogObject = v =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype
const orcaChromeContainer = path => {
  const pre = `${path}.`
  for (const e of ORCA_EXEMPT_CHROME) if (e.startsWith(pre)) return true
  return false
}
const orcaProtected = path =>
  path.startsWith(ORCA_PROTECTED_ROOT) &&
  !ORCA_EXEMPT_CHROME.has(path) &&
  ORCA_PROTECTED_MODULE.test(path.slice(ORCA_PROTECTED_ROOT.length))

// Trả về lỗi đầu tiên y hệt Orca (walker dừng tại vi phạm đầu tiên), hoặc null.
function orcaValidateCatalog(source) {
  if (!orcaIsCatalogObject(source)) return 'language pack root must be an object'
  const stack = [{ source, path: '', depth: 0 }]
  const seen = new WeakSet([source])
  let entries = 0
  while (stack.length > 0) {
    const frame = stack.pop()
    if (frame.depth > ORCA_MAX_DEPTH) return `catalog exceeds depth ${ORCA_MAX_DEPTH}`
    for (const key of Object.keys(frame.source)) {
      const value = frame.source[key]
      entries += 1
      if (entries > ORCA_MAX_ENTRIES) return `catalog exceeds ${ORCA_MAX_ENTRIES} entries`
      if (
        key.length === 0 || key.length > 128 || ORCA_DANGEROUS_KEYS.has(key) ||
        key.includes('.') || [...key].some(c => c.charCodeAt(0) <= 31)
      ) return `catalog key ${key || '(empty)'} is not safe`
      const path = frame.path ? `${frame.path}.${key}` : key
      if (orcaProtected(path) && !(orcaIsCatalogObject(value) && orcaChromeContainer(path)))
        return `catalog cannot replace protected security copy at ${path}`
      if (typeof value === 'string') {
        if (value.length > 8192) return `translation at ${path} exceeds 8192 characters`
        continue
      }
      if (!orcaIsCatalogObject(value)) return `translation at ${path} must be a string or object`
      if (seen.has(value)) return `catalog contains a repeated or cyclic object at ${path}`
      seen.add(value)
      stack.push({ source: value, path, depth: frame.depth + 1 })
    }
  }
  return null
}

const orcaErr = orcaValidateCatalog(vi.data)
if (orcaErr) structErr.push(`ORCA RULE — language pack "vi" ${orcaErr}  (Orca sẽ reject TOÀN BỘ pack, không fallback từng phần)`)

// manifest
const man = loadJson('orca-plugin.json')
if (man.err) structErr.push(`orca-plugin.json — ${man.err}`)
else {
  const lp = man.data?.contributes?.languagePacks?.[0]
  if (!lp) structErr.push('orca-plugin.json: thiếu contributes.languagePacks[0]')
  else {
    if (lp.locale !== 'vi') structErr.push(`orca-plugin.json: locale là "${lp.locale}", phải là "vi"`)
    if (!lp.path || !existsSync(lp.path)) structErr.push(`orca-plugin.json: path "${lp.path}" không tồn tại`)
  }
}

// ---------- stage mode: tự đoán prefix ----------
// Với mỗi key stage, thử: (a) key nguyên vẹn có trong en không, (b) auto.components.<key>,
// (c) nhánh con đầu tiên của file là namespace (vd {settings:{...}} → settings.<rest>).
let stageInfo = null
let sFlat = null
let sResolve = k => k
if (STAGE) {
  const st = loadJson(STAGE)
  if (st.err) { console.error(`FATAL ${STAGE} —`, st.err); process.exit(2) }
  const raw = st.data
  sFlat = flat(raw)
  const candidates = []
  // resolver đơn: prefix cố định, hoặc key nguyên vẹn
  for (const [name, r] of [
    ['nguyên vẹn (path đầy đủ từ root en)', k => k],
    ['auto.components.<key>', k => `auto.components.${k}`],
    ['auto.components.settings.<key>', k => `auto.components.settings.${k}`],
    ['settings.<key>', k => `settings.${k}`],
    ['components.<key>', k => `components.${k}`],
  ]) candidates.push([Object.keys(sFlat).filter(k => r(k) in EA).length, name, r, sFlat])
  // resolver lai: top-level key của file là namespace thật trong en → giữ, còn lại → auto.components
  const hybrid = k => (k.split('.')[0] in en.data ? k : `auto.components.${k}`)
  candidates.push([Object.keys(sFlat).filter(k => hybrid(k) in EA).length, 'lai: top∈en→giữ, còn lại→auto.components', hybrid, sFlat])
  // shape _top: {_top:{ns:{...}}, <auto.components rel>:{...}} — merge thành key resolved luôn
  if (raw._top) {
    const { _top, ...rest } = raw
    const merged = { ...Object.fromEntries(Object.keys(flat(rest)).map(k => [`auto.components.${k}`, flat(rest)[k]])), ...flat(_top) }
    candidates.push([Object.keys(merged).filter(k => k in EA).length, '_top shape: _top→root en, còn lại→auto.components', k => k, merged])
  }
  candidates.sort((a, b) => b[0] - a[0])
  const [bestN, bestName, bestR, bestFlat] = candidates[0]
  sResolve = bestR
  sFlat = bestFlat
  stageInfo = `${STAGE}: ${Object.keys(sFlat).length} key — resolver khớp nhất: "${bestName}" (${bestN}/${Object.keys(sFlat).length} key trong en)`
  if (bestN < Object.keys(sFlat).length) {
    // báo resolver runner-up để người đọc thấy sự mơ hồ
    const alts = candidates.filter(c => c[0] > 0 && c[1] !== bestName).slice(0, 3)
    if (alts.length) stageInfo += `\n  resolver khác cũng khớp một phần: ${alts.map(a => `"${a[1]}" (${a[0]})`).join(', ')} — kiểm mẫu EXTRA bên dưới để chọn đúng`
  }
}

// ---------- so khớp ----------
const ph = s => (String(s).match(/\{\{[^}]+\}\}|\{[a-zA-Z][a-zA-Z0-9]*\}|<\/?[a-zA-Z][a-zA-Z0-9]*\/?>/g) || []).sort().join()
const phSet = s => new Set(ph(s).split(' ').filter(Boolean))

const S = STAGE ? sFlat : V
const resolve = STAGE ? sResolve : k => k
const sKeys = Object.keys(S)

const missing = STAGE ? [] : Object.keys(EA).filter(k => !(k in V))
const extra = sKeys.filter(k => !(resolve(k) in EA))
const dup = STAGE ? sKeys.filter(k => resolve(k) in V) : []
const badPh = sKeys.filter(k => resolve(k) in EA && ph(S[k]) !== ph(EA[resolve(k)]))
const sameAsEn = sKeys.filter(k => resolve(k) in EA && S[k] === EA[resolve(k)])
// slop: đảo tính từ sau danh từ ("host remote", "emulator mobile") — bài học AGENTS.md
const slop = sKeys.filter(k => {
  const v = String(S[k])
  if (!/\b(host|server|runtime|workspace|worktree|terminal|client|instance|target|emulator|tab|thiết bị|máy|app|mục|site|account|provider)\s+(remote|mobile)\b/i.test(v)) return false
  // ngoại lệ tên riêng giữ nguyên: "Mobile Emulator", "Orca Mobile" (product name, cố ý giữ EN)
  const stripped = v.replace(/Mobile Emulator|Orca Mobile/g, '')
  return /\b(host|server|runtime|workspace|worktree|terminal|client|instance|target|emulator|tab|thiết bị|máy|app|mục|site|account|provider)\s+(remote|mobile)\b/i.test(stripped)
})
// stage: key resolved rơi vào vùng protected của Orca → pack sẽ bị reject nếu merge
const orcaProt = STAGE ? sKeys.filter(k => orcaProtected(resolve(k))) : []

// ---------- in ----------
const show = (title, keys, render) => {
  console.log(`\n${title}: ${keys.length}${keys.length ? '  ← FAIL' : ''}`)
  keys.slice(0, LIMIT).forEach(k => console.log('  ', render(k)))
  if (keys.length > LIMIT) console.log(`   … +${keys.length - LIMIT} nữa (chạy --full để xem hết)`)
}

console.log(`en.json keys : ${Object.keys(EA).length}`)
console.log(`vi.json keys : ${Object.keys(V).length} (${((Object.keys(V).length / Object.keys(EA).length) * 100).toFixed(1)}%)`)
if (STAGE) console.log(stageInfo)
if (!STAGE) console.log(`missing      : ${missing.length}`)

if (structErr.length) show('Lỗi cấu trúc file (BOM/leaf/manifest)', structErr, e => e)

show('EXTRA — key không có trong en.json', extra, k => `${k}\n      VI| ${S[k]}`)
if (STAGE) show('DUP — key đã có trong vi.json', dup, k => `${k}\n      VI cũ| ${V[resolve(k)]}\n      stage | ${S[k]}`)
show('PLACEHOLDER lệch — bộ {{}}/{} / <tag> khác en', badPh, k =>
  `${k}\n      EN| ${EA[resolve(k)]}\n      VI| ${S[k]}\n      ph EN| ${[...phSet(EA[resolve(k)])].join(' ') || '(trống)'}\n      ph VI| ${[...phSet(S[k])].join(' ') || '(trống)'}`
)
show('IDENTICAL EN — value trùng English (nên xóa, không ghi đè)', sameAsEn, k => `${k}\n      | ${S[k]}`)
show('SLOP — đảo tính từ kiểu "host remote"/"emulator mobile"', slop, k => `${k}\n      | ${S[k]}`)
if (STAGE) show('ORCA PROTECTED — key resolved vào security copy (merge = reject cả pack)', orcaProt, k =>
  `${k} → ${resolve(k)}\n      | ${S[k]}`)

if (process.argv.includes('--missing') && !STAGE) {
  const perNs = {}
  for (const k of missing) perNs[k.split('.')[0]] = (perNs[k.split('.')[0]] || 0) + 1
  console.log('\nmissing per namespace:')
  for (const [ns, n] of Object.entries(perNs).sort((a, b) => b[1] - a[1])) console.log(`  ${ns}: ${n}`)
}

const fail = structErr.length || extra.length || dup.length || badPh.length || slop.length || orcaProt.length
console.log(fail ? '\n==> FAIL' : '\n==> OK')
process.exit(fail ? 1 : 0)
