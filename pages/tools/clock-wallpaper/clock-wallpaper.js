const STORAGE_KEY = 'clockWallpaperUserImages'
const DEFAULT_BASES = require('./wallpaper-data')

Page({
  data: {
    imagePath: '',
    fullscreen: false,
    showHint: true,
    orientation: 'portrait',
    defaultWallpapers: [],   // 默认壁纸（base64）
    userWallpapers: []       // 用户选择的壁纸
  },

  _hintTimer: null,
  _lastTapTime: 0,

  onLoad() {
    this.initDefaultWallpapers()
    this.loadUserWallpapers()
  },

  onShow() {
    this.loadUserWallpapers()
  },

  // 初始化默认壁纸（base64 数据，真机兼容）
  initDefaultWallpapers() {
    const list = DEFAULT_BASES.map((base64, index) => ({
      id: `default_${index}`,
      base64,
      type: 'default'
    }))
    this.setData({ defaultWallpapers: list })
  },

  // 从本地存储加载用户壁纸
  loadUserWallpapers() {
    let userList = []
    try {
      const stored = wx.getStorageSync(STORAGE_KEY)
      if (stored && Array.isArray(stored)) {
        userList = stored.map((item, index) => ({
          id: `user_${index}`,
          path: item.path,
          type: 'user'
        }))
      }
    } catch (e) {
      console.warn('[壁纸] 读取本地存储失败:', e)
    }
    this.setData({ userWallpapers: userList })
  },

  // 点击缩略图 → 全屏预览（支持 base64 和文件路径）
  onThumbnailTap(e) {
    const { path, base64 } = e.currentTarget.dataset
    const src = base64 || path
    if (!src) return
    this.previewImage(src)
  },

  // 选择本地照片
  chooseLocalImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        // 保存到本地永久路径
        this.saveImageToLocal(tempPath).then(savedPath => {
          // 安全检测（和水印工具一致）
          this.checkImage(tempPath).then(() => {
            // 无论安全检测结果如何，都允许预览（与水印工具逻辑一致）
            // 存储到本地缓存
            this.addUserWallpaper(savedPath)
            // 直接全屏预览
            this.setData({ imagePath: savedPath })
            this.enterFullscreen()
          }).catch(() => {
            this.addUserWallpaper(savedPath)
            this.setData({ imagePath: savedPath })
            this.enterFullscreen()
          })
        }).catch(err => {
          console.warn('[壁纸] 保存图片失败:', err)
          // 保存失败时直接用临时路径预览（但不持久化）
          this.setData({ imagePath: tempPath })
          this.enterFullscreen()
        })
      }
    })
  },

  // 保存图片到本地永久目录
  saveImageToLocal(tempPath) {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager()
      const suffix = tempPath.split('.').pop() || 'jpg'
      const savedName = `wallpaper_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${suffix}`
      const savedPath = `${wx.env.USER_DATA_PATH}/${savedName}`
      fs.saveFile({
        tempFilePath: tempPath,
        filePath: savedPath,
        success: () => resolve(savedPath),
        fail: (err) => reject(err)
      })
    })
  },

  // 将用户壁纸添加到本地存储
  addUserWallpaper(path) {
    let stored = []
    try {
      stored = wx.getStorageSync(STORAGE_KEY) || []
      if (!Array.isArray(stored)) stored = []
    } catch (e) {
      stored = []
    }
    // 去重
    if (!stored.some(item => item.path === path)) {
      stored.push({ path, time: Date.now() })
      // 最多保留 20 张
      if (stored.length > 20) stored = stored.slice(-20)
      wx.setStorageSync(STORAGE_KEY, stored)
    }
    this.loadUserWallpapers()
  },

  // 图片安全检测（与水印工具一致的 mediaCheckAsync 流程）
  checkImage(filePath) {
    const errMsgMap = {
      '-1': '系统繁忙，请稍后再试',
      '40001': '接口凭证无效',
      '40003': '用户标识无效(OpenID)',
      '40004': '媒体类型错误',
      '43104': 'AppID与OpenID不匹配',
      '44991': '调用过于频繁，请稍后再试',
      '45009': '每日调用已达上限',
      '61010': '访问记录超时，请重新进入小程序',
      '87020': '重复请求超出限制，请稍后再试'
    }

    const suffix = filePath.split('.').pop() || 'jpg'
    const cloudPath = `security/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${suffix}`

    return wx.cloud.uploadFile({ cloudPath, filePath }).then(uploadRes => {
      return wx.cloud.getTempFileURL({ fileList: [uploadRes.fileID] }).then(urlRes => {
        const url = urlRes.fileList[0] && urlRes.fileList[0].tempFileURL
        if (!url) {
          console.warn('[安全检测] 无法获取图片临时链接，跳过检测')
          return { submitted: false, errcode: -1 }
        }
        return wx.cloud.callFunction({
          name: 'mediaCheckAsync',
          data: { media_url: url }
        }).then(callRes => {
          const data = callRes.result || {}
          const errcode = data.errcode
          if (errcode == null) {
            console.warn('[安全检测] 图片检测返回异常')
            wx.showToast({ title: '图片安全检测异常，可正常预览', icon: 'none', duration: 2500 })
            return { submitted: false, errcode: -1 }
          }
          if (errcode === 0) {
            console.log('[安全检测] 图片已提交异步检测，trace_id:', data.trace_id)
            return { submitted: true, trace_id: data.trace_id }
          }
          console.warn('[安全检测] 图片检测提交失败，errcode:', errcode)
          const tip = errMsgMap[String(errcode)] || `图片检测提交失败(errcode:${errcode})`
          wx.showToast({ title: tip, icon: 'none', duration: 2500 })
          return { submitted: false, errcode }
        })
      })
    }).catch(err => {
      console.warn('[安全检测] 图片检测提交失败:', err)
      wx.showToast({ title: '图片安全检测暂不可用，可正常预览', icon: 'none', duration: 2000 })
      return { submitted: false }
    })
  },

  // 全屏预览入口
  previewImage(path) {
    this.setData({ imagePath: path })
    this.enterFullscreen()
    // 图片加载完成后由 onFullscreenImageLoad 自动检测方向并旋转
  },

  // 全屏图片加载完毕，根据真实尺寸切换横竖屏
  onFullscreenImageLoad(e) {
    const { width, height } = e.detail
    if (!width || !height) return
    const isLandscape = width > height
    const orientation = isLandscape ? 'landscape' : 'portrait'
    if (orientation !== this.data.orientation) {
      wx.setPageOrientation({ orientation })
      this.setData({ orientation })
    }
  },

  enterFullscreen() {
    this._lastTapTime = 0
    this.setData({ fullscreen: true, showHint: true })

    // 保持屏幕常亮
    wx.setKeepScreenOn({ keepScreenOn: true })

    // 全屏沉浸：隐藏首页按钮、导航栏+页面背景全部置黑
    wx.hideHomeButton()
    wx.setNavigationBarColor({ backgroundColor: '#000000', frontColor: '#ffffff' })

    // 页面整体背景置黑（包括顶部胶囊区域）
    if (wx.setPageStyle) {
      wx.setPageStyle({
        style: {
          backgroundColor: '#000000',
          backgroundColorTop: '#000000',
          backgroundColorBottom: '#000000'
        }
      })
    }

    // 3 秒后隐藏提示文字
    this._hintTimer = setTimeout(() => {
      this.setData({ showHint: false })
    }, 3000)
  },

  onFullscreenTap() {
    const now = Date.now()

    // 3 秒内第二次点击 → 退出
    if (this._lastTapTime && now - this._lastTapTime < 3000) {
      this.exitFullscreen()
      return
    }

    // 第一次点击：记录时间，提示文字淡出后重新显示
    this._lastTapTime = now
    if (!this.data.showHint) {
      this.setData({ showHint: true })
      if (this._hintTimer) clearTimeout(this._hintTimer)
      this._hintTimer = setTimeout(() => {
        this.setData({ showHint: false })
      }, 3000)
    }
  },

  exitFullscreen() {
    if (this._hintTimer) {
      clearTimeout(this._hintTimer)
      this._hintTimer = null
    }

    this.setData({ fullscreen: false })

    // 恢复息屏 + 竖屏
    wx.setKeepScreenOn({ keepScreenOn: false })
    wx.setPageOrientation({ orientation: 'portrait' })
    this.setData({ orientation: 'portrait' })

    // 恢复页面背景
    wx.setNavigationBarColor({ backgroundColor: '#FFFFFF', frontColor: '#000000' })
    if (wx.setPageStyle) {
      wx.setPageStyle({
        style: {
          backgroundColor: '#f5f5f5',
          backgroundColorTop: '#FFFFFF',
          backgroundColorBottom: '#f5f5f5'
        }
      })
    }
  },

  // 删除用户壁纸
  onDeleteWallpaper(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '删除壁纸',
      content: '确定要删除这张壁纸吗？',
      success: (res) => {
        if (res.confirm) {
          let stored = wx.getStorageSync(STORAGE_KEY) || []
          if (!Array.isArray(stored)) stored = []
          const index = parseInt(id.replace('user_', ''))
          if (index >= 0 && index < stored.length) {
            // 尝试删除本地文件
            try {
              const fs = wx.getFileSystemManager()
              fs.unlinkSync(stored[index].path)
            } catch (e) { /* 忽略 */ }
            stored.splice(index, 1)
            wx.setStorageSync(STORAGE_KEY, stored)
            this.loadUserWallpapers()
            wx.showToast({ title: '已删除', icon: 'success' })
          }
        }
      }
    })
  },

  onUnload() {
    if (this._hintTimer) {
      clearTimeout(this._hintTimer)
    }
    wx.setKeepScreenOn({ keepScreenOn: false })
    wx.setPageOrientation({ orientation: 'portrait' })
  }
})
