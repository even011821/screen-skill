# 豆包、Kimi、WorkBuddy 与通用国产 Agent 安装

本仓库是完整的 Agent Skill 包，不是单文件提示词。安装时必须保留：

    screen-skill/
    ├── SKILL.md
    ├── adapters/
    ├── kit/
    ├── layout/
    ├── references/
    ├── runtime/
    ├── scripts/
    └── themes/

只复制 SKILL.md 会导致布局 catalog、组件 meta、主题、运行库和校验脚本缺失。

## Kimi Code

Kimi Code 原生支持目录形式的 Agent Skills，用户级默认扫描：

    ~/.kimi-code/skills/
    ~/.agents/skills/

### 自动安装

macOS、Linux、WSL：

    curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- kimi

Windows PowerShell：

    $script="$env:TEMP\install-screen-skill.ps1"
    irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
    powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent kimi

如果设置了 KIMI_CODE_HOME，安装器会使用 KIMI_CODE_HOME/skills/screen-skill；否则使用 ~/.kimi-code/skills/screen-skill。

安装后重新打开 Kimi Code 会话，可输入：

    /skill:screen-skill

也可以直接描述需求，让 Kimi 按 description 自动选择。

官方参考：[Kimi Code Agent Skills](https://www.kimi.com/code/docs/kimi-code-cli/customization/skills.html)

## WorkBuddy

推荐使用 WorkBuddy 的本地 Skill 包上传功能：

1. 下载 GitHub 仓库 ZIP，或执行 git clone https://github.com/even011821/screen-skill.git。
2. 确认上传的文件夹或 ZIP 内含完整 screen-skill/SKILL.md 及配套目录。
3. 打开 **专家 · 技能 · 连接器 → 添加技能 → 上传技能**。
4. 选择本地 screen-skill 文件夹或 ZIP，完成导入。
5. 新建会话后输入“使用 screen-skill 创建一个数据大屏”进行验证。

也可以先安装到默认本地目录：

macOS、Linux：

    curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- workbuddy

Windows PowerShell：

    $script="$env:TEMP\install-screen-skill.ps1"
    irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
    powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent workbuddy

默认目录为 ~/.workbuddy/skills/screen-skill。如果当前 WorkBuddy 版本没有自动扫描该目录，请使用界面上传，不要继续猜测其他目录。

官方参考：[WorkBuddy Enterprise 技能](https://cloud.tencent.com/document/product/1831/134432)

## 豆包模型与火山方舟 Agent

豆包是模型/服务系列，是否支持本地 Skill 目录取决于承载它的 Agent 产品。不要把豆包聊天客户端、火山方舟 AgentKit、TRAE 或第三方 Agent 当成同一个安装环境。

### 宿主支持 Skill 包或文件上传

上传完整仓库目录或 ZIP，并将 SKILL.md 设为 Skill 入口。宿主应允许：

- 读取完整 Skill 目录。
- 写入用户项目的 screen/。
- 解析 JSON。
- 可选执行 Node.js、Shell、浏览器或截图工具。

### 宿主只支持项目规则或系统提示词

1. 将完整仓库放在宿主可读取的本地或云端工作区。
2. 把 adapters/generic/AGENTS.md 作为项目规则入口。
3. 告诉 Agent 当前 Skill 根目录 skillRoot 的实际位置。
4. Agent 必须先完整读取 SKILL.md，再按条件加载 references，不能把整个仓库一次塞进上下文。

推荐引导词：

    把 <screen-skill 路径> 作为 skillRoot。先完整读取 SKILL.md，判断
    create/refine/audit/maintain-kit 模式，再只读取入口路由的文件。
    缺少 Node.js 时按相同确定性规则手工生成 manifest；缺少浏览器或
    截图时只声明 static 校验完成。

火山方舟参考：[在 Agent 中集成 Skill](https://docs.volcengine.com/docs/86681/2172382?lang=zh)

## 其他国产或通用 Agent

如果宿主扫描通用 .agents/skills：

    curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- generic

默认安装到：

    ~/.agents/skills/screen-skill

自定义目标路径：

    curl -fsSL https://raw.githubusercontent.com/even011821/screen-skill/main/install.sh | bash -s -- generic /absolute/path/to/screen-skill

Windows：

    $script="$env:TEMP\install-screen-skill.ps1"
    irm https://raw.githubusercontent.com/even011821/screen-skill/main/install.ps1 -OutFile $script
    powershell -NoProfile -ExecutionPolicy Bypass -File $script -Agent generic -Destination "D:\agent-skills\screen-skill"

宿主需要加载 <skillRoot>/SKILL.md。如果宿主不支持自动发现，则加载 <skillRoot>/adapters/generic/AGENTS.md。

## 能力不足时的正确降级

| 宿主能力 | 结果 |
|---|---|
| 文件读写 + JSON | 可执行核心流程 |
| 无 Node.js | 手工生成 manifest，仍需做静态路径检查 |
| 无浏览器 | 最高只声明 runtime 或 static |
| 无截图 | 不声明 visual 通过 |
| 无 Figma/设计连接器 | 使用本地资源或用户提供的参考图，并记录还原边界 |

详细规则见 references/portable-agent-rules.md。

## 安装后验证

让 Agent 执行一个最小 create 测试：

    使用 screen-skill 在当前项目创建一个 1920×1080 数据大屏，至少包含
    6 项业务内容。没有真实数据，全部标记为 mock；输出
    screen/build-manifest.json，并完成可用能力范围内的验证。

最低验收：

- screen/build-manifest.json 存在且 JSON 可解析。
- screen/index.html 可本地打开。
- 业务数据明确标记为 mock。
- Agent 只声明实际完成的最高验证等级。
