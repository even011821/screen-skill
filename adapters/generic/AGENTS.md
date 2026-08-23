# screen-skill 通用 Agent 入口

将当前文件所在 Skill 目录作为 `skillRoot`，先完整读取 `SKILL.md`，再由其中的运行模式和条件路由决定需要打开的文件。

本 adapter 只负责能力映射：

- 文本读取/写入：使用 Agent 可用的文件工具。
- JSON：必须实际解析，不凭记忆解释 catalog。
- Node.js 可用：优先运行 `scripts/resolve-plan.mjs`、`validate-screen.mjs` 和 `audit-catalogs.mjs`。
- Node.js 不可用：按 `references/workflow-modes.md` 的相同确定性规则手工执行。
- 浏览器或截图不可用：只声明 static 校验完成。

对于豆包模型驱动的 Agent、WorkBuddy 或其他不能自动发现 SKILL.md 的宿主，可将本文件设为项目规则/系统说明入口，但必须让 Agent 同时拥有完整 Skill 目录的读取权限。不要只复制本文件或单独复制 SKILL.md。

开始执行前先确认宿主具备哪些能力；存在能力缺失时读取 references/portable-agent-rules.md，按其中规则降级，不能把未执行的 runtime/visual 校验写成已通过。

不要在 adapter 中复制生成流程，不要写死安装目录，不要读取 copy-only assets 作为说明。业务规则以 `SKILL.md`、catalog 和被路由的 references 为准。
