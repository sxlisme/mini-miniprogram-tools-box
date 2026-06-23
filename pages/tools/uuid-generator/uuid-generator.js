Page({
  data: {
    uuid: '',
    history: [],
    showBatch: false,
    batchCount: 5
  },

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },

  generateOne() {
    const uuid = this.generateUUID()
    const history = [uuid, ...this.data.history].slice(0, 30)
    this.setData({ uuid, history, showBatch: false })
  },

  generateMany() {
    this.setData({ showBatch: !this.data.showBatch })
  },

  onCountChange(e) {
    this.setData({ batchCount: e.detail.value })
  },

  doBatchGenerate() {
    const uuids = []
    for (let i = 0; i < this.data.batchCount; i++) {
      uuids.push(this.generateUUID())
    }
    const uuid = uuids[0]
    const history = [...uuids, ...this.data.history].slice(0, 30)
    this.setData({ uuid, history, showBatch: false })
  },

  copyOne(e) {
    const uuid = e.currentTarget.dataset.uuid
    wx.setClipboardData({
      data: uuid,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  copyAll() {
    const text = this.data.history.join('\n')
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: `已复制 ${this.data.history.length} 条`, icon: 'success' })
    })
  },

  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: res => {
        if (res.confirm) {
          this.setData({ history: [], uuid: '' })
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }
})
