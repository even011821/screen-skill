# Screen Skill 回归样例

`briefs/` 固化六套已批准主题组合的相同输入；`expected/approved-profile-selections.json` 固化规划器应复现的主题、TopNav、CardShell、PanelShell 与背景。

运行静态回归：

```powershell
node scripts/run-regression.mjs
```

同时重跑浏览器几何审计：

```powershell
node scripts/run-regression.mjs --runtime
```

浏览器审计需要 Playwright 和本机 Chromium/Edge。Codex 工作区应将已配置的 Node 包目录放入 `NODE_PATH`。回归失败时不要自动覆盖 expected；先判断是有意调整候选，还是规则、meta 或资源发生漂移。
