<template>
  <div class="size-full flex flex-col gap-2">
    <div v-if="existViewInfo" class="p-2">
      <div class="flex-center-between">
        <div v-if="isSingleViewData" class="flex-center-start gap-2">
          <div class="fw-bold">
            {{ ADS_VIEW_TYPE.getLabelByValue(viewType) }}
          </div>
          <div v-if="viewType === ADS_VIEW_TYPE.MSKU">
            {{ singleViewData.sellerSku }}
          </div>
          <div v-else-if="viewType === ADS_VIEW_TYPE.ASIN">
            {{ singleViewData.asin }}
          </div>
          <div v-else-if="viewType === ADS_VIEW_TYPE.PARENT_ASIN">
            {{ singleViewData.parentAsin }}
          </div>
          <div v-else-if="viewType === ADS_VIEW_TYPE.ADS_COMBINE">
            {{ singleViewData.name }}
          </div>
          <div v-else-if="viewType === ADS_VIEW_TYPE.ADS_ACTIVITT">
            {{ singleViewData.name }}
          </div>
          <el-button link size="small" @click="toggleShowDetail">
            <template #icon>
              <FaIcon :name="showDetail ? 'i-ep:hide' : 'i-ep:view' " />
            </template>
            {{ showDetail ? '隐藏' : '显示' }}详情
          </el-button>
        </div>
        <div v-else class="fw-bold">
          批量查询
        </div>
        <div class="flex-center-start gap-2">
          <el-checkbox v-model="clearSelect">
            清空已选
          </el-checkbox>
          <el-button type="primary" size="small" @click="clearViewInfo(clearSelect)">
            <template #icon>
              <FaIcon name="i-ep:back" />
            </template>
            返回全部
          </el-button>
        </div>
      </div>
      <el-descriptions v-if="isSingleViewData && showDetail" :column="5" size="small" border>
        <template v-if="[ADS_VIEW_TYPE.MSKU, ADS_VIEW_TYPE.ASIN, ADS_VIEW_TYPE.PARENT_ASIN].includes(viewType)">
          <el-descriptions-item label="图片" :span="1">
            <FaImagePreview :src="singleViewData.imageUrl" class="size-8" />
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="4">
            <CopyText v-model="singleViewData.title" />
          </el-descriptions-item>
        </template>
        <template v-if="[ADS_VIEW_TYPE.MSKU, ADS_VIEW_TYPE.ASIN].includes(viewType)">
          <el-descriptions-item label="ASIN">
            <el-button type="primary" link size="small" @click="jumpToAmazon(singleViewData)">
              {{ singleViewData.asin ?? '' }}
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="父ASIN">
            <span>{{ singleViewData.parentAsin ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="大类排名">
            <span>{{ bigRank ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="小类排名">
            <span>{{ smallRank ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="运营状态">
            <span>{{ PRODUCT_SALE_STATUS.getLabelByValue(singleViewData.saleStatus) ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="销售状态">
            <span>{{ AMAZON_PRODUCT_SALE_STATUS.getLabelByValue(singleViewData.stopSale) ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="价格">
            <span>{{ [singleViewData.itemPriceCurrency ?? '', singleViewData.itemPrice ?? ''].filter(Boolean).join(' ') ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="FBA可售">
            <div v-if="singleViewData.inventoryDataVo" class="flex-center-start gap-2">
              <div>{{ singleViewData.inventoryDataVo.fulfillableQuantity ?? '-' }}</div>
              <el-popover>
                <div class="flex-center-start gap-4">
                  <div class="fw-bold">
                    91-180天
                  </div>
                  <div class="flex-w-auto">
                    {{ singleViewData.inventoryDataVo.invAge91To180Days ?? '-' }}
                  </div>
                </div>
                <div class="flex-center-start gap-4">
                  <div class="fw-bold">
                    181-270
                  </div>
                  <div class="flex-w-auto">
                    {{ singleViewData.inventoryDataVo.invAge181To270Days ?? '-' }}
                  </div>
                </div>
                <div class="flex-center-start gap-4">
                  <div class="fw-bold">
                    271-365
                  </div>
                  <div class="flex-w-auto">
                    {{ singleViewData.inventoryDataVo.invAge271To365Days ?? '-' }}
                  </div>
                </div>
                <div class="flex-center-start gap-4">
                  <div class="fw-bold">
                    365天
                  </div>
                  <div class="flex-w-auto">
                    {{ singleViewData.inventoryDataVo.invAge365PlusDays ?? '-' }}
                  </div>
                </div>
                <div class="flex-center-start gap-4">
                  <div class="fw-bold">
                    总滞销
                  </div>
                  <div class="flex-w-auto">
                    {{ singleViewData.inventoryDataVo.ageCount ?? 0 }}
                  </div>
                </div>
                <template #reference>
                  <el-tag type="danger" size="small">
                    滞销({{ singleViewData.inventoryDataVo.ageCount ?? 0 }})
                    <FaIcon name="i-ep:arrow-down" />
                  </el-tag>
                </template>
              </el-popover>
            </div>
          </el-descriptions-item>
        </template>
        <template v-if="[ADS_VIEW_TYPE.MSKU, ADS_VIEW_TYPE.ASIN, ADS_VIEW_TYPE.PARENT_ASIN].includes(viewType)">
          <el-descriptions-item label="店铺">
            <span>{{ singleViewData.shopName ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="销售负责人">
            <span>{{ singleViewData.userName ?? '-' }}</span>
          </el-descriptions-item>
        </template>
        <template v-if="viewType === ADS_VIEW_TYPE.ADS_COMBINE">
          <el-descriptions-item label="广告组合">
            <span>{{ singleViewData.name ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="服务状态">
            <span>{{ singleViewData.state ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="预算上限">
            <span>{{ singleViewData.inBudget ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="活动预算合计">
            <span>{{ singleViewData.budgetAmount ?? '-' }}</span>
          </el-descriptions-item>
        </template>
      </el-descriptions>
      <div v-else-if="!isSingleViewData" class="flex-center-start flex-nowrap gap-2 of-x-auto">
        <div v-for="item in viewData" :key="item.asin" class="w-fit flex-center-start gap-2 border b-rd-4 p-3">
          <template v-if="[ADS_VIEW_TYPE.MSKU, ADS_VIEW_TYPE.ASIN, ADS_VIEW_TYPE.PARENT_ASIN].includes(viewType)">
            <div class="size-8">
              <FaImagePreview :src="item.imageUrl" class="size-full" />
            </div>
            <div>
              <div class="flex-center-start">
                <el-button type="primary" link size="small" @click="jumpToAmazon(item)">
                  {{ item.asin }}
                </el-button>
                <el-tag v-if="viewType === ADS_VIEW_TYPE.PARENT_ASIN" type="primary" size="small">
                  父
                </el-tag>
              </div>
              <div class="text-3">
                {{ item.shopName || '' }}
              </div>
            </div>
          </template>
          <template v-else-if="viewType === ADS_VIEW_TYPE.ADS_COMBINE">
            <div class="fw-bold">
              广告组合
            </div>
            <div>{{ item.name }}</div>
          </template>
        </div>
      </div>
    </div>
    <FaTabs v-model="activeTab" :list="tabsList" />
    <div class="flex-h-auto">
      <AdsCombination v-if="activeTab === ADS_MANAGEMENT_TABS.ADS_COMBINATION" ref="adsCombinationRef" />
      <AdsActivity v-else-if="activeTab === ADS_MANAGEMENT_TABS.ADS_ACTIVITY" ref="adsActivityRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { enumAdsManagementTabs } from '@/utils/enum/advertise'
import type { CommonTabType } from '@/utils/hooks/useAmazonAdsUtils'
import { ADS_MANAGEMENT_TABS, ADS_MANAGEMENT_TYPE, ADS_VIEW_TYPE } from '@/utils/enum/advertise'
import { AMAZON_PRODUCT_SALE_STATUS, PRODUCT_SALE_STATUS } from '@/utils/enum/sale'
import AdsActivity from './AdsActivity/index.vue'
import AdsCombination from './AdsCombination/index.vue'

const viewInfo = inject('viewInfo', { type: undefined, data: [] })
const viewType = computed<number>(() => viewInfo.type ?? 0)
const viewData = computed<ObjectAny[]>(() => Array.isArray(viewInfo.data) ? viewInfo.data : [])
const existViewInfo = computed(() => ADS_VIEW_TYPE.getMapping()[viewType.value] && !!viewData.value.length)
const isSingleViewData = computed(() => existViewInfo.value && viewData.value.length === 1)
const singleViewData = computed(() => existViewInfo.value ? viewData.value[0] : {})
const showDetail = ref(true)
function toggleShowDetail() {
  showDetail.value = !showDetail.value
}
const clearSelect = ref(true)
const updateCommonSearch = inject('updateCommonSearch', (_data: ObjectAny, _setting?: ObjectAny) => {})
const updateViewInfo = inject('updateViewInfo', (_data: ObjectAny, _setting?: ObjectAny) => {})
function clearViewInfo(clearLeftBarSelect = false) {
  showDetail.value = true
  updateCommonSearch({
    asins: [],
    parentAsins: [],
    portfolioIds: [],
    campaignId: '',
  })
  updateViewInfo({ data: [] }, { clearLeftBarSelect })
}
function jumpToAmazon(data: ObjectAny) {
  const { asin, siteId = '' } = data
  if (asin) { window.open(`https://www.amazon.${(siteId === 'US' ? 'com' : siteId).toLowerCase() || 'com'}/gp/product/${asin}`) }
}
function returnRankText(ranks: ObjectAny[], type: number) {
  if (Array.isArray(ranks) && !!ranks.length) {
    return ranks.find(f => f.type === type)?.ranks || '-'
  }
  return '-'
}
const bigRank = computed(() => {
  const ranks = singleViewData.value?.ranks ?? []
  return returnRankText(ranks, 2)
})
const smallRank = computed(() => {
  const ranks = singleViewData.value?.ranks ?? []
  return returnRankText(ranks, 1)
})

const tabsListConfig = {
  [ADS_MANAGEMENT_TYPE.ALL]: [
    ADS_MANAGEMENT_TABS.ADS_COMBINATION,
    ADS_MANAGEMENT_TABS.ADS_ACTIVITY,
    ADS_MANAGEMENT_TABS.ADS_GROUP,
    ADS_MANAGEMENT_TABS.ADS_PLACEMENT,
    ADS_MANAGEMENT_TABS.ADS_PRODUCT,
    ADS_MANAGEMENT_TABS.ADS_ADVERTISEMENT,
    ADS_MANAGEMENT_TABS.ADS_TARGET,
    ADS_MANAGEMENT_TABS.ADS_NEGATIVE_TARGET,
    ADS_MANAGEMENT_TABS.SEARCH_TERM,
    ADS_MANAGEMENT_TABS.OPERATION_LOG,
  ],
  [ADS_MANAGEMENT_TYPE.SP]: [
    ADS_MANAGEMENT_TABS.ADS_ACTIVITY,
    ADS_MANAGEMENT_TABS.ADS_GROUP,
    ADS_MANAGEMENT_TABS.ADS_PLACEMENT,
    ADS_MANAGEMENT_TABS.ADS_PRODUCT,
    ADS_MANAGEMENT_TABS.ADS_TARGET,
    ADS_MANAGEMENT_TABS.ADS_NEGATIVE_TARGET,
    ADS_MANAGEMENT_TABS.SEARCH_TERM,
    ADS_MANAGEMENT_TABS.OPERATION_LOG,
  ],
  [ADS_MANAGEMENT_TYPE.SD]: [
    ADS_MANAGEMENT_TABS.ADS_ACTIVITY,
    ADS_MANAGEMENT_TABS.ADS_GROUP,
    ADS_MANAGEMENT_TABS.ADS_PRODUCT,
    ADS_MANAGEMENT_TABS.ADS_TARGET,
    ADS_MANAGEMENT_TABS.ADS_NEGATIVE_TARGET,
    ADS_MANAGEMENT_TABS.OPERATION_LOG,
  ],
  [ADS_MANAGEMENT_TYPE.SB]: [
    ADS_MANAGEMENT_TABS.ADS_ACTIVITY,
    ADS_MANAGEMENT_TABS.ADS_GROUP,
    ADS_MANAGEMENT_TABS.ADS_PLACEMENT,
    ADS_MANAGEMENT_TABS.ADS_ADVERTISEMENT,
    ADS_MANAGEMENT_TABS.ADS_TARGET,
    ADS_MANAGEMENT_TABS.ADS_NEGATIVE_TARGET,
    ADS_MANAGEMENT_TABS.SEARCH_TERM,
    ADS_MANAGEMENT_TABS.OPERATION_LOG,
  ],
}
const commonSearch = inject<ObjectAny>('commonSearch', () => ({}))
function createTabs(currentTabs: string[]) {
  const list = ADS_MANAGEMENT_TABS.getOptions()
  return currentTabs.reduce((res: { label: keyof enumAdsManagementTabs, value: CommonTabType }[], i) => {
    const item = list.find(item => item.value === i)
    if (item) {
      res.push(item)
    }
    return res
  }, [])
}
const type = computed(() => commonSearch?.type)
const tabsList = computed(() => {
  const currentType = type.value
  if (currentType && tabsListConfig[currentType]) {
    return createTabs(tabsListConfig[currentType])
  }
  return []
})
const storeKey = 'amazon_ads_management_active_tab'
const { getStore, setStore } = useUtils()
function initActiveTab() {
  const { activeTab: storeActiveTab } = getStore(storeKey)
  return tabsList.value.find((item: ObjectAny) => item.value === storeActiveTab)?.value ?? tabsList.value[0]?.value
}
const activeTab = ref(initActiveTab())
watch(activeTab, (newVal) => { getData(); setStore(storeKey, { activeTab: newVal }) })
watch(tabsList, () => activeTab.value = initActiveTab(), { deep: true })
provide<Ref<CommonTabType>>('commonTabType', activeTab)

const adsCombinationRef = useTemplateRef('adsCombinationRef')
const adsActivityRef = useTemplateRef('adsActivityRef')
async function getData() {
  try {
    await nextTick()
    adsCombinationRef.value?.init()
    adsActivityRef.value?.init()
  }
  catch (error) {
    console.error(error)
  }
}
defineExpose({ getData })
</script>
