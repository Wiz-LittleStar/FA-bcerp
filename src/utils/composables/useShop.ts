import { amazonAdsCampaignGetAdsAuthShops } from '@/api/modules/advertise/amazon'

interface DataListResult<T> {
  dataList: Ref<T[]>
  getDataList: (params?: ObjectAny) => Promise<void>
}

export default function useShop() {
  // 创建通用函数
  const createDataListHandler = <T = any>(
    api: (params?: ObjectAny) => Promise<any>,
    defaultParams: ObjectAny = { pageNum: -1, pageSize: -1 },
    field: string = 'records',
  ): DataListResult<T> => {
    const dataList = ref<T[]>([]) as Ref<T[]>
    const getDataList = async (params = defaultParams) => {
      try {
        const { data } = await api(isObject(params) ? params : undefined)
        const result = field ? data[field] : data
        dataList.value = Array.isArray(result) ? result : []
      }
      catch (error) {
        console.error('获取数据列表失败:', error instanceof Error ? error.message : String(error))
        dataList.value = []
      }
    }
    return { dataList, getDataList }
  }

  const createShopListHandler = <T = any>(
    api: (params?: ObjectAny) => Promise<any>,
    defaultParams: ObjectAny = { pageNum: -1, pageSize: -1 },
    field = 'records',
  ): DataListResult<T> => createDataListHandler<T>(api, defaultParams, field)

  // 各平台店铺列表
  const { dataList: amazonAdsShopList, getDataList: getAmazonAdsShopList } = createShopListHandler(amazonAdsCampaignGetAdsAuthShops, {}, '')
  return {
    amazonAdsShopList,
    getAmazonAdsShopList,
  }
}
