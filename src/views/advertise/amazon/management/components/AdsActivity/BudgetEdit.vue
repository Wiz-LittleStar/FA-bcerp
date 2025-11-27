<template>
  <FaModal v-model="modalShow" :title="title" show-cancel-button :confirm-button-loading="loading" :before-close="submit">
    <el-form ref="formRef" :model="data">
      <el-form-item>
        <div v-if="existTimeSharingStrategy(data.adsAdjusts, adjustType)" v-loading="getInfoLoading">
          {{ editBudgetTip }}
        </div>
      </el-form-item>
      <el-form-item label="预算" prop="baseBudget" :rules="requiredRule">
        <el-input-number v-model="data.budget" placeholder="预算" :min="0" :controls="false" class="w-full!">
          <template #prefix>
            <span>$</span>
          </template>
          <template #suffix>
            <span>/日</span>
          </template>
        </el-input-number>
      </el-form-item>
      <template v-if="existTimeSharingStrategy(data.adsAdjusts, adjustType)">
        <el-form-item label="同步修改原始预算">
          <el-checkbox v-model="data.isUpdateOriginBudget" :true-label="1" :false-label="0" />
        </el-form-item>
        <el-form-item label="有效时间">
          <div class="w-full flex-center-start gap-2">
            <el-select
              v-model="data.effectTime.startTime"
              class="flex-w-auto"
              placeholder="起始时间"
              size="small"
              filterable
              clearable
            >
              <el-option v-for="item in effectTimeOptions" :key="item" :label="item" :value="item" :disabled="isAfter(item, data.effectTime.endTime)" />
            </el-select>
            <span>-</span>
            <el-select
              v-model="data.effectTime.endTime"
              class="flex-w-auto"
              placeholder="结束时间"
              size="small"
              filterable
              clearable
            >
              <el-option v-for="item in effectTimeOptions" :key="item" :label="item" :value="item" :disabled="isBefore(item, data.effectTime.startTime)" />
            </el-select>
          </div>
        </el-form-item>
      </template>
    </el-form>
  </FaModal>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { cloneDeep } from 'es-toolkit'
import dayjs from '@/utils/dayjs'
import { TIME_SHARING_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsTimeSharingStrategyUtils from '@/utils/hooks/useAmazonAdsTimeSharingStrategyUtils'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

function initForm(): {
  show: boolean
  info: ObjectAny
  data: ObjectAny
  timeSharingStrategy: ObjectAny
} {
  return {
    show: false,
    info: {},
    data: {
      isUpdateOriginBudget: 0,
      effectTime: {
        startTime: '',
        endTime: '',
      },
    },
    timeSharingStrategy: {},
  }
}
const form = reactive(initForm())
const { show: modalShow, info, data, timeSharingStrategy } = toRefs(form)
const addMode = computed(() => !info.value.campaignId)
const title = computed(() => `${(addMode.value ? '新增' : '编辑')}预算`)

const adjustType = TIME_SHARING_TYPE.BUDGET
const { nextPriceTimeSharingAdjust } = useAmazonAdsTimeSharingStrategyUtils()
const editBudgetTip = computed(() => {
  try {
    const { budget } = data.value
    return `已开启了${TIME_SHARING_TYPE.getLabelByValue(adjustType)}，手动调整值将只在下一次分时调整前${nextPriceTimeSharingAdjust(adjustType, timeSharingStrategy.value, budget)}生效`
  }
  catch {
    return ''
  }
})
const effectTimeOptions = Array.from({ length: 24 }, (_, i) => `${i}:00`).concat('23:59')
function isAfter(time1: string, time2: string) {
  return time2 ? dayjs(`${dayjs().format('YYYY-MM-DD')} ${time1}`).isAfter(dayjs(`${dayjs().format('YYYY-MM-DD')} ${time2}`)) : false
}
function isBefore(time1: string, time2: string) {
  return time2 ? dayjs(`${dayjs().format('YYYY-MM-DD')} ${time1}`).isBefore(dayjs(`${dayjs().format('YYYY-MM-DD')} ${time2}`)) : false
}

function reset() {
  Object.assign(form, initForm())
}

const { existTimeSharingStrategy, getTimeSharingStrategyMethod, getUpdateBudgetMethod } = useAmazonAdsUtils()
const getInfoLoading = ref(false)
async function getTimeSharingStrategyInfo(adsAdjusts: ObjectAny[]) {
  getInfoLoading.value = true
  try {
    const info = await getTimeSharingStrategyMethod(adsAdjusts, adjustType)
    timeSharingStrategy.value = isObject(info) ? info : {}
  }
  catch {
    timeSharingStrategy.value = {}
  }
  finally {
    getInfoLoading.value = false
  }
}
async function show(params: ObjectAny = {}) {
  reset()
  info.value = cloneDeep(params)
  Object.assign(data.value, cloneDeep(params))
  if (existTimeSharingStrategy(params.adsAdjusts, adjustType)) { getTimeSharingStrategyInfo(params.adsAdjusts) }
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
    const { info: { type, budgetType, shopId, campaignId, adsAdjusts }, data: { budget, isUpdateOriginBudget, effectTime } } = toRaw(form)
    const timeSharingStrategyInfo = existTimeSharingStrategy(adsAdjusts, adjustType)
    const adsObjId = timeSharingStrategyInfo?.id
    const tmp = [{
      budget: {
        budget,
        budgetType,
      },
      shopId,
      campaignId,
      ...(timeSharingStrategyInfo && { isUpdateOriginBudget, adsObjId, ...(effectTime?.startTime && effectTime?.endTime && { effectTime }) }),
    }]
    // return console.log(tmp)
    const { msg } = await request(getUpdateBudgetMethod(type), tmp)
    toast.success(msg)
    emit('refresh')
    done()
  }
  catch (error) {
    console.error(error)
  }
}
</script>
