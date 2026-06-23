const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { content } = event
  const { OPENID } = cloud.getWXContext()

  if (!content || !content.trim()) {
    return { errcode: -1, errmsg: '文本内容为空' }
  }

  try {
    return await cloud.openapi.security.msgSecCheck({
      openid: OPENID,
      scene: 2,
      version: 2,
      content
    })
  } catch (err) {
    // cloud.openapi 抛出异常时，err.errCode 即为 API 返回的 errcode
    // 完整透传错误信息，保留 errcode 字段供前端统一处理
    console.error('[msgSecCheck] 调用失败:', err)
    return {
      errcode: typeof err.errCode === 'number' ? err.errCode : -1,
      errmsg: err.errMsg || '检测失败'
    }
  }
}
