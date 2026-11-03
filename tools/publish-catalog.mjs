#!/usr/bin/env node
// Pin an orca-marketplace.json (catalog v2) release to a git commit, computing the
// contentHash exactly as Orca does at install (src/main/plugins/plugin-content-hash.ts).
//
// Usage:
//   node tools/publish-catalog.mjs --ref <commit|tag|branch>   # hash the tree of a git ref
//   node tools/publish-catalog.mjs --worktree                  # hash the current working tree
//
// After committing/pushing the plugin changes, run with --ref <new-sha-or-tag> so the
// release pins a commit whose tree matches the shipped files. --worktree is a preview:
// it fills contentHash from the working tree but keeps the current HEAD as the commit.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '')
const CATALOG = join(ROOT, 'orca-marketplace.json')

const GIT_CANDIDATES = [
  'git',
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
  '/usr/bin/git'
].filter(Boolean)
let GIT
for (const c of GIT_CANDIDATES) {
  try {
    execFileSync(c, ['--version'], { stdio: 'ignore' })
    GIT = c
    break
  } catch {}
}
if (!GIT) throw new Error('git not found; set GIT env var or install Git for Windows')

function walk(dir, root, files) {
  const entries = readdirSync(dir, { withFileTypes: true })
  // Orca sorts names with a plain < comparison so hashes match across hosts/ICU.
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    if (entry.name === '.git' && dir === root) continue
    const full = join(dir, entry.name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, root, files)
    else if (st.isFile()) files.push({ rel: relative(root, full).replaceAll('\\', '/'), size: st.size, full })
    else throw new Error(`unsupported entry type: ${full}`)
  }
}

function hashTree(root) {
  const files = []
  walk(root, root, files)
  const hash = createHash('sha256')
  hash.update('orca-plugin-tree-v1\0')
  let totalBytes = 0
  for (const f of files) {
    totalBytes += f.size
    const relBuf = Buffer.from(f.rel, 'utf8')
    hash.update(u64(relBuf.byteLength))
    hash.update(relBuf)
    hash.update(u64(f.size))
    hash.update(readFileSync(f.full))
  }
  return { hash: hash.digest('hex'), fileCount: files.length, totalBytes }
}

function u64(n) {
  const b = Buffer.allocUnsafe(8)
  b.writeBigUInt64BE(BigInt(n))
  return b
}

const arg = process.argv[2] ?? '--help'
if (arg === '--help' || !['--ref', '--worktree'].includes(arg)) {
  console.log('Usage: node tools/publish-catalog.mjs --ref <commit|tag|branch> | --worktree')
  process.exit(1)
}

let commit, filesRoot
if (arg === '--ref') {
  const ref = process.argv[3]
  if (!ref) throw new Error('--ref needs a value')
  commit = execFileSync(GIT, ['rev-parse', ref], { cwd: ROOT }).toString().trim()
  filesRoot = mkdtempSync(join(tmpdir(), 'orca-catalog-'))
  const tarPath = join(filesRoot, 'tree.tar')
  execFileSync(GIT, ['archive', '--format=tar', '-o', tarPath, ref], { cwd: ROOT })
  execFileSync('tar', ['-xf', tarPath, '-C', filesRoot])
  rmSync(tarPath)
} else {
  commit = execFileSync(GIT, ['rev-parse', 'HEAD'], { cwd: ROOT }).toString().trim()
  filesRoot = mkdtempSync(join(tmpdir(), 'orca-catalog-'))
  for (const name of readdirSync(ROOT, { withFileTypes: true })) {
    if (name.name === '.git' || name.name === '.review-tmp') continue
    cpSync(join(ROOT, name.name), join(filesRoot, name.name), { recursive: true })
  }
}

const { hash, fileCount, totalBytes } = hashTree(filesRoot)
rmSync(filesRoot, { recursive: true, force: true })

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'))
const release = catalog.plugins[0]?.releases?.[0]
if (!release) throw new Error('catalog has no plugins[0].releases[0]')
release.commit = commit
release.contentHash = hash
writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n', 'utf8')
console.log(`pinned ${catalog.plugins[0].id} release ${release.version}`)
console.log(`  commit      ${commit}`)
console.log(`  contentHash ${hash}`)
console.log(`  files       ${fileCount}, ${totalBytes} bytes`)