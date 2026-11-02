# ADR — Các nhóm key quyết định KHÔNG dịch

**Status**: accepted · **Phạm vi**: mọi key trong `reference/en.json` mà `locales/vi.json` cố ý không chứa.

## Context

- Sparse catalog hợp lệ: key thiếu trong `vi.json` → Orca tự fallback tiếng Anh (Rule 0 — `AGENTS.md`).
- Một số key dịch ra thì **xấu hơn English** (đảo thứ tự từ, mất nghĩa domain), một số key **bị Orca cấm** (fail-closed → reject cả pack), một số key **dịch = trùng EN** (vi phạm "không ghi value giống English").
- Chạy `node tools/dump-untranslated.mjs` để sinh lại `docs/untranslated-keys.generated.md` — danh sách key chưa dịch theo nhóm dưới đây. Matcher của từng nhóm nằm trong script đó; khi rule đổi, sửa cả hai.

## Decision — các nhóm không dịch

| # | Nhóm | Matcher (key / value) | Lý do |
|---|---|---|---|
| 1 | **protected-plugin-copy** | key `auto.components.settings.plugin*` (trừ 34 exempt chrome trong checker) | Orca fail-closed: 1 key vi phạm → reject TOÀN BỘ pack, im lặng không báo. Security copy (consent, trust badge, install dialog) phải do Orca kiểm soát. |
| 2 | **search-keyword** | key chứa `.search.` / `searchKeywords` | Từ khóa phụ cho settings search. Dịch ra làm user gõ tiếng Anh không ra kết quả; giữ EN cho cả hai hướng gõ. |
| 3 | **placeholder-only** | value sau khi bỏ `{{}}`/`{}`/`<tag>` = rỗng | `{{value0}}ms`, `{{value0}} bal`, `{{count}} monitor` — không có chữ để dịch; thêm key = trùng EN. |
| 4 | **url-path-token** | value là URL/path/token (`orca://`, `sk-`, `C:\`, `~/.codex`) | Dịch = phá payload. |
| 5 | **command-sample** | lệnh mẫu shell/CLI (`gh auth login`, `pnpm test`, `cloudflared access ssh`) | Code mẫu user copy chạy thật — dịch = hỏng lệnh. |
| 6 | **code-sample** | CSS/JS/selector/demo trong `feature.wall`, snippet hook | Nội dung minh họa chạy được — giữ nguyên. |
| 7 | **keyboard-name** | tên phím (Enter, Esc, Ctrl+C, Cmd+K) | Quy ước UI. |
| 8 | **language-name** | `settings.appearance.language.*` | Tên ngôn ngữ hiển thị dạng bản địa (Português (Brasil), 中文…). |
| 9 | **enum-status** | value thuộc tập status/mode (Open, Closed, Merged, Draft, Failed, Ready, Manual, Auto, Yolo…) | Phải khớp badge hệ thống, query `is:` và enum API — xem `docs/glossary.md`. Nút action "Open" vẫn dịch "Mở". |
| 10 | **git-term** | Commit, Push, Pull, Merge, Rebase, Fetch, Stage, Force Push… | Glossary quy định lệnh git giữ EN (`staged` → "đã staged"). |
| 11 | **proper-noun** | tên sản phẩm/agent/công nghệ + đơn vị kỹ thuật | Orca, Claude, Codex, GLM Coding Plan, Hermes, WSL, MCP, ANSI… — never-translate list trong glossary. |
| 12 | **single-token / single-word / two-word** | token đơn, 1–2 từ | Mặc định nghi là keyword/identifier/enum chưa liệt kê — chỉ dịch khi chắc là câu/nhãn hiển thị. |

## Quy trình cho agent dịch tiếp

1. Với một key còn thiếu: khớp nhóm 1–12 → **bỏ qua**, đừng dịch. Nhóm 1 vi phạm = hỏng cả pack.
2. Value VI sẽ **giống hệt EN** → đừng thêm key (checker flag "identical EN").
3. Key không khớp nhóm nào → nằm trong mục **CHƯA PHÂN LOẠI** của file generated: đó là hàng đợi thật — hoặc dịch (nếu là câu/nhãn hiển thị), hoặc quyết bỏ qua và **bổ sung matcher mới** vào `dump-untranslated.mjs` + hàng vào bảng trên.
4. Không chắc → **bỏ qua** (Rule 0: bản dịch tệ xấu hơn English fallback).

## Consequences

- Coverage đỉnh thực tế ≈ số key dịch được / tổng; % tuyệt đối dao động theo upstream (xem `docs/en-sync-changelog.md`).
- Mỗi lần resync: key mới đổ vào `untranslated-keys.generated.md` — phần lớn rơi vào nhóm đã quyết, phần còn lại (mục chưa phân loại) là việc dịch thật.
