# Agent Rules — dịch Orca vi

**Rule 0 — chất lượng hơn coverage.** Bản dịch nghe gượng/không tự nhiên thì **XÓA key** khỏi `locales/vi.json` — sparse catalog hợp lệ, key thiếu tự fallback tiếng Anh. Tuyệt đối không ship bản dịch tệ để tăng số key. Đây là bài học thực tế: "Remote Hosts" từng bị dịch "Host remote" (đảo thứ tự từ) — xấu hơn English.

## Không được làm

- Không viết value giống hệt English (giả coverage ảo, gây noise "identical to EN" — checker đếm riêng). Muốn giữ English thì **đừng thêm key**.
- Không đảo cấu trúc danh từ ghép kiểu máy-móc: "Remote X" → đừng dịch "X remote"; dùng "X từ xa" hoặc giữ English.
- Không dịch tên sản phẩm/thuật ngữ domain (xem `docs/glossary.md`): Orca, workspace, worktree, terminal, agent, chat, repo, SSH, WSL, MCP, host, daemon, profile, enum tên mode (Manual/Auto/Yolo).
- Không thêm key không có trong `reference/en.json` (extra → fail). Không đổi placeholder `{{...}}` và tag `<code>`/`<agents>` (lệch → fail).
- Không dịch `auto.*` mà không biết key render ở đâu — xem mục "Hash keys" dưới.
- **CẤM TUYỆT ĐỐI key dưới `auto.components.settings.plugin*`** (plugin security copy — consent, trust badge, install/remove dialog): Orca **fail-closed**, MỘT key vi phạm → reject TOÀN BỘ pack, toàn giao diện quay về English mà không báo gì trên UI. Chỉ 34 chrome path trong exemption được dịch (PluginsSettingsSection/MarketplaceBrowser/DevelopmentSection heading + `plugins.search.*`). Danh sách chính xác nằm trong `tools/check-catalog.mjs` (`ORCA_EXEMPT_CHROME`) — checker bắt rule này, đừng tắt. Bài học: pack từng "load im lặng không dịch gì" vì `PluginConsentProvenance.official` bị dịch — đúng vector giả mạo trust badge mà Orca chặn.
- Cấu trúc catalog cũng nằm trong rule Orca: key không chứa `.`, không `__proto__`/`prototype`/`constructor`, leaf là string ≤8192 ký tự, depth ≤16, tổng node ≤20.000. `check-catalog.mjs` port nguyên validator — chạy nó trước khi coi là xong.

## Phải làm

- Nhãn/nút: động từ hoặc cụm ngắn, không chấm cuối — `Lưu`, `Hủy`, `Phím tắt`. Mô tả: câu đầy đủ, có chấm.
- `_one`/`_other` dịch giống nhau (tiếng Việt không chia số nhiều): cả hai `{{count}} phiên`.
- Xưng hô "bạn"; giọng trung tính, không kính ngữ.
- Thuật ngữ theo `docs/glossary.md`; thuật ngữ mới quyết định xong thì bổ sung vào glossary, không quyết hai kiểu.
- Sau mỗi batch: `node tools/check-catalog.mjs` — bắt buộc **0 extra, 0 placeholder mismatch**; bump `version` trong `orca-plugin.json`; cập nhật bảng tiến độ `docs/roadmap.md`.

## Quy trình một batch (theo màn hình — xem `docs/roadmap.md`)

1. Chọn key group → dump từ `reference/en.json` (lọc prefix `auto.components.<path>` hoặc namespace).
2. Dịch từng key; **key nào ngập ngừng thì bỏ qua luôn**, không dịch cho có.
3. Merge vào `locales/vi.json` giữ nguyên cấu trúc nested → chạy checker → verify trên UI thật (dev path hot-reload).
4. Key nào ra màn hình xấu → xóa key, đừng vá chữa chệch nghĩa.

## Hash keys (`auto.*`)

- Tên key: `auto.components.<đường/dẫn>.<Component>.<hash>` — đường dẫn cho biết màn hình, value là chuỗi English fallback.
- Cùng một màn có thể lấy chuỗi từ **nhiều file** (component + hook): vd label item trong nav Settings nằm ở `auto/hooks/useSettingsNavigationMetadata`, KHÔNG phải `auto/components/settings`. Nếu dịch xong mà UI không đổi → key thật nằm file khác, tra lại bằng cách tìm theo **value English** trong en.json, đừng đoán.
- Bài học thực tế: dịch `Settings.*` xong nhưng tên item nav vẫn English — vì label item và mô tả nằm ở 2 nhóm key khác nhau.

## Tools

- `tools/check-catalog.mjs` — so với `reference/en.json`: missing / extra (FAIL) / placeholder lệch (FAIL) / trùng English.
- `docs/roadmap.md` — batch theo màn hình + bảng tiến độ; `docs/glossary.md` — thuật ngữ.
- Plugin dev path hot-reload `vi.json`; đổi manifest (`displayName`, version) thì cần Refresh/restart Orca.
