import React, { useState } from 'react'
import { Button, Card, Form, Input, InputNumber, Select, Table, Typography } from 'antd'
import { connect } from 'react-redux'

const { Title } = Typography
const { TextArea } = Input

interface DataRow {
  key: string
  id: number
  status: string
  response: string
}

const Parse1 = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DataRow[]>([])

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

    const newRows: DataRow[] = []

    try {
      for (let i = 0; i < loopCount; i++) {
        const currentId = idMode === 'increment' ? initId + i : initId - i
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
          newRows.push({
            key: String(i + 1),
            id,
            status: `${resp.status} ${resp.statusText}`,
            response: text.length > 200 ? text.slice(0, 200) + '…' : text
          })
          console.log(`请求 #${i + 1} 响应`, resp)
        } catch (error) {
          newRows.push({
            key: String(i + 1),
            id,
            status: '失败',
            response: String(error)
          })
          console.error(`请求 #${i + 1} 异常`, error)
        }
      }
    } finally {
      setRows(newRows)
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 80
    },
    {
      title: '请求 ID',
      dataIndex: 'id',
      key: 'id',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140
    },
    {
      title: '响应数据',
      dataIndex: 'response',
      key: 'response',
      ellipsis: true
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
          <Form.Item label='接口地址' name='apiUrl' rules={[{ required: true, message: '请输入接口地址' }]}>
            <Input placeholder='http/https 完整请求地址' />
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

      <Table rowKey='key' columns={columns} dataSource={rows} pagination={false} />
    </Card>
  )
}

function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Parse1)
