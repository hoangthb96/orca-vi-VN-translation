# Roadmap dịch theo màn hình — Orca vi

Cách chụp before/after: bật `vi`, mở màn hình → chụp; dịch batch → reload → chụp lại.
Check coverage từng batch: `node tools/check-catalog.mjs --missing`.

## Tiến độ theo key group (v0.1.0 — 15.607/17.308 = **90,2%**; mẫu số hợp lệ ~17.100 sau khi trừ 180 key `settings.plugin*` Orca cấm → **~91%**)

> Wave fan-out + tail sweep đã phủ gần như toàn bộ key dịch được. 1.701 key còn lại gần như toàn bộ CỐ Ý giữ EN: 180 key security copy Orca cấm (fail-closed), ~80 enum status khớp `is:` query/badge API, search keyword, tên riêng/proper noun, lệnh git, tên ngôn ngữ (中文/한국어…), URL/path/code mẫu, placeholder thuần. Dịch thêm = vi phạm rule.

| Keys | Group | Màn hình |
|---:|---|---|
| 322 | `settings` | Settings (tất cả tab) |
| 84 | `terminal` | Terminal banners/notices |
| 41 | `sessionHistory` | Session search settings |
| 36 | `sessionSearch` | Panel tìm phiên agent |
| 34 | `workspaceSpace` | Space (dung lượng workspace) |
| 32 | `menu` | Menu bar app |
| 31 | `updates` | Update/install blocker |
| 31 | `csv` | CSV editor |
| 29 | `sidebar` | Sidebar (reveal filter, wslMoved, refresh) |
| 18 | `notifications` | Notification/toast |
| 17 | `onboarding` | Onboarding → Language |
| 13 | `worktree` | Xóa workspace + nested worktrees |
| 12 | `tabHoverCard` | Hover card trên tab |
| 10 | `quitAndStopAllSessions` | Dialog Quit hoàn toàn |
| 8 | `githubChecks` | PR checks panel |
| 7 | `workspaceDeletion` | Tùy chọn xóa workspace |
| 6 | `app` | App-level error/saving |
| 6 | `stats` | Usage breakdown |
| 5 | `tray` | System tray |
| 5 | `dashboard` | Agent Dashboard sidebar |
| 4 | `quickOpen` | Quick Open |
| 4 | `fileSearch` | Tìm file |
| 3 | `checksPanel`, `agentLaunch`, `mediaPreview` | Misc |
| ~3.8k | `auto/components/settings` | **~93% sub-pane đã dịch**: nav/`Settings`, Appearance(+theme/font/contrast), Terminal (pane/window/theme/import Ghostty+Warp), general+agents+AgentsPane, Accounts+orcaAccount, repository/GitPane/hooks/fork/icon/sparse/symlink/worktree-visibility, browser+BrowserPane/profiles/link-routing, mobile+MobilePane/emulator/pairing, SSH (hostServer/managedServers/target form+list+card/passphrase/bulk), runtime+EphemeralVms+WSL+pairing URL+access grant+node mirror, plugins (consent/install/marketplace/permissions/dev), integrations+bitbucket+linear+shareSkills, notifications, shortcuts+keybindings+quick commands, tasks+TaskPane, experimental+ExperimentalPane+advanced+DevToolsPane+developer, voice+VoicePane+transcription, computer use+Browser Use, floating workspace, release channel, managed sessions, privacy+diagnostics |
| 2 | `common`, `workspaceOptions`, `github`, `projectBoard`, `projectBoardCard` | Misc |
| 1 | `osDocumentOpen`, `browserTab`, `nativeChat`, `startupFailure`, `projectField` | Misc |

Cụm workspace/file **đã merge** (kiểm 30/10/2026): `workspace.links` 59/66, `workspace.activity` 9/10, `workspace.reviewStatus` 7/7, `fileExplorer` 15/16, `editor` 15/15, `editorConflicts` 18/18, `sparsePreset` 33/33, `wslDriveProject` 15/16, `aiVault` 7/9, `agentsSidebarIntro` 3/3.

## P1 — Màn hình dùng hằng ngày

| Batch | Màn hình (chụp ở đâu) | Key groups | ~Keys |
|---|---|---|---|
| P1-1 | **Settings** (mở từng tab: Chat, Terminal, Agents, Browser, SSH, MCP…) | `auto/components/settings` | 4,982 — **đã dịch hết phần dịch được (~4.3k)**; sót ~600 search keyword giữ EN |
| P1-2 | **Sidebar phải** (panel activity/agent bên phải) | `auto/components/right`, `auto/components/rightSidebar` | 1,232 — **✅ wave 3 + tail sweep** |
| P1-3 | **Sidebar trái** (project tree, tabs, nav) | `auto/components/sidebar`, `auto/components/tab` | 1,309 — **✅ wave 3 + tail sweep** |
| P1-4 | **Editor tab** (vùng soạn file, markdown, diff) | `auto/components/editor` | 644 — **✅ wave 3** |
| P1-5 | **Status bar** (dải dưới: ports, resources, SSH…) | `auto/components/status` | 487 — **✅ wave 3** |
| P1-6 | **Terminal pane** | `auto/components/terminal` | 244 — **✅ wave 3** |

## P2 — Tính năng chính

| Batch | Màn hình | Key groups | ~Keys |
|---|---|---|---|
| P2-1 | **Native Chat** (khung chat agent) | `components/native-chat` | 804 — ✅ wave 3 |
| P2-2 | **Automations** (tab Automations sidebar) | `auto/components/automations` | 417 — ✅ wave 4 |
| P2-3 | **Skills** (tab Skills) | `auto/components/skills` | 388 — ✅ wave 4 (giữ EN "Skill(s)") |
| P2-4 | **Task page** | `auto/components/TaskPage`, `taskProviders` | 388 — ✅ wave 4 |
| P2-5 | **GitHub/PR** (PR page, item dialog, project views) | `auto/components/github`, `GitHubItemDialog`, `PullRequestPage`, `projectViews` | 653 — ✅ wave 4 |
| P2-6 | **Workspace** (composer, repo picker, detail) | `components/workspace`, `auto/components/workspace`, `NewWorkspaceComposerCard`, `auto/components/repo` | 402 — ✅ wave 4/5 |
| P2-7 | **Stats/Usage** | `auto/components/stats` | 258 — ✅ wave 4 (chart label giữ EN) |
| P2-8 | **Feature tips / Feature pages** | `auto/components/feature`, `featureTips` | 341 — ✅ wave 4 (code demo giữ EN) |

## P3 — Tính năng phụ / cấu hình

| Batch | Màn hình | Key groups | ~Keys |
|---|---|---|---|
| P3-1 | **Accounts** (Settings → Accounts) | `accounts` | 128 — ✅ wave 4 |
| P3-2 | **Keybindings** (Settings → Shortcuts) | `keybindings` | 105 — ✅ wave 4 |
| P3-3 | **Browser pane** (trình duyệt trong app + extensions) | `browser`, `browserExtensions`, `auto/components/browser`, `browserPane`, `auto/components/emulator` | 446 — ✅ wave 4/5 |
| P3-4 | **Mobile** | `auto/components/mobile` | 172 — ✅ wave 4 |
| P3-5 | **WSL move** (flow chuyển project sang WSL) | `wslMove` | 124 — ✅ wave 4 |
| P3-6 | **Jira/Linear/GitLab** | `jira`, `auto/components/linear`, `GitLabItemDialog`, `LinearIssueWorkspace`, `LinearItemDrawer` | 277 — ✅ wave 4/5 |
| P3-7 | **Onboarding** (các bước còn lại ngoài language) | `auto/components/onboarding` | 117 — ✅ wave 4 |
| P3-8 | **Update card / Resource Manager** | `auto/components/UpdateCard`, `resourceManager` | 112 — ✅ wave 4/5 |
| P3-9 | **Worktree Jump Palette / Dashboard popout / Artifacts** | `worktreeJumpPalette`, `auto/components/WorktreeJumpPalette`, `dashboardPopout`, `auto/components/artifacts` | 230 — ✅ wave 4 |

## P4 — Chuỗi hệ thống & phần còn lại

| Batch | Phạm vi | Key groups | ~Keys |
|---|---|---|---|
| P4-1 | Startup/system (crash, recovery, runtime, GPU, profile) | `profileState`, `native`, `rendererRecovery`, `runtime`, `runtimeRpc`, `gpuFallback`, `localBuild` | 121 — ✅ wave 4/5 |
| P4-2 | Resume modal, contextual, activity feed | `auto/components/NativeChatResumeOnRestartModal`, `auto/components/contextual`, `auto/components/activity` | 182 — ✅ wave 4/5 |
| P4-3 | Non-UI (store slices, hooks, lib, cmd, shared, new, window) | `auto/store/slices`, `auto/hooks/*`, `auto/lib/agent`, `auto/components/cmd|shared|new`, `auto/main/window`, `components/managed-runtime` | ~460 — ✅ wave 4/5 |

## Kết thúc — trạng thái 90,2%

5 wave fan-out (tổng ~33 agent) đã phủ mọi nhóm key dịch được. 1.701 key missing là cố ý giữ English:

- **Search keyword thuật ngữ** (~700+): `prompt`, `cache`, `tab`, `pane`, `font`, `theme`, `target`, `template`, `worker`, `recipe`, `plugin`, tên tool/provider/shell/font — dịch ra sẽ trùng EN hoặc gượng.
- **Proper noun / tên sản phẩm**: Orca, GitHub, Claude, Codex, WSL, Jira, App Store, Cursor…
- **Lệnh git giữ EN**: Commit, Push, Pull, Merge, Rebase, Fetch, Stage, Force Push.
- **Tên ngôn ngữ code**, key name (Enter, Esc, Ctrl+C), màu ANSI, âm thanh (Beep/Ding), enum mode.
- **Placeholder path/URL/format**: `orca://pair?code=...`, `sk-...`, `{{value0}} MB`, `v{{version}}`, `px`, `ms`.
- **Nội dung code/demo** trong feature.wall (CSS keyframes, `pnpm install`, tên tool agent Edit/Grep/Read).

Không còn nhóm nào ≥10 key toàn chuỗi dịch được — nếu muốn nâng % thêm thì phải phá rule "không trùng EN / không dịch keyword", điều sparse policy cấm.

## Trước khi submit review (kiểm 30/10/2026)

- **5 key cần xóa khỏi `vi.json`** (Rule 0 — fallback EN tốt hơn):
  - 3 key trùng English: `right.sidebar.Search.fileCount_one`, `right.sidebar.source.control.discard.dialog.fileCount_one`, `right.sidebar.AiVaultScanProgressStrip.fileCount_one` (checker flag IDENTICAL EN; locale `vi` chỉ dùng `_other` nên xóa `_one` không đổi render).
  - 2 key đảo từ English trong DevToolsPane: `nativeActionToast` ("Toast action native"), `behindBaseRefToast` ("Toast behind base ref") — lọt qua checker vì khác thứ tự từ.
- ~~Manifest thiếu `"capabilities": []`~~ — đã thêm (commit `3e8dced`). Lưu ý: install `#main` thực nghiệm OK cả khi thiếu field — schema có vẻ default, nhưng giữ field cho khớp pack mẫu `stablyai.orca-portuguese`.
- **`reference/en.json` là snapshot giữa chừng main (29/10), không khớp tag release nào.** Với main hiện tại: +1.183 / −135 / ~61 key đổi → 57 key trong `vi.json` trỏ vào key EN đã xóa (dead key), vài bản dịch mô tả text cũ (vd `settings.agents.permissionsSearchDescription`). Pin snapshot theo tag release (`v1.4.245`), prune dead key, cập nhật bản dịch key đổi nghĩa.
- Repo chưa có git tag — tạo tag `v0.1.0` khi release để URL install `#v0.1.0` trong README hoạt động.

## Quy ước mỗi batch

1. Dump key group: viết script lọc `reference/en.json` theo prefix → file tạm → đọc → dịch.
2. Merge vào `locales/vi.json` (giữ nested path `auto.components…` y hệt en.json).
3. `node tools/check-catalog.mjs` — phải 0 extra / 0 placeholder mismatch.
4. Chụp before/after màn hình tương ứng, bump `version` trong `orca-plugin.json`.
