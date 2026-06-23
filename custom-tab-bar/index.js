Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: 'home' },
      { pagePath: '/pages/favorites/favorites', text: '收藏', icon: 'star' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'user' }
    ]
  },

  lifetimes: {
    attached() {
      console.log('[tab-bar] 组件 attached')
    },
    ready() {
      console.log('[tab-bar] 组件 ready')
    }
  },
  methods: {
    onTouchStart(e) {
      console.log('[tab-bar] touchstart 触发', e.currentTarget.dataset.url)
    },
    switchTab(e) {
      console.log('[tab-bar] switchTab 被点击了', e)
      const data = e.currentTarget.dataset
      console.log('[tab-bar] dataset:', data)
      const url = data.url
      if (!url) {
        console.log('[tab-bar] url 为空，return')
        return
      }
      wx.switchTab({
        url,
        success: () => console.log('[tab-bar] switchTab 成功:', url),
        fail: (err) => console.log('[tab-bar] switchTab 失败:', err)
      })
    }
  }
})
