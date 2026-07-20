import React, { useState } from 'react'
import { Button, Card, Form, Input, Table, Typography } from 'antd'
import { connect } from 'react-redux'

const { Title } = Typography

interface DataRow {
  key: string
  date: string
  numberArray: number[]
}

const Parse1 = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DataRow[]>([
    { key: '1', date: '2026-05-18', numberArray: [1, 2, 3] },
    { key: '2', date: '2026-05-19', numberArray: [4, 5, 6] }
  ])

  const handleSearch = async (values: { token: string; url: string; arrayData: string }) => {
    const { token, url, arrayData } = values
    const normalized = (arrayData || '').trim()
    let parsedNumbers: number[] = []
    if (normalized) {
      try {
        const json = JSON.parse(normalized)
        if (Array.isArray(json)) {
          parsedNumbers = json.map((item: any) => Number(item)).filter((item: any) => !Number.isNaN(item))
        }
      } catch (error) {
        const parts = normalized
          .replace(/\[|\]/g, '')
          .split(/[,;\s]+/)
          .filter(Boolean)
        parsedNumbers = parts.map((item) => Number(item)).filter((item) => !Number.isNaN(item))
      }
    }

    setLoading(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `${token}`
      }

      const resp = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers,
        body: JSON.stringify({ array: parsedNumbers })
      })
      console.log('请求响应', resp)
    } catch (error) {
      console.error('请求异常', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 100
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: '数字数组',
      dataIndex: 'numberArray',
      key: 'numberArray',
      render: (value: number[]) => `[${value.join(', ')}]`
    }
  ]

  return (
    <Card className='card'>
      <Title level={4}>数据解析 - 搜索与表格</Title>
      <Form form={form} layout='inline' style={{ marginBottom: 24 }} onFinish={handleSearch}>
        <Form.Item label='Token' name='token'>
          <Input placeholder='输入 token' style={{ width: 220 }} />
        </Form.Item>
        <Form.Item label='URL' name='url'>
          <Input placeholder='输入 url' style={{ width: 260 }} />
        </Form.Item>
        <Form.Item label='数组数据' name='arrayData'>
          <Input placeholder='例如 [1,2,3] 或 1,2,3' style={{ width: 280 }} />
        </Form.Item>
        <Form.Item>
          <Button type='primary' htmlType='submit' loading={loading}>
            搜索
          </Button>
        </Form.Item>
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
