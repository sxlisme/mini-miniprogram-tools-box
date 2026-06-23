Page({
  data: {
    mode: 0, // 0=计算间隔, 1=计算时长

    // Mode 0: 反推间隔
    shootHours0: 1,
    shootMinutes0: 0,
    videoSeconds0: 15,
    fps0: 30,

    // Mode 1: 正推时长
    interval1: 5,
    shootHours1: 1,
    shootMinutes1: 0,
    fps1: 30,

    // Results
    resultInterval: 0,
    resultPhotos: 0,
    resultVideoSeconds: 0,
    resultVideoMinute: 0,
    resultVideoRemainSec: 0,
    resultStorage: '',
    resultEndTime: '',
    resultShootDuration: '',
    hasCalc: false,

    // FPS options
    fpsOptions: [
      { value: 24, label: '24' },
      { value: 25, label: '25' },
      { value: 30, label: '30' },
      { value: 60, label: '60' }
    ],

    // Presets
    presets: [
      { name: '日落', hours: 0, minutes: 30, video: 15, icon: 'sunny' },
      { name: '星轨', hours: 2, minutes: 0, video: 30, icon: 'star' },
      { name: '云海', hours: 1, minutes: 0, video: 20, icon: 'cloud' },
      { name: '花开', hours: 6, minutes: 0, video: 60, icon: 'flower' }
    ]
  },

  switchMode(e) {
    const mode = parseInt(e.currentTarget.dataset.mode)
    this.setData({ mode, hasCalc: false })
    this.calc()
  },

  // ===== Mode 0 =====
  onShootHours0(e) { this.setData({ shootHours0: Math.max(0, parseInt(e.detail.value) || 0) }); this.calc() },
  onShootMinutes0(e) { this.setData({ shootMinutes0: Math.max(0, Math.min(59, parseInt(e.detail.value) || 0)) }); this.calc() },
  onVideoSeconds0(e) { this.setData({ videoSeconds0: Math.max(1, parseInt(e.detail.value) || 1) }); this.calc() },
  onFps0Change(e) { this.setData({ fps0: parseInt(e.currentTarget.dataset.value) }); this.calc() },

  // ===== Mode 1 =====
  onInterval1(e) {
    // 允许用户清空输入，不强制设为 1
    const raw = e.detail.value
    const val = raw === '' ? '' : parseInt(raw)
    this.setData({ interval1: val })
    this.calc()
  },
  onShootHours1(e) { this.setData({ shootHours1: Math.max(0, parseInt(e.detail.value) || 0) }); this.calc() },
  onShootMinutes1(e) { this.setData({ shootMinutes1: Math.max(0, Math.min(59, parseInt(e.detail.value) || 0)) }); this.calc() },
  onFps1Change(e) { this.setData({ fps1: parseInt(e.currentTarget.dataset.value) }); this.calc() },

  // ===== Presets =====
  applyPreset(e) {
    const preset = this.data.presets[e.currentTarget.dataset.index]
    if (this.data.mode === 0) {
      this.setData({
        shootHours0: preset.hours,
        shootMinutes0: preset.minutes,
        videoSeconds0: preset.video
      })
    } else {
      this.setData({
        shootHours1: preset.hours,
        shootMinutes1: preset.minutes
      })
    }
    this.calc()
  },

  // ===== Core calculation =====
  calc() {
    let totalShootSec, fps, resultInterval, totalPhotos, videoSec

    if (this.data.mode === 0) {
      // Mode 0: 计算间隔
      totalShootSec = this.data.shootHours0 * 3600 + this.data.shootMinutes0 * 60
      fps = this.data.fps0
      const targetFrames = this.data.videoSeconds0 * fps

      if (totalShootSec <= 0 || targetFrames <= 0) {
        this.setData({ hasCalc: false })
        return
      }

      resultInterval = totalShootSec / targetFrames
      totalPhotos = targetFrames
      videoSec = this.data.videoSeconds0
    } else {
      // Mode 1: 计算时长
      totalShootSec = this.data.shootHours1 * 3600 + this.data.shootMinutes1 * 60
      fps = this.data.fps1
      const interval1 = this.data.interval1

      // interval1 可能为空字符串（用户清空了）
      if (totalShootSec <= 0 || interval1 === '' || interval1 <= 0 || fps <= 0) {
        this.setData({ hasCalc: false })
        return
      }

      totalPhotos = Math.floor(totalShootSec / interval1)
      videoSec = totalPhotos / fps
      resultInterval = interval1
    }

    // Storage estimation: 3MB per photo
    const totalMB = totalPhotos * 3
    const storageStr = this.formatStorage(totalMB)

    const videoMinute = Math.floor(videoSec / 60)
    const videoRemainSec = Math.round(videoSec % 60)

    // 预计结束时间
    const endTimeStr = this.formatEndTime(totalShootSec)

    // 拍摄耗时（人类友好格式）
    const shootDurationStr = this.formatDuration(totalShootSec)

    this.setData({
      hasCalc: true,
      resultInterval: Math.round(resultInterval * 10) / 10,
      resultPhotos: Math.round(totalPhotos),
      resultVideoSeconds: Math.round(videoSec * 10) / 10,
      resultVideoMinute: videoMinute,
      resultVideoRemainSec: videoRemainSec,
      resultStorage: storageStr,
      resultEndTime: endTimeStr,
      resultShootDuration: shootDurationStr
    })
  },

  formatStorage(mb) {
    if (mb >= 1048576) {
      return (mb / 1048576).toFixed(1) + ' TB'
    } else if (mb >= 1024) {
      return (mb / 1024).toFixed(1) + ' GB'
    }
    return mb.toFixed(0) + ' MB'
  },

  formatEndTime(shootSeconds) {
    const now = new Date()
    const end = new Date(now.getTime() + shootSeconds * 1000)

    const pad = (n) => String(n).padStart(2, '0')
    const timeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`

    // 同一天：今天 HH:mm
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 86400000)
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())

    if (endDay.getTime() === today.getTime()) {
      return `今天 ${timeStr}`
    } else if (endDay.getTime() === tomorrow.getTime()) {
      return `明天 ${timeStr}`
    } else {
      return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${timeStr}`
    }
  },

  formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = Math.round(totalSeconds % 60)
    const parts = []
    if (h > 0) parts.push(`${h}小时`)
    if (m > 0) parts.push(`${m}分钟`)
    if (s > 0 || parts.length === 0) parts.push(`${s}秒`)
    return parts.join('')
  },

  copyResult() {
    let text = ''
    if (this.data.mode === 0) {
      text = `拍摄耗时：${this.data.resultShootDuration}\n拍照间隔：${this.data.resultInterval} 秒\n总照片数：${this.data.resultPhotos} 张\n视频时长：${this.data.resultVideoMinute}分${this.data.resultVideoRemainSec}秒\n存储估算：${this.data.resultStorage}\n预计结束：${this.data.resultEndTime}`
    } else {
      text = `拍摄耗时：${this.data.resultShootDuration}\n视频时长：${this.data.resultVideoMinute}分${this.data.resultVideoRemainSec}秒\n总照片数：${this.data.resultPhotos} 张\n存储估算：${this.data.resultStorage}\n预计结束：${this.data.resultEndTime}`
    }
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success', duration: 1000 })
    })
  },

  onReady() {
    this.calc()
  }
})
