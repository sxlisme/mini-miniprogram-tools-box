const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  try {
    const { media_url } = event
    const { OPENID } = cloud.getWXContext()

    if (!media_url) {
      return { errcode: -1, errmsg: '媒体链接为空' }
    }

    console.log('[mediaCheckAsync] 开始检测，media_url:', media_url)
    const result = await cloud.openapi.security.mediaCheckAsync({
      openid: OPENID,
      scene: 2,
      version: 2,
      media_url,
      media_type: 2
    })
    console.log('[mediaCheckAsync] openapi 返回:', JSON.stringify(result))
    // openapi 返回驼峰命名，统一转为下划线命名，与 msgSecCheck 保持一致
    return {
      errcode: result.errCode,
      errmsg: result.errMsg,
      trace_id: result.traceId
    }
  } catch (err) {
    console.error('[mediaCheckAsync] 调用失败:', JSON.stringify(err))
    return {
      errcode: typeof err.errCode === 'number' ? err.errCode : -1,
      errmsg: err.errMsg || err.message || '检测失败'
    }
  }
}
