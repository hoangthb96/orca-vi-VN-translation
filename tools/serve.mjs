#!/usr/bin/env node
// Workbench dịch thuật — kiểu Crowdin-mini, zero dependency.
// Chạy: node tools/serve.mjs  →  http://localhost:4173
// Đọc reference/en.json + locales/vi.json; ghi lại vi.json khi Save.
// Ô trống = xóa key (fallback EN theo rule AGENTS.md).
import http from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const EN = 'reference/en.json'
const VI = 'locales/vi.json'
const flat = (o, p = '', m = {}) => {
  for (const k of Object.keys(o)) {
    const v = o[k], q = p ? `${p}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, q, m)
    else m[q] = v
  }
  return m
}
const group = k =>
  k.startsWith('auto.')
    ? `auto/${k.split('.')[1] || ''}/${k.split('.')[2] || ''}`
    : k.startsWith('components.')
      ? `components/${k.split('.')[1] || ''}`
      : k.split('.')[0]

function data() {
  const en = flat(JSON.parse(readFileSync(EN, 'utf8')))
  const vi = flat(JSON.parse(readFileSync(VI, 'utf8')))
  const groups = {}
  for (const [k, v] of Object.entries(en)) {
    const g = group(k)
    ;(groups[g] ??= { total: 0, done: 0 }).total++
    if (vi[k] !== undefined) groups[g].done++
  }
  return { en, vi, groups }
}

function save(body) {
  const changes = JSON.parse(body) // { key: 'value' | '' } — '' = xóa
  const vi = JSON.parse(readFileSync(VI, 'utf8'))
  for (const [q, val] of Object.entries(changes)) {
    const parts = q.split('.')
    let node = vi
    for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]] ??= {}
    if (val === '') delete node[parts.at(-1)]
    else node[parts.at(-1)] = val
  }
  // prune empty objects
  const prune = o => { for (const k of Object.keys(o)) { if (o[k] && typeof o[k] === 'object') { prune(o[k]); if (!Object.keys(o[k]).length) delete o[k] } } }
  prune(vi)
  writeFileSync(VI, JSON.stringify(vi, null, 2) + '\n')
  let check = ''
  try { check = execSync('node tools/check-catalog.mjs', { encoding: 'utf8' }) } catch (e) { check = String(e.stdout || e.message) }
  return check
}

const PAGE = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Orca vi workbench</title>
<style>
:root{--bg:#16161a;--panel:#1e1e24;--fg:#e6e6ea;--dim:#9a9aa4;--acc:#4f8dff;--ok:#3fb96b;--warn:#e8a13c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif;display:flex;height:100vh}
#side{width:280px;min-width:280px;background:var(--panel);overflow-y:auto;padding:12px;border-right:1px solid #2a2a32}
#side h2{font-size:12px;color:var(--dim);text-transform:uppercase;margin:4px 0 10px}
.gitem{padding:6px 8px;border-radius:6px;cursor:pointer;margin-bottom:4px}
.gitem:hover{background:#26262e}.gitem.sel{background:#2b3a55}
.gname{font-size:13px;word-break:break-all}.bar{height:4px;background:#333;border-radius:2px;margin-top:4px}.bar>i{display:block;height:100%;background:var(--ok);border-radius:2px}
.gnum{font-size:11px;color:var(--dim)}
#main{flex:1;display:flex;flex-direction:column;overflow:hidden}
#top{padding:10px 16px;border-bottom:1px solid #2a2a32;display:flex;gap:10px;align-items:center;background:var(--panel)}
#top input[type=search]{background:#121216;border:1px solid #333;color:var(--fg);padding:6px 10px;border-radius:6px;width:260px}
#top select{background:#121216;border:1px solid #333;color:var(--fg);padding:6px;border-radius:6px}
button{background:var(--acc);color:#fff;border:0;padding:7px 14px;border-radius:6px;cursor:pointer;font-weight:600}
button.sec{background:#333}
#list{flex:1;overflow-y:auto;padding:10px 16px}
.row{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.1fr);gap:10px;padding:8px;border-bottom:1px solid #232329}
.row .k{font:11px ui-monospace,monospace;color:var(--dim);word-break:break-all}
.row .en{color:var(--fg);margin-top:2px;white-space:pre-wrap}
.row textarea{width:100%;background:#121216;border:1px solid #333;color:var(--fg);padding:6px;border-radius:6px;font:inherit;min-height:52px;resize:vertical}
.row textarea.dirty{border-color:var(--warn)}
#status{padding:6px 16px;font-size:12px;color:var(--dim);border-top:1px solid #2a2a32;white-space:pre-wrap}
.miss{color:var(--warn)}
</style></head><body>
<div id="side"><h2>Nhóm key</h2><div id="groups"></div></div>
<div id="main">
<div id="top">
<input type="search" id="q" placeholder="Lọc key / nội dung…">
<select id="f"><option value="missing">Chưa dịch</option><option value="all">Tất cả</option><option value="done">Đã dịch</option><option value="dirty">Đã sửa (chưa lưu)</option></select>
<button id="save">Lưu</button>
<button class="sec" id="reload">Tải lại</button>
<span id="prog"></span>
</div>
<div id="list"></div>
<div id="status">Sẵn sàng. Ô trống = xóa key (fallback EN).</div>
</div>
<script>
let EN={},VI={},GROUPS={},cur=null,dirty={};
const $=s=>document.querySelector(s);
async function load(){
 const d=await(await fetch('/api/data')).json();EN=d.en;VI=d.vi;GROUPS=d.groups;
 const order=Object.keys(GROUPS).sort((a,b)=>(GROUPS[a].done/GROUPS[a].total)-(GROUPS[b].done/GROUPS[b].total));
 $('#groups').innerHTML=order.map(g=>{const t=GROUPS[g],p=Math.round(100*t.done/t.total);
  return '<div class="gitem" data-g="'+g+'"><div class="gname">'+g+'</div><div class="gnum">'+t.done+'/'+t.total+' · '+p+'%</div><div class="bar"><i style="width:'+p+'%"></i></div></div>'}).join('');
 document.querySelectorAll('.gitem').forEach(el=>el.onclick=()=>{cur=el.dataset.g;render();document.querySelectorAll('.gitem').forEach(x=>x.classList.toggle('sel',x===el))});
 $('#prog').textContent='Tổng: '+Object.keys(VI).length+'/'+Object.keys(EN).length;
 render();
}
function rows(){
 const q=$('#q').value.toLowerCase(),f=$('#f').value;
 return Object.keys(EN).filter(k=>{
  if(cur&&!k.startsWith(cur.replaceAll('/','.')))return false;
  const has=VI[k]!==undefined||dirty[k]!==undefined&&dirty[k]!=='';
  if(f==='missing'&&has)return false;
  if(f==='done'&&!has)return false;
  if(f==='dirty'&&dirty[k]===undefined)return false;
  if(q&&!(k.toLowerCase().includes(q)||String(EN[k]).toLowerCase().includes(q)||String(VI[k]||'').toLowerCase().includes(q)))return false;
  return true;
 }).slice(0,400);
}
function render(){
 const rs=rows();
 $('#list').innerHTML=rs.map(k=>{const cur2=dirty[k]!==undefined?dirty[k]:(VI[k]??'');
  return '<div class="row"><div><div class="k">'+k+'</div><div class="en">'+esc(EN[k])+'</div></div><div><textarea data-k="'+k+'"'+(dirty[k]!==undefined?' class="dirty"':'')+'>'+esc(cur2)+'</textarea></div></div>'}).join('')||'<div style="padding:20px;color:var(--dim)">Không có key nào khớp.</div>';
 document.querySelectorAll('textarea').forEach(t=>t.oninput=()=>{dirty[t.dataset.k]=t.value;t.classList.add('dirty');});
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
$('#q').oninput=render;$('#f').onchange=render;$('#reload').onclick=()=>{dirty={};load()};
$('#save').onclick=async()=>{
 if(!Object.keys(dirty).length){$('#status').textContent='Không có thay đổi.';return}
 const r=await(await fetch('/api/save',{method:'POST',body:JSON.stringify(dirty)})).text();
 $('#status').textContent='Đã lưu '+Object.keys(dirty).length+' key.\\n'+r;
 dirty={};load();
};
load();
</script></body></html>`

http.createServer((req, res) => {
  if (req.url === '/api/data' && req.method === 'GET') {
    res.end(JSON.stringify(data()))
  } else if (req.url === '/api/save' && req.method === 'POST') {
    let b = ''
    req.on('data', c => (b += c))
    req.on('end', () => res.end(save(b)))
  } else {
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(PAGE)
  }
}).listen(4173, () => console.log('Workbench: http://localhost:4173'))
