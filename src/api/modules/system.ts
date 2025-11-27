const { getApiFunction } = useRequest()

export const authzFunctionsTree = getApiFunction('get', 'authz/functions/tree')
export const authzFunctionsGet = (id: number) => getApiFunction('get', `authz/functions/${id}`)
export const authzFunctionsPost = getApiFunction('post', 'authz/functions')
export const authzFunctionsPut = getApiFunction('put', 'authz/functions')
export const authzFunctionsDelete = (id: number) => getApiFunction('delete', `authz/functions/${id}`)
export const authzRolesFunctionsGet = (id: number) => getApiFunction('get', `authz/roles/function/${id}`)
