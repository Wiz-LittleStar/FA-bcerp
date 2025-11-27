<template>
  <FaMarquee v-loading="loading" pause-on-hover>
    <FaDigitalCard v-for="item in indicatorList" :key="item.key" :title="item.title" class="w-fit cursor-pointer bg-gray-950/[.01] hover:bg-gray-950/[.05] dark:hover:bg-gray-50/[.15]">
      <template #digital>
        <div class="flex-center-start gap-4">
          <div>
            {{ item.value || 0 }}
            <span v-if="percentFields.includes(item.name)" class="text-4 c-#656d76 fw-500">%</span>
          </div>
          <el-tag v-if="avgFields.includes(item.name)" size="small" type="warning">
            平均
          </el-tag>
          <el-tag v-else size="small" type="primary">
            总计
          </el-tag>
        </div>
      </template>
      <template #description>
        <div class="flex-center-start gap-8">
          <div>环比</div>
          <div class="flex-center-start gap-2">
            <div>{{ item.ratioValue || 0 }}</div>
            <el-tag :type="trendType(item.rate) === 'up' ? 'danger' : trendType(item.rate) === 'down' ? 'success' : 'primary'">
              <FaIcon v-if="!!trendIcon(trendType(item.rate))" :name="trendIcon(trendType(item.rate))" />
              {{ Math.abs(item.rate) }}%
            </el-tag>
          </div>
        </div>
      </template>
    </FaDigitalCard>
  </FaMarquee>
</template>

<script setup lang="ts">
import { amazonAdsDashboardIndicators } from '@/api/modules/advertise/amazon'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const props = defineProps({
  showIndicatorKeys: {
    type: Array,
    default: () => [],
  },
})

const { request, loading } = useRequest()
const { percentFields, avgFields, handleQueryParams } = useAmazonAdsUtils()

const commonSearch = inject('commonSearch', () => ({}))

const indicatorData = ref<ObjectAny>({})
const indicatorList = computed(() => Object.entries(indicatorData.value).filter(([key, value]) => indicatorData.value[key] && (Array.isArray(props.showIndicatorKeys) && props.showIndicatorKeys.length ? props.showIndicatorKeys.includes(value?.name) : true)).map(([key, value]) => ({ ...value, key })))
function trendType(rate: number) {
  const value = Number(rate)
  if (value > 0) { return 'up' }
  if (value === 0) { return 'stable' }
  if (value < 0) { return 'down' }
  return ''
}
function trendIcon(trendType: string) {
  switch (trendType) {
    case 'up':
      return 'i-material-symbols:trending-up'
    case 'stable':
      return 'i-material-symbols:trending-flat'
    case 'down':
      return 'i-material-symbols:trending-down'
    default:
      return ''
  }
}
async function getData() {
  try {
    const tmp = {
      ...toRaw(commonSearch),
      ratioType: 1,
      timeRange: 'day',
      type: 'AllCampaign',
    }
    const { data } = await request(amazonAdsDashboardIndicators, handleQueryParams(tmp))
    indicatorData.value = isObject(data) ? data : {}
  }
  catch {
    indicatorData.value = {}
  }
}

defineExpose({ getData })
</script>
