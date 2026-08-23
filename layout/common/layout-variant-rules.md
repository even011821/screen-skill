# Layout Variant Rules

布局生成必须执行两级判断：

```text
data analysis -> layout_type -> layoutVariant -> slot geometry
```

## 读取顺序

1. 读取 `layout/catalog.json`，确定 `layout_type`。
2. 读取 `layout/{layout_type}/rule.json`，确定槽位职责、主视觉权重和组件倾向。
3. 读取 `layout/{layout_type}/variants/catalog.json`，选择具体空间组织方式。
4. 根据 TopNav 真实高度、contentArea、variant 的比例范围和指标密度计算 panel 坐标。
5. 将最终命中的 `layout_type`、`layoutVariant`、选择原因和每个槽位的业务主题写入 `change-log`。

## 选择规则

- 用户显式指定布局或结构时优先。
- 主对象越强，PrimarySlot 越大，周边 CardShell 越少。
- 指标数量少时，扩大主视觉或核心指标，不强行填满左右栏。
- 指标数量中等时，按业务主题分布到主区邻近位置。
- 指标数量多时，先合并主题，再使用页签、轮播、弹窗或下钻，不在首屏平铺全部卡片。
- 默认选择最高得分 variant；只有最高分相同才使用确定性平局规则。

## 确定性平局规则

多个候选同分时使用可复现的 FNV-1a 规则：

```text
sort equal highest-score candidates by id
seed = FNV-1a(projectTitle + layout_type + layoutVariant + theme + resolution + variationSeed)
pick index = seed % candidateCount
```

相同 brief 和空 `variationSeed` 必须返回相同结果。只有调用方明确需要视觉变化时才设置新的 `variationSeed`；同一页面内仍保持风格统一。

## 禁止项

- 不得跳过 `layoutVariant` 直接生成坐标。
- 不得把 `center_scene_layout`、`map_command_layout` 都落到同一套左 420 / 中 1000 / 右 420 的固定模板。
- 不得固定左侧、右侧、底部卡片数量。
- 不得把 variant 当成 HTML 占位模板；variant 只描述空间组织和比例范围。
- 不得因为要避免滚动条，就牺牲布局差异化直接套旧三列坐标。
