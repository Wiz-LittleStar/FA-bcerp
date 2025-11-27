<template>
  <div class="flex flex-col gap-4">
    <div class="flex-center-between gap-2">
      <div class="flex-center-start gap-1">
        <div class="fw-bold">
          广告销售额TOP20
        </div>
        <el-tooltip content="筛选范围内的广告销售额从高到低的的Top20排行，点击广告活动名称可以快速跳转到广告活动管理页面" placement="top-start">
          <FaIcon name="i-ep:question-filled" />
        </el-tooltip>
      </div>
      <el-radio-group v-model="search.dimension" size="small" @change="getData">
        <el-radio-button v-for="item in dimensionOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <el-table v-loading="loading" :data="dataList" :height="400" table-layout="auto" highlight-current-row border>
      <el-table-column label="排名" prop="salesRank" :width="80" />
      <el-table-column :label="dimensionOptions.find(item => item.value === search.dimension)?.label || ''">
        <template #default="{ row }">
          <DimensionDisplay :model-value="row" :dimension="search.dimension" />
        </template>
      </el-table-column>
      <el-table-column label="广告销售额" prop="totalSales">
        <template #default="{ row }">
          <div>{{ `${row.symbol ?? ''}${row.totalSales ?? 0}` }}</div>
        </template>
      </el-table-column>
      <el-table-column label="广告订单" prop="purchases" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { amazonAdsDashboardGetTopCampaignSales } from '@/api/modules/advertise/amazon'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import DimensionDisplay from './DimensionDisplay.vue'

const dimensionOptions = [
  { value: 0, label: '店铺' },
  { value: 1, label: '活动' },
  { value: 2, label: '商品' },
]

const storeKey = 'amazon_ads_dashboard_sales_t20'
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
async function getData() {
  saveRadioState()
  try {
    const { data = [] } = await request(amazonAdsDashboardGetTopCampaignSales, handleQueryParams(queryParams.value))
    dataList.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
  }
}
defineExpose({ getData })
</script>
