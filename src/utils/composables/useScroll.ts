import { debounce } from 'es-toolkit'

export default function useScroll(key: string) {
  const scrollContainer = ref()
  const scrollPositionKey = `scroll_position_${key}`
  let scrollHandler: (() => void) | null = null

  /**
   * 保存滚动位置到 sessionStorage
   */
  function saveScrollPosition() {
    if (scrollContainer.value) {
      const scrollTop = scrollContainer.value.scrollTop
      sessionStorage.setItem(scrollPositionKey, scrollTop.toString())
    }
  }

  /**
   * 从 sessionStorage 恢复滚动位置
   */
  function restoreScrollPosition() {
    nextTick(() => {
      if (scrollContainer.value) {
        const savedScrollTop = sessionStorage.getItem(scrollPositionKey)
        if (savedScrollTop) {
          const scrollTop = Number.parseInt(savedScrollTop, 10)
          scrollContainer.value.scrollTop = scrollTop
        }
      }
    })
  }

  /**
   * 清除保存的滚动位置
   */
  function clearScrollPosition() {
    sessionStorage.removeItem(scrollPositionKey)
  }

  /**
   * 设置滚动事件监听器
   */
  function setupScrollListener() {
    if (scrollContainer.value && !scrollHandler) {
      // 防抖保存滚动位置
      scrollHandler = debounce(() => {
        saveScrollPosition()
      }, 1000)
      scrollContainer.value.addEventListener('scroll', scrollHandler, { passive: true })
    }
  }

  /**
   * 移除滚动事件监听器
   */
  function removeScrollListener() {
    if (scrollContainer.value && scrollHandler) {
      scrollContainer.value.removeEventListener('scroll', scrollHandler)
      scrollHandler = null
    }
  }

  // 监听 scrollContainer 的变化，设置滚动监听器
  watch(scrollContainer, (newContainer, oldContainer) => {
    if (oldContainer && scrollHandler) {
      oldContainer.removeEventListener('scroll', scrollHandler)
    }
    if (newContainer) {
      setupScrollListener()
    }
  })

  onBeforeUnmount(() => {
    removeScrollListener()
  })

  return {
    scrollContainer,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  }
}
