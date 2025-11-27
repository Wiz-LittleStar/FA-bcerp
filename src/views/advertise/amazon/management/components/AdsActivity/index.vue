<template>
  <div ref="scrollContainer" class="size-full flex flex-col gap-2 of-y-auto">
    <Trend ref="trendRef" v-model="indicatorData" :options="{ type: commonTabType, storage: true, extSearch: queryParams, tabs: trendTabs }" />
    <FaDivider />
    <el-form size="small" inline-message inline>
      <el-form-item>
        <el-select v-model="search.portfolioIds" placeholder="广告组合" multiple collapse-tags filterable clearable class="w-50" @change="setSession('portfolioIds', $event); getData()">
          <el-option v-for="item in adsCombinationList" :key="item.portfolioId" :label="item.name" :value="item.portfolioId" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="search.campaignName" placeholder="广告活动" clearable @change="setSession('campaignName', $event)" @keyup.enter="getData()" />
      </el-form-item>
      <el-form-item>
        <el-select v-model="search.states" placeholder="有效状态" multiple collapse-tags filterable clearable class="w-50" @change="setSession('states', $event); getData()">
          <el-option v-for="item in ADS_STATE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="search.targetTypes" placeholder="投放类型" multiple collapse-tags filterable clearable class="w-50" @change="setSession('targetTypes', $event); getData()">
          <el-option v-for="item in ADS_TARGET_TYPE.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-cascader
          v-model="search.adsDetailTypes" placeholder="广告类型" :props="{ multiple: true, expandTrigger: 'hover', emitPath: false }" :options=" [
            { value: 'commodity', label: '商品广告', children: [{ value: 'MANUAL', label: '手动' }, { value: 'AUTO', label: '自动' }] },
          ]" collapse-tags filterable clearable @change="setSession('adsDetailTypes', $event); getData()"
        />
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
        <vxe-grid ref="gridRef" :loading="loading || updateStateLoading || batchChangeStateLoading" :data="dataList" :columns="tableColumns" :footer-data="getSummaries(tableColumns, { extraData: { totalBudget } })" v-bind="gridOptions" v-on="gridEvents">
          <template #toolbarButtons>
            <div class="w-full flex-center-between pr-2">
              <div class="flex-center-center">
                <el-button type="primary" size="small" @click="operateHandler('add')">
                  <template #icon>
                    <FaIcon name="i-ep:plus" />
                  </template>
                  新增广告活动
                </el-button>
                <el-button type="primary" plain size="small" @click="operateHandler('adjustBudget')">
                  <template #icon>
                    <FaIcon name="i-ep:edit" />
                  </template>
                  调整预算
                </el-button>
                <FaDropdown :items="batchChangeStateOptions">
                  <el-button type="primary" plain size="small">
                    <template #icon>
                      <FaIcon name="i-ep:edit" />
                    </template>
                    修改状态
                    <FaIcon name="i-ep:arrow-down" />
                  </el-button>
                </FaDropdown>
                <FaDropdown :items="setTimeSharingOptions">
                  <el-button type="primary" plain size="small">
                    <template #icon>
                      <FaIcon name="i-ep:edit" />
                    </template>
                    设置分时
                    <FaIcon name="i-ep:arrow-down" />
                  </el-button>
                </FaDropdown>
                <FaDropdown :items="otherOperationOptions">
                  <el-button type="primary" plain size="small">
                    <template #icon>
                      <FaIcon name="i-ep:edit" />
                    </template>
                    其它操作
                    <FaIcon name="i-ep:arrow-down" />
                  </el-button>
                </FaDropdown>
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
          <template v-for="item in tableColumns" :key="item.field" #[item.slots!.header]>
            <span :style="{ color: getHeaderColor(item.field) }">
              {{ item.title }}
            </span>
          </template>
          <template #state="{ row }">
            <div>
              <el-switch v-if="row.state !== ADS_STATE.ARCHIVED" v-model="row.state" :active-value="ADS_STATE.ENABLED" :inactive-value="ADS_STATE.PAUSED" @change="changeState(row)" />
              <el-tag v-else>
                {{ ADS_AVAILABLE_STATE.getLabelByValue(row.state) }}
              </el-tag>
            </div>
          </template>
          <template #name="{ row }">
            <div class="group w-60 flex-center-start gap-1">
              <div class="line-clamp-2 flex-w-auto cursor-pointer text-ellipsis ws-pre-wrap hover:c-blue" @click="showDetail(row)">
                {{ row.name }}
              </div>
              <div class="flex-center-start gap-1 op-0 transition-opacity duration-300 group-hover:op-100">
                <FaIcon name="i-ep:edit" class="cursor-pointer hover:c-blue" />
                <FaIcon name="i-ep:copy-document" class="cursor-pointer hover:c-blue" @click="copy(row.name)" />
                <FaIcon name="i-ep:link" class="cursor-pointer hover:c-blue" @click="showDetail(row, true)" />
              </div>
            </div>
            <el-tooltip v-if="row.optimizationCampaignVO?.id" placement="top-start" :content="row.optimizationCampaignVO?.strategyName">
              <el-tag size="small">
                规则优化
              </el-tag>
            </el-tooltip>
          </template>
          <template #servingStatus="{ row }">
            <el-tag v-if="row.servingStatus">
              {{ ADS_CAMPAIGN_SERVING_STATUS.getLabelByValue(row.servingStatus) }}
            </el-tag>
            <span v-else>-</span>
            <div v-if="row.campaignOutOfBudgetDate" class="text-red">
              {{ dayjs(row.campaignOutOfBudgetDate).format('HH:mm') }}超出预算
            </div>
          </template>
          <template #baseBudget="{ row }">
            <div class="group flex-center-start gap-1">
              <span>{{ row.baseBudget ? `$${row.baseBudget}/日` : '-'
              }}</span>
              <div class="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <el-button link size="small" @click="showBaseBudgetEdit(row)">
                  <template #icon>
                    <FaIcon name="i-ep:edit" />
                  </template>
                </el-button>
              </div>
            </div>
          </template>
          <template #budget="{ row }">
            <div class="flex flex-col gap-1">
              <div class="group flex-center-start gap-1">
                <span class="cursor-pointer hover:c-blue" @click="showBudgetAnalysis(row)">{{ row.budget ? `$${row.budget}/日` : '-'
                }}</span>
                <div v-if="row.state !== ADS_STATE.ARCHIVED" class="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <el-button link size="small" @click="showBudgetEdit(row)">
                    <template #icon>
                      <FaIcon name="i-ep:edit" />
                    </template>
                  </el-button>
                </div>
              </div>
              <TimeSharingStrategyTag :data="row" :adjust-type="adjustType" :in-advance-value="row.budget" />
            </div>
          </template>
          <template #remainingBudget="{ row }">
            <RemainBudgetDisplay :data="row" />
          </template>
          <template #targetingType="{ row }">
            <div>{{ ADS_TYPE.getLabelByValue(row.type) }}</div>
            <div class="text-gray">
              {{ TARGETING_TYPE.getLabelByValue(row.targetingType) }}
            </div>
          </template>
          <!-- 环比项 -->
          <template v-for="field in ratioFields" :key="field" #[field]="{ row }">
            <RatioDisplay :options="{ field, row, showRatio, trendExtSearch: generateTrendExtSearch(row) }">
              <template v-if="field === 'indirectOrderCountRate'" #value-append="{ value }">
                <FaIcon v-if="value" name="i-ep:view" class="cursor-pointer hover:c-blue" @click="showIndirectOrderDetail(row)" />
              </template>
            </RatioDisplay>
          </template>
          <template #operation="{ row }">
            <el-button type="primary" link size="small" @click="openTrendAnalysisDialog('', row, commonTabType, generateTrendExtSearch(row))">
              趋势
            </el-button>
            <FaDropdown :items="operationOptions(row)" />
          </template>
        </vxe-grid>
      </div>
      <el-pagination v-model:current-page="search.pageNum" v-model:page-size="search.pageSize" :total="total" size="small" layout="->, total, sizes, prev, pager, next, jumper" @current-change="getData()" @size-change="getData()" />
    </div>
    <GridHeaderController ref="gridHeaderControllerRef" storage-key="AdsActivity" :columns="tableColumns" />
    <DataExport ref="dataExportRef" />
  </div>
  <BaseBudgetEdit ref="baseBudgetEditRef" @refresh="getData()" />
  <BudgetEdit ref="budgetEditRef" @refresh="getData()" />
  <BudgetAnalysis ref="budgetAnalysisRef" />
  <CommonTypeSelector ref="commonTypeSelectorRef" title="新增广告活动" @change="operateHandler('add', ADS_TYPE_COMPONENT_MAP[$event])" />
  <BudgetBatchEdit ref="budgetBatchEditRef" @refresh="getData()" />
  <TimeSharingStrategy ref="timeSharingStrategyRef" @refresh="getData()" />
  <TimeSharingStrategyRemove ref="timeSharingStrategyRemoveRef" :include="enableTimeSharingStrategyType" @refresh="getData()" />
</template>

<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps, VxeGridPropTypes } from 'vxe-table'
import type { AdjustType, CommonTabType } from '@/utils/hooks/useAmazonAdsUtils'
import { useClipboard } from '@vueuse/core'
import dayjs from '@/utils/dayjs'
import { ADS_AVAILABLE_STATE, ADS_CAMPAIGN_SERVING_STATUS, ADS_MANAGEMENT_TABS, ADS_MANAGEMENT_TYPE, ADS_STATE, ADS_TARGET_TYPE, ADS_TREND_TABS, ADS_TYPE, DATA_EXPORT_REPORT_TYPE, TARGETING_TYPE, TIME_SHARING_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import BudgetAnalysis from '@/views/advertise/amazon/components/BudgetAnalysis/index.vue'
import CommonTypeSelector from '@/views/advertise/amazon/components/CommonTypeSelector.vue'
import RatioDisplay from '@/views/advertise/amazon/components/RatioDisplay.vue'
import RemainBudgetDisplay from '@/views/advertise/amazon/components/RemainBudgetDisplay.vue'
import DataExport from '@/views/advertise/amazon/management/components/DataExport.vue'
import GridHeaderController from '@/views/advertise/amazon/management/components/GridHeaderController.vue'
import TimeSharingStrategy from '@/views/advertise/amazon/management/components/TimeSharingStrategy/index.vue'
import TimeSharingStrategyRemove from '@/views/advertise/amazon/management/components/TimeSharingStrategy/StrategyRemove.vue'
import TimeSharingStrategyTag from '@/views/advertise/amazon/management/components/TimeSharingStrategy/Tag.vue'
import Trend from '@/views/advertise/amazon/management/components/Trend/index.vue'
import BaseBudgetEdit from './BaseBudgetEdit.vue'
import BudgetBatchEdit from './BudgetBatchEdit.vue'
import BudgetEdit from './BudgetEdit.vue'

const props = withDefaults(defineProps<{
  extSearch?: ObjectAny
}>(), {
  extSearch: () => ({}),
})
const { extSearch } = toRefs(props)

const commonSearch = inject<ObjectAny>('commonSearch', () => ({}))
const commonType = computed(() => commonSearch.type)
const commonTabType = inject<Ref<CommonTabType>>('commonTabType')

const trendTabs = computed(() => [
  ADS_TREND_TABS.TREND,
  ADS_TREND_TABS.PERSPECTIVE,
  ADS_TREND_TABS.TARGET_STRUCTURE,
  ADS_TREND_TABS.ADS_STRUCTURE,
  ...([ADS_MANAGEMENT_TYPE.ALL, ADS_MANAGEMENT_TYPE.SP].includes(commonType?.value) ? [ADS_TREND_TABS.ADS_PLACEMENT] : []),
])

const { setSort } = useUtils()
const storeKey = 'amazon_ads_management_ads_activity_search'
const { ADS_TYPE_COMPONENT_MAP, indicatorData, initSearchWithSharing, refreshSearchWithSharing, getSortStorage, handleQueryParams, getListDataMethod, getUpdateStateMethod, getDeleteArchivedMethod, ratioFields, handleGridColumns, getSummaries, getFooterCellClass, openTrendAnalysisDialog, footerCellClick, adsCombinationList, getAdsCombinationList, getEnableTimeSharingStrategyType, getAdsLevelType } = useAmazonAdsUtils()
const sortStorage = getSortStorage(storeKey)
function initSearch() {
  const { order, field: prop } = sortStorage
  const data = {
    states: [ADS_STATE.ENABLED],
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
const totalBudget = ref(0)
const trendRef = useTemplateRef('trendRef')
async function getData({ initTrend = true } = {}) {
  try {
    const { data: { data: { records, total: recordsTotal }, totalBudget: recordsTotalBudget } } = await request(getListDataMethod(commonTabType?.value), queryParams.value)
    dataList.value = Array.isArray(records) ? records : []
    total.value = recordsTotal ?? 0
    totalBudget.value = recordsTotalBudget ?? 0
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

const { scrollContainer, restoreScrollPosition } = useScroll('adsActivity')
function init(clear_select = true) {
  resetSearch()
  getAdsCombinationList(commonSearch.shopIds)
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
  const { campaignId } = row
  return {
    ...queryParams.value,
    campaignId,
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
  { type: 'seq', width: 50, fixed: 'left' },
  { field: 'state', title: '有效', fixed: 'left', slots: { default: 'state' } },
  { field: 'name', title: '广告活动', fixed: 'left', slots: { default: 'name' } },
  { field: 'servingStatus', title: '状态', slots: { default: 'servingStatus' } },
  { field: 'baseBudget', title: '基准预算', sortable: true, slots: { default: 'baseBudget' } },
  { field: 'budget', title: '预算', sortable: true, slots: { default: 'budget' } },
  { field: 'remainingBudget', title: '预算剩余', slots: { default: 'remainingBudget' } },
  { field: 'shopName', title: '店铺' },
  { field: 'targetingType', title: '广告类型', slots: { default: 'targetingType' } },
  { field: 'impressions', title: '曝光量', sortable: true },
  { field: 'topOfSearchImpressionShare', title: '搜索结果首页顶部IS', sortable: true, titleSuffix: { content: `指搜索结果首页顶部展示量份额(IS)，广告活动（关键词）获得的搜索结果顶部曝光量占其获得的所有符合曝光条件的搜索结果顶部曝光量的百分比。\n符合条件与否由各种因素所决定，包括广告活动状态和展示状态；该指标适用于品牌推广活动和商品推广活动；对于商品推广，该指标提供了搜索结果顶部（首页）的展示量份额。\n报告中默认显示所选时间段内的最高份额，点击可查看趋势。` }, formatter: ({ cellValue }) => `${cellValue}%` },
  { field: 'clicks', title: '点击量', sortable: true },
  { field: 'clicksProportion', title: '点击量占比', sortable: true },
  { field: 'ctr', title: 'CTR', sortable: true, titleSuffix: { content: '广告点击转化率=点击量/曝光量' } },
  { field: 'cost', title: '广告花费', sortable: true, titleSuffix: { content: '花费=单次点击价格总和' } },
  { field: 'cpc', title: 'CPC', sortable: true, titleSuffix: { content: '平均单次点击价格=花费/点击量，因每次点击费用都不相同，取平均值' } },
  { field: 'sales', title: '广告总销售额', sortable: true },
  { field: 'acos', title: 'AcoS', sortable: true },
  { field: 'roas', title: 'ROAS', sortable: true },
  { field: 'purchases', title: '广告总订单量', sortable: true, titleSuffix: { content: '广告带来的订单量总和，包括广告商品订单数量和其他商品订单数量。付款失败的订单数量和72小时内取消的订单数量将从订单总量中删除' }, slots: { default: 'purchases' } },
  { field: 'indirectOrderCountRate', title: '间接成交订单比', sortable: true, titleSuffix: { content: '间接成交订单占广告总订单的百分比；即间接成交订单量/广告总订单量*100%' } },
  { field: 'cvr', title: 'CVR', sortable: true, titleSuffix: { content: '广告转化率=广告总订单量/点击量' } },
  { field: 'cpa', title: 'CPA', sortable: true, titleSuffix: { content: '单位订单平均广告花费=花费/广告总订单量' } },
  { field: 'unitsSold', title: '广告总销量', sortable: true, titleSuffix: { message: '广告带来的订单中商品的销量总和，包括广告商品直接出单的销量和有广告带来的间接出单销量。付款失败的订单数量和72小时内取消的订单中的商品销量将会从销量中删除SP+SD广告支持该指标，SB广告中，SBV和亚马逊支持SB multi-ad group（多广告组）后创建的广告都暂不支持该指标' } },
  { field: 'endDate', title: '广告结束时间' },
  { field: 'operation', title: '操作', fixed: 'right', slots: { default: 'operation' } },
]))
const gridOptions = reactive<VxeGridProps>({
  id: 'adsActivityGrid',
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
  checkboxConfig: {
    reserve: true,
    highlight: true,
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

const dataExportRef = useTemplateRef('dataExportRef')
function showDataExport() {
  dataExportRef.value?.show({ reportType: DATA_EXPORT_REPORT_TYPE.CAMPAIGN, columns: gridRef.value!.getFullColumns(), queryParams: queryParams.value })
}

const { request: updateStateRequest, loading: updateStateLoading } = useRequest()
async function changeState(row: ObjectAny) {
  try {
    const { type, shopId, campaignId, state } = row
    const dtos = {
      shopId,
      campaignId,
      state,
    }
    const { msg } = await updateStateRequest(getUpdateStateMethod(type), [dtos])
    toast.success(msg)
  }
  catch (error) {
    console.error(error)
  }
  finally {
    getData()
  }
}

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

const router = useRouter()
const { openUrl } = useUtils()
function showDetail(row: ObjectAny, _blank = false) {
  const { type, campaignId, shopId } = row
  if (type) {
    const campaign = ADS_TYPE_COMPONENT_MAP[type]
    if (campaign) {
      if (_blank) {
        openUrl(`/#/advertise/amazon/detail/${campaign}?type=${ADS_MANAGEMENT_TABS.ADS_ACTIVITY}&campaignId=${campaignId}&adsType=${type}&shopId=${shopId}`)
      }
      else {
        router.push({ name: 'advertise-amazon-detail', params: { campaign }, query: { type: ADS_MANAGEMENT_TABS.ADS_ACTIVITY, campaignId, adsType: type, shopId } })
      }
    }
  }
}

const baseBudgetEditRef = useTemplateRef('baseBudgetEditRef')
function showBaseBudgetEdit(row: ObjectAny) {
  baseBudgetEditRef.value?.show(row)
}

const budgetAnalysisRef = useTemplateRef('budgetAnalysisRef')
function showBudgetAnalysis(row: ObjectAny) {
  budgetAnalysisRef.value?.show({ ...row, adsType: row.type }, { dateList: commonSearch?.dateList })
}

const budgetEditRef = useTemplateRef('budgetEditRef')
function showBudgetEdit(row: ObjectAny) {
  budgetEditRef.value?.show(row)
}

const adjustType = TIME_SHARING_TYPE.BUDGET
const enableTimeSharingStrategyType = getEnableTimeSharingStrategyType(commonTabType?.value)
const timeSharingTypeOptions = computed(() => TIME_SHARING_TYPE.getOptions().filter(item => enableTimeSharingStrategyType.includes(item.value)))

const commonTypeSelectorRef = useTemplateRef('commonTypeSelectorRef')
const budgetBatchEditRef = useTemplateRef('budgetBatchEditRef')
function operateHandler(opt: 'add' | 'adjustBudget' | 'delete', type: CommonTabType = commonType.value) {
  if (opt === 'add') {
    // const shopId = commonSearch.shopIds?.[0]
    if (type === ADS_MANAGEMENT_TYPE.ALL) {
      commonTypeSelectorRef.value?.show()
    }
  }
  else if (opt === 'adjustBudget') {
    if (!selectData.value.length) { return toast.warning('请先选择广告活动') }
    budgetBatchEditRef.value?.show(selectData.value)
  }
}

const batchChangeStateLoading = ref(false)
const batchChangeStateOptions = [
  ADS_STATE.getOptions().map((item) => {
    const handler = async (state: string) => {
      batchChangeStateLoading.value = true
      try {
        if (!selectData.value.length) { return toast.warning('请先选择广告活动') }
        const tmp = selectData.value.reduce((res, { type, shopId, campaignId }) => {
          const tmp = { shopId, campaignId, state }
          if (Array.isArray(res[type])) {
            res[type].push(tmp)
          }
          else {
            res[type] = [tmp]
          }
          return res
        }, {})
        // return console.log(tmp)
        const tasks = Object.entries(tmp).map(([type, tmp]) => state === ADS_STATE.ARCHIVED ? getDeleteArchivedMethod(type)(tmp) : getUpdateStateMethod(type)(tmp))
        const res = await Promise.all(tasks)
        res.forEach(item => toast.success(item.msg))
        clearSelect()
      }
      catch (error) {
        console.error(error)
      }
      finally {
        batchChangeStateLoading.value = false
        getData()
      }
    }
    return {
      label: item.label,
      handle: () => handler(item.value),
    }
  }),
]

const timeSharingStrategyRef = useTemplateRef('timeSharingStrategyRef')
const timeSharingStrategyRemoveRef = useTemplateRef('timeSharingStrategyRemoveRef')
function showTimeSharingStrategyEdit(type: AdjustType, options: ObjectAny) {
  timeSharingStrategyRef.value?.show(type, { ...options, adsLevelType: getAdsLevelType(commonTabType?.value) })
}
const setTimeSharingOptions = [
  [
    ...timeSharingTypeOptions.value.map(item => ({
      label: item.label,
      handle: () => {
        if (!selectData.value.length) { return toast.warning('请先选择广告活动') }
        showTimeSharingStrategyEdit(item.value, { selectData: selectData.value, inAdvanceValue: selectData.value[0]?.budget })
      },
    })),
    {
      label: '移除策略',
      handle: () => {
        if (!selectData.value.length) { return toast.warning('请先选择广告活动') }
        timeSharingStrategyRemoveRef.value?.show(selectData.value.reduce<ObjectAny[]>((res, { adsAdjusts }) => {
          res.push(...adsAdjusts)
          return res
        }, []))
      },
    },
  ],
]
const otherOperationOptions = [
  [],
]

function showIndirectOrderDetail(row: ObjectAny) {
  const { name, shopId, type } = row
  const { dateList } = commonSearch
  router.push({ name: 'advertise-amazon-indirect-order', query: { campaignName: name, shopId, adsType: type, dateList } })
}

function operationOptions(row: ObjectAny) {
  return [
    [
      {
        label: '设置分时',
        handle: () => showTimeSharingStrategyEdit(timeSharingTypeOptions.value?.[0]?.value, { selectData: [row], edit: true, navTabs: timeSharingTypeOptions.value, inAdvanceValue: row.budget }),
      },
    ],
  ]
}
</script>
