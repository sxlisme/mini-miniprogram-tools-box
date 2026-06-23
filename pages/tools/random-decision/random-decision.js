const WHEEL_COLOR_PALETTE = [
  '#FF6B35', '#E74C3C', '#3498DB', '#F39C12', '#2ECC71',
  '#9B59B6', '#1ABC9C', '#E67E22', '#2980B9', '#D35400',
  '#16A085', '#C0392B', '#8E44AD', '#27AE60', '#2C3E50',
  '#F1C40F', '#00BCD4', '#E91E63', '#795548', '#FF5722'
]

Page({
  data: {
    mode: 'wheel',

    // 转盘
    wheelDefaultOptions: ['火锅', '烧烤', '烤鱼', '麻辣烫', '炒菜'],
    wheelOptions: ['火锅', '烧烤', '烤鱼', '麻辣烫', '炒菜'],
    wheelCustomInput: '',
    wheelAngle: 0,
    wheelSpinning: false,
    wheelResult: '',

    // 骰子
    diceCount: 1,
    diceResults: [],
    diceSum: 0,

    // 硬币
    coinResult: '🪙',

    // 自定义
    customOptions: '',
    parsedOptions: [],
    customResult: '',

    // 动画状态
    result: { rolling: false }
  },

  onReady() {
    this.initWheel()
  },

  onLoad() {
    // 初始化骰子
    this.rollDice()
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      mode,
      coinResult: '🪙',
      customResult: '',
      wheelResult: mode === 'wheel' ? this.data.wheelResult : '',
      diceResults: mode === 'dice' ? this.data.diceResults : [],
      result: { rolling: false }
    })
    if (mode === 'dice' && this.data.diceResults.length === 0) {
      this.rollDice()
    }
    if (mode === 'wheel') {
      // 延迟绘制确保 canvas 渲染完成
      setTimeout(() => this.drawWheel(), 100)
    }
  },

  // === 骰子 ===
  onDiceCount(e) {
    this.setData({ diceCount: e.detail.value })
  },

  rollDice() {
    const count = this.data.diceCount
    this.setData({ result: { rolling: true } })

    // 滚动动画
    let tick = 0
    const interval = setInterval(() => {
      const temp = []
      for (let i = 0; i < count; i++) {
        temp.push(Math.floor(Math.random() * 6) + 1)
      }
      this.setData({ diceResults: temp })
      tick++
      if (tick > 12) {
        clearInterval(interval)
        // 最终结果
        const final = []
        for (let i = 0; i < count; i++) {
          final.push(Math.floor(Math.random() * 6) + 1)
        }
        this.setData({
          diceResults: final,
          diceSum: final.reduce((a, b) => a + b, 0),
          result: { rolling: false }
        })
      }
    }, 80)
  },

  // === 硬币 ===
  flipCoin() {
    this.setData({ result: { rolling: true } })
    const sides = ['正面', '反面', '正面', '反面', '正面', '反面']
    let tick = 0
    const interval = setInterval(() => {
      this.setData({ coinResult: sides[tick % 6] })
      tick++
      if (tick > 10) {
        clearInterval(interval)
        const final = Math.random() > 0.5 ? '正面' : '反面'
        this.setData({ coinResult: final, result: { rolling: false } })
      }
    }, 100)
  },

  // === 自定义 ===
  onCustomInput(e) {
    const val = e.detail.value
    const options = val.split('\n').map(s => s.trim()).filter(s => s.length > 0)
    this.setData({ customOptions: val, parsedOptions: options, customResult: '' })
  },

  randomPick() {
    const { parsedOptions } = this.data
    if (parsedOptions.length < 2) return

    this.setData({ result: { rolling: true }, customResult: '' })

    // 滚动效果
    let tick = 0
    const interval = setInterval(() => {
      this.setData({ customResult: parsedOptions[Math.floor(Math.random() * parsedOptions.length)] })
      tick++
      if (tick > 15) {
        clearInterval(interval)
        const final = parsedOptions[Math.floor(Math.random() * parsedOptions.length)]
        this.setData({ customResult: final, result: { rolling: false } })
      }
    }, 60)
  },

  /* ========= 转盘 ========= */
  onWheelInput(e) {
    let val = e.detail.value
    let options = val.split('\n').map(s => s.trim()).filter(s => s.length > 0)
    if (options.length > 20) {
      wx.showToast({ title: '最多20个选项', icon: 'none', duration: 1200 })
      options = options.slice(0, 20)
      val = options.join('\n')
    }
    const effective = options.length >= 2 ? options : this.data.wheelDefaultOptions
    this.setData({
      wheelCustomInput: val,
      wheelOptions: effective,
      wheelResult: ''
    }, () => {
      this.drawWheel()
    })
  },

  initWheel() {
    const query = wx.createSelectorQuery()
    query.select('#wheelCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        const w = res[0].width
        const h = res[0].height
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)
        this._wheelCtx = ctx
        this._wheelCanvas = canvas
        this._wheelW = w
        this._wheelH = h
        this.drawWheel()
      })
  },

  drawWheel() {
    const ctx = this._wheelCtx
    if (!ctx) return
    const w = this._wheelW
    const h = this._wheelH
    const cx = w / 2
    const cy = h / 2
    const radius = cx - 12
    const { wheelOptions, wheelAngle } = this.data
    const count = wheelOptions.length
    const arcSize = (2 * Math.PI) / count
    const colors = WHEEL_COLOR_PALETTE

    // 自适应字号：5个→16px，20个→8px，线性缩放
    const fontSize = Math.max(8, Math.min(16, Math.round(18 - count * 0.5)))

    ctx.clearRect(0, 0, w, h)

    // 绘制扇区
    for (let i = 0; i < count; i++) {
      const startAngle = -Math.PI / 2 + i * arcSize + wheelAngle
      const endAngle = startAngle + arcSize

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()

      // 白色分隔线
      ctx.strokeStyle = '#FFF'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 绘制文字
    for (let i = 0; i < count; i++) {
      const midAngle = -Math.PI / 2 + i * arcSize + arcSize / 2 + wheelAngle
      ctx.save()
      ctx.translate(cx, cy)
      let textAngle = midAngle
      let textX = radius * 0.65
      if (midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5) {
        textAngle += Math.PI
        textX = -radius * 0.65
      }
      ctx.rotate(textAngle)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#FFF'
      ctx.font = 'bold ' + fontSize + 'px sans-serif'
      const label = wheelOptions[i]
      // 如果文字太长，截断并加省略号
      const maxChars = count <= 8 ? 8 : count <= 15 ? 5 : 4
      const text = label.length > maxChars ? label.slice(0, maxChars) + '..' : label
      ctx.fillText(text, textX, 0)
      ctx.restore()
    }

    // 中心圆
    ctx.beginPath()
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFF'
    ctx.fill()
    ctx.strokeStyle = '#EEE'
    ctx.lineWidth = 2
    ctx.stroke()
  },

  spinWheel() {
    if (this.data.wheelSpinning) return

    const { wheelOptions, wheelAngle } = this.data
    const count = wheelOptions.length
    const arcSizeRad = (2 * Math.PI) / count
    const TWO_PI = 2 * Math.PI

    // 随机选择目标
    const targetIndex = Math.floor(Math.random() * count)
    this._targetIndex = targetIndex

    // 扇区 i 中心在绘制坐标系中的绝对角度 = -π/2 + i*arcSizeRad + arcSizeRad/2
    // 想要指针 (12点方向，即 -π/2 或 3π/2) 对准扇区 i 中心
    // 需要 wheelAngle + 扇区i中心 ≡ -π/2 (mod 2π)
    // wheelAngle ≡ -i*arcSizeRad - arcSizeRad/2 (mod 2π)
    const targetAngle = (TWO_PI - (targetIndex * arcSizeRad + arcSizeRad / 2)) % TWO_PI

    // 当前归一化角度
    const currentNorm = ((wheelAngle % TWO_PI) + TWO_PI) % TWO_PI

    // 从当前位置到目标需要旋转的弧度
    let delta = targetAngle - currentNorm
    if (delta < 0) delta += TWO_PI

    // 加入扇区内的随机偏移 (±0.35 个扇区)
    const offset = (Math.random() - 0.5) * arcSizeRad * 0.7

    // 多圈旋转
    const fullRounds = (5 + Math.floor(Math.random() * 4)) * TWO_PI
    const totalSpin = fullRounds + delta + offset

    this.setData({ wheelSpinning: true, wheelResult: '' })

    const startAngle = wheelAngle
    const duration = 3200
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out quintic
      const eased = 1 - Math.pow(1 - progress, 5)
      const currentAngle = startAngle + totalSpin * eased

      this.setData({ wheelAngle: currentAngle })
      this.drawWheel()

      if (progress < 1) {
        setTimeout(animate, 16)
      } else {
        this.setData({
          wheelAngle: currentAngle,
          wheelSpinning: false,
          wheelResult: wheelOptions[targetIndex]
        })
        this.drawWheel()
        wx.vibrateShort({ type: 'medium' })
      }
    }

    animate()
  }
})
