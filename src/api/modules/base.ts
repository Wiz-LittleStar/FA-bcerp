const { getApiFunction } = useRequest()

export const sysDictionaryGet = (uniqueNames: string) => getApiFunction('get', `bcerp-base/sys-dictionary/get/${uniqueNames}`)
export const ouUser = getApiFunction('post', 'bcerp-base/ou/user')
