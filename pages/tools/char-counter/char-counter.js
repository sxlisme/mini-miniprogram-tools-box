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
      paragraphs: 0
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
        stats: { total: 0, chinese: 0, letters: 0, numbers: 0, spaces: 0, punctuation: 0, lines: 0, paragraphs: 0 }
      })
      return
    }

    const total = text.length

    // 中文字符 (包括中文标点)
    const chinese = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length

    // 英文字母
    const letters = (text.match(/[a-zA-Z]/g) || []).length

    // 数字
    const numbers = (text.match(/[0-9]/g) || []).length

    // 空格 (包括全角空格)
    const spaces = (text.match(/[\s\u3000]/g) || []).length

    // 标点符号 (排除中文字、英文字母、数字、空格)
    const punctuation = (text.match(/[^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9\s\u3000]/g) || []).length

    // 行数
    const lines = text === '' ? 0 : text.split('\n').length

    // 段落数 (连续换行分隔)
    const paragraphs = text === '' ? 0 : text.split(/\n\n+/).filter(p => p.trim().length > 0).length || (text.trim() ? 1 : 0)

    this.setData({
      stats: { total, chinese, letters, numbers, spaces, punctuation, lines, paragraphs }
    })
  },

  clearText() {
    this.setData({ text: '' })
    this.calcStats('')
  }
})
