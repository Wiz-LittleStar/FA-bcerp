<template>
  <vxe-grid ref="gridRef" :loading="loading" :data="dataList" v-bind="gridOptions" v-on="gridEvents">
    <template #productHeader>
      <div class="w-full flex-center-between">
        <div>父ASIN</div>
        <DataFilter v-model="sort" @change="getData()" />
      </div>
    </template>
    <template #productInfo="{ row }">
      <div class="flex-center-start gap-2">
        <FaImagePreview :src="row.imageUrl ?? ''" class="size-8" />
        <div class="flex-w-auto">
          <CopyText v-model="row.asin" truncated />
        </div>
      </div>
    </template>
  </vxe-grid>
</template>

<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { amazonSpProductAdsPageParentAsin, productSkuGet, productSkuSelectParentAsinInfo } from '@/api/modules/advertise/amazon'
import { ADS_VIEW_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import DataFilter from './DataFilter.vue'

const emit = defineEmits<{
  (e: 'setViewData', data: ObjectAny[], viewType?: number): void
}>()

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
    const { data: { records, total: recordsTotal } } = await request(amazonSpProductAdsPageParentAsin, handleQueryParams(tmp))
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

function selectMethod({ row }: { row: ObjectAny }) {
  return !!row.isParent
}
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
  treeConfig: {
    rowField: 'id',
    childrenField: 'asins',
  },
  checkboxConfig: {
    checkStrictly: true,
    showHeader: true,
    highlight: true,
    reserve: true,
    visibleMethod: selectMethod,
    checkMethod: selectMethod,
  },
  scrollY: {
    enabled: true,
    gt: 20,
  },
  columns: [
    { type: 'checkbox', width: 50, treeNode: true },
    { slots: { header: 'productHeader', default: 'productInfo' } },
  ],
})
const gridEvents = reactive<VxeGridListeners>({
  checkboxChange: selectHandler,
  checkboxAll: selectHandler,
  cellClick: async ({ row }) => {
    try {
      const { isParent, asin, shopId } = row
      if (isParent) {
        const { data } = await productSkuSelectParentAsinInfo({
          parentAsin: asin,
          shopId,
        })
        if (isObject(data)) {
          emit('setViewData', [data])
        }
        else { toast.error('无法查到对应数据') }
      }
      else {
        const { data } = await productSkuGet(row.id)()
        if (isObject(data)) {
          emit('setViewData', [data], ADS_VIEW_TYPE.ASIN)
        }
        else { toast.error('无法查到对应数据') }
      }
    }
    catch (error) {
      console.error(error)
      toast.error('操作失败')
    }
  },
})
</script>
