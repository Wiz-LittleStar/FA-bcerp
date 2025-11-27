<template>
  <div v-if="isShop">
    {{ model.shopName }}
  </div>
  <div v-else-if="isCampaign">
    {{ model.campaignName }}
  </div>
  <div v-else-if="isProduct" class="flex-center-start gap-2">
    <FaImagePreview :src="model.imageUrl ?? ''" class="size-8" />
    <CopyText v-model="model.sellerSku" truncated />
  </div>
  <div v-else-if="isPlacement">
    {{ model.targetValue }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  dimension: {
    type: Number,
    required: true,
  },
})
const model = defineModel<ObjectAny>({ required: true })

const isShop = computed(() => props.dimension === 0)
const isCampaign = computed(() => props.dimension === 1)
const isProduct = computed(() => props.dimension === 2)
const isPlacement = computed(() => props.dimension === 3)
</script>
