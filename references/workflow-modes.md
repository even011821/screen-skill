# 工作模式与构建清单

本文件定义 create、refine、audit、maintain-kit 的执行边界，以及跨 Agent 一致使用的 `ScreenBrief` 和 `build-manifest.json`。

## 模式判断

```text
有 build-manifest + 用户要求局部修改 -> refine
用户只要求检查/诊断 -> audit
用户要新增或维护 kit/meta/catalog -> maintain-kit
其他新建需求 -> create
```

模式只控制读取范围，不改变用户授权。`audit` 默认只读；`refine` 不允许顺便重建未被请求的区域。

## ScreenBrief

把用户自然语言转换为以下结构。字段缺失时记录默认值或假设，不要求用户填写内部术语。

```json
{
  "title": "页面标题",
  "scenario": "行业或业务场景",
  "resolution": "1920x1080",
  "theme": "auto",
  "layoutType": "auto",
  "layoutVariant": "auto",
  "dataSource": "real|mixed|mock-first",
  "contentItems": [
    {
      "id": "stable-id",
      "title": "业务内容名称",
      "type": "kpi|trend|composition|ranking|status|alert|table|process|map|scene|content",
      "priority": 1,
      "source": "real|inferred|mock|missing"
    }
  ],
  "referenceFiles": [],
  "preserve": [],
  "constraints": [],
  "outputMode": "standalone",
  "variationSeed": ""
}
```

通常整理 6–15 项内容。用户未提供内容时创建 8–12 个混合模块；内容过多先聚合为业务主题，不把 15 项机械等同为 15 张卡片。

## Create

1. 规范化 `ScreenBrief`，为每个内容项标记来源。
2. 使用 `scripts/resolve-plan.mjs` 读取轻量 catalog 并输出构建清单。脚本不可用时，按相同优先级手工选择。
3. 只读取 manifest 的 `readNext` 文件。二进制和压缩运行库只看路径，不读取内容。
4. 读取 layout rule 和 variant 后计算槽位；再将选中组件注入槽位。
5. 写入页面、数据、字段映射和 change log。
6. 执行静态校验；具备条件时继续运行与视觉校验。

确定性选择优先级：

```text
用户明确指定
> 硬性兼容条件（resolution/status/size）
> 主题与数据形态得分
> 候选 id 排序
> FNV-1a(project title + layout + variant + theme + resolution + variationSeed)
```

默认选择最高得分。只有最高分相同才用固定 FNV-1a 索引解决平局；相同 brief 必须得到相同结果。需要有意变化时由用户或调用方提供 `variationSeed`。

## Refine

1. 先读 `screen/build-manifest.json`、用户点名的文件及相邻实现。
2. 将用户要求加入 `preserve` 或本次 `changes`；已有用户资源优先级高于旧 manifest。
3. 只加载对应规则：例如边框只需 Shell meta/CSS，图表渐变只需图表代码，TopNav 字号只需已选 TopNav meta/overlay。
4. 不重新选择 layout、variant、theme、TopNav、CardShell、PanelShell、background，除非用户明确要求或原资源已不存在。
5. 只验证受影响区域，再执行一次页面级静态检查；有截图能力时补视觉检查。
6. 更新 manifest 的选择、preserve、fallbacks 和 validation，不清除未修改区域的记录。

如果旧项目没有 manifest，先从现有 HTML/CSS/assets 反向生成最小 manifest；不要直接按 create 重做页面。

## Audit

1. 不修改文件。
2. 运行 `scripts/validate-screen.mjs` 并读取相关页面代码。
3. 有浏览器时检查目标画布、溢出、碰撞、间距、字体和图表。
4. 按“现象、原因、证据、建议”输出，不把未执行的运行/视觉校验描述为已通过。

## Maintain Kit

1. 只在维护模式读取 Figma/map source map。
2. 更新组件本地文件、meta、分支 catalog 和 kit 统计。
3. 运行 `scripts/audit-catalogs.mjs`。
4. 使用组件预览验证，不把预览 HTML 复制到生成页面。

## 构建清单最小结构

```json
{
  "schemaVersion": "2.2.0",
  "mode": "create",
  "brief": {},
  "selection": {
    "layoutType": "",
    "layoutVariant": "",
    "theme": "",
    "topNav": {},
    "cardShellStyleLock": {},
    "panelShell": {},
    "background": {}
  },
  "contentPlan": [],
  "readNext": [],
  "runtimeFiles": [],
  "copyOnlyAssets": [],
  "preserve": [],
  "assumptions": [],
  "fallbacks": [],
  "validation": {
    "highestCompleted": "static|runtime|visual",
    "checks": []
  }
}
```

构建清单是 refine 的入口，也是防止幻觉和资源漂移的依据。清单中的路径必须相对 Skill 根目录或生成目录，禁止写死用户主目录。
