// Merge một stage file vào locales/vi.json — deep-merge, log từng bước.
// Dùng: node tools/merge-stage.mjs <stage.json> [--dry]
// Stage phải pass `check-catalog.mjs --stage` trước (tool này không tự validate,
// chỉ merge và đếm). Không ghi đè key đã có trừ khi value giống hệt (report khác nhau).
import { readFileSync, writeFileSync } from 'node:fs'

const [,, stagePath, ...flags] = process.argv
if (!stagePath) { console.error('usage: node tools/merge-stage.mjs <stage.json> [--dry]'); process.exit(2) }
const dry = flags.includes('--dry')

const load = p => { try { return JSON.parse(readFileSync(p, 'utf8')) } catch (e) { console.error(`parse fail ${p}: ${e.message}`); process.exit(1) } }
const vi = load('locales/vi.json')
const st = load(stagePath)

let added = 0, same = 0
const conflicts = []
const merge = (dst, src, path) => {
  for (const k of Object.keys(src)) {
    const v = src[k], q = path ? `${path}.${k}` : k
    if (v && typeof v === 'object') {
      if (!(k in dst)) dst[k] = {}
      else if (typeof dst[k] !== 'object' || dst[k] === null) { conflicts.push(`${q}: vi leaf vs stage object`); continue }
      merge(dst[k], v, q)
    } else {
      if (!(k in dst)) { dst[k] = v; added++ }
      else if (dst[k] === v) same++
      else conflicts.push(`${q}: vi="${dst[k]}" vs stage="${v}"`)
    }
  }
}
merge(vi, st, '')

console.log(`added: ${added} | identical-existing: ${same} | conflicts: ${conflicts.length}`)
conflicts.slice(0, 50).forEach(c => console.log('  CONFLICT', c))
if (conflicts.length) { console.error('abort: có conflict — resolve tay trước'); process.exit(1) }
if (!dry) {
  writeFileSync('locales/vi.json', JSON.stringify(vi, null, 2) + '\n')
  console.log('merged → locales/vi.json')
} else console.log('(dry run — không ghi)')
