<template>
  <div class="flex flex-col gap-4">
    <div class="flex-center-start gap-1">
      <div class="fw-bold">
        投放广告分布
      </div>
      <el-tooltip content="筛选范围内的广告的最新分布情况，和选择的时间段无关，仅统计'进行中'的广告活动、广告组、广告商品及投放的数量" placement="top-start">
        <FaIcon name="i-ep:question-filled" />
      </el-tooltip>
    </div>
    <el-table v-loading="loading" :data="dataList" :height="400" table-layout="auto" border>
      <el-table-column label="广告分布" prop="name" />
      <el-table-column label="合计" prop="total">
        <template #default="{ row }">
          <div>{{ `${row.currency ?? ''}${row.total}` }}</div>
        </template>
      </el-table-column>
      <el-table-column label="商品广告" prop="spCount">
        <template #default="{ row }">
          <div>{{ `${row.currency ?? ''}${row.spCount}` }}</div>
        </template>
      </el-table-column>
      <el-table-column label="展示广告" prop="sdCount">
        <template #default="{ row }">
          <div>{{ `${row.currency ?? ''}${row.sdCount}` }}</div>
        </template>
      </el-table-column>
      <el-table-column label="品牌广告" prop="sbCount">
        <template #default="{ row }">
          <div>{{ `${row.currency ?? ''}${row.sbCount}` }}</div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { amazonAdsDashboardQueryDashboardDistribution } from '@/api/modules/advertise/amazon'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const { request, loading } = useRequest()
const { handleQueryParams } = useAmazonAdsUtils()
const commonSearch = inject('commonSearch', () => ({}))
const queryParams = computed(() => ({
  ...toRaw(commonSearch),
}))
const dataList = ref<ObjectAny[]>([])
async function getData() {
  try {
    const { data = [] } = await request(amazonAdsDashboardQueryDashboardDistribution, handleQueryParams(queryParams.value))
    dataList.value = Array.isArray(data) ? data : []
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
}
defineExpose({ getData })
</script>
