<template>
  <div class="time-rule">
    <div class="rule-container">
      <!-- 时间段 -->
      <div class="time-blocks">
        <el-tooltip
          v-for="(block, index) in timeBlocks"
          :key="index"
          placement="top"
          effect="light"
          :disabled="!block.content"
        >
          <template #content>
            <div style="white-space: pre-wrap;">
              {{ block.content }}
            </div>
          </template>
          <div class="time-block-wrapper" :style="getBlockStyle(block)">
            <div class="time-block" />
          </div>
        </el-tooltip>
      </div>

      <!-- 刻度线 -->
      <div class="rule-lines">
        <div v-for="i in 24" :key="i" class="hour-line" />
      </div>
    </div>

    <!-- 底部时间刻度 -->
    <div class="time-labels">
      <span v-for="i in timeLabels" :key="i" class="time-label">{{ i }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const data = defineModel<ObjectAny[]>()

// 数据
const timeBlocks = computed(() => Array.isArray(data.value) ? data.value : [])

// 时间标签
const timeLabels = [0, 6, 12, 18, 24]

// 更新计算样式的方法
function getBlockStyle(block: ObjectAny) {
  // 将 HH:mm 转换为分钟数
  const getMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const startMinutes = getMinutes(block.startTime)
  const endMinutes = getMinutes(block.endTime)

  // 计算百分比位置（24小时 = 1440分钟）
  const left = (startMinutes / 1440) * 100
  const width = ((endMinutes - startMinutes) / 1440) * 100

  return {
    left: `${left}%`,
    width: `${width}%`,
  }
}
</script>

<style lang="scss" scoped>
.time-rule {
  width: 100%;
  padding: 4px 20px;

  .rule-container {
    position: relative;
    height: 16px;
    margin-bottom: 2px;
    background: #f2f3f5;
    border-radius: 2px;

    .time-blocks {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      width: 100%;
      height: 100%;

      .time-block-wrapper {
        position: absolute;
        height: 100%;

        .time-block {
          width: 100%;
          height: 100%;
          background: #409eff;
          border-radius: 2px;
        }
      }
    }

    .rule-lines {
      display: flex;
      width: 100%;
      height: 100%;

      .hour-line {
        flex: 1;
      }
    }
  }

  .time-labels {
    display: flex;
    justify-content: space-between;
    padding: 0;
    font-size: 12px;
    color: #909399;

    .time-label {
      position: relative;
    }

    .time-label:first-child {
      transform: translateX(-50%);

      &::after {
        content: "点";
      }
    }

    .time-label:last-child {
      transform: translateX(50%);

      &::after {
        content: "点";
      }
    }
  }
}
</style>
