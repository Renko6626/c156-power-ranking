// 线上页面冒烟测试：用 jsdom 真实加载 GitHub Pages 上的页面，验证 Vue 挂载 + 数据渲染。
// 用法：node scripts/smoke_test.mjs [url]
import { JSDOM, VirtualConsole } from 'jsdom'

const url = process.argv[2] || 'https://renko6626.github.io/c156-power-ranking/'
const vc = new VirtualConsole()
const errors = []
vc.on('jsdomError', (e) => errors.push(`jsdomError: ${e.message}`))
vc.on('error', (...a) => errors.push(`console.error: ${a.join(' ')}`))

const dom = await JSDOM.fromURL(url, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc
})

const { window } = dom
// jsdom 没有 fetch，桥接到 Node 的 fetch（相对路径按页面 URL 解析）
window.fetch = (input, init) => fetch(new URL(input, window.location.href), init)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

let html = ''
for (let i = 0; i < 40; i++) {
  await sleep(500)
  html = window.document.querySelector('#app')?.innerHTML || ''
  if (html.includes('<table')) break
}

const doc = window.document
const rows = doc.querySelectorAll('tbody tr')
const tabs = [...doc.querySelectorAll('.tab')].map((el) => el.textContent.trim())
const chips = [...doc.querySelectorAll('.chip')].map((el) => el.textContent.replace(/\s+/g, ' ').trim())
const headers = [...doc.querySelectorAll('thead th')].map((el) => el.textContent.replace(/[▲▼]/g, '').trim())
const firstRow = [...(rows[0]?.querySelectorAll('td') || [])].map((el) => el.textContent.trim())
const disclaimer = doc.querySelector('.disclaimer')?.textContent.replace(/\s+/g, ' ').trim()

const checks = [
  ['Vue 已挂载（#app 有内容）', html.length > 500],
  ['渲染出表格', rows.length > 0],
  ['表格行数 > 100', rows.length > 100],
  ['标签页齐全', tabs.length === 5],
  ['统计 chips 有 6 项', chips.length === 6],
  ['首行是 God（T0 榜首）', firstRow.some((c) => c.includes('God'))],
  ['免责声明存在', !!disclaimer && disclaimer.includes('非官方')],
  ['无 JS 运行时错误', errors.length === 0]
]

// 验证「只看人物角色」开关：勾选后非人物角色（非人格角色 / 抽象意象）应被过滤
const beforeFilter = rows.length
const toggle = doc.querySelector('.switch input[type=checkbox]')
let afterFilter = -1
let filterLabel = ''
if (toggle) {
  filterLabel = doc.querySelector('.switch span')?.textContent.trim() || ''
  toggle.checked = true
  toggle.dispatchEvent(new window.Event('change', { bubbles: true }))
  for (let i = 0; i < 20; i++) {
    await sleep(250)
    afterFilter = doc.querySelectorAll('tbody tr').length
    if (afterFilter !== beforeFilter) break
  }
}
checks.push(['存在「只看人物角色」开关', !!toggle])
checks.push([`勾选后行数下降（${beforeFilter} → ${afterFilter}）`, afterFilter > 0 && afterFilter < beforeFilter])

// 用数据本身算出「人物角色」应有的条数，作为过滤结果的期望值
let expectedHuman = -1
try {
  const payload = await (await fetch(new URL('./data/ranking.json', url))).json()
  expectedHuman = payload.characters.filter((c) => c.kind === '人格角色').length
} catch (e) {
  errors.push(`无法读取 ranking.json: ${e.message}`)
}
checks.push([
  `过滤后行数等于人物角色数（${afterFilter} = ${expectedHuman}）`,
  expectedHuman > 0 && afterFilter === expectedHuman
])

console.log('过滤开关:', filterLabel || '(未找到)', `| 行数 ${beforeFilter} → ${afterFilter}（人物角色 ${expectedHuman}）`)

console.log('URL:', url)
console.log('标签页:', tabs.join(' | '))
console.log('统计:', chips.join('  '))
console.log('表头:', headers.join(' | '))
console.log('首行:', firstRow.join(' | '))
console.log('数据行数:', rows.length)
console.log('免责声明:', disclaimer?.slice(0, 60), '…')
if (errors.length) console.log('错误:', errors.slice(0, 5))

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? '  ✅' : '  ❌'} ${name}`)
  if (!ok) failed++
}
dom.window.close()
process.exit(failed ? 1 : 0)
