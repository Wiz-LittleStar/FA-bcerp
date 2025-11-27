import { Decimal } from 'decimal.js'
import { cloneDeep, isEqual } from 'es-toolkit'
import { nanoid } from 'nanoid'
import dayjs from '@/utils/dayjs'
import { TIME_SHARING_ADJUST_FREQUENCY, TIME_SHARING_ADJUST_TYPE, TIME_SHARING_STRATEGY_STATE, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE, TIME_SHARING_STRATEGY_VIEW_TYPE, TIME_SHARING_TYPE } from '@/utils/enum/advertise'
import { WEEK } from '@/utils/enum/common'

export default function useAmazonAdsTimeSharingStrategyUtils() {
  const initStrategyTimes = () => {
    return WEEK.getOptions().map(item => ({
      id: nanoid(),
      name: item.label,
      dayOfWeek: item.value,
    }))
  }

  // 验证时间策略
  const validateTimeStrategy = (setting: ObjectAny = {}, adjustType?: number) => {
    if ([TIME_SHARING_TYPE.BUDGET, TIME_SHARING_TYPE.BID].includes(adjustType!)) {
      const { adjustType: type, adjustValue, budgetRange, bidRange } = setting
      const range = adjustType === TIME_SHARING_TYPE.BUDGET ? budgetRange : adjustType === TIME_SHARING_TYPE.BID ? bidRange : ''
      return type && adjustValue && !(type !== TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.SET && !range)
    }
    else if (adjustType === TIME_SHARING_TYPE.STATE) {
      const { adjustState } = setting
      return TIME_SHARING_STRATEGY_STATE.getOptions().some(item => item.value === adjustState)
    }
    else if (adjustType === TIME_SHARING_TYPE.PLACEMENT) {
      const { topOfSearchOnAmazon, detailPageOnAmazon, otherOnAmazon } = setting
      return topOfSearchOnAmazon !== undefined || detailPageOnAmazon !== undefined || otherOnAmazon !== undefined
    }
    else if (adjustType === TIME_SHARING_TYPE.BUDGET_PERCENT) {
      const { adjustValue } = setting
      return !!adjustValue
    }
    return false
  }

  const inAdvanceInfo = (adjustType?: number, setting: ObjectAny = {}, inAdvance = 0) => {
    try {
      if (!validateTimeStrategy(setting, adjustType)) { return { display: '--', color: 'red' } }
      const { adjustType: type, adjustValue, budgetRange, bidRange } = setting
      const value = inAdvance
      const range = adjustType === TIME_SHARING_TYPE.BUDGET ? budgetRange : adjustType === TIME_SHARING_TYPE.BID ? bidRange : ''
      const name = TIME_SHARING_TYPE.getLabelByValue(adjustType!)

      const isAdjustBudgetPercent = adjustType === TIME_SHARING_TYPE.BUDGET_PERCENT

      // 优先处理SET类型
      if (type === TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.SET || isAdjustBudgetPercent) {
        const finalValue = isAdjustBudgetPercent ? new Decimal(value).times(new Decimal(adjustValue / 100)).toString() : adjustValue
        return {
          display: finalValue,
          tooltip: `按规则计算结果：\n直接设置为 ${isAdjustBudgetPercent ? `${adjustValue}%` : adjustValue}，所以最终调整为：${finalValue}`,
        }
      }
      // 处理价格超出范围的情况
      const isExceedRange = () => {
        const isUp = [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP_PERCENT].includes(type)
        if ((isUp && value >= range) || (!isUp && value <= range)) {
          return {
            // display: '规则错误',
            display: '-',
            tooltip: `基础${name}（${value}）已${isUp ? `大于等于${name}上限` : `小于等于${name}下限`}（${range}），无法进行${isUp ? '提高' : '降低'}，请调整策略规则。`,
            // color: 'red'
          }
        }
        return null
      }

      // 计算调整后的价格
      const calculateBudget = () => {
        const calculations = {
          [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP]: () => new Decimal(value).plus(new Decimal(adjustValue)).toString(),
          [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP_PERCENT]: () => new Decimal(value).plus(new Decimal(value).times(new Decimal(adjustValue))).toString(),
          [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN]: () => new Decimal(value).minus(new Decimal(adjustValue)).toString(),
          [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN_PERCENT]: () => new Decimal(value).times(new Decimal(1).minus(new Decimal(adjustValue))).toString(),
        }

        const result = calculations[type]()
        const isUp = [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP_PERCENT].includes(type)
        const isPercent = [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP_PERCENT, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN_PERCENT].includes(type)

        const finalValue = isUp ? Math.min(Number(result), Number(range)) : Math.max(Number(result), Number(range))
        const formula = isPercent
          ? `${value}*(1${isUp ? '+' : '-'}${adjustValue})`
          : `${value}${isUp ? '+' : '-'}${adjustValue}`

        return {
          display: finalValue,
          tooltip: `按规则计算结果：\n${formula}=${result}，${isUp ? '大于' : '小于'}预算${isUp ? '上' : '下'}限${range}，所以最终调整为：${finalValue}`,
        }
      }

      const rangeCheck = isExceedRange()
      if (rangeCheck) { return rangeCheck }

      return calculateBudget()
    }
    catch (error) {
      console.error('inAdvanceDisplay error:', error)
      return { display: '--', color: 'red' }
    }
  }

  // 生成时间键
  const generateTimeKeys = (startTime: string, endTime: string) => {
    const getHour = (timeStr: string) => Number.parseInt(timeStr.split(':')[0])
    const startHour = getHour(startTime)
    const endHour = getHour(endTime === '23:59' ? '24:00' : endTime)

    const keys = []
    for (let hour = startHour; hour < endHour; hour++) {
      keys.push(hour)
    }
    return keys
  }

  // 获取分时策略表格数据
  const hours = Array.from({ length: 24 }, (_, index) => index)
  function getExchangeTableData({ data = [], strategyTimes, adjustType }: ObjectAny = {}, strategyTimesType?: number) {
    if (strategyTimesType === TIME_SHARING_STRATEGY_VIEW_TYPE.CALENDAR) {
      return cloneDeep(<ObjectAny[]>data).map((item) => {
        const { name, dayOfWeek, timeRanges = [] } = item
        const tmp = { id: nanoid(), name, dayOfWeek }
        timeRanges.forEach((i: ObjectAny) => {
          const { startTime, endTime, setting } = i
          if (validateTimeStrategy(setting, adjustType)) {
            const keys = generateTimeKeys(startTime, endTime)
            keys.forEach((key) => {
              Object.assign(tmp, { [key]: setting })
            })
          }
        })
        return tmp
      })
    }
    else if (strategyTimesType === TIME_SHARING_STRATEGY_VIEW_TYPE.LIST) {
      return cloneDeep(strategyTimes).map((item: ObjectAny) => {
        const timeRanges: ObjectAny[] = []
        let start: number | null = null

        // 遍历所有小时,找出连续的时间段
        hours.forEach((hour, index) => {
          const current = item[hour]
          if (validateTimeStrategy(current, adjustType)) {
            if (start === null) {
              start = hour
            }
            // 如果是最后一个小时或下一个小时不连续或者配置不一致
            const next = item[hours[index + 1]]
            if (index === hours.length - 1 || !validateTimeStrategy(next, adjustType) || !isEqual(current, next)) {
              timeRanges.push({
                id: nanoid(),
                startTime: `${String(start).padStart(2, '0')}:00`,
                endTime: `${String(hour + 1).padStart(2, '0')}:00`,
                setting: current, // 保存该时间段的配置
              })
              start = null
            }
          }
        })

        return {
          ...item,
          timeRanges, // 添加合并后的时间范围
        }
      })
    }
    return []
  }

  // 预算编辑描述
  const priceEditDesc = (setting: ObjectAny, adjustType: number) => {
    if (!validateTimeStrategy(setting, adjustType)) { return '--' }
    const { adjustType: type, adjustValue, budgetRange, bidRange } = setting
    const range = adjustType === TIME_SHARING_TYPE.BUDGET ? budgetRange : adjustType === TIME_SHARING_TYPE.BID ? bidRange : ''
    const isAdjustBudgetPercent = adjustType === TIME_SHARING_TYPE.BUDGET_PERCENT
    const descriptions = {
      [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.SET]: () =>
        `直接设置为$${isAdjustBudgetPercent ? `${adjustValue}%` : adjustValue}`,
      [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP]: () =>
        `预算上浮($)：${adjustValue}，预算上限$${range}`,
      [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP_PERCENT]: () =>
        `预算上浮(%)：${adjustValue}%，预算上限$${range}`,
      [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN]: () =>
        `预算下调($)：${adjustValue}，预算下限$${range}`,
      [TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN_PERCENT]: () =>
        `预算下调(%)：${adjustValue}%，预算下限$${range}`,
    }
    return descriptions[type]?.() || '--'
  }

  const priceEditFluctuation = (settingList: Array<any | never> = []) => {
    try {
      const [adjustType, setting = {}, preSetting = {}, inAdvance = 0] = settingList
      if (!validateTimeStrategy(setting, adjustType)) { return '--' }
      const currentInfo = inAdvanceInfo(adjustType, setting, inAdvance)
      if (!validateTimeStrategy(preSetting, adjustType)) { return currentInfo.display }
      const preInfo = inAdvanceInfo(adjustType, preSetting, inAdvance)
      return new Decimal(currentInfo.display).minus(new Decimal(preInfo.display)).toString()
    }
    catch {
      return '--'
    }
  }

  // 下一个次分时预算调整
  const nextPriceTimeSharingAdjust = (adjustType: number, setting: ObjectAny = {}, inAdvance = 0) => {
    try {
      const { adjustFrequency, adjustType: type, strategyTimes } = setting
      if (type === TIME_SHARING_ADJUST_TYPE.TIME) {
        if (adjustFrequency === TIME_SHARING_ADJUST_FREQUENCY.DAY) {
          const now = dayjs().tz('America/Los_Angeles')
          const list = cloneDeep(<ObjectAny[]>strategyTimes).map(m => ({ ...m, startDate: `${dayjs().tz('America/Los_Angeles').format('YYYY-MM-DD')} ${m.startTime}`, endDate: `${dayjs().tz('America/Los_Angeles').format('YYYY-MM-DD')} ${m.endTime}` })).sort((a, b) => dayjs(a.startDate).diff(now) - dayjs(b.startDate).diff(now))
          // const current = list.find(f => now.isBetween(dayjs(f.startDate), dayjs(f.endDate)))
          const next = list.find(f => dayjs(f.startDate).isAfter(now))
          return `（${next ? next.startDate : dayjs(list[0].startDate).add(1, 'day').format('YYYY-MM-DD HH:mm')}，调整为$${inAdvanceInfo(adjustType, next || list[0], inAdvance).display}）`
        }
      }
    }
    catch {
      return ''
    }
  }

  return {
    initStrategyTimes,
    validateTimeStrategy,
    inAdvanceInfo,
    generateTimeKeys,
    getExchangeTableData,
    priceEditDesc,
    priceEditFluctuation,
    nextPriceTimeSharingAdjust,
  }
}
