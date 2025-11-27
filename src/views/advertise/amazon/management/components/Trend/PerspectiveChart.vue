<template>
  <div class="flex flex-col gap-2">
    <div class="flex-center-end gap-2">
      <el-radio-group v-model="search.order" size="small" @change="getData">
        <el-radio-button value="asc">
          前5000
        </el-radio-button>
        <el-radio-button value="desc">
          后5000
        </el-radio-button>
      </el-radio-group>
      <div class="flex-center-start gap-1">
        <div class="text-3 fw-bold">
          X轴
        </div>
        <el-select v-model="filter.x" size="small" class="w-30">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" :disabled="selectedFilterFields.includes(item.value)" />
        </el-select>
      </div>
      <div class="flex-center-start gap-1">
        <div class="text-3 fw-bold">
          Y轴
        </div>
        <el-select v-model="filter.y" size="small" class="w-30">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" :disabled="selectedFilterFields.includes(item.value)" />
        </el-select>
      </div>
      <div class="flex-center-start gap-1">
        <div class="text-3 fw-bold">
          面积
        </div>
        <el-select v-model="filter.m" size="small" class="w-30">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" :disabled="selectedFilterFields.includes(item.value)" />
        </el-select>
      </div>
    </div>
    <Echart v-loading="loading" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { CommonTabType } from '@/utils/hooks/useAmazonAdsUtils'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const props = withDefaults(defineProps<{
  extSearch?: ObjectAny
  setting?: {
    options: { value: string, label: string }[]
    currencyField: string[]
    percentField: string[]
  }
}>(), {
  extSearch: () => ref({}),
  setting: () => ({
    options: [],
    currencyField: [],
    percentField: [],
  }),
})
const { extSearch, setting } = toRefs(props)
const { options, currencyField, percentField } = toRefs(setting.value)
const { request, loading } = useRequest()
const { getListDataMethod } = useAmazonAdsUtils()
const commonTabType = inject<Ref<CommonTabType>>('commonTabType')
const dataList = ref<ObjectAny[]>([])
const search = reactive({
  order: 'asc',
})
const queryParams = computed(() => ({
  ...toValue(extSearch),
  ...search,
  limit: 5000,
  pageNum: -1,
  pageSize: -1,
}))
async function getData() {
  try {
    const { data: { data: { records } } } = await request(getListDataMethod(commonTabType?.value), queryParams.value)
    dataList.value = Array.isArray(records) ? records : []
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
  m: options.value[2].value,
})
const selectedFilterFields = computed(() => Object.values(filter).filter(Boolean))
const minSymbolSize = 5 // 最小散点图大小
const maxSymbolSize = 50 // 最大散点图大小
const chartOptions = computed<EChartsOption>(() => {
  const { x, y, m } = filter
  const xData = dataList.value.map(item => item[x])
  const yData = dataList.value.map(item => item[y])
  const mData = dataList.value.map(item => item[m])
  const maxDataMData = Math.max(...mData)
  const titleData = dataList.value.map(item => item.name)
  if (xData.every(item => item < 0) && yData.every(item => item < 0)) {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
      },
    }
  }
  const seriesData = []
  for (let i = 0; i < xData.length; i++) {
    // 这里取x|y的长度都一样
    seriesData.push([xData[i], yData[i], mData[i], titleData[i]])
  }
  return {
    legend: {
      show: false,
    },
    tooltip: {
      trigger: 'item',
      axisPointer: {
        type: 'shadow',
      },
      formatter(param: ObjectAny) {
        const value = param.value
        if (!Array.isArray(value)) { return '' }
        const empty = { label: '', value: '' }
        const X = options.value.find(item => item.value === x) ?? empty
        const Y = options.value.find(item => item.value === y) ?? empty
        const M = options.value.find(item => item.value === m) ?? empty
        return `<div style="padding: 10px;width: 250px;line-height: 23px;">
          <div style="font-weight: bold;white-space: nowrap;overflow: hidden; text-overflow: ellipsis;"> ${value[3]} </div>
          <div style="display: flex;justify-content: space-between;"><div>${X.label}</div> <div>${percentField.value.includes(X.value) ? `${value[0]}%` : currencyField.value.includes(X.value) ? `$${value[0]}` : value[0]}</div> </div>
          <div style="display: flex;justify-content: space-between;"><div>${Y.label}</div> <div>${value[1]}</div> </div>
          <div style="display: flex;justify-content: space-between;"><div>${M.label}</div> <div>${value[2]}</div> </div>
        </div>`
      },
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '4%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
        show: true, // 显示网格线
      },
      axisLabel: {
        formatter(value) {
          return currencyField.value.includes(x) ? `$${value}` : percentField.value.includes(x) ? `${value}%` : `${value}`
        },
      },
      splitNumber: 2,
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
        show: true, // 显示网格线
      },
      axisLabel: {
        formatter(value) {
          return currencyField.value.includes(y) ? `$${value}` : percentField.value.includes(y) ? `${value}%` : String(value)
        },
      },
      scale: true,
      splitNumber: 4,
    },
    series: [
      {
        type: 'scatter',
        data: seriesData,
        symbolSize(data) {
          if (!data) { return 0 }
          const value = data[2] || 0
          const size = minSymbolSize + (maxSymbolSize - minSymbolSize) * (value / maxDataMData)
          return Math.min(size, maxSymbolSize) // 确保大小不超过最大值
        },
        itemStyle: {
          color(data) {
            if (!data) { return 'rgba(0, 0, 0, 0.5)' }
            const valueList = Array.isArray(data.value) ? data.value : []
            const value = (valueList as number[])[2] || 0
            const size = minSymbolSize + (maxSymbolSize - minSymbolSize) * (value / maxDataMData)
            const maxSize = maxSymbolSize // 设定透明度的最大值对应的大小
            const opacity = (1 - (size / maxSize)) || 0.1
            return `rgba(30, 144, 255, ${opacity})` // 使用 RGB 颜色和动态透明度
          },
        },
      },
    ],
  }
})
</script>
