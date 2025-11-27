<template>
  <div ref="scrollContainer" class="size-full flex flex-col gap-2 of-y-auto">
    <Trend ref="trendRef" v-model="indicatorData" :options="{ type: commonTabType, storage: true, extSearch: queryParams, tabs: trendTabs }" />
    <FaDivider />
    <el-form size="small" inline-message inline>
      <el-form-item>
        <el-input v-model="search.name" placeholder="广告组合" clearable @change="setSession('name', $event)" @keyup.enter="getData()" />
      </el-form-item>
      <el-form-item>
        <el-select v-model="search.states" placeholder="服务状态" multiple collapse-tags filterable clearable class="w-50" @change="setSession('states', $event)">
          <el-option v-for="item in ADS_COMBINATION_STATE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getData()">
          <template #icon>
            <FaIcon name="i-ep:search" />
          </template>
          查询
        </el-button>
        <el-button @click="resetSearch()">
          <template #icon>
            <FaIcon name="i-ep:refresh" />
          </template>
          重置
        </el-button>
      </el-form-item>
    </el-form>
    <div class="min-h-full flex flex-col gap-2">
      <div class="flex-h-auto">
        <vxe-grid ref="gridRef" :loading="loading" :data="dataList" :columns="tableColumns" :footer-data="getSummaries(tableColumns)" v-bind="gridOptions" v-on="gridEvents">
          <template #toolbarButtons>
            <div class="w-full flex-center-between pr-2">
              <div class="flex-center-center">
                <el-button type="primary" size="small" @click="edit()">
                  <template #icon>
                    <FaIcon name="i-ep:plus" />
                  </template>
                  新增
                </el-button>
                <el-button size="small" @click="showDataExport()">
                  <template #icon>
                    <FaIcon name="i-ep:download" />
                  </template>
                  导出
                </el-button>
              </div>
              <div class="flex-center-center gap-2">
                <el-button size="small" @click="showGridHeaderController">
                  <template #icon>
                    <FaIcon name="i-ep:setting" />
                  </template>
                  表头配置
                </el-button>
                <el-checkbox v-model="showRatio">
                  显示对比
                </el-checkbox>
              </div>
            </div>
          </template>
          <template #portfolioName="{ row }">
            <div class="group flex-center-start gap-2">
              <div class="line-clamp-2 text-ellipsis ws-pre-wrap">
                {{ row.portfolioName }}
              </div>
              <el-button link size="small" class="hidden group-hover:block" @click="edit(row)">
                <FaIcon name="i-ep:edit" />
              </el-button>
            </div>
          </template>
          <template #budgetPolicy="{ row }">
            <div v-if="[ADS_COMBINATION_BUDGET_POLICY.DATE_RANGE, ADS_COMBINATION_BUDGET_POLICY.MONTHLY_RECURRING].includes(row.budgetPolicy)">
              {{ row.budgetAmount }} {{ row.budgetCurrencyCode }}
            </div>
            <div class="text-gray">
              {{ ADS_COMBINATION_BUDGET_POLICY.getLabelByValue(row.budgetPolicy) }}
            </div>
          </template>
          <template #servingStatus="{ row }">
            <el-tag :type="tagTypeMap.adsCombinationServingStatus[row.servingStatus]">
              {{ ADS_COMBINATION_STATE.getLabelByValue(row.servingStatus) }}
            </el-tag>
          </template>
          <template v-for="item in tableColumns" :key="item.field" #[item.slots!.header]>
            <span :style="{ color: getHeaderColor(item.field) }">
              {{ item.title }}
            </span>
          </template>
          <!-- 环比项 -->
          <template v-for="field in ratioFields" :key="field" #[field]="{ row }">
            <RatioDisplay :options="{ field, row, showRatio, trendExtSearch: generateTrendExtSearch(row) }" />
          </template>
          <template #operation="{ row }">
            <el-button type="primary" link size="small" @click="openTrendAnalysisDialog('', row, commonTabType, generateTrendExtSearch(row))">
              趋势
            </el-button>
          </template>
        </vxe-grid>
      </div>
      <el-pagination v-model:current-page="search.pageNum" v-model:page-size="search.pageSize" :total="total" size="small" layout="->, total, sizes, prev, pager, next, jumper" @current-change="getData()" @size-change="getData()" />
    </div>
    <GridHeaderController ref="gridHeaderControllerRef" storage-key="AdsCombination" :columns="tableColumns" />
    <DataExport ref="dataExportRef" />
    <Edit ref="editRef" @refresh="getData()" />
  </div>
</template>

<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps, VxeGridPropTypes } from 'vxe-table'
import type { CommonTabType } from '@/utils/hooks/useAmazonAdsUtils'
import { ADS_COMBINATION_BUDGET_POLICY, ADS_COMBINATION_STATE, ADS_STATE, ADS_TREND_TABS, DATA_EXPORT_REPORT_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import RatioDisplay from '@/views/advertise/amazon/components/RatioDisplay.vue'
import DataExport from '@/views/advertise/amazon/management/components/DataExport.vue'
import GridHeaderController from '@/views/advertise/amazon/management/components/GridHeaderController.vue'
import Trend from '@/views/advertise/amazon/management/components/Trend/index.vue'
import Edit from './Edit.vue'

const props = withDefaults(defineProps<{
  extSearch?: ObjectAny
}>(), {
  extSearch: () => ({}),
})
const { extSearch } = toRefs(props)

const commonSearch = inject<ObjectAny>('commonSearch', () => ({}))
const commonType = computed(() => commonSearch.type)
const commonTabType = inject<Ref<CommonTabType>>('commonTabType')

const trendTabs = [
  ADS_TREND_TABS.TREND,
  ADS_TREND_TABS.PERSPECTIVE,
  ADS_TREND_TABS.TARGET_STRUCTURE,
  ADS_TREND_TABS.ADS_STRUCTURE,
  ADS_TREND_TABS.ADS_PLACEMENT,
]
const { setSort } = useUtils()
const storeKey = 'amazon_ads_management_ads_combination_search'
const { indicatorData, tagTypeMap, initSearchWithSharing, refreshSearchWithSharing, getSortStorage, handleQueryParams, getListDataMethod, ratioFields, handleGridColumns, getSummaries, getFooterCellClass, openTrendAnalysisDialog, footerCellClick } = useAmazonAdsUtils()
const sortStorage = getSortStorage(storeKey)
function initSearch() {
  const { order, field: prop } = sortStorage
  const data = {
    timeRange: 'day',
    pageNum: 1,
    pageSize: 20,
  }
  setSort({ prop, order }, data)
  return initSearchWithSharing(data, storeKey, commonType?.value)
}
const search = reactive(initSearch())
function resetSearch() {
  Object.assign(search, initSearch())
}
function setSession(key: string, val: any) {
  refreshSearchWithSharing(key, val, storeKey, commonType?.value)
}

const { request, loading } = useRequest()
const queryParams = computed(() => handleQueryParams({
  ...extSearch.value,
  ...toRaw(commonSearch),
  ...handleQueryParams(search),
}))
const dataList = ref<ObjectAny[]>([])
const total = ref(0)
const trendRef = useTemplateRef('trendRef')
async function getData({ initTrend = true } = {}) {
  try {
    const { data: { data: { records, total: recordsTotal } } } = await request(getListDataMethod(commonTabType?.value), queryParams.value)
    dataList.value = Array.isArray(records) ? records : []
    total.value = recordsTotal ?? 0
  }
  catch (error) {
    console.error(error)
    dataList.value = []
  }
  finally {
    if (initTrend) {
      trendRef.value?.getData()
    }
  }
}

const selectData = ref<ObjectAny[]>([])
const gridRef = useTemplateRef('gridRef')
function clearSelect() {
  gridRef.value!.clearCheckboxRow()
  gridRef.value!.clearCheckboxReserve()
  selectData.value = []
}

const { scrollContainer, restoreScrollPosition } = useScroll('adsCombination')
function init(clear_select = true) {
  resetSearch()
  trendRef.value?.getData()
  getData({ initTrend: false }).then(() => {
    // 数据加载完成后恢复滚动位置
    restoreScrollPosition()
  })
  if (clear_select) {
    clearSelect()
  }
}
defineExpose({ init })

const showRatio = ref(false)

function generateTrendExtSearch(row: ObjectAny) {
  const { portfolioId } = row
  return {
    ...queryParams.value,
    portfolioId,
    portfolioIds: [portfolioId],
  }
}

const gridHeaderControllerRef = useTemplateRef('gridHeaderControllerRef')
function showGridHeaderController() {
  gridHeaderControllerRef.value?.show()
}
function getHeaderColor(field?: string) {
  return gridHeaderControllerRef.value?.getColumnColor(field)
}
const tableColumns = reactive<VxeGridPropTypes.Columns>(handleGridColumns([
  { type: 'checkbox', width: 30, fixed: 'left' },
  { field: 'portfolioName', title: '广告组合', width: 180, fixed: 'left', slots: { default: 'portfolioName' } },
  { field: 'servingStatus', title: '服务状态', slots: { default: 'servingStatus' } },
  { field: 'shopName', title: '店铺' },
  { field: 'budgetPolicy', title: '预算上限', slots: { default: 'budgetPolicy' } },
  { field: 'impressions', title: '曝光量', sortable: true },
  { field: 'clicks', title: '点击量', sortable: true },
  { field: 'ctr', title: 'CTR', sortable: true, titleSuffix: { content: '广告点击转化率=点击量/曝光量' } },
  { field: 'cost', title: '广告花费', sortable: true, titleSuffix: { content: '花费=单次点击价格总和' } },
  { field: 'cpc', title: 'CPC', sortable: true, titleSuffix: { content: '平均单次点击价格=花费/点击量，因每次点击费用都不相同，取平均值' } },
  { field: 'sales', title: '广告总销售额', sortable: true },
  { field: 'acos', title: 'AcoS', sortable: true },
  { field: 'roas', title: 'ROAS', sortable: true },
  { field: 'purchases', title: '广告总订单量', sortable: true, titleSuffix: { content: '广告带来的订单量总和，包括广告商品订单数量和其他商品订单数量。付款失败的订单数量和72小时内取消的订单数量将从订单总量中删除' } },
  { field: 'indirectOrderCountRate', title: '间接成交订单比', sortable: true, titleSuffix: { content: '间接成交订单占广告总订单的百分比；即间接成交订单量/广告总订单量*100%' } },
  { field: 'cvr', title: 'CVR', sortable: true, titleSuffix: { content: '广告转化率=广告总订单量/点击量' } },
  { field: 'cpa', title: 'CPA', sortable: true, titleSuffix: { content: '单位订单平均广告花费=花费/广告总订单量' } },
  { field: 'unitsSold', title: '广告总销量', sortable: true, titleSuffix: { content: '广告带来的订单中商品的销量总和，包括广告商品直接出单的销量和有广告带来的间接出单销量。付款失败的订单数量和72小时内取消的订单中的商品销量将会从销量中删除SP+SD广告支持该指标，SB广告中，SBV和亚马逊支持SB multi-ad group（多广告组）后创建的广告都暂不支持该指标' } },
  { field: 'operation', title: '操作', fixed: 'right', slots: { default: 'operation' } },
]))
function checkMethodHandler({ row }: ObjectAny) {
  return row.state !== ADS_STATE.ARCHIVED
}
const gridOptions = reactive<VxeGridProps>({
  id: 'adsCombinationGrid',
  size: 'mini',
  height: 'auto',
  columnConfig: {
    resizable: true,
    minWidth: 'auto',
  },
  rowConfig: {
    isCurrent: true,
    isHover: true,
    keyField: 'portfolioId',
  },
  checkboxConfig: {
    reserve: true,
    highlight: true,
    checkMethod: checkMethodHandler,
  },
  showFooter: true,
  footerCellClassName: getFooterCellClass,
  sortConfig: {
    remote: true,
    defaultSort: sortStorage,
  },
  toolbarConfig: {
    custom: true,
    slots: {
      buttons: 'toolbarButtons',
    },
  },
  customConfig: { storage: true },
  scrollY: {
    enabled: true,
    gt: 20,
  },
})
function selectHandler() {
  selectData.value = [...gridRef.value!.getCheckboxRecords(), ...gridRef.value!.getCheckboxReserveRecords()]
}
const gridEvents = reactive<VxeGridListeners>({
  sortChange: ({ field, order }) => {
    setSort({ prop: field, order }, search)
    getData()
  },
  checkboxChange: selectHandler,
  checkboxAll: selectHandler,
  footerCellClick: e => footerCellClick(e, commonTabType?.value),
})

const editRef = useTemplateRef('editRef')
function edit(row?: ObjectAny) {
  editRef.value?.show(row)
}
const dataExportRef = useTemplateRef('dataExportRef')
function showDataExport() {
  dataExportRef.value?.show({ reportType: DATA_EXPORT_REPORT_TYPE.AD_COMBINATION, columns: gridRef.value!.getFullColumns(), queryParams: queryParams.value })
}
</script>
