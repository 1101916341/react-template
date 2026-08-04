import React, { useEffect, useState } from 'react'
import { AutoComplete, Button, Card, Form, Input, InputNumber, message, Select, Table, Typography } from 'antd'
import { connect } from 'react-redux'
import { ungzip } from 'pako'
import Cookies from 'js-cookie'

const { Title } = Typography

interface GameIdRow {
  key: string
  gameID: string
  gameName: string
  siteID: string
  raw: string
}

// 游戏ID下拉选项（可按需扩展，默认 XYFT）
const GAMEID_OPTIONS = [{ value: 'XYFT', label: 'XYFT' }]

const Parse4 = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<GameIdRow[]>([])

  const handleSearch = async (values: {
    apiUrl: string
    headerCookie: string
    date: string
    gameid: string
    resultRows: number
    rowNumber: number
  }) => {
    const { apiUrl, headerCookie, date, gameid, resultRows, rowNumber } = values
    Cookies.set('token', headerCookie, { expires: 3 })
    setLoading(true)
    setRows([])
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      const cc = { date, gameid, resultRows, rowNumber }
      const resp = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers,
        body: JSON.stringify({ date, gameid, resultRows, rowNumber })
      })
      const text = await resp.text()
      const bin = Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
      const result = ungzip(bin, { toText: true })
      console.log('result', JSON.parse(result))
    } catch (error) {
      console.error('请求异常', error)
      message.error({ content: '请求失败，请查看控制台' })
    } finally {
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
      title: 'GameID',
      dataIndex: 'gameID',
      key: 'gameID',
      width: 120
    },
    {
      title: 'GameName',
      dataIndex: 'gameName',
      key: 'gameName',
      width: 180
    },
    {
      title: 'SiteID',
      dataIndex: 'siteID',
      key: 'siteID',
      width: 120
    },
    {
      title: '原始数据',
      dataIndex: 'raw',
      key: 'raw',
      ellipsis: true
    }
  ]

  useEffect(() => {
    const str =
      'H4sIAAAAAAAACo2QTWvDMAyG/8rQ2QG7SbPUxyZ0FMYuyWE7eo2TGOy4+GOlK/3vs+fsA7bBwAe90iNZry5w0D0HCiuMAYGyI9DZS4lgZIrvm1B5fNp1kHR3PkZ229Yh8aq9nUSd2u+4e+Cne+0cN+dQ7JljQC9wNLwx7LRQBBGMVmiNCpSjW1SiCm0CvECdUGmTVZnhKsPFDS5oePn6i9lb6z8gXOE8I1XcexDGuqYDmhEElh/03EcVhJuEeY9jZdDeuOlTiSGJ2OPVVoytYlIuQ7xqxTxK3mj/LMOXKbdrQxTC/ucuRYYxidZ/tUJyijfJSgRq7WcXRlX4H5d22jH5vcNy88LNn/cq4Xp9A7TzpGPZAQAA'
    const bin = Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
    const result = ungzip(bin, { toText: true })
    console.log('result', JSON.parse(result))
  }, [])

  return (
    <Card className='card'>
      <Title level={4}>数据解析 - 解析4</Title>
      <Form
        form={form}
        style={{ marginBottom: 24 }}
        onFinish={handleSearch}
        initialValues={{
          apiUrl: '/openaward/GetLotteryList',
          date: '2026-08-03',
          gameid: 'XYFT',
          resultRows: 30,
          rowNumber: 10
        }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
          <Form.Item label='接口地址' name='apiUrl' rules={[{ required: true, message: '请选择或输入接口地址' }]}>
            <AutoComplete
              placeholder='请选择或输入 http/https 请求地址'
              options={[{ value: '/openaward/GetLotteryList' }]}
              filterOption={(inputValue, option) =>
                option ? option.value.toUpperCase().includes(inputValue.toUpperCase()) : false
              }
            />
          </Form.Item>
          <Form.Item label='Cookie' name='headerCookie'>
            <Input placeholder='请求 headers 的 Cookie 字段值（可选）' />
          </Form.Item>
          <Form.Item label='日期' name='date' rules={[{ required: true, message: '请输入日期' }]}>
            <Input placeholder='YYYY-MM-DD，例如 2026-08-03' />
          </Form.Item>
          <Form.Item label='游戏ID' name='gameid' rules={[{ required: true, message: '请选择游戏ID' }]}>
            <Select placeholder='请选择游戏ID' showSearch optionFilterProp='label' options={GAMEID_OPTIONS} />
          </Form.Item>
          <Form.Item label='返回行数' name='resultRows' rules={[{ required: true, message: '请输入返回行数' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder='默认 30' />
          </Form.Item>
          <Form.Item label='行号' name='rowNumber' rules={[{ required: true, message: '请输入行号' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder='默认 10' />
          </Form.Item>
          <Form.Item label=' ' colon={false}>
            <Button type='primary' htmlType='submit' loading={loading} style={{ width: '100%' }}>
              查询
            </Button>
          </Form.Item>
        </div>
      </Form>
      <Table rowKey={(record) => record.key} columns={columns} dataSource={rows} pagination={false} />
    </Card>
  )
}

function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Parse4)
