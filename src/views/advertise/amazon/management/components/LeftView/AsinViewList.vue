<template>
  <vxe-grid ref="gridRef" :loading="loading" :data="dataList" v-bind="gridOptions" v-on="gridEvents">
    <template #productHeader>
      <div class="w-full flex-center-between">
        <div>{{ isMSkuView ? 'MSKU' : isAsinView ? 'ASIN' : '产品信息' }}</div>
        <DataFilter v-model="sort" @change="getData()" />
      </div>
    </template>
    <template #productInfo="{ row }">
      <div class="flex-center-start gap-2">
        <FaImagePreview :src="row.imageUrl ?? ''" class="size-8" />
        <div class="flex-w-auto">
          <CopyText v-if="isMSkuView" v-model="row.sku" truncated />
          <CopyText v-model="row.asin" truncated />
        </div>
      </div>
    </template>
  </vxe-grid>
</template>

<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { amazonSpProductAdsQueryLeftProduct, productSkuGet } from '@/api/modules/advertise/amazon'
import { ADS_VIEW_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import DataFilter from './DataFilter.vue'

const emit = defineEmits<{
  (e: 'setViewData', data: ObjectAny[], viewType?: number): void
}>()

const viewType = inject<Ref<number>>('viewType')
const isMSkuView = computed(() => [ADS_VIEW_TYPE.MSKU].includes(Number(viewType?.value)))
const isAsinView = computed(() => [ADS_VIEW_TYPE.ASIN].includes(Number(viewType?.value)))

const selectData = defineModel<ObjectAny[]>('select-data')
const gridRef = useTemplateRef('gridRef')
function selectHandler() {
  selectData.value?.splice(0, selectData.value?.length, ...[...gridRef.value!.getCheckboxRecords(), ...gridRef.value!.getCheckboxReserveRecords()])
}
function clearSelect() {
  gridRef.value!.clearCheckboxRow()
  gridRef.value!.clearCheckboxReserve()
  selectHandler()
}

const sort = reactive({})
const { request, loading } = useRequest()
const commonSearch = inject<ObjectAny>('commonSearch', () => ({}))
const viewSearch = inject<ObjectAny>('viewSearch', () => ({}))
const dataList = ref<ObjectAny[]>([])
const total = defineModel<number>('total')
const { handleQueryParams } = useAmazonAdsUtils()
async function getData() {
  try {
    const { adsType, shopIds, dateList, ratioDateList } = toRaw(commonSearch)
    const tmp = {
      ...toRaw(viewSearch),
      adsType,
      shopIds,
      dateList,
      ratioDateList,
      ...toRaw(sort),
    }
    const { data: { data: { records, total: recordsTotal } } } = await request(amazonSpProductAdsQueryLeftProduct, handleQueryParams(tmp))
    dataList.value = Array.isArray(records) ? records : []
    total.value = recordsTotal || 0
  }
  catch (error) {
    console.error(error)
    dataList.value = []
    total.value = 0
  }
}
defineExpose({ getData, clearSelect })

const gridOptions = reactive<VxeGridProps>({
  size: 'mini',
  height: 'auto',
  rowConfig: {
    isCurrent: true,
    isHover: true,
    keyField: 'sku',
  },
  columnConfig: {
    resizable: true,
  },
  checkboxConfig: {
    strict: true,
    showHeader: true,
    highlight: true,
    reserve: true,
  },
  scrollY: {
    enabled: true,
    gt: 20,
  },
  columns: [
    { type: 'checkbox', width: 30 },
    { slots: { header: 'productHeader', default: 'productInfo' } },
  ],
})
const gridEvents = reactive<VxeGridListeners>({
  checkboxChange: selectHandler,
  checkboxAll: selectHandler,
  cellClick: async ({ row }) => {
    try {
      const { data } = await productSkuGet(row.productSkuId)()
      if (isObject(data) && data.id) {
        emit('setViewData', [data])
      }
      else {
        toast.error('请求数据失败请稍后重试')
      }
    }
    catch (error) {
      console.error(error)
      toast.error('操作失败')
    }
  },
})
</script>
