<route lang="yaml">
meta:
  title: '广告看板'
</route>

<template>
  <div class="absolute size-full flex flex-col">
    <FaPageHeader class="mb-0">
      <template #description>
        <FaSearchBar :show-toggle="false">
          <template #default="{ fold, toggle }">
            <el-form :model="search" inline-message inline>
              <el-form-item label="店铺">
                <el-select v-model="search.shopIds" class="w-50" filterable clearable @change="getData()">
                  <el-option v-for="item in amazonAdsShopList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="币种">
                <el-select v-model="search.currency" class="w-50" clearable>
                  <el-option v-for="item in currencyOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="广告类型">
                <el-select v-model="search.adsType" class="w-50" clearable>
                  <el-option v-for="item in adsTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="ASIN">
                <el-input v-model="search.asin" clearable @keydown.enter="getData()" @clear="getData()" />
              </el-form-item>
              <el-form-item label="父ASIN">
                <el-input v-model="search.parentAsin" clearable @keydown.enter="getData()" @clear="getData()" />
              </el-form-item>
              <el-form-item label="SKU">
                <el-input v-model="search.sellerSku" clearable @keydown.enter="getData()" @clear="getData()" />
              </el-form-item>
              <el-form-item label="统计日期">
                <el-date-picker v-model="search.dateList" type="daterange" value-format="YYYY-MM-DD HH:mm:ss" @change="getData()" />
              </el-form-item>
              <el-form-item>
                <el-button @click="resetSearch(); getData()">
                  重置
                </el-button>
                <el-button type="primary" @click="getData()">
                  <template #icon>
                    <FaIcon name="i-ep:search" />
                  </template>
                  筛选
                </el-button>
                <el-button link size="small" disabled @click="toggle">
                  <template #icon>
                    <FaIcon :name="fold ? 'i-ep:caret-bottom' : 'i-ep:caret-top' " />
                  </template>
                  {{ fold ? '展开' : '收起' }}
                </el-button>
              </el-form-item>
            </el-form>
          </template>
        </FaSearchBar>
      </template>
    </FaPageHeader>
    <FaPageMain class="flex-h-auto" main-class="flex-h-auto flex flex-col gap-4 overflow-auto">
      <CampaginIndicator ref="campaginIndicatorRef" />
      <div class="flex gap-4">
        <el-card class="flex-w-auto">
          <TrendAnalysis ref="trendAnalysisRef" class="flex-w-auto" />
        </el-card>
        <el-card class="flex-w-auto">
          <AdvertisementDistribution ref="advertisementDistributionRef" />
        </el-card>
      </div>
      <div class="flex gap-4">
        <el-card class="flex-w-auto">
          <CostT20 ref="costT20Ref" />
        </el-card>
        <el-card class="flex-w-auto">
          <SalesT20 ref="salesT20Ref" />
        </el-card>
      </div>
      <div class="flex gap-4">
        <el-card class="flex-w-auto">
          <AcosRank ref="acosRankRef" />
        </el-card>
        <el-card class="flex-w-auto">
          <CvrRank ref="cvrRankRef" />
        </el-card>
        <el-card class="flex-w-auto">
          <AcoasRank ref="acoasRankRef" />
        </el-card>
      </div>
      <div>
        <el-card>
          <AdvertisementPerformance ref="advertisementPerformanceRef" />
        </el-card>
      </div>
      <div>
        <el-card>
          <DataOverview ref="dataOverviewRef" />
        </el-card>
      </div>
    </FaPageMain>
  </div>
</template>

<script setup lang="ts">
import dayjs from '@/utils/dayjs'
import { ADS_TYPE } from '@/utils/enum/advertise'
import AcoasRank from './components/AcoasRank.vue'
import AcosRank from './components/AcosRank.vue'
import AdvertisementDistribution from './components/AdvertisementDistribution.vue'
import AdvertisementPerformance from './components/AdvertisementPerformance.vue'
import CampaginIndicator from './components/CampaginIndicator.vue'
import CostT20 from './components/CostT20.vue'
import CvrRank from './components/CvrRank.vue'
import DataOverview from './components/DataOverview.vue'
import SalesT20 from './components/SalesT20.vue'
import TrendAnalysis from './components/TrendAnalysis.vue'

const currencyOptions = [
  { value: 'USD', label: '美元' },
  { value: 'CAD', label: '加元' },
  { value: 'GBP', label: '英镑' },
  { value: 'JPY', label: '日元' },
  { value: 'EUR', label: '欧元' },
  { value: 'CNY', label: '人民币' },
]
const adsTypeOptions = ADS_TYPE.getOptions()

const { amazonAdsShopList, getAmazonAdsShopList } = useShop()

const storeKey = 'amazon_ads_dashboard_search'
function getDefaultSearchForm() {
  return {
    shopIds: [],
    currency: currencyOptions[0].value,
    adsType: '',
    asin: '',
    parentAsin: '',
    sellerSku: '',
    dateList: [dayjs().subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss'), dayjs().format('YYYY-MM-DD HH:mm:ss')],
  }
}
function initSearch() {
  try {
    const savedForm = localStorage.getItem(storeKey)
    if (savedForm) {
      const parsedForm = JSON.parse(savedForm)
      return {
        ...getDefaultSearchForm(),
        ...parsedForm,
      }
    }
  }
  catch (error) {
    console.error(error)
  }
  return getDefaultSearchForm()
}

const search = reactive(initSearch())
provide('commonSearch', search)
function saveSearch() {
  try {
    localStorage.setItem(storeKey, JSON.stringify(toRaw(search)))
  }
  catch (error) {
    console.error(error)
  }
}
function resetSearch() {
  Object.assign(search, getDefaultSearchForm())
}

const campaginIndicatorRef = useTemplateRef('campaginIndicatorRef')
const trendAnalysisRef = useTemplateRef('trendAnalysisRef')
const advertisementDistributionRef = useTemplateRef('advertisementDistributionRef')
const costT20Ref = useTemplateRef('costT20Ref')
const salesT20Ref = useTemplateRef('salesT20Ref')
const acosRankRef = useTemplateRef('acosRankRef')
const cvrRankRef = useTemplateRef('cvrRankRef')
const acoasRankRef = useTemplateRef('acoasRankRef')
const advertisementPerformanceRef = useTemplateRef('advertisementPerformanceRef')
const dataOverviewRef = useTemplateRef('dataOverviewRef')
function getData() {
  saveSearch()
  campaginIndicatorRef.value?.getData()
  trendAnalysisRef.value?.getData()
  advertisementDistributionRef.value?.getData()
  costT20Ref.value?.getData()
  salesT20Ref.value?.getData()
  acosRankRef.value?.getData()
  cvrRankRef.value?.getData()
  acoasRankRef.value?.getData()
  advertisementPerformanceRef.value?.getData()
  dataOverviewRef.value?.getData()
}

onMounted(() => {
  getAmazonAdsShopList()
  getData()
})
</script>
