import type { CancelTokenSource } from 'axios'
import axios from 'axios'
import api from '@/api'

export default function useRequest() {
  const getApiFunction = (type: 'get' | 'post' | 'put' | 'delete', url: string) => {
    return (data?: ObjectAny, config?: ObjectAny) => {
      if (type === 'get') {
        return api[type](url, { params: data ?? {}, ...config })
      }
      else if (type === 'delete') {
        return api[type](url, { data: data ?? {}, ...config })
      }
      else {
        return api[type](url, data, config)
      }
    }
  }

  const cancelTokenSource = ref<CancelTokenSource>()
  const loading = ref(false)
  let requestId = 0

  /**
   * 检查错误是否为取消请求的错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否为取消请求的错误
   */
  const isCancelError = (error: Error) => {
    return axios.isCancel(error)
  }

  /**
   * 请求方法 - 自动处理取消逻辑和请求ID管理
   * @param {Function} apiFunction - API函数
   * @param {object} params - 请求参数
   * @param {object} extraConfig - 额外配置
   * @returns {Promise} 请求Promise
   */
  const request = async (apiFunction: (...args: any[]) => Promise<any>, params = {}, extraConfig = {}) => {
    // 生成当前请求的唯一ID
    const currentRequestId = ++requestId

    // 取消之前的请求
    if (cancelTokenSource.value) {
      cancelTokenSource.value.cancel('新请求开始，取消上一次请求')
    }

    // 创建新的取消令牌
    const tokenSource = axios.CancelToken.source()
    cancelTokenSource.value = tokenSource

    const config = {
      ...extraConfig,
      cancelToken: tokenSource.token,
    }

    loading.value = true

    try {
      let result

      // 根据函数参数个数决定如何调用
      if (apiFunction.length === 0) {
        // 无参数函数，需要通过修改 API 函数来支持 config
        result = await apiFunction()
      }
      else if (apiFunction.length === 1) {
        // 单参数函数
        if (Object.keys(params).length === 0) {
          // 没有业务参数，直接传 config
          result = await apiFunction(config)
        }
        else {
          // 有业务参数，传 params（这种情况下无法传递 config，需要修改 API 函数）
          result = await apiFunction(params)
        }
      }
      else {
        // 多参数函数，正常传递 params 和 config
        result = await apiFunction(params, config)
      }

      // 只有当前请求才返回结果，避免过期请求覆盖新数据
      if (currentRequestId === requestId) {
        return result
      }
      else {
        // 如果不是当前请求，抛出取消错误
        throw new axios.Cancel('请求已过期')
      }
    }
    catch (error) {
      // 如果是取消错误，直接抛出
      if (isCancelError(error as Error)) {
        throw error
      }

      // 只有当前请求才抛出真正的错误
      if (currentRequestId === requestId) {
        throw error
      }
      else {
        // 过期请求的错误转为取消错误
        throw new axios.Cancel('请求已过期')
      }
    }
    finally {
      // 只有当前请求才关闭loading
      if (currentRequestId === requestId) {
        loading.value = false
        // 清理取消令牌
        if (cancelTokenSource.value === tokenSource) {
          cancelTokenSource.value = undefined
        }
      }
    }
  }

  // 组件卸载时自动取消请求
  onBeforeUnmount(() => {
    if (cancelTokenSource.value) {
      cancelTokenSource.value.cancel('组件卸载取消请求')
    }
  })

  return {
    getApiFunction,
    request,
    loading,
  }
}
