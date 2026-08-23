# TopNav 高度规则

TopNav 高度不能写死。布局必须先选择 `kit/TopNav`，再读取选中导航的 `meta.json` 计算 `HeaderSlot` 和内容区。

`90-120px` 是 1920 主导航的常见范围，不是硬规则。左标题导航、二级导航项、特殊切图可能不在这个范围内，必须按 meta 计算。

## 高度读取优先级

```text
meta.layoutMetrics.reservedHeight
> max(meta.variants[].size.h, meta.size.h, meta.export.outputSize.h)
> fallback 100
```

说明：`meta.size.h` 或 `export.outputSize.h` 可能是纯背景切图高度，不一定等于布局应预留高度。没有 `layoutMetrics` 时，应取候选高度最大值，避免内容区压到导航。

## 二级导航

`SecondNavItem` 不是完整 HeaderSlot，不能单独替代主 TopNav。

使用二级导航时：

```text
1. 先选择主 TopNav。
2. 再选择同一父级下的 SecondNavItem。
3. HeaderSlot 高度以主 TopNav 为基础。
4. 如果二级导航在主导航下方独立占位，则把 SecondNavItem 高度追加到 reservedHeight；如果它覆盖在主导航内部，则不追加。
5. 是否追加必须由具体 meta 或页面实现判断，不能只看 SecondNavItem 自身高度。
```

## 建议 meta 字段

后续补全 TopNav 时建议增加：

```json
{
  "layoutMetrics": {
    "renderHeight": 110,
    "reservedHeight": 110,
    "contentGap": 12
  }
}
```

`renderHeight` 是导航背景实际渲染高度。`reservedHeight` 是布局为导航预留的高度。`contentGap` 是导航和内容区之间的安全间距。

## 内容区计算

```text
contentTop = nav.reservedHeight + nav.contentGap
contentHeight = screenHeight - contentTop - bottomSafePadding
contentLeft = safePadding.left
contentWidth = screenWidth - safePadding.left - safePadding.right
```

1920 画布推荐默认：

```text
safePadding.left = 24
safePadding.right = 24
safePadding.bottom = 24
contentGap fallback = 12
```

## 副标题渲染

TopNav 默认不渲染副标题。即使 `overlay.css` 存在 `.ds-top-nav__subtitle`，也不能自动生成副标题 DOM。

生成时必须读取选中 TopNav 的 `meta.json`：

```text
仅当 meta.titleOverlay.subtitle.enabled === true 时，才生成 `.ds-top-nav__subtitle`。
其他情况不输出副标题元素，也不额外补英文副标题。
```

当前规则：只有 `TopNav/CenterTitle/1920/Style08` 允许副标题；其他 TopNav 均不需要副标题。

## TopNav 可生成内容

TopNav 默认只承担大屏标题和时间信息，不承载业务导航。

默认允许生成：

- 主标题 DOM。
- 日期 DOM。
- 时间 DOM。

默认禁止生成：

- 顶部左侧业务页签、模块按钮、二级业务导航。
- 顶部右侧组织名、系统名、中心名、状态标签、地点标签。
- 天气、温度、告警状态、mock 业务分组入口。
- 未经 `subtitle.enabled` 授权的副标题或英文副标题。

如果用户明确要求顶部业务页签或组织标签，必须先确认所选 TopNav 的 `meta.json` 有对应 slot 或 overlay 约束；否则应把页签放到内容区内的 CardShell/PanelShell 中，不能占用 TopNav 背景两侧。

## 禁止项

- 不允许把顶部内容区固定写成 `top: 90px`、`top: 110px`。
- 不允许假设所有导航高度一致。
- 不允许让业务卡片覆盖 TopNav 背景、标题、日期和时间区域。
- 不允许因为 `overlay.css` 有 subtitle 样式就给所有 TopNav 添加副标题。
- 不允许把 mock 出来的业务分类自动渲染成 TopNav 左侧页签。
- 不允许在 TopNav 右侧自动生成组织名、系统名或中心名；除日期时间外的顶部辅助文本都需要用户明确要求。
