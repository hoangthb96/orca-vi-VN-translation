#!/usr/bin/env node
// Resync reference/en.json với upstream stablyai/orca + ghi docs/en-sync-changelog.md.
// Chạy:
//   node tools/resync-en.mjs              — lấy tag release mới nhất (v*)
//   node tools/resync-en.mjs --ref main   — hoặc ref/commit/tag bất kỳ
//   node tools/resync-en.mjs --dry        — chỉ so, không ghi file
//   node tools/resync-en.mjs --prune      — đồng thời xóa khỏi vi.json các key EN đã bị upstream xóa
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const REPO = 'stablyai/orca'
const EN_PATH = 'src/renderer/src/i18n/locales/en.json'
const EN_FILE = 'reference/en.json'
const VI_FILE = 'locales/vi.json'
const LOG_FILE = 'docs/en-sync-changelog.md'

const args = process.argv.slice(2)
const argOf = (name) => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : null }
const DRY = args.includes('--dry')
const PRUNE = args.includes('--prune')

const flat = (o, p = '', m = {}) => {
  for (const k of Object.keys(o)) {
    const v = o[k]
    const q = p ? `${p}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, q, m)
    else m[q] = v
  }
  return m
}
const unflat = (m) => {
  const root = {}
  for (const [k, v] of Object.entries(m)) {
    let node = root
    const parts = k.split('.')
    for (const s of parts.slice(0, -1)) node = node[s] ??= {}
    node[parts.at(-1)] = v
  }
  return root
}
const ph = s => (String(s).match(/\{\{[^}]+\}\}|\{[a-zA-Z][a-zA-Z0-9]*\}|<\/?[a-zA-Z][a-zA-Z0-9]*\/?>/g) || []).sort().join()
const ns1 = k => k.split('.')[0]
const ns2 = k => k.split('.').slice(0, 2).join('.')

// ---------- ref ----------
let ref = argOf('--ref')
if (!ref) {
  const tags = await fetch(`https://api.github.com/repos/${REPO}/tags?per_page=20`).then(r => r.json())
  const tag = Array.isArray(tags) && tags.find(t => /^v\d+\.\d+\.\d+$/.test(t.name))
  if (!tag) { console.error('Không tìm được tag release — truyền tay bằng --ref'); process.exit(2) }
  ref = tag.name
}
console.log(`ref: ${ref}`)

// ---------- fetch en mới ----------
const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${ref}/${EN_PATH}`)
if (!res.ok) { console.error(`fetch en.json @ ${ref}: HTTP ${res.status}`); process.exit(2) }
const rawText = await res.text()
let enNew
try { enNew = JSON.parse(rawText) } catch (e) { console.error(`en.json @ ${ref} không phải JSON: ${e.message}`); process.exit(2) }

const enOld = JSON.parse(readFileSync(EN_FILE, 'utf8'))
const V = flat(JSON.parse(readFileSync(VI_FILE, 'utf8')))
const O = flat(enOld), N = flat(enNew)

const added = Object.keys(N).filter(k => !(k in O))
const removed = Object.keys(O).filter(k => !(k in N))
const changed = Object.keys(N).filter(k => k in O && N[k] !== O[k])
const staleVi = removed.filter(k => k in V)
const newMissing = added
const phBad = changed.filter(k => k in V && ph(N[k]) !== ph(V[k]))

console.log(`en cũ: ${Object.keys(O).length} keys | en mới (${ref}): ${Object.keys(N).length} keys`)
console.log(`+${added.length} thêm | -${removed.length} xóa | ~${changed.length} đổi`)
console.log(`vi.json: ${staleVi.length} key trỏ vào EN đã xóa (dead) | ${newMissing.length} key mới chưa dịch | ${phBad.length} key đổi placeholder`)

if (added.length === 0 && removed.length === 0 && changed.length === 0) {
  console.log('Không có thay đổi — không ghi gì.')
  process.exit(0)
}
if (DRY) { console.log('--dry: dừng trước khi ghi.'); process.exit(0) }

// ---------- ghi reference ----------
writeFileSync(EN_FILE, rawText)

// ---------- prune vi.json ----------
let prunedNote = ''
if (PRUNE && staleVi.length > 0) {
  const kept = Object.fromEntries(Object.entries(V).filter(([k]) => k in N))
  writeFileSync(VI_FILE, JSON.stringify(unflat(kept), null, 2) + '\n')
  prunedNote = `Đã --prune ${staleVi.length} dead key khỏi vi.json.`
  console.log(prunedNote)
}

// ---------- changelog ----------
const date = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD giờ local
const groupBy = (keys, fn) => keys.reduce((m, k) => ((m[fn(k)] ??= []).push(k), m), {})
const keyList = (keys, render) => keys.map(render).join('\n')

let entry = `\n## ${date} — ${ref}\n\n`
entry += `Snapshot ${Object.keys(O).length} → ${Object.keys(N).length} keys (**+${added.length}** / **−${removed.length}** / **~${changed.length}**).`
entry += `\nvi.json lúc sync: ${staleVi.length} dead key${PRUNE ? ' (đã prune)' : ''}, ${newMissing.length} key mới chưa dịch, ${phBad.length} key lệch placeholder do upstream đổi.\n`

if (added.length) {
  const byNs = groupBy(added, ns2)
  entry += `\n### +${added.length} key mới (cần dịch)\n\n`
  entry += '| Nhóm | Số |\n|---|---:|\n'
  for (const [ns, ks] of Object.entries(byNs).sort((a, b) => b[1].length - a[1].length)) entry += `| \`${ns}\` | ${ks.length} |\n`
  entry += `\n<details><summary>Danh sách đầy đủ</summary>\n\n`
  entry += keyList(added, k => `- \`${k}\` — ${N[k].replace(/\n/g, ' ')}`) + '\n</details>\n'
}
if (removed.length) {
  entry += `\n### −${removed.length} key upstream xóa\n\n<details><summary>Danh sách${staleVi.length ? ` (${staleVi.length} key có bản dịch vi → dead)` : ''}</summary>\n\n`
  entry += keyList(removed, k => `- \`${k}\`${k in V ? ` — VI: "${V[k]}"` : ''}`) + '\n</details>\n'
}
if (changed.length) {
  entry += `\n### ~${changed.length} key upstream đổi value (bản dịch có thể đã cũ)\n\n<details><summary>Danh sách</summary>\n\n`
  entry += keyList(changed, k => `- \`${k}\`\n  - cũ: ${O[k].replace(/\n/g, ' ')}\n  - mới: ${N[k].replace(/\n/g, ' ')}${k in V ? `\n  - VI: ${V[k].replace(/\n/g, ' ')}` : ''}`) + '\n</details>\n'
}

const header = `# en.json upstream sync log\n\nLog tự động của \`tools/resync-en.mjs\` — mỗi lần đồng bộ \`reference/en.json\` với upstream.\n`
let content
if (existsSync(LOG_FILE)) {
  const old = readFileSync(LOG_FILE, 'utf8')
  const idx = old.indexOf('\n## ')
  content = idx > -1 ? old.slice(0, idx) + entry + old.slice(idx) : old.trimEnd() + '\n' + entry
} else {
  content = header + entry
}
writeFileSync(LOG_FILE, content)

console.log(`Đã ghi ${EN_FILE} @ ${ref} + entry vào ${LOG_FILE}`)
console.log('Chạy lại: node tools/check-catalog.mjs')
