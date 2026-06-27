Page({
  data: {
    text: '',
    stats: {
      total: 0,
      chinese: 0,
      letters: 0,
      numbers: 0,
      spaces: 0,
      punctuation: 0,
      lines: 0,
      paragraphs: 0,
      xhsCount: 0
    }
  },

  onInput(e) {
    const text = e.detail.value
    this.setData({ text })
    this.calcStats(text)
  },

  calcStats(text) {
    if (!text) {
      this.setData({
        stats: { total: 0, chinese: 0, letters: 0, numbers: 0, spaces: 0, punctuation: 0, lines: 0, paragraphs: 0, xhsCount: 0 }
      })
      return
    }

    const total = text.length

    // 中文字符 (包括中文标点)
    const chinese = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303F\uff00-\uffef]/g) || []).length

    // 英文字母
    const letters = (text.match(/[a-zA-Z]/g) || []).length

    // 数字
    const numbers = (text.match(/[0-9]/g) || []).length

    // 空格 (包括全角空格)
    const spaces = (text.match(/[\s\u3000]/g) || []).length

    // 标点符号 (排除中文字、英文字母、数字、空格)
    const punctuation = (text.match(/[^\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303F\uff00-\uffefa-zA-Z0-9\s\u3000]/g) || []).length

    // 行数
    const lines = text === '' ? 0 : text.split('\n').length

    // 段落数 (连续换行分隔)
    const paragraphs = text === '' ? 0 : text.split(/\n\n+/).filter(p => p.trim().length > 0).length || (text.trim() ? 1 : 0)

    // 小红书字数: 中文/中文标点 1:1, 英文/英文标点/空格 2字=1字符
    const xhsCount = this.countXHSChars(text)

    this.setData({
      stats: { total, chinese, letters, numbers, spaces, punctuation, lines, paragraphs, xhsCount }
    })
  },

  countXHSChars(str) {
    if (!str) return 0
    let count = 0
    for (let i = 0; i < str.length; i++) {
      const ch = str[i]
      if (/[\u3000-\u303F\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\uff00-\uffef]/.test(ch)) {
        count += 1
      } else if (ch.charCodeAt(0) <= 0x7F) {
        count += 0.5
      } else {
        count += 1
      }
    }
    return Math.ceil(count)
  },

  clearText() {
    this.setData({ text: '' })
    this.calcStats('')
  }
})
