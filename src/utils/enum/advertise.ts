import { defineEnum } from '@/utils/enum'

export const ADS_MANAGEMENT_TYPE = defineEnum({
  ALL: ['AllCampaign', '全部'],
  SP: ['SpCampaign', 'SP'],
  SD: ['SdCampaign', 'SD'],
  SB: ['SbCampaign', 'SB'],
})
export type enumAdsManagementType = ReturnType<typeof ADS_MANAGEMENT_TYPE.getEnum>

export const ADS_TYPE = defineEnum({
  SP: [1, '商品广告'],
  SD: [2, '展示广告'],
  SB: [3, '品牌广告'],
})
export type enumAdsType = ReturnType<typeof ADS_TYPE.getEnum>

export const ADS_VIEW_TYPE = defineEnum({
  MSKU: [1, 'MSKU视图'],
  ASIN: [2, 'ASIN视图'],
  PARENT_ASIN: [3, '父ASIN视图'],
  ACTIVITY_TAG: [4, '活动标签视图'],
  ADS_COMBINE: [5, '广告组合视图'],
  ADS_ACTIVITT: [6, '广告活动视图'],
})
export type enumAdsViewType = ReturnType<typeof ADS_VIEW_TYPE.getEnum>

export const ADS_VIEW_ASIN_SEARCH_TYPE = defineEnum({
  ASIN: ['asin', 'ASIN'],
  PARENT_ASIN: ['parentAsin', '父ASIN'],
  SKU: ['sku', 'SKU'],
  // TITLE: ['title', '标题'],
})

export const ADS_MANAGEMENT_TABS = defineEnum({
  ADS_COMBINATION: ['adsCombination', '广告组合'],
  ADS_ACTIVITY: ['adsActivity', '广告活动'],
  ADS_GROUP: ['adsGroup', '广告组'],
  ADS_PLACEMENT: ['adsPlacement', '广告位'],
  ADS_PRODUCT: ['adsProduct', '商品'],
  ADS_CREATIVE: ['adsCreative', '创意'],
  ADS_ADVERTISEMENT: ['adsAdvertisement', '广告'],
  ADS_TARGET: ['adsTarget', '投放'],
  ADS_NEGATIVE_TARGET: ['adsNegativeTarget', '否定投放'],
  SEARCH_TERM: ['searchTerm', '用户搜索词'],
  OPERATION_LOG: ['operationLog', '操作日志'],
})
export type enumAdsManagementTabs = ReturnType<typeof ADS_MANAGEMENT_TABS.getEnum>

export const ADS_TREND_TABS = defineEnum({
  TREND: ['TREND', '趋势'],
  CONTRAST: ['CONTRAST', '数据对比'],
  PERSPECTIVE: ['PERSPECTIVE', '透视'],
  ADS_STRUCTURE: ['ADS_STRUCTURE', '广告结构'],
  TARGET_STRUCTURE: ['TARGET_STRUCTURE', '投放结构'],
  ADS_PLACEMENT: ['ADS_PLACEMENT', '广告位'],
})

export const ADS_AVAILABLE_STATE = defineEnum({
  ENABLED: ['ENABLED', '启用'],
  PAUSED: ['PAUSED', '暂停'],
  ARCHIVED: ['ARCHIVED', '归档'],
  DRAFT: ['DRAFT', '草稿'],
})

export const ADS_COMBINATION_STATE = defineEnum({
  PORTFOLIO_STATUS_ENABLED: ['PORTFOLIO_STATUS_ENABLED', '组合启用'],
  PORTFOLIO_PAUSED: ['PORTFOLIO_PAUSED', '组合暂停'],
  PORTFOLIO_ARCHIVED: ['PORTFOLIO_ARCHIVED', '组合归档'],
  PORTFOLIO_OUT_OF_BUDGET: ['PORTFOLIO_OUT_OF_BUDGET', '组合超出预算'],
  PORTFOLIO_PENDING_START_DATE: ['PORTFOLIO_PENDING_START_DATE', '待开始日期'],
  PORTFOLIO_ENDED: ['PORTFOLIO_ENDED', '组合结束'],
})

export const ADS_COMBINATION_BUDGET_POLICY = defineEnum({
  NO_CAP: ['NO_CAP', '无预算上限'],
  DATE_RANGE: ['DATE_RANGE', '按照日期范围'],
  MONTHLY_RECURRING: ['MONTHLY_RECURRING', '每月定期'],
})

export const ADS_STATE = defineEnum({
  ENABLED: ['ENABLED', '启动'],
  PAUSED: ['PAUSED', '暂停'],
  ARCHIVED: ['ARCHIVED', '归档'],
})

export const ADS_SD_CAMPAIGN_STATE = defineEnum({
  ADVERTISER_STATUS_ENABLED: ['ADVERTISER_STATUS_ENABLED', '广告已启用'],
  TARGETING_CLAUSE_STATUS_LIVE: ['TARGETING_CLAUSE_STATUS_LIVE', '广告已启用'],
  STATUS_UNAVAILABLE: ['STATUS_UNAVAILABLE', '状态不可用'],
  ADVERTISER_PAUSED: ['ADVERTISER_PAUSED', '广告主暂停'],
  ACCOUNT_OUT_OF_BUDGET: ['ACCOUNT_OUT_OF_BUDGET', '预算耗尽'],
  ADVERTISER_PAYMENT_FAILURE: ['ADVERTISER_PAYMENT_FAILURE', '支付失败'],
  CAMPAIGN_PAUSED: ['CAMPAIGN_PAUSED', '广告活动暂停'],
  CAMPAIGN_ARCHIVED: ['CAMPAIGN_ARCHIVED', '广告活动归档'],
  PENDING_START_DATE: ['PENDING_START_DATE', '等待开始日期'],
  ENDED: ['ENDED', '广告活动结束'],
  CAMPAIGN_OUT_OF_BUDGET: ['CAMPAIGN_OUT_OF_BUDGET', '活动预算耗尽'],
  ADVERTISER_EXCEED_SPENDS_LIMIT: ['ADVERTISER_EXCEED_SPENDS_LIMIT', '超出支出限额'],
  AD_GROUP_ENABLED: ['AD_GROUP_STATUS_ENABLED', '广告组启用'],
  AD_GROUP_PAUSED: ['AD_GROUP_PAUSED', '广告组暂停'],
  AD_GROUP_ARCHIVED: ['AD_GROUP_ARCHIVED', '广告组归档'],
  AD_GROUP_INCOMPLETE: ['AD_GROUP_INCOMPLETE', '广告组不完整'],
  AD_GROUP_LOW_BID: ['AD_GROUP_LOW_BID', '广告组低出价'],
  AD_POLICING_PENDING_REVIEW: ['AD_POLICING_PENDING_REVIEW', '审核待定'],
  CAMPAIGN_INCOMPLETE: ['CAMPAIGN_INCOMPLETE', '活动不完整'],
  INELIGIBLE: ['INELIGIBLE', '不符合条件'],
  PORTFOLIO_ENDED: ['PORTFOLIO_ENDED', '投资组合结束'],
  PORTFOLIO_OUT_OF_BUDGET: ['PORTFOLIO_OUT_OF_BUDGET', '投资组合预算耗尽'],
  ADVERTISER_ARCHIVED: ['ADVERTISER_ARCHIVED', '广告主归档'],
  ADVERTISER_ACCOUNT_OUT_OF_BUDGET: ['ADVERTISER_ACCOUNT_OUT_OF_BUDGET', '广告主预算耗尽'],
  TARGET_STATUS_LIVE: ['TARGET_STATUS_LIVE', '目标状态正常'],
  TARGET_STATUS_PAUSED: ['TARGET_STATUS_PAUSED', '目标状态暂停'],
  TARGET_STATUS_ARCHIVED: ['TARGET_STATUS_ARCHIVED', '目标状态归档'],
  EXCEED_SPENDS_LIMIT: ['ADVERTISER_EXCEED_SPENDS_LIMIT', '超出支出限额'],
  POLICING_PENDING_REVIEW: ['AD_POLICING_PENDING_REVIEW', '待审核'],
  ARCHIVED: ['ADVERTISER_ARCHIVED', '归档'],
  CAMPAIGN_STATUS_ENABLED: ['CAMPAIGN_STATUS_ENABLED', '活动启用'],
  AD_GROUP_POLICING_CREATIVE_REJECTED: ['AD_GROUP_POLICING_CREATIVE_REJECTED', '创意审核拒绝'],
})

export const ADS_CAMPAIGN_SERVING_STATUS = defineEnum({
  AD_GROUP_STATUS_ENABLED: ['AD_GROUP_STATUS_ENABLED', '广告组启用'],
  AD_GROUP_PAUSED: ['AD_GROUP_PAUSED', '广告组已暂停'],
  AD_GROUP_ARCHIVED: ['AD_GROUP_ARCHIVED', '广告组已归档'],
  AD_GROUP_INCOMPLETE: ['AD_GROUP_INCOMPLETE', '广告组信息不完整'],
  AD_GROUP_POLICING_PENDING_REVIEW: ['AD_GROUP_POLICING_PENDING_REVIEW', '广告组待审核'],
  AD_GROUP_POLICING_CREATIVE_REJECTED: ['AD_GROUP_POLICING_CREATIVE_REJECTED', '广告组创意被拒绝'],
  AD_GROUP_LOW_BID: ['AD_GROUP_LOW_BID', '广告组出价过低'],
  CAMPAIGN_STATUS_ENABLED: ['CAMPAIGN_STATUS_ENABLED', '广告活动启用'],
  CAMPAIGN_PAUSED: ['CAMPAIGN_PAUSED', '广告活动已暂停'],
  CAMPAIGN_ARCHIVED: ['CAMPAIGN_ARCHIVED', '广告活动已归档'],
  PENDING_REVIEW: ['PENDING_REVIEW', '待审核'],
  REJECTED: ['REJECTED', '已拒绝'],
  PENDING_START_DATE: ['PENDING_START_DATE', '待开始'],
  ENDED: ['ENDED', '已结束'],
  CAMPAIGN_OUT_OF_BUDGET: ['CAMPAIGN_OUT_OF_BUDGET', '广告活动预算不足'],
  CAMPAIGN_INCOMPLETE: ['CAMPAIGN_INCOMPLETE', '广告活动信息不完整'],
  PORTFOLIO_STATUS_ENABLED: ['PORTFOLIO_STATUS_ENABLED', '组合启用'],
  PORTFOLIO_PAUSED: ['PORTFOLIO_PAUSED', '组合已暂停'],
  PORTFOLIO_ARCHIVED: ['PORTFOLIO_ARCHIVED', '组合已归档'],
  PORTFOLIO_OUT_OF_BUDGET: ['PORTFOLIO_OUT_OF_BUDGET', '组合预算不足'],
  PORTFOLIO_PENDING_START_DATE: ['PORTFOLIO_PENDING_START_DATE', '组合待开始'],
  PORTFOLIO_ENDED: ['PORTFOLIO_ENDED', '组合已结束'],
  ADVERTISER_POLICING_SUSPENDED: ['ADVERTISER_POLICING_SUSPENDED', '广告主被暂停（违规）'],
  ADVERTISER_POLICING_PENDING_REVIEW: ['ADVERTISER_POLICING_PENDING_REVIEW', '广告主待审核'],
  ADVERTISER_ARCHIVED: ['ADVERTISER_ARCHIVED', '广告主已归档'],
  ADVERTISER_PAUSED: ['ADVERTISER_PAUSED', '广告主已暂停'],
  ADVERTISER_OUT_OF_BUDGET: ['ADVERTISER_OUT_OF_BUDGET', '广告主预算不足'],
  ADVERTISER_PAYMENT_FAILURE: ['ADVERTISER_PAYMENT_FAILURE', '广告主支付失败'],
  TARGETING_CLAUSE_STATUS_LIVE: ['TARGETING_CLAUSE_STATUS_LIVE', '正在投放'],
  TARGETING_CLAUSE_PAUSED: ['TARGETING_CLAUSE_PAUSED', '投放暂停'],
  OTHER: ['OTHER', '其他'],
})

export const TARGET_TITLE = defineEnum({
  QUERY_HIGH_REL_MATCHES: ['QUERY_HIGH_REL_MATCHES', '自动投放-紧密匹配'],
  QUERY_BROAD_REL_MATCHES: ['QUERY_BROAD_REL_MATCHES', '自动投放-宽泛匹配'],
  ASIN_ACCESSORY_RELATED: ['ASIN_ACCESSORY_RELATED', '自动投放-关联匹配'],
  ASIN_SUBSTITUTE_RELATED: ['ASIN_SUBSTITUTE_RELATED', '自动投放-同类匹配'],
  ASIN_EXPANDED_FROM: ['ASIN_EXPANDED_FROM', '商品投放-商品拓展'],
  ASIN_SAME_AS: ['ASIN_SAME_AS', '商品投放-商品精准'],
  ASIN_SAME_AS_LOW: ['asinSameAs', '商品投放-商品精准'],
  asinBrandSameAs: ['asinBrandSameAs', '商品投放-商品精准'],
  asinCategorySameAs: ['asinCategorySameAs', '商品投放-分类'],
  ASIN_CATEGORY_SAME_AS: ['ASIN_CATEGORY_SAME_AS', '商品投放-分类'],
  similarProduct: ['similarProduct', '商品投放-分类'],
  EXACT: ['EXACT', '关键词-精确'],
  PHRASE: ['PHRASE', '关键词-词组'],
  BROAD: ['BROAD', '关键词-广泛'],
  VIEWS: ['views', '受众-浏览再营销'],
  AUDIENCE: ['audience', '受众-受众'],
  PURCHASES: ['purchases', '受众-购买再营销'],
})

export const TARGETING_TYPE = defineEnum({
  AUTO: ['AUTO', '自动投放'],
  MANUAL: ['MANUAL', '手动投放'],
  KEYWORD: ['KEYWORD', '关键字'],
  TARGET: ['TARGET', '商品投放'],
  AUTOMATIC_PLACEMENT: ['KEYWORD_TARGET', '关键字/商品投放'],
  T00020: ['T00020', '内容投放'],
  T00030: ['T00030', '受众'],
})

export const TIME_SHARING_TYPE = defineEnum({
  BUDGET: [1, '分时调预算'],
  STATE: [2, '分时启停'],
  PLACEMENT: [3, '分时调广告位'],
  BID: [4, '分时调竞价'],
  BUDGET_PERCENT: [5, '分时预算/按百分比分配'],
})
export type enumTimeSharingType = ReturnType<typeof TIME_SHARING_TYPE.getEnum>

export const ADS_PLACEMENT_TYPE = defineEnum({
  TOP_OF_SEARCH_ON_AMAZON: ['Top of Search on-Amazon', '搜索结果顶部(首页)'],
  OTHER_ON_AMAZON: ['Other on-Amazon', '搜索结果的其余位置'],
  DETAIL_PAGE_ON_AMAZON: ['Detail Page on-Amazon', '商品页面'],
  HOMEPAGE: ['Homepage on-Amazon', '首页'],
  OFF_AMAZON: ['Off Amazon', '亚马逊站外'],
  SITE_AMAZON_BUSINESS: ['Site Amazon Business', '企业购广告位'],
})

export const DATA_EXPORT_REPORT_TYPE = defineEnum({
  AD_COMBINATION: ['AD_COMBINATION', '广告组合'],
  CAMPAIGN: ['CAMPAIGN', '活动'],
  AD_GROUP: ['AD_GROUP', '广告组'],
  AD_PLACEMENT: ['AD_PLACEMENT', '广告位'],
  AD_PRODUCT: ['AD_PRODUCT', '广告商品'],
  AD: ['AD', '广告'],
  TARGET: ['TARGET', '投放'],
  NEGATIVE_TARGET: ['NEGATIVE_TARGET', '否定投放'],
  SEARCH_TERM: ['SEARCH_TERM', '搜索词'],
  KEYWORD_FREQUENCY: ['KEYWORD_FREQUENCY', '词频'],
  ABA_SEARCH_TERM: ['ABA', 'ABA搜索词'],
})

export const DATA_EXPORT_TASK_STATUS = defineEnum({
  PROCESSING: [1, '处理中'],
  COMPLETED: [5, '已完成'],
  FAILED: [10, '生成失败'],
})

export const ADS_TARGET_TYPE = defineEnum({
  KEYWORD_PLACEMENT: [0, '关键词投放'],
  PRODUCT_PLACEMENT: [1, '商品投放'],
  CONTENT_RELATIVE_PLACEMENT: [2, '内容相关投放'],
  AUDIENCE: [3, '受众'],
  AUTOMATIC_PLACEMENT: [4, '自动投放'],
})

export const TIME_SHARING_ADJUST_TYPE = defineEnum({
  TIME: [0, '按时间'],
  PERFORMANCE: [1, '按表现'],
})
export type enumTimeSharingAdjustType = ReturnType<typeof TIME_SHARING_ADJUST_TYPE.getEnum>

export const TIME_SHARING_ADJUST_FREQUENCY = defineEnum({
  DAY: [0, '按天 '],
  WEEK: [1, '按周'],
})

export const TIME_SHARING_STRATEGY_TIMES_ADJUST_TYPE = defineEnum({
  UP: [1, '按金额提高'],
  UP_PERCENT: [2, '按百分比提高'],
  SET: [3, '直接设置为'],
  DOWN: [4, '按金额降低'],
  DOWN_PERCENT: [5, '按百分比降低'],
})

export const TIME_SHARING_STRATEGY_STATE = defineEnum({
  ENABLED: ['ENABLED', '启动'],
  PAUSED: ['PAUSED', '暂停'],
})

export const TIME_SHARING_STRATEGY_VIEW_TYPE = defineEnum({
  CALENDAR: [0, '日历'],
  LIST: [1, '列表'],
})
export type enumTimeSharingStrategyViewType = ReturnType<typeof TIME_SHARING_STRATEGY_VIEW_TYPE.getEnum>

export const TIME_SHARING_STRATEGY_STATUS = defineEnum({
  PAUSED: [0, '暂停'],
  ENABLED: [1, '启用'],
})

export const TIME_SHARING_STRATEGY_POSITIVE_EFFECT_TYPE = defineEnum({
  AVAILABLE: [1, '当日可用预算'],
  EXCEED: [2, '超出预算'],
})

export const TIME_SHARING_STRATEGY_NEGATIVE_EFFECT_TYPE = defineEnum({
  REMAIN: [1, '当日预算有剩余'],
})

export const TIME_SHARING_STRATEGY_EFFECT_CRITERIA_TYPE = defineEnum({
  CLICK: [1, '当日点击量'],
  CTR: [2, '当日CTR'],
  ORDER_COUNT: [3, '当日广告订单量'],
  SALE_AMOUNT: [4, '当日销售额'],
  CVR: [5, '当日CVR'],
  ACOS: [6, '当日ACOS'],
  ROAS: [7, '当日ROAS'],
})

export const TIME_SHARING_STRATEGY_SYMBOL_TYPE = defineEnum({
  PLUS: [1, '≤'],
  MINUS: [2, '≥'],
})

export const TIME_SHARING_POSITIVE_EFFECT_BUDGET_TYPE = defineEnum({
  AMOUNT: [1, '按金额'],
  PERCENT: [2, '按百分比'],
})

export const TIME_SHARING_BASE_BID_TYPE = defineEnum({
  SET: [0, '设置基准竞价 '],
  BID: [1, '应用策略时的广告竞价'],
  LATEST: [2, '每次执行时取亚马逊后台最新竞价'],
})

export const TIME_SHARING_BASE_BUDGET_TYPE = defineEnum({
  SET: [0, '设置基准预算 '],
  BUDGET: [1, '应用策略时的广告预算'],
  LATEST: [2, '每次执行时去亚马逊后台最新预算'],
})
