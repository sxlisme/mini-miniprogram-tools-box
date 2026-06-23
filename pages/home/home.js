const app = getApp()

Page({
  data: {
    tools: []
  },

  onShow() {
    // Update tab bar selection
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.loadTools()
  },

  loadTools() {
    const appTools = app.globalData.tools
    const favorites = app.globalData.favorites
    const tools = appTools.map(t => ({
      ...t,
      isFav: favorites.indexOf(t.id) > -1
    }))
    this.setData({ tools })
  },

  openTool(e) {
    const tool = e.currentTarget.dataset.tool
    wx.navigateTo({ url: tool.path })
  },

  toggleFav(e) {
    const toolId = e.currentTarget.dataset.id
    const added = app.toggleFavorite(toolId)
    wx.showToast({
      title: added ? '已收藏' : '已取消收藏',
      icon: 'none',
      duration: 1000
    })
    this.loadTools()
  }
})