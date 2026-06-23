const app = getApp()

Page({
  data: {
    userInfo: {},
    loginRecords: [],
    showNickModal: false,
    nickInput: ''
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.loadData()
  },

  loadData() {
    const userInfo = app.globalData.userInfo
    const loginRecords = app.getLoginRecords()
    // 只显示最近 20 条
    this.setData({
      userInfo,
      loginRecords: loginRecords.slice(-20).reverse()
    })
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    app.updateUserInfo({ avatarUrl })
    this.loadData()
    wx.showToast({ title: '头像已更新', icon: 'success', duration: 1500 })
  },

  // 修改昵称
  showNickModal() {
    this.setData({
      showNickModal: true,
      nickInput: this.data.userInfo.nickName || ''
    })
  },

  onNickInput(e) {
    this.setData({ nickInput: e.detail.value })
  },

  confirmNick() {
    const nickName = this.data.nickInput.trim()
    if (!nickName) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    app.updateUserInfo({ nickName })
    this.setData({ showNickModal: false })
    this.loadData()
    wx.showToast({ title: '昵称已更新', icon: 'success', duration: 1500 })
  },

  cancelNick() {
    this.setData({ showNickModal: false })
  },

  // 清除所有数据
  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '将清除所有个人数据（头像、昵称、收藏、登录记录），确定继续？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          app.globalData.userInfo = null
          app.globalData.favorites = []
          app.globalData.loginRecords = []
          this.loadData()
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  }
})