import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { nanoid } from 'nanoid'
// import qs from 'qs'

// 请求重试配置
const MAX_RETRY_COUNT = 3 // 最大重试次数
const RETRY_DELAY = 1000 // 重试延迟时间（毫秒）

const SUCCESS_CODES = [20000, 1, 200]
const TOKEN_ERROR_CODES = [50008, 50012, 50014]
const LOGIN_URLS = ['authz/oauth/login', 'authz/oauth/loginBySms', 'authz/oauth/dingding/login']
const FASTGPT_TOKEN = 'Bearer fastgpt-pLdcWwY5nzCyattJFHb8nqBSnuQjpM9GS3oSw3KGJB6gIJR5LKstjZa0'
const OPENAI_TOKEN = 'Bearer pat_LVtVaMR3YfzeEJmCglJ23hINm7x6ERdj8Ji57bBu3uoAMPwZc6Y3YhzNEgqFpt4W'

// 服务模块映射
export const SERVICE_MODULES = [
  'bcerp-oms',
  'bcerp-pms',
  'bcerp-tms',
  'bcerp-fms',
  'bcerp-wms',
  'bcerp-mes',
  'bcerp-crm',
  'bcerp-swms',
  'bcerp-sale',
  'bcerp-hrms',
  'bcerp-base',
  'fileservice',
]

// URL 处理函数
function dealUrl(url: string) {
  const module = SERVICE_MODULES.find(module => url.includes(module))
  if (module) {
    return url.replace(module, localStorage.getItem(module) || module)
  }
  return url
}

// 获取UTC时间
function getUTCTime(now: Date) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const date = now.getUTCDate()
  const hours = now.getUTCHours()
  const minutes = now.getMinutes()
  const seconds = now.getUTCSeconds()
  const ms = now.getUTCMilliseconds()
  return Date.UTC(year, month, date, hours, minutes, seconds, ms)
}

// 判断当前时间是否超过token过期时间
export function isTokenExpire(serverTokenExpire: string) {
  // 提前30分钟刷新token (测试数据：3570000)
  return getUTCTime(new Date()) >= getUTCTime(new Date(serverTokenExpire)) - 1800000
}

// 扩展 AxiosRequestConfig 类型
declare module 'axios' {
  export interface AxiosRequestConfig {
    retry?: boolean
    retryCount?: number
    mock?: boolean
    nodeApi?: boolean
  }

  export interface AxiosResponse<T = any> {
    code: number
    message: string
    msg: string
    state: number
    data: T
  }
}

const api = axios.create({
  baseURL: (import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY) ? '/proxy/' : import.meta.env.VITE_APP_API_BASEURL,
  timeout: 1000 * 60,
  responseType: 'json',
})

api.interceptors.request.use(
  async (request) => {
    // 处理不同的 API 基础路径
    if (request.mock) {
      request.baseURL = import.meta.env.VITE_APP_MOCK
    }
    else if (request.url?.includes('/fastGpt')) {
      request.baseURL = 'https://api.analoiservice.com'
    }
    else if (request.nodeApi) {
      request.baseURL = import.meta.env.VITE_APP_NODE_API
    }
    // 处理 URL 和添加追踪 ID
    if (request.url) { request.url = dealUrl(request.url) }
    // 全局拦截请求发送前提交的参数
    const settingsStore = useSettingsStore()
    const userStore = useUserStore()
    // 设置请求头
    if (request.headers) {
      request.headers['Accept-Language'] = settingsStore.lang
      request.headers['x-traceId-header'] = nanoid()
      if (userStore.isLogin) {
        request.headers.Token = userStore.token
      }
      const needAuth = userStore.token && !LOGIN_URLS.includes(request.url || '')
      if (needAuth) {
        const expireTime = userStore.expireTime

        // 检查 token 是否过期
        if (expireTime && isTokenExpire(expireTime)) {
          try {
            await userStore.tokenRefresh()
          }
          catch {
          // token刷新失败，立即清理数据并跳转到登录页
            const redirectUrl = location.hash.substring(1) || '/'
            userStore.logout(redirectUrl)
            return Promise.reject(new Error('Token refresh failed, redirecting to login'))
          }
        }

        // 设置请求 Authorization
        if (request.url?.includes('/fastGpt')) {
          request.headers.Authorization = request.url.includes('/v1/chat/completions')
            ? request.headers.Authorization
            : FASTGPT_TOKEN
        }
        else if (request.url?.includes('/open_api/v2/chat')) {
          request.headers.Authorization = OPENAI_TOKEN
        }
        else {
          request.headers.Authorization = userStore.token
        }
      }
    }
    // 是否将 POST 请求参数进行字符串化处理
    if (request.method === 'post') {
      // request.data = qs.stringify(request.data, {
      //   arrayFormat: 'brackets',
      // })
    }
    return request
  },
)

// 处理错误信息的函数
function handleError(error: any) {
  if (error.status === 401) {
    useUserStore().requestLogout()
  }
  else {
    let message = error.message
    if (message === 'Network Error') {
      message = '后端网络故障'
    }
    else if (message.includes('timeout')) {
      message = '接口请求超时'
    }
    else if (message.includes('Request failed with status code')) {
      message = `接口${message.substr(message.length - 3)}异常`
    }
    toast.error(message)
  }
  return Promise.reject(error)
}

api.interceptors.response.use(
  (response) => {
    // 全局拦截请求发送后返回的数据，如果数据有报错则在这做全局的错误提示
    const { data } = response
    if (isObject(data)) {
      const { code, message, msg, state } = data
      const isError = !!code && !SUCCESS_CODES.includes(code)
      const hasStateError = !!state && state !== 0
      if (isError || hasStateError) {
        if (message) {
          toast.error(message)
        }
        else {
          const errorMsg = msg || 'Error'
          // 处理消息长度
          if (errorMsg.length > 50) {
            ElMessage.error({ message: errorMsg, duration: 0, showClose: true })
          }
          else {
            toast.error(errorMsg)
          }
        }

        if (TOKEN_ERROR_CODES.includes(code)) {
          ElMessageBox.confirm(
            'You have been logged out, you can cancel to stay on this page, or log in again',
            'Confirm logout',
            {
              confirmButtonText: 'Re-Login',
              cancelButtonText: 'Cancel',
              type: 'warning',
            },
          ).then(() => {
            useUserStore().requestLogout()
          })
        }

        return Promise.reject(data)
      }

      return Promise.resolve(data)
    }
    else {
      return Promise.reject(data)
    }
  },
  async (error) => {
    // 处理取消请求
    if (axios.isCancel(error) || error.message === '系统取消请求') {
      return
    }

    const { response } = error
    const userStore = useUserStore()

    if (!response) {
      toast.error(error.message)
      return Promise.reject(error)
    }

    const { status, data, config: { url, responseType } = {} } = response

    // 401 未授权处理
    if (status === 401) {
      if (!LOGIN_URLS.includes(url)) {
        error.message = '登录状态过期，请重新登录'
        // 确保不重复跳转
        if (!location.hash.includes('/login?redirect')) {
          // 立即跳转，不延迟
          userStore.logout(location.hash.substring(1))
        }
      }
      else {
        error.message = data?.msg === '认证失败' ? '用户名或密码错误' : data.msg
      }
      toast.error(error.message)
      return Promise.reject(error)
    }

    // 413 文件大小超限
    if (status === 413) {
      toast.error('文件大小超过限制(5M)')
      return Promise.reject(error)
    }

    // 503 服务器正在部署中
    if (status === 503) {
      toast.error('服务器正在部署中，请稍后再试！')
      return Promise.reject(error)
    }

    // 处理特定业务错误
    if (data?.msg) {
      const { msg } = data

      if (url.includes('selling_analyze') && msg === '日期不能为空') {
        if (url.includes('summaryInfo')) {
          toast.error(msg)
        }
      }
      else if (url.includes('/finance-profit/checkProfit')) {
        return Promise.resolve({ msg })
      }
      else {
        toast.error(msg)
      }
      return Promise.reject(error)
    }

    // 处理 arraybuffer 响应
    if (responseType === 'arraybuffer') {
      const resBlob = new Blob([data])
      const reader = new FileReader()
      reader.readAsText(resBlob, 'utf-8')
      reader.onload = () => {
        try {
          const errorData = JSON.parse(<string>reader.result)
          toast.error(errorData.msg)
        }
        catch {
          toast.error('解析错误响应失败')
        }
      }
      return Promise.reject(error)
    }

    toast.error(error.message)
    return Promise.reject(error)

    // 获取请求配置
    const config = error.config
    // 如果配置不存在或未启用重试，则直接处理错误
    if (!config || !config.retry) {
      return handleError(error)
    }
    // 设置重试次数
    config.retryCount = config.retryCount || 0
    // 判断是否超过重试次数
    if (config.retryCount >= MAX_RETRY_COUNT) {
      return handleError(error)
    }
    // 重试次数自增
    config.retryCount += 1
    // 延迟重试
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    // 重新发起请求
    return api(config)
  },
)

export default api
