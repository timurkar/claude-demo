import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

const STORAGE_KEY = 'chatium_workspaces'

function injectDbScript(html, tables) {
  if (!tables || tables.length === 0) return html
  const tag = 'script'
  const code = [
    '(function() {',
    '  var __tables__ = ' + JSON.stringify(tables) + ';',
    '  window.db = {',
    '    tables: __tables__,',
    '    getTable: function(name) { return __tables__.find(function(t) { return t.name === name; }) || null; },',
    '    all: function(name) { var t = this.getTable(name); return t ? t.rows : []; },',
    '    find: function(name, fn) { return this.all(name).filter(fn); },',
    '    count: function(name) { return this.all(name).length; }',
    '  };',
    '})();',
  ].join('\n')
  const script = `<${tag}>${code}</${tag}>`
  if (html.includes('</head>')) return html.replace('</head>', script + '</head>')
  return script + html
}

export default function WorkspacePreview() {
  const { id } = useParams()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const workspaces = raw ? JSON.parse(raw) : []
      const ws = workspaces.find((w) => w.id === id)
      if (ws && ws.result) {
        const html = injectDbScript(ws.result, ws.tables || [])
        document.open()
        document.write(html)
        document.close()
      } else {
        document.body.style.cssText = 'margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#6b7280'
        document.body.innerHTML = '<p>No preview available. Generate content in the workspace first.</p>'
      }
    } catch {
      document.body.innerHTML = '<p>Error loading preview.</p>'
    }
  }, [id])

  return null
}
