<template>
  <div class="flex flex-col gap-4">
    <div class="flex-center-start gap-1">
      <div class="fw-bold">
        广告数据概览
      </div>
      <el-tooltip content="各维度数据汇总数据结果可能有小幅差异" placement="top-start">
        <FaIcon name="i-ep:question-filled" />
      </el-tooltip>
    </div>
    <div class="flex-center-between">
      <el-radio-group v-model="search.adsOverviewDimension" size="small" @change="getData(true)">
        <el-radio-button v-for="item in dimensionOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
      <div class="flex-center-start">
        <el-checkbox v-model="showRatioValue">
          显示环比值
        </el-checkbox>
        <el-checkbox v-model="showRatioChange">
          显示环比变化
        </el-checkbox>
      </div>
    </div>
    <el-table v-loading="loading" :data="dataList" :height="400" table-layout="auto" border @sort-change="onSortChange">
      <el-table-column :label="currentDimension?.label || ''">
        <template #default="{ row }">
          <div class="flex-center-start gap-2">
            <template v-if="currentDimension?.value === 2">
              <FaImagePreview :src="row.imageUrl ?? ''" class="size-8" />
              <CopyText v-model="row.parentAsin" truncated class="flex-w-auto" />
            </template>
            <template v-else-if="currentDimension?.value === 3">
              <FaImagePreview :src="row.imageUrl ?? ''" class="size-8" />
              <CopyText v-model="row.asin" truncated class="flex-w-auto" />
            </template>
            <template v-else-if="currentDimension?.value === 4">
              <FaImagePreview :src="row.imageUrl ?? ''" class="size-8" />
              <CopyText v-model="row.sellerSku" truncated class="flex-w-auto" />
            </template>
            <div v-else>
              {{ getDimensionValue(row) }}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-for="item in tableColumns" :key="item.prop" v-bind="item">
        <template v-if="ratioFields.includes(item.prop)" #default="{ row }">
          <RatioDisplay :options="{ field: item.prop, row, showRatioValue, showRatioChange, showTrendAnalysis: false }" />
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="search.pageNum" v-model:page-size="search.pageSize" :total="total" size="small" layout="->, total, sizes, prev, pager, next, jumper" @current-change="getData()" @size-change="getData()" />
  </div>
</template>

<script setup lang="ts">
import { amazonAdsDashboardQueryAdsOverview } from '@/api/modules/advertise/amazon'
import { ADS_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import RatioDisplay from '@/views/advertise/amazon/components/RatioDisplay.vue'

const dimensionOptions = [
  { value: 0, label: '国家', field: 'siteId' },
  { value: 1, label: '店铺', field: 'shopName' },
  { value: 2, label: '父ASIN', field: 'parentAsin', slot: true },
  { value: 3, label: 'ASIN', field: 'asin', slot: true },
  { value: 4, label: 'SKU', field: 'sellerSku' },
  { value: 5, label: '广告类型', field: 'adsType', formatter: (value: number) => ADS_TYPE.getLabelByValue(value) },
  { value: 6, label: '广告位', field: 'placement' },
  { value: 7, label: '日期', field: 'date' },
]

const storeKey = 'amazon_ads_dashboard_data_overview'
const { getStore, setStore } = useUtils()
const { adsOverviewDimension: storeAdsOverviewDimension, showRatioValue: storeShowRatioValue, showRatioChange: storeShowRatioChange } = getStore(storeKey)
const search = reactive({
  adsOverviewDimension: storeAdsOverviewDimension ?? dimensionOptions[0].value,
  pageNum: 1,
  pageSize: 20,
})
const showRatioValue = ref(storeShowRatioValue ?? true)
const showRatioChange = ref(storeShowRatioChange ?? true)
function saveRadioState() {
  setStore(storeKey, { adsOverviewDimension: search.adsOverviewDimension, showRatioValue: showRatioValue.value, showRatioChange: showRatioChange.value })
}
watch([() => () => search.adsOverviewDimension, showRatioValue, showRatioChange], () => {
  saveRadioState()
}, { deep: true })

const { request, loading } = useRequest()
const { handleQueryParams, ratioFields } = useAmazonAdsUtils()
const commonSearch = inject('commonSearch', () => ({}))
const queryParams = computed(() => ({
  ...toRaw(commonSearch),
  ...search,
}))
const dataList = ref<ObjectAny[]>([])
const total = ref(0)
async function getData(resetPage = false) {
  saveRadioState()
  try {
    if (resetPage) {
      search.pageNum = 1
    }
    const { data: { records = [], total: recordsTotal = 0 } = {} } = await request(amazonAdsDashboardQueryAdsOverview, handleQueryParams(queryParams.value))
    dataList.value = Array.isArray(records) ? records : []
    total.value = recordsTotal
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}
defineExpose({ getData })

const currentDimension = computed(() =>
  dimensionOptions.find(item => item.value === search.adsOverviewDimension),
)
function getDimensionValue(row: ObjectAny) {
  const dimension = currentDimension.value
  if (!dimension) {
    return ''
  }

  const value = row[dimension.field]
  return dimension.formatter ? dimension.formatter(value) : value
}

const tableColumns = [
  { prop: 'cost', label: '广告花费', sortable: true },
  { prop: 'sales', label: '广告总销售额', sortable: true },
  { prop: 'impressions', label: '曝光量', sortable: true },
  { prop: 'clicks', label: '点击量', sortable: true },
  { prop: 'ctr', label: 'CTR', sortable: true },
  { prop: 'cpc', label: 'CPC', sortable: true },
  { prop: 'purchases', label: '广告总订单量', sortable: true },
  { prop: 'cvr', label: 'CVR', sortable: true },
  { prop: 'cpa', label: 'CPA', sortable: true },
  { prop: 'acos', label: 'ACoS', sortable: true },
  { prop: 'acoas', label: 'ACoAS', sortable: true },
  { prop: 'asoas', label: 'ASoAS', sortable: true },
  { prop: 'roas', label: 'ROAS', sortable: true },
]

const { setSort } = useUtils()
function onSortChange({ prop, order }: { prop: string, order: string }) {
  setSort({ prop, order }, search)
  getData()
}
</script>
