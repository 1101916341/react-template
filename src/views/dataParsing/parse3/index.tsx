import React, { useState } from 'react'
import { AutoComplete, Button, Card, Form, Input, InputNumber, message, Select, Table, Tabs, Tag, Typography } from 'antd'
import { connect } from 'react-redux'
import DbJsonTable from './dbJsonTable'

const { Title } = Typography

interface DataRow {
  key: string
  id: number
  drawAt1: string
  drawAt2: string
  hGroup: string
  isDuplicate?: boolean
}

// 保存到 db.json 的 lgz 字段时使用的业务数据结构
interface SaveRow {
  Id: number
  DrawAt1: string
  DrawAt2: string
  H6: string
}

type SortOrder = 'ascend' | 'descend' | null

// ============================================================
// 开奖时间解析与排序（用于「按时间升序」存放 JSON 文件）
// ============================================================

// 将开奖时间字段解析为可比较的时间戳，兼容：
//   '2026-05-28 21:30:00' / '2026-05-28T21:30:00' / '2026-05-28'
//   纯数字时间戳（秒级 / 毫秒级）
function parseDrawTime(value: string): number {
  const raw = String(value ?? '').trim()
  if (!raw) return NaN

  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(raw)) {
    const iso = raw.includes(' ') ? raw.replace(' ', 'T') : raw
    const ts = Date.parse(iso)
    if (!Number.isNaN(ts)) return ts
  }

  if (/^\d{1,13}$/.test(raw)) {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return n < 1e12 ? n * 1000 : n
  }

  const ts = Date.parse(raw)
  return Number.isNaN(ts) ? NaN : ts
}

// 单条数据的时间戳：优先 DrawAt1，其次 DrawAt2
function getDrawTimestamp(row: Pick<DataRow, 'drawAt1' | 'drawAt2'>): number {
  const t1 = parseDrawTime(row.drawAt1)
  return Number.isNaN(t1) ? parseDrawTime(row.drawAt2) : t1
}

// 按开奖时间升序排列；时间缺失 / 无法解析时按 Id 升序兜底
function sortRowsByTimeAsc<T extends Pick<DataRow, 'drawAt1' | 'drawAt2' | 'id'>>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ta = getDrawTimestamp(a)
    const tb = getDrawTimestamp(b)
    if (Number.isNaN(ta) && Number.isNaN(tb)) return a.id - b.id
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return ta - tb
  })
}

// 等待指定毫秒数：用于每次接口调用之间的停顿
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const Parse1 = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DataRow[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)

  // 导出 JSON：只包含 Id / DrawAt1 / DrawAt2 / H组合，按开奖时间升序存放
  const downloadJSON = (list: DataRow[]) => {
    const exportData = sortRowsByTimeAsc(list).map((r) => ({
      Id: r.id,
      DrawAt1: r.drawAt1,
      DrawAt2: r.drawAt2,
      H6: r.hGroup
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

  const handleExportJSON = () => {
    downloadJSON(rows)
  }

  function randomIntSeconds(min = 6, max = 23) {
    return Math.floor(Math.random() * (max - min + 1)) + min // 包含 10
  }

  const handleSearch = async (values: {
    apiUrl: string
    headerT: string
    headerCookie: string
    initId: number
    idMode: 'increment' | 'decrement'
    loopCount: number
  }) => {
    const { apiUrl, headerT, headerCookie, initId, idMode, loopCount } = values

    setLoading(true)
    setRows([])
    setSortOrder(null)

    const newRows: DataRow[] = []
    // 待保存到 db.json 的 lgz 字段（仅成功解析到的数据）
    const saveData: SaveRow[] = []

    try {
      for (let i = 0; i < loopCount; i++) {
        const currentId = idMode === 'increment' ? initId + i * 10 : initId - i * 10
        const id = currentId < 0 ? 0 : currentId

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        if (headerT) {
          headers['_t_'] = headerT
        }
        if (headerCookie) {
          headers['Cookie'] = headerCookie
        }

        try {
          const resp = await fetch(apiUrl, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers,
            body: JSON.stringify({ id })
          })
          const text = await resp.text()
          const json = JSON.parse(text)
          const dataArr = json?.d || []
          for (let j = 0; j < dataArr.length; j++) {
            const item = dataArr[j]
            newRows.push({
              key: `${i + 1}-${j + 1}`,
              id: item.Id,
              drawAt1: item.DrawAt1,
              drawAt2: item.DrawAt2,
              hGroup: [item.H1, item.H2, item.H3, item.H4, item.H5].join(', '),
              isDuplicate: false
            })
            saveData.push({
              Id: item.Id,
              DrawAt1: item.DrawAt1,
              DrawAt2: item.DrawAt2,
              H6: [item.H1, item.H2, item.H3, item.H4, item.H5].join(', ')
            })
          }
          console.log(`请求 #${i + 1} 响应`, json)
        } catch (error) {
          newRows.push({
            key: String(i + 1),
            id: id,
            drawAt1: '',
            drawAt2: '',
            hGroup: '0, 0, 0, 0, 0'
          })
          console.error(`请求 #${i + 1} 异常`, error)
        }

        // 每次只调用一个接口，调用完成后停顿 2 秒再继续下一次调用
        if (i < loopCount - 1) {
          await sleep(randomIntSeconds() * 1000)
        }
      }
    } finally {
      // 默认按开奖时间升序排列所有数据（时间缺失 / 无法解析时按 Id 升序兜底）
      const sortedRows = sortRowsByTimeAsc(newRows)
      setSortOrder('ascend')
      setRows(sortedRows)
      setLoading(false)

      if (sortedRows.length > 0) {
        message.success({ content: `已获取 ${sortedRows.length} 条数据` })
      }

      // 保存到 db.json 的 lgz 字段（批量处理：1 次读取对比 + 1 次批量写入）
      if (saveData.length > 0) {
        await saveToLgz(saveData)
      }
    }
  }

  // 批量保存到 db.json 的 lgz 字段：
  //   1. 存入前先去重：一次性获取 lgz 全部数据，在前端按 Id 对比去重（同时标注表格中的重复项）
  //   2. 只发送去重后的一维数组，单次接口调用批量写入；
  //      服务端完成「增量合并（保留原有数据）→ 按 Id 升序 → 原子写回 db.json 的 lgz 一维数组」
  const saveToLgz = async (saveData: SaveRow[]) => {
    let existingList: any[] = []
    try {
      const getResp = await fetch('/api/lgz')
      const existing = await getResp.json()
      existingList = Array.isArray(existing) ? existing : []
    } catch (error) {
      // 读取失败不阻断保存：后端会基于 db.json 当前数据再次去重
      console.warn('读取 lgz 已有数据失败，将按全部新增处理', error)
    }

    // 去掉 json-server 自动生成的 id，仅用业务字段 Id 做对比去重
    const existingIds = new Set<number>(
      existingList.map((item: any) => Number(item?.Id)).filter((n: number) => Number.isFinite(n) && n > 0)
    )

    // 对比去重：existingIds 中已存在的记为重复，其余为本次新增
    const toAdd: SaveRow[] = []
    const dupIds = new Set<number>()
    const seen = new Set<number>(existingIds)
    for (const item of saveData) {
      if (seen.has(item.Id)) {
        dupIds.add(item.Id)
      } else {
        seen.add(item.Id)
        toAdd.push(item)
      }
    }

    // 更新表格状态列（新增 / 重复）
    setRows((prev) => prev.map((r) => ({ ...r, isDuplicate: dupIds.has(r.id) })))

    if (toAdd.length === 0) {
      message.success({
        content: `数据已存在于 lgz 中，无新增（重复跳过 ${saveData.length} 条，库中共 ${existingIds.size} 条）`
      })
      return
    }

    try {
      // 存入前已完成去重；发送时按 Id 升序排列、保持一维数组；
      // 服务端完成 增量合并（保留原有 lgz 数据）→ 再次去重 → 按 Id 升序 → 原子写回 db.json
      const sortedToAdd = [...toAdd].sort((a, b) => a.Id - b.Id)
      const saveResp = await fetch('/api/lgz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sortedToAdd)
      })
      const result = await saveResp.json()

      if (result.success) {
        message.success({
          content: `已保存到 lgz，库中共 ${result.total} 条（本次新增 ${result.added} 条，重复跳过 ${result.skipped} 条，按 Id 升序）`
        })
      } else {
        message.error({ content: result.message || '保存到 lgz 失败' })
      }
    } catch (error) {
      console.error('保存到 lgz 失败', error)
      message.error({ content: '保存到 lgz 失败' })
    }
  }

  const handleSortChange = () => {
    setRows((prev) => {
      if (sortOrder === 'ascend') {
        setSortOrder('descend')
        return sortRowsByTimeAsc(prev).reverse()
      }
      setSortOrder('ascend')
      return sortRowsByTimeAsc(prev)
    })
  }

  const handleExportXLSX = () => {
    const key = 'exportXLSX'
    message.loading({ content: '正在生成 Excel...', key })

    // 动态加载 CDN 上的 SheetJS
    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
    script.onload = () => {
      const XLSX = (window as any).XLSX

      // 按 Id 升序排列
      const sortedRows = [...rows].sort((a, b) => a.id - b.id)

      const header = ['Id', 'DrawAt1', 'DrawAt2', 'H组合']
      const data = sortedRows.map((r) => [r.id, r.drawAt1, r.drawAt2, r.hGroup])

      const ws = XLSX.utils.aoa_to_sheet([header, ...data])
      ws['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 22 }]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Racing')
      XLSX.writeFile(wb, `racing_${new Date().toISOString().slice(0, 10)}.xlsx`)

      message.success({ content: 'Excel 文件已导出', key })
    }
    script.onerror = () => {
      message.error({ content: '加载 Excel 库失败，请检查网络', key })
    }
    document.body.appendChild(script)
  }

  const columns = [
    {
      title: 'Id',
      dataIndex: 'id',
      key: 'id',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'isDuplicate',
      key: 'isDuplicate',
      width: 90,
      render: (isDuplicate: boolean | undefined) => {
        if (isDuplicate === undefined) return null
        return isDuplicate ? <Tag color='orange'>重复</Tag> : <Tag color='green'>新增</Tag>
      }
    },
    {
      title: 'DrawAt1',
      dataIndex: 'drawAt1',
      key: 'drawAt1',
      width: 120,
      sortOrder,
      sorter: true
    },
    {
      title: 'DrawAt2',
      dataIndex: 'drawAt2',
      key: 'drawAt2',
      width: 100
    },
    {
      title: 'H组合',
      dataIndex: 'hGroup',
      key: 'hGroup',
      width: 180
    }
  ]

  return (
    <Tabs
      defaultActiveKey='parse'
      items={[
        {
          key: 'parse',
          label: '接口循环调用',
          children: (
            <Card className='card'>
              <Title level={4}>数据解析 - 接口循环调用</Title>
              <Form
                form={form}
                style={{ marginBottom: 24 }}
                onFinish={handleSearch}
                initialValues={{ idMode: 'increment', loopCount: 1, initId: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
                  <Form.Item label='接口地址' name='apiUrl' rules={[{ required: true, message: '请选择或输入接口地址' }]}>
                    <AutoComplete
                      placeholder='请选择或输入 http/https 请求地址'
                      options={[{ value: '/Ha1/GetLastResults' }, { value: '/Ha1/GetLastResults?page=1' }]}
                      filterOption={(inputValue, option) =>
                        option ? option.value.toUpperCase().includes(inputValue.toUpperCase()) : false
                      }
                    />
                  </Form.Item>
                  <Form.Item label='请求头 _t_' name='headerT' rules={[{ required: true, message: '请输入 _t_ 字段值' }]}>
                    <Input placeholder='headers 的 _t_ 字段值' />
                  </Form.Item>
                  <Form.Item label='Cookie' name='headerCookie' rules={[{ required: true, message: '请输入 Cookie' }]}>
                    <Input placeholder='请求 headers 的 Cookie 字段值' />
                  </Form.Item>
                  <Form.Item label='初始 ID' name='initId' rules={[{ required: true, message: '请输入初始 ID 值' }]}>
                    <InputNumber placeholder='body 中 ID 的初始值' min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label='ID 模式' name='idMode' rules={[{ required: true, message: '请选择 ID 变化模式' }]}>
                    <Select style={{ width: '100%' }}>
                      <Select.Option value='increment'>递增</Select.Option>
                      <Select.Option value='decrement'>递减</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label='循环次数' name='loopCount' rules={[{ required: true, message: '请输入循环调用次数' }]}>
                    <InputNumber placeholder='调用接口的次数' min={1} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label=' ' colon={false}>
                    <Button type='primary' htmlType='submit' loading={loading} style={{ width: '100%' }}>
                      开始调用
                    </Button>
                  </Form.Item>
                </div>
              </Form>

              <div style={{ textAlign: 'right', marginBottom: 12 }}>
                <Button type='default' disabled={rows.length === 0} onClick={handleExportJSON} style={{ marginRight: 8 }}>
                  导出 JSON
                </Button>
                <Button type='primary' disabled={rows.length === 0} onClick={handleExportXLSX}>
                  导出 Excel
                </Button>
              </div>

              <Table
                rowKey='key'
                columns={columns}
                dataSource={rows}
                pagination={false}
                scroll={{ x: 500 }}
                onChange={(pagination, filters, sorter) => {
                  handleSortChange()
                }}
              />
            </Card>
          )
        },
        {
          key: 'dbJson',
          label: 'db.json 数据（lgz）',
          children: <DbJsonTable />
        }
      ]}
    />
  )
}

function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Parse1)
