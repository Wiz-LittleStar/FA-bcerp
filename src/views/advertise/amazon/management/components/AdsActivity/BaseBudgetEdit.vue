<template>
  <FaModal v-model="modalShow" :title="title" show-cancel-button :confirm-button-loading="loading" :before-close="submit">
    <el-form ref="formRef" :model="data" label-width="auto">
      <el-form-item label="广告活动">
        <span>{{ info.name }}</span>
      </el-form-item>
      <el-form-item label="基准预算" prop="baseBudget" :rules="requiredRule">
        <el-input-number v-model="data.baseBudget" placeholder="基准预算" :min="0" :controls="false" class="w-full!">
          <template #prefix>
            <span>$</span>
          </template>
          <template #suffix>
            <span>/日</span>
          </template>
        </el-input-number>
      </el-form-item>
    </el-form>
  </FaModal>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { cloneDeep } from 'es-toolkit'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

function initForm(): {
  show: boolean
  info: ObjectAny
  data: ObjectAny
} {
  return {
    show: false,
    info: {},
    data: {},
  }
}
const form = reactive(initForm())
const { show: modalShow, info, data } = toRefs(form)
const addMode = computed(() => !info.value.campaignId)
const title = computed(() => `${(addMode.value ? '新增' : '编辑')}基准预算`)

function reset() {
  Object.assign(form, initForm())
}

async function show(params = {}) {
  reset()
  info.value = cloneDeep(params)
  Object.assign(data.value, cloneDeep(params))
  modalShow.value = true
}
defineExpose({ show })

const { requiredRule } = useFormRule()
const { request, loading } = useRequest()
const { getUpdateBaseBudgetMethod } = useAmazonAdsUtils()
const formRef = useTemplateRef<FormInstance>('formRef')
async function submit(action: 'confirm' | 'cancel' | 'close', done: () => void) {
  try {
    if (action !== 'confirm') {
      return done()
    }
    if (!await formRef.value?.validate()) {
      return
    }
    const { info: { type, shopId, campaignId }, data: { baseBudget } } = toRaw(form)
    const tmp = {
      adsType: type,
      baseBudget,
      campaignId,
      shopId,
    }
    // return console.log(tmp)
    const { msg } = await request(getUpdateBaseBudgetMethod(type), tmp)
    toast.success(msg)
    emit('refresh')
    done()
  }
  catch (error) {
    console.error(error)
  }
}
</script>
