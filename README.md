# Orca vi-VN Translation

Language pack tiếng Việt (`vi`) cho [Orca](https://github.com/stablyai/orca), phát hành dạng plugin (`data` profile — không code, không quyền). Phần chưa dịch tự fallback tiếng Anh.

## Cài đặt

Yêu cầu Orca ≥ 1.4.0 (theo `engines` trong `orca-plugin.json`). Ba cách:

**1. Dev local (phát triển — hot reload khi sửa `vi.json`)**

Settings → Plugins → mục dev paths: thêm đường dẫn tới thư mục repo này. Orca watch folder và reload khi catalog đổi.

**2. Install từ local path**

Settings → Plugins → Install → chọn thư mục repo này (chứa `orca-plugin.json`).

**3. Install từ Git URL**

`Settings → Plugins → Install → Git URL`, dán URL kèm ref (Orca bắt buộc `#tag` hoặc `#commit`/`#branch` tường minh — thiếu sẽ báo "Add a #tag or #commit"):

```
https://github.com/hoangthb96/orca-vi-VN-translation#main
```

Muốn pin một bản cố định thay vì `main`, dùng tag release hoặc commit SHA: `…#v0.1.0`, `…#6b177ac`.

Repo đang **public** — ai cũng cài được, không cần tài khoản GitHub.

**4. Qua marketplace source (xem plugin trong Marketplace browser)**

Repo chứa sẵn `orca-marketplace.json` (catalog tự host). Settings → Plugins → mục marketplace sources → add source bằng Git URL repo này — plugin `hoangthb96.vi` sẽ hiện trong Marketplace để cài một click.

Sau khi cài: **Settings → Appearance → Language** → chọn `Tiếng Việt`.

## Trạng thái dịch

| Phiên bản | Keys | Phạm vi |
|---|---|---|
| v0.1.0 | 15.607 / 17.308 (90,2%) | Toàn bộ màn hình chính: Settings, sidebar trái/phải, editor, status bar, terminal, native chat, automations, skills, tasks, GitHub/PR, workspace, accounts, keybindings, browser, mobile, WSL, onboarding… (chi tiết `docs/roadmap.md`) |

~1.700 key còn lại **cố ý giữ tiếng Anh** (sparse catalog hợp lệ, fallback tự động): security copy `settings.plugin*` Orca cấm override (fail-closed), enum status khớp query `is:`/badge API, search keyword, tên riêng, lệnh git, tên ngôn ngữ, URL/path/code mẫu. Dịch thêm sẽ vi phạm rule — xem `AGENTS.md` và `docs/glossary.md`.

## Cấu trúc

```
orca-plugin.json        # manifest v1, contributes.languagePacks → locale "vi"
locales/vi.json         # catalog tiếng Việt (sparse)
reference/en.json       # snapshot en.json upstream (nguồn dịch)
docs/glossary.md        # thuật ngữ & style chuẩn
docs/roadmap.md         # tiến độ dịch theo màn hình
tools/check-catalog.mjs # validator — port rule fail-closed của Orca + so key với en.json
tools/find-mixed.mjs    # quét value lẫn EN+VI
tools/merge-stage.mjs   # merge file stage vào vi.json
tools/serve.mjs         # workbench dịch (hot reload)
AGENTS.md               # rule dịch cho agent (Rule 0: chất lượng > coverage)
```

## Dịch tiếp / đóng góp

1. Đọc `docs/glossary.md` trước (quy tắc thuật ngữ, never-translate list).
2. Dịch trong `locales/vi.json` — chỉ key có trong `reference/en.json`; giữ nguyên placeholder `{{...}}` và tag `<code>`/`<agents>`; `_one`/`_other` dịch giống nhau (tiếng Việt không chia số). Value trùng English → xóa key, đừng ghi đè.
3. Kiểm tra:

```bash
node tools/check-catalog.mjs --missing   # exit≠0 nếu extra key / placeholder lệch / vi phạm rule Orca
```

4. Cập nhật nguồn khi Orca ra bản mới: tải lại `reference/en.json` từ `stablyai/orca` (`src/renderer/src/i18n/locales/en.json`) — nên lấy theo **tag release** (`v1.4.x`) thay vì `main` để snapshot khớp bản người dùng chạy — rồi chạy lại checker: `missing` = key mới cần dịch, `extra` = key upstream đã xóa.

## License

AGPL-3.0 — bản dẫn xuất/bản phát hành lại phải mở mã nguồn dưới cùng license.
