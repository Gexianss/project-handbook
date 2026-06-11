# project-handbook — 設計文件

> 日期：2026-06-11
> 狀態：設計確認中
> 來源：與使用者腦力激盪 session，從既有 `project-docs` skill 延伸出的新姊妹 skill
> **發布目標：公開上 GitHub 給所有人使用**（同時作為使用者的求職作品集項目）

## 一句話定位

獨立掃描整個專案 + 訪談使用者補足 code 以外的知識，產出一個**雙擊就能看的 HTML 專案手冊**（給人）兼**結構化 md/json 資料**（給 AI）——同一份資料，兩種讀法。

## 發布策略（已確認）

| 決策 | 結論 |
|---|---|
| 發布形式 | **Claude Code plugin 結構**：repo 含 `.claude-plugin/`（plugin.json + marketplace.json），使用者用 `/plugin` 一行安裝；也保留手動複製安裝的可能 |
| 語言策略 | **SKILL.md、README、viewer UI 用英文撰寫**；執行時產出的手冊內容語言**自適應**（跟隨使用者 CLAUDE.md / 專案既有文件的語言慣例）。README 附繁中版（README.zh-TW.md） |
| 適用範圍 | **明確鎖定 JS/TS 生態**（npm/pnpm/yarn 專案）。README 誠實標明範圍；其他語言生態留作未來 v2 |
| 作品集定位 | repo 要有完整 README（含截圖/demo GIF）、LICENSE（MIT）、範例產出。比照使用者 Noodle-pos 公開包裝的標準 |

## 背景與動機

- 使用者已有 `project-docs` skill：深度精讀程式碼、產出給 AI 看的 `docs/` 參考型 + 流程型文件。
- 缺口一：`project-docs` 只涵蓋「程式碼裡看得到的東西」。部署在哪、怎麼部署、後端誰維護、跟 UI/UX 怎麼協作、機器容量——這些 **code 裡沒有**，需要訪談使用者。
- 缺口二：`docs/` 的純 md 適合 AI，但對人類（新人、同事、未來的自己）不夠友善——缺圖、缺導覽、缺「快速進入專案」的動線。
- 缺口三：沒有健康度視角——程式碼壞味道、套件老舊度、git 熱點、測試缺口。

## 與 project-docs 的關係（已確認）

**獨立平行**。新 skill 自己從頭讀專案，不依賴 `docs/` 是否存在、也不修改它。兩個 skill 可各自單獨執行。

## 核心設計：雙軌合一（已確認）

採用「模板 + 資料檔分離」架構（使用者選定方案 A）：

- `data/` 內的 md/json 是**單一真相來源**。AI 直接讀寫這些檔案。
- 人類雙擊開啟 `index.html`，固定的檢視器把同一批 md 渲染成網站：側邊欄導覽、Mermaid 圖渲染、健康度儀表板。
- AI 更新文件 = 只改 `data/`。**模板（index.html / viewer assets）生成一次後永不更動。**
- 好處：不用維護兩套內容，「給人的」和「給 AI 的」永遠同步。

## 工作流程（5 階段）

### 階段 1 — 自動掃描（四個面向，已確認全要）

**原則：現成工具優先，AI 兜底。** 工具產出客觀數據，AI 負責解讀與評語。工具不存在或跑不動時退化為 AI 讀碼判斷，並在報告中註明數據來源。

| 面向 | 優先工具 | AI 兜底時看什麼 |
|---|---|---|
| 程式碼健康度 | `npx knip`（死碼/未用 export）、行數統計 | 過大檔案、明顯重複、註解掉的殭屍碼 |
| 套件體質 | `npm outdated`、`npm audit` | lock file 與 package.json 對照 |
| git 熱點 | `git log` 統計：最常改的檔案、最近 N 月沉睡區、作者分布 | —（無 git 則跳過此面向並註明） |
| 測試與品質缺口 | 測試檔盤點、覆蓋率設定存在才跑、`tsc --noEmit` / eslint 錯誤存量 | 關鍵邏輯（金流/權限/資料寫入）有無對應測試 |

掃描結果寫入 `data/health.json`（結構化、儀表板直接吃）。

### 階段 2 — 架構精讀

AI 讀懂專案結構（進入點、路由、狀態、API 層、模組劃分），精讀深度以「能畫出正確的架構圖與資料流圖、能寫出導覽文件」為準。產出 Mermaid 圖草稿。

### 階段 3 — 訪談（補足 code 裡沒有的知識）

**遵守使用者既有原則：系統化列舉，不逐條問。**

1. 根據階段 1–2 的發現，**客製化生成完整問題清單**（例：掃到 axios baseURL 指向某網域 → 問「這個後端是誰維護的、文件在哪」）。
2. 問題分類：部署（在哪、怎麼部、誰有權限）、後端串接（上游是誰、staging 在哪）、協作（UI/UX 流程、設計稿位置、code review 慣例）、基礎設施（機器規格、容量、記憶體、監控）、營運（使用者是誰、尖峰時段）。
3. 用 AskUserQuestion 分類分批問。
4. **使用者答不出 → 標「⚠️ 待確認」**，並附「建議去問誰／去哪查」。產出一張「待調查清單」，未來補上即可。不要猜了當事實。

### 階段 4 — 產出

```
專案根目錄/
└─ docs-site/
   ├─ index.html            ← 檢視器（固定模板，skill 內附，複製進來）
   ├─ assets/               ← viewer.js / viewer.css / marked.js / mermaid.js（vendor，離線可用）
   ├─ open-handbook.bat     ← Windows：雙擊起本機靜態 server + 開瀏覽器
   ├─ open-handbook.sh      ← macOS/Linux 同功能（跨平台，公開發布必要）
   └─ data/                 ← AI 唯一需要維護的地方
      ├─ manifest.js        ← 章節清單與順序（檢視器的導覽來源）
      ├─ overview.md        ← 專案是什麼、給誰用、解決什麼問題
      ├─ architecture.md    ← 架構圖、資料流圖（Mermaid）、模組地圖
      ├─ dev-guide.md       ← 怎麼跑起來、開發慣例、分支策略
      ├─ deployment.md      ← 部署在哪、怎麼部、機器容量 ←訪談
      ├─ integration.md     ← 後端怎麼接、外部服務、API 上游 ←訪談+掃描
      ├─ collaboration.md   ← 跟 UI/UX、後端怎麼協作、設計稿在哪 ←訪談
      ├─ onboarding.md      ← 新人第一天：環境→跑起來→改第一個功能
      └─ health.json        ← 四面向掃描的結構化數據
```

另外：專案 `CLAUDE.md` 加一小段指向 `docs-site/data/`（給 AI）與 `docs-site/index.html`（給人）。

**技術細節：**
- 瀏覽器 `file://` 安全限制會擋 fetch 讀本地 md → 附跨平台啟動腳本（`open-handbook.bat` / `.sh`，起本機靜態 server 再開瀏覽器），兼顧雙擊體驗與純 md 資料檔。
- viewer 函式庫（marked.js、mermaid.js）vendor 進 skill 模板資料夾，不走 CDN，離線可看。
- 健康度儀表板：`health.json` 驅動的卡片 + 純 CSS/簡單 SVG 長條圖，不引入大型 chart 庫。
- viewer UI 文字用英文；**手冊內容語言自適應**（跟隨使用者 CLAUDE.md / 專案語言慣例，SKILL.md 明文指示）。
- **新鮮度標記**：manifest 頂層記 `generatedAt` + `commit`（最後一次執行/稽核的基準）；每個 section 各自記 `updatedAt`（內容最後變動日）。檢視器在每頁標題下顯示「Updated〈該頁日期〉· verified at〈commit〉」——稽核時只有真的被改的章節會更新 `updatedAt`，但所有章節都會被對照新 commit 驗證，所以 commit 是全域的。
- 規模自適應：章節是預設骨幹，依專案實況增減（例：純前端展示專案沒有 integration 就併入 architecture）。

### 階段 5 — 自我校對與回報

- 抽查文件中的 `檔案:行號` 與路徑指引是否正確。
- 開 server 確認 index.html 渲染正常（Mermaid 圖有畫出來、儀表板有數據）。
- 回報：交付物清單、健康度摘要（四面向各一句）、⚠️ 待確認清單。

## 再次執行的行為（稽核模式）

偵測到 `docs-site/` 已存在 → 用 AskUserQuestion 問使用者，預設推薦「稽核更新」：

- **稽核更新**（預設）：**diff 驅動，省 token**——先用 manifest 記錄的基準 commit 跑 `git diff --name-status <基準>..HEAD` + `git log --oneline <基準>..HEAD`，得出這段期間實際變動的檔案清單；把變動檔案對應到受影響的章節，**只深讀並修正那些章節**。沒有相關變動的章節由 diff 本身證明內容仍然正確，直接保留、不重讀（`updatedAt` 不變）。基準 commit 不可達（rebase/squash/shallow clone）時退回全量稽核。健康掃描照樣全量重跑（工具驅動、成本低）。訪談來源的內容（部署/協作）不受 code diff 影響，只重問上次的「待確認」。manifest 的 `generatedAt`/`commit` 更新為本次基準；只有內容真的被改的章節更新 `updatedAt`。回報時註明哪些章節是「diff 證明無變動而跳過」。
- **跳過**：什麼都不做。
- **整批重寫**：確認既有內容無保留價值時才選。模板 assets 不論哪種模式都只在缺失時補。

## 範圍邊界（不做什麼）

- 不取代、不修改 `project-docs` 及其產出的 `docs/`（project-docs 是使用者私有 skill，不隨本 plugin 發布）。
- 不做套件相容性守門（那是另一個 skill 候選 stack-guard 的範圍）。
- 不自動修復掃描發現的問題，只報告。
- 健康度掃描不追求 SonarQube 等級的精確，定位是「體檢摘要」。
- 非 JS/TS 專案不在 v1 範圍（README 明示）。
- 使用者的個人規則（Obsidian 筆記同步等）不進公開版本。

## Repo 結構（公開發布）

```
project-handbook/                ← GitHub repo 根目錄（獨立開發目錄，非 ~/.claude/skills/）
├─ .claude-plugin/
│  ├─ plugin.json               ← plugin 中繼資料
│  └─ marketplace.json          ← 讓人 /plugin marketplace add 安裝
├─ skills/
│  └─ project-handbook/
│     ├─ SKILL.md               ← 英文，5 階段流程指引
│     └─ template/              ← viewer 模板（index.html, assets/, open-handbook.bat/.sh）
├─ examples/                     ← 一份範例產出（截圖來源）
├─ README.md                     ← 英文，含截圖/GIF、安裝、使用、範圍說明
├─ README.zh-TW.md
└─ LICENSE                       ← MIT
```

開發位置建議：`Desktop/project/project-handbook/`（git repo），本機透過 plugin 本地安裝或 symlink 測試；`~/.claude/skills/` 下不放正式版以免與 plugin 版本打架。

## 實作待辦（進 writing-plans 階段展開）

1. repo 骨架：.claude-plugin/、LICENSE、README 雙語
2. viewer 模板：index.html + viewer.js/css + vendor 函式庫 + open-handbook.bat/.sh
3. SKILL.md（英文）：description 觸發詞設計 + 5 階段流程指引 + 訪談問題分類骨幹 + 產出語言自適應規則
4. health.json schema 定義
5. 用 noodle-pos 或其他實際專案做首次實測，截圖進 README
6. 使用者本機：依個人全域規則，同步建立 Obsidian skill 筆記（`C:/Users/user/Desktop/Obsidian/ClaudeCode/Skills/`，不進公開 repo）
