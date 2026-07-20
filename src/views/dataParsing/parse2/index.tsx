import React from 'react'
import { Button, Card, Form, Input, Table } from 'antd'
import { connect } from 'react-redux'

const { TextArea } = Input
const Parse2 = () => {
  const [form] = Form.useForm()
  const [data, setData] = React.useState<any[]>([])

  const handleSearch = async (values: { arrayData: any }) => {
    const { arrayData } = values
    // const normalized = (arrayData || '').trim()
    console.log('输入数据', arrayData)
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
    }
  ]

  return (
    <Card className='card' title='数据解析-输入框'>
      <Form form={form} layout='inline' style={{ marginBottom: 24 }} onFinish={handleSearch}>
        <Form.Item label='数组数据' name='arrayData' rules={[{ required: true, message: '请输入数据' }]}>
          <TextArea placeholder='请输入数据' style={{ width: 400 }} />
        </Form.Item>
        <Form.Item>
          <Button type='primary' htmlType='submit'>
            搜索
          </Button>
        </Form.Item>
      </Form>
      <Table dataSource={data} columns={columns} />
    </Card>
  )
}

function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Parse2)
