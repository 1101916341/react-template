import React, { useState } from 'react'
import { AutoComplete, Button, Card, Form, Input, InputNumber, message, Select, Table, Typography } from 'antd'
import { connect } from 'react-redux'

const { Title } = Typography
const { TextArea } = Input

interface DataRow {
  key: string
  id: number
  drawAt1: string
  drawAt2: string
  h1: number
  h2: number
  h3: number
  h4: number
  h5: number
  hGroup: string
  sum: number
  quotient: number
  remainder: number
  average: number
  range: number
}

type SortOrder = 'ascend' | 'descend' | null

const Parse1 = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DataRow[]>([])
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)

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
            const h1 = item.H1
            const h2 = item.H2
            const h3 = item.H3
            const h4 = item.H4
            const h5 = item.H5
            const hValues = [h1, h2, h3, h4, h5]
            const sum = h1 + h2 + h3 + h4 + h5
            const max = Math.max(...hValues)
            const min = Math.min(...hValues)
            newRows.push({
              key: `${i + 1}-${j + 1}`,
              id: item.Id,
              drawAt1: item.DrawAt1,
              drawAt2: item.DrawAt2,
              h1,
              h2,
              h3,
              h4,
              h5,
              hGroup: [h1, h2, h3, h4, h5].join(', '),
              sum,
              quotient: Math.floor(sum / 5),
              remainder: sum % 5,
              average: +(sum / 5).toFixed(2),
              range: max - min
            })
          }
          console.log(`请求 #${i + 1} 响应`, json)
        } catch (error) {
          newRows.push({
            key: String(i + 1),
            id: id,
            drawAt1: '',
            drawAt2: '',
            h1: 0,
            h2: 0,
            h3: 0,
            h4: 0,
            h5: 0,
            hGroup: '0, 0, 0, 0, 0',
            sum: 0,
            quotient: 0,
            remainder: 0,
            average: 0,
            range: 0
          })
          console.error(`请求 #${i + 1} 异常`, error)
        }
      }
    } finally {
      // 默认升序排列所有数据
      newRows.sort((a, b) => a.id - b.id)
      setSortOrder('ascend')
      setRows(newRows)
      setLoading(false)
    }
  }

  const handleSortChange = () => {
    setRows((prev) => {
      const sorted = [...prev]
      if (sortOrder === 'ascend') {
        setSortOrder('descend')
        sorted.sort((a, b) => b.id - a.id)
      } else {
        setSortOrder('ascend')
        sorted.sort((a, b) => a.id - b.id)
      }
      return sorted
    })
  }

  const handleExportJSON = () => {
    const exportData = rows.map((r) => ({
      Id: r.id,
      DrawAt1: r.drawAt1,
      DrawAt2: r.drawAt2,
      H6: r.hGroup,
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

      const header = ['Id', 'DrawAt1', 'DrawAt2', 'H1', 'H2', 'H3', 'H4', 'H5', 'H组合', '和值', '商值', '余值', '平均值', '跨度']
      const data = sortedRows.map(r => [
        r.id, r.drawAt1, r.drawAt2,
        r.h1, r.h2, r.h3, r.h4, r.h5,
        r.hGroup, r.sum, r.quotient, r.remainder, r.average, r.range
      ])

      const ws = XLSX.utils.aoa_to_sheet([header, ...data])
      ws['!cols'] = [
        { wch: 10 }, { wch: 14 }, { wch: 10 },
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 22 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 8 }
      ]

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
      width: 100,
      sortOrder,
      sorter: true
    },
    {
      title: 'DrawAt1',
      dataIndex: 'drawAt1',
      key: 'drawAt1',
      width: 120
    },
    {
      title: 'DrawAt2',
      dataIndex: 'drawAt2',
      key: 'drawAt2',
      width: 100
    },
    {
      title: 'H1',
      dataIndex: 'h1',
      key: 'h1',
      width: 80
    },
    {
      title: 'H2',
      dataIndex: 'h2',
      key: 'h2',
      width: 80
    },
    {
      title: 'H3',
      dataIndex: 'h3',
      key: 'h3',
      width: 80
    },
    {
      title: 'H4',
      dataIndex: 'h4',
      key: 'h4',
      width: 80
    },
    {
      title: 'H5',
      dataIndex: 'h5',
      key: 'h5',
      width: 80
    },
    {
      title: 'H组合',
      dataIndex: 'hGroup',
      key: 'hGroup',
      width: 180
    },
    {
      title: '和值',
      dataIndex: 'sum',
      key: 'sum',
      width: 80
    },
    {
      title: '商值',
      dataIndex: 'quotient',
      key: 'quotient',
      width: 80
    },
    {
      title: '余值',
      dataIndex: 'remainder',
      key: 'remainder',
      width: 80
    },
    {
      title: '平均值',
      dataIndex: 'average',
      key: 'average',
      width: 90
    },
    {
      title: '跨度',
      dataIndex: 'range',
      key: 'range',
      width: 80
    }
  ]

  return (
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
        scroll={{ x: 1300 }}
        onChange={(pagination, filters, sorter) => {
          handleSortChange()
        }}
      />
    </Card>
  )
}

function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Parse1)