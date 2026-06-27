const copywritingData = require('./copywriting-data.js')
const STORAGE_KEY = 'copywriting_copied_map'

Page({
  data: {
    tab: 'desk',
    list: []
  },

  onLoad() {
    this.loadData('desk')
  },

  /** 读取已复制记录的持久化映射 { desk_1: true, emotion_3: true } */
  getCopiedMap() {
    try {
      return wx.getStorageSync(STORAGE_KEY) || {}
    } catch (_) {
      return {}
    }
  },

  /** 持久化单条已复制记录 */
  setCopiedItem(tab, id) {
    const map = this.getCopiedMap()
    map[`${tab}_${id}`] = true
    wx.setStorageSync(STORAGE_KEY, map)
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ tab })
    this.loadData(tab)
  },

  loadData(tab) {
    let list = []
    if (tab === 'desk') {
      list = copywritingData.deskSetup
    } else if (tab === 'emotion') {
      list = copywritingData.emotion
    } else {
      list = copywritingData.other
    }

    const copiedMap = this.getCopiedMap()

    // 预计算字符数 + 标记已复制状态 + 复制过的排到底部
    list = list
      .map(item => ({
        ...item,
        titleChars: this.countChars(item.title),
        copied: !!copiedMap[`${tab}_${item.id}`]
      }))
      .sort((a, b) => (a.copied ? 1 : 0) - (b.copied ? 1 : 0))

    this.setData({ list })
  },

  /** 中文 1 字 1 字符，英文/英文符号/空格 2 个算 1 字符 */
  countChars(str) {
    if (!str) return 0
    let count = 0
    for (let i = 0; i < str.length; i++) {
      const ch = str[i]
      // 中文、全角标点、emoji → 1 字符
      if (/[\u3000-\u303F\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/.test(ch)) {
        count += 1
      } else if (ch.charCodeAt(0) <= 0x7F) {
        // ASCII（英文/数字/英文标点/空格）→ 0.5 字符
        count += 0.5
      } else {
        // 其他非 ASCII（emoji、特殊符号等）→ 1 字符
        count += 1
      }
    }
    return Math.ceil(count)
  },

  copyItem(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.list[index]
    const tab = this.data.tab
    let text = ''

    if (tab === 'desk') {
      text = this.buildDeskText(item)
    } else if (tab === 'emotion') {
      text = this.buildEmotionText(item)
    } else {
      text = this.buildOtherText(item)
    }

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制，移到底部啦', icon: 'success', duration: 2000 })
        // 持久化已复制标记
        this.setCopiedItem(tab, item.id)
        // 从列表中移除该项，追加到底部并标记已复制
        const list = [...this.data.list]
        const [moved] = list.splice(index, 1)
        moved.copied = true
        list.push(moved)
        this.setData({ list })
      }
    })
  },

  buildDeskText(item) {
    let parts = []
    if (item.cover) parts.push(item.cover)
    parts.push(item.title)
    parts.push('')
    parts.push(item.content)
    parts.push('')
    if (item.quote) {
      parts.push('🌿 ' + item.quote)
      parts.push('')
    }
    if (item.interaction) {
      parts.push('💬 ' + item.interaction)
      parts.push('')
    }
    return parts.join('\n')
  },

  buildEmotionText(item) {
    let parts = []
    parts.push(item.title)
    parts.push('')
    parts.push(item.content)
    return parts.join('\n')
  },

  buildOtherText(item) {
    let parts = []
    parts.push(item.title)
    parts.push('')
    parts.push(item.content)
    parts.push('')
    return parts.join('\n')
  }
})
