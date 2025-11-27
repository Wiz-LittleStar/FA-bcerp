import { defineEnum } from '@/utils/enum'

export const PRODUCT_SALE_STATUS = defineEnum({
  PRE_SELL: [1, '预售'],
  SALE: [2, '在售'],
  CLEAR: [3, '清货'],
  STOP: [4, '停售'],
})

export const AMAZON_PRODUCT_SALE_STATUS = defineEnum({
  SALE: [0, '在售'],
  STOP: [1, '停售'],
  DELETE: [2, '删除'],
  INCPMPLETE: [3, '不完整'],
})
