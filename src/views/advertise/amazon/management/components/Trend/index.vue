<template>
  <div class="flex flex-col gap-4">
    <div class="flex-center-between">
      <div class="flex-center-start gap-2">
        <el-radio-group v-model="activeTab" size="small">
          <el-radio-button v-for="item in tabs" :key="item" :value="item">
            {{ ADS_TREND_TABS.getLabelByValue(item) }}
          </el-radio-button>
        </el-radio-group>
        <el-date-picker v-if="[ADS_TREND_TABS.TREND, ADS_TREND_TABS.CONTRAST].includes(activeTab) && customDate" v-model="search.dateList" type="daterange" align="right" size="small" @change="getData" />
      </div>
      <div v-if="activeTab === ADS_TREND_TABS.TREND" class="flex-center-start gap-2">
        <el-button link size="small" @click="indicatorSet">
          概览设置
          <template #icon>
            <FaIcon :name="isShowIndicator ? 'i-ep:arrow-up' : 'i-ep:arrow-down'" />
          </template>
        </el-button>
        <el-radio-group v-model="search.timeRange" size="small" @change="getChartData">
          <el-radio-button v-if="showIndicatorTable && ![ADS_MANAGEMENT_TABS.SEARCH_TERM].includes(tabType)" value="hour">
            小时
          </el-radio-button>
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
    </div>
    <div class="relative">
      <!-- 趋势 -->
      <template v-if="isTrend">
        <div v-loading="chartLoading">
          <!-- 指标选择 -->
          <div class="grid grid-cols-7 gap-2">
            <IndicatorItem
              v-for="item in indicator.list.filter(item => item.isShow)"
              :key="item.id"
              :data="item"
              :color="selectList.find(f => f.key === item.key)?.color"
              :draggable="true"
              @dragstart="handleDragStart(item)"
              @dragover.prevent="handleDragOver"
              @dragenter="handleDragEnter($event, item)"
              @dragend="handleDragEnd"
              @click="toggleSelectIndicator(item)"
            >
              <template v-if="isShowIndicator" #operation>
                <el-button type="danger" link size="small" @click.stop="toggleShowIndicator(item)">
                  <template #icon>
                    <FaIcon name="i-ep:close" />
                  </template>
                </el-button>
              </template>
            </IndicatorItem>
            <div
              v-if="!selectDisabled"
              class="flex-center-center cursor-pointer gap-1 border b-rd-2 p-2"
              @click="isShowIndicator = !isShowIndicator"
            >
              <el-button link size="small">
                <template #icon>
                  <FaIcon name="i-ep:plus" />
                </template>
                添加指标
              </el-button>
            </div>
          </div>
          <div class="absolute left-0 right-0 z-66 flex flex-col translate-y-[-50%] scale-y-0 gap-2 border b-rd-2 bg-#fff p-2 op-0 shadow-2xl transition-all duration-300 transition-ease-in-out" :class="{ 'translate-y-2! scale-y-100! op-100!': isShowIndicator }">
            <el-alert :title="`最多选择${showIndicatorLimit}个指标数据`" type="warning" show-icon />
            <div class="grid grid-cols-7 gap-2">
              <IndicatorItem
                v-for="item in indicator.list"
                :key="item.id"
                :data="item"
                :class="{ 'cursor-not-allowed': !item.isShow && selectDisabled, 'bg-#f0f6ff': item.isShow }"
                @click="toggleShowIndicator(item)"
              />
            </div>
          </div>
          <!-- 趋势图 -->
          <Echart :options="chartOptions" class="h[270px]" />
        </div>
        <!-- 趋势表格 -->
        <template v-if="showIndicatorTable">
          <vxe-grid
            height="270px"
            :loading="loading"
            show-footer
            :footer-method="getFooterData"
            :data="analysisChartData"
            :columns="tableColum"
            v-bind="gridOptions"
          >
            <template v-for="item in indicator.list" :key="item.key" #[item.key]="{ row }">
              <div>{{ row[getRowKey(item)] }}</div>
            </template>
          </vxe-grid>
        </template>
      </template>
      <!-- 数据对比 -->
      <template v-else-if="isContrast">
        <!-- 环比 -->
        <vxe-grid height="270px" :toolbar-config="{ slots: { buttons: 'toolbarButtons' } }" :data="quarterOnOuarterData" :columns="quarterOnOuarterTableColum" v-bind="gridOptions">
          <template #toolbarButtons>
            <div class="text-2.5 fw-bold">
              环比
            </div>
          </template>
          <template v-for="item in indicator.list" :key="item.key" #[item.key]="{ row }">
            <div :class=" row.$showColor ? returnRatioClassName(row[getRowKey(item)]) : '' ">
              {{ `${row[getRowKey(item)]}${(percentFields.includes(item.name) || row.$isRate) ? '%' : ''}` }}
            </div>
          </template>
        </vxe-grid>
        <!-- 同比 -->
        <vxe-grid
          height="370px"
          :tree-config="{ transform: true, rowField: 'date', parentField: '$date' }"
          :toolbar-config="{ slots: { buttons: 'toolbarButtons' } }"
          :data="yearOnYearData"
          :columns="yearOnYearTableColum"
          v-bind="gridOptions"
        >
          <template #toolbarButtons>
            <div class="text-2.5 fw-bold">
              同比
            </div>
          </template>
          <template v-for="item in indicator.list" :key="item.key" #[item.key]="{ row }">
            <div>
              {{ `${row[getRowKey(item)] || 0}${(percentFields.includes(item.name) || row.$isRate) ? '%' : ''}` }}
            </div>
          </template>
        </vxe-grid>
      </template>
      <!-- 透视 -->
      <template v-else-if="isPerspective">
        <PerspectiveChart ref="perspectiveChartRef" :ext-search="queryParams" :setting="filterSetting" />
      </template>
      <template v-else-if="isStructure">
        <StructureChart ref="structureChartRef" :trend-tab-type="activeTab" :setting="filterSetting" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { VxeGridProps } from 'vxe-table'
import Decimal from 'decimal.js'
import { cloneDeep } from 'es-toolkit'
import dayjs from '@/utils/dayjs'
import { ADS_MANAGEMENT_TABS, ADS_TREND_TABS } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import IndicatorItem from './IndicatorItem.vue'
import PerspectiveChart from './PerspectiveChart.vue'
import StructureChart from './StructureChart.vue'

const props = withDefaults(defineProps<{
  options?: ObjectAny
}>(), {
  options: () => ({}),
})
const { options } = toRefs(props)
const tabType = computed(() => options.value.type)
const tabs = computed(() => options.value.tabs ?? [ADS_TREND_TABS.TREND])
const customDate = computed(() => options.value.customDate ?? false)
const showIndicatorLimit = computed(() => options.value.showIndicatorLimit ?? 7)
const showChartLimit = computed(() => options.value.showChartLimit ?? 4)
const storage = computed(() => options.value.storage ?? false)
const showIndicatorTable = computed(() => options.value.showIndicatorTable ?? false)
const extSearch = computed(() => options.value.extSearch ?? {})

const data = reactive({
  activeTab: tabs.value[0],
})
const { activeTab } = toRefs(data)
const isTrend = computed(() => activeTab.value === ADS_TREND_TABS.TREND)
const isContrast = computed(() => activeTab.value === ADS_TREND_TABS.CONTRAST)
const isPerspective = computed(() => activeTab.value === ADS_TREND_TABS.PERSPECTIVE)
const isStructure = computed(() => [ADS_TREND_TABS.ADS_STRUCTURE, ADS_TREND_TABS.TARGET_STRUCTURE, ADS_TREND_TABS.ADS_PLACEMENT].includes(activeTab.value))
const perspectiveChartRef = useTemplateRef('perspectiveChartRef')
const structureChartRef = useTemplateRef('structureChartRef')
watch(activeTab, () => {
  nextTick(() => {
    if (isPerspective.value) {
      perspectiveChartRef.value?.getData()
    }
    else if (isStructure.value) {
      structureChartRef.value?.getData()
    }
  })
}, { immediate: true })

const commonSearch = inject<ObjectAny>('commonSearch', () => ({}))

const search = reactive({
  dateList: commonSearch?.dateList ?? [],
  timeRange: 'day',
  ratioType: 1,
  pageNum: 1,
  pageSize: 20,
})
const currentDateList = computed(() => customDate.value ? search.dateList : commonSearch?.dateList || [])
const ratioDateList = computed(() => {
  let res: string[] = []
  if (currentDateList.value.dateList && currentDateList.value.dateList.length === 2) {
    const [start, end] = currentDateList.value.dateList
    if (currentDateList.value.ratioType === 1) {
      const diffDays = dayjs(end).diff(dayjs(start), 'day')
      const ratioStart = dayjs(start).subtract(diffDays + 1, 'day').format('YYYY-MM-DD')
      const ratioEnd = dayjs(start).subtract(1, 'day').format('YYYY-MM-DD')
      res = [ratioStart, ratioEnd]
    }
  }
  else {
    res = []
  }
  return res
})
const { handleQueryParams, getChartDataMethod, getIndicatorDataMethod, getRowKey, percentFields, isValidNumber } = useAmazonAdsUtils()
const indicator = reactive({
  data: {} as ObjectAny,
  list: [] as ObjectAny[],
})
const model = defineModel()
watch(() => indicator.data, (newVal) => {
  model.value = newVal
}, { deep: true })
const selectList = ref<ObjectAny[]>([])
const baseColors = [
  '#1f77b4', // 蓝色
  '#ff7f0e', // 橙色
  '#2ca02c', // 绿色
  '#d62728', // 红色
  '#9467bd', // 紫色
  '#e377c2', // 粉色
  // '#ffeb3b', // 黄色
  '#17becf', // 青色
]
const { getStore, setStore } = useUtils()
const storeKey = 'adsTrend'
const { selectKeys, showKeys } = storage.value ? getStore(storeKey) : { }
const adsTrendSelectKeys = ref<string[]>(selectKeys ?? [])
const adsTrendShowKeys = ref<string[]>(showKeys ?? [])
// 更新选中列表
function updateSelectList() {
  const isSelectList = indicator.list.filter(item => item.isSelect)
  const isShowList = indicator.list.filter(item => item.isShow)

  if (isSelectList.length) {
    selectList.value = cloneDeep(
      isSelectList.map((item, index) => ({ ...item, color: baseColors[index] })),
    )
  }
  else if (isShowList.length) {
    const firstItem = isShowList[0]
    firstItem.isSelect = true
    selectList.value = cloneDeep([{ ...firstItem, color: baseColors[0] }])
  }
}
function setIndicatorList(init_field: string) {
  // 指标默认排序
  const defaultSort = ['costRatio', 'unitsSoldRatio', 'impressionsRatio', 'clicksRatio', 'ctrRatio', 'cvrRatio', 'acosRatio']

  // 过滤并映射指标列表
  const filterAndMapIndicators = () => {
    return Object.entries(indicator.data)
      .filter(([key]) => indicator.data[key])
      .map(([key, value]) => ({
        ...value,
        key,
        isSelect: adsTrendShowKeys.value.includes(key) && adsTrendSelectKeys.value.includes(key),
        isShow: adsTrendShowKeys.value.includes(key),
      }))
  }

  // 按显示顺序排序
  const sortIndicators = (indicators: ObjectAny[]) => {
    return indicators.sort((a, b) => {
      // 优先处理init_field
      if (init_field) {
        if (getRowKey(a) === init_field) { return -1 }
        if (getRowKey(b) === init_field) { return 1 }
      }

      // 按adsTrendShowKeys顺序排序
      const aShowIndex = adsTrendShowKeys.value.indexOf(a.key)
      const bShowIndex = adsTrendShowKeys.value.indexOf(b.key)

      // 如果两个元素都在adsTrendShowKeys中
      if (aShowIndex !== -1 && bShowIndex !== -1) {
        return aShowIndex - bShowIndex
      }
      // 如果只有a在adsTrendShowKeys中
      if (aShowIndex !== -1) { return -1 }
      // 如果只有b在adsTrendShowKeys中
      if (bShowIndex !== -1) { return 1 }

      // 都不在adsTrendShowKeys中,按defaultSort顺序排序
      const aIndex = defaultSort.indexOf(a.key)
      const bIndex = defaultSort.indexOf(b.key)

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      if (aIndex !== -1) { return -1 }
      if (bIndex !== -1) { return 1 }

      return 0
    })
  }
  // 初始化指标状态
  const initIndicatorStatus = () => {
    // 重置所有指标状态
    indicator.list.forEach((item) => {
      item.isSelect = item.isShow = false
    })

    // 设置默认选中指标
    const defaultIndicator = indicator.list.find(f => getRowKey(f) === init_field)
    if (defaultIndicator) { defaultIndicator.isSelect = defaultIndicator.isShow = true }

    // 按adsTrendShowKeys顺序填充
    adsTrendShowKeys.value.some((key) => {
      if (indicator.list.filter(f => f.isShow).length >= showIndicatorLimit.value) { return true }
      const item = indicator.list.find(f => f.key === key && !f.isShow)
      if (item) { item.isShow = true }
      return false
    })
    // 随机填充剩余指标
    const remainingCount = showIndicatorLimit.value - indicator.list.filter(f => f.isShow).length // 剩余指标数量
    const availableItems = indicator.list.filter(item => !item.isShow) // 可用指标列表

    // 填充剩余指标
    for (let i = 0; i < Math.min(remainingCount, availableItems.length); i++) {
      availableItems[i].isShow = true
    }
  }

  indicator.list = sortIndicators(filterAndMapIndicators())
  if (init_field || !adsTrendShowKeys.value.length) { initIndicatorStatus() }
  updateSelectList()
}

const queryParams = computed(() => handleQueryParams({
  ...toRaw(commonSearch),
  ...toValue(extSearch),
  ...handleQueryParams(search),
  dateList: currentDateList.value,
  ratioDateList: ratioDateList.value,
  ...(activeTab.value === ADS_TREND_TABS.CONTRAST ? { timeRange: 'day' } : { timeRange: search.timeRange }),
}))
const analysisChartData = ref<ObjectAny[]>([])
const { request: chartRequest, loading: chartLoading } = useRequest()
async function getChartData() {
  try {
    const api = getChartDataMethod(tabType.value)
    if (!api) {
      analysisChartData.value = []
      return
    }
    const { data = [] } = await chartRequest(api, queryParams.value)
    analysisChartData.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
    analysisChartData.value = []
  }
}

const { request, loading } = useRequest()
async function getData({ field }: ObjectAny = {}) {
  try {
    const api = getIndicatorDataMethod(tabType.value)
    if (!api) {
      indicator.data = {}
      return
    }
    const { data = {} } = await request(api, queryParams.value)
    indicator.data = isObject(data) ? data : {}
    setIndicatorList(field)
    await getChartData()
  }
  catch (error) {
    console.error(error)
    indicator.data = {}
  }
}
defineExpose({ getData })

const isShowIndicator = ref(false)
function indicatorSet() {
  isShowIndicator.value = !isShowIndicator.value
}

const indicatorShowCount = computed(() => indicator.list.filter(item => item.isShow).length)
const selectDisabled = computed(() => indicatorShowCount.value >= showIndicatorLimit.value)

const dragging = ref<ObjectAny | null>(null)
const ending = ref<ObjectAny | null>(null)
// 移动开始
function handleDragStart(item: ObjectAny) {
  dragging.value = item
}
// 元素移到容器范围内触发
function handleDragOver(e: DragEvent) {
  // 首先把div变成可以放置的元素，即重写dragenter/dragover
  // 在dragenter中针对放置目标来设置
  if (e.dataTransfer) { e.dataTransfer.dropEffect = 'move' }
}
// 为需要移动的元素设置dragstart事件
function handleDragEnter(e: DragEvent, item: ObjectAny) {
  if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move' }
  ending.value = item
}
// 移动结束
function handleDragEnd() {
  if (ending.value?.name === dragging.value?.name) { return }
  const newItems = [...indicator.list]
  const [dragIndex, dst] = [newItems.indexOf(dragging.value!), newItems.indexOf(ending.value!)]
  newItems.splice(dragIndex, 1, ...newItems.splice(dst, 1, newItems[dragIndex]))
  indicator.list = newItems
  nextTick(() => {
    dragging.value = null
    ending.value = null
  })
}
// 选中指标
function toggleSelectIndicator(item: ObjectAny) {
  if (item.isSelect) {
    item.isSelect = false
    selectList.value = selectList.value.filter(f => f.key !== item.key)
  }
  else {
    if (selectList.value.length >= showChartLimit.value) {
      indicator.list.find(f => f.key === selectList.value[0].key)!.isSelect = false
      selectList.value.shift()
    }
    const usedColors = selectList.value.map(f => f.color)
    const availableColors = baseColors.filter(color => !usedColors.includes(color))
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)]
    selectList.value.push({ ...cloneDeep(item), color: randomColor })
    item.isSelect = true
  }
}
// 切换指标显示
function toggleShowIndicator(item: ObjectAny) {
  if (selectDisabled.value && !item.isShow) { return }
  item.isShow = !item.isShow
  item.isSelect = false
  updateSelectList()
}

function setLocalStorage() {
  const { selectKeys, showKeys } = indicator.list.reduce((res, item) => {
    if (item.isSelect) { res.selectKeys.push(item.key) }
    if (item.isShow) { res.showKeys.push(item.key) }
    return res
  }, { selectKeys: [], showKeys: [] })
  adsTrendSelectKeys.value = selectKeys
  adsTrendShowKeys.value = showKeys
  if (storage.value) {
    setStore(storeKey, { selectKeys: adsTrendSelectKeys.value, showKeys: adsTrendShowKeys.value })
  }
}
watch(() => indicator.list, setLocalStorage, { deep: true })

const chartOptions = computed<EChartsOption>(() => {
  const { yAxis = [], series = [] } = indicator.list.length
    ? indicator.list.reduce((res, item) => {
        const isPercent = percentFields.includes(getRowKey(item))
        const { currencySymbol } = item
        if (item.isSelect) {
          const color = selectList.value.find(f => f.key === item.key)?.color
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
        }
        return res
      }, { yAxis: [], series: [] })
    : {
        yAxis: [{ type: 'value', data: [] }],
        series: [{ type: 'line', data: [] }],
      }
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
    color: baseColors,
    series,
  }
})

const gridOptions = reactive<VxeGridProps>({
  size: 'mini',
  columnConfig: { resizable: true, minWidth: 'auto' },
  rowConfig: { isCurrent: true, isHover: true },
  scrollY: {
    enabled: true,
    gt: 20,
  },
})
const childTableColum: { treeNode: boolean, fixed?: 'left' | 'right' } = {
  treeNode: true,
  fixed: 'left',
}
function createTableColum({ quarterOnOuarter = false, yearOnYear = false } = {}): VxeGridProps['columns'] {
  return [
    ...(yearOnYear ? [childTableColum] : []),
    {
      field: search.timeRange === 'hour' && !(quarterOnOuarter || yearOnYear) ? 'hourRange' : 'date',
      title: '时间',
      width: 180,
      fixed: 'left',
    },
    ...indicator.list.map(item => ({
      field: item.key,
      title: item.title,
      width: 180,
      slots: { default: item.key },
    })),
  ]
}
const tableColum = computed<VxeGridProps['columns']>(() => createTableColum())
const quarterOnOuarterTableColum = computed(() => createTableColum({ quarterOnOuarter: true }))
const yearOnYearTableColum = computed(() => createTableColum({ yearOnYear: true }))
function getFooterData() {
  const total = indicator.list.reduce((res, item) => {
    // if (item.key) {
    //   const val = getSum(data, rowKey(item))
    //   res.push(`${val}${percentFields.includes(item.name) ? '%' : ''}`)
    // } else {
    //   res.push(null)
    // }
    const { key, value } = item
    res.push(key ? value : null)
    return res
  }, ['合计'])
  return [total]
}
// 环比数据
const quarterOnOuarterData = computed(() => {
  const date = currentDateList.value.length === 2 ? `${currentDateList.value[0]}~${currentDateList.value[1]}` : ''
  const onQuarterDate = ratioDateList.value.length === 2 ? `${ratioDateList.value[0]}~${ratioDateList.value[1]}` : '-'
  const initialData = { current: { date }, ratioValue: { date: onQuarterDate }, change: { date: '变动值', $showColor: true }, rate: { date: '环比', $showColor: true, $isRate: true } }
  const { current, ratioValue, change, rate } = indicator.list.reduce((res, { key, value = 0, ratioValue = 0, rate = 0 }) => {
    const row_key = getRowKey({ key })
    res.current[row_key] = value || 0
    res.ratioValue[row_key] = ratioValue || 0
    res.change[row_key] = new Decimal(value || 0).minus(ratioValue || 0).toString()
    res.rate[row_key] = rate
    return res
  }, initialData)
  return [current, ratioValue, change, rate]
})
function returnRatioClassName(val: string | number) {
  return isValidNumber(val) ? Number(val) > 0 ? 'c-red' : 'c-green' : ''
}
// 同比数据
const yearOnYearData = computed(() => {
  const sum: ObjectAny = {}
  const subData = analysisChartData.value.map(({ date, ...rest }) => {
    const $date = dayjs(date).format('dddd')
    if (!sum[$date]) { sum[$date] = {} }
    Object.entries(rest).forEach(([key, value]) => {
      if (isValidNumber(value)) { sum[$date][key] = new Decimal(sum[$date][key] || 0).plus(new Decimal(value || 0)).toString() }
    })
    return { ...rest, date, $date }
  })
  const sumData = Object.entries(sum).map(([key, value]) => ({ ...value, date: key, $date: null }))
  return [...subData, ...sumData]
})
const filterSetting = {
  options: [
    { value: 'impressions', label: '曝光量' },
    { value: 'clicks', label: '点击量' },
    { value: 'ctr', label: 'CTR' },
    { value: 'cost', label: '广告花费' },
    { value: 'cpc', label: 'CPC' },
    { value: 'adsOrders', label: '广告总订单量' },
    { value: 'adsSales', label: '广告总销售额' },
    { value: 'adsUnitSales', label: '广告总销量' },
    { value: 'acos', label: 'ACOS' },
    { value: 'roas', label: 'ROAS' },
    { value: 'cvr', label: 'CVR' },
    { value: 'cpa', label: 'CPA' },
    { value: 'newToBrandPurchases', label: '新买家订单量' },
    { value: 'newToBrandSales', label: '新买家销售额' },
  ],
  currencyField: ['cost', 'cpc', 'adsSales', 'cpa'],
  percentField: ['ctr', 'acos', 'cvr'],
}
</script>

<style lang="scss" scoped>
.indicator-selector {
  position: absolute;
  left: -6px;
  z-index: 66;
  visibility: hidden;
  width: calc(100% + 12px);
  padding: 6px;
  overflow-y: auto;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgb(0 0 0 / 12%), 0 6px 18px rgb(0 0 0 / 8%);
  opacity: 0;
  transform: translateY(-50%) scaleY(0);
  transition: all 0.3s ease-in-out;

  &.visible {
    visibility: visible;
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}
</style>
