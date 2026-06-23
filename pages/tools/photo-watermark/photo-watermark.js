Page({
  data: {
    imagePath: '',
    watermarkText: '仅限XX使用 他用无效',
    textColor: '#FFFFFF',
    textSize: 40,
    textOpacity: 50,
    rotation: -25,
    mode: 'tile',
    textPosition: 'bottomRight',
    tileSpacingX: 200,
    tileSpacingY: 160,
    canvasWidth: 0,
    canvasHeight: 0,
    hasImage: false,
    // 安全检测
    textCheckPassed: true,
    imageCheckSubmitted: false,
    checking: false
  },

  _textCheckTimer: null,
  _canvasReady: false,

  onReady() {},

  // ===== 安全检测 =====

  checkText(content) {
    if (!content || !content.trim()) {
      this.setData({ textCheckPassed: true })
      return Promise.resolve(true)
    }
    this.setData({ checking: true })
    console.log('[DEBUG] 调用 msgSecCheck 云函数，参数:', JSON.stringify({ content }))
    return wx.cloud.callFunction({
      name: 'msgSecCheck',
      data: { content }
    }).then(res => {
      console.log('[DEBUG] msgSecCheck 云函数返回:', JSON.stringify(res))
      this.setData({ checking: false })

      // cloud.openapi 返回的响应体，可能包含 errcode/result/detail 等字段
      const data = res.result || {}

      // 错误码映射表（来自文档第6节）
      const errMsgMap = {
        '-1': '系统繁忙，请稍后再试',
        '40001': '接口凭证无效',
        '40003': '用户标识无效(OpenID)',
        '40129': '场景值错误',
        '43002': '请求方法错误',
        '43104': 'AppID与OpenID不匹配',
        '44002': '请求数据为空',
        '44991': '调用过于频繁，请稍后再试',
        '45009': '每日调用已达上限',
        '47001': '请求数据格式错误',
        '61010': '访问记录超时，请重新进入小程序'
      }

      // 从 errcode 判断是否需要提示用户
      const showError = (code) => {
        if (code == null || code === 0) return
        const tip = errMsgMap[String(code)] || `安全检测异常(errcode:${code})`
        console.error('[安全检测] 检测出错，errcode:', code)
        wx.showToast({ title: tip, icon: 'none', duration: 2500 })
      }

      // ---- 处理 errcode ----

      // 顶层 errcode（API 调用整体失败：如凭证过期、频率限制等）
      // 云函数 catch 返回时只有 { errcode, errmsg }，没有 result/detail
      if (data.errcode && data.errcode !== 0) {
        showError(data.errcode)
        // 严重错误码阻止保存；频率限制等临时错误允许继续
        const blockCodes = [-1, 40001, 43002, 61010, 44002, 47001]
        const blocked = blockCodes.includes(data.errcode)
        this.setData({ textCheckPassed: !blocked })
        return !blocked
      }

      // ---- 处理 detail（各策略项返回的 errcode，这才是内容安全检测的关键） ----

      // 兼容两种可能的结构：{ detail: [...] } 或 { result: { detail: [...] } }
      const detailArr = data.detail || (data.result && data.result.detail)

      if (detailArr && detailArr.length > 0) {
        // 检查每个策略项是否有 errcode 错误
        let hasError = false
        for (const item of detailArr) {
          if (item.errcode && item.errcode !== 0) {
            // 该策略项返回了错误码 → 这项检测无效
            console.error(`[安全检测] 策略[${item.strategy || 'unknown'}] errcode:${item.errcode}`)
            showError(item.errcode)
            hasError = true
          } else if (item.suggest === 'risky') {
            // 策略检测到违规内容
            this.setData({ textCheckPassed: false })
            wx.showToast({ title: '文字包含违规内容，请修改', icon: 'none', duration: 2500 })
            return false
          }
        }

        // 如果所有策略项都返回了错误码，无法完成检测 → 阻止保存
        const allFailed = detailArr.every(d => d.errcode && d.errcode !== 0)
        if (allFailed) {
          this.setData({ textCheckPassed: false })
          return false
        }

        // 部分策略失败但至少有一个成功 → 允许继续
        if (hasError) {
          console.warn('[安全检测] 部分策略失败，以成功策略结果为准')
        }
      }

      // ---- 综合结果兜底 ----
      const comprehensive = data.result
      if (comprehensive && comprehensive.suggest === 'risky') {
        this.setData({ textCheckPassed: false })
        wx.showToast({ title: '文字包含违规内容，请修改', icon: 'none', duration: 2500 })
        return false
      }

      this.setData({ textCheckPassed: true })
      return true
    }).catch(err => {
      console.error('[安全检测] 文本检测接口调用失败:', err)
      this.setData({ checking: false, textCheckPassed: true })
      wx.showToast({ title: '安全检测暂不可用，可正常编辑', icon: 'none', duration: 2000 })
      return true
    })
  },

  checkImage(filePath) {
    // 错误码映射表（与 msgSecCheck 共用，来自文档）
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

    this.setData({ imageCheckSubmitted: false })

    const suffix = filePath.split('.').pop() || 'jpg'
    const cloudPath = `security/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${suffix}`
    console.log('[DEBUG] 调用 uploadFile 上传图片，cloudPath:', cloudPath, 'filePath:', filePath)
    return wx.cloud.uploadFile({ cloudPath, filePath }).then(uploadRes => {
      console.log('[DEBUG] uploadFile 返回:', JSON.stringify(uploadRes))
      console.log('[DEBUG] 调用 getTempFileURL，fileList:', JSON.stringify([uploadRes.fileID]))
      return wx.cloud.getTempFileURL({ fileList: [uploadRes.fileID] }).then(urlRes => {
        console.log('[DEBUG] getTempFileURL 返回:', JSON.stringify(urlRes))
        const url = urlRes.fileList[0] && urlRes.fileList[0].tempFileURL
        if (!url) {
          this.setData({ imageCheckSubmitted: false })
          console.warn('[安全检测] 无法获取图片临时链接，跳过图片检测')
          return { submitted: false, errcode: -1 }
        }
        console.log('[DEBUG] 调用 mediaCheckAsync 云函数，参数:', JSON.stringify({ media_url: url }))
        return wx.cloud.callFunction({
          name: 'mediaCheckAsync',
          data: { media_url: url }
        }).then(callRes => {
          console.log('[DEBUG] mediaCheckAsync 云函数返回:', JSON.stringify(callRes))
          const data = callRes.result || {}
          const errcode = data.errcode
          const errmsg = data.errmsg

          // 防御：如果 errcode 为 undefined/null，说明云函数返回异常
          if (errcode == null) {
            console.error('[安全检测] 图片检测返回异常，完整响应:', JSON.stringify(callRes))
            this.setData({ imageCheckSubmitted: false })
            wx.showToast({ title: '图片安全检测异常，可正常编辑', icon: 'none', duration: 2500 })
            return { submitted: false, errcode: -1 }
          }

          // mediaCheckAsync 是异步接口，返回 trace_id 后结果通过服务端推送
          // 此处只需检查提交流程是否成功
          if (errcode === 0) {
            this.setData({ imageCheckSubmitted: true })
            console.log('[安全检测] 图片已提交异步检测，trace_id:', data.trace_id)
            return { submitted: true, trace_id: data.trace_id }
          }

          // 提交流程出错
          this.setData({ imageCheckSubmitted: false })
          console.error('[安全检测] 图片检测提交失败，errcode:', errcode, 'errmsg:', errmsg)
          const tip = errMsgMap[String(errcode)] || `图片检测提交失败(errcode:${errcode})`
          wx.showToast({ title: tip, icon: 'none', duration: 2500 })
          return { submitted: false, errcode }
        })
      })
    }).catch(err => {
      console.warn('[安全检测] 图片检测提交失败:', err)
      this.setData({ imageCheckSubmitted: false })
      wx.showToast({ title: '图片安全检测暂不可用，可正常编辑', icon: 'none', duration: 2000 })
      return { submitted: false }
    })
  },

  // ===== Canvas =====

  initCanvas() {
    if (this._canvasReady) return Promise.resolve(true)
    return new Promise((resolve) => {
      let retryCount = 0
      const maxRetries = 10
      const tryGetCanvas = () => {
        const query = wx.createSelectorQuery()
        query.select('#watermarkCanvas').fields({ node: true, size: true }).exec((res) => {
          if (res && res[0] && res[0].node) {
            this.canvas = res[0].node
            this.ctx = this.canvas.getContext('2d')
            this._canvasReady = true
            resolve(true)
          } else {
            retryCount++
            if (retryCount >= maxRetries) {
              console.error('[Canvas] 获取Canvas节点失败，已重试 ' + maxRetries + ' 次')
              wx.showToast({ title: '预览初始化失败，请重试', icon: 'none' })
              resolve(false)
            } else {
              setTimeout(tryGetCanvas, 100)
            }
          }
        })
      }
      tryGetCanvas()
    })
  },

  chooseImage() {
    if (this.data.hasImage) return
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath
        this.setData({ imagePath: path, hasImage: true, imageCheckSubmitted: false })
        this._canvasReady = false
        this.checkImage(path)
        this.initCanvas().then(ok => {
          if (ok) this.loadAndDraw()
        })
      }
    })
  },

  reChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath
        this.setData({ imagePath: path, imageCheckSubmitted: false })
        this._canvasReady = false
        this.checkImage(path)
        this.initCanvas().then(ok => {
          if (ok) this.loadAndDraw()
        })
      }
    })
  },

  loadAndDraw() {
    if (!this.data.imagePath || !this.canvas) return
    const img = this.canvas.createImage()
    img.src = this.data.imagePath
    img.onload = () => { this.sourceImg = img; this.doDraw() }
    img.onerror = (err) => {
      console.error('[Canvas] 图片加载失败:', err)
      wx.showToast({ title: '图片加载失败，请重试', icon: 'none' })
    }
  },

  doDraw(canvasW, canvasH, scale) {
    if (!this.sourceImg || !this.ctx) return
    const img = this.sourceImg
    const { windowWidth } = wx.getWindowInfo()
    const maxW = Math.min(windowWidth - 48, 680)
    this.origWidth = img.width
    this.origHeight = img.height
    let w = canvasW || img.width
    let h = canvasH || img.height
    if (!scale && w > maxW) {
      const ratio = maxW / w
      w = Math.floor(w * ratio)
      h = Math.floor(h * ratio)
    }
    this.previewWidth = w
    this.previewHeight = h
    this.canvas.width = w
    this.canvas.height = h
    this.setData({ canvasWidth: w, canvasHeight: h })
    this.ctx.clearRect(0, 0, w, h)
    this.ctx.drawImage(img, 0, 0, w, h)
    this.drawWatermark(this.ctx, w, h, scale)
  },

  drawWatermark(ctx, w, h, scale) {
    if (!this.data.watermarkText) return
    const { watermarkText, textColor, textSize, textOpacity, rotation, mode, textPosition } = this.data
    const s = scale || 1
    const fontSize = Math.max(14, Math.min(Math.round(textSize * s), Math.floor(w / 4)))
    const angleRad = (rotation * Math.PI) / 180
    ctx.save()
    ctx.globalAlpha = 1 - textOpacity / 100
    ctx.fillStyle = textColor
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 2
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (mode === 'tile') {
      this.drawTiled(ctx, watermarkText, fontSize, angleRad, w, h, s)
    } else {
      this.drawSingle(ctx, watermarkText, fontSize, angleRad, w, h, textPosition)
    }
    ctx.restore()
  },

  drawTiled(ctx, text, fontSize, angle, w, h, scale) {
    const metrics = ctx.measureText(text)
    const s = scale || 1
    const textW = metrics.width + Math.round(20 * s)
    const textH = fontSize + Math.round(20 * s)
    let gapX = Math.round(this.data.tileSpacingX * s)
    let gapY = Math.round(this.data.tileSpacingY * s)
    if (angle !== 0) {
      const absCos = Math.abs(Math.cos(angle)), absSin = Math.abs(Math.sin(angle))
      gapX = Math.max(gapX, Math.ceil((textW * absCos + textH * absSin) + 20 * s))
      gapY = Math.max(gapY, Math.ceil((textW * absSin + textH * absCos) + 20 * s))
    } else {
      gapX = Math.max(gapX, Math.ceil(textW + 20 * s))
      gapY = Math.max(gapY, Math.ceil(textH + 20 * s))
    }
    for (let y = gapY / 2; y < h + gapY; y += gapY) {
      for (let x = gapX / 2; x < w + gapX; x += gapX) {
        ctx.save(); ctx.translate(x, y)
        if (angle !== 0) ctx.rotate(angle)
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
    }
  },

  drawSingle(ctx, text, fontSize, angle, w, h, position) {
    const pad = 36
    const halfW = ctx.measureText(text).width / 2
    const halfH = fontSize / 2
    let cx, cy
    switch (position) {
      case 'topLeft': cx = pad + halfW; cy = pad + halfH; break
      case 'topRight': cx = w - halfW - pad; cy = pad + halfH; break
      case 'bottomLeft': cx = pad + halfW; cy = h - halfH - pad; break
      case 'bottomRight': cx = w - halfW - pad; cy = h - halfH - pad; break
      default: cx = w / 2; cy = h / 2
    }
    ctx.save(); ctx.translate(cx, cy)
    if (angle !== 0) ctx.rotate(angle)
    ctx.fillText(text, 0, 0)
    ctx.restore()
  },

  // ===== 事件 =====

  onTextInput(e) {
    const value = e.detail.value
    this.setData({ watermarkText: value })
    if (this.data.hasImage) this.doDraw()
    if (this._textCheckTimer) clearTimeout(this._textCheckTimer)
    this._textCheckTimer = setTimeout(() => this.checkText(value), 800)
  },

  onClearText() {
    this.setData({ watermarkText: '', textCheckPassed: true })
    if (this.data.hasImage) this.doDraw()
  },

  onColorPick(e) { this.setData({ textColor: e.currentTarget.dataset.color }); if (this.data.hasImage) this.doDraw() },
  onColorChange(e) { this.setData({ textColor: e.detail.value }); if (this.data.hasImage) this.doDraw() },
  onSizeChange(e) { this.setData({ textSize: parseInt(e.detail.value) }); if (this.data.hasImage) this.doDraw() },
  onOpacityChange(e) { this.setData({ textOpacity: parseInt(e.detail.value) }); if (this.data.hasImage) this.doDraw() },
  onRotationChange(e) { this.setData({ rotation: parseInt(e.detail.value) }); if (this.data.hasImage) this.doDraw() },
  onModeChange(e) { this.setData({ mode: e.currentTarget.dataset.mode }); if (this.data.hasImage) this.doDraw() },
  onPositionChange(e) { this.setData({ textPosition: e.currentTarget.dataset.pos }); if (this.data.hasImage) this.doDraw() },
  onSpacingXChange(e) { this.setData({ tileSpacingX: parseInt(e.detail.value) }); if (this.data.hasImage) this.doDraw() },
  onSpacingYChange(e) { this.setData({ tileSpacingY: parseInt(e.detail.value) }); if (this.data.hasImage) this.doDraw() },

  saveImage() {
    if (!this.canvas || !this.sourceImg) return
    const text = this.data.watermarkText

    // 如果图片从未提交过安全检测，先提交一次
    if (!this.data.imageCheckSubmitted && this.data.imagePath) {
      wx.showLoading({ title: '安全检测中...' })
      this.checkImage(this.data.imagePath).then(imgResult => {
        wx.hideLoading()
        if (imgResult && imgResult.errcode) {
          // 提交失败 → 阻止保存
          return
        }
        this._doSaveWithTextCheck(text)
      })
      return
    }

    this._doSaveWithTextCheck(text)
  },

  _doSaveWithTextCheck(text) {
    if (text && text.trim()) {
      wx.showLoading({ title: '安全检测中...' })
      this.checkText(text).then(passed => {
        wx.hideLoading()
        if (!passed) return
        this.doSave()
      })
    } else {
      this.doSave()
    }
  },

  doSave() {
    wx.showLoading({ title: '生成中...' })
    const img = this.sourceImg
    const fw = this.origWidth, fh = this.origHeight
    const fullScale = fw / this.previewWidth
    this.canvas.width = fw; this.canvas.height = fh
    this.ctx.clearRect(0, 0, fw, fh)
    this.ctx.drawImage(img, 0, 0, fw, fh)
    this.drawWatermark(this.ctx, fw, fh, fullScale)
    console.log('[DEBUG] 调用 canvasToTempFilePath 导出图片')
    wx.canvasToTempFilePath({
      canvas: this.canvas,
      success: (res) => {
        console.log('[DEBUG] canvasToTempFilePath 成功，tempFilePath:', res.tempFilePath)
        wx.hideLoading()
        console.log('[DEBUG] 调用 saveImageToPhotosAlbum 保存到相册')
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            console.log('[DEBUG] saveImageToPhotosAlbum 成功')
            wx.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            console.error('[DEBUG] saveImageToPhotosAlbum 失败:', JSON.stringify(err))
            wx.showToast({ title: '保存失败，请授权相册权限', icon: 'none' })
          }
        })
        this.restorePreview()
      },
      fail: (err) => {
        console.error('[DEBUG] canvasToTempFilePath 失败:', JSON.stringify(err))
        wx.hideLoading()
        wx.showToast({ title: '生成失败', icon: 'none' })
        this.restorePreview()
      }
    })
  },

  restorePreview() {
    if (!this.sourceImg || !this.ctx) return
    const w = this.previewWidth, h = this.previewHeight
    this.canvas.width = w; this.canvas.height = h
    this.setData({ canvasWidth: w, canvasHeight: h })
    this.ctx.clearRect(0, 0, w, h)
    this.ctx.drawImage(this.sourceImg, 0, 0, w, h)
    this.drawWatermark(this.ctx, w, h, 1)
  }
})
