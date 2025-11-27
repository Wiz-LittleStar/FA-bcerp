import { ouUser } from '@/api/modules/base'
import dayjs from '@/utils/dayjs'

export default function useUtils() {
  // 常量定义
  const SORT_ORDERS = {
    ASC: ['ascending', 'asc'],
    DESC: ['descending', 'desc'],
  }

  // 设置排序
  const setSort = (setting: { prop: string, order: string | null }, target: ObjectAny) => {
    if (!(isObject(setting) && isObject(target))) { return }
    const data = { ascColumns: <string[]>[], descColumns: <string[]>[] }

    if (setting.order) {
      if (SORT_ORDERS.ASC.includes(setting.order)) {
        data.ascColumns.push(setting.prop)
      }
      else if (SORT_ORDERS.DESC.includes(setting.order)) {
        data.descColumns.push(setting.prop)
      }
    }

    Object.assign(target, data)
  }

  const getStore = (key: string) => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const store = JSON.parse(saved)
        return isObject(store) ? store : {}
      }
    }
    catch (error) {
      console.error(error)
    }
    return {}
  }

  const setStore = (key: string, data: ObjectAny, patch = false) => {
    try {
      if (isObject(data)) {
        if (patch) {
          const store = getStore(key)
          Object.assign(store, data)
          localStorage.setItem(key, JSON.stringify(store))
        }
        else {
          localStorage.setItem(key, JSON.stringify(data))
        }
      }
    }
    catch (error) {
      console.error(error)
    }
  }

  /**
   * 打开URL
   * @param {string} url - 网址
   */
  const openUrl = (url: string) => {
    if (url) { window.open(url) }
  }

  /**
   * 统一错误处理
   * @param {Function} fn - 异步函数
   * @param {*} defaultValue - 默认返回值
   * @param {string} errorMessage - 错误信息
   */
  const handleAsyncError = async (fn: () => Promise<any>, defaultValue = [], errorMessage = '操作失败') => {
    try {
      return await fn()
    }
    catch (error) {
      console.error(`${errorMessage}:`, error instanceof Error ? error.message : String(error))
      return defaultValue
    }
  }

  const staffList = ref<ObjectAny[]>([])
  /**
   * 获取员工列表
   */
  const { request } = useRequest()
  const getStaffList = async () => {
    const result = await handleAsyncError(
      async () => {
        const { data } = await request(ouUser)
        return Array.isArray(data) ? data : []
      },
      [],
      '获取员工列表失败',
    )
    staffList.value = result
  }

  const isNumber = (value: any) => {
    const num = Number.parseFloat(value)
    return !Number.isNaN(num) && Number.isFinite(num) && String(num) === String(value)
  }

  /**
   * 创建时间选择器快捷方式
   * @param {string} text - 显示文本
   * @param {Function} getRange - 获取时间范围的函数
   * @returns {object} 快捷方式对象
   */
  const createTimeShortcut = (text: string, getRange: () => [Date, Date]) => ({
    text,
    onClick(picker: any) {
      const [start, end] = getRange()
      picker.emit('pick', [start, end])
    },
  })

  const timePickerShortcuts = [
    createTimeShortcut('今天', () => [
      dayjs().startOf('day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('昨天', () => [
      dayjs().subtract(1, 'day').startOf('day').toDate(),
      dayjs().subtract(1, 'day').endOf('day').toDate(),
    ]),
    createTimeShortcut('近3天', () => [
      dayjs().subtract(3, 'day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('近7天', () => [
      dayjs().subtract(7, 'day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('本周', () => [
      dayjs().startOf('week').toDate(),
      dayjs().endOf('week').toDate(),
    ]),
    createTimeShortcut('上周', () => [
      dayjs().subtract(1, 'week').startOf('week').toDate(),
      dayjs().subtract(1, 'week').endOf('week').toDate(),
    ]),
    createTimeShortcut('近14天', () => [
      dayjs().subtract(14, 'day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('近30天', () => [
      dayjs().subtract(30, 'day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('本月', () => [
      dayjs().startOf('month').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('上个月', () => [
      dayjs().subtract(1, 'month').startOf('month').toDate(),
      dayjs().subtract(1, 'month').endOf('month').toDate(),
    ]),
    createTimeShortcut('近60天', () => [
      dayjs().subtract(60, 'day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('近90天', () => [
      dayjs().subtract(90, 'day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('近半年', () => [
      dayjs().subtract(182, 'day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('近一年', () => [
      dayjs().subtract(365, 'day').toDate(),
      dayjs().toDate(),
    ]),
    createTimeShortcut('本年至今', () => [
      dayjs().startOf('year').toDate(),
      dayjs().toDate(),
    ]),
  ]

  return {
    setSort,
    getStore,
    setStore,
    openUrl,
    staffList,
    getStaffList,
    isNumber,
    timePickerShortcuts,
  }
}
