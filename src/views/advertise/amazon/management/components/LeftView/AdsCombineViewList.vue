<template>
  <vxe-grid ref="gridRef" :loading="loading" :data="dataList" v-bind="gridOptions" v-on="gridEvents">
    <template #productHeader>
      <div class="w-full flex-center-between">
        <div>广告组合</div>
        <DataFilter v-model="sort" @change="getData()" />
      </div>
    </template>
    <template #productInfo="{ row }">
      <div class="flex-center-between gap-2">
        <div class="group flex-w-auto flex-center-start gap-2">
          <el-tooltip v-if="row.campaignId" :content="ADS_CAMPAIGN_SERVING_STATUS.getLabelByValue(row.servingStatus)" placement="top-start">
            <div class="size-2 rounded-full" :class="row.servingStatus === ADS_CAMPAIGN_SERVING_STATUS.CAMPAIGN_STATUS_ENABLED ? 'bg-green' : 'bg-gray'" />
          </el-tooltip>
          <div class="flex-w-auto truncate">
            {{ row.name }}
          </div>
          <div class="hidden items-center gap-1 group-hover:flex">
            <FaIcon name="i-ep:copy-document" class="cursor-pointer hover:c-blue" @click.stop="copy(row.name)" />
            <FaIcon v-if="!row.campaignId" name="i-ep:edit" class="cursor-pointer" @click.stop="edit(row)" />
          </div>
          <div v-if="!row.campaignId && row.campaignPageVOS?.length">
            ({{ row.campaignPageVOS?.length }})
          </div>
        </div>
      </div>
    </template>
  </vxe-grid>
  <AdsCombinationEdit ref="adsCombineEditRef" init @refresh="getData()" />
</template>

<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from 'vxe-table'
import { useClipboard } from '@vueuse/core'
import { amazonAdsPortfoliosPage } from '@/api/modules/advertise/amazon'
import { ADS_CAMPAIGN_SERVING_STATUS, ADS_VIEW_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import AdsCombinationEdit from '@/views/advertise/amazon/management/components/AdsCombination/Edit.vue'
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
    const { data: { records, total: recordsTotal } } = await request(amazonAdsPortfoliosPage, handleQueryParams(tmp))
    dataList.value = Array.isArray(records) ? records.map(item => ({ ...item, _id: item.portfolioId, campaignPageVOS: item.campaignPageVOS?.map((i: ObjectAny) => ({ ...i, _id: i.campaignId })) ?? [] })) : []
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
  return !row.campaignId
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
    rowField: '_id',
    childrenField: 'campaignPageVOS',
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
  cellClick: ({ row }) => {
    emit('setViewData', [row], row.campaignId ? ADS_VIEW_TYPE.ADS_ACTIVITT : undefined)
  },
})
const { copy, copied, isSupported } = useClipboard()
watchEffect(() => {
  if (copied.value) {
    toast.success('提示', {
      description: '复制成功',
    })
  }
  if (!isSupported.value) {
    toast.error('提示', {
      description: '不支持复制',
    })
  }
})
const adsCombineEditRef = useTemplateRef('adsCombineEditRef')
function edit(row: ObjectAny) {
  adsCombineEditRef.value?.show(row)
}
</script>
