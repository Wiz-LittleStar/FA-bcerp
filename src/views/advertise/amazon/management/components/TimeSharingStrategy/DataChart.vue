<template>
  <div class="flex flex-col gap-2">
    <div class="flex-center-between gap-2">
      <el-date-picker
        v-model="search.dateList"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        size="small"
        :shortcuts="timePickerShortcuts"
        value-format="YYYY-MM-DD"
        @change="getData"
      />
      <el-radio-group v-model="search.timeRange" size="small" @change="getData">
        <el-radio-button v-for="item in timeRangeOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <Echart v-loading="loading" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { amazonAdsCampaigngGetCampaignWeekChart } from '@/api/modules/advertise/amazon'
import dayjs from '@/utils/dayjs'
import { ADS_MANAGEMENT_TABS } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const model = defineModel<ObjectAny>({ required: true })

const { timePickerShortcuts } = useUtils()
const timeRangeOptions = [
  { label: '按小时', value: 'hour' },
  { label: '按星期', value: 'week' },
]
const { getChartDataMethod, percentFields, handleQueryParams } = useAmazonAdsUtils()
const commonSearch = inject<ObjectAny>('commonSearch', () => ({}))
const type = ADS_MANAGEMENT_TABS.ADS_ACTIVITY

interface Search {
  timeRange: string
  dateList: string[]
}
function initSearch() {
  const data = {
    timeRange: timeRangeOptions[0].value,
    dateList: [dayjs().subtract(1, 'month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  }
  return data
}
const search = reactive<Partial<Search>>(initSearch())
const isWeek = computed(() => search.timeRange === 'week')

const dataList = ref<ObjectAny[]>([])
const { pagination } = usePagination()
const queryParams = computed(() => {
  const { campaignId, adsType } = model.value
  const { pageNum, pageSize } = pagination.value
  return handleQueryParams({
    ...toRaw(commonSearch),
    ...search,
    pageNum,
    pageSize,
    campaignId,
    adsType,
  })
})
const { request, loading } = useRequest()
async function getData() {
  try {
    const api = getChartDataMethod(type)
    if (!api) {
      dataList.value = []
      return
    }
    const { data = [] } = await request(isWeek.value ? amazonAdsCampaigngGetCampaignWeekChart : api, queryParams.value)
    dataList.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}
onMounted(() => getData())
defineExpose({ getData })

const chartFields = [
  { value: 'impressions', label: '曝光量', color: '#5470c6' }, // 蓝色
  { value: 'clicks', label: '点击量', color: '#91cc75' }, // 绿色
  { value: 'ctr', label: 'CTR', color: '#fac858' }, // 黄色
  { value: 'cost', label: '广告花费', color: '#ee6666' }, // 红色
  { value: 'purchases', label: '广告订单总量', color: '#73c0de' }, // 浅蓝色
  { value: 'sales', label: '广告总销售额', color: '#3ba272' }, // 深绿色
  { value: 'cpc', label: 'CPC', color: '#fc8452' }, // 橙色
  { value: 'cvr', label: 'CVR', color: '#9a60b4' }, // 紫色
  { value: 'cpa', label: 'CPA', color: '#ea7ccc' }, // 粉色
  { value: 'acos', label: 'ACoS', color: '#5470c6' },
  { value: 'roas', label: 'ROAS', color: '#91cc75' },
]
const chartOptions = computed<EChartsOption>(() => {
  const displayFields = chartFields.slice(0, 6)
  return {
    legend: {
      show: true,
      top: 10,
      left: 'center',
      type: 'scroll',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter(params) {
        if (Array.isArray(params) && params.length) {
          let result = `${params[0]?.name}<br/>`
          params.forEach((param) => {
            result += `${param.marker}${param.seriesName}: ${param.value}${percentFields.includes(param.seriesName ?? '') ? '%' : ''}<br/>`
          })
          return result
        }
        return ''
      },
    },
    xAxis: {
      type: 'category',
      data: dataList.value?.map(item => (isWeek.value ? item.weekValue : item.date)) || [],
    },
    yAxis: displayFields.map((item, index) => {
      const color = item.color
      return {
        type: 'value',
        name: item.label,
        position: index % 2 === 0 ? 'left' : 'right',
        offset: Math.floor(index / 2) * 80,
        axisLabel: {
          formatter: `{value}${percentFields.includes(item.value) ? '%' : ''}`,
          color,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color,
          },
        },
        nameTextStyle: {
          color,
        },
      }
    }),
    series: displayFields.map((item, index) => ({
      name: item.label,
      type: 'line',
      data: dataList.value?.map(m => m[item.value]) || [],
      yAxisIndex: index,
      smooth: true,
      itemStyle: {
        color: item.color,
      },
      lineStyle: {
        color: item.color,
      },
    })),
  }
})
</script>
