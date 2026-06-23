const app = getApp()

Page({
  data: {
    favorites: []
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    this.loadFavorites()
  },

  loadFavorites() {
    const favIds = app.globalData.favorites
    const allTools = app.globalData.tools
    const favorites = allTools.filter(t => favIds.indexOf(t.id) > -1)
    this.setData({ favorites })
  },

  openTool(e) {
    const tool = e.currentTarget.dataset.tool
    wx.navigateTo({ url: tool.path })
  },

  removeFav(e) {
    const toolId = e.currentTarget.dataset.id
    app.toggleFavorite(toolId)
    wx.showToast({ title: '已取消收藏', icon: 'none', duration: 1000 })
    this.loadFavorites()
  }
})