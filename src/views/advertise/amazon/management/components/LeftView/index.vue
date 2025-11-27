<template>
  <div class="size-full flex flex-col gap-2">
    <div class="flex-center-start gap-2">
      <div class="fw-bold">
        {{ ADS_VIEW_TYPE.getLabelByValue(viewType) }}
      </div>
      <FaDropdown :items="commandOptions">
        <el-button type="primary" size="small">
          <FaIcon name="i-mdi:exchange" />
        </el-button>
      </FaDropdown>
    </div>
    <div class="w-full flex-center-start">
      <el-select v-model="search.inputType" class="w-20" size="small">
        <el-option v-for="item in ADS_VIEW_ASIN_SEARCH_TYPE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <div class="flex-w-auto">
        <el-input v-if="search.inputType === ADS_VIEW_ASIN_SEARCH_TYPE.ASIN" v-model="search.asin" size="small" />
        <el-input v-else-if="search.inputType === ADS_VIEW_ASIN_SEARCH_TYPE.PARENT_ASIN" v-model="search.parentAsin" size="small" />
        <el-input v-else-if="search.inputType === ADS_VIEW_ASIN_SEARCH_TYPE.SKU" v-model="search.sku" size="small" />
      </div>
      <el-button type="primary" size="small" @click="getData()">
        <FaIcon name="i-ep:search" />
      </el-button>
    </div>
    <div class="flex-center-start">
      <el-select v-model="search.states" size="small" multiple collapse-tags filterable clearable @change="getData()">
        <el-option v-for="item in ADS_AVAILABLE_STATE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button v-if="selectData.length" size="small" @click="clearSelect()">
        清空已选{{ selectData.length }}
      </el-button>
      <el-button type="primary" size="small" :disabled="!selectData.length" @click="searchHandler()">
        查询
      </el-button>
    </div>
    <div class="flex-h-auto">
      <AsinViewList v-if="isAsinView" ref="asinViewListRef" v-model:total="total" v-model:select-data="selectData" @set-view-data="setViewData" />
      <ParentAsinViewList v-else-if="isParentAsinView" ref="parentAsinViewListRef" v-model:total="total" v-model:select-data="selectData" @set-view-data="setViewData" />
      <AdsCombineViewList v-else-if="isCombineView" ref="advCombineViewListRef" v-model:total="total" v-model:select-data="selectData" @set-view-data="setViewData" />
    </div>
    <el-pagination v-model:current-page="search.pageNum" v-model:page-size="search.pageSize" :total="total" :page-sizes="[50, 100, 200, 300]" size="small" layout="total, prev, pager, next, sizes" @current-change="getData()" @size-change="getData()" />
  </div>
</template>

<script setup lang="ts">
import { ADS_AVAILABLE_STATE, ADS_VIEW_ASIN_SEARCH_TYPE, ADS_VIEW_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import AdsCombineViewList from './AdsCombineViewList.vue'
import AsinViewList from './AsinViewList.vue'
import ParentAsinViewList from './ParentAsinViewList.vue'

const route = useRoute()
const queryViewType = Number(route.query.viewType)
function initSearch() {
  const { asin = '', parentAsin = '' } = route.query ?? {}
  return {
    inputType: ADS_VIEW_ASIN_SEARCH_TYPE.ASIN,
    asin: '',
    parentAsin: '',
    sku: '',
    ...(queryViewType === ADS_VIEW_TYPE.ASIN && { inputType: ADS_VIEW_ASIN_SEARCH_TYPE.ASIN, asin: String(asin ?? '') }),
    ...(queryViewType === ADS_VIEW_TYPE.PARENT_ASIN && { inputType: ADS_VIEW_ASIN_SEARCH_TYPE.PARENT_ASIN, parentAsin: String(parentAsin ?? '') }),
    states: [],
    pageNum: 1,
    pageSize: 50,
  }
}
const search = reactive(initSearch())
provide('viewSearch', search)
const total = ref(0)

const storeKey = 'amazon_ads_management_view_type'
const { getStore, setStore } = useUtils()
function initViewType() {
  const { viewType: storeViewType } = getStore(storeKey)
  return queryViewType || (storeViewType ?? ADS_VIEW_TYPE.MSKU)
}
const viewType = ref(initViewType())
provide('viewType', viewType)
const { isAsinViewType, isParentAsinViewType, isCombineViewType } = useAmazonAdsUtils()
const isAsinView = computed(() => isAsinViewType(viewType.value))
const isParentAsinView = computed(() => isParentAsinViewType(viewType.value))
const isCombineView = computed(() => isCombineViewType(viewType.value))
watch(viewType, (newVal) => {
  setStore(storeKey, { viewType: newVal })
}, { deep: true })
const selectData = reactive<ObjectAny[]>([])
const asinViewListRef = useTemplateRef('asinViewListRef')
const parentAsinViewListRef = useTemplateRef('parentAsinViewListRef')
const advCombineViewListRef = useTemplateRef('advCombineViewListRef')
function clearSelect(...args: any[]) {
  selectData.length = 0
  if (isAsinView.value) { asinViewListRef.value?.clearSelect() }
  else if (isParentAsinView.value) { parentAsinViewListRef.value?.clearSelect() }
  else if (isCombineView.value) { advCombineViewListRef.value?.clearSelect() }
  getData(...args)
}
const commandOptions = [
  ADS_VIEW_TYPE.getOptions().reduce<{ label: string, handle: () => void }[]>((acc, item) => {
    if (![ADS_VIEW_TYPE.ACTIVITY_TAG, ADS_VIEW_TYPE.ADS_ACTIVITT].includes(Number(item.value))) {
      acc.push({
        label: item.label,
        handle: () => {
          viewType.value = item.value
          clearSelect(true)
        },
      })
    }
    return acc
  }, []),
]

async function getData(resetPage = false) {
  try {
    await nextTick()
    if (resetPage) {
      search.pageNum = 1
    }
    if (isAsinView.value) { await asinViewListRef.value?.getData() }
    else if (isParentAsinView.value) { await parentAsinViewListRef.value?.getData() }
    else if (isCombineView.value) { await advCombineViewListRef.value?.getData() }
  }
  catch (error) {
    console.error(error)
  }
}
defineExpose({ getData, clearSelect })

const updateCommonSearch = inject('updateCommonSearch', (_data: ObjectAny, _setting?: ObjectAny) => {})
const updateViewInfo = inject('updateViewInfo', (_data: ObjectAny) => {})
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
function searchHandler() {
  updateCommonSearchHandler({
    asins: viewType.value === isAsinViewType(viewType.value) ? selectData.map(item => item.asin) : [],
    parentAsins: viewType.value === isParentAsinViewType(viewType.value) ? selectData.map(item => item.asin) : [],
    portfolioIds: viewType.value === isCombineViewType(viewType.value) ? selectData.map(item => item.portfolioId) : [],
  })
  updateViewInfo({ type: viewType.value, data: toRaw(selectData) })
}

function setViewData(data: ObjectAny[], type?: number) {
  if (isAsinView.value) {
    updateCommonSearchHandler({ asins: data.map(item => item.asin) }, { storage: false })
    updateViewInfo({ type: viewType.value, data })
  }
  else if (isParentAsinView.value) {
    if (type === ADS_VIEW_TYPE.ASIN) {
      // 点击父ASIN下的子项
      updateCommonSearchHandler({ asins: data.map(item => item.asin) }, { storage: false })
      updateViewInfo({ type, data })
    }
    else {
      updateCommonSearchHandler({ parentAsins: data.map(item => item.parentAsin) }, { storage: false })
      updateViewInfo({ type: viewType.value, data })
    }
  }
  else if (isCombineView.value) {
    if (type === ADS_VIEW_TYPE.ADS_ACTIVITT) {
      // 点击父ASIN下的子项
      updateCommonSearchHandler({ campaignId: data[0]?.campaignId }, { storage: false })
      updateViewInfo({ type, data })
    }
    else {
      updateCommonSearchHandler({ portfolioIds: data.map(item => item.portfolioId) }, { storage: false })
      updateViewInfo({ type: viewType.value, data })
    }
  }
}
</script>
