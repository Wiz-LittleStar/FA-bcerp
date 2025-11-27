import type { VxeGridPropTypes } from 'vxe-table'
import type { enumAdsManagementTabs, enumAdsManagementType, enumTimeSharingType } from '@/utils/enum/advertise'
import * as api from '@/api/modules/advertise/amazon'
import { sysDictionaryGet } from '@/api/modules/base'
import { ADS_COMBINATION_STATE, ADS_MANAGEMENT_TABS, ADS_MANAGEMENT_TYPE, ADS_SD_CAMPAIGN_STATE, ADS_TYPE, ADS_VIEW_TYPE, DATA_EXPORT_TASK_STATUS, TIME_SHARING_TYPE } from '@/utils/enum/advertise'

export type AdjustType = enumTimeSharingType[keyof enumTimeSharingType]
export type CommonTabType = enumAdsManagementTabs[keyof enumAdsManagementTabs]
export type CommonType = enumAdsManagementType[keyof enumAdsManagementType]

const { getStore, setStore } = useUtils()

const ILLEGAL_SYMBOLS = ['@', '#', '*', '/']
const PERCENT_FIELDS = ['ctr', 'cvr', 'acos', 'acoas', 'asoas']
const AVG_FIELDS = ['ctr', 'cvr', 'acos', 'roas', 'cpc', 'cpa', 'spc', 'cpv']
const RATIO_FIELDS = [
  'impressions',
  'clicks',
  'clicksProportion',
  'ctr',
  'cost',
  'topOfSearchImpressionShare',
  'sales',
  'salesAmount',
  'cpc',
  'acos',
  'acoas',
  'asoas',
  'roas',
  'purchases',
  'indirectOrderCount',
  'indirectOrderCountRate',
  'cvr',
  'cpa',
  'unitsSold',
]

// 共享搜索项配置
const SHARED_SEARCH_FIELDS = ['portfolioIds', 'campaignName']
const TYPE_SPECIFIC_FIELDS: { [key in CommonType]: string[] } = {
  [ADS_MANAGEMENT_TYPE.SP]: ['targetTypes', 'adsDetailTypes'],
  [ADS_MANAGEMENT_TYPE.SD]: ['targetTypes', 'adsDetailTypes'],
  [ADS_MANAGEMENT_TYPE.SB]: ['targetTypes', 'adsDetailTypes'],
}
const SHARED_SEARCH_STORAGE_KEY = 'AdsSharedSearch'
const SORT_STORAGE_KEY = 'adsSortStorage'

// 广告类型映射
const ADS_TYPE_COMPONENT_MAP = {
  [ADS_TYPE.SP]: ADS_MANAGEMENT_TYPE.SP,
  [ADS_TYPE.SD]: ADS_MANAGEMENT_TYPE.SD,
  [ADS_TYPE.SB]: ADS_MANAGEMENT_TYPE.SB,
}

// 分时策略配置
const TIME_SHARING_STRATEGY_ENABLE_SETTING = {
  [TIME_SHARING_TYPE.BUDGET]: [ADS_MANAGEMENT_TABS.ADS_ACTIVITY],
  [TIME_SHARING_TYPE.STATE]: [ADS_MANAGEMENT_TABS.ADS_ACTIVITY],
  [TIME_SHARING_TYPE.PLACEMENT]: [ADS_MANAGEMENT_TABS.ADS_ACTIVITY],
  [TIME_SHARING_TYPE.BID]: [ADS_MANAGEMENT_TABS.ADS_GROUP, ADS_MANAGEMENT_TABS.ADS_TARGET],
  [TIME_SHARING_TYPE.BUDGET_PERCENT]: [ADS_MANAGEMENT_TABS.ADS_ACTIVITY],
}

// 分时策略API映射配置
const timeSharingStrategyApiMap = {
  template: {
    [TIME_SHARING_TYPE.BUDGET]: api.amazonAdsAdjustBudgetAdjustBudgetTemplates,
    [TIME_SHARING_TYPE.STATE]: api.amazonAdsAdjustStateAdjustStateTemplates,
    [TIME_SHARING_TYPE.PLACEMENT]: api.amazonAdsAdjustPlacementAdjustPlacementTemplates,
    [TIME_SHARING_TYPE.BID]: api.amazonAdsAdjustBidAdjustBidTemplates,
    [TIME_SHARING_TYPE.BUDGET_PERCENT]: api.amazonAdsAdjustBudgetPercentStrategyGetTemplateList,
  },
  get: {
    [TIME_SHARING_TYPE.BUDGET]: api.amazonAdsAdjustBudgetGetAdsAdjustBudgetStrategy,
    [TIME_SHARING_TYPE.STATE]: api.amazonAdsAdjustStateGetAdsAdjustStateStrategy,
    [TIME_SHARING_TYPE.PLACEMENT]: api.amazonAdsAdjustPlacementGetAdsPlacementStrategyVO,
    [TIME_SHARING_TYPE.BID]: api.amazonAdsAdjustBidGetAdsBidStrategyVO,
    [TIME_SHARING_TYPE.BUDGET_PERCENT]: api.amazonAdsAdjustBudgetPercentStrategyGetStrategy,
  },
  create: {
    [TIME_SHARING_TYPE.BUDGET]: api.amazonAdsAdjustBudgetCreateAdjustBudgetStrategy,
    [TIME_SHARING_TYPE.STATE]: api.amazonAdsAdjustStateCreateAdjustStateStrategy,
    [TIME_SHARING_TYPE.PLACEMENT]: api.amazonAdsAdjustPlacementCreateAdjustPlacementStrategy,
    [TIME_SHARING_TYPE.BID]: api.amazonAdsAdjustBidCreateAdjustBidStrategy,
    [TIME_SHARING_TYPE.BUDGET_PERCENT]: api.amazonAdsAdjustBudgetPercentStrategyCreate,
  },
  update: {
    [TIME_SHARING_TYPE.BUDGET]: api.amazonAdsAdjustBudgetUpdateAdjustBudgetStrategy,
    [TIME_SHARING_TYPE.STATE]: api.amazonAdsAdjustStateUpdateAdjustStateStrategy,
    [TIME_SHARING_TYPE.PLACEMENT]: api.amazonAdsAdjustPlacementUpdateAdjustPlacementStrategy,
    [TIME_SHARING_TYPE.BID]: api.amazonAdsAdjustBidUpdateAdjustBidStrategy,
    [TIME_SHARING_TYPE.BUDGET_PERCENT]: api.amazonAdsAdjustBudgetPercentStrategyUpdateStrategy,
  },
  remove: {
    [TIME_SHARING_TYPE.BUDGET]: api.amazonAdsAdjustBudgetDeleteAdjustBudgetStrategy,
    [TIME_SHARING_TYPE.STATE]: api.amazonAdsAdjustStateDeleteAdjustStateStrategy,
    [TIME_SHARING_TYPE.PLACEMENT]: api.amazonAdsAdjustPlacementDeleteAdjustPlacementStrategy,
    [TIME_SHARING_TYPE.BID]: api.amazonAdsAdjustBidDeleteAdjustBidStrategy,
    [TIME_SHARING_TYPE.BUDGET_PERCENT]: api.amazonAdsAdjustBudgetPercentStrategyDeleteAdjustBudgetStrategy,
  },
  detail: {
    [TIME_SHARING_TYPE.BUDGET]: api.amazonAdsAdjustBudgetGetAdsBudgetStrategyVOByStrategyId,
    [TIME_SHARING_TYPE.STATE]: api.amazonAdsAdjustStateGetAdsStateStrategyVOByStrategyId,
    [TIME_SHARING_TYPE.PLACEMENT]: api.amazonAdsAdjustPlacementGetAdsPlacementStrategyVOByStrategyId,
    [TIME_SHARING_TYPE.BID]: api.amazonAdsAdjustBidGetAdsBidStrategyVOByStrategyId,
    [TIME_SHARING_TYPE.BUDGET_PERCENT]: api.amazonAdsAdjustBudgetPercentStrategyGetStrategyVOByStrategyId,
  },
}
// 用API映射配置
const commonApiMap = {
  [ADS_MANAGEMENT_TYPE.SP]: {
    updateBudget: api.amazonSpCampaignUpdateBudget,
    updateBaseBudget: api.amazonAdsAdjustBudgetUpdateBaseBudget,
    updateState: api.amazonSpCampaignUpdateState,
    deleteArchived: api.amazonSpCampaignDeleteArchived,
    updateCampaignName: api.amazonSpCampaignUpdateName,
    updateAdvGroup: api.amazonAdsCampaignUpdatePortfolioId,
    updateAdvEndDate: api.amazonSpCampaignUpdateEndDate,

    updateBudgetGroup: api.amazonSpAdGroupUpdateBid,
    deleteArchivedGroup: api.amazonSpAdGroupDeleteArchived,
    updateStateGroup: api.amazonSpAdGroupUpdateState,
    updateGroupName: api.amazonSpAdGroupUpdateName,

    updateBudgetPosition: api.amazonSpCampaignUpdatePlacement,

    deleteArchivedProduct: api.amazonSpProductAdsDelete,
    updateStateProduct: api.amazonSpProductAdsUpdate,

    updateBudgetTarget: api.amazonSpTargetUpdateTarget,
    deleteArchivedTarget: api.amazonSpTargetDeleteTarget,
    updateStateTarget: api.amazonSpTargetUpdateTarget,

    deleteArchivedNegativeTarget: api.amazonAdsNegativeTargetDeleteNegativeTarget,

    updateBudgetSearchTerm: api.amazonSpTargetUpdateTarget,

    timeSharingStrategy: timeSharingStrategyApiMap,
  },
  [ADS_MANAGEMENT_TYPE.SD]: {
    updateBudget: api.amazonSdCampaignUpdateBudget,
    updateBaseBudget: api.amazonAdsAdjustBudgetUpdateBaseBudget,
    updateState: api.amazonSdCampaignUpdateState,
    deleteArchived: api.amazonSpCampaignDeleteArchived,
    updateCampaignName: api.amazonSdCampaignUpdateName,
    updateAdvEndDate: api.amazonSdCampaignUpdateEndDate,

    updateBudgetGroup: api.amazonSdGroupUpdateDefaultBid,
    updateStateGroup: api.amazonSdGroupUpdateState,
    updateGroupName: api.amazonSdGroupUpdateName,

    updateStateProduct: api.amazonSdProductUpdateState,

    updateBudgetTarget: api.amazonSdTargetUpdateBid,
    updateStateTarget: api.amazonSdTargetUpdateState,

    deleteArchivedNegativeTarget: api.amazonAdsNegativeTargetUpdateSdNegativeTargetState,
  },
  [ADS_MANAGEMENT_TYPE.SB]: {
    updateBudget: api.amazonSbCampaignUpdateBudget,
    updateBaseBudget: api.amazonAdsAdjustBudgetUpdateBaseBudget,
    updateState: api.amazonSbCampaignUpdateState,
    deleteArchived: api.amazonSbCampaignDeleteArchived,
    updateCampaignName: api.amazonSbCampaignUpdateName,
    updatePortfolioId: api.amazonSbCampaignUpdatePortfolioId,
    updateAdvEndDate: api.amazonSbCampaignUpdateEndDate,

    updateStateGroup: api.amazonSbAdGroupUpdateState,
    deleteArchivedGroup: api.amazonSbAdGroupDeleteArchived,
    updateGroupName: api.amazonSbAdGroupUpdateName,

    updateBudgetTarget: api.amazonSbTargetUpdateBid,
    deleteArchivedTarget: api.amazonSbTargetDeleteArchived,
    updateStateTarget: api.amazonSbTargetUpdateStatus,
  },
}

const tabApiMap = {
  [ADS_MANAGEMENT_TABS.ADS_COMBINATION]: {
    indicators: api.amazonAdsPortfoliosIndicators,
    chartData: api.amazonAdsPortfoliosChart,
    listData: async (params: ObjectAny) => {
      const res = await api.amazonAdsPortfoliosPagePortfoliosData(params)
      return { data: res }
    },
  },
  [ADS_MANAGEMENT_TABS.ADS_ACTIVITY]: {
    indicators: api.amazonAdsCampaignIndicators,
    chartData: api.amazonAdsCampaignChart,
    listData: api.amazonAdsCampaignPage,
    adsLevelType: 'campaign',
  },
  [ADS_MANAGEMENT_TABS.ADS_GROUP]: {
    indicators: api.amazonAdsAdGroupIndicators,
    chartData: api.amazonAdsAdGroupChart,
    listData: api.amazonAdsAdGroupPage,
    adsLevelType: 'group',
  },
  [ADS_MANAGEMENT_TABS.ADS_PLACEMENT]: {
    indicators: api.amazonAdsCampaignPlacementIndicators,
    chartData: api.amazonAdsCampaignPlacementChart,
    listData: api.amazonAdsCampaignPlacementPage,
    adsLevelType: 'placement',
  },
  [ADS_MANAGEMENT_TABS.ADS_PRODUCT]: {
    indicators: api.amazonSpProductAdsIndicators,
    chartData: api.amazonSpProductAdsChart,
    listData: api.amazonSpProductAdsPage,
  },
  [ADS_MANAGEMENT_TABS.ADS_ADVERTISEMENT]: {
    indicators: api.amazonSbAdDetailIndicators,
    chartData: api.amazonSbAdDetailChart,
    listData: api.amazonSbAdDetailPage,
  },
  [ADS_MANAGEMENT_TABS.ADS_TARGET]: {
    indicators: api.amazonAdsTargetIndicators,
    chartData: api.amazonAdsTargetChart,
    listData: async (params: ObjectAny) => {
      const res = await api.amazonAdsTargetPage(params)
      return { data: res }
    },
    adsLevelType: 'target',
  },
  [ADS_MANAGEMENT_TABS.ADS_NEGATIVE_TARGET]: {
    listData: api.amazonAdsNegativeTargetNegativeTargetPage,
  },
  [ADS_MANAGEMENT_TABS.SEARCH_TERM]: {
    indicators: api.amazonAdsSearchTermIndicators,
    chartData: api.amazonAdsSearchTermChart,
    listData: api.amazonAdsSearchTermPage,
  },
  [ADS_MANAGEMENT_TABS.OPERATION_LOG]: {
    listData: api.amazonAdsOperationLogPage,
  },
}

const datePickerShortcuts = {
  1: '今天',
  2: '昨天',
  3: '近3天',
  4: '近7天',
  5: '近14天',
  6: '近30天',
  7: '近60天',
  8: '近90天',
  9: '近半年',
  10: '近一年',
  11: '本周',
  12: '上周',
  13: '本月',
  14: '上个月',
  15: '本年至今',
}

/**
 * 检查值是否为空
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为空
 */
function isEmpty(value: any, { ignoreArray = false } = {}) {
  if (value === undefined || value === null || value === '') {
    return true
  }
  if (Array.isArray(value) && !ignoreArray) {
    return value.length === 0
  }
  if (isObject(value)) {
    return Object.keys(value).length === 0
  }
  return false
}

/**
 * 检查值是否为有效数字
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为有效数字
 */
function isValidNumber(value: any) {
  const num = Number.parseFloat(value)
  return !Number.isNaN(num) && Number.isFinite(num) && String(num) === String(value)
}

export default function useAmazonAdsUtils() {
  // 响应式数据
  const indicatorData = ref({})
  const siteList = reactive<ObjectAny[]>([])
  const adsCombinationList = reactive<ObjectAny[]>([])

  /**
   * 创建方法工厂函数
   * @param {object} apiMap - API映射对象
   * @param {string} errorMessage - 错误信息
   * @returns {Function} 方法获取函数
   */
  const createMethodFactory = (apiMap: typeof commonApiMap, errorMessage = '未定义操作') => {
    return (adsType = '', ...path: string[]) => {
      const component = (ADS_TYPE_COMPONENT_MAP as any)[adsType] || adsType
      const apiMapEntry = (apiMap as any)[component]
      const method = path.reduce((obj: any, key: string) => obj?.[key], apiMapEntry)
      return method || Promise.reject(new Error(errorMessage))
    }
  }

  /**
   * 获取通用方法
   */
  const getCommonMethod = createMethodFactory(commonApiMap)

  /**
   * 获取Tab页面相关方法
   * @param {string} tab - Tab标识
   * @param {string} component - 组件类型
   * @param {string} type - 方法类型
   * @returns {Function} 对应的API方法
   */
  const getTabMethod = (tab: CommonTabType | undefined, component = '', type: string) => {
    if (!tab) {
      return Promise.reject(new Error('未定义操作'))
    }
    const tabEntry = tabApiMap[tab] as any
    const method = tabEntry?.[`${component}${type}`]
    return method || Promise.reject(new Error('未定义操作'))
  }

  /**
   * 通用API方法生成器
   * @param {string} methodName - 方法名称
   * @returns {Function} API方法获取器
   */
  const createApiMethodGetter = (methodName: string) => (component: string) => getCommonMethod(component, methodName)

  // API方法获取器
  const apiMethods = {
    /** 获取更新预算方法 */
    getUpdateBudgetMethod: createApiMethodGetter('updateBudget'),
    /** 获取更新基准预算方法 */
    getUpdateBaseBudgetMethod: createApiMethodGetter('updateBaseBudget'),
    /** 获取更新状态方法 */
    getUpdateStateMethod: createApiMethodGetter('updateState'),
    /** 获取删除归档方法 */
    getDeleteArchivedMethod: createApiMethodGetter('deleteArchived'),
    /** 获取更新广告活动名称方法 */
    getUpdateCampaignNameMethod: createApiMethodGetter('updateCampaignName'),
    /** 获取更新广告组合方法 */
    getUpdateAdvGroupMethod: createApiMethodGetter('updateAdvGroup'),
    /** 获取更新广告结束日期方法 */
    getUpdateAdvEndDateMethod: createApiMethodGetter('updateAdvEndDate'),
    /** 获取更新广告组预算方法 */
    getUpdateBudgetGroupMethod: createApiMethodGetter('updateBudgetGroup'),
    /** 获取删除广告组归档方法 */
    getDeleteArchivedGroupMethod: createApiMethodGetter('deleteArchivedGroup'),
    /** 获取更新广告组状态方法 */
    getUpdateStateGroupMethod: createApiMethodGetter('updateStateGroup'),
    /** 获取更新广告组名称方法 */
    getUpdateGroupNameMethod: createApiMethodGetter('updateGroupName'),
    /** 获取更新广告位预算方法 */
    getUpdateBudgetPositionMethod: createApiMethodGetter('updateBudgetPosition'),
    /** 获取删除商品归档方法 */
    getDeleteArchivedProductMethod: createApiMethodGetter('deleteArchivedProduct'),
    /** 获取更新商品状态方法 */
    getUpdateStateProductMethod: createApiMethodGetter('updateStateProduct'),
    /** 获取更新投放预算方法 */
    getUpdateBudgetPutMethod: createApiMethodGetter('updateBudgetPut'),
    /** 获取删除投放归档方法 */
    getDeleteArchivedPutMethod: createApiMethodGetter('deleteArchivedPut'),
    /** 获取更新投放状态方法 */
    getUpdateStatePutMethod: createApiMethodGetter('updateStatePut'),
    /** 获取删除否定投放归档方法 */
    getDeleteArchivedNegativePutMethod: createApiMethodGetter('deleteArchivedNegativePut'),
    /** 获取更新搜索词预算方法 */
    getUpdateBudgetSearchTermMethod: createApiMethodGetter('updateBudgetSearchTerm'),
  }

  // Tab相关方法
  const tabMethods = {
    /** 获取指标数据方法 */
    getIndicatorDataMethod: (tab?: CommonTabType, component = '') => getTabMethod(tab, component, 'indicators'),
    /** 获取图表数据方法 */
    getChartDataMethod: (tab?: CommonTabType, component = '') => getTabMethod(tab, component, 'chartData'),
    /** 获取列表数据方法 */
    getListDataMethod: (tab?: CommonTabType, component = '') => getTabMethod(tab, component, 'listData'),
    /** 获取广告级别类型 */
    getAdsLevelType: (tab?: CommonTabType, component = '') => getTabMethod(tab, component, 'adsLevelType'),
  }

  // 数据处理工具
  const dataUtils = {
    /**
     * 处理查询参数，清除空值和特殊处理
     * @param {object} params - 查询参数对象
     * @returns {object} 处理后的参数对象
     */
    handleQueryParams: (params: ObjectAny) => {
      if (!isObject(params)) { return {} }

      const cleanedParams = { ...params }
      Object.keys(cleanedParams).forEach((key) => {
        if (isEmpty(cleanedParams[key])) {
          delete cleanedParams[key]
        }
      })

      if (Array.isArray(cleanedParams.asin)) {
        delete cleanedParams.asin
      }
      return cleanedParams
    },

    /**
     * 获取行键
     * @param {object} item - 行数据
     * @returns {string} 行键
     */
    getRowKey: (item: ObjectAny) => {
      return item.key.replace(/Ratio$/, '')
    },

    /**
     * 计算数值字段的总和
     * @param {object} data - 数据对象
     * @param {string} field - 字段名
     * @returns {number} 计算结果
     */
    sumNum: (data: ObjectAny, field: string) => {
      const value = data[`${field}Ratio`]?.value ?? 0
      return isValidNumber(value) ? value : 0
    },

    /**
     * 获取货币符号
     * @param {object} data - 数据对象
     * @param {string} field - 字段名
     * @returns {string} 货币符号
     */
    getCurrencySymbol: (data: ObjectAny, field: string) => {
      const symbol = data[`${field}Ratio`]?.currencySymbol
      return symbol ? `${symbol} ` : ''
    },

    /**
     * 处理表格列配置
     * @param {Array} columns - 表格列配置数组
     * @returns {Array} 处理后的列配置数组
     */
    handleGridColumns: (columns: VxeGridPropTypes.Columns): VxeGridPropTypes.Columns => {
      return columns.map((m) => {
        if (!isObject(m.slots)) {
          Object.assign(m, { slots: {} })
        }
        if (m.slots) {
          if (m.field) {
            Object.assign(m.slots, { header: `${m.field}Header` })
            if (RATIO_FIELDS.includes(m.field)) {
              Object.assign(m.slots, { default: m.field })
            }
          }
        }
        return m
      })
    },

    isAsinViewType: (viewType: number) => [ADS_VIEW_TYPE.MSKU, ADS_VIEW_TYPE.ASIN].includes(viewType),
    isParentAsinViewType: (viewType: number) => [ADS_VIEW_TYPE.PARENT_ASIN].includes(viewType),
    isCombineViewType: (viewType: number) => [ADS_VIEW_TYPE.ADS_COMBINE].includes(viewType),
    isAdsActivityViewType: (viewType: number) => [ADS_VIEW_TYPE.ADS_ACTIVITT].includes(viewType),
  }

  // 指标数据处理
  const indicatorUtils = {
    /**
     * 获取指标数据
     * @param {object} params - 查询参数
     * @param {...any} args - 其他参数
     */
    getIndicatorData: async (params: ObjectAny, ...args: Parameters<typeof tabMethods.getIndicatorDataMethod>) => {
      try {
        const { data = {} } = await tabMethods.getIndicatorDataMethod(...args)(params)
        indicatorData.value = isObject(data) ? data : {}
      }
      catch (error) {
        console.error('获取指标数据失败:', error)
        indicatorData.value = {}
      }
    },

    // 获取表格汇总数据
    getSummaries: (columns: VxeGridPropTypes.Columns = [], { sumTextColumnIndex = 1, extraData = {} } = {}) => {
      const sums = columns.map((column, columnIndex) => {
        if (columnIndex === sumTextColumnIndex) {
          return '合计'
        }

        if (column.field === 'budget') {
          return `${(<ObjectAny>extraData).totalBudget}`
        }

        if (column.field && RATIO_FIELDS.includes(column.field)) {
          const currencySymbol = dataUtils.getCurrencySymbol(indicatorData.value, column.field)
          const value = dataUtils.sumNum(indicatorData.value, column.field)
          const suffix = PERCENT_FIELDS.includes(column.field) ? '%' : ''
          return `${currencySymbol}${value}${suffix}`
        }

        return null
      })

      return [sums]
    },

    /**
     * 获取表格底部单元格样式类名
     * @param {object} param0 - 列配置
     * @param {object} param0.column - 列对象
     * @returns {string} 样式类名
     */
    getFooterCellClass: ({ column }: ObjectAny) => {
      return RATIO_FIELDS.includes(column?.property) ? 'link-text' : ''
    },
  }

  // 趋势分析
  const showTrendAnalysis = inject('showTrendAnalysis', (_row: ObjectAny, _setting: ObjectAny) => { })
  const trendUtils = {
    /**
     * 打开趋势分析对话框
     * @param {string} field - 字段名
     * @param {object} row - 行数据
     * @param {string} activeTab - 当前活跃的Tab
     * @param {object} trendExtSearch - 趋势扩展搜索参数
     */
    openTrendAnalysisDialog: (field: string, row: ObjectAny, activeTab: CommonTabType | undefined, trendExtSearch: ObjectAny = {}) => {
      if (!activeTab) { return }
      showTrendAnalysis(row, { field, type: activeTab, trendExtSearch })
    },

    /**
     * 表格底部单元格点击事件
     * @param {object} param0 - 列配置
     * @param {object} param0.column - 列对象
     * @param {string} activeTab - 当前活跃的Tab
     */
    footerCellClick: ({ column }: ObjectAny, activeTab: CommonTabType | undefined) => {
      if (RATIO_FIELDS.includes(column?.property) && activeTab) {
        trendUtils.openTrendAnalysisDialog(column.property, {}, activeTab)
      }
    },
  }

  // 数据获取工具
  const { request: adsCombinationListRequest } = useRequest()
  const { request: adsCombinationListByShopRequest } = useRequest()
  const { request: sysDictionaryGetRequest } = useRequest()
  const dataFetchers = {
    /**
     * 获取站点列表
     */
    getSiteList: async () => {
      try {
        const { data } = await sysDictionaryGetRequest(sysDictionaryGet('AMAZON_SITE'))
        const list = Array.isArray(data) ? data.find(item => item.uniqueName === 'AMAZON_SITE')?.children || [] : []
        siteList.splice(0, siteList.length, ...list)
      }
      catch (error) {
        console.error('获取站点列表失败:', error)
        siteList.length = 0
      }
    },

    /**
     * 获取广告组合列表
     * @param {Array} shopIds - 店铺ID数组
     * @param {boolean} detail - 是否获取详细信息
     */
    getAdsCombinationList: async (shopIds = [], detail = false) => {
      try {
        if (!(Array.isArray(shopIds) && !!shopIds.length)) {
          adsCombinationList.length = 0
          return
        }

        let result = []
        if (detail) {
          const { data: { records } } = await adsCombinationListRequest(api.amazonAdsPortfoliosPage, {
            pageNum: -1,
            pageSize: -1,
            shopIds,
          })
          result = records
        }
        else {
          const { data } = await adsCombinationListByShopRequest(api.amazonAdsPortfoliosListByShop, shopIds)
          result = data
        }

        adsCombinationList.splice(0, adsCombinationList.length, ...(Array.isArray(result) ? result : []))
      }
      catch (error) {
        console.error('获取广告组合列表失败:', error)
        adsCombinationList.length = 0
      }
    },
  }

  // 存储工具
  const storageUtils = {
    /**
     * 刷新搜索存储数据
     * @param {string} key - 存储键名
     * @param {*} val - 存储值
     * @param {string} storageKey - localStorage键名
     */
    refreshSearchStorage: (key: string, val: any, storageKey: string) => {
      const data = getStore(storageKey)
      data[key] = val
      setStore(storageKey, data)
    },

    /**
     * 设置共享搜索存储数据
     * @param {string} key - 存储键名
     * @param {*} val - 存储值
     * @param {string} currentType - 当前类型
     */
    setSharedSearchStorage: (key: string, val: any, currentType: CommonType | undefined) => {
      if (!SHARED_SEARCH_FIELDS.includes(key) || !currentType) {
        return
      }

      const sharedData = getStore(SHARED_SEARCH_STORAGE_KEY)
      const typeSpecificFields = TYPE_SPECIFIC_FIELDS[currentType] || []

      if (typeSpecificFields.includes(key)) {
        if (!sharedData[currentType]) {
          sharedData[currentType] = {}
        }
        sharedData[currentType][key] = val
      }
      else {
        sharedData[key] = val
      }

      setStore(SHARED_SEARCH_STORAGE_KEY, sharedData)
    },

    /**
     * 获取共享搜索存储数据
     * @param {string} currentType - 当前类型
     * @returns {object} 共享搜索数据
     */
    getSharedSearchStorage: (currentType: CommonType) => {
      const sharedData = getStore(SHARED_SEARCH_STORAGE_KEY)
      const result: ObjectAny = {}

      // 获取通用共享字段
      SHARED_SEARCH_FIELDS.forEach((field) => {
        const typeSpecificFields = TYPE_SPECIFIC_FIELDS[currentType] || []
        if (!typeSpecificFields.includes(field) && sharedData[field] !== undefined) {
          result[field] = sharedData[field]
        }
      })

      // 获取类型特定字段
      const typeSpecificFields = TYPE_SPECIFIC_FIELDS[currentType] || []
      typeSpecificFields.forEach((field) => {
        if (sharedData[currentType]?.[field] !== undefined) {
          result[field] = sharedData[currentType][field]
        }
      })

      return result
    },

    /**
     * 刷新搜索存储数据（包含共享功能）
     * @param {string} key - 存储键名
     * @param {*} val - 存储值
     * @param {string} storageKey - localStorage键名
     * @param {string} currentType - 当前类型
     */
    refreshSearchWithSharing: (key: string, val: any, storageKey: string, currentType: CommonType | undefined) => {
      storageUtils.refreshSearchStorage(key, val, storageKey)
      storageUtils.setSharedSearchStorage(key, val, currentType)
    },

    /**
     * 初始化带共享功能的搜索表单数据
     * @param {object} defaultData - 默认数据
     * @param {string} storageKey - localStorage键名
     * @param {string} currentType - 当前类型
     * @returns {object} 初始化后的表单数据
     */
    initSearchWithSharing: (defaultData: ObjectAny, storageKey: string, currentType: CommonType | undefined) => {
      const localData = getStore(storageKey)

      // 过滤掉空值的本地数据
      const filteredLocalData = Object.fromEntries(
        Object.entries(localData).filter(([_, value]) => !isEmpty(value, { ignoreArray: true })),
      )

      if (!currentType) { return { ...defaultData, ...filteredLocalData } }

      const sharedData = storageUtils.getSharedSearchStorage(currentType)
      // 过滤掉空值的共享数据
      const filteredSharedData = Object.fromEntries(
        Object.entries(sharedData).filter(([_, value]) => !isEmpty(value, { ignoreArray: true })),
      )

      return { ...defaultData, ...filteredLocalData, ...filteredSharedData }
    },

    /**
     * 获取排序存储数据
     * @param {string} key - 存储键名
     * @returns {object} 排序数据
     */
    getSortStorage: (key: string) => {
      const data = getStore(SORT_STORAGE_KEY)
      return isObject(data[key]) ? data[key] : {}
    },

    /**
     * 设置排序存储数据
     * @param {string} key - 存储键名
     * @param {string} property - 排序字段
     * @param {string} order - 排序顺序
     */
    setSortStorage: (key: string, property: string, order: string) => {
      const data = getStore(SORT_STORAGE_KEY)
      data[key] = { field: property, order }
      setStore(SORT_STORAGE_KEY, data)
    },
  }

  // 分时策略工具
  const timeSharingUtils = {
    /**
     * 获取启用分时策略的类型列表
     * @param {string} tab - Tab标识
     * @returns {Array} 分时策略类型数组
     */
    getEnableTimeSharingStrategyType: (tab?: CommonTabType) => {
      if (!tab) { return [] }
      return Object.entries(TIME_SHARING_STRATEGY_ENABLE_SETTING)
        .filter(([_, tabs]) => tabs.includes(tab))
        .map(([type]) => Number(type))
    },

    /**
     * 检查是否存在指定类型的分时策略
     * @param {Array} dataList - 数据列表
     * @param {number} adjustType - 调整类型
     * @returns {object | undefined} 匹配的分时策略对象
     */
    existTimeSharingStrategy: (dataList: ObjectAny[], adjustType: AdjustType) => {
      return dataList?.find(s => s.adjustType === adjustType)
    },

    /**
     * 获取分时策略模板方法
     * @param {number} adjustType - 调整类型
     * @param {string} component - 组件类型
     * @returns {Function} 模板方法
     */
    templateTimeSharingStrategyMethod: (adjustType: AdjustType, component = ADS_MANAGEMENT_TYPE.SP) =>
      getCommonMethod(component, 'timeSharingStrategy', 'template', String(adjustType)),

    /**
     * 获取分时策略数据方法
     * @param {Array} dataList - 数据列表
     * @param {number} adjustType - 调整类型
     * @param {string} component - 组件类型
     * @returns {Promise<object | undefined>} 分时策略数据
     */
    getTimeSharingStrategyMethod: async (dataList: ObjectAny[], adjustType: AdjustType, component = ADS_MANAGEMENT_TYPE.SP) => {
      try {
        const current = timeSharingUtils.existTimeSharingStrategy(dataList, adjustType)
        if (!current) { return undefined }

        const { data } = await getCommonMethod(component, 'timeSharingStrategy', 'get', String(current.adjustType))({
          adsObjId: current.id,
        })
        return isObject(data) ? data : {}
      }
      catch (error) {
        return Promise.reject(error)
      }
    },

    /**
     * 创建分时策略方法
     * @param {number} adjustType - 调整类型
     * @param {string} component - 组件类型
     * @returns {Function} 创建方法
     */
    createTimeSharingStrategyMethod: (adjustType: AdjustType, component = ADS_MANAGEMENT_TYPE.SP) =>
      getCommonMethod(component, 'timeSharingStrategy', 'create', String(adjustType)),

    /**
     * 更新分时策略方法
     * @param {number} adjustType - 调整类型
     * @param {string} component - 组件类型
     * @returns {Function} 更新方法
     */
    updateTimeSharingStrategyMethod: (adjustType: AdjustType, component = ADS_MANAGEMENT_TYPE.SP) =>
      getCommonMethod(component, 'timeSharingStrategy', 'update', String(adjustType)),

    /**
     * 删除分时策略方法
     * @param {number} adjustType - 调整类型
     * @param {string} component - 组件类型
     * @returns {Function} 删除方法
     */
    removeTimeSharingStrategyMethod: (adjustType: AdjustType, component = ADS_MANAGEMENT_TYPE.SP) =>
      getCommonMethod(component, 'timeSharingStrategy', 'remove', String(adjustType)),

    /**
     * 获取分时策略详情方法
     * @param {Array} dataList - 数据列表
     * @param {number} adjustType - 调整类型
     * @param {string} component - 组件类型
     * @returns {Promise<object | undefined>} 分时策略详情数据
     */
    getTimeSharingStrategyDetailMethod: async (dataList: ObjectAny[], adjustType: AdjustType, component = ADS_MANAGEMENT_TYPE.SP) => {
      try {
        const current = timeSharingUtils.existTimeSharingStrategy(dataList, adjustType)
        if (!current) { return undefined }

        const { data } = await getCommonMethod(component, 'timeSharingStrategy', 'detail', String(current.adjustType))({
          id: current.id,
        })
        return data
      }
      catch (error) {
        return Promise.reject(error)
      }
    },
  }

  const tagTypeMap: { [key: string]: { [key: string]: 'primary' | 'success' | 'warning' | 'danger' } } = {
    adsCombinationServingStatus: {
      [ADS_COMBINATION_STATE.PORTFOLIO_STATUS_ENABLED]: 'success',
      [ADS_COMBINATION_STATE.PORTFOLIO_ENDED]: 'danger',
    },
    adsSdCampaignServingStatus: {
      [ADS_SD_CAMPAIGN_STATE.ADVERTISER_STATUS_ENABLED]: 'success',
      [ADS_SD_CAMPAIGN_STATE.ENDED]: 'danger',
    },
    dataExportTaskStatus: {
      [DATA_EXPORT_TASK_STATUS.PROCESSING]: 'primary',
      [DATA_EXPORT_TASK_STATUS.COMPLETED]: 'success',
      [DATA_EXPORT_TASK_STATUS.FAILED]: 'danger',
    },
  }

  return {
    // 常量
    ADS_TYPE_COMPONENT_MAP,
    illegalSymbol: ILLEGAL_SYMBOLS,
    percentFields: PERCENT_FIELDS,
    avgFields: AVG_FIELDS,
    ratioFields: RATIO_FIELDS,
    timeSharingStrategyEnableSetting: TIME_SHARING_STRATEGY_ENABLE_SETTING,
    // 响应式数据
    indicatorData,
    siteList,
    adsCombinationList,
    // API方法
    ...apiMethods,
    ...tabMethods,
    // 工具方法
    ...dataUtils,
    ...indicatorUtils,
    ...trendUtils,
    ...dataFetchers,
    ...storageUtils,
    ...timeSharingUtils,
    tagTypeMap,
    datePickerShortcuts,
    isValidNumber,
  }
}
