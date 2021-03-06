import React, { Component } from 'react'
import Link from 'umi/link'
import router from 'umi/router'
import { Form, Input, Radio, Button, DatePicker, Select, Modal } from 'antd'
import moment from 'moment'
import verify from 'utils/regexp'
import { newDate } from 'utils/dateAbout'
import message from 'utils/message'
import errorHandler from 'utils/errorHandler'
import { connect } from 'dva'

import {
  getContest,
  delContest,
  updateProblems,
  updateContest,
  createContest
} from './service'

const FormItem = Form.Item
const Option = Select.Option
const RangePicker = DatePicker.RangePicker
const TextArea = Input.TextArea
const confirm = Modal.confirm

const initState = {
  isEdit: false,
  contestInfo: {},
  problemsInfo: [],
  password: ''
}

const langMap = [
  {
    value: '0',
    label: 'C'
  },
  {
    value: '1',
    label: 'C++'
  },
  {
    value: '2',
    label: 'Java'
  },
  {
    value: '3',
    label: 'Python'
  }
]

@Form.create()
@connect(({ admin }) => ({ admin }))
export default class ContestEdit extends Component {
  constructor (props) {
    super(props)
    this.state = initState
  }
  componentDidMount () {
    this.initState()
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.location !== this.props.location) {
      this.initState()
    }
  }

  initState = () => {
    const { query } = this.props.location
    const isEdit = !!query.id
    if (isEdit) {
      this.fetchData(query.id)
      return
    }
    this.setState(initState)
  }

  fetchData = async id => {
    const data = await getContest(id)
    this.setState({
      contestInfo: data.contest_info,
      problemsInfo: data.problems_info,
      userIds: data.user_ids,
      isEdit: true
    })
  }

  checkPrivate = () => {
    const form = this.props.form
    return +form.getFieldValue('privated')
  }

  handleSubmit = () => {
    this.props.form.validateFields((err, fieldsValue) => {
      if (!err) {
        const rangeTimeValue = fieldsValue['range-time-picker']
        const startTime = rangeTimeValue[0]
        if (moment().isAfter(startTime)) {
          message.error('??????????????????????????????????????????')
          return
        }
        confirm({
          title: '???????????????????????????????????????????????????!',
          content: (
            <Input
              type='password'
              onChange={e => this.setState({ password: e.target.value })}
              placeholder='???????????????????????????'
            />
          ),
          onOk: async () => {
            const values = preSubmit(fieldsValue, this.state.password)

            let problemParams = {
              password: this.state.password,
              problem_ids: fieldsValue.problems.map(t => +t)
            }

            const { query } = this.props.location
            try {
              if (this.state.isEdit) {
                await updateProblems(query.id, problemParams)
                await updateContest(query.id, values)
              } else {
                await createContest(values)
              }
            } catch (e) {
              errorHandler(e)
              return Promise.reject
            }
            message.success('????????????')
            router.push('/admin/contest-list')
          }
        })
      }
    })
  }

  onConfirmDel = () => {
    confirm({
      title: '??????????????????????????????????????????????',
      content: (
        <Input
          type='password'
          onChange={e => this.setState({ password: e.target.value })}
          placeholder='???????????????????????????'
        />
      ),
      onOk: async () => {
        const { query = {} } = this.props.location
        const cid = query.id
        try {
          await delContest(cid, { password: this.state.password })
        } catch (e) {
          errorHandler(e)
          return Promise.reject
        }
        message.success('????????????')
        router.push('/admin/contest-list')
      }
    })
  }

  render () {
    const { isEdit, contestInfo = {}, problemsInfo = [], userIds } = this.state
    const { getFieldDecorator } = this.props.form
    const { query = {} } = this.props.location
    const { withProblem, id: cid } = query
    const { selectProblems = [] } = this.props.admin
    let progress = NaN
    let problems = problemsInfo.map(e => e.problem_id)

    if (withProblem) {
      problems = [...problems, ...selectProblems]
    }
    const start = newDate(contestInfo.start_time)
    const end = newDate(contestInfo.end_time)
    const time = new Date()
    if (time < start) {
      progress = 'unStart'
    } else if (time < end) {
      progress = 'running'
    } else {
      progress = 'ended'
    }
    return (
      <div className='contest-edit'>
        <div className='h-1'>
          {isEdit ? (
            <span>
              ???????????? ???
              <Link target='_black' to={`/contests/${contestInfo.id}`}>
                {' '}
                {contestInfo.id}
              </Link>
            </span>
          ) : (
            '????????????'
          )}
        </div>
        <div className='form-content' style={{ maxWidth: 680 }}>
          <FormItem label='??????'>
            {getFieldDecorator('title', {
              rules: [{ required: true, message: '???????????????' }],
              initialValue: contestInfo.title || ''
            })(
              <Input
                placeholder='???????????????'
                type='textarea'
                autosize={{ minRows: 1, maxRows: 6 }}
              />
            )}
          </FormItem>
          <FormItem label='??????'>
            {getFieldDecorator('description', {
              rules: [{ required: true, message: '???????????????' }],
              initialValue: contestInfo.description || ''
            })(
              <TextArea
                placeholder='???????????????????????? Markdown ??????????????? Markdown ???????????????????????????'
                autosize={{ minRows: 2 }}
              />
            )}
          </FormItem>
          {(progress === 'unStart' || !isEdit) && (
            <FormItem label='??????'>
              {getFieldDecorator('range-time-picker', {
                rules: [
                  { type: 'array', required: true, message: '???????????????' }
                ],
                initialValue: cid
                  ? [
                    moment(contestInfo.start_time, 'YYYY-MM-DD HH:mm:ss'),
                    moment(contestInfo.end_time, 'YYYY-MM-DD HH:mm:ss')
                  ]
                  : []
              })(<RangePicker showTime format='YYYY-MM-DD HH:mm:ss' />)}
            </FormItem>
          )}
          {isEdit &&
            progress !== 'unStart' && (
            <FormItem label='????????????'>
              {getFieldDecorator('range-time-picker', {
                rules: [{ required: true, message: '???????????????' }],
                initialValue: cid
                  ? moment(contestInfo.end_time, 'YYYY-MM-DD HH:mm:ss')
                  : null
              })(<DatePicker showTime format='YYYY-MM-DD HH:mm:ss' />)}
            </FormItem>
          )}
          <FormItem label='??????'>
            {getFieldDecorator('privated', {
              rules: [{ required: true, message: '?????????????????????' }],
              initialValue: contestInfo.private + ''
            })(
              <Radio.Group>
                <Radio value='0'>??????</Radio>
                <Radio value='1'>??????</Radio>
                <Radio value='2'>??????</Radio>
              </Radio.Group>
            )}
          </FormItem>
          {this.checkPrivate() === 1 && (
            <FormItem label='????????????(??????????????????????????????)'>
              {getFieldDecorator('password', {
                rules: [
                  {
                    pattern: verify.password,
                    message: '????????????????????????(6-18???)'
                  },
                  {
                    required: true,
                    message: '?????????????????????'
                  }
                ]
              })(<Input placeholder='?????????????????????' />)}
            </FormItem>
          )}

          <FormItem label='??????'>
            {getFieldDecorator('langmask', {
              rules: [{ type: 'array' }],
              initialValue: contestInfo.langmask
                ? contestInfo.langmask.map(t => t + '')
                : []
            })(
              <Select
                mode='multiple'
                placeholder='?????????????????????'
                style={{ width: '100%' }}
              >
                {langMap.map(e => (
                  <Option key={e.value} value={e.value}>
                    {e.label}
                  </Option>
                ))}
              </Select>
            )}
          </FormItem>
          <FormItem label='??????'>
            {getFieldDecorator('problems', {
              rules: [{ type: 'array' }],
              initialValue: problems || []
            })(
              <Select
                mode='tags'
                tokenSeparators={[' ']}
                style={{ width: '100%' }}
                notFoundContent='?????? Excel ????????????????????????'
              />
            )}
          </FormItem>
          {this.checkPrivate() === 2 && (
            <FormItem label='??????'>
              {getFieldDecorator('users', {
                rules: [{ type: 'array' }],
                initialValue: userIds ? userIds.map(t => t.user_id) : []
              })(
                <Select
                  mode='tags'
                  style={{ width: '100%' }}
                  tokenSeparators={[' ']}
                  notFoundContent='?????? Excel ????????????????????????'
                />
              )}
            </FormItem>
          )}
          <FormItem>
            {cid ? (
              <Button
                className='mr-16'
                type='primary'
                onClick={this.handleSubmit}
              >
                ????????????
              </Button>
            ) : (
              <Button type='primary' onClick={this.handleSubmit}>
                ????????????
              </Button>
            )}
            {cid && (
              <Button type='danger' onClick={this.onConfirmDel}>
                ????????????
              </Button>
            )}
          </FormItem>
        </div>
      </div>
    )
  }
}

const preSubmit = (fieldsValue, password) => {
  const rangeTimeValue = fieldsValue['range-time-picker']
  let values = {
    title: fieldsValue.title,
    private: fieldsValue.privated,
    password: fieldsValue.password,
    langmask: fieldsValue.langmask.map(t => +t),
    problems: fieldsValue.problems.map(t => +t),
    description: fieldsValue.description,
    user_password: password
  }
  if (fieldsValue.users) {
    values = {
      ...values,
      users: fieldsValue.users.map(t => +t)
    }
  }
  if (rangeTimeValue) {
    if (rangeTimeValue.length > 1) {
      values = {
        ...values,
        start_time: rangeTimeValue[0].format('YYYY-MM-DD HH:mm:ss'),
        end_time: rangeTimeValue[1].format('YYYY-MM-DD HH:mm:ss')
      }
    } else {
      values = {
        ...values,
        end_time: rangeTimeValue.format('YYYY-MM-DD HH:mm:ss')
      }
    }
  }
  return values
}
