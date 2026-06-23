Page({
  data: {
    nowTs: '',
    nowTsMs: '',
    nowTime: '',
    tsInput: '',
    tsUnit: 's',
    tsResult: '',
    tsError: '',
    dateText: '',
    timeText: '',
    datePicker: '',
    timePicker: '',
    dateResult: ''
  },

  onShow() {
    this.refreshNow()
  },

  refreshNow() {
    const now = new Date()
    const ts = Math.floor(now.getTime() / 1000)
    const tsMs = now.getTime()
    const pad = n => String(n).padStart(2, '0')
    const time = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    this.setData({ nowTs: ts, nowTsMs: tsMs, nowTime: time })
  },

  // 时间戳 → 日期
  onTsInput(e) {
    const val = e.detail.value
    this.setData({ tsInput: val, tsError: '', tsResult: '' })
    if (!val) return

    let ts = parseInt(val, 10)
    if (isNaN(ts)) {
      this.setData({ tsError: '请输入有效数字' })
      return
    }

    if (this.data.tsUnit === 's') ts *= 1000

    const d = new Date(ts)
    if (isNaN(d.getTime())) {
      this.setData({ tsError: '时间戳超出范围' })
      return
    }

    const pad = n => String(n).padStart(2, '0')
    this.setData({
      tsResult: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    })
  },

  switchUnit(e) {
    const unit = e.currentTarget.dataset.unit
    this.setData({ tsUnit: unit })
    // 重新计算
    if (this.data.tsInput) {
      this.onTsInput({ detail: { value: this.data.tsInput } })
    }
  },

  // 日期 → 时间戳
  onDateChange(e) {
    const val = e.detail.value
    this.setData({ datePicker: val, dateText: val })
    this.calcDateToTs()
  },

  onTimeChange(e) {
    const val = e.detail.value
    this.setData({ timePicker: val, timeText: val })
    this.calcDateToTs()
  },

  setNow() {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const d = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
    const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    this.setData({ datePicker: d, timePicker: t, dateText: d, timeText: t })
    this.calcDateToTs()
  },

  copyNowTs() {
    this.copyText(String(this.data.nowTs))
  },

  copyNowTsMs() {
    this.copyText(String(this.data.nowTsMs))
  },

  copyTsResult() {
    this.copyText(this.data.tsResult)
  },

  copyDateResult() {
    this.copyText(this.data.dateResult)
  },

  copyText(text) {
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  calcDateToTs() {
    const { dateText, timeText } = this.data
    if (!dateText || !timeText) {
      this.setData({ dateResult: '' })
      return
    }
    const dt = new Date(`${dateText} ${timeText}`)
    const ts = Math.floor(dt.getTime() / 1000)
    const tsMs = dt.getTime()
    this.setData({
      dateResult: `秒 (s): ${ts}\n毫秒 (ms): ${tsMs}`
    })
  }
})
