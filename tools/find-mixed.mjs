import { readFileSync } from 'node:fs'
const en = JSON.parse(readFileSync('reference/en.json', 'utf8'))
const vi = JSON.parse(readFileSync('locales/vi.json', 'utf8'))
const flat = (o, p = '', m = {}) => { for (const k of Object.keys(o)) { const v = o[k], q = p ? p + '.' + k : k; (v && typeof v === 'object') ? flat(v, q, m) : m[q] = v } return m }
const V = flat(vi), E = flat(en)

// EN danh từ kỹ thuật — từ không dấu, không kèm từ VI
const ENW = '(runtime|workspace|worktree|terminal|agent|repo|branch|shell|profile|target|view|tab|pane|dialog|filter|group|theme|mode|state|scope|field|source|task|issue|artifact|automation|command|preset|snapshot|backup|template|layout|card|board|file|folder|link|icon|token|code|path|title|label|status|type|level|role|account|client|instance|node|distro|container|port|endpoint|config|section|panel|page|list|item|entry|row|column|table|chart|metric|schedule|job|build|version|note|comment|message|notification|event|log|policy|rule|permission|credential|session|connection|stream|cache|store|index|search|query|result|cursor|shortcut|binding|action|step|stage|workflow|pipeline|skill|tool|hook|trigger|handler|monitor|check|scan|review|report|summary|preview|history|timeline|feed|activity|export|import|retry|debug|format|render|grid|frame|screen|lock|key|site|zone|route|provider|token|server|host)'
const VN = '(dự án|công việc)'
const re1 = new RegExp('\\b' + ENW + '\\s+' + VN + '\\b', 'gi')
const re2 = new RegExp('\\b' + VN + '\\s+' + ENW + '\\b', 'gi')
// cũng flag: EN word + từ VI có dấu liền kề (vd "Runtime mặc định", "server đã", "tạo workspace mới" — quá rộng, chỉ lấy cụm 2 từ EN-VN không có liên từ)
const hits = []
for (const k of Object.keys(V)) {
  const m1 = [...String(V[k]).matchAll(re1)].map(m => m[0])
  const m2 = [...String(V[k]).matchAll(re2)].map(m => m[0])
  if (m1.length || m2.length) hits.push({ k, m: [...new Set([...m1, ...m2])] })
}
console.log('keys:', hits.length)
hits.forEach(h => console.log(h.k + '\n   EN| ' + E[h.k] + '\n   VI| ' + V[h.k] + '\n   >> ' + h.m.join(' · ')))
