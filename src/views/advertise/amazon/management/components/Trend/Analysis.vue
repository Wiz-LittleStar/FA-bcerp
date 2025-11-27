<template>
  <FaModal v-model="modalShow" :title="title" :footer="false" class="h-90vh max-w-380">
    <div class="h-full flex flex-col gap-4">
      <div v-if="isObject(info) && Object.keys(info).length">
        <el-descriptions border>
          <template v-if="tabType === ADS_MANAGEMENT_TABS.ADS_COMBINATION">
            <el-descriptions-item label="广告组合">
              <span>{{ info.portfolioName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="服务状态">
              <el-tag :type="tagTypeMap.adsCombinationServingStatus[info.servingStatus]">
                {{ ADS_COMBINATION_STATE.getLabelByValue(info.servingStatus) }}
              </el-tag>
            </el-descriptions-item>
          </template>
          <template v-else-if="tabType === ADS_MANAGEMENT_TABS.ADS_ACTIVITY">
            <el-descriptions-item label="广告活动">
              <span>{{ info.name }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <div class="flex-center-start gap-2">
                <el-tag :type="tagTypeMap.adsSdCampaignServingStatus[info.servingStatus]">
                  {{ ADS_SD_CAMPAIGN_STATE.getLabelByValue(info.servingStatus) }}
                </el-tag>
                <span v-if="info.campaignOutOfBudgetDate" class="text-red">{{ formatDate(info.campaignOutOfBudgetDate) }}</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="预算">
              <span>{{ `$${info.budget}/日` }}</span>
            </el-descriptions-item>
          </template>
          <template v-else-if="tabType === ADS_MANAGEMENT_TABS.ADS_GROUP">
            <el-descriptions-item label="广告组">
              <span>{{ info.name }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="服务">
              <el-tag :type="tagTypeMap.adsSdCampaignServingStatus[info.servingStatus]">
                {{ ADS_SD_CAMPAIGN_STATE.getLabelByValue(info.servingStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="竞价">
              <span>{{ info.cpc }}</span>
            </el-descriptions-item>
          </template>
          <template v-else-if="tabType === ADS_MANAGEMENT_TABS.ADS_PLACEMENT">
            <el-descriptions-item label="广告活动">
              <span>{{ info.campaignName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="广告位">
              <span>{{ ADS_PLACEMENT_TYPE.getLabelByValue(info.placement) }}</span>
            </el-descriptions-item>
          </template>
          <template v-else-if="tabType === ADS_MANAGEMENT_TABS.ADS_PRODUCT">
            <el-descriptions-item label="商品">
              <span>{{ info.asin }}</span>
            </el-descriptions-item>
          </template>
          <template v-else-if="tabType === ADS_MANAGEMENT_TABS.ADS_ADVERTISEMENT">
            <el-descriptions-item label="广告活动">
              <span>{{ info.campaignName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="广告组">
              <span>{{ info.adGroupName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="广告">
              <span>{{ info.name }}</span>
            </el-descriptions-item>
          </template>
          <template v-else-if="tabType === ADS_MANAGEMENT_TABS.ADS_TARGET">
            <el-descriptions-item label="广告活动">
              <span>{{ info.campaignName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="广告组">
              <span>{{ info.adGroupName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="投放">
              <span v-if="info.isKeyword" class="truncate">{{ info.keywordText }}</span>
              <span v-else class="truncate">{{ formatterValue(info.resolvedExpression) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="tagTypeMap.adsSdCampaignServingStatus[info.servingStatus]">
                {{ ADS_SD_CAMPAIGN_STATE.getLabelByValue(info.servingStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="竞价">
              <span>{{ info.bid }}</span>
            </el-descriptions-item>
          </template>
          <template v-else-if="tabType === ADS_MANAGEMENT_TABS.SEARCH_TERM">
            <el-descriptions-item label="广告活动">
              <span>{{ info.campaignName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="广告组">
              <span>{{ info.adGroupName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="搜索词">
              <span>{{ info.searchTerm }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="词频">
              <span>{{ info.word }}</span>
            </el-descriptions-item>
          </template>
        </el-descriptions>
      </div>
      <div class="of-y-auto">
        <Trend ref="trendRef" :options="{ type: tabType, extSearch, showIndicatorTable: true, tabs: [ADS_TREND_TABS.TREND, ADS_TREND_TABS.CONTRAST], customDate: true }" />
      </div>
    </div>
  </FaModal>
</template>

<script setup lang="ts">
import { cloneDeep } from 'es-toolkit'
import dayjs from '@/utils/dayjs'
import { ADS_COMBINATION_STATE, ADS_MANAGEMENT_TABS, ADS_PLACEMENT_TYPE, ADS_SD_CAMPAIGN_STATE, ADS_TREND_TABS, TARGET_TITLE } from '@/utils/enum/advertise'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import { isObject } from '@/utils/object'
import Trend from './index.vue'

const { tagTypeMap } = useAmazonAdsUtils()

const data = reactive({
  show: false,
  info: {} as ObjectAny,
  tabType: '',
  trendExtSearch: {},
})
const { show: modalShow, info, tabType, trendExtSearch } = toRefs(data)
const title = computed(() => `${ADS_MANAGEMENT_TABS.getLabelByValue(tabType.value)}趋势分析`)
const extSearch = computed(() => ({
  ...trendExtSearch.value,
  name: info.value.name,
}))

function formatDate(time: string) {
  return `${dayjs(time).format('HH:mm')}超出预算`
}
// 投放标题
function formatterValue(val: string) {
  if (val) {
    const str = JSON.parse(val)
    if (str[0].type === TARGET_TITLE.ASIN_SAME_AS) {
      return str[0].value
    }
    else {
      return TARGET_TITLE.getLabelByValue(str[0].type)
    }
  }
  return '-'
}

const trendRef = useTemplateRef('trendRef')

function show(params: ObjectAny, options: ObjectAny = {}) {
  info.value = isObject(params) ? cloneDeep(params) : {}
  tabType.value = options.type
  trendExtSearch.value = isObject(options.trendExtSearch) ? options.trendExtSearch : {}
  modalShow.value = true
  nextTick(() => trendRef.value?.getData(options))
}
defineExpose({ show })
</script>
