<template>
  <FaModal v-model="modalShow" :title="title" :loading="getInfoLoading" show-cancel-button :confirm-button-loading="loading" :before-close="submit">
    <el-form ref="formRef" :model="data" label-width="auto">
      <el-form-item label="店铺" prop="shopId" :rules="requiredRule">
        <el-select v-model="data.shopId" class="w-full" filterable clearable>
          <el-option v-for="item in amazonAdsShopList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="广告组合名称" prop="portfolioName" :rules="requiredRule">
        <el-input v-model="data.portfolioName" clearable />
      </el-form-item>
      <el-form-item label="预算上限">
        <div class="w-full flex-center-start gap-2">
          <el-select v-model="data.budgetPolicy" placeholder="预算类型" filterable class="flex-w-auto">
            <el-option v-for="item in ADS_COMBINATION_BUDGET_POLICY.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-input-number v-if="[ADS_COMBINATION_BUDGET_POLICY.DATE_RANGE, ADS_COMBINATION_BUDGET_POLICY.MONTHLY_RECURRING].includes(data.budgetPolicy as string)" v-model="data.budgetAmount" placeholder="上限（必填）" :min="0" :step="0.01" :precision="2" :controls="false" class="flex-w-auto" />
        </div>
      </el-form-item>
      <el-form-item v-show="data.budgetPolicy === ADS_COMBINATION_BUDGET_POLICY.DATE_RANGE" label="日期范围">
        <div class="w-full flex-center-start gap-2">
          <el-date-picker v-model="data.budgetStartDate" type="date" placeholder="开始日期" class="flex-w-auto!" />
          <el-date-picker v-model="data.budgetEndDate" type="date" placeholder="无结束日期" class="flex-w-auto!" />
        </div>
      </el-form-item>
      <el-form-item v-show="data.budgetPolicy === ADS_COMBINATION_BUDGET_POLICY.MONTHLY_RECURRING" label="每月定期">
        <el-date-picker v-model="data.budgetEndDate" type="date" placeholder="无结束日期" class="w-full!" />
      </el-form-item>
    </el-form>
  </FaModal>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { cloneDeep } from 'es-toolkit'
import { amazonAdsPortfoliosCreate, amazonAdsPortfoliosGetByPortfoliosIdShopId, amazonAdsPortfoliosUpadte } from '@/api/modules/advertise/amazon'
import dayjs from '@/utils/dayjs'
import { ADS_COMBINATION_BUDGET_POLICY } from '@/utils/enum/advertise'

const props = withDefaults(defineProps<{
  init?: boolean
}>(), {
  init: false,
})
const emit = defineEmits<{
  (e: 'refresh'): void
}>()
const { init } = toRefs(props)

interface Data {
  shopId: number
  portfolioId: number
  portfolioName: string
  budgetCurrencyCode: string
  budgetPolicy: keyof ReturnType<typeof ADS_COMBINATION_BUDGET_POLICY.getEnum>
  budgetAmount: number
  budgetStartDate: string
  budgetEndDate: string
}
function initForm(): {
  show: boolean
  info: Partial<Data>
  data: Partial<Data>
} {
  return {
    show: false,
    info: {},
    data: {},
  }
}
const form = reactive(initForm())
const { show: modalShow, info, data } = toRefs(form)
const addMode = computed(() => !info.value.portfolioId)
const title = computed(() => `${(addMode.value ? '新增' : '编辑')}广告组合`)

function reset() {
  Object.assign(form, initForm())
}

function initData(item?: ObjectAny) {
  const tmp = isObject(item) ? { ...item, budgetPolicy: item?.budgetPolicy || ADS_COMBINATION_BUDGET_POLICY.NO_CAP } : {}
  info.value = cloneDeep(tmp)
  Object.assign(data.value, cloneDeep(tmp))
}
const { request: getInfoRequest, loading: getInfoLoading } = useRequest()
async function getInfo(item?: ObjectAny) {
  const { portfolioId, shopId } = item ?? {}
  const tmp = { portfoliosId: portfolioId, shopId }
  const { data: resultData } = await getInfoRequest(amazonAdsPortfoliosGetByPortfoliosIdShopId, tmp)
  if (isObject(resultData)) {
    initData({ ...resultData, portfolioName: resultData.name })
  }
  else {
    toast.error('广告组合不存在')
    throw new Error('广告组合不存在')
  }
}
const commonSearch = inject<ObjectAny>('commonSearch', () => ({}))
const { amazonAdsShopList, getAmazonAdsShopList } = useShop()
async function show(params = {}) {
  reset()
  if (init.value) {
    await getInfo(params)
  }
  else {
    initData(params)
  }
  await getAmazonAdsShopList()
  if (commonSearch.shopIds?.[0]) {
    data.value.shopId = commonSearch.shopIds[0]
  }
  modalShow.value = true
}
defineExpose({ show })

const { requiredRule } = useFormRule()
const { request, loading } = useRequest()
const formRef = useTemplateRef<FormInstance>('formRef')
async function submit(action: 'confirm' | 'cancel' | 'close', done: () => void) {
  try {
    if (action !== 'confirm') {
      return done()
    }
    if (!await formRef.value?.validate()) {
      return
    }
    const { info: { portfolioId }, data: { shopId, portfolioName, budgetCurrencyCode = 'USD', budgetPolicy, budgetAmount, budgetStartDate, budgetEndDate } } = toRaw(form)
    if (budgetPolicy !== ADS_COMBINATION_BUDGET_POLICY.NO_CAP && !budgetAmount) {
      return toast.error('请输入预算金额')
    }
    else if (budgetPolicy === ADS_COMBINATION_BUDGET_POLICY.DATE_RANGE) {
      if (!budgetStartDate) { return toast.error('请选择开始日期') }
      if (budgetEndDate && dayjs(budgetStartDate).isAfter(dayjs(budgetEndDate))) { return toast.error('开始日期不能晚于结束日期') }
    }
    const tmp = {
      portfolios: [
        {
          budget: {
            currencyCode: budgetCurrencyCode,
            policy: budgetPolicy,
            ...(budgetPolicy !== ADS_COMBINATION_BUDGET_POLICY.NO_CAP && {
              amount: budgetAmount,
              ...(budgetStartDate && { startDate: dayjs(budgetStartDate).format('YYYY-MM-DD') }),
              ...(budgetEndDate && { endDate: dayjs(budgetEndDate).format('YYYY-MM-DD') }),
            }),
          },
          name: portfolioName,
          state: 'ENABLED',
          portfolioId,
        },
      ],
      shopId,
    }
    // return console.log(tmp)
    const { msg } = await request(addMode.value ? amazonAdsPortfoliosCreate : amazonAdsPortfoliosUpadte, tmp)
    toast.success(msg)
    emit('refresh')
    done()
  }
  catch (error) {
    console.error(error)
  }
}
</script>
