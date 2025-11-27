<route lang="yaml">
  meta:
    title: '广告管理'
</route>

<template>
  <div class="absolute size-full flex flex-col">
    <FaPageMain class="flex-h-auto" main-class="flex-h-auto flex flex-col">
      <FaSearchBar :show-toggle="false">
        <template #default="{ fold, toggle }">
          <el-form :model="search" size="small" inline-message inline>
            <el-form-item>
              <el-radio-group v-model="search.type" @change="getData()">
                <el-radio-button v-for="item in typeOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-select v-model="search.shopIds" class="w-50" multiple collapse-tags filterable clearable @change="getData()">
                <el-option v-for="item in amazonAdsShopList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="统计日期">
              <div class="flex-center-start">
                <el-date-picker v-model="search.dateList" type="daterange" :shortcuts="shortcuts" @change="handleDateChange" />
                <el-popover>
                  <el-radio-group v-model="search.ratioType">
                    <el-radio v-for="item in ratioTypeOptions" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </el-radio>
                  </el-radio-group>
                  <template #reference>
                    <el-button>
                      <FaIcon name="i-ep:setting" />
                    </el-button>
                  </template>
                </el-popover>
              </div>
            </el-form-item>
            <el-form-item v-if="search.ratioType === 3" label="环比日期">
              <el-date-picker v-model="search.ratioDateList" type="daterange" :shortcuts="shortcuts" @change="getData()" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getData()">
                <template #icon>
                  <FaIcon name="i-ep:search" />
                </template>
                查询
              </el-button>
              <el-button @click="resetSearch(); getData()">
                <template #icon>
                  <FaIcon name="i-ep:refresh" />
                </template>
                重置
              </el-button>
              <el-button link size="small" disabled @click="toggle">
                <template #icon>
                  <FaIcon :name="fold ? 'i-ep:caret-bottom' : 'i-ep:caret-top' " />
                </template>
                {{ fold ? '展开' : '收起' }}
              </el-button>
            </el-form-item>
          </el-form>
        </template>
      </FaSearchBar>
      <div class="flex-h-auto">
        <FaLayoutContainer v-if="selectedShop" class="static p-0" left-side-class="h-full flex flex-col gap-4" default-class="size-full">
          <template #leftSide>
            <LeftView ref="leftViewRef" />
          </template>
          <RightMain ref="rightMainRef" />
        </FaLayoutContainer>
      </div>
    </FaPageMain>
    <TrendAnalysis ref="trendAnalysisRef" />
  </div>
</template>

<script setup lang="ts">
import type { enumAdsViewType } from '@/utils/enum/advertise'
import type { CommonType } from '@/utils/hooks/useAmazonAdsUtils'
import { amazonAdsCampaignGetSiteDates } from '@/api/modules/advertise/amazon'
import dayjs from '@/utils/dayjs'
import { ADS_MANAGEMENT_TYPE, ADS_VIEW_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import LeftView from './components/LeftView/index.vue'
import RightMain from './components/RightMain.vue'
import TrendAnalysis from './components/Trend/Analysis.vue'

const typeOptions = ADS_MANAGEMENT_TYPE.getOptions()

const ratioTypeOptions = [
  { value: 1, label: '环比' },
  { value: 2, label: '去年同期' },
  { value: 3, label: '自定义' },
]

const storeKey = 'amazon_ads_management_search'
const timeZone = 'America/Los_Angeles'
const initDate = () => [dayjs().tz(timeZone).subtract(7, 'day').format('YYYY-MM-DD'), dayjs().tz(timeZone).format('YYYY-MM-DD')]
const route = useRoute()
const { getStore, setStore } = useUtils()
export interface CommonSearch {
  type: CommonType
  shopIds: number[]
  dateList: string[]
  ratioType: typeof ratioTypeOptions[number]['value']
  ratioDateList: string[]
  campaignId?: string
}
function initSearch(): CommonSearch {
  const data: CommonSearch = {
    type: typeOptions[0].value,
    shopIds: [],
    dateList: initDate(),
    ratioType: ratioTypeOptions[0].value,
    ratioDateList: initDate(),
  }
  Object.assign(data, getStore(storeKey))
  if (route.query?.shopId) {
    data.shopIds = [Number(route.query.shopId)]
  }
  return data
}
const search = reactive<CommonSearch>(initSearch())
provide<CommonSearch>('commonSearch', search)
function resetSearch() {
  Object.assign(search, initSearch())
}
function updateCommonSearch(data?: ObjectAny, { storage = true } = {}) {
  Object.assign(search, isObject(data) ? data : {})
  if (!search.campaignId) { delete search.campaignId }
  if (storage) { setStore(storeKey, search) }
}
provide('updateCommonSearch', updateCommonSearch)

const { amazonAdsShopList, getAmazonAdsShopList } = useShop()
const siteId = computed(() => amazonAdsShopList.value.find(item => item.id === search.shopIds?.[0])?.siteId)
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
const { request } = useRequest()
const shortcuts = Object.entries(datePickerShortcuts).map(([type, text]) => ({
  text,
  onClick: async (picker: any) => {
    try {
      const { data = [] } = await request(amazonAdsCampaignGetSiteDates, { type, siteId: siteId.value })
      const result = Array.isArray(data)
        ? data.reduce((acc, item) => {
            const time = dayjs(item)
            if (time.isValid()) {
              acc.push(time)
            }
            return acc
          }, [])
        : []
      picker.emit('pick', result)
    }
    catch (error) {
      console.error(error)
    }
  },
}))

const leftViewRef = useTemplateRef('leftViewRef')
const rightMainRef = useTemplateRef('rightMainRef')
// 详情数据
type AdsViewType = enumAdsViewType[keyof enumAdsViewType]
const viewInfoStoreKey = 'amazon_ads_management_view_info'
const { isAsinViewType, isParentAsinViewType, isCombineViewType, isAdsActivityViewType } = useAmazonAdsUtils()
const adsViewTypeMap = ADS_VIEW_TYPE.getMapping()
function updateCommonSearchHandler(data: ObjectAny, setting?: ObjectAny) {
  const params = {
    asins: [],
    parentAsins: [],
    portfolioIds: [],
    campaignId: '',
  }
  if (isObject(data)) {
    Object.assign(params, data)
  }
  updateCommonSearch(params, setting)
}
function initViewInfo() {
  const { type: viewType, data: viewData } = getStore(viewInfoStoreKey)
  if (adsViewTypeMap[viewType] && Array.isArray(viewData) && viewData.length) {
    if (isAsinViewType(viewType)) {
      updateCommonSearchHandler({ asins: viewData.map(item => item.asin) })
    }
    else if (isParentAsinViewType(viewType)) {
      updateCommonSearchHandler({ parentAsins: viewData.map(item => item.parentAsin) })
    }
    else if (isCombineViewType(viewType)) {
      updateCommonSearchHandler({ portfolioIds: viewData.map(item => item.portfolioId) })
    }
    else if (isAdsActivityViewType(viewType)) {
      updateCommonSearchHandler({ campaignId: viewData[0]?.campaignId })
    }
    return { type: viewType, data: viewData }
  }
  return { type: undefined, data: [] }
}
const viewInfo = reactive<{ type: AdsViewType, data: ObjectAny[] }>(initViewInfo())
watch(viewInfo, (newVal) => {
  setStore(viewInfoStoreKey, toRaw(newVal))
}, { deep: true })
function updateViewInfo(config = {}, { refresh = true, clearLeftBarSelect = false } = {}) {
  if (clearLeftBarSelect) { leftViewRef.value?.clearSelect() }
  if (isObject(config)) {
    const { type, data } = config as { type?: AdsViewType, data: ObjectAny[] }
    if (type && adsViewTypeMap[type]) { viewInfo.type = type }
    if (Array.isArray(data)) { viewInfo.data = data }
    if (refresh) { rightMainRef.value?.getData() }
  }
}
provide('viewInfo', viewInfo)
provide('updateViewInfo', updateViewInfo)

const selectedShop = computed(() => Array.isArray(search.shopIds) && search.shopIds.length)
async function getData() {
  if (!selectedShop.value) {
    toast.warning('数据量过大，至少选择一个店铺作为搜索条件')
  }
  await nextTick()
  leftViewRef.value?.getData()
  rightMainRef.value?.getData()
  updateCommonSearch()
}

function handleDateChange(dateList: any[]) {
  if (Array.isArray(dateList) && dateList.length === 2) {
    const [start, end] = dateList
    if (search.ratioType === 1) {
      const diffDays = dayjs(end).diff(dayjs(start), 'day')
      const ratioStart = dayjs(start).subtract(diffDays + 1, 'day').format('YYYY-MM-DD')
      const ratioEnd = dayjs(start).subtract(1, 'day').format('YYYY-MM-DD')
      search.ratioDateList = [ratioStart, ratioEnd]
    }
    else if (search.ratioType === 2) {
      const ratioStart = dayjs(start).subtract(1, 'year').format('YYYY-MM-DD')
      const ratioEnd = dayjs(end).subtract(1, 'year').format('YYYY-MM-DD')
      search.ratioDateList = [ratioStart, ratioEnd]
    }
  }
  else {
    search.ratioDateList = []
  }
  getData()
}

onMounted(() => {
  getAmazonAdsShopList()
  getData()
})

const init = ref(false)
onActivated(() => {
  if (init.value) {
    init.value = false
    return
  }
  nextTick(() => rightMainRef.value?.getData())
})

//  趋势分析弹窗
const trendAnalysisRef = useTemplateRef('trendAnalysisRef')
const showTrendAnalysis = (...args: Parameters<NonNullable<typeof trendAnalysisRef.value>['show']>) => trendAnalysisRef.value?.show(...args)
provide('showTrendAnalysis', showTrendAnalysis)
</script>
