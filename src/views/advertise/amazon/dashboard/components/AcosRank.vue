<template>
  <div class="flex flex-col gap-4">
    <div class="flex-center-between gap-2">
      <el-radio-group v-model="type" size="small">
        <el-radio-button v-for="item in typeOptions" :key="item.value" :label="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
      <el-radio-group v-model="search.dimension" size="small" @change="getData">
        <el-radio-button v-for="item in dimensionOptions" :key="item.value" :label="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <el-table ref="tableRef" v-loading="loading" :data="dataList" :height="400" :default-sort="initDefaultSort()" table-layout="auto" highlight-current-row border @sort-change="onSortChange">
      <el-table-column label="排名" prop="rank" :width="80" />
      <el-table-column :label="dimensionOptions.find(item => item.value === search.dimension)?.label || ''">
        <template #default="{ row }">
          <DimensionDisplay :model-value="row" :dimension="search.dimension" />
        </template>
      </el-table-column>
      <el-table-column label="广告花费" prop="cost">
        <template #default="{ row }">
          <div>{{ `${row.symbol}${row.cost}` }}</div>
        </template>
      </el-table-column>
      <el-table-column label="广告销售额" prop="sales">
        <template #default="{ row }">
          <div>{{ `${row.symbol}${row.sales}` }}</div>
        </template>
      </el-table-column>
      <el-table-column v-if="isAcos" label="ACoS" prop="acos" sortable />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { amazonAdsDashboardGetAcosRank } from '@/api/modules/advertise/amazon'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import DimensionDisplay from './DimensionDisplay.vue'

const typeOptions = [
  { value: 0, label: 'ACoS排行' },
]

const dimensionOptions = [
  { value: 0, label: '店铺' },
  { value: 1, label: '活动' },
  { value: 2, label: '商品' },
  { value: 3, label: '投放' },
]

const storeKey = 'amazon_ads_dashboard_acos_rank'
const { getStore, setStore } = useUtils()
const { type: storeType, dimension: storeDimension } = getStore(storeKey)
const type = ref(storeType ?? typeOptions[0].value)
const isAcos = computed(() => type.value === 0)
const search = reactive({ dimension: storeDimension ?? dimensionOptions[0].value, order: 1 })
function saveRadioState() {
  setStore(storeKey, { type: type.value, dimension: search.dimension })
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
    const api = isAcos.value ? amazonAdsDashboardGetAcosRank : undefined
    if (!api) {
      throw new Error('Invalid type')
    }
    const { data = [] } = await request(api, handleQueryParams(queryParams.value))
    dataList.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
  }
}
defineExpose({ getData })

function initDefaultSort(): { prop: string, order: 'descending' | 'ascending' } {
  return { prop: isAcos.value ? 'acos' : '', order: 'descending' }
}
const { setSort } = useUtils()
function onSortChange({ prop, order }: { prop: string, order: string }) {
  setSort({ prop, order }, search)
  getData()
}
const tableRef = useTemplateRef('tableRef')
watch(type, () => {
  const { prop, order } = initDefaultSort()
  nextTick(() => tableRef.value?.sort(prop, order))
})
</script>
