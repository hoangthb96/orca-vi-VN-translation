# Vietnamese (vi) UI Glossary and Style — Orca

Catalog: `locales/vi.json`. Key thiếu → runtime fallback tiếng Anh (sparse hợp lệ).

## Voice

- Xưng hô trung tính: "bạn". Không kính ngữ quá mức.
- Nút/menu: động từ trần — `Lưu`, `Hủy`, `Thử lại`, `Mở`, `Đóng`, `Gỡ`, `Thử cài lại`.
- Lỗi: mô tả hành động thất bại, không đổ lỗi — `Không lưu được…`, `Không mở được…`.
- Câu xác nhận: câu hỏi ngắn gọn — `Thoát hoàn toàn?`, `Gỡ {{name}}?`
- Nhãn không dấu chấm cuối; mô tả có dấu chấm. Dùng `…`, không dùng `...`.
- Số + danh từ không biến đổi số nhiều: `{{count}} server`, `{{count}} phiên` — `_one`/`_other` dịch giống nhau (tiếng Việt không chia số).

## Giữ nguyên tiếng Anh (never translate)

- Tên sản phẩm/agent: Orca, Claude, Codex, Gemini, Kimi, MiniMax, OpenCode, Antigravity, Grok, Cursor, ZCode, Devin, GitHub, Chrome, WSL, SSH, MCP, Orca Mobile.
- **Skill(s)/Agent Skills** — cộng đồng dev Việt giữ nguyên bản (claude.vn, claude-howto, danhvo.net, bumbii.tech, LamJinLab đều viết "Skill"); "kỹ năng" gây nhầm sang soft-skill con người — KHÔNG dùng.
- Khái niệm domain: workspace, worktree, terminal, agent, chat, tab, pane, repo, daemon, relay, host, profile, extension, check (GitHub check), recipe, provider.
- Tên setting/màn: Quick Open, File Explorer, Source Control, Manage Sessions, Resource Manager, Settings (khi trỏ đường dẫn `Cài đặt → X` thì dịch "Cài đặt"), Session & Cookies.
- Chế độ quyền giữ nguyên nếu là tên enum: Manual, Auto, Yolo.
- **Enum status** giữ nguyên English để khớp badge/filter hệ thống: PR/MR state (Open, Closed, Merged, Draft — khớp `is:open`…), review decision (Approved, Changes requested, Needs review), check-run status (Failed, Pending, Skipped, Neutral, Queued, Cancelled), run/connection/agent status (Ready, Running, Queued, Error, Failed). Không dịch ''Mở''/''Đã merge''/''Nháp''… — lệch query `is:` và badge API. Nút action ''Open'' vẫn dịch ''Mở''.

## Thuật ngữ

| English | Tiếng Việt | Ghi chú |
|---|---|---|
| session | phiên | terminal session = phiên terminal |
| settings | cài đặt | |
| notification | thông báo | |
| permission(s) | quyền | |
| update | cập nhật | |
| install | cài đặt | |
| sign in / sign-in | đăng nhập | |
| account | tài khoản | |
| host | host | SSH host giữ nguyên |
| remote (server/host) | remote | `server remote`, `host {{distro}}` |
| fallback / mặc định | mặc định | `System default` giữ nguyên (tên tài khoản) |
| search / index | tìm kiếm / chỉ mục | `lập chỉ mục` cho indexing |
| render | render | |
| commit / staged / branch / pull request / merge | giữ tiếng Anh | `staged` → `đã staged`, `unstaged` → `chưa staged` |
| filter | bộ lọc | động từ: `lọc` |
| instance | instance | `instance Orca` |
| toast/notification banner | thông báo | |
| user agent | user agent | `danh tính trình duyệt` cho Browser identity |
| file | file | từ mượn phổ biến, không dịch `tệp` trừ khi cần |
| issue | issue | tên entity Jira/Linear/GitHub, giữ nguyên |
| team | team | |
| console | console | |
| build | build | `Build daily`, `build stable` |

## Quy tắc kỹ thuật

- Giữ nguyên y hệt placeholder `{{name}}`, `{{count}}`, `{{value0}}`… và tag như `<code>`, `<agents>` — checker `tools/check-catalog.mjs` fail nếu lệch.
- Key mới chỉ được tồn tại nếu có trong `reference/en.json` upstream (extra key → fail).
- Khi upstream đổi `en.json`: tải lại file, chạy `node tools/check-catalog.mjs --missing` để xem key mới cần dịch / key đã bị xóa khỏi en (nằm trong `extra`).
