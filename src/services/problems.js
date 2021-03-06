/**
 * YiqiHu 18/8/20.
 */
import request from 'utils/request'
import API from 'config/api'

const getProblems = (data) => request({
  url: API.problems,
  token: 'option',
  method: 'get',
  data
})

const searchProblems = (data) => request({
  url: API.problemsSearch,
  method: 'get',
  token: 'option',
  data
})

const getRecording = (data) => request({
  url: API.status,
  method: 'get',
  token: true,
  data
})

export { getProblems, getRecording, searchProblems }
