<template>
  <div class="flex flex-col gap-2">
    <div class="flex-center-between">
      <div class="fw-bold">
        趋势分析
      </div>
      <el-radio-group v-model="timeRange" size="small" @change="getData">
        <el-radio-button value="day">
          日
        </el-radio-button>
        <el-radio-button value="week">
          周
        </el-radio-button>
        <el-radio-button value="month">
          月
        </el-radio-button>
      </el-radio-group>
    </div>
    <Echart v-loading="dataLoading || chartLoading" :options="chartOptions" @ready="onChartReady" />
  </div>
</template>

<script setup lang="ts">
import type { ECharts, EChartsOption, SelectChangedEvent } from 'echarts'
import { amazonAdsDashboardChart, amazonAdsDashboardIndicators } from '@/api/modules/advertise/amazon'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const props = defineProps({
  showIndicatorKeys: {
    type: Array,
    default: () => [],
  },
})

const TREND_ANALYSIS_STORAGE_KEY = 'trend_analysis_radio_state'
function initTimeRange() {
  try {
    const saved = localStorage.getItem(TREND_ANALYSIS_STORAGE_KEY)
    if (saved) {
      const parsedState = JSON.parse(saved)
      return parsedState?.timeRange ?? 'day'
    }
  }
  catch (error) {
    console.error(error)
  }
  return 'day'
}
const timeRange = ref(initTimeRange())
function saveTimeRangeState() {
  try {
    const stateToSave = {
      timeRange: timeRange.value,
    }
    localStorage.setItem(TREND_ANALYSIS_STORAGE_KEY, JSON.stringify(stateToSave))
  }
  catch (error) {
    console.error(error)
  }
}

const { request: dataRequest, loading: dataLoading } = useRequest()
const { request: chartRequest, loading: chartLoading } = useRequest()
const { percentFields, handleQueryParams, getRowKey } = useAmazonAdsUtils()

const indicatorData = ref<ObjectAny>({})
const indicatorList = computed(() => Object.entries(indicatorData.value).filter(([key, value]) => indicatorData.value[key] && (Array.isArray(props.showIndicatorKeys) && props.showIndicatorKeys.length ? props.showIndicatorKeys.includes(value?.name) : true)).map(([key, value]) => ({ ...value, key })))

const commonSearch = inject('commonSearch', () => ({}))

const queryParams = computed(() => ({
  ...toRaw(commonSearch),
  timeRange: timeRange.value,
  ratioType: 1,
  type: 'AllCampaign',
}))

const analysisChartData = ref<ObjectAny[]>([])

async function getChartData() {
  try {
    const { data = [] } = await chartRequest(amazonAdsDashboardChart, handleQueryParams(queryParams.value))
    analysisChartData.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error('获取图表数据失败:', error)
    analysisChartData.value = []
  }
}

async function getData() {
  saveTimeRangeState()
  try {
    const { data = {} } = await dataRequest(amazonAdsDashboardIndicators, handleQueryParams(queryParams.value))
    indicatorData.value = isObject(data) ? data : {}
    await getChartData()
  }
  catch (error) {
    console.error(error)
    indicatorData.value = {}
  }
}

defineExpose({ getData })

// 添加选中状态管理
const STORAGE_KEY = 'trend_analysis_legend_selected'
const legendSelected = ref<ObjectAny>({})
// 从localStorage读取选中状态
function loadSelectedFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      legendSelected.value = JSON.parse(saved)
    }
  }
  catch (error) {
    console.error(error)
    legendSelected.value = {}
  }
}
onMounted(() => {
  loadSelectedFromStorage()
})
// 保存选中状态到localStorage
function saveSelectedToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legendSelected.value))
  }
  catch (error) {
    console.error(error)
  }
}

// 图表实例
const chartInstance = ref<ECharts>()

// 图表准备就绪时的回调
function onChartReady(chart: ECharts) {
  chartInstance.value = chart

  // 监听图例选择变化事件
  chart.on('legendselectchanged', (params) => {
    legendSelected.value = { ...(params as SelectChangedEvent).selected }
    saveSelectedToStorage()
  })
}

function generateRandomColor() {
  const hue = Math.floor(Math.random() * 360)
  const saturation = Math.floor(Math.random() * 40) + 50 // 50-90%
  const lightness = Math.floor(Math.random() * 30) + 40 // 40-70%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
const baseColors = [
  '#1f77b4', // 蓝色
  '#ff7f0e', // 橙色
  '#2ca02c', // 绿色
  '#d62728', // 红色
  '#9467bd', // 紫色
  '#e377c2', // 粉色
  '#ffeb3b', // 黄色
  '#17becf', // 青色
  '#8c564b', // 棕色
  '#bcbd22', // 橄榄绿
  '#7f7f7f', // 灰色
  '#aec7e8', // 浅蓝色
  '#ffbb78', // 浅橙色
  '#98df8a', // 浅绿色
  '#ff9896', // 浅红色
  '#c5b0d5', // 浅紫色
  '#f7b6d3', // 浅粉色
  '#c7c7c7', // 浅灰色
  '#dbdb8d', // 浅橄榄绿
  '#9edae5', // 浅青色
  '#6b6ecf', // 靛青色
  '#b5cf6b', // 黄绿色
  '#bd9e39', // 金黄色
  '#d6616b', // 暗红色
  '#a55194', // 暗紫色
  '#ce6dbd', // 暗粉色
  '#637939', // 暗绿色
  '#b17322', // 暗橙色
  '#8ca252', // 暗黄绿色
  '#756bb1', // 暗蓝紫色
]
function getColor(index: number) {
  if (index < baseColors.length) {
    return baseColors[index]
  }
  return generateRandomColor()
}
const chartOptions = computed<EChartsOption>(() => {
  const rest = indicatorList.value.length - baseColors.length
  const colors = baseColors.concat(rest > 0 ? Array.from({ length: rest }, (_, i) => getColor(baseColors.length + i)) : [])
  const { yAxis = [], series = [] } = indicatorList.value.length
    ? indicatorList.value.reduce((res, item, index) => {
        const isPercent = percentFields.includes(getRowKey(item))
        const { currencySymbol } = item
        const color = colors[index]
        const isEven = res.yAxis.length % 2 === 0
        res.yAxis.push({
          id: item.key,
          type: 'value',
          position: isEven ? 'left' : 'right',
          offset: Math.floor(res.yAxis.length / 2) * 50,
          splitNumber: 5,
          axisLine: {
            show: false,
            lineStyle: { color },
          },
          axisLabel: {
            formatter: (value: number) => isPercent ? `${value}%` : value,
            color,
          },
        })
        const isBar = ['impressions'].includes(getRowKey(item))
        res.series.push({
          id: item.key,
          name: item.title,
          type: isBar ? 'bar' : 'line',
          yAxisIndex: res.yAxis.length - 1,
          showSymbol: false,
          data: analysisChartData.value?.map(m => m[getRowKey(item)]) || [],
          itemStyle: { color },
          tooltip: {
            valueFormatter: (value: number) => isPercent ? `${currencySymbol || ''} ${value}%` : `${currencySymbol || ''} ${value}`,
          },
        })
        return res
      }, { yAxis: [], series: [] })
    : {
        yAxis: [{ type: 'value', data: [] }],
        series: [{ type: 'line', data: [] }],
      }

  // 创建selected对象，优先使用保存的状态，否则默认选中前四个系列
  const selected: ObjectAny = {}
  series.forEach((item: ObjectAny, index: number) => {
    if (Object.keys(legendSelected.value).length > 0) {
      // 如果有保存的状态，使用保存的状态
      selected[item.name] = legendSelected.value[item.name] ?? (index < 4)
    }
    else {
      // 如果没有保存的状态，默认选中前四个系列
      selected[item.name] = index < 4
    }
  })

  return {
    legend: {
      show: true,
      selected,
      top: 10,
      left: 'center',
      type: 'scroll',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: analysisChartData.value?.map(m => m.date) || [],
    },
    yAxis,
    color: colors,
    series,
  }
})

watch(indicatorList, (newList) => {
  if (newList.length > 0 && Object.keys(legendSelected.value).length === 0) {
    const initialSelected: ObjectAny = {}
    newList.forEach((item, index) => {
      initialSelected[item.title] = index < 4
    })
    legendSelected.value = { ...initialSelected }
    saveSelectedToStorage()
  }
}, { immediate: true })
</script>
