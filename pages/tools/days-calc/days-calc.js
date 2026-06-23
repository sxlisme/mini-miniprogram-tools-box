Page({
  data: {
    startDate: '',
    endDate: '',
    includeEnd: true,
    result: null
  },

  onReady() {
    const today = this.formatDateStr(new Date())
    this.setData({
      startDate: today,
      endDate: today
    })
  },

  formatDateStr(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  onStartChange(e) {
    this.setData({ startDate: e.detail.value, result: null })
  },

  onEndChange(e) {
    this.setData({ endDate: e.detail.value, result: null })
  },

  toggleInclude() {
    this.setData({ includeEnd: !this.data.includeEnd, result: null })
  },

  calculate() {
    const { startDate, endDate, includeEnd } = this.data
    if (!startDate || !endDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }

    const start = new Date(startDate.replace(/-/g, '/'))
    const end = new Date(endDate.replace(/-/g, '/'))
    const diffMs = end.getTime() - start.getTime()
    let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (includeEnd && diffMs >= 0) {
      diffDays += 1
    }

    const absDays = Math.abs(diffDays)

    // 计算年/月/日分解
    let remain = absDays
    const years = Math.floor(remain / 365)
    remain -= years * 365
    const months = Math.floor(remain / 30)
    remain -= months * 30
    const days = remain

    // 计算周数
    const weeks = Math.floor(absDays / 7)
    const remDays = absDays % 7

    // 工作日估算（粗略）
    const totalWeeks = Math.floor(absDays / 7)
    let workdays = totalWeeks * 5
    for (let i = 0; i < absDays % 7; i++) {
      const d = new Date(start.getTime() + (diffMs >= 0 ? 1 : -1) * i * 86400000)
      const day = d.getDay()
      if (day !== 0 && day !== 6) workdays++
    }
    if (!includeEnd && diffMs >= 0) workdays = Math.max(0, workdays - 1)

    this.setData({
      result: {
        totalDays: absDays,
        direction: diffMs >= 0 ? '之后' : '之前',
        years,
        months,
        days,
        weeks,
        remDays,
        workdays
      }
    })
  }
})