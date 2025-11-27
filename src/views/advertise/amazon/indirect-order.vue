<route lang="yaml">
meta:
  title: '广告间接订单'
  tabMerge: 'routeName'
</route>

<template>
  <div class="absolute size-full flex flex-col">
    <FaPageMain class="flex-h-auto" main-class="flex-h-auto flex flex-col gap-3">
      <FaSearchBar :show-toggle="false">
        <template #default>
          <el-form :model="search" size="small" inline-message inline>
            <el-form-item>
              <el-select v-model="search.shopIds" placeholder="店铺" class="w-50" multiple collapse-tags filterable clearable @change="getData()">
                <el-option v-for="item in amazonAdsShopList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="search.adsTypes" placeholder="广告类型" class="w-50" multiple collapse-tags filterable clearable @change="getData()">
                <el-option v-for="item in ADS_TYPE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input v-model="search.campaignName" placeholder="广告活动" clearable @keyup.enter="getData()" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="search.adGroupName" placeholder="广告组" clearable @keyup.enter="getData()" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="search.purchasedSku" placeholder="出单MSKU" clearable @keyup.enter="getData()" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="search.purchasedAsin" placeholder="出单ASIN" clearable @keyup.enter="getData()" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="search.advertisedSku" placeholder="广告MSKU" clearable @keyup.enter="getData()" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="search.advertisedAsin" placeholder="广告ASIN" clearable @keyup.enter="getData()" />
            </el-form-item>
            <el-form-item>
              <el-date-picker v-model="search.dateList" class="w-60" start-placeholder="日期" end-placeholder="日期" type="daterange" value-format="YYYY-MM-DD" @change="getData()" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="getData()">
                <template #icon>
                  <FaIcon name="i-ep:search" />
                </template>
                查询
              </el-button>
            </el-form-item>
          </el-form>
        </template>
      </FaSearchBar>
      <div class="flex-h-auto">
        <vxe-grid :loading="loading" :data="dataList" v-bind="gridOptions" v-on="gridEvents">
          <template #toolbarButtons>
            <div class="w-full flex-center-between pr-2">
              <el-radio-group v-model="search.isVariant" size="small" @change="getData()">
                <el-radio-button v-for="item in isVariantOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <template #advertisedAsin="{ row }">
            <div class="flex-center-start gap-2">
              <FaImagePreview :src="row.advertisedAsinImage" class="size-8" />
              <div class="flex-w-auto">
                <CopyText v-model="row.advertisedAsinTitle" truncated />
                <div class="align-center between flex gap-2">
                  <div class="flex-w-auto flex-center-start">
                    ASIN：<CopyText v-model="row.advertisedAsin" truncated class="flex-w-auto" />
                  </div>
                  <div class="flex-w-auto flex-center-start">
                    MSKU：<CopyText v-model="row.advertisedSku" truncated class="flex-w-auto" />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template #purchasedAsin="{ row }">
            <div class="flex-center-start gap-2">
              <FaImagePreview :src="row.purchasedSkuImage" class="size-8" />
              <div class="flex-w-auto">
                <CopyText v-model="row.purchasedSkuTitle" truncated />
                <div class="align-center between flex gap-2">
                  <div class="flex-w-auto flex-center-start">
                    ASIN：<CopyText v-model="row.purchasedAsin" truncated class="flex-w-auto" />
                  </div>
                  <div class="flex-w-auto flex-center-start">
                    MSKU：<CopyText v-model="row.purchasedSku" truncated class="flex-w-auto" />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template #campaignName="{ row }">
            <CopyText v-model="row.campaignName" class="cursor-pointer hover:c-blue" @click="showDetail(row, ADS_MANAGEMENT_TABS.ADS_ACTIVITY)" />
          </template>
          <template #adGroupName="{ row }">
            <CopyText v-model="row.adGroupName" class="cursor-pointer hover:c-blue" @click="showDetail(row, ADS_MANAGEMENT_TABS.ADS_GROUP)" />
          </template>
        </vxe-grid>
      </div>
      <el-pagination :current-page="pagination.pageNum" :total="pagination.total" size="small" :page-size="pagination.pageSize" :page-sizes="pagination.sizes" :layout="pagination.layout" :hide-on-single-page="false" background @size-change="getData()" @current-change="getData()" />
    </FaPageMain>
  </div>
</template>

<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from 'vxe-table'
import type { CommonTabType } from '@/utils/hooks/useAmazonAdsUtils'
import { isEqual } from 'es-toolkit'
import { amazonAdsPurchaseProductPage } from '@/api/modules/advertise/amazon'
import dayjs from '@/utils/dayjs'
import { ADS_MANAGEMENT_TABS, ADS_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const { ADS_TYPE_COMPONENT_MAP } = useAmazonAdsUtils()
const { setSort } = useUtils()

const isVariantOptions = [
  { label: '全部', value: undefined },
  { label: '变体', value: 1 },
  { label: '不同商品', value: 0 },
]

interface Search {
  shopIds: number[]
  adsTypes: string[]
  campaignName: string
  adGroupName: string
  purchasedSku: string
  purchasedAsin: string
  advertisedSku: string
  advertisedAsin: string
  dateList: string[]
  isVariant: number | undefined
}
const search = reactive<Partial<Search>>({})
const { request, loading } = useRequest()
const dataList = ref<ObjectAny[]>([])
const { pagination } = usePagination()
const queryParams = computed(() => {
  const { pageNum, pageSize } = pagination.value
  return {
    ...search,
    pageNum,
    pageSize,
  }
})
async function getData() {
  try {
    const { data: { records = [], total: recordsTotal } } = await request(amazonAdsPurchaseProductPage, queryParams.value)
    dataList.value = Array.isArray(records) ? records : []
    pagination.value.total = recordsTotal ?? 0
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}
const { amazonAdsShopList, getAmazonAdsShopList } = useShop()
onMounted(() => {
  getAmazonAdsShopList()
})

const gridOptions = reactive<VxeGridProps>({
  size: 'mini',
  height: 'auto',
  columnConfig: {
    resizable: true,
    minWidth: 'auto',
  },
  rowConfig: {
    isCurrent: true,
    isHover: true,
  },
  sortConfig: {
    remote: true,
  },
  scrollY: {
    enabled: true,
    gt: 20,
  },
  toolbarConfig: {
    custom: true,
    slots: {
      buttons: 'toolbarButtons',
    },
  },
  columns: [
    { field: 'advertisedAsin', title: '广告商品', width: 350, slots: { default: 'advertisedAsin' } },
    { field: 'shopName', title: '店铺' },
    { field: 'adsType', title: '广告类型', formatter: ({ cellValue }) => ADS_TYPE.getLabelByValue(cellValue) },
    { field: 'target', title: '投放', sortable: true },
    { field: 'matchType', title: '匹配方式', sortable: true },
    { field: 'purchasedAsin', title: '出单ASIN', width: 350, slots: { default: 'purchasedAsin' } },
    { field: 'purchaseAsinCount', title: '出单ASIN销量' },
    { field: 'purchaseAsinAmount', title: '出单ASIN销售额' },
    { field: 'campaignName', title: '广告活动', slots: { default: 'campaignName' } },
    { field: 'adGroupName', title: '广告组', slots: { default: 'adGroupName' } },
  ],
})
const gridEvents = reactive<VxeGridListeners>({
  sortChange: ({ field, order }) => {
    setSort({ prop: field, order }, search)
    getData()
  },
})

const router = useRouter()
function showDetail(row: ObjectAny, commonTabType: CommonTabType) {
  const { campaignId, adGroupId, adsType, shopId } = row
  const campaign = ADS_TYPE_COMPONENT_MAP[adsType]
  if (adsType && campaign) {
    router.push({ name: 'advertise-amazon-detail', params: { campaign }, query: { type: commonTabType, campaignId, adGroupId, adsType, shopId } })
  }
}

const route = useRoute()
watch(() => route.query, (newValue, oldValue) => {
  try {
    if (isEqual(newValue, oldValue)) {
      return
    }
    const { campaignName, adGroupName, shopId, adsType, dateList } = newValue
    if ((campaignName || adGroupName) && shopId && adsType && Array.isArray(dateList)) {
      Object.assign(search, { campaignName, adGroupName, shopIds: [Number(shopId)], adsTypes: [Number(adsType)], dateList: (dateList).map(item => dayjs(item).format('YYYY-MM-DD')) })
    }
  }
  catch (error) {
    console.error('🚀 ~ catchError~ error:', error)
  }
  finally {
    nextTick(() => {
      getData()
    })
  }
}, { immediate: true, deep: true })
</script>
