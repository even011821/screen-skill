# 主题目录说明

主题以 `themes/catalog.json` 为结构化入口，CSS token 文件位于 `themes/{theme-id}.css`。

| 主题 id | 中文名 | 英文名 | 主色 | 次色 | 适用方向 |
|---|---|---|---|---|---|
| galaxy-azure | 星河灵蓝 | Galaxy Azure | #1C76FD | #4BA687 | 智慧城市、交通、园区、能源、IoT、数字孪生、经营分析 |
| deep-tech-blue | 深空科技蓝 | Deep Tech Blue | #045BF0 | #22D4CC | 科技企业、AI、工业互联网、网络安全、数据中心、智能制造 |
| frost-cyan | 冰境青 | Frost Cyan | #2FEADF | #1596AB | 医疗健康、教育、政务服务、环保水务、科研数据 |
| dusk-rose-gold | 暮砂玫瑰金 | Dusk Rose Gold | #F3F3E9 | #F3BF8F | 文旅、商业地产、金融理财、品牌零售、展馆展陈 |
| ember-orange | 熔光橙红 | Ember Orange | #FFB801 | #E85F12 | 政务党建、应急、安防消防、工业制造、设备告警 |
| fresh-verdant | 森氧清绿 | Fresh Verdant | #11C8A7 | #FFC65C | 农业、环保、双碳、生态、水务、园区能源 |

## 兼容策略

旧主题名只保留在兼容 CSS 文件和 `themes/catalog.json` 的 `aliases` 字段中。新生成的大屏、kit `meta.json`、selection guide、industry prompts 必须使用新版主题 id。

| 旧主题名 | 新主题名 |
|---|---|
| blue-cyan | galaxy-azure |
| deep-blue | deep-tech-blue |
| dark-tech | deep-tech-blue |
| cyan | frost-cyan |
| gold | dusk-rose-gold |
| gold-blue | dusk-rose-gold |
| gold-black | dusk-rose-gold |
| orange-amber | ember-orange |
| red-gold | ember-orange |
| blue-green | fresh-verdant |
| cyan-green | fresh-verdant |
