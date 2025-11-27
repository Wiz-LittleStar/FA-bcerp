<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-end gap-2">
      <div class="flex-center-start gap-1">
        <div class="fw-bold">
          广告表现
        </div>
        <el-tooltip content="广告投放和搜索词对应的曝光、点击、转化的多维分析，一次最多展示花费从高到低的100个。点击广告投放中的气泡可以呈现其对应搜索词的表现，点击气泡浮窗中的链接可以跳转对应的管理界面。" placement="top-start">
          <FaIcon name="i-ep:question-filled" />
        </el-tooltip>
      </div>
      <div class="text-3 c-gray">
        最多展示花费从高到低100个，气泡越大曝光量越高
      </div>
    </div>
    <div class="flex gap-4">
      <div class="flex-w-auto flex flex-col gap-4">
        <div class="flex-center-between">
          <div class="fw-bold">
            广告投放
          </div>
          <el-radio-group v-model="targetPageSize" size="small">
            <el-radio-button v-for="item in pageSizeOptions" :key="item" :value="item">
              前{{ item }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <Echart v-loading="targetLoading" :options="targetChartOptions" />
      </div>
      <div class="flex-w-auto flex flex-col gap-4">
        <div class="flex-center-between">
          <div class="fw-bold">
            搜索词
          </div>
          <el-radio-group v-model="searchTermPageSize" size="small">
            <el-radio-button v-for="item in pageSizeOptions" :key="item" :value="item">
              前{{ item }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <Echart v-loading="searchTermLoading" :options="searchTermChartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { amazonAdsDashboardGetSearchTermTopPerformance, amazonAdsDashboardGetTargetTopPerformance } from '@/api/modules/advertise/amazon'
import { ADS_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

// 定义数据项接口
interface PerformanceDataItem {
  adsType: number
  targetValue: string
  shopName: string
  campaignName: string
  adGroupName: string
  cost: number
  impressions: number
  clicks: number
  ctr: number
  cvr: number
  purchases: number
  sales: number
  acos: number
  symbol: string
  targetType: number
  searchTerm?: string
}

// 定义散点图数据点类型
type ScatterDataPoint = [number, number, number, any]

// 定义处理后的散点图数据
interface ProcessedScatterData {
  autoData: ScatterDataPoint[]
  manualData: ScatterDataPoint[]
  maxImpressions: number
}

const pageSizeOptions = [20, 50, 100]

const storeKey = 'amazon_ads_dashboard_advertisement_performance'
const { getStore, setStore } = useUtils()
const { targetPageSize: storeTargetPageSize, searchTermPageSize: storeSearchTermPageSize } = getStore(storeKey)
const targetPageSize = ref(storeTargetPageSize ?? pageSizeOptions[0])
const searchTermPageSize = ref(storeSearchTermPageSize ?? pageSizeOptions[0])
watch([targetPageSize, searchTermPageSize], () => {
  setStore(storeKey, { targetPageSize: targetPageSize.value, searchTermPageSize: searchTermPageSize.value })
}, { deep: true })

const { request: targetRequest, loading: targetLoading } = useRequest()
const { request: searchTermRequest, loading: searchTermLoading } = useRequest()
const { handleQueryParams } = useAmazonAdsUtils()
const commonSearch = inject('commonSearch', () => ({}))
const queryParams = computed(() => ({
  ...toRaw(commonSearch),
  pageSize: Math.max(...pageSizeOptions), // 拉取最大条数
}))
const targetRawData = ref<ObjectAny[]>([])
async function getTargetData() {
  try {
    const { data = [] } = await targetRequest(amazonAdsDashboardGetTargetTopPerformance, handleQueryParams(queryParams.value))
    targetRawData.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
    targetRawData.value = []
  }
}
const searchTermRawData = ref<ObjectAny[]>([])
async function getSearchTermData() {
  try {
    const { data = [] } = await searchTermRequest(amazonAdsDashboardGetSearchTermTopPerformance, handleQueryParams(queryParams.value))
    searchTermRawData.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
    searchTermRawData.value = []
  }
}
function getData() {
  getTargetData()
  getSearchTermData()
}
defineExpose({ getData })

// 常量配置
const CHART_CONFIG = {
  MIN_SYMBOL_SIZE: 10,
  MAX_SYMBOL_SIZE: 60,
  LEGEND_DATA: ['自动投放', '手动投放'],
  COLORS: {
    AUTO: {
      color: 'rgba(64, 158, 255, 0.6)',
      borderColor: '#409EFF',
      emphasisColor: 'rgba(64, 158, 255, 0.8)',
    },
    MANUAL: {
      color: 'rgba(255, 159, 26, 0.6)',
      borderColor: '#FF9F1A',
      emphasisColor: 'rgba(255, 159, 26, 0.8)',
    },
  },
}
// 工具函数：格式化目标投放的tooltip
function formatTargetTooltip(info: PerformanceDataItem) {
  return `
    <div style="padding: 10px; min-width: 200px; line-height: 20px; user-select: text; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;">
      <div style="font-weight: bold; margin-bottom: 8px; color: #333;">${ADS_TYPE.getLabelByValue(info.adsType)} - ${info.targetValue}</div>
      <div style="margin-bottom: 4px;">店铺: ${info.shopName}</div>
      <div style="margin-bottom: 4px;">广告活动: ${info.campaignName}</div>
      <div style="margin-bottom: 4px;">广告组: ${info.adGroupName}</div>
      <div style="margin-bottom: 4px;">广告花费: ${info.symbol}${info.cost.toFixed(2)}</div>
      <div style="margin-bottom: 4px;">曝光: ${info.impressions.toLocaleString()}</div>
      <div style="margin-bottom: 4px;">点击量: ${info.clicks}</div>
      <div style="margin-bottom: 4px;">CTR: ${info.ctr.toFixed(2)}%</div>
      <div style="margin-bottom: 4px;">CVR: ${info.cvr.toFixed(2)}%</div>
      <div style="margin-bottom: 4px;">订单量: ${info.purchases}</div>
      <div style="margin-bottom: 4px;">广告销售额: ${info.symbol}${info.sales.toFixed(2)}</div>
      <div style="margin-bottom: 4px;">ACoS: ${info.acos.toFixed(2)}%</div>
    </div>
  `
}

// 工具函数：格式化搜索词的tooltip
function formatSearchTermTooltip(info: PerformanceDataItem) {
  return `
    <div style="padding: 10px; min-width: 200px; line-height: 20px; user-select: text; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;">
      <div style="font-weight: bold; margin-bottom: 8px; color: #333;">${info.searchTerm}</div>
      ${info.targetValue ? `<div style="margin-bottom: 4px;">投放: ${ADS_TYPE.getLabelByValue(info.adsType)} - ${info.targetValue}</div>` : ''}
      <div style="margin-bottom: 4px;">广告活动: ${info.campaignName}</div>
      <div style="margin-bottom: 4px;">广告组: ${info.adGroupName}</div>
      <div style="margin-bottom: 4px;">广告花费: ${info.symbol}${info.cost.toFixed(2)}</div>
      <div style="margin-bottom: 4px;">曝光: ${info.impressions.toLocaleString()}</div>
      <div style="margin-bottom: 4px;">点击量: ${info.clicks}</div>
      <div style="margin-bottom: 4px;">CTR: ${info.ctr.toFixed(2)}%</div>
      <div style="margin-bottom: 4px;">CVR: ${info.cvr.toFixed(2)}%</div>
      <div style="margin-bottom: 4px;">订单量: ${info.purchases}</div>
      <div style="margin-bottom: 4px;">广告销售额: ${info.symbol}${info.sales.toFixed(2)}</div>
      <div style="margin-bottom: 4px;">ACoS: ${info.acos.toFixed(2)}%</div>
    </div>
  `
}

// 工具函数：计算气泡大小
function calculateSymbolSize(impressions: number, maxImpressions: number) {
  if (!impressions || impressions === 0) {
    return CHART_CONFIG.MIN_SYMBOL_SIZE
  }
  const ratio = impressions / maxImpressions
  return CHART_CONFIG.MIN_SYMBOL_SIZE + (CHART_CONFIG.MAX_SYMBOL_SIZE - CHART_CONFIG.MIN_SYMBOL_SIZE) * ratio
}

// 工具函数：处理散点图数据
function processScatterData(data: PerformanceDataItem[]): ProcessedScatterData {
  const autoData: ScatterDataPoint[] = []
  const manualData: ScatterDataPoint[] = []
  const maxImpressions = Math.max(...data.map((item: PerformanceDataItem) => item.impressions))

  data.forEach((item: PerformanceDataItem) => {
    const dataPoint: ScatterDataPoint = [
      item.ctr, // X轴：点击率
      item.cvr, // Y轴：转化率
      item.impressions, // 气泡大小
      { ...item },
    ]

    if (item.targetType === 0) {
      autoData.push(dataPoint)
    }
    else {
      manualData.push(dataPoint)
    }
  })

  return { autoData, manualData, maxImpressions }
}

// 工具函数：创建基础图表配置
function createBaseChartConfig() {
  return {
    title: {
      text: '',
      left: 'center',
    },
    legend: {
      data: CHART_CONFIG.LEGEND_DATA,
      top: 10,
      right: 20,
    },
    grid: {
      left: '3%',
      right: '7%',
      bottom: '7%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'value' as const,
      name: '点击率',
      nameLocation: 'middle' as const,
      nameGap: 25,
      axisLabel: {
        formatter: '{value}%',
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed' as const,
          color: '#f0f0f0',
        },
      },
    },
    yAxis: {
      type: 'value' as const,
      name: '转化率CVR',
      nameLocation: 'middle' as const,
      nameGap: 35,
      axisLabel: {
        formatter: '{value}%',
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed' as const,
          color: '#f0f0f0',
        },
      },
    },
  }
}

// 工具函数：创建散点图系列配置
function createScatterSeries(autoData: ScatterDataPoint[], manualData: ScatterDataPoint[], maxImpressions: number) {
  return [
    {
      name: '自动投放',
      type: 'scatter' as const,
      data: autoData as any,
      symbolSize(data: ScatterDataPoint) {
        return calculateSymbolSize(data[2], maxImpressions)
      },
      itemStyle: {
        color: CHART_CONFIG.COLORS.AUTO.color,
        borderColor: CHART_CONFIG.COLORS.AUTO.borderColor,
        borderWidth: 1,
      },
      emphasis: {
        itemStyle: {
          color: CHART_CONFIG.COLORS.AUTO.emphasisColor,
        },
      },
    },
    {
      name: '手动投放',
      type: 'scatter' as const,
      data: manualData as any,
      symbolSize(data: ScatterDataPoint) {
        return calculateSymbolSize(data[2], maxImpressions)
      },
      itemStyle: {
        color: CHART_CONFIG.COLORS.MANUAL.color,
        borderColor: CHART_CONFIG.COLORS.MANUAL.borderColor,
        borderWidth: 1,
      },
      emphasis: {
        itemStyle: {
          color: CHART_CONFIG.COLORS.MANUAL.emphasisColor,
        },
      },
    },
  ]
}

// 工具函数：创建空数据图表配置
function createEmptyChartConfig() {
  return {
    title: {
      text: '暂无数据',
      left: 'center',
      top: 'center',
      textStyle: {
        color: '#999',
        fontSize: 14,
      },
    },
  }
}

const targetData = computed(() => {
  return targetRawData.value.slice(0, targetPageSize.value)
})
const targetChartOptions = computed<EChartsOption>(() => {
  if (!(Array.isArray(targetData.value) && !!targetData.value.length)) {
    return createEmptyChartConfig()
  }

  const { autoData, manualData, maxImpressions } = processScatterData(targetData.value as PerformanceDataItem[])
  const baseConfig = createBaseChartConfig()
  const series = createScatterSeries(autoData, manualData, maxImpressions)

  return {
    ...baseConfig,
    tooltip: {
      trigger: 'item' as const,
      enterable: true,
      hideDelay: 100,
      formatter(params: any) {
        const info = params.data[3]
        return formatTargetTooltip(info)
      },
    },
    series,
  }
})

const searchTermData = computed(() => {
  return searchTermRawData.value.slice(0, searchTermPageSize.value)
})
const searchTermChartOptions = computed<EChartsOption>(() => {
  if (!(Array.isArray(searchTermData.value) && !!searchTermData.value.length)) {
    return createEmptyChartConfig()
  }

  const { autoData, manualData, maxImpressions } = processScatterData(searchTermData.value as PerformanceDataItem[])
  const baseConfig = createBaseChartConfig()
  const series = createScatterSeries(autoData, manualData, maxImpressions)

  return {
    ...baseConfig,
    tooltip: {
      trigger: 'item' as const,
      enterable: true,
      hideDelay: 100,
      formatter(params: any) {
        const info = params.data[3]
        return formatSearchTermTooltip(info)
      },
    },
    series,
  }
})
</script>
