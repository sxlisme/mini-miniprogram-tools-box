Page({
  data: {
    amount: '',        // 贷款金额(万元)
    rate: '',          // 年利率(%)
    years: '',         // 贷款年限
    method: 'equal',   // equal=等额本息, principal=等额本金
    result: null       // 计算结果
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value, result: null })
  },

  onRateInput(e) {
    this.setData({ rate: e.detail.value, result: null })
  },

  onYearsInput(e) {
    this.setData({ years: e.detail.value, result: null })
  },

  onMethodChange(e) {
    this.setData({ method: e.currentTarget.dataset.method, result: null })
  },

  // 计算
  calculate() {
    const amount = parseFloat(this.data.amount)
    const rate = parseFloat(this.data.rate)
    const years = parseInt(this.data.years)

    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入有效的贷款金额', icon: 'none' })
      return
    }
    if (isNaN(rate) || rate < 0) {
      wx.showToast({ title: '请输入有效的年利率', icon: 'none' })
      return
    }
    if (!years || years <= 0) {
      wx.showToast({ title: '请输入有效的贷款年限', icon: 'none' })
      return
    }

    const loanYuan = amount * 10000
    const monthRate = rate / 100 / 12
    const months = years * 12

    let result
    if (this.data.method === 'equal') {
      result = this.calcEqualInstallment(loanYuan, monthRate, months)
    } else {
      result = this.calcEqualPrincipal(loanYuan, monthRate, months)
    }

    this.setData({ result })
  },

  // 等额本息
  calcEqualInstallment(loanYuan, monthRate, months) {
    const monthly = (loanYuan * monthRate * Math.pow(1 + monthRate, months)) /
      (Math.pow(1 + monthRate, months) - 1)
    const totalPayment = monthly * months
    const totalInterest = totalPayment - loanYuan

    return {
      monthly: monthly.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      firstMonth: monthly.toFixed(2)
    }
  },

  // 等额本金
  calcEqualPrincipal(loanYuan, monthRate, months) {
    const monthlyPrincipal = loanYuan / months
    const firstMonth = monthlyPrincipal + loanYuan * monthRate
    const lastMonth = monthlyPrincipal + monthlyPrincipal * monthRate

    let totalInterest = 0
    for (let i = 0; i < months; i++) {
      totalInterest += (loanYuan - monthlyPrincipal * i) * monthRate
    }
    const totalPayment = loanYuan + totalInterest

    return {
      firstMonth: firstMonth.toFixed(2),
      lastMonth: lastMonth.toFixed(2),
      monthlyDesc: '逐月递减',
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2)
    }
  },

  // 格式化金额
  formatMoney(num) {
    const n = parseFloat(num)
    if (isNaN(n)) return '0.00'
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
})