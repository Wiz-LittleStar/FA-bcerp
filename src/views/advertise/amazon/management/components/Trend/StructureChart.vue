<template>
  <div class="flex flex-col gap-2">
    <div class="flex-center-between gap-2">
      <div />
      <div class="flex-center-start gap-2">
        <div class="flex-center-start gap-1">
          <div class="size-3 rounded-full" :style="{ backgroundColor: colors[0] }" />
          <el-select v-model="filter.x" size="small" class="w-30">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" :disabled="selectedFilterFields.includes(item.value)" />
          </el-select>
        </div>
        <div class="flex-center-start gap-1">
          <div class="size-3 rounded-full" :style="{ backgroundColor: colors[1] }" />
          <el-select v-model="filter.y" size="small" class="w-30">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" :disabled="selectedFilterFields.includes(item.value)" />
          </el-select>
        </div>
        <div class="flex-center-start gap-1">
          <div class="size-3 rounded-full" :style="{ backgroundColor: colors[2] }" />
          <el-select v-model="filter.z" size="small" class="w-30">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" :disabled="selectedFilterFields.includes(item.value)" />
          </el-select>
        </div>
      </div>
      <el-radio-group v-model="search.structureType" size="small" @change="getData">
        <el-radio-button :value="1">
          概览
        </el-radio-button>
        <el-radio-button :value="2">
          明细
        </el-radio-button>
      </el-radio-group>
    </div>
    <Echart v-loading="loading" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { enumAdsManagementType } from '@/utils/enum/advertise'
import { amazonAdsCampaignPlacementStructure, amazonAdsCampaignStructure, amazonAdsTargetStructure } from '@/api/modules/advertise/amazon'
import { ADS_MANAGEMENT_TYPE, ADS_TREND_TABS } from '@/utils/enum/advertise'

const props = withDefaults(defineProps<{
  trendTabType?: string
  setting?: {
    options: { value: string, label: string }[]
    currencyField: string[]
    percentField: string[]
  }
}>(), {
  trendTabType: () => '',
  setting: () => ({
    options: [],
    currencyField: [],
    percentField: [],
  }),
})
const { trendTabType, setting } = toRefs(props)
const { options, currencyField, percentField } = toRefs(setting.value)
const isAdsStructure = computed(() => trendTabType.value === ADS_TREND_TABS.ADS_STRUCTURE)
const isTargetStructure = computed(() => trendTabType.value === ADS_TREND_TABS.TARGET_STRUCTURE)
const isAdsPlacement = computed(() => trendTabType.value === ADS_TREND_TABS.ADS_PLACEMENT)
const { request, loading } = useRequest()
const commonSearch = inject<ObjectAny>('commonSearch', () => ({}))
const dataList = ref<ObjectAny[]>([])
const search = reactive({
  structureType: 1,
})
const queryParams = computed(() => ({
  ...commonSearch,
  ...search,
}))
async function getData() {
  try {
    const api = isAdsStructure.value ? amazonAdsCampaignStructure : isTargetStructure.value ? amazonAdsTargetStructure : isAdsPlacement.value ? amazonAdsCampaignPlacementStructure : undefined
    if (!api) {
      dataList.value = []
      return
    }
    const { data = [] } = await request(api, queryParams.value)
    dataList.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}
defineExpose({ getData })

const filter = reactive({
  x: options.value[0].value,
  y: options.value[1].value,
  z: options.value[2].value,
})
const selectedFilterFields = computed(() => Object.values(filter).filter(Boolean))
// 根据广告类型设置不同的颜色方案
const colorSchemes = {
  [ADS_MANAGEMENT_TYPE.ALL]: ['#bc002d', '#fff10c', '#2ea9df'], // 全部
  [ADS_MANAGEMENT_TYPE.SP]: ['#4075fc', '#30e5c9', '#f69930'], // SP
  [ADS_MANAGEMENT_TYPE.SB]: ['#4075fc', '#30e5c9', '#f69930'], // SB
  [ADS_MANAGEMENT_TYPE.SD]: ['#4075fc', '#30e5c9', '#f69930'], // SD
}
const colors = computed(() => colorSchemes[commonSearch.type as keyof enumAdsManagementType] || colorSchemes[0])
const chartOptions = computed<EChartsOption>(() => {
  const seriesKey = Object.values(selectedFilterFields.value).filter(Boolean)
  return {
    legend: {
      show: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '4%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dataList.value.map(item => item.mergeCampaignTypeName),
      axisLabel: {
        interval: 0,
        fontSize: 16,
      },
      axisPointer: {
        type: 'shadow',
      },
    },
    yAxis: seriesKey.reduce((res: ObjectAny[], item, index) => {
      const isEven = index % 2 === 0
      res.push({
        type: 'value',
        position: isEven ? 'left' : 'right',
        offset: Math.floor(res.length / 2) * 50,
        axisLabel: {
          formatter(value: any) {
            return currencyField.value.includes(item) ? `${value}` : percentField.value.includes(item) ? `${value}%` : `${value}`
          },
          color: colors.value[index],
        },
        axisLine: {
          lineStyle: {
            color: colors.value[index],
          },
        },
      })
      return res
    }, []),
    series: seriesKey.map((item, index) => ({
      name: options.value.find(f => f.value === item)?.label,
      type: 'bar',
      barWidth: 10,
      yAxisIndex: index,
      barCategoryGap: '20%',
      data: dataList.value.map(i => i[item]),
    })),
    color: colors.value,
  }
})
</script>
