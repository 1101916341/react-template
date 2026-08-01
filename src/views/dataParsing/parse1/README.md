# 11选5 号码规律挖掘引擎（parse1）

> 底层硬约束：全集 `S = {1..11}` 共 11 个不重复自然数；每组抽取 5 个不重复数字。
> 纯组合上限 `C(11,5) = 462`，有序排列 `P(11,5) = 55440`。2000 条数据远超 462，说明组合大量重复，**重复频次本身即是最重要规律**。

## 文件结构

| 文件 | 职责 |
| --- | --- |
| `types.ts` | 底层硬约束常量 + 全部 TypeScript 类型 |
| `skills.ts` | 第一大类 Skill：单组特征提取（可直接注册给 LangChain Agent） |
| `analyzer.ts` | 全局统计（第二/三大类：跨期规律 + 结构分类占比） |
| `predictor.ts` | 下期预测引擎（打分模型 + 结构化推理依据） |
| `verify.ts` | 校验反馈引擎（实际结果 vs 预测/历史的比对与问题定位、记录） |
| `sampleData.ts` | 输入解析 + 示例数据生成器（2000 期，带人为冷热/形态偏差） |
| `index.tsx` | 页面 UI（接口拉取 / 数据输入 → 分析 → 预测 → 校验反馈） |
| `src/api/dataParsing.ts` | 接口拉取层：循环调用 apiUrl（body `{id}`，headers `_t_`/`Cookie`），归一化 `d[].H1~H5` |
| `smoke.test.ts` | 核心引擎冒烟测试（15 个用例） |

## 数据入口（两种）

1. **接口拉取（推荐）**：填写接口地址（如 `/Ha1/GetLastResults`，经 `setupProxy.js` 代理）、请求头 `_t_`、`Cookie`、初始 ID、ID 递增/递减模式、循环次数后点击「开始调用并分析」。
   - 响应格式：`{ d: [ { Id, DrawAt1, DrawAt2, H1..H5 } ] }`（兼容 `data`/`list` 容器、小写 `h1~h5` 字段）。
   - 处理链：`H1~H5 → 校验 5 个不重复数字(1~11) → 升序排序 → 自动回填文本域并 runAnalysis`。
   - 拉取的原始数据可展开查看 / 导出 JSON（`racing_日期.json`）。
2. **手动粘贴**：每行一组 5 个数字（逗号/空格/JSON 数组），点击「开始分析」。

## Skill 工具清单（可直接注册给 LangChain Agent）

| 需求清单函数 | 实现函数（`skills.ts`） | 说明 |
| --- | --- | --- |
| `calc_sum_and_range(group)` | `calc_sum_and_range` | 和值、极差（Max-Min），理论范围 4~10 |
| 基础统计特征 | `calc_math_stats` | 均值 / 中位数 / 方差 / 标准差 |
| `split_odd_even_count(group)` | `split_odd_even_count` | 奇偶个数配比（6 奇 5 偶） |
| `split_big_small_count(group)` | `split_big_small_count` | 大小号配比（分界值 6：5 小 6 大） |
| `calc_zone_distribute(group)` | `calc_zone_distribute` | 低(1~4)/中(5~8)/高(9~11)三区分布 |
| `calc_consecutive_count(group)` | `calc_consecutive_count` | 连号组数、最长连号、连号描述 |
| `calc_gap_diff(group)` | `calc_gap_diff` | 排序后间隔差分、等差结构、跳号统计 |
| 尾数特征 | `calc_tail_features` | 尾数不重复数、重复尾数、尾数奇偶大小 |
| `prime_composite_count(group)` | `prime_composite_count` | 质数 / 合数 / 特殊数字 1 |
| `tag_group_pattern(group)` | `tag_group_pattern` | 结构标签：全散 / 短连 / 长连 / 小号扎堆 / 大号扎堆（含均衡分散标记） |
| `count_repeat_with_last(prev, curr)` | `count_repeat_with_last` | 跨期重号数量 |
| 斜连号 | `count_slanted_consecutive` | 上期 ±1 跟随个数 |
| `get_hot_cold_number(all_data)` | `get_hot_cold_number` | 全局冷热号 + 当前遗漏期数 |
| 批量特征提取 | `extract_all_features` | Agent 主循环一次提取全部特征 |
| 理论概率参考 | `theoreticalProbabilities` | 462 组合下的理论占比对照 |

## 分析引擎

- `analyzer.ts / analyzeGlobalStats`：重复组合 TOP、和值区间、奇偶 / 大小（实际 vs 理论对照）、三区、连号、质合、尾数、结构标签占比、冷热号。
- `analyzer.ts / analyzeCrossPeriod`：相邻期重号分布、斜连分布、奇偶 / 大小配比连出惯性（最长/平均连出）、和值波动（走高走低、均值）、近 N 期（默认 30）冷热轮动。

## 预测引擎（`predictor.ts`）

基于历史统计主流的规则打分模型：

1. 主流奇偶配比、大小配比、三区结构、和值区间（均值±8）、重号目标、斜连目标；
2. 冷热号 / 高遗漏号回补平衡；
3. 随机生成 4000 个候选组合打分排序，取主推 + 5 组备选；
4. 输出逐维度推理依据（为什么会这样）。

> 注意：彩票本质随机，预测输出是"统计形态倾向性"而非确定性结论。

## 校验反馈（`verify.ts`）

用户在"校验反馈"输入实际开奖结果后，引擎逐维度比对并**定位问题、记录复盘**：

- 预测命中度（主推 / 备选重合数）；
- 组合重复频次（是否首现组合）；
- 奇偶 / 大小 / 连号结构是否偏离历史主流；
- 和值是否落在预测区间；
- 重号、斜连号与预测期望对比；
- 冷热号、高遗漏号命中情况；
- 未命中时输出排查建议（随机波动 / 数据缺行错位 / 规则变化），记录保存至 localStorage（`parse1-verify-records`）。

## Agent 整体执行逻辑

```
加载全部数据集
  ↓
循环每条调用 extract_all_features / 各 Skill 提取特征 → 存入结构化表格
  ↓
analyzeGlobalStats + analyzeCrossPeriod 汇总：
  形态占比、冷热 TOP、和值集中区间、连号概率、奇偶主流配比
  ↓
predictNext 输出下期主推 + 备选 + 推理依据
  ↓
用户回填实际结果 → verifyDraw 校验比对 → 不一致则定位问题并记录复盘
```
