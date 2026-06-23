Page({
  data: {
    text: '',
    htmlNodes: '',
    mode: 'edit'
  },

  onInput(e) {
    const text = e.detail.value
    this.setData({ text })
    this.setData({ htmlNodes: this.markdownToHtml(text) })
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode })
    if (mode === 'preview' && this.data.text) {
      this.setData({ htmlNodes: this.markdownToHtml(this.data.text) })
    }
  },

  clearText() {
    this.setData({ text: '', htmlNodes: '' })
  },

  copyPlainText() {
    const plain = this.stripMarkdown(this.data.text)
    wx.setClipboardData({
      data: plain,
      success() {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  /* ========= 样式常量 ========= */
  css: {
    h1: 'font-size:22px;font-weight:700;color:#1A1A1A;margin:20px 0 10px;padding-bottom:8px;border-bottom:1px solid #EEEEEE;',
    h2: 'font-size:20px;font-weight:700;color:#1A1A1A;margin:18px 0 8px;',
    h3: 'font-size:18px;font-weight:700;color:#1A1A1A;margin:16px 0 6px;',
    h4: 'font-size:16px;font-weight:600;color:#1A1A1A;margin:14px 0 4px;',
    p: 'margin:6px 0;line-height:1.8;',
    code: 'background:#F0F0F0;padding:2px 6px;border-radius:4px;font-size:14px;font-family:Menlo,monospace;color:#E0556A;',
    pre: 'background:#F4F4F4;padding:14px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.6;font-family:Menlo,monospace;color:#333;margin:10px 0;',
    blockquote: 'border-left:4px solid #4A7BEC;padding:8px 14px;margin:10px 0;background:#EEF2FD;border-radius:0 8px 8px 0;color:#555;font-size:15px;',
    ul: 'margin:6px 0;padding-left:18px;',
    ol: 'margin:6px 0;padding-left:18px;',
    li: 'margin:3px 0;line-height:1.7;',
    hr: 'height:1px;background:#EEEEEE;margin:16px 0;border:none;',
    link: 'color:#4A7BEC;text-decoration:underline;',
    img: 'max-width:100%;border-radius:8px;margin:10px 0;',
    del: 'color:#999;text-decoration:line-through;',
    strong: 'font-weight:700;',
    em: 'font-style:italic;',
    table: 'width:100%;border-collapse:collapse;margin:10px 0;font-size:14px;',
    th: 'background:#F4F4F4;font-weight:600;padding:8px 12px;border:1px solid #DDD;text-align:left;',
    td: 'padding:8px 12px;border:1px solid #DDD;'
  },

  /* ========= Markdown → HTML ========= */
  markdownToHtml(md) {
    if (!md) return ''
    const css = this.css
    let html = md

    // 转义 HTML
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // 代码块 (```...```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre style="${css.pre}"><code>${code.trim()}</code></pre>`
    )

    // 行内代码 (`code`)
    html = html.replace(/`([^`]+)`/g,
      `<code style="${css.code}">$1</code>`
    )

    // 图片 ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      `<img src="$2" alt="$1" style="${css.img}" />`
    )

    // 链接 [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      `<span style="${css.link}">$1</span>`
    )

    // 水平线
    html = html.replace(/^---$/gm, `<hr style="${css.hr}" />`)

    // 标题
    html = html.replace(/^#### (.+)$/gm, `<h4 style="${css.h4}">$1</h4>`)
    html = html.replace(/^### (.+)$/gm, `<h3 style="${css.h3}">$1</h3>`)
    html = html.replace(/^## (.+)$/gm, `<h2 style="${css.h2}">$1</h2>`)
    html = html.replace(/^# (.+)$/gm, `<h1 style="${css.h1}">$1</h1>`)

    // 粗斜体
    html = html.replace(/\*\*\*(.+?)\*\*\*/g,
      `<strong style="${css.strong}"><em style="${css.em}">$1</em></strong>`
    )
    html = html.replace(/\*\*(.+?)\*\*/g,
      `<strong style="${css.strong}">$1</strong>`
    )
    html = html.replace(/\*(.+?)\*/g,
      `<em style="${css.em}">$1</em>`
    )

    // 删除线
    html = html.replace(/~~(.+?)~~/g,
      `<span style="${css.del}">$1</span>`
    )

    // 引用
    html = html.replace(/^> (.+)$/gm,
      `<blockquote style="${css.blockquote}">$1</blockquote>`
    )

    // 无序列表
    html = html.replace(/^[-*+] (.+)$/gm,
      `<li style="${css.li}">$1</li>`
    )

    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm,
      `<li style="${css.li}">$1</li>`
    )

    // 表格: 按行处理
    html = this.renderTables(html, css)

    // 段落：连续换行
    html = html.replace(/\n\n/g, '<br/><br/>')
    html = html.replace(/\n/g, '<br/>')

    return html
  },

  renderTables(html, css) {
    // | a | b |\n| c | d | → <table>
    return html.replace(/(?:^\|.+\|\n?)+/gm, (block) => {
      const lines = block.trim().split('\n').filter(l => l.includes('|'))
      if (lines.length < 2) return block
      // 跳过分隔行 |---|---|
      const rows = lines.filter(l => !/^\|[\s\-:]+\|[\s\-:|]+$/.test(l))
      if (rows.length === 0) return block

      const header = rows[0]
      const body = rows.slice(1)
      const renderRow = (line, tag) => {
        const cells = line.split('|').filter(c => c.trim() !== '')
        const cellTag = tag === 'th'
          ? `<th style="${css.th}">`
          : `<td style="${css.td}">`
        const closeTag = tag === 'th' ? '</th>' : '</td>'
        return `<tr>${cells.map(c => `${cellTag}${c.trim()}${closeTag}`).join('')}</tr>`
      }
      let tableHtml = `<table style="${css.table}">`
      tableHtml += `<thead>${renderRow(header, 'th')}</thead>`
      if (body.length) {
        tableHtml += `<tbody>${body.map(r => renderRow(r, 'td')).join('')}</tbody>`
      }
      tableHtml += '</table>'
      return tableHtml
    })
  },

  /* ========= 去除 Markdown 语法 ========= */
  stripMarkdown(md) {
    if (!md) return ''
    let text = md
    text = text.replace(/```[\s\S]*?```/g, '')
    text = text.replace(/`([^`]+)`/g, '$1')
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    text = text.replace(/^#{1,6}\s+/gm, '')
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    text = text.replace(/\*\*(.+?)\*\*/g, '$1')
    text = text.replace(/\*(.+?)\*/g, '$1')
    text = text.replace(/~~(.+?)~~/g, '$1')
    text = text.replace(/^>\s?/gm, '')
    text = text.replace(/^[-*+]\s+/gm, '')
    text = text.replace(/^\d+\.\s+/gm, '')
    text = text.replace(/^(-{3,}|\*{3,})$/gm, '')
    text = text.replace(/\n{3,}/g, '\n\n')
    return text.trim()
  }
})
