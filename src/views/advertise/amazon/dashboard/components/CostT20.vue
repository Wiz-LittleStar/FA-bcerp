<template>
  <div class="flex flex-col gap-4">
    <div class="flex-center-between gap-2">
      <div class="flex-center-start gap-1">
        <div class="fw-bold">
          广告花费Top20
        </div>
        <el-tooltip placement="top-start">
          <template #content>
            <div class="ws-pre-wrap">
              {{ `筛选范围内的广告花费从高到低的Top20分布及排行，点击广告活动名称可以快速跳转到广告活动管理页面\n- 广告花费份额图中按顺序展示前Top20，其余的归入其他\n- 广告花费占比为对应维度的花费/筛选条件下广告总花费` }}
            </div>
          </template>
          <FaIcon name="i-ep:question-filled" />
        </el-tooltip>
      </div>
      <el-radio-group v-model="search.dimension" size="small" @change="getData">
        <el-radio-button v-for="item in dimensionOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div v-loading="loading" class="flex gap-4">
      <div class="flex flex-col gap-2">
        <div class="grid grid-cols-3 gap-2 text-3">
          <div>广告总花费：</div>
          <div style="grid-column: span 2;">
            {{ `${summary.symbol}${summary.grandTotal}` }}
          </div>
          <div>TOP20花费：</div>
          <div>
            {{ `${summary.symbol}${summary.top20Cost}` }}
          </div>
          <div class="desc">
            {{ `${summary.top20CostPercentage}%` }}
          </div>
          <div>其他花费：</div>
          <div>
            {{ `${summary.symbol}${summary.otherCost}` }}
          </div>
          <div class="desc">
            {{ `${summary.otherCostPercentage}%` }}
          </div>
        </div>
        <Echart :options="chartOptions" class="h-[300px]" @ready="onChartReady" />
      </div>
      <div class="flex-w-auto">
        <el-table ref="tableRef" :data="dataList" :height="400" table-layout="auto" highlight-current-row border>
          <el-table-column label="排名" :width="80">
            <template #default="{ row }">
              <div class="flex-center-start gap-1">
                <div
                  class="size-2 rounded-full"
                  :style="{ backgroundColor: getRankColor(row.costRank) }"
                />
                <div>{{ row.costRank }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="dimensionOptions.find(item => item.value === search.dimension)?.label || ''">
            <template #default="{ row }">
              <DimensionDisplay :model-value="row" :dimension="search.dimension" />
            </template>
          </el-table-column>
          <el-table-column label="广告花费" prop="totalCost">
            <template #default="{ row }">
              <div>{{ `${row.symbol ?? ''}${row.totalCost ?? 0}` }}</div>
            </template>
          </el-table-column>
          <el-table-column label="广告花费占比" prop="costPercentage">
            <template #default="{ row }">
              <div>{{ `${row.costPercentage}%` }}</div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ECElementEvent, ECharts, EChartsOption } from 'echarts'
import Decimal from 'decimal.js'
import { amazonAdsDashboardGetTopCampaignCosts } from '@/api/modules/advertise/amazon'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import DimensionDisplay from './DimensionDisplay.vue'

const dimensionOptions = [
  { value: 0, label: '店铺' },
  { value: 1, label: '活动' },
  { value: 2, label: '商品' },
]

const storeKey = 'amazon_ads_dashboard_cost_t20'
const { getStore, setStore } = useUtils()
const { dimension: storeDimension } = getStore(storeKey)
const search = reactive({ dimension: storeDimension ?? dimensionOptions[0].value })
function saveRadioState() {
  setStore(storeKey, { dimension: search.dimension })
}

const { request, loading } = useRequest()
const { handleQueryParams } = useAmazonAdsUtils()
const commonSearch = inject('commonSearch', () => ({}))
const queryParams = computed(() => ({
  ...toRaw(commonSearch),
  ...search,
}))
const dataList = ref<ObjectAny[]>([])
const dataLimit = 20
const chartInstance = ref<ECharts>()
const hoveredIndex = ref(-1)
const tableRef = useTemplateRef('tableRef')

// 生成随机颜色
function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360)
  const saturation = Math.floor(Math.random() * 30) + 60 // 60-90%
  const lightness = Math.floor(Math.random() * 20) + 45 // 45-65%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// 存储每个数据项的颜色
const itemColors = ref<string[]>([])
function highlightTableRow(dataIndex?: number) {
  if (tableRef.value) {
    tableRef.value.setCurrentRow(dataIndex !== undefined ? dataList.value[dataIndex] : undefined)
  }
}
function setupChartEvents() {
  if (!chartInstance.value) {
    return
  }

  // 鼠标悬停事件
  chartInstance.value.on('mouseover', (params: ECElementEvent) => {
    const dataIndex = params.dataIndex as number
    hoveredIndex.value = dataIndex
    highlightTableRow(dataIndex)
  })

  // 鼠标移出事件
  chartInstance.value.on('mouseout', () => {
    hoveredIndex.value = -1
    highlightTableRow()
  })
}
// 生成颜色的函数
function generateColors() {
  const top20Count = Math.min(dataList.value.length, dataLimit)
  const grandTotal = dataList.value[0]?.grandTotal ?? 0
  const top20Cost = dataList.value.slice(0, dataLimit).reduce((acc, curr) => new Decimal(acc).plus(curr.totalCost).toNumber(), 0)
  const otherCost = new Decimal(grandTotal).minus(top20Cost).toNumber()
  const hasOtherData = otherCost > 0

  itemColors.value = []
  for (let i = 0; i < top20Count; i++) {
    itemColors.value.push(generateRandomColor())
  }
  if (hasOtherData) {
    itemColors.value.push('#CCCCCC') // 其他项目使用灰色
  }
}

async function getData() {
  saveRadioState()
  try {
    const { data = [] } = await request(amazonAdsDashboardGetTopCampaignCosts, handleQueryParams(queryParams.value))
    dataList.value = Array.isArray(data) ? data : []

    // 等待数据更新后再生成颜色
    await nextTick()
    generateColors()

    nextTick(() => {
      if (chartInstance.value) {
        setupChartEvents()
      }
    })
  }
  catch (error) {
    console.error(error)
    dataList.value = []
    itemColors.value = []
  }
}
defineExpose({ getData })

const summary = computed(() => {
  const grandTotal = dataList.value[0]?.grandTotal ?? 0
  const symbol = dataList.value[0]?.symbol ?? ''
  const top20Cost = dataList.value.slice(0, dataLimit).reduce((acc, curr) => new Decimal(acc).plus(curr.totalCost).toNumber(), 0)
  const otherCost = new Decimal(grandTotal).minus(top20Cost).toNumber()
  return {
    grandTotal,
    symbol,
    top20Cost,
    otherCost,
    top20CostPercentage: new Decimal(top20Cost).div(grandTotal).mul(100).toNumber().toFixed(2),
    otherCostPercentage: new Decimal(otherCost).div(grandTotal).mul(100).toNumber().toFixed(2),
  }
})

function getRankColor(rank: number) {
  // 使用随机生成的颜色
  return itemColors.value[rank - 1] || '#CCCCCC'
}
const isShop = computed(() => search.dimension === 0)
const isCampaign = computed(() => search.dimension === 1)
const isProduct = computed(() => search.dimension === 2)
const chartOptions = computed<EChartsOption>(() => {
  // 构建环形图数据
  const chartData = []

  // 从tableData中获取前20个数据项
  const top20Data = dataList.value.slice(0, dataLimit)

  // 如果有数据，添加各个分项
  if (top20Data.length > 0) {
    top20Data.forEach((item, index) => {
      chartData.push({
        name: isShop.value ? item.shopName : isCampaign.value ? item.campaignName : isProduct.value ? item.sellerSku : `项目${index + 1}`,
        value: item.totalCost || 0,
      })
    })
  }

  // 添加其他项目
  if (summary.value.otherCost > 0) {
    chartData.push({
      name: '其他',
      value: summary.value.otherCost,
    })
  }

  return {
    title: {
      text: `${summary.value.grandTotal}`,
      subtext: `花费总计(${summary.value.symbol})`,
      left: 'center',
      top: 'middle',
      textStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
      },
      subtextStyle: {
        fontSize: 12,
        color: '#666',
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const data = Array.isArray(params) ? params[0] : params
        return `${data.name}<br/>${summary.value.symbol}${data.value} (${data.percent}%)`
      },
    },
    legend: {
      show: false, // 隐藏图例，因为右侧有表格显示详细信息
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '80%'], // 内外半径，形成环形图
        center: ['50%', '50%'],
        data: chartData,
        itemStyle: {
          borderRadius: 8, // 圆角
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false, // 隐藏标签
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        // 颜色配置
        color: itemColors.value,
      },
    ],
  }
})
function onChartReady(chart: ECharts) {
  chartInstance.value = chart
  setupChartEvents()
}
</script>
