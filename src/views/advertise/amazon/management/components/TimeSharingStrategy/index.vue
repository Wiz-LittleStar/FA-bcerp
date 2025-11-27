<template>
  <FaModal v-model="modalShow" :title="title" class="max-w-6xl">
    <div class="flex flex-col gap-2">
      <FaTabs v-if="editMode" v-model="form.adjustType" :list="form.navTabs" />
      <el-form ref="formRef" :model="data" size="small" label-width="auto">
        <FaDivider position="start">
          基础信息
        </FaDivider>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <el-form-item v-show="form.isSaveAsTemplate" label="模板名称" prop="strategy.templateName" :rules="createFormRules('strategy.templateName')">
              <el-input v-model="data.strategy.templateName" :maxlength="128" show-word-limit clearable />
            </el-form-item>
            <el-form-item v-show="!form.isSaveAsTemplate" label="模板使用情况" prop="templateId">
              <el-select
                v-model="data.templateId"
                :loading="getTemplateLoading"
                placeholder="不使用模板"
                @change="setTemplate($event)"
              >
                <el-option
                  v-for="item in availableTemplateOptions"
                  :key="item.id"
                  :label="item.templateName"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="有效时间">
            <div class="flex-center-start gap-2">
              <el-date-picker
                v-model="data.strategy.startDate" type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="开始日期" :disabled-date="(time:Date) => dayjs(data.strategy.endDate).isValid() ? dayjs(data.strategy.endDate).isBefore(time) : false"
              />
              <span>-</span>
              <el-date-picker
                v-model="data.strategy.endDate" type="date" value-format="YYYY-MM-DD HH:mm:ss" placeholder="结束日期" :disabled-date="(time:Date) => dayjs(data.strategy.startDate).isValid() ? dayjs(data.strategy.startDate).isAfter(time) : false"
              />
            </div>
          </el-form-item>
        </div>
        <el-form-item v-show="!form.isSaveAsTemplate" label="策略状态" prop="status" :rules="createFormRules()">
          <el-select v-model="data.status">
            <el-option v-for="item in TIME_SHARING_STRATEGY_STATUS.getOptions()" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="form.isSaveAsTemplate"
          label="适用国家"
          prop="strategy.siteIds"
          :rules="createFormRules('strategy.siteIds')"
        >
          <el-select v-model="data.strategy.siteIds" multiple collapse-tags placeholder="请选择" clearable>
            <el-option v-for="item in siteList" :key="item.dictKey" :label="item.dictValue" :value="item.dictKey" />
          </el-select>
        </el-form-item>
        <template v-if="form.selectData.length === 1">
          <FaDivider position="start">
            小时数据表现
          </FaDivider>
          <div class="border b-rd-2 p-2">
            <DataChart ref="dataChartRef" v-model="singleActivityInfo" />
          </div>
        </template>
        <FaDivider position="start">
          策略配置
        </FaDivider>
        <div v-if="useTemplate || isAdjustState" class="flex-center-start gap-2 bg-sky-50 p-2">
          <FaIcon name="i-ep:info-filled" class="c-sky" />
          <div class="flex-w-auto text-3">
            <div v-if="useTemplate" class="flex-center-start">
              部分内容不合适，我想
              <el-button type="primary" link size="small" @click="cancelTemplate">
                单独调整
              </el-button>
              ，单独调整后再对模板进行改动不会影响当前的策略规则。
            </div>
            <div v-if="isAdjustState">
              暂停广告可能会影响广告质量分，请谨慎使用！
            </div>
          </div>
        </div>
        <el-form-item v-show="isAdjustBudget" label="调整方式" prop="strategy.adjustType" :rules="createFormRules()">
          <el-radio-group
            v-model="data.strategy.adjustType"
            :disabled="useTemplate || isAdjustBudgetPercent"
            @change="adjustTypeChange($event as TimeSharingAdjustType)"
          >
            <el-radio v-for="item in adjustTypeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-show="isAdjustBudget"
          label="基准预算"
          prop="strategy.baseBudgetType"
          :rules="createFormRules('strategy.baseBudgetType')"
        >
          <el-radio-group v-model="data.strategy.baseBudgetType" :disabled="useTemplate">
            <div class="flex-center-start flex-wrap gap-8">
              <div v-for="item in baseBudgetTypeOptions" :key="item.value" class="flex-center-start gap-1">
                <el-radio :value="item.value" :disabled="isAdjustBudgetPercent && item.value === TIME_SHARING_BASE_BUDGET_TYPE.LATEST" class="mr-0!">
                  {{ item.label }}
                </el-radio>
                <el-tooltip v-if="budgetDescMap[item.value]" placement="top">
                  <template #content>
                    <div class="ws-pre-wrap">
                      {{ budgetDescMap[item.value] }}
                    </div>
                  </template>
                  <FaIcon name="i-ep:question-filled" class="size-4" />
                </el-tooltip>
                <el-input-number
                  v-if="item.value === TIME_SHARING_BASE_BUDGET_TYPE.SET"
                  v-model="data.strategy.baseBudgetValue"
                  :disabled="useTemplate"
                  class="flex-w-auto"
                  size="small"
                  controls-position="right"
                  :min="0.01"
                  :step="0.01"
                  :precision="2"
                />
              </div>
            </div>
          </el-radio-group>
        </el-form-item>
        <div v-show="isAdjustState" class="grid grid-cols-2 gap-2">
          <el-form-item label="基准状态">
            <div class="flex-center-start gap-1">
              <el-tooltip placement="top">
                <template #content>
                  <div class="ws-pre-wrap">
                    给广告活动应用分时策略时，取每个广告活动当前在系统中的状态做为基准状态。在分时策略的非生效时段，将广告活动状态自动恢复为基准状态
                  </div>
                </template>
                <FaIcon name="i-ep:question-filled" class="size-4" />
              </el-tooltip>
              <span>应用策略时的广告活动状态</span>
            </div>
          </el-form-item>
          <el-form-item label="手动暂停">
            <div class="flex-center-start gap-2">
              <el-tooltip placement="top">
                <template #content>
                  <div class="ws-pre-wrap">
                    {{
                      `勾选后：策略状态为开启的分时启停，每次执行分时策略前10分钟，ERP会自动去获取亚马逊最新的状态，如果系统判断到您手动将广告活动调整为暂停，则系统会分时启停策略关闭掉，在需要开启的时段也不会再自动开启。\n不勾选：系统内外手动暂停广告活动，系统会在下一次需要开启的时段对广告活动进行开启，即手动暂停的状态只能在下一次开启前生效。 ` }}
                  </div>
                </template>
                <FaIcon name="i-ep:question-filled" class="size-4" />
              </el-tooltip>
              <el-checkbox
                v-model="data.strategy.isManualStop"
                :disabled="useTemplate"
                :true-label="1"
                :false-label="0"
              >
                手动暂停时自动关闭分时启停
              </el-checkbox>
            </div>
          </el-form-item>
        </div>
        <el-form-item v-show="isAdjustPosition" label="基准竞价">
          <div class="flex-center-start gap-2">
            <el-tooltip placement="top">
              <template #content>
                <div class="ws-pre-wrap">
                  给广告位应用分时策略时，取每个广告位当前在系统中的竞价设置作为基准竞价，在分时策略的非生效时段，将广告位的竞价自动恢复为基准竞价
                </div>
              </template>
              <FaIcon name="i-ep:question-filled" class="size-4" />
            </el-tooltip>
            <span>应用策略时的广告位竞价</span>
          </div>
        </el-form-item>
        <el-form-item
          v-show="isAdjustBid"
          label="基准竞价"
          prop="strategy.baseBidType"
          :rules="createFormRules('strategy.baseBidType')"
        >
          <el-radio-group v-model="data.strategy.baseBidType" :disabled="useTemplate">
            <div class="flex-center-start flex-wrap gap-8">
              <div v-for="item in baseBidTypeOptions" :key="item.value" class="flex-center-start gap-2">
                <el-radio :value="item.value" class="mr-0!">
                  {{ item.label }}
                </el-radio>
                <el-tooltip v-if="bidDescMap[item.value]" placement="top">
                  <template #content>
                    <div class="ws-pre-wrap">
                      {{ bidDescMap[item.value] }}
                    </div>
                  </template>
                  <FaIcon name="i-ep:question-filled" class="size-4" />
                </el-tooltip>
                <el-input-number
                  v-if="item.value === TIME_SHARING_BASE_BID_TYPE.SET"
                  v-model="data.strategy.baseBidValue"
                  :disabled="useTemplate"
                  class="flex-w-auto"
                  size="small"
                  controls-position="right"
                  :min="0.01"
                  :step="0.01"
                  :precision="2"
                />
              </div>
            </div>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-show="adjustByTime"
          label="调整频率"
          prop="strategy.adjustFrequency"
          :rules="createFormRules('strategy.adjustFrequency')"
        >
          <el-radio-group
            v-model="data.strategy.adjustFrequency"
            :disabled="useTemplate"
            @change="clearSelected()"
          >
            <el-radio v-for="item in adjustFrequencyOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <div v-if="adjustByTime" class="flex flex-col gap-2">
          <div class="flex-center-between">
            <div class="flex-center-start gap-2">
              <el-button
                v-if="calendarView"
                type="primary"
                size="small"
                :disabled="!selectedKeys.length || useTemplate"
                @click="showStrategyEdit()"
              >
                设置{{ adjustTypeLabel }}
              </el-button>
              <span class="text-3 c-gray">未设置时段默认将预算恢复为基准预算<span v-if="calendarView">
                ，点击表格区域选择/取消时间段，时间为站点当地时间</span></span>
              <div v-if="calendarView" class="flex-center-start">
                <el-button
                  link
                  size="small"
                  :disabled="!selectedKeys.length || useTemplate"
                  @click="clearSelected"
                >
                  清空已选状态
                </el-button>
                <el-button link size="small" :disabled="useTemplate" @click="clearAll">
                  全部清空
                </el-button>
              </div>
            </div>
            <el-radio-group v-model="data.strategyTimesType" size="small" :disabled="isAdjustBudgetPercent" @change="exchangeTableData($event as StrategyTimesType)">
              <el-radio-button v-for="item in strategyTimesTypeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <vxe-table
            v-if="calendarView"
            :data="tableData"
            header-align="center"
            align="center"
            size="mini"
            border
            :row-config="{ keyField: 'dayOfWeek' }"
            :cell-class-name="cellClassName"
            @cell-click="cellClick"
          >
            <vxe-column field="name" :title="adjustFrequencyWeekly ? '星期/时间' : '时间'">
              <template #default="{ row }">
                <span>{{ adjustFrequencyWeekly ? row.name : '每天' }}</span>
              </template>
            </vxe-column>
            <vxe-colgroup v-for="group in timeGroups" :key="group.title" :title="group.title">
              <vxe-column v-for="hour in group.hours" :key="hour" :field="String(hour)" :title="String(hour)">
                <template #default="{ row, column }">
                  <span v-if="validateTimeStrategy(row[column.field], form.adjustType)">{{ handleTimeDisplay(row[column.field]) }}</span>
                </template>
              </vxe-column>
            </vxe-colgroup>
          </vxe-table>
          <vxe-grid v-else-if="listView" :data="listTableData" :columns="columns" v-bind="listTableGridOptions">
            <template #timeRange="{ row }">
              <div class="flex flex-col gap-2">
                <div v-for="item in row.timeRanges" :key="item.id" class="flex-center-start gap-2">
                  <el-time-select
                    v-model="item.startTime"
                    placeholder="起始时间"
                    :picker-options="{
                      start: '00:00',
                      step: '01:00',
                      end: '24:00',
                      maxTime: item.endTime,
                    }"
                    size="small"
                    class="w-25"
                    :disabled="useTemplate"
                  />
                  <span>-</span>
                  <el-time-select
                    v-model="item.endTime"
                    placeholder="结束时间"
                    :picker-options="{
                      start: '00:00',
                      step: '01:00',
                      end: '24:00',
                      minTime: item.startTime,
                    }"
                    size="small"
                    class="w-25"
                    :disabled="useTemplate"
                  />
                </div>
              </div>
            </template>
            <template #strategyEdit="{ row }">
              <div class="flex flex-col gap-2">
                <StrategyEdit
                  v-for="item in row.timeRanges"
                  :key="item.id"
                  v-model="item.setting"
                  :adjust-type="form.adjustType"
                  :disabled="useTemplate"
                />
              </div>
            </template>
            <template #adjustExampleHeader>
              <div class="flex-center-start gap-2">
                <span>预调整(示例：{{ listData.inAdvanceValue }})</span>
                <el-popover
                  v-model:visible="changeInAdvance.show"
                  placement="top"
                  @show="() => changeInAdvance.value = listData.inAdvanceValue"
                >
                  <div class="flex flex-col gap-2">
                    <div>默认值</div>
                    <el-input-number
                      v-model="changeInAdvance.value"
                      size="small"
                      controls-position="right"
                      :min="0.01"
                      :step="0.01"
                      :precision="2"
                    />
                    <div class="flex-center-end">
                      <el-button
                        size="small"
                        @click="changeInAdvance.show = false"
                      >
                        取消
                      </el-button>
                      <el-button
                        type="primary"
                        size="small"
                        @click="() => {
                          listData.inAdvanceValue = changeInAdvance.value
                          changeInAdvance.show = false
                        }"
                      >
                        确认
                      </el-button>
                    </div>
                  </div>
                  <template #reference>
                    <el-button type="primary" link size="small">
                      修改
                    </el-button>
                  </template>
                </el-popover>
              </div>
            </template>
            <template #adjustExample="{ row }">
              <div class="flex flex-col gap-2">
                <StrategyEditResult
                  v-for="item in row.timeRanges"
                  :key="item.id"
                  v-model="item.setting"
                  :adjust-type="form.adjustType"
                  :in-advance="listData.inAdvanceValue"
                />
              </div>
            </template>
            <template #addBudget="{ row }">
              <div class="flex flex-col gap-2">
                <span v-for="(item, index) in row.timeRanges" :key="item.id">{{ priceEditFluctuation([form.adjustType, item.setting, row.timeRanges[index - 1]?.setting, listData.inAdvanceValue]) }}</span>
              </div>
            </template>
            <template #operation="{ row }">
              <div class="flex flex-col gap-2">
                <div v-for="(item, index) in row.timeRanges" :key="item.id" class="flex-center-start">
                  <el-button type="success" plain size="small" @click="addTimeRange(row)">
                    <template #icon>
                      <FaIcon name="i-ep:plus" />
                    </template>
                  </el-button>
                  <el-button v-if="adjustFrequencyWeekly" type="primary" plain size="small" @click="copyTimeRange(row)">
                    同上
                  </el-button>
                  <el-button type="danger" plain size="small" @click="deleteTimeRange(row, index)">
                    <template #icon>
                      <FaIcon name="i-ep:minus" />
                    </template>
                  </el-button>
                </div>
                <div v-if="!row.timeRanges.length" class="flex-center-start">
                  <el-button type="success" plain size="small" @click="addTimeRange(row)">
                    <template #icon>
                      <FaIcon name="i-ep:plus" />
                    </template>
                  </el-button>
                  <el-button v-if="adjustFrequencyWeekly" type="primary" plain size="small" @click="copyTimeRange(row)">
                    同上
                  </el-button>
                </div>
              </div>
            </template>
          </vxe-grid>
        </div>
        <el-form-item
          v-show="adjustByPerformance"
          label="生效时间"
          prop="strategyPerformance.startTime"
          :rules="createFormRules('strategyPerformance.startTime')"
        >
          <div class="flex-center-start gap-2">
            <el-time-select
              v-model="data.strategyPerformance.startTime"
              placeholder="起始时间"
              :picker-options="{
                start: '06:00',
                step: '01:00',
                end: '24:00',
                maxTime: data.strategyPerformance.endTime,
              }"
              class="w-25"
            />
            <span>-</span>
            <el-time-select
              v-model="data.strategyPerformance.endTime"
              placeholder="结束时间"
              :picker-options="{
                start: '06:00',
                step: '01:00',
                end: '24:00',
                minTime: data.strategyPerformance.startTime,
              }"
              class="w-25"
            />
            <span class="c-gray">生效时间内每1小时整点执行一次，满足执行条件即会按规则执行，非生效时段自动恢复为基准预算</span>
          </div>
        </el-form-item>
        <el-form-item
          v-show="adjustByPerformance"
          label="调整类型"
          prop="strategyPerformance.isPositive"
          :rules="createFormRules('strategyPerformance.isPositive')"
        >
          <div>
            <el-checkbox
              v-model="data.strategyPerformance.isPositive"
              :true-label="1"
              :false-label="0"
            >
              效果好加大投入
            </el-checkbox>
            <div class="flex-center-start gap-2">
              <span class="fw-bold">执行条件：</span>
              <el-select v-model="data.strategyPerformance.positiveEffectType" class="w-30">
                <el-option
                  v-for="item in positiveEffectTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <template
                v-if="data.strategyPerformance.positiveEffectType === TIME_SHARING_STRATEGY_POSITIVE_EFFECT_TYPE.AVAILABLE"
              >
                <el-select v-model="data.strategyPerformance.positiveEffectSymbol" class="w-15">
                  <el-option
                    v-for="item in symbolTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-input-number
                  v-model="data.strategyPerformance.positiveEffectValue"
                  size="small"
                  controls-position="right"
                  :min="0.01"
                  :step="0.01"
                  :precision="2"
                >
                  <template #suffix>
                    %
                  </template>
                </el-input-number>
              </template>
              <span>时，且当日广告表现不错（满足以下条件）</span>
            </div>
            <div class="mt-2 flex-center-start flex-wrap gap-1">
              <div
                v-for="(item, index) in data.strategyPerformance.positiveEffectCriteria"
                :key="item.id"
                class="flex-center-start gap-1"
              >
                <el-select v-model="item.effectCriteriaType" class="w-30">
                  <el-option
                    v-for="i in effectCriteriaOptions"
                    :key="i.value"
                    :label="i.label"
                    :value="i.value"
                  />
                </el-select>
                <el-select v-model="item.symbolType" class="w-30">
                  <el-option v-for="i in symbolTypeOptions" :key="i.value" :label="i.label" :value="i.value" />
                </el-select>
                <el-input-number
                  v-model="item.effectValue"
                  size="small"
                  controls-position="right"
                  :min="0.01"
                  :step="0.01"
                  :precision="2"
                />
                <el-button
                  type="danger"
                  size="small"
                  plain
                  @click="delCriteria('positiveEffectCriteria', index)"
                >
                  <template #icon>
                    <FaIcon name="i-ep:delete" />
                  </template>
                </el-button>
                <span v-if="index !== data.strategyPerformance.positiveEffectCriteria?.length - 1">且</span>
              </div>
              <el-button
                type="primary"
                size="small"
                plain
                :disabled="data.strategyPerformance?.positiveEffectCriteria?.length >= 5"
                @click="addCriteria('positiveEffectCriteria')"
              >
                添加条件
              </el-button>
            </div>
            <div class="mt-2 flex-center-start">
              <span>调整预算<el-tooltip placement="top">
                <template #content>
                  <div style="white-space: pre-wrap;">{{ `达成执行条件，按规则计算调整后每日预算=调整前每日预算+预算调整值，预算调整值都是以基准预算作为基准值进行计算。\n调整后每日预算不能大于预算上限，大于预算上限使用预算上限进行调整。` }}</div>
                </template>
                <FaIcon name="i-ep:question-filled" class="size-3" />
              </el-tooltip>：</span>
              <div class="flex-w-auto flex-center-start gap-2">
                <div class="flex-center-start">
                  <el-select v-model="data.strategyPerformance.positiveEffectBudgetType" class="w-30">
                    <el-option
                      v-for="item in positiveEffectBudgetTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <el-input-number
                    v-model="data.strategyPerformance.positiveEffectBudgetValue"
                    size="small"
                    controls-position="right"
                    :min="0.01"
                    :step="0.01"
                    :precision="2"
                  >
                    <template v-if="data.strategyPerformance.positiveEffectBudgetType === TIME_SHARING_POSITIVE_EFFECT_BUDGET_TYPE.PERCENT" #suffix>
                      %
                    </template>
                  </el-input-number>
                </div>
                <span>最大不超过</span>
                <el-input-number
                  v-model="data.strategyPerformance.positiveEffectBudgetLimit"
                  size="small"
                  controls-position="right"
                  :min="0.01"
                  :step="0.01"
                  :precision="2"
                />
              </div>
            </div>
            <el-divider />
            <el-checkbox
              v-model="data.strategyPerformance.isNegative"
              :true-label="1"
              :false-label="0"
            >
              效果差及时止损
            </el-checkbox>
            <div class="flex-center-start align-start">
              <span>执行条件：</span>
              <div class="auto">
                <div class="flex-center-start gap-5">
                  <el-select v-model="data.strategyPerformance.negativeEffectType" class="w-150">
                    <el-option
                      v-for="item in negativeEffectTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <span>时，且当日广告表现不错（满足以下条件）</span>
                </div>
                <el-card class="mt-10">
                  <div class="align-center wrap flex gap-20">
                    <div
                      v-for="(item, index) in data.strategyPerformance.negativeEffectCriteria"
                      :key="item.id"
                      class="flex gap-5"
                      :class="{ 'mt-2': index }"
                    >
                      <el-select v-model="item.effectCriteriaType" class="w-30">
                        <el-option
                          v-for="i in effectCriteriaOptions"
                          :key="i.value"
                          :label="i.label"
                          :value="i.value"
                        />
                      </el-select>
                      <el-select v-model="item.symbolType" class="w-30">
                        <el-option v-for="i in symbolTypeOptions" :key="i.value" :label="i.label" :value="i.value" />
                      </el-select>
                      <el-input-number
                        v-model="item.effectValue"
                        size="small"
                        controls-position="right"
                        :min="0.01"
                        :step="0.01"
                        :precision="2"
                      />
                      <el-button
                        type="danger"
                        size="small"
                        plain
                        icon="el-icon-delete"
                        @click="delCriteria('negativeEffectCriteria', index)"
                      />
                      <span v-if="index !== data.strategyPerformance.negativeEffectCriteria?.length - 1">且</span>
                    </div>
                    <el-button
                      type="primary"
                      size="small"
                      plain
                      :class="{ 'mt-2': data.strategyPerformance?.negativeEffectCriteria?.length }"
                      :disabled="data.strategyPerformance?.negativeEffectCriteria?.length >= 5"
                      @click="addCriteria('negativeEffectCriteria')"
                    >
                      添加条件
                    </el-button>
                  </div>
                </el-card>
              </div>
            </div>
            <div class="align-center mt-10 flex">
              <span>调整预算<el-tooltip placement="top">
                <template #content>
                  <div style="white-space: pre-wrap;">
                    达到执行条件，将每日预算设置为当前广告花费，当日不再继续跑广告， 节省广告预算</div>
                </template>
                <i class="el-icon-question" />
              </el-tooltip>：</span>
              <span class="c-gray">直接将每日预算设置为当前广告花费。</span>
            </div>
          </div>
        </el-form-item>
        <div v-if="adjustTypeDescription" class="desc-wrap m-10">
          <div><i class="el-icon-info icon" /> 说明：</div>
          <div class="pl-20" style="white-space: pre-wrap;">
            {{ adjustTypeDescription }}
          </div>
        </div>
        <template v-if="!editMode && !form.isSaveAsTemplate">
          <div class="add-bar mt-20">
            <div class="bar-tag" />
            <span>已选取内容</span>
          </div>
          <div class="px-10">
            <span>共选取{{ statisticsInfo.total }}个对象，其中未添加分时调{{ adjustTypeLabel }}的{{ statisticsInfo.notExist
            }}个，已经添加的{{
              statisticsInfo.exist
            }}个，已经添加了分时调${{ adjustTypeLabel }}的广告，系统将自动将旧策略更新为新策略</span>
            <vxe-table :data="form.selectData" class="mt-10" size="small">
              <vxe-column field="name" title="名称">
                <template #default="{ row }">
                  <template v-if="form.adsLevelType === 'target'">
                    <!-- 1.关键词类型 -->
                    <Tooltip v-if="row.isKeyword" v-model="row.keywordText" />
                    <!-- 2.非关键词类型 -->
                    <Tooltip v-else :value="formatterValue(row.resolvedExpression)" />
                  </template>
                  <Tooltip v-else v-model="row.name" />
                </template>
              </vxe-column>
              <vxe-column field="campaignName" title="所属广告活动">
                <template #default="{ row }">
                  <span>{{ row.name }}</span>
                </template>
              </vxe-column>
              <vxe-column field="groupId" title="所属广告组">
                <template #default>
                  <span class="c-gray">--</span>
                </template>
              </vxe-column>
              <vxe-column field="state" title="状态">
                <template #default="{ row }">
                  <span>{{ ADS_AVAILABLE_STATE.getLabelByValue(row.state) }}</span>
                </template>
              </vxe-column>
              <vxe-column field="adsAdjusts" title="是否已添加">
                <template #default="{ row }">
                  <span>{{ !!row.adsAdjusts?.length ? '是' : '否' }}</span>
                </template>
              </vxe-column>
              <vxe-column field="operation" title="操作">
                <template #default="{ row, rowIndex }">
                  <el-button
                    v-if="isAdjustBudget || isAdjustBid"
                    type="text"
                    @click="showPreview(row)"
                  >
                    预览
                  </el-button>
                  <el-button
                    type="text"
                    :disabled="form.selectData?.length <= 1"
                    @click="remove(rowIndex)"
                  >
                    移除
                  </el-button>
                </template>
              </vxe-column>
            </vxe-table>
          </div>
        </template>
      </el-form>
    </div>
    <template #footer>
      <div class="flex-center-end">
        <el-button size="small" @click="modalShow = false">
          取消
        </el-button>
        <el-button :loading="loading" type="danger" size="small" @click="removeStrategy">
          移除策略
        </el-button>
        <el-button :loading="loading" type="primary" size="small" :disabled="!form.isSaveAsTemplate && !form.selectData?.length" @click="submit">
          确定
        </el-button>
      </div>
    </template>
  </FaModal>

  <FaModal v-model="strategyEdit.show" :title="`设置${adjustTypeLabel}`" class="max-w-4xl">
    <div class="flex flex-col gap-2">
      <div>{{ timesDescription }}</div>
      <StrategyEdit v-model="strategyEdit.data" :adjust-type="form.adjustType" column />
    </div>
    <template #footer>
      <div class="flex-center-end">
        <el-button size="small" @click="strategyEdit.show = false">
          取消
        </el-button>
        <el-button size="small" @click="strategyClear()">
          清空
        </el-button>
        <el-button type="primary" size="small" @click="strategySubmit()">
          确定
        </el-button>
      </div>
    </template>
  </FaModal>
</template>

<script setup lang="ts">
import type { FormInstance, FormItemRule } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import type { enumTimeSharingAdjustType, enumTimeSharingStrategyViewType } from '@/utils/enum/advertise'
import type { AdjustType } from '@/utils/hooks/useAmazonAdsUtils'
import { cloneDeep } from 'es-toolkit'
import { nanoid } from 'nanoid'
import { useFaModal } from '@/ui/components/FaModal'
import dayjs from '@/utils/dayjs'
import { ADS_AVAILABLE_STATE, TARGET_TITLE, TIME_SHARING_ADJUST_FREQUENCY, TIME_SHARING_ADJUST_TYPE, TIME_SHARING_BASE_BID_TYPE, TIME_SHARING_BASE_BUDGET_TYPE, TIME_SHARING_POSITIVE_EFFECT_BUDGET_TYPE, TIME_SHARING_STRATEGY_EFFECT_CRITERIA_TYPE, TIME_SHARING_STRATEGY_NEGATIVE_EFFECT_TYPE, TIME_SHARING_STRATEGY_POSITIVE_EFFECT_TYPE, TIME_SHARING_STRATEGY_STATE, TIME_SHARING_STRATEGY_STATUS, TIME_SHARING_STRATEGY_SYMBOL_TYPE, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE, TIME_SHARING_STRATEGY_VIEW_TYPE, TIME_SHARING_TYPE } from '@/utils/enum/advertise'
import useAmazonAdsTimeSharingStrategyUtils from '@/utils/hooks/useAmazonAdsTimeSharingStrategyUtils'
import useAmazonAdsUtils from '@/utils/hooks/useAmazonAdsUtils'
import DataChart from './DataChart.vue'
import StrategyEdit from './StrategyEdit.vue'
import StrategyEditResult from './StrategyEditResult.vue'

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const timeSharingTypeOptions = TIME_SHARING_TYPE.getOptions()
const adjustTypeOptions = TIME_SHARING_ADJUST_TYPE.getOptions()
const adjustFrequencyOptions = TIME_SHARING_ADJUST_FREQUENCY.getOptions()
const positiveEffectTypeOptions = TIME_SHARING_STRATEGY_POSITIVE_EFFECT_TYPE.getOptions()
const negativeEffectTypeOptions = TIME_SHARING_STRATEGY_NEGATIVE_EFFECT_TYPE.getOptions()
const symbolTypeOptions = TIME_SHARING_STRATEGY_SYMBOL_TYPE.getOptions()
const effectCriteriaOptions = TIME_SHARING_STRATEGY_EFFECT_CRITERIA_TYPE.getOptions()
const positiveEffectBudgetTypeOptions = TIME_SHARING_POSITIVE_EFFECT_BUDGET_TYPE.getOptions()
const strategyTimesTypeOptions = TIME_SHARING_STRATEGY_VIEW_TYPE.getOptions()

const { getTimeSharingStrategyMethod, getTimeSharingStrategyDetailMethod, templateTimeSharingStrategyMethod, siteList, getSiteList, removeTimeSharingStrategyMethod } = useAmazonAdsUtils()
const { initStrategyTimes, validateTimeStrategy, priceEditFluctuation, generateTimeKeys, getExchangeTableData } = useAmazonAdsTimeSharingStrategyUtils()
function initData() {
  return {
    templateId: undefined,
    id: undefined,
    status: 1,
    // 策略参数
    strategy: {
      templateName: '',
      siteIds: [],
      isManualStop: 1,
      adjustType: TIME_SHARING_ADJUST_TYPE.TIME,
      baseBudgetType: TIME_SHARING_BASE_BUDGET_TYPE.BUDGET,
      baseBidType: TIME_SHARING_BASE_BID_TYPE.BID,
      baseBudgetValue: '',
      baseBidValue: '',
      adjustFrequency: TIME_SHARING_ADJUST_FREQUENCY.DAY,
      startDate: '',
      endDate: '',
    },
    // 按时间
    strategyTimesType: TIME_SHARING_STRATEGY_VIEW_TYPE.LIST,
    strategyTimes: initStrategyTimes(),
    // 按表现
    strategyPerformance: {
      startTime: '07:00',
      endTime: '24:00',
      isPositive: 1,
      positiveEffectType: positiveEffectTypeOptions[0]?.value,
      positiveEffectSymbol: symbolTypeOptions[0]?.value,
      positiveEffectValue: undefined,
      positiveEffectCriteria: [],
      positiveEffectBudgetType: positiveEffectBudgetTypeOptions[0]?.value,
      positiveEffectBudgetValue: undefined,
      positiveEffectBudgetLimit: undefined,
      isNegative: 0,
      negativeEffectType: negativeEffectTypeOptions[0]?.value,
      negativeEffectCriteria: [],
    } as ObjectAny,
  }
}
function initForm(): {
  show: boolean
  data: ReturnType<typeof initData>
  edit: boolean
  isSaveAsTemplate: boolean
  navTabs: { label: string, value: AdjustType }[]
  adjustType: AdjustType | undefined
  adsLevelType: string | undefined
  selectData: ObjectAny[]
  detail: ObjectAny
  loading: boolean
} {
  return {
    show: false,
    data: initData(),
    edit: false,
    isSaveAsTemplate: false, // 是否保存为模板
    navTabs: [],
    adjustType: undefined,
    adsLevelType: undefined,
    selectData: [],
    detail: {}, // 单个编辑时分时策略详情 储存用于更新时提交亚马逊广告id(adsInfos[].id)
    loading: false,
  }
}
const form = reactive(initForm())
const { show: modalShow, data, loading } = toRefs(form)
const editMode = computed(() => !!form.edit)
const editData = computed(() => form.selectData?.[0])
// 亚马逊广告id
const adsObjId = computed(() => form.detail?.adsAdjusts?.find((item: ObjectAny) => item.adjustType === form.adjustType)?.id)
// 分时调预算
const isAdjustBudget = computed(() => [TIME_SHARING_TYPE.BUDGET, TIME_SHARING_TYPE.BUDGET_PERCENT].includes(form.adjustType!))
// 分时启停
const isAdjustState = computed(() => form.adjustType === TIME_SHARING_TYPE.STATE)
// 分时调广告位
const isAdjustPosition = computed(() => form.adjustType === TIME_SHARING_TYPE.PLACEMENT)
// 分时调竞价
const isAdjustBid = computed(() => form.adjustType === TIME_SHARING_TYPE.BID)
// 分时预算/按百分比分配
const isAdjustBudgetPercent = computed(() => form.adjustType === TIME_SHARING_TYPE.BUDGET_PERCENT)
watch(isAdjustBudgetPercent, (value) => {
  if (value) {
    Object.assign(data.value.strategy, {
      ...(data.value.strategy.adjustType !== TIME_SHARING_ADJUST_TYPE.TIME && { adjustType: TIME_SHARING_ADJUST_TYPE.TIME }),
      ...(data.value.strategy.baseBudgetType !== TIME_SHARING_BASE_BUDGET_TYPE.BUDGET && { baseBudgetType: TIME_SHARING_BASE_BUDGET_TYPE.BUDGET }),
    })
    Object.assign(data.value, { strategyTimesType: TIME_SHARING_STRATEGY_VIEW_TYPE.LIST })
  }
})
const adjustTypeLabel = computed(() => TIME_SHARING_TYPE.getLabelByValue(form.adjustType!).replace(/^(分时调|分时)/, ''))
// 标题
const title = computed(() => `${adjustTypeLabel.value}${editMode.value ? `（${editData.value?.name}）` : ''}`)
function getAdsType(item: ObjectAny, adsLevelType?: string) {
  return adsLevelType === 'target' ? item.adsType : item.type
}
const singleActivityInfo = computed(() => {
  const { selectData, adsLevelType } = form
  const currentData = selectData[0]
  return { ...currentData, adsType: getAdsType(currentData, adsLevelType) }
})
// 是否按时间调整
const adjustByTime = computed(() => data.value.strategy?.adjustType === TIME_SHARING_ADJUST_TYPE.TIME)
// 是否按表现调整
const adjustByPerformance = computed(() => isAdjustBudget.value && data.value.strategy?.adjustType === TIME_SHARING_ADJUST_TYPE.PERFORMANCE)
const adjustTypeDescription = computed(() => {
  const map = {
    [TIME_SHARING_TYPE.BUDGET]: adjustByTime.value ? `分时调整预算可调整广告活动的每日预算，只能调整商品广告、展示广告、品牌广告预算设为为每日预算的广告活动，无法调整品牌广告预算为生命周期预算的广告。\n只在调整时间范围内生效，非调整时间段内自动恢复会基准预算。\n广告活动设置分时调预算后，系统会自动记录设置规则中的基准预算，可在商品广告和分时策略中进行修改基准预算，调整后会按照新调整的值作为基准值执行分时策略。\n在分时生效日期内，在ERP内外手动修改每日预算，修改后的值仅在下一次分时生效前有效，下一次分时会继续按照基础预算作为基准继续执行分时规则。` : adjustByPerformance.value ? `基于表现调预算可根据广告表现控制每日预算，只能调整商品广告、展示广告、品牌广告预算设为为每日预算的广告活动，无法调整品牌广告预算为生命周期预算的广告。\n在生效时间内，每1个小时判断1次，达到条件后即会按规则调整，如按百分比提高，每次增加的预算按照基准预算作为基准值进行计算。\n只在调整时间范围内生效，非生效时间段内自动恢复为基准预算。\n广告活动设置分时调预算后，系统会自动记录设置规则中的基准预算，可在商品广告或分时策略中进行修改基准预算。\n设置基于表现调预算后，在ERP内外手动修改每日预算，修改后的值仅在下一次基于表现调预算生效前有效，下一次基于表现调预算会继续按照基准预算作为基准继续执行分时规则。` : '',
    [TIME_SHARING_TYPE.STATE]: `分时启停可定时调整广告活动的启动和暂停，只在调整时段内生效，非调整时段内默认恢复到设置前的状态。\n在分时启停生效日期内，在ERP内外手动修改广告活动状态，修改后的状态仅在下一次分时生效前有效，下一次分时会继续按照分时启停的规则继续执行。\n设置了分时启停的广告活动，如需要长期关掉该广告活动，请使用归档或者关掉分时启停后再暂停。`,
    [TIME_SHARING_TYPE.PLACEMENT]: `分时调广告位竞价只适用于商品广告的"搜索结果顶部(首页)"、"商品页面"、"搜索结果其余位置"三个广告位的竞价。\n只在调整时段内生效，非调整时间段内自动恢复为基准的广告位竞价（设置分时前的广告位竞价）。\n广告活动设置分时调广告位竞价后，系统会自动记录设置前的广告位竞价作为基准广告位竞价，在非生效时段、规则过期、暂停和移除分时调广告位时自动恢复。\n在分时生效日期内，在ERP内外手动修改广告位竞价，修改后的值仅在下一次分时生效前有效，下一次分时会继续按照分时调广告位竞价的规则继续执行。`,
    [TIME_SHARING_TYPE.BID]: `分时调整竞价可调整SP/SB/SD广告的投放竞价，包括关键词投放、商品投放、投放组、受众。\n只在调整时间范围内生效，非调整时间段内自动恢复会基准竞价。\n广告投放设置分时调竞价后，系统会自动记录设置规则中的基准竞价，可在广告管理和分时策略中进行修改基准竞价，调整后会按照新调整的值作为基准值执行分时策略。\n在分时生效日期内，在ERP内外手动修改竞价，修改后的值仅在下一次分时生效前有效，下一次分时会继续按照基础预算作为基准继续执行分时规则。`,
  }
  return map[form.adjustType!]
})
// 基准预算类型
const baseBudgetTypeOptions = computed(() => {
  const options = TIME_SHARING_BASE_BUDGET_TYPE.getOptions()
  if (adjustByTime.value) {
    return options
  }
  else if (adjustByPerformance.value) {
    return options.filter(item => item.value !== TIME_SHARING_BASE_BUDGET_TYPE.LATEST)
  }
  return options
})
const budgetDescMap = {
  [TIME_SHARING_BASE_BUDGET_TYPE.SET]: `1.给广告投放应用分时策略时，将所有应用的广告投放的基准预算都应用您设置的固定值，后续的分时策略都在该基准预算的基础上进行调整。\n2. 如需更改，可在ERP的分时策略的修改弹窗中进行更改。`,
  [TIME_SHARING_BASE_BUDGET_TYPE.BUDGET]: `1.给广告投放应用分时策略时，取每个广告投放当前在系统中的每日预算做为基准预算，后续的分时策略都在该基准预算的基础上进行调整。\n2.如需更改，在ERP的广告管理/分时策略中对基准预算字段进行更改，更改后会按照新更改的基准预算执行后续和分时策略。`,
  [TIME_SHARING_BASE_BUDGET_TYPE.LATEST]: `1.每次执行分时策略前20分钟，ERP会自动去获取亚马逊最新的预算，如果系统判断到您手动调整过预算，则以您新调整的预算作为基准预算，并在此基础上进行调整。\n2.适用于经常在亚马逊后台调整预算、且每次调整都要以新调整的预算作为分时的基准预算的场景。`,
}
// 基准竞价类型
const baseBidTypeOptions = TIME_SHARING_BASE_BID_TYPE.getOptions()
const bidDescMap = {
  [TIME_SHARING_BASE_BID_TYPE.SET]: `1.给广告投放应用分时策略时，将所有应用的广告投放的基准竞价都应用您设置的固定值，后续的分时策略都在该基准竞价的基础上进行调整。\n2. 如需更改，可在ERP的分时策略的修改弹窗中进行更改。`,
  [TIME_SHARING_BASE_BID_TYPE.BID]: `1.给广告投放应用分时策略时，取每个广告投放当前在系统中的每日竞价做为基准竞价，后续的分时策略都在该基准竞价的基础上进行调整。\n2.如需更改，在ERP的广告管理/分时策略中对基准竞价字段进行更改，更改后会按照新更改的基准竞价执行后续和分时策略。`,
  [TIME_SHARING_BASE_BID_TYPE.LATEST]: `1.每次执行分时策略前20分钟，ERP会自动去获取亚马逊最新的竞价，如果系统判断到您手动调整过竞价，则以您新调整的竞价作为基准竞价，并在此基础上进行调整。\n2.适用于经常在亚马逊后台调整竞价、且每次调整都要以新调整的竞价作为分时的基准竞价的场景。`,
}
// 分时策略视图类型
const calendarView = computed(() => data.value.strategyTimesType === TIME_SHARING_STRATEGY_VIEW_TYPE.CALENDAR)
const listView = computed(() => data.value.strategyTimesType === TIME_SHARING_STRATEGY_VIEW_TYPE.LIST)
// 是否使用模板
const useTemplate = computed(() => !!data.value.templateId && !form.isSaveAsTemplate)
// 是否按周调整
const adjustFrequencyWeekly = computed(() => data.value.strategy?.adjustFrequency === TIME_SHARING_ADJUST_FREQUENCY.WEEK)
const tableData = computed(() => data.value.strategyTimes.slice(0, adjustFrequencyWeekly.value ? undefined : 1))

function validateSelected(value: any, options: ObjectAny[]): boolean {
  try {
    return options.some(item => item.value === value)
  }
  catch (error) {
    console.error(error)
    return false
  }
}
function createFormRules(prop?: string): FormItemRule[] {
  const required = true
  const message = '请补充'
  const trigger = ['change', 'blur']
  let validator: FormItemRule['validator']
  switch (prop) {
    case 'strategy.templateName':
      validator = (_rule, value, callback) => {
        if (form.isSaveAsTemplate && !value) {
          return callback(new Error('请补充'))
        }
        callback()
      }
      break
    case 'strategy.siteIds':
      validator = (_rule, value, callback) => {
        if (form.isSaveAsTemplate && !value?.length) {
          return callback(new Error('请补充'))
        }
        callback()
      }
      break
    case 'strategy.baseBudgetType':
      validator = (_rule, value, callback) => {
        if (isAdjustBudget.value) {
          if (!baseBudgetTypeOptions.value.some(s => s.value === value)) {
            return callback(new Error('请补充'))
          }
          else if (value === TIME_SHARING_BASE_BUDGET_TYPE.SET && !data.value.strategy.baseBudgetValue) {
            return callback(new Error('请补充'))
          }
        }
        callback()
      }
      break
    case 'strategy.baseBidType':
      validator = (_rule, value, callback) => {
        if (isAdjustBid.value) {
          if (!baseBidTypeOptions.some(s => s.value === value)) {
            return callback(new Error('请补充'))
          }
          else if (value === TIME_SHARING_BASE_BID_TYPE.SET && !data.value.strategy.baseBidValue) {
            return callback(new Error('请补充'))
          }
        }
        callback()
      }
      break
    case 'strategy.adjustFrequency':
      validator = (_rule, value, callback) => {
        if (adjustByTime.value && !validateSelected(value, adjustFrequencyOptions)) {
          return callback(new Error('请补充'))
        }
        callback()
      }
      break
    case 'strategyPerformance.startTime':
      validator = (_rule, value, callback) => {
        if (isAdjustBudget.value && adjustByPerformance.value && !(value && data.value.strategyPerformance.endTime)) {
          return callback(new Error('请补充'))
        }
        callback()
      }
      break
    case 'strategyPerformance.isPositive':
      validator = (_rule, _value, callback) => {
        if (isAdjustBudget.value) {
          const { isPositive, positiveEffectType, positiveEffectSymbol, positiveEffectValue, positiveEffectCriteria, positiveEffectBudgetType, positiveEffectBudgetValue, positiveEffectBudgetLimit, isNegative, negativeEffectType, negativeEffectCriteria } = data.value.strategyPerformance
          if (adjustByPerformance.value && !(
            (isPositive && validateSelected(positiveEffectType, positiveEffectTypeOptions) && validateSelected(positiveEffectSymbol, symbolTypeOptions) && positiveEffectValue && (positiveEffectCriteria?.length ? positiveEffectCriteria.every((item: ObjectAny) => validateSelected(item.effectCriteriaType, effectCriteriaOptions) && validateSelected(item.symbolType, symbolTypeOptions) && item.effectValue) : true) && validateSelected(positiveEffectBudgetType, positiveEffectBudgetTypeOptions) && positiveEffectBudgetValue && positiveEffectBudgetLimit)
            || (isNegative && validateSelected(negativeEffectType, negativeEffectTypeOptions) && (negativeEffectCriteria?.length ? negativeEffectCriteria.every((item: ObjectAny) => validateSelected(item.effectCriteriaType, effectCriteriaOptions) && validateSelected(item.symbolType, symbolTypeOptions) && item.effectValue) : true))
          )) {
            return callback(new Error('请补充'))
          }
        }
        callback()
      }
      break
    default:
      break
  }
  return [
    {
      required,
      ...(typeof validator === 'function' ? { validator } : { message }),
      trigger,
    },
  ]
}

const selectedKeys = ref<string[]>([])
function cellClassName({ row, column }: ObjectAny = {}) {
  return selectedKeys.value.includes(`${row.dayOfWeek}-${column.field}`) ? 'selected' : ''
}
function cellClick({ row, column }: ObjectAny = {}) {
  if (column.field === 'name' || useTemplate.value) {
    return
  }
  const key = `${row.dayOfWeek}-${column.field}`
  if (selectedKeys.value.includes(key)) {
    selectedKeys.value = selectedKeys.value.filter(item => item !== key)
  }
  else {
    selectedKeys.value.push(key)
  }
}
function handleTimeDisplay(value: ObjectAny) {
  if (validateTimeStrategy(value, form.adjustType)) {
    if (isAdjustBudget.value || isAdjustBid.value) {
      let symble = ''
      if ([TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP_PERCENT].includes(value?.adjustType)) {
        symble = '+'
      }
      else if ([TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN_PERCENT].includes(value?.adjustType)) {
        symble = '-'
      }
      let percent = ''
      if ([TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP_PERCENT, TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.DOWN_PERCENT].includes(value?.adjustType)) {
        percent = '%'
      }
      return `${symble}${value?.adjustValue}${isAdjustBudgetPercent.value ? '%' : percent}`
    }
    else if (isAdjustState.value) {
      return TIME_SHARING_STRATEGY_STATE.getLabelByValue(value?.adjustState)
    }
    else if (isAdjustPosition.value) {
      const { topOfSearchOnAmazon, detailPageOnAmazon, otherOnAmazon } = value
      const display = (v: any) => {
        if ([undefined, null, ''].includes(v)) {
          return '--'
        }
        return `${v}%`
      }
      return `${display(topOfSearchOnAmazon)},${display(detailPageOnAmazon)},${display(otherOnAmazon)}`
    }
  }
  return ''
}
const hours = Array.from({ length: 24 }, (_, index) => index)
const timeGroups = [
  {
    title: '00:00-06:00',
    hours: hours.slice(0, 6),
  },
  {
    title: '06:00-12:00',
    hours: hours.slice(6, 12),
  },
  {
    title: '12:00-18:00',
    hours: hours.slice(12, 18),
  },
  {
    title: '18:00-24:00',
    hours: hours.slice(18, 24),
  },
]
function clearSelected() {
  selectedKeys.value = []
}
function clearAll() {
  clearSelected()
  data.value.strategyTimes.forEach((item: ObjectAny) => {
    hours.forEach((hour) => {
      delete item[hour]
    })
  })
}
// 设置表单数据
function setData(info?: ObjectAny) {
  Object.assign(form, { data: initData(), detail: cloneDeep(info ?? {}) })
  clearAll()
  if (isObject(info)) {
    const { isManualStop, adjustType, baseBudgetType, baseBudgetValue, baseBidType, baseBidValue, adjustFrequency, startDate, endDate, strategyTimes, performance, adsAdjusts, isTemplate, id } = info ?? {}
    if (isTemplate) {
      data.value.templateId = id
    }
    if (dayjs(startDate).isValid()) {
      data.value.strategy.startDate = startDate
    }
    if (dayjs(endDate).isValid()) {
      data.value.strategy.endDate = endDate
    }
    data.value.strategy.templateName = info?.templateName
    data.value.strategy.siteIds = info?.siteIds
    if (editMode.value) {
      data.value.status = adsAdjusts?.[0]?.status
    }
    if (isAdjustBudget.value) {
      data.value.strategy.adjustType = adjustType
      data.value.strategy.baseBudgetType = baseBudgetType
      data.value.strategy.baseBudgetValue = baseBudgetValue
    }
    else if (isAdjustState.value) {
      data.value.strategy.isManualStop = isManualStop
    }
    else if (isAdjustBid.value) {
      data.value.strategy.baseBidType = baseBidType
      data.value.strategy.baseBidValue = baseBidValue
    }
    data.value.strategy.adjustFrequency = adjustFrequency
    if (Array.isArray(strategyTimes)) {
      strategyTimes.forEach((item) => {
        if (form.adjustType && validateTimeStrategy(item, form.adjustType)) {
          const { adjustType, adjustValue, budgetRange, bidRange, dayOfWeek, adjustState, startTime, endTime, topOfSearchOnAmazon, detailPageOnAmazon, otherOnAmazon } = item
          const tmp = {
            ...(isAdjustBudget.value && {
              adjustValue,
              ...(!isAdjustBudgetPercent.value && {
                adjustType,
                budgetRange,
              }),
            }),
            ...(isAdjustState.value && {
              adjustState,
            }),
            ...(isAdjustPosition.value && {
              topOfSearchOnAmazon,
              detailPageOnAmazon,
              otherOnAmazon,
            }),
            ...(isAdjustBid.value && {
              adjustType,
              adjustValue,
              bidRange,
            }),
          }
          if (startTime && endTime) {
            const keys = generateTimeKeys(startTime, endTime)
            if (dayOfWeek) {
              const cur: ObjectAny | undefined = data.value.strategyTimes.find((item: ObjectAny) => item.dayOfWeek === dayOfWeek)
              if (cur) {
                keys.forEach((key) => {
                  cur[key] = tmp
                })
              }
            }
            else {
              data.value.strategyTimes.forEach((item: ObjectAny) => {
                keys.forEach((key) => {
                  item[key] = tmp
                })
              })
            }
          }
        }
      })
    }
    if (performance instanceof Object) {
      const existKeys = Object.keys(initData().strategyPerformance)
      existKeys.forEach((key) => {
        data.value.strategyPerformance[key] = performance[key]
      })
    }
  }
}

async function getDetail({ template, copyTemplate }: ObjectAny = {}) {
  const { adjustType, isSaveAsTemplate } = form
  let info: ObjectAny = {}
  if (editMode.value) {
    info = await getTimeSharingStrategyMethod(editData.value?.adsAdjusts, adjustType!)
  }
  else if (isSaveAsTemplate && template) {
    info = await getTimeSharingStrategyDetailMethod([template], adjustType!)
  }
  setData(info)
  if (!(isSaveAsTemplate && copyTemplate)) {
    data.value.id = info?.id
  }
}

function initListData({ inAdvanceValue = 20 } = {}) {
  return {
    data: [],
    inAdvanceValue,
  }
}
const listData = ref<{ data: ObjectAny[], inAdvanceValue: number }>(initListData())
const listTableData = computed(() => listData.value.data.slice(0, adjustFrequencyWeekly.value ? undefined : 1))
const columns = computed<VxeGridProps['columns']>(() => [
  {
    field: 'name',
    title: '日期',
    formatter: ({ cellValue }) => adjustFrequencyWeekly.value ? cellValue : '每天',
  },
  {
    title: '站点时间',
    slots: { default: 'timeRange' },
  },
  ...(isAdjustBudget.value
    ? [
        {
          title: adjustTypeLabel.value,
          titleSuffix: { content: `分时调整预算可调整广告活动的每日预算，只能调整商品广告、展示广告、品牌广告预算设为为每日预算的广告活动，无法调整品牌广告预算为生命周期预算的广告。\n只在调整时间范围内生效，非调整时间段内自动恢复会基准预算。\n广告活动设置分时调预算后，系统会自动记录设置规则中的基准预算，可在商品广告和分时策略中进行修改基准预算，调整后会按照新调整的值作为基准值执行分时策略。\n在分时生效日期内，在ERP内外手动修改每日预算，修改后的值仅在下一次分时生效前有效，下一次分时会继续按照基础预算作为基准继续执行分时规则。` },
          slots: { default: 'strategyEdit' },
        },
        {
          slots: { header: 'adjustExampleHeader', default: 'adjustExample' },
        },
        {
          title: '时段增加预算',
          titleSuffix: { content: `时段增加预算是您为该时段分配的预算，可理解为时段内最小的可用预算。时段内实际可用的预算=预调整值 - 时段前的广告花费。如预调整值为30，调整前实际花费为5，则时段内实际可用预算为25。` },
          slots: { default: 'addBudget' },
        },
      ]
    : []),
  ...((isAdjustState.value || isAdjustPosition.value)
    ? [
        {
          title: adjustTypeLabel.value,
          slots: { default: 'strategyEdit' },
        },
      ]
    : []),
  ...(isAdjustBid.value
    ? [
        {
          title: adjustTypeLabel.value,
          titleSuffix: { content: `分时调整竞价可调整SP/SB/SD广告的投放竞价，包括关键词投放、商品投放、投放组、受众。\n只在调整时间范围内生效，非调整时间段内自动恢复会基准竞价。\n广告投放设置分时调竞价后，系统会自动记录设置规则中的基准竞价，可在广告管理和分时策略中进行修改基准竞价，调整后会按照新调整的值作为基准值执行分时策略。\n在分时生效日期内，在ERP内外手动修改竞价，修改后的值仅在下一次分时生效前有效，下一次分时会继续按照基础预算作为基准继续执行分时规则。` },
          slots: { default: 'strategyEdit' },
        },
        {
          slots: { header: 'adjustExampleHeader', default: 'adjustExample' },
        },
      ]
    : []),
  ...(!useTemplate.value
    ? [
        {
          title: '操作',
          slots: { default: 'operation' },
        },
      ]
    : []),
])
const listTableGridOptions = reactive<VxeGridProps>({
  size: 'mini',
  columnConfig: { resizable: true, minWidth: 'auto' },
  rowConfig: { isCurrent: true, isHover: true, keyField: 'dayOfWeek' },
})
const changeInAdvance = ref({
  show: false,
  value: 0,
})

function initTimeRange() {
  return {
    id: nanoid(),
    startTime: undefined,
    endTime: undefined,
    setting: {
      adjustType: isAdjustBudgetPercent.value ? TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.SET : TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE.UP,
    },
  }
}
function addTimeRange(row: ObjectAny) {
  row.timeRanges.push(initTimeRange())
}
function copyTimeRange(row: ObjectAny) {
  const { dayOfWeek } = row
  if (dayOfWeek) {
    const cur = listData.value.data.find(item => item.dayOfWeek === (dayOfWeek - 1))
    if (cur) {
      Object.assign(row, { timeRanges: cur.timeRanges?.map((item: ObjectAny) => ({ ...cloneDeep(item), id: nanoid() })) ?? [] })
    }
  }
}
function deleteTimeRange(row: ObjectAny, index: number) {
  row.timeRanges?.splice(index, 1)
}

const exchangeTableDataParams = computed(() => ({ data: listData.value.data, strategyTimes: data.value.strategyTimes, adjustType: form.adjustType }))
// 视图数据转换
type StrategyTimesType = enumTimeSharingStrategyViewType[keyof enumTimeSharingStrategyViewType]
function exchangeTableData(strategyTimesType?: StrategyTimesType) {
  clearSelected()
  const result = getExchangeTableData(exchangeTableDataParams.value, strategyTimesType)
  if (calendarView.value) {
    data.value.strategyTimes = result
  }
  else if (listView.value) {
    listData.value.data = result
  }
}

// 添加条件
function addCriteria(key: string) {
  data.value.strategyPerformance[key]?.push({
    id: nanoid(),
    effectCriteriaType: effectCriteriaOptions[0]?.value,
    symbolType: symbolTypeOptions[0]?.value,
    effectValue: undefined,
  })
}
// 删除条件
function delCriteria(key: string, index: number) {
  data.value.strategyPerformance[key]?.splice(index, 1)
}
const statisticsInfo = computed(() => ({
  total: form.selectData?.length || 0,
  exist: form.selectData?.filter(item => item.adsAdjusts?.some((item: ObjectAny) => item.adjustType === form.adjustType))?.length || 0,
  notExist: form.selectData?.filter(item => !item.adsAdjusts?.some((item: ObjectAny) => item.adjustType === form.adjustType))?.length || 0,
}))

// 投放标题
function formatterValue(val?: string) {
  if (val) {
    const str = JSON.parse(val)
    return TARGET_TITLE.getLabelByValue(str[0].type)
  }
  return '-'
}

// 获取模板
const templateOptions = reactive<ObjectAny[]>([])
const getTemplateLoading = ref(false)
async function getTemplate() {
  getTemplateLoading.value = true
  try {
    const { data: res } = await templateTimeSharingStrategyMethod(form.adjustType!)()
    templateOptions.splice(0, templateOptions.length, ...(Array.isArray(res) ? res : []))
  }
  catch (error) {
    window.console.log(error)
  }
  finally {
    getTemplateLoading.value = false
  }
}
function cancelTemplate() {
  data.value.templateId = undefined
}
// 设置模板
function setTemplate(templateId: number) {
  const current = templateOptions.find(item => item.id === templateId)
  setData(cloneDeep(current))
  // 设置模板数据后，需要更新日历和列表视图的数据
  exchangeTableData(data.value.strategyTimesType)
}
const availableTemplateOptions = computed(() => {
  const selectedSiteIds = form.selectData.map(item => item.siteId)
  return templateOptions.filter(item => item.siteIds?.length ? selectedSiteIds.every(site => item.siteIds.includes(site)) : true)
})

type TimeSharingAdjustType = enumTimeSharingAdjustType[keyof enumTimeSharingAdjustType]
function adjustTypeChange(val: TimeSharingAdjustType) {
  if (val === TIME_SHARING_ADJUST_TYPE.PERFORMANCE && !baseBudgetTypeOptions.value.some(s => s.value === data.value.strategy.baseBudgetType)) {
    data.value.strategy.baseBudgetType = baseBudgetTypeOptions.value[0]?.value
  }
}

function initStrategyEdit() {
  return {
    show: false,
    data: {},
  }
}
const strategyEdit = reactive(initStrategyEdit())
function showStrategyEdit() {
  Object.assign(strategyEdit, initStrategyEdit())
  strategyEdit.show = true
}
const timesDescription = computed(() => {
  const { strategyTimes } = data.value

  // 合并连续时间段的通用函数
  const mergeTimeRanges = (times: number[]) => {
    if (!times.length) {
      return []
    }
    times.sort((a, b) => a - b)
    const ranges = []
    let start = times[0]
    let prev = times[0]

    for (let i = 1; i <= times.length; i++) {
      if (i === times.length || times[i] !== prev + 1) {
        ranges.push([start, prev + 1])
        if (i < times.length) {
          start = prev = times[i]
        }
      }
      else {
        prev = times[i]
      }
    }
    return ranges
  }

  // 格式化时间范围
  const formatTimeRange = (ranges: number[][]) => {
    return ranges.map(([start, end]) =>
      `${String(start).padStart(2, '0')}:00-${String(end).padStart(2, '0')}:00`,
    ).join('、')
  }

  if (adjustFrequencyWeekly.value) {
    // 按星期分组
    const weeks = selectedKeys.value.reduce((acc: ObjectAny, item) => {
      const [dayOfWeek, field] = item.split('-')
        ; (acc[Number(dayOfWeek)] = acc[dayOfWeek] || []).push(Number(field))
      return acc
    }, {})

    // 合并相同时间范围的星期
    const timeGroups = Object.entries(weeks).reduce((acc: ObjectAny, [dayOfWeek, times]) => {
      const timeRanges = mergeTimeRanges(times)
      const timeKey = JSON.stringify(timeRanges)
      const weekDay = strategyTimes.find(item => item.dayOfWeek === Number(dayOfWeek))?.name

      if (!acc[timeKey]) {
        acc[timeKey] = { weekDays: [], timeRanges }
      }
      acc[timeKey].weekDays.push(weekDay)
      return acc
    }, {})

    const result = Object.values(timeGroups).map(({ weekDays, timeRanges }) =>
      `${weekDays.join('、')}(${formatTimeRange(timeRanges)})`,
    )

    return result.join('；')
  }
  else {
    const times = selectedKeys.value
      .filter(key => Number(key.split('-')[0]) === strategyTimes[0]?.dayOfWeek)
      .map(key => Number(key.split('-')[1]))
    return `每天${formatTimeRange(mergeTimeRanges(times))}`
  }
})
function strategySubmit() {
  try {
    const tmp = cloneDeep(strategyEdit.data)
    if (!validateTimeStrategy(tmp, form.adjustType!)) {
      return toast.warning('请补充完整')
    }
    selectedKeys.value.forEach((key: string) => {
      const [dayOfWeek, field] = key.split('-')
      if (adjustFrequencyWeekly.value) {
        const current = data.value.strategyTimes.find(item => item.dayOfWeek === Number(dayOfWeek))
        if (isObject(current)) { Object.assign(current as ObjectAny, { [field]: tmp }) }
      }
      else {
        data.value.strategyTimes.forEach((item) => {
          Object.assign(item, { [field]: cloneDeep(tmp) })
        })
      }
    })
    strategyEdit.show = false
    clearSelected()
  }
  catch (error) {
    window.console.log(error)
  }
}
function strategyClear() {
  selectedKeys.value.forEach((key: string) => {
    const [dayOfWeek, field] = key.split('-')
    const current = data.value.strategyTimes.find(item => item.dayOfWeek === Number(dayOfWeek))
    if (isObject(current)) { delete (current as ObjectAny)[field] }
  })
  strategyEdit.show = false
  clearSelected()
}

function showPreview(row: ObjectAny) {
  console.warn(row)
}
function remove(index: number) {
  console.warn(index)
}

function reset({ inAdvanceValue }: ObjectAny = {}) {
  Object.assign(form, initForm())
  clearAll()
  listData.value = initListData({ inAdvanceValue })
}

const dataChartRef = useTemplateRef('dataChartRef')
async function show(adjustType: AdjustType, { adsLevelType, selectData = [], edit = false, navTabs = timeSharingTypeOptions, isSaveAsTemplate = false, template, copyTemplate, inAdvanceValue = 20 }: ObjectAny = {}) {
  try {
    reset({ inAdvanceValue })
    if (!navTabs.some((item: ObjectAny) => item.value === adjustType)) { return toast.warning('不支持该分时策略类型') }
    if (!isSaveAsTemplate && !(Array.isArray(selectData) && selectData.length)) { return toast.warning('请先选择数据') }
    Object.assign(form, { navTabs, edit, isSaveAsTemplate, adsLevelType, adjustType, selectData: cloneDeep(selectData) })
    if (editMode.value || (isSaveAsTemplate && template)) {
      await getDetail({ template, copyTemplate })
    }
    exchangeTableData(TIME_SHARING_STRATEGY_VIEW_TYPE.LIST)
    modalShow.value = true
    getTemplate()
    getSiteList()
    dataChartRef.value?.getData()
  }
  catch (error) {
    console.error(error)
    toast.error('数据解析失败')
  }
}
defineExpose({ show })

function removeStrategy() {
  useFaModal().confirm({
    title: '提示',
    content: `确定要移除当前分时${adjustTypeLabel.value}策略吗？`,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    onConfirm: async () => {
      loading.value = true
      try {
        if (!adsObjId.value) {
          return toast.warning('未找到分时策略')
        }
        const { msg } = await removeTimeSharingStrategyMethod(form.adjustType!)([adsObjId.value])
        toast.success(msg)
        modalShow.value = false
        emit('refresh')
      }
      catch (error) {
        console.error(error)
      }
      finally {
        loading.value = false
      }
    },
  })
}

const formRef = useTemplateRef<FormInstance>('formRef')
async function submit() {
  loading.value = true
  try {
    if (!await formRef.value?.validate()) {
      return
    }
    modalShow.value = false
    emit('refresh')
  }
  catch (error) {
    console.error(error)
  }
  finally {
    loading.value = false
  }
}
</script>
