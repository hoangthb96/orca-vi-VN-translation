#!/usr/bin/env node
// Dump danh sách key trong en.json mà vi.json CỐ Ý không dịch, gom theo nhóm quyết định.
// Chạy: node tools/dump-untranslated.mjs          — ghi docs/untranslated-keys.generated.md
//       node tools/dump-untranslated.mjs --check  — chỉ in thống kê, không ghi file
// Nhóm nào key nào nằm trong docs/no-translate.md (ADR). Key không rơi vào nhóm nào
// xuất hiện ở mục "CHƯA PHÂN LOẠI" — cần con người quyết, sau đó bổ sung matcher vào đây.
import { readFileSync, writeFileSync } from 'node:fs'

const CHECK = process.argv.includes('--check')
const OUT = 'docs/untranslated-keys.generated.md'

const flat = (o, p = '', m = {}) => {
  for (const k of Object.keys(o)) {
    const v = o[k]
    const q = p ? `${p}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, q, m)
    else m[q] = v
  }
  return m
}
const E = flat(JSON.parse(readFileSync('reference/en.json', 'utf8')))
const V = flat(JSON.parse(readFileSync('locales/vi.json', 'utf8')))
const missing = Object.keys(E).filter(k => !(k in V))

// ---------- matchers (thứ tự ưu tiên — khớp nhóm đầu tiên thắng) ----------
const STATUS = new Set(['open','closed','merged','draft','failed','pending','queued','skipped','neutral','cancelled','ready','running','error','success','passed','active','inactive','enabled','disabled','busy','idle','connected','disconnected','offline','online','paused','stopped','starting','stopping','complete','incomplete','blocked','unblocked','locked','unlocked','installed','uninstalled','available','unavailable','unknown','none','loading','loaded','empty','new','old','latest','current','previous','next','done','todo','in progress','reviewing','approved','changes requested','needs review'])
const GITCMD = new Set(['commit','push','pull','merge','rebase','fetch','stage','unstage','stash','checkout','cherry-pick','revert','reset','force push','amend','squash','branch','tag','diff','blame','log'])
const MODE = new Set(['manual','auto','yolo','ask','allow','deny','never','always','off','on','inherit','default','system','none'])
const BRAND = /^(Orca|GitHub|GitLab|Bitbucket|Claude|Codex|Gemini|Kimi|MiniMax|OpenCode|Antigravity|Grok|Cursor|ZCode|Devin|WSL|SSH|MCP|AGPL|API|URL|URI|JSON|YAML|CSV|HTML|CSS|JS|TS|JSX|TSX|PDF|PNG|JPEG|WEBP|SVG|GIF|MP3|MP4|ANSI|UTF|ASCII|OAuth|SAML|SSO|TOTP|FIDO|NFC|USB|GPU|CPU|RAM|SSD|HDD|ARM|x86|x64|amd64|iOS|iPadOS|macOS|Windows|Linux|Android|Chrome|Safari|Firefox|Edge|Ghostty|Warp|iTerm|Hyper|Alacritty|Kitty|zsh|bash|fish|nu|powershell|pwsh|cmd|pnpm|npm|yarn|bun|node|Node|deno|ollama|Ollama|Docker|Kubernetes|k8s|App Store|Play Store|Homebrew|brew|Xcode|VS Code|VSCode|Vim|Neovim|Emacs|Sublime|Zed|Notion|Slack|Discord|Linear|Jira|Asana|Trello|Figma|Mermaid|Graphviz|WebRTC|WebSocket|HTTP|HTTPS|FTP|SFTP|TCP|UDP|IP|DNS|TLS|SSL|WASM|Wasm|GLM|Zhipu|BigModel|Qoder|Hermes|Atlassian|Multipass|Tailscale|cloudflared|OpenAI|Anthropic|Google|Microsoft|Apple|Amazon|AWS|Azure|GCP|Vercel|Netlify|Cloudflare|Supabase|Firebase|Vite|Rollup|Webpack|esbuild|SWC|Babel|ESLint|Prettier|TypeScript|JavaScript|Python|Ruby|Go|Rust|Java|Kotlin|Swift|C|C\+\+|C#|PHP|Lua|Perl|R|Julia|Haskell|Scala|Elixir|Dart|Flutter|React|Vue|Svelte|Angular|Solid|Astro|Next|Nuxt|Remix|Electron|Tauri|GTK|Qt|X11|Wayland|GNOME|KDE|POSIX|Unix|BSD|Debian|Ubuntu|Fedora|Arch|NixOS|Alpine|CentOS|RHEL|SUSE)\b/
const KEYNAME = /^(Enter|Escape|Esc|Tab|Space|Backspace|Delete|Insert|Home|End|Page ?Up|Page ?Down|F\d{1,2}|Ctrl|Control|Cmd|Command|Alt|Option|Shift|Meta|Win|Caps ?Lock|Num ?Lock|Print ?Screen|Scroll ?Lock|Pause|Arrow ?(Up|Down|Left|Right)|Up|Down|Left|Right)\b/i
const LANGNAME = /^(English|Español|Português|Français|Deutsch|Italiano|Nederlands|Polski|Русский|Українська|日本語|한국어|中文|繁體|Tiếng Việt|Vietnamese|العربية|हिन्दी|ไทย|Türkçe|Svenska|Norsk|Dansk|Suomi|Čeština|Slovenčina|Magyar|Română|Български|Ελληνικά|עברית|فارسی|Bahasa|Català|Hrvatski|Srpski|Slovenščina|Lietuvių|Latviešu|Eesti|Íslenska|Gaeilge|Cymraeg|Galego|Euskara|Shqip|Македонски|Беларуская|Қазақ|Oʻzbek|Azərbaycan|ქართული|Հայերեն|کوردی|Kiswahili|Afrikaans)/i

const stripPh = s => s.replace(/\{\{[^}]+\}\}|\{[a-zA-Z][a-zA-Z0-9]*\}|<\/?[a-zA-Z][a-zA-Z0-9]*\/?>/g, ' ').trim()
const words = s => stripPh(s).split(/\s+/).filter(w => /[a-zA-Z]/.test(w))

function classify(k, v) {
  const s = String(v)
  const clean = stripPh(s)
  const wl = words(s)
  const low = s.trim().toLowerCase()

  if (k.startsWith('auto.components.settings.') && /^plugin/i.test(k.slice(25))) return 'protected-plugin-copy'
  if (/\.search\.|searchKeywords/i.test(k)) return 'search-keyword'
  if (clean === '') return 'placeholder-only'
  if (/^(https?:\/\/|orca:\/\/|wss?:\/\/|ssh:\/\/|git@|sk-[a-zA-Z0-9]|[A-Za-z]:\\|~?\/[\w./~-]|\\{2}|\{\{)/.test(clean)) return 'url-path-token'
  if (/(auth login|npm |pnpm |yarn |bun |brew |apt |curl |wget |git |ssh |docker |kubectl |cloudflared|ollama run|glab |gh |xcode-select|chmod|sudo |cd |ls |echo |export |set |\.sh\b|\.bat\b|\.ps1\b)/i.test(clean) && wl.length <= 8) return 'command-sample'
  if (/[@{}()[\];]|=>|function|keyframes|nth-of-type|data-|\.[a-z-]+\s*[{:>]|::|:before|:after|rgba?\(|translate[XY]?\(|font-family|--[a-z-]+\s*:/i.test(s) && /[{};()]/.test(s)) return 'code-sample'
  if (KEYNAME.test(s)) return 'keyboard-name'
  if (LANGNAME.test(s)) return 'language-name'
  if (STATUS.has(low) || MODE.has(low)) return 'enum-status'
  if (GITCMD.has(low) || GITCMD.has(low.replace(/&\s*/g, '').split(/\s+/).pop())) return 'git-term'
  if (BRAND.test(s)) {
    // câu bắt đầu bằng brand mà còn từ thường → vẫn phân loại proper-noun nếu phần còn lại toàn từ vựng kỹ thuật ngắn
    return 'proper-noun'
  }
  if (wl.length === 0) return 'placeholder-only'
  if (/^[a-z0-9_.-]+$/i.test(clean) && wl.length === 1) return 'single-token'
  if (wl.length === 1) return 'single-word'
  if (wl.length === 2) return 'two-word'
  return 'unclassified'
}

const groups = {}
for (const k of missing) (groups[classify(k, E[k])] ??= []).push(k)

const ORDER = ['protected-plugin-copy','search-keyword','placeholder-only','url-path-token','command-sample','code-sample','keyboard-name','language-name','enum-status','git-term','proper-noun','single-token','single-word','two-word','unclassified']
const LABEL = {
  'protected-plugin-copy': 'Protected plugin security copy — Orca fail-closed, CẤM dịch',
  'search-keyword': 'Search keyword trong settings — giữ EN để tìm kiếm khớp',
  'placeholder-only': 'Value chỉ là placeholder/định dạng — không có chữ để dịch',
  'url-path-token': 'URL/path/token — dịch sẽ hỏng',
  'command-sample': 'Lệnh mẫu (shell/CLI) — code mẫu giữ nguyên',
  'code-sample': 'Nội dung code/CSS/demo — giữ nguyên',
  'keyboard-name': 'Tên phím — quy ước UI giữ EN',
  'language-name': 'Tên ngôn ngữ — hiển thị tên bản địa',
  'enum-status': 'Enum status/mode — khớp badge/query `is:`/API',
  'git-term': 'Thuật ngữ git — glossary quy định giữ EN',
  'proper-noun': 'Tên riêng/sản phẩm/đơn vị kỹ thuật — never-translate',
  'single-token': 'Token đơn không dấu cách — khả năng cao là keyword/identifier',
  'single-word': 'Một từ — xem xét từng key (nhiều cái là keyword/enum)',
  'two-word': 'Hai từ — xem xét từng key',
  'unclassified': 'CHƯA PHÂN LOẠI — cần con người quyết: dịch hay bổ sung rule vào dump-untranslated.mjs'
}

for (const g of ORDER) console.log(String(groups[g]?.length ?? 0).padStart(6), g)

if (CHECK) process.exit(0)

const date = new Date().toLocaleDateString('sv-SE')
let out = `# Untranslated keys — generated report\n\n> GENERATED bởi \`tools/dump-untranslated.mjs\` (${date}) — KHÔNG sửa tay, chạy lại script sau mỗi lần resync en.json.\n> Quyết định "không dịch" nằm trong \`docs/no-translate.md\`. Tổng: **${missing.length}** key chưa dịch.\n\n`
for (const g of ORDER) {
  const ks = groups[g]
  if (!ks?.length) continue
  out += `## ${LABEL[g] || g} — ${ks.length} key\n\n`
  out += ks.map(k => `- \`${k}\` — ${String(E[k]).replace(/\n/g, ' ')}`).join('\n') + '\n\n'
}
writeFileSync(OUT, out)
console.log(`\nĐã ghi ${OUT}`)
