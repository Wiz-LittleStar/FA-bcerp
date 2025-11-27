<template>
  <NumberFlowGroup>
    <slot />
  </NumberFlowGroup>
</template>

<script setup lang="ts">
import { NumberFlowGroup } from '@number-flow/vue'

defineOptions({
  name: 'FaAnimatedCountToGroup',
})
</script>
