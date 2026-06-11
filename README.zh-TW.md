# project-handbook

[English](./README.md)

一個 [Claude Code](https://claude.com/claude-code) skill：把任何 JS/TS 專案變成
**雙受眾專案手冊**——給人看的是可瀏覽的 HTML 網站，給 AI 看的是同一批 markdown/JSON
資料檔。一份內容、兩種讀法，永遠不會不同步。

![架構頁與 Mermaid 圖](docs/assets/screenshot-architecture.png)
![健康度儀表板](docs/assets/screenshot-health.png)

## 它做什麼

1. **掃描專案** —— 程式碼健康度（過大檔案、未使用 export）、套件新舊與漏洞、git 熱點、
   測試缺口。優先用真實工具（`npm audit`、`knip`、`git log`）；工具跑不動就誠實標
   `unknown`，不編數字。
2. **訪談你**，補足程式碼裡沒有的知識 —— 部署在哪、後端誰維護、團隊怎麼協作、機器容量。
   問題清單由掃描結果客製、一次列齊分批問。答不出來的進 **⚠️ 待確認清單**，附「去問誰
   / 去哪查」，絕不用猜的。
3. **在專案裡產出 `docs-site/`**：
   - `index.html` + 檢視器 —— 側邊欄導覽、Mermaid 架構圖、健康度儀表板，函式庫已內建、
     完全離線可用。
   - `data/*.md` + `health.json` —— 真正的內容。AI 直接讀這些檔案；檢視器把同一批檔案
     渲染給人看。
   - `open-handbook.bat` / `.sh` —— 雙擊就開（需 Node ≥ 18）。

檢視器模板產生後永不更動，AI 只維護 `data/`——更新手冊就是改幾個 markdown 檔，
網站重新整理就是最新的。

每一頁都帶新鮮度標記——「Updated〈日期〉· verified at〈commit〉」。專案更新後重跑會走
**diff 驅動稽核**：只有相關檔案真的變動過的章節才重讀重寫，其餘章節由 git diff 本身
證明仍然正確。

## 安裝

```
/plugin marketplace add shiaushen/project-handbook
/plugin install project-handbook@project-handbook-marketplace
```

或手動把 `skills/project-handbook/` 複製到 `~/.claude/skills/`。

## 使用

在任何 JS/TS 專案對 Claude Code 說：

> 幫專案做手冊

或「專案體檢」「產專案手冊」。專案已有手冊時，重跑會改走**稽核更新**模式而不是整批覆蓋。

## 範圍與需求

- 為 JS/TS 專案設計（npm / pnpm / yarn），其他生態會退化為純 AI 分析。
- 本機瀏覽手冊需 Node ≥ 18。
- 手冊內容語言跟隨你的語言慣例（繁中使用者產繁中手冊）；檢視器 UI 為英文。

## Demo

`examples/demo/` 是對一個虛構專案產出的完整手冊，雙擊
`examples/demo/open-handbook.bat`（或 `.sh`）即可瀏覽。

## 授權

[MIT](./LICENSE)。內建函式庫：[marked](https://github.com/markedjs/marked)（MIT）、
[mermaid](https://github.com/mermaid-js/mermaid)（MIT）。
