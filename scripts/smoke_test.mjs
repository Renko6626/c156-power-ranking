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

// 用数据本身算出期望值：人物角色数 / 全部角色数
let expectedHuman = -1
let expectedAll = -1
try {
  const payload = await (await fetch(new URL('./data/ranking.json', url))).json()
  expectedAll = payload.characters.length
  expectedHuman = payload.characters.filter((c) => c.kind === '人格角色').length
} catch (e) {
  errors.push(`无法读取 ranking.json: ${e.message}`)
}

// 「只看人物角色」默认开启：初始应只显示人物角色，取消勾选后恢复全部
const toggle = doc.querySelector('.switch input[type=checkbox]')
const defaultChecked = toggle ? toggle.checked : false
const initialRows = rows.length
let afterUncheck = -1
if (toggle) {
  toggle.checked = false
  toggle.dispatchEvent(new window.Event('change', { bubbles: true }))
  for (let i = 0; i < 20; i++) {
    await sleep(250)
    afterUncheck = doc.querySelectorAll('tbody tr').length
    if (afterUncheck !== initialRows) break
  }
}

checks.push(['存在「只看人物角色」开关', !!toggle])
checks.push([
  `默认开启过滤，初始只显示人物角色（${initialRows} = ${expectedHuman}）`,
  defaultChecked && expectedHuman > 0 && initialRows === expectedHuman
])
checks.push([
  `取消过滤后显示全部角色（${initialRows} → ${afterUncheck}）`,
  expectedAll > 0 && afterUncheck === expectedAll
])
checks.push(['表头含「估计击杀」', headers.some((h) => h.includes('估计击杀'))])
checks.push([
  '表头不再出现 L1/L2 口径',
  !headers.some((h) => /L1|L2|亲手|间接/.test(h))
])

// 切到「击杀榜」，验证按估计击杀排序
const killTab = [...doc.querySelectorAll('.tab')].find((t) => t.textContent.includes('击杀榜'))
let killTopRow = []
if (killTab) {
  killTab.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  for (let i = 0; i < 20; i++) {
    await sleep(250)
    const first = doc.querySelector('tbody tr')
    if (first && first.textContent.includes('估计')) break
    if (first) killTopRow = [...first.querySelectorAll('td')].map((el) => el.textContent.trim())
    if (killTopRow.length) break
  }
  const first = doc.querySelector('tbody tr')
  killTopRow = first ? [...first.querySelectorAll('td')].map((el) => el.textContent.trim()) : []
}
checks.push(['击杀榜榜首是估计值最高者', killTopRow.some((c) => c.includes('远古的大灵'))])
checks.push(['榜首估计值已格式化（含千分位）', killTopRow.some((c) => /1,000,000/.test(c))])
console.log('击杀榜首行:', killTopRow.join(' | '))

console.log(
  '过滤开关:',
  doc.querySelector('.switch span')?.textContent.trim() || '(未找到)',
  `| 默认 ${initialRows}（人物）→ 取消后 ${afterUncheck}（全部 ${expectedAll}）`
)

// 切到「奖项」标签页，验证奖项卡片与提名的渲染
const awardTab = [...doc.querySelectorAll('.tab')].find((t) => t.textContent.includes('奖项'))
let awardCards = 0
let runnerBlocks = 0
if (awardTab) {
  awardTab.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  for (let i = 0; i < 20; i++) {
    await sleep(250)
    awardCards = doc.querySelectorAll('.award-card').length
    runnerBlocks = doc.querySelectorAll('.award-runners').length
    if (awardCards > 0) break
  }
}
const awardGroups = doc.querySelectorAll('.award-group').length
checks.push(['奖项页渲染出卡片（≥20）', awardCards >= 20])
checks.push(['奖项卡片带提名区块', runnerBlocks >= 20])
checks.push(['奖项按分组渲染', awardGroups >= 4])

console.log('奖项页:', `${awardCards} 张卡片 / ${runnerBlocks} 个提名区块 / ${awardGroups} 个分组`)

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
