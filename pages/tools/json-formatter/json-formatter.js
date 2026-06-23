Page({
  data: {
    inputText: '',
    outputText: '',
    errorMsg: '',
    indent: 2,
    copied: false
  },

  onInput(e) {
    this.setData({
      inputText: e.detail.value,
      errorMsg: '',
      outputText: '',
      copied: false
    })
  },

  // 格式化
  format() {
    const input = this.data.inputText.trim()
    if (!input) {
      this.setData({ errorMsg: '请输入 JSON 内容' })
      return
    }
    try {
      const obj = JSON.parse(input)
      const formatted = JSON.stringify(obj, null, this.data.indent)
      this.setData({ outputText: formatted, errorMsg: '' })
    } catch (e) {
      this.setData({
        errorMsg: 'JSON 格式错误: ' + e.message,
        outputText: ''
      })
    }
  },

  // 压缩
  compress() {
    const input = this.data.inputText.trim()
    if (!input) {
      this.setData({ errorMsg: '请输入 JSON 内容' })
      return
    }
    try {
      const obj = JSON.parse(input)
      const compressed = JSON.stringify(obj)
      this.setData({ outputText: compressed, errorMsg: '' })
    } catch (e) {
      this.setData({
        errorMsg: 'JSON 格式错误: ' + e.message,
        outputText: ''
      })
    }
  },

  // 复制结果
  copyResult() {
    if (!this.data.outputText) return
    wx.setClipboardData({
      data: this.data.outputText,
      success: () => {
        this.setData({ copied: true })
        wx.showToast({ title: '已复制', icon: 'success' })
        setTimeout(() => {
          this.setData({ copied: false })
        }, 2000)
      }
    })
  },

  // 清空
  clearAll() {
    this.setData({
      inputText: '',
      outputText: '',
      errorMsg: '',
      copied: false
    })
  },

  // 调整缩进
  onIndentChange(e) {
    this.setData({ indent: parseInt(e.detail.value) })
    if (this.data.outputText) this.format()
  }
})