import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Empty, Input, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'

// db.json 中 lgz 字段的单条数据（/api/lgz 接口归一化后的结构）
interface DbRow {
  Id: number
  DrawAt1: string
  DrawAt2: string
  H6: string
}

// 筛选方式：
//   'gte'    取「当前条件之后」的所有数据（字段值 >= 筛选值，Id 为数字比较）
//   'match'  按「包含」匹配，忽略大小写
type FilterMode = 'gte' | 'match'

interface SearchFieldConfig {
  key: keyof DbRow
  label: string
  placeholder: string
  width: number
  mode: FilterMode
}

// 可搜索字段配置（Id / DrawAt1 / DrawAt2 为区间筛选，H6 为包含匹配）
const SEARCH_FIELDS: SearchFieldConfig[] = [
  { key: 'Id', label: 'Id', placeholder: 'Id ≥ 例如 514244', width: 180, mode: 'gte' },
  { key: 'DrawAt1', label: 'DrawAt1', placeholder: '按 DrawAt1（YYYY-MM-DD）筛选', width: 210, mode: 'gte' },
  { key: 'DrawAt2', label: 'DrawAt2', placeholder: '按 DrawAt2（HH:mm:ss）筛选', width: 210, mode: 'gte' },
  { key: 'H6', label: 'H6', placeholder: '按 H6 包含搜索', width: 240, mode: 'match' }
]

const GTE_KEYS = new Set<keyof DbRow>(['Id', 'DrawAt1', 'DrawAt2'])

// 归一化输入关键字：
//   Id 只保留数字（最多 12 位），避免「514244abc」之类非法输入导致匹配错乱
//   其余字段保留原样（去首尾空白）
function normalizeKeyword(key: keyof DbRow, raw: string): string {
  const trimmed = (raw || '').trim()
  if (key === 'Id') {
    return trimmed.replace(/[^\d]/g, '').slice(0, 12)
  }
  return trimmed
}

// 判断单条数据是否满足某个筛选条件：
//   gte 模式：返回「当前条件之后」的所有数据
//     Id 走数字比较（row.Id >= 输入值，即包含 514244 本身）；
//     DrawAt1/DrawAt2 为固定格式字符串，字典序即时间先后，直接 >= 比较
//   match 模式：H6 组合串按「包含」匹配，忽略大小写
function matchRow(row: DbRow, key: keyof DbRow, keyword: string): boolean {
  if (!keyword) return true
  if (GTE_KEYS.has(key)) {
    if (key === 'Id') {
      const rowNum = row.Id
      const filterNum = Number(keyword)
      return Number.isFinite(rowNum) && Number.isFinite(filterNum) && rowNum >= filterNum
    }
    const value = String(row[key] ?? '')
    return value >= keyword
  }
  return String(row[key] ?? '')
    .toLowerCase()
    .includes(keyword.toLowerCase())
}

const DbJsonTable = () => {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DbRow[]>([])
  const [filters, setFilters] = useState<Partial<Record<keyof DbRow, string>>>({})

  // 从 /api/lgz 读取 db.json 的 lgz 数据：
  //   无论后端返回何种形状，这里统一「清洗字段 → 按 Id 去重 → 按 Id 升序」，
  //   保证 rowKey 唯一、表格展示稳定，避免重复 key / 脏数据导致的渲染告警。
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/lgz')
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`)
      }
      const data = await resp.json()
      const list = Array.isArray(data) ? data : []

      const seen = new Map<number, DbRow>()
      for (const item of list) {
        const id = Number(item && item.Id)
        if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue
        seen.set(id, {
          Id: id,
          DrawAt1: String(item && item.DrawAt1 != null ? item.DrawAt1 : ''),
          DrawAt2: String(item && item.DrawAt2 != null ? item.DrawAt2 : ''),
          H6: String(item && item.H6 != null ? item.H6 : '')
        })
      }

      const sorted = Array.from(seen.values()).sort((a, b) => a.Id - b.Id)
      setRows(sorted)
      message.success({ content: `已加载 ${sorted.length} 条 db.json 数据` })
    } catch (error) {
      console.error('读取 db.json 数据失败', error)
      message.error({ content: '读取 db.json 数据失败' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 所有筛选条件同时生效：Id / DrawAt1 / DrawAt2 取「当前条件之后」的全部数据，H6 按包含匹配
  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      SEARCH_FIELDS.every(({ key }) => matchRow(row, key, normalizeKeyword(key, filters[key] || '')))
    )
  }, [rows, filters])

  const handleFilterChange = (key: keyof DbRow, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setFilters({})
  }

  // 导出「筛选后」的数据为 JSON：
  //   与 db.json 中 lgz 字段同构的「一维数组」，可直接回填到 db.json 的 lgz 字段
  const handleExportJSON = () => {
    if (filteredRows.length === 0) {
      message.warning({ content: '当前没有可导出的数据' })
      return
    }
    const exportData = filteredRows.map((row) => ({
      Id: row.Id,
      DrawAt1: row.DrawAt1,
      DrawAt2: row.DrawAt2,
      H6: row.H6
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lgz_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success({ content: `已导出 ${exportData.length} 条 JSON 数据` })
  }

  // 导出「筛选后」的数据为 Excel（动态加载 CDN 上的 SheetJS，避免打包体积膨胀）
  const handleExportXLSX = () => {
    if (filteredRows.length === 0) {
      message.warning({ content: '当前没有可导出的数据' })
      return
    }
    const key = 'exportDbJsonXLSX'
    message.loading({ content: '正在生成 Excel...', key })

    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js'
    script.onload = () => {
      const XLSX = (window as any).XLSX

      const header = ['Id', 'DrawAt1', 'DrawAt2', 'H6']
      const data = filteredRows.map((row) => [row.Id, row.DrawAt1, row.DrawAt2, row.H6])

      const ws = XLSX.utils.aoa_to_sheet([header, ...data])
      ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 24 }]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'lgz')
      XLSX.writeFile(wb, `lgz_${new Date().toISOString().slice(0, 10)}.xlsx`)

      message.success({ content: 'Excel 文件已导出', key })
    }
    script.onerror = () => {
      message.error({ content: '加载 Excel 库失败，请检查网络', key })
    }
    document.body.appendChild(script)
  }

  const columns: ColumnsType<DbRow> = [
    {
      title: 'Id',
      dataIndex: 'Id',
      key: 'Id',
      width: 120,
      sorter: (a: DbRow, b: DbRow) => a.Id - b.Id
    },
    {
      title: 'DrawAt1',
      dataIndex: 'DrawAt1',
      key: 'DrawAt1',
      width: 160
    },
    {
      title: 'DrawAt2',
      dataIndex: 'DrawAt2',
      key: 'DrawAt2',
      width: 140
    },
    {
      title: 'H6',
      dataIndex: 'H6',
      key: 'H6',
      width: 240
    }
  ]

  const activeIdKeyword = normalizeKeyword('Id', filters.Id || '')

  return (
    <Card title='db数据列表' className='card'>
      <Space style={{ marginBottom: 16 }} wrap>
        {SEARCH_FIELDS.map(({ key, label, placeholder, width }) => (
          <Input.Search
            key={key}
            allowClear
            placeholder={placeholder}
            style={{ width }}
            value={filters[key] || ''}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            onSearch={(value) => handleFilterChange(key, value)}
          />
        ))}
        <Button type='primary' loading={loading} onClick={loadData}>
          刷新数据
        </Button>
        <Button onClick={handleReset}>重置搜索</Button>
        <Button onClick={handleExportJSON} disabled={filteredRows.length === 0}>
          导出 JSON
        </Button>
        <Button onClick={handleExportXLSX} disabled={filteredRows.length === 0}>
          导出 Excel
        </Button>
      </Space>

      <div style={{ marginBottom: 12 }}>
        共 <Tag color='blue'>{rows.length}</Tag> 条，命中 <Tag color='green'>{filteredRows.length}</Tag> 条
        {activeIdKeyword ? (
          <span style={{ marginLeft: 8, color: '#888' }}>
            Id ≥ <Tag color='orange'>{activeIdKeyword}</Tag>
          </span>
        ) : null}
      </div>

      <Table
        rowKey={() => Math.random()}
        size='middle'
        columns={columns}
        dataSource={filteredRows}
        loading={loading}
        locale={{ emptyText: <Empty description='暂无数据' /> }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />
    </Card>
  )
}

export default DbJsonTable
