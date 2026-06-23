// app.js
App({
  globalData: {
    userInfo: null,
    favorites: [],
    loginRecords: [],
    tools: [
      {
        id: 'photo-watermark',
        name: '照片水印',
        icon: 'image',
        desc: '为照片添加文字或图片水印',
        path: '/pages/tools/photo-watermark/photo-watermark',
        color: '#4A7BEC'
      },
      {
        id: 'json-formatter',
        name: 'JSON 格式化',
        icon: 'file-code',
        desc: '格式化或压缩 JSON 数据',
        path: '/pages/tools/json-formatter/json-formatter',
        color: '#597FE6'
      },
      {
        id: 'mortgage-calc',
        name: '房贷计算器',
        icon: 'wallet',
        desc: '计算房贷利息与月供',
        path: '/pages/tools/mortgage-calc/mortgage-calc',
        color: '#5085EC'
      },
      {
        id: 'days-calc',
        name: '天数计算器',
        icon: 'calendar',
        desc: '计算两个日期之间的天数',
        path: '/pages/tools/days-calc/days-calc',
        color: '#658EE6'
      },
      {
        id: 'timelapse-calc',
        name: '延时摄影计算',
        icon: 'time',
        desc: '反推拍照间隔或计算视频时长',
        path: '/pages/tools/timelapse-calc/timelapse-calc',
        color: '#557AD6'
      },
      {
        id: 'clock-wallpaper',
        name: '壁纸全屏',
        icon: 'fullscreen',
        desc: '上传图片全屏展示，屏幕常亮',
        path: '/pages/tools/clock-wallpaper/clock-wallpaper',
        color: '#667eea'
      },
      {
        id: 'char-counter',
        name: '字符统计',
        icon: 'edit',
        desc: '统计文本字符、字数、行数',
        path: '/pages/tools/char-counter/char-counter',
        color: '#5B8DEF'
      },
      {
        id: 'markdown-preview',
        name: 'MD 预览',
        icon: 'browse',
        desc: 'Markdown 实时渲染预览',
        path: '/pages/tools/markdown-preview/markdown-preview',
        color: '#6C8EE8'
      },
      {
        id: 'timestamp-converter',
        name: '时间戳转换',
        icon: 'time',
        desc: '时间戳与日期时间互转',
        path: '/pages/tools/timestamp-converter/timestamp-converter',
        color: '#5B86E5'
      },
      {
        id: 'random-decision',
        name: '随机决策器',
        icon: 'refresh',
        desc: '骰子/硬币/自定义随机选择',
        path: '/pages/tools/random-decision/random-decision',
        color: '#4E78E0'
      },
      {
        id: 'uuid-generator',
        name: 'UUID 生成',
        icon: 'secured',
        desc: '一键生成 UUID v4 标识符',
        path: '/pages/tools/uuid-generator/uuid-generator',
        color: '#607EE6'
      }
    ]
  },

  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d4gosyf2293bb7a50',
        traceUser: true
      })
    }

    const userInfo = wx.getStorageSync('userInfo')
    const favorites = wx.getStorageSync('favorites') || []
    const loginRecords = wx.getStorageSync('loginRecords') || []

    // Record login
    const now = new Date()
    const record = {
      time: this.formatDate(now),
      timestamp: now.getTime()
    }
    loginRecords.push(record)
    wx.setStorageSync('loginRecords', loginRecords)

    if (userInfo) {
      this.globalData.userInfo = userInfo
    } else {
      // First time user
      const newUser = {
        id: 'U' + Date.now().toString(36).toUpperCase().slice(-8),
        nickName: '微信用户',
        avatarUrl: '',
        createTime: this.formatDate(now),
        createTimestamp: now.getTime()
      }
      this.globalData.userInfo = newUser
      wx.setStorageSync('userInfo', newUser)
    }

    this.globalData.favorites = favorites
    this.globalData.loginRecords = loginRecords
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}:${s}`
  },

  toggleFavorite(toolId) {
    const idx = this.globalData.favorites.indexOf(toolId)
    if (idx > -1) {
      this.globalData.favorites.splice(idx, 1)
    } else {
      this.globalData.favorites.push(toolId)
    }
    wx.setStorageSync('favorites', this.globalData.favorites)
    return idx === -1
  },

  isFavorite(toolId) {
    return this.globalData.favorites.indexOf(toolId) > -1
  },

  updateUserInfo(info) {
    this.globalData.userInfo = { ...this.globalData.userInfo, ...info }
    wx.setStorageSync('userInfo', this.globalData.userInfo)
  },

  getLoginRecords() {
    return wx.getStorageSync('loginRecords') || []
  }
})
