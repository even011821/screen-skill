# 通用与国产 Agent 兼容规则

核心工作流不依赖 Codex、OpenCode 或任何单一 Agent 的工具名。Agent 只需要按能力执行并记录降级。

## 能力分级

| 能力 | 必需性 | 无能力时处理 |
|---|---|---|
| 读取/写入文本文件 | 必需 | 无法执行 Skill |
| JSON 解析 | 必需 | 使用 Agent 自带解析能力，不能凭记忆解释 catalog |
| Node.js | 推荐 | 手工按相同确定性规则生成 manifest，并完成静态路径检查 |
| Shell | 可选 | 直接调用等价文件/API 工具 |
| 浏览器 | 可选 | 只声明 static 校验完成，不声称视觉通过 |
| 截图/视觉检查 | 可选 | 记录未执行 visual 校验 |
| Figma/设计连接器 | 维护或明确设计还原时可选 | 使用用户导出的图片/本地资源，并说明还原边界 |

## 可移植性约束

- Skill 内部路径全部相对 Skill 根目录；输出路径相对用户项目目录。
- 不写死 `~/.codex`、`~/.config/opencode`、Windows 用户目录或某个用户名。
- 脚本只使用 Node.js 标准库，不依赖 npm、PyYAML、jq 或网络安装。
- 页面运行不依赖 CDN、远程字体、远程地图或临时设计资源 URL。
- 支持 Windows、Linux、macOS 路径；脚本使用 `node:path`，HTML 使用 `/` 相对 URL。
- 默认中文字体回退：`Microsoft YaHei`, `PingFang SC`, `HarmonyOS Sans SC`, `Source Han Sans SC`, `Noto Sans CJK SC`, sans-serif。组件 meta 明确指定并提供本地字体时，以 meta 为准。

## 工具映射

不同 Agent 可以使用任意等价工具：

```text
read file      -> 文件读取/API/终端
search text    -> rg/grep/IDE 搜索
apply edit     -> patch/编辑器/文件 API
run script     -> Node.js/终端/任务执行器
browser verify -> 内置浏览器/Chrome/Playwright/人工预览
```

adapter 只描述安装位置、权限和能力映射，不得复制完整业务工作流。业务逻辑始终以 `SKILL.md`、catalog 和 references 为准。

## 结果声明

交付时明确记录：

- 使用的 Agent 能力。
- 已完成的最高校验等级。
- 未执行的浏览器、截图或设计连接器校验。
- 所有 fallback、假设和模拟数据。

不得因为某项能力缺失而伪造校验通过，也不得因此改变用户已指定的设计或数据。
