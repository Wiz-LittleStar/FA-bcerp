<template>
  <FaModal v-model="modalShow" :title="title" :footer="false" class="min-w-3xl">
    <div class="flex-center-center gap-8 px-6">
      <div v-for="item in ADS_TYPE.getOptions()" :key="item.value" class="flex-w-auto flex-col-center gap-2">
        <div class="text-lg fw-bold">
          {{ item.label }}
        </div>
        <div class="h-30">
          <el-image :src="srcMap[item.value]" class="size-full" />
        </div>
        <div class="text-sm text-gray">
          {{ descMap[item.value] }}
        </div>
        <el-button type="primary" :disabled="!options.includes(item.value)" @click="submit(item.value)">
          选择并继续
        </el-button>
      </div>
    </div>
  </FaModal>
</template>

<script setup lang="ts">
import type { enumAdsType } from '@/utils/enum/advertise'
import SbAdsImg from '@/assets/images/sb-ads.png'
import SdAdsImg from '@/assets/images/sd-ads.png'
import SpAdsImg from '@/assets/images/sp-ads.png'
import { ADS_TYPE } from '@/utils/enum/advertise'

type AdsType = enumAdsType[keyof enumAdsType]

const props = withDefaults(
  defineProps<{
    title?: string
    options?: AdsType[]
  }>(),
  {
    title: '广告选择类型',
    options: () => [ADS_TYPE.SP, ADS_TYPE.SD, ADS_TYPE.SB],
  },
)
const emit = defineEmits(['change'])

const { title, options } = toRefs(props)
const srcMap = {
  [ADS_TYPE.SP]: SpAdsImg,
  [ADS_TYPE.SD]: SdAdsImg,
  [ADS_TYPE.SB]: SbAdsImg,
}
const descMap = {
  [ADS_TYPE.SP]: '向在亚马逊上积极使用相关关键词进行搜索或查看类似商品的买家推广商品。',
  [ADS_TYPE.SD]: '重新吸引查看过您的商品或类似商品且已离开亚马逊的买家，并使他们点开详细信息页面。',
  [ADS_TYPE.SB]: '向在亚马逊上积极使用相关关键词进行搜索的买家展示一系列商品。',
}
const modalShow = ref(false)
function show() {
  modalShow.value = true
}
defineExpose({ show })
function submit(type: AdsType) {
  emit('change', type)
  modalShow.value = false
}
</script>
