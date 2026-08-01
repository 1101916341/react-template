import React, { useState } from 'react'
import { Alert, AutoComplete, Button, Card, Col, Collapse, Descriptions, Form, Input, InputNumber, List, message, Row, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import { connect } from 'react-redux'

import {
  GlobalStats,
  CrossPeriodStats,
  DistributionItem,
  SumBin,
  RatioRun,
  analyzeGlobalStats,
  analyzeCrossPeriod
} from './analyzer'
import { PredictionResult, VerifyResult, VerifyRecord, HotColdResult, GroupFeatures, COMBINATION_COUNT } from './types'
import { extract_all_features, theoreticalProbabilities, validateGroup, sortGroup } from './skills'
import { fetchRacingData, ApiRow, ApiFetchParams } from '@/api/dataParsing'
import { predictNext } from './predictor'
import { verifyDraw, createVerifyRecord, parseGroupText } from './verify'
import { loadSampleData, parseInputText, groupsToText, SAMPLE_SIZE } from './sampleData'

const { Title } = Typography
const { TextArea } = Input
const { TabPane } = Tabs

const STORAGE_KEY = 'parse1-verify-records'

// ============================================================
// 通用小表格组件
// ============================================================
const distColumns: any[] = [
  { title: '形态', dataIndex: 'label', key: 'label' },
  { title: '出现次数', dataIndex: 'count', key: 'count', sorter: (a: any, b: any) => a.count - b.count },
  { title: '占比(%)', dataIndex: 'frequency', key: 'frequency', sorter: (a: any, b: any) => a.frequency - b.frequency }
]

const DistTable = ({ data }: { data: DistributionItem[] }) => (
  <Table size='small' rowKey='label' columns={distColumns} dataSource={data} pagination={false} />
)

const sumColumns: any[] = [
  { title: '和值区间', dataIndex: 'bin', key: 'bin' },
  { title: '出现次数', dataIndex: 'count', key: 'count', sorter: (a: any, b: any) => a.count - b.count },
  { title: '占比(%)', dataIndex: 'frequency', key: 'frequency', sorter: (a: any, b: any) => a.frequency - b.frequency }
]

const SumBinTable = ({ data }: { data: SumBin[] }) => (
  <Table size='small' rowKey='bin' columns={sumColumns} dataSource={data} pagination={false} />
)

const hotColdColumns: any[] = [
  { title: '号码', dataIndex: 'number', key: 'number' },
  { title: '出现次数', dataIndex: 'count', key: 'count', sorter: (a: any, b: any) => a.count - b.count },
  { title: '出现频率(%)', dataIndex: 'frequency', key: 'frequency', sorter: (a: any, b: any) => a.frequency - b.frequency },
  { title: '当前遗漏期数', dataIndex: 'missCount', key: 'missCount', sorter: (a: any, b: any) => a.missCount - b.missCount }
]

const HotColdTable = ({ data }: { data: HotColdResult }) => (
  <Table size='small' rowKey='number' columns={hotColdColumns} dataSource={data.frequencies} pagination={false} />
)

const runColumns: any[] = [
  { title: '形态', dataIndex: 'label', key: 'label' },
  { title: '最长连出(期)', dataIndex: 'maxRun', key: 'maxRun', sorter: (a: any, b: any) => a.maxRun - b.maxRun },
  { title: '平均连出(期)', dataIndex: 'avgRun', key: 'avgRun', sorter: (a: any, b: any) => a.avgRun - b.avgRun }
]

const RunTable = ({ data }: { data: RatioRun[] }) => (
  <Table size='small' rowKey='label' columns={runColumns} dataSource={data} pagination={false} />
)

const repeatedColumns: any[] = [
  { title: '组合', dataIndex: 'key', key: 'key' },
  { title: '重复次数', dataIndex: 'count', key: 'count', sorter: (a: any, b: any) => a.count - b.count }
]

// 接口拉取原始数据表格列
const apiRowColumns: any[] = [
  { title: 'Id', dataIndex: 'id', key: 'id', width: 100, sorter: (a: any, b: any) => a.id - b.id },
  { title: 'DrawAt1', dataIndex: 'drawAt1', key: 'drawAt1', width: 130 },
  { title: 'DrawAt2', dataIndex: 'drawAt2', key: 'drawAt2', width: 100 },
  { title: 'H1', dataIndex: 'h1', key: 'h1', width: 70 },
  { title: 'H2', dataIndex: 'h2', key: 'h2', width: 70 },
  { title: 'H3', dataIndex: 'h3', key: 'h3', width: 70 },
  { title: 'H4', dataIndex: 'h4', key: 'h4', width: 70 },
  { title: 'H5', dataIndex: 'h5', key: 'h5', width: 70 },
  { title: '组合', dataIndex: 'hGroupText', key: 'hGroupText', width: 150 },
  { title: '和值', dataIndex: 'sum', key: 'sum', width: 70, sorter: (a: any, b: any) => a.sum - b.sum },
  { title: '商值', dataIndex: 'quotient', key: 'quotient', width: 70 },
  { title: '余值', dataIndex: 'remainder', key: 'remainder', width: 70 },
  { title: '平均值', dataIndex: 'average', key: 'average', width: 80 },
  { title: '跨度', dataIndex: 'range', key: 'range', width: 70 }
]

// 实际频率 vs 理论概率对照表（奇偶 / 大小）
const mergeTheory = (dist: DistributionItem[], isOddEven: boolean) => {
  const theory = theoreticalProbabilities()
  return dist
    .filter(d => (isOddEven ? d.label.includes('奇') : d.label.includes('小')))
    .map(d => {
      const t = theory.find(x => x.key === d.label)
      return {
        label: d.label,
        count: d.count,
        frequency: d.frequency,
        theoryCount: t ? t.count : '-',
        theoryPercent: t ? (t.expected * 100).toFixed(2) : '-'
      }
    })
}

const ObservedVsTheoryTable = ({ data, isOddEven }: { data: DistributionItem[]; isOddEven: boolean }) => {
  const rows = mergeTheory(data, isOddEven)
  const columns: any[] = [
    { title: '形态', dataIndex: 'label', key: 'label' },
    { title: '出现次数', dataIndex: 'count', key: 'count' },
    { title: '实际占比(%)', dataIndex: 'frequency', key: 'frequency' },
    { title: '理论组合数', dataIndex: 'theoryCount', key: 'theoryCount' },
    { title: '理论占比(%)', dataIndex: 'theoryPercent', key: 'theoryPercent' }
  ]
  return <Table size='small' rowKey='label' columns={columns} dataSource={rows} pagination={false} />
}

// ============================================================
// 主组件
// ============================================================
const Parse1 = () => {
  const [rawText, setRawText] = useState('')
  const [groups, setGroups] = useState<number[][]>([])
  const [features, setFeatures] = useState<GroupFeatures[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [crossStats, setCrossStats] = useState<CrossPeriodStats | null>(null)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [verifyText, setVerifyText] = useState('')
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifyRecords, setVerifyRecords] = useState<VerifyRecord[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      return saved ? (JSON.parse(saved) as VerifyRecord[]) : []
    } catch (e) {
      return []
    }
  })
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchForm] = Form.useForm()
  const [fetchLoading, setFetchLoading] = useState(false)
  const [apiRows, setApiRows] = useState<ApiRow[]>([])
  const [fetchErrors, setFetchErrors] = useState<string[]>([])

  // 核心分析流程：批量提取特征 → 全局统计 → 跨期统计
  const runAnalysis = (source: number[][]) => {
    const nextFeatures = source.map(g => extract_all_features(g))
    setGroups(source)
    setFeatures(nextFeatures)
    setGlobalStats(analyzeGlobalStats(source, nextFeatures))
    setCrossStats(analyzeCrossPeriod(source))
    setPrediction(null)
    setVerifyResult(null)
  }

  const handleLoadSample = () => {
    // 从 samples.json 读取示例数据（不再随机生成），生成逻辑见 scripts/generateSampleData.ts
    const { groups: sample, errors } = loadSampleData()
    setRawText(groupsToText(sample))
    setParseErrors(errors)
    runAnalysis(sample)
    if (errors.length > 0) {
      message.warning(`已加载 ${sample.length} 期示例数据，${errors.length} 行校验失败已忽略`)
    } else {
      message.success(`已加载 ${sample.length} 期示例数据并完成分析`)
    }
  }

  // 接口拉取 → 处理（校验 / 排序）→ 自动进入分析流程
  const handleFetchApi = async (values: ApiFetchParams) => {
    setFetchLoading(true)
    setFetchErrors([])
    setApiRows([])
    try {
      const { rows, errors } = await fetchRacingData(values)
      setFetchErrors(errors)
      if (rows.length === 0) {
        message.warning('未从接口解析到有效行，请检查接口地址 / _t_ / Cookie / ID 参数')
        return
      }
      // 处理：仅保留符合 11选5 硬约束（5 个不重复数字，1~11）的行
      const groups: number[][] = []
      const invalid: string[] = []
      rows.forEach((r, idx) => {
        const err = validateGroup(r.hGroup)
        if (err) {
          invalid.push(`#${idx + 1} (Id=${r.id})：${err}`)
        } else {
          groups.push(sortGroup(r.hGroup))
        }
      })
      if (groups.length === 0) {
        setFetchErrors(prev => [...prev, ...invalid.slice(0, 10)])
        message.warning('接口返回的数据均不符合 11选5 硬约束，未进入分析')
        return
      }
      setApiRows(rows)
      setRawText(groupsToText(groups))
      runAnalysis(groups)
      message.success(`接口拉取 ${rows.length} 期，有效 ${groups.length} 期，已自动进入分析`)
    } catch (e: any) {
      message.error(`接口调用失败：${e?.message || String(e)}`)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleAnalyze = () => {
    const { groups: parsedGroups, errors } = parseInputText(rawText)
    setParseErrors(errors)
    if (parsedGroups.length === 0) {
      message.warning('未解析到有效数据，请检查输入格式')
      return
    }
    setLoading(true)
    // 同步计算量很小，延迟一拍让 loading 态先渲染
    window.setTimeout(() => {
      runAnalysis(parsedGroups)
      setLoading(false)
      message.success(`解析成功 ${parsedGroups.length} 期，无效行 ${errors.length} 行已忽略`)
    }, 30)
  }

  const handleClear = () => {
    setRawText('')
    setGroups([])
    setFeatures([])
    setGlobalStats(null)
    setCrossStats(null)
    setPrediction(null)
    setVerifyResult(null)
    setParseErrors([])
    message.info('已清空')
  }

  const handlePredict = () => {
    if (!globalStats || !crossStats || groups.length === 0) {
      message.warning('请先加载 / 解析数据')
      return
    }
    const next = predictNext(groups, globalStats, crossStats)
    setPrediction(next)
    setVerifyText(next.primary.join(','))
    message.success('下期预测已生成')
  }

  const handleVerify = () => {
    if (!prediction || !globalStats || groups.length === 0) {
      message.warning('请先生成下期预测')
      return
    }
    const { nums, error } = parseGroupText(verifyText)
    if (error || !nums) {
      message.warning(error || '解析失败')
      return
    }
    const result = verifyDraw(prediction, nums, groups, globalStats, globalStats.comboCountMap)
    setVerifyResult(result)
    const record = createVerifyRecord(prediction, nums, result)
    const nextRecords = [record, ...verifyRecords]
    setVerifyRecords(nextRecords)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords))
    } catch (e) {
      // 忽略存储异常
    }
    message.info(result.matched ? '命中主推组合' : '未命中，已记录偏差分析')
  }

  const handleClearRecords = () => {
    setVerifyRecords([])
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      // 忽略存储异常
    }
  }

  // 导出接口拉取的原始数据为 JSON（与旧版 racing_日期.json 格式一致）
  const handleExportApiJson = () => {
    const exportData = apiRows.map(r => ({
      Id: r.id,
      DrawAt1: r.drawAt1,
      DrawAt2: r.drawAt2,
      H6: r.hGroupText,
      sum: r.sum,
      quotient: r.quotient,
      remainder: r.remainder,
      average: r.average,
      range: r.range
    }))
    const blob = new Blob([JSON.stringify({ data: exportData }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `racing_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const recordColumns: any[] = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
    { title: '预测主推', dataIndex: 'predicted', key: 'predicted' },
    { title: '实际结果', dataIndex: 'actual', key: 'actual' },
    { title: '重合数', dataIndex: 'overlap', key: 'overlap', width: 80, sorter: (a: any, b: any) => a.overlap - b.overlap },
    {
      title: '是否命中',
      dataIndex: 'matched',
      key: 'matched',
      width: 90,
      render: (v: boolean) => (v ? <Tag color='green'>命中</Tag> : <Tag color='red'>未命中</Tag>)
    },
    { title: '问题定位', dataIndex: 'issueSummary', key: 'issueSummary' }
  ]

  return (
    <Card className='card'>
      <Title level={4}>11选5 号码规律挖掘引擎</Title>
      <Alert
        type='info'
        showIcon
        style={{ marginBottom: 16 }}
        message='底层硬约束'
        description='全集 S={1~11} 共 11 个不重复自然数；每组抽取 5 个不重复数字；纯组合上限 C(11,5)=462、有序排列 P(11,5)=55440。重复组合频次本身即是最重要规律。'
      />

      <Space style={{ marginBottom: 16 }}>
        <Button type='primary' loading={loading} onClick={handleLoadSample}>
          加载示例数据({SAMPLE_SIZE}期)
        </Button>
        <Button type='default' onClick={handleAnalyze}>
          开始分析
        </Button>
        <Button type='default' onClick={handlePredict}>
          生成下期预测
        </Button>
        <Button type='default' onClick={handleClear}>
          清空
        </Button>
      </Space>

      <Card size='small' title='① 接口拉取数据（处理后自动进入分析）' style={{ marginBottom: 16 }}>
        <Form
          form={fetchForm}
          layout='vertical'
          onFinish={handleFetchApi}
          initialValues={{ idMode: 'increment', loopCount: 1, initId: 1 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label='接口地址' name='apiUrl' rules={[{ required: true, message: '请输入接口地址' }]}>
                <AutoComplete
                  placeholder='http/https 或 /Ha1/... 相对路径'
                  options={[{ value: '/Ha1/GetLastResults' }, { value: '/Ha1/GetLastResults?page=1' }]}
                  filterOption={(inputValue, option) =>
                    option ? option.value.toUpperCase().includes(inputValue.toUpperCase()) : false
                  }
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='请求头 _t_' name='headerT' rules={[{ required: true, message: '请输入 _t_ 值' }]}>
                <Input placeholder='headers 的 _t_ 字段值' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='Cookie' name='headerCookie' rules={[{ required: true, message: '请输入 Cookie' }]}>
                <Input placeholder='请求 headers 的 Cookie' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='初始 ID' name='initId' rules={[{ required: true, message: '请输入初始 ID' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='ID 模式' name='idMode' rules={[{ required: true, message: '请选择模式' }]}>
                <Select style={{ width: '100%' }}>
                  <Select.Option value='increment'>递增(+10)</Select.Option>
                  <Select.Option value='decrement'>递减(-10)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='循环次数' name='loopCount' rules={[{ required: true, message: '请输入循环次数' }]}>
                <InputNumber min={1} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label=' ' colon={false}>
                <Button type='primary' htmlType='submit' loading={fetchLoading} style={{ width: '100%' }}>
                  开始调用并分析
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {fetchErrors.length > 0 && (
          <Alert
            type='warning'
            showIcon
            style={{ marginBottom: 8 }}
            message={`接口调用共 ${fetchErrors.length} 个异常（已跳过）`}
            description={fetchErrors.slice(0, 5).join('；') + (fetchErrors.length > 5 ? `；…等 ${fetchErrors.length} 条` : '')}
          />
        )}

        {apiRows.length > 0 && (
          <Collapse style={{ marginBottom: 8 }}>
            <Collapse.Panel
              header={`已拉取 ${apiRows.length} 期原始数据（H1~H5 → 校验 5 个不重复数字(1~11) → 排序 → 自动分析）`}
              key='raw'
            >
              <Space style={{ marginBottom: 8 }}>
                <Button size='small' type='default' onClick={handleExportApiJson}>
                  导出 JSON
                </Button>
              </Space>
              <Table
                size='small'
                rowKey='key'
                columns={apiRowColumns}
                dataSource={apiRows}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            </Collapse.Panel>
          </Collapse>
        )}
      </Card>

      <Form layout='vertical' style={{ marginBottom: 24 }}>
        <Form.Item label='② 历史数据（每行一组，5 个数字，逗号 / 空格分隔；支持 JSON 数组行 [1,2,3,4,5]；接口拉取后会自动回填本框）'>
          <TextArea
            rows={8}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={'1,2,3,4,5\n6,7,8,9,10'}
          />
        </Form.Item>
      </Form>

      {parseErrors.length > 0 && (
        <Alert
          type='warning'
          showIcon
          style={{ marginBottom: 16 }}
          message={`共 ${parseErrors.length} 行无效数据已忽略`}
          description={parseErrors.slice(0, 5).join('；') + (parseErrors.length > 5 ? `；…等 ${parseErrors.length} 条` : '')}
        />
      )}

      {globalStats && crossStats && (
        <>
          <Card size='small' title='数据概览' style={{ marginBottom: 16 }}>
            <Descriptions column={4} size='small' bordered>
              <Descriptions.Item label='总期数'>{globalStats.total}</Descriptions.Item>
              <Descriptions.Item label='纯组合上限'>{COMBINATION_COUNT}</Descriptions.Item>
              <Descriptions.Item label='出现过的组合数'>{globalStats.uniqueCombinationCount}</Descriptions.Item>
              <Descriptions.Item label='重复组合总次数'>{globalStats.duplicateCount}</Descriptions.Item>
              <Descriptions.Item label='平均和值'>{globalStats.sumStats.mean}</Descriptions.Item>
              <Descriptions.Item label='和值中位数'>{globalStats.sumStats.median}</Descriptions.Item>
              <Descriptions.Item label='和值范围'>{`${globalStats.sumStats.min} ~ ${globalStats.sumStats.max}`}</Descriptions.Item>
              <Descriptions.Item label='和值众数区间'>{globalStats.sumStats.modeBins.join(',')}</Descriptions.Item>
              <Descriptions.Item label='三区全覆盖占比'>{`${globalStats.balancedZoneRate}%`}</Descriptions.Item>
              <Descriptions.Item label='最大重复组合'>
                {globalStats.topRepeated[0] ? `${globalStats.topRepeated[0].key} × ${globalStats.topRepeated[0].count} 次` : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Tabs defaultActiveKey='features' style={{ marginBottom: 16 }}>
            <TabPane tab='单组特征统计' key='features'>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size='small' title='奇偶配比（实际 vs 理论）'>
                    <ObservedVsTheoryTable data={globalStats.oddEvenDist} isOddEven />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='大小配比（实际 vs 理论）'>
                    <ObservedVsTheoryTable data={globalStats.bigSmallDist} isOddEven={false} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='和值区间分布'>
                    <SumBinTable data={globalStats.sumBins} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='三区分布（低1~4 / 中5~8 / 高9~11）'>
                    <DistTable data={globalStats.zoneDist} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='连号结构'>
                    <DistTable data={globalStats.consecutiveDist} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='结构标签（全散 / 短连 / 长连 / 扎堆）'>
                    <DistTable data={globalStats.patternTagDist} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='质合分布'>
                    <DistTable data={globalStats.primeCompositeDist} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='尾数不重复个数分布'>
                    <DistTable data={globalStats.tailDistinctDist} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='高频重复组合 TOP10'>
                    <Table
                      size='small'
                      rowKey='key'
                      columns={repeatedColumns}
                      dataSource={globalStats.topRepeated}
                      pagination={false}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size='small' title='全局冷热号（热号 / 冷号 / 遗漏）'>
                    <HotColdTable data={globalStats.hotCold} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size='small' title='热号与冷号速览'>
                    <Descriptions column={1} size='small' bordered>
                      <Descriptions.Item label='热号 TOP3'>
                        {globalStats.hotCold.hotTop.map(f => (
                          <Tag color='red' key={f.number}>
                            {f.number}({f.frequency}%)
                          </Tag>
                        ))}
                      </Descriptions.Item>
                      <Descriptions.Item label='冷号 BOTTOM3'>
                        {globalStats.hotCold.coldBottom.map(f => (
                          <Tag color='gray' key={f.number}>
                            {f.number}({f.frequency}%)
                          </Tag>
                        ))}
                      </Descriptions.Item>
                      <Descriptions.Item label='当前遗漏最多 TOP3'>
                        {globalStats.hotCold.missedTop.map(f => (
                          <Tag color='orange' key={f.number}>
                            {f.number}(漏{f.missCount}期)
                          </Tag>
                        ))}
                      </Descriptions.Item>
                      <Descriptions.Item label='均衡分散(三区覆盖)占比'>{`${globalStats.balancedZoneRate}%`}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab='跨期规律' key='cross'>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size='small' title='相邻两期重号分布'>
                    <DistTable data={crossStats.repeatDist} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='相邻两期斜连号分布'>
                    <DistTable data={crossStats.slantedDist} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size='small' title='和值波动'>
                    <Descriptions column={1} size='small' bordered>
                      <Descriptions.Item label='历史平均和值'>{crossStats.sumTrend.avgSum}</Descriptions.Item>
                      <Descriptions.Item label='走高次数 / 走低次数'>
                        {`${crossStats.sumTrend.upCount} / ${crossStats.sumTrend.downCount}`}
                      </Descriptions.Item>
                      <Descriptions.Item label='最大连续走高 / 走低'>
                        {`${crossStats.sumTrend.maxUpStreak} / ${crossStats.sumTrend.maxDownStreak}`}
                      </Descriptions.Item>
                      <Descriptions.Item label='当前趋势'>
                        {crossStats.sumTrend.currentDirection === 'up'
                          ? '连续走高'
                          : crossStats.sumTrend.currentDirection === 'down'
                          ? '连续走低'
                          : '持平'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size='small' title='奇偶配比连出惯性（最长 / 平均连续同配比）'>
                    <RunTable data={crossStats.oddEvenRun} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size='small' title='大小配比连出惯性'>
                    <RunTable data={crossStats.bigSmallRun} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size='small' title={`近 ${crossStats.recentWindow} 期冷热轮动`}>
                    <HotColdTable data={crossStats.recentHotCold} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size='small' title='近 N 期冷热速览'>
                    <Descriptions column={1} size='small' bordered>
                      <Descriptions.Item label='近N期热号'>
                        {crossStats.recentHotCold.hotTop.map(f => (
                          <Tag color='red' key={f.number}>
                            {f.number}({f.frequency}%)
                          </Tag>
                        ))}
                      </Descriptions.Item>
                      <Descriptions.Item label='近N期冷号'>
                        {crossStats.recentHotCold.coldBottom.map(f => (
                          <Tag color='gray' key={f.number}>
                            {f.number}({f.frequency}%)
                          </Tag>
                        ))}
                      </Descriptions.Item>
                      <Descriptions.Item label='相邻期对数'>{`${crossStats.pairCount}`}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </>
      )}

      {prediction && (
        <Card size='small' title='下期预测' style={{ marginBottom: 16 }}>
          <Descriptions column={2} size='small' bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label='主推组合'>
              <Space>
                {prediction.primary.map(n => (
                  <Tag color='blue' key={n}>
                    {n}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label='期望形态'>
              {`${prediction.expected.oddEven} / ${prediction.expected.bigSmall} / ${prediction.expected.zone}`}
            </Descriptions.Item>
            <Descriptions.Item label='期望和值区间'>{`${prediction.expected.sumRange[0]} ~ ${prediction.expected.sumRange[1]}`}</Descriptions.Item>
            <Descriptions.Item label='期望重号数'>{prediction.expected.repeatFromLast}</Descriptions.Item>
            <Descriptions.Item label='主推特征'>
              {`和值 ${prediction.primaryFeatures.math.sum} / ${prediction.primaryFeatures.oddEven.label} / ${prediction.primaryFeatures.bigSmall.label} / ${prediction.primaryFeatures.zone.label} / ${prediction.primaryFeatures.consecutive.desc}`}
            </Descriptions.Item>
            <Descriptions.Item label='备选组合'>
              {prediction.alternates.map((alt, idx) => (
                <div key={idx}>
                  {idx + 1}. {alt.join(',')}
                </div>
              ))}
            </Descriptions.Item>
          </Descriptions>

          <Title level={5} style={{ marginTop: 8 }}>
            推理依据（为什么会这样）
          </Title>
          <List
            size='small'
            bordered
            dataSource={prediction.reasons}
            renderItem={item => (
              <List.Item>
                <Space align='start'>
                  <Tag color='geekblue'>{item.dimension}</Tag>
                  <span>{item.description}</span>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card size='small' title='校验反馈（结果不一致时自动定位问题并记录复盘）'>
        <Space style={{ marginBottom: 16 }}>
          <Input
            style={{ width: 320 }}
            placeholder='实际开奖结果，如 1,2,3,4,5'
            value={verifyText}
            onChange={e => setVerifyText(e.target.value)}
            onPressEnter={handleVerify}
          />
          <Button type='primary' onClick={handleVerify}>
            校验
          </Button>
          <Button type='default' onClick={handleClearRecords}>
            清空记录
          </Button>
        </Space>

        {groups.length > 0 && (
          <Alert
            type='info'
            showIcon
            style={{ marginBottom: 16 }}
            message='提示'
            description={`当前数据末期为 ${groups[groups.length - 1].join(',')}，校验时以此作为"上期"计算重号 / 斜连号。可先填入主推组合测试命中，再填入真实开奖结果复盘。`}
          />
        )}

        {verifyResult && (
          <Alert
            type={verifyResult.matched ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
            message='校验结论'
            description={
              <>
                <div style={{ marginBottom: 8 }}>{verifyResult.conclusion}</div>
                <List
                  size='small'
                  dataSource={verifyResult.issues}
                  renderItem={item => (
                    <List.Item>
                      <Space align='start'>
                        <Tag color={item.level === 'error' ? 'red' : item.level === 'warn' ? 'orange' : 'green'}>
                          {item.dimension}
                        </Tag>
                        <span>{item.message}</span>
                      </Space>
                    </List.Item>
                  )}
                />
              </>
            }
          />
        )}

        <Table
          rowKey='id'
          size='small'
          columns={recordColumns}
          dataSource={verifyRecords}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </Card>
  )
}

function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Parse1)







