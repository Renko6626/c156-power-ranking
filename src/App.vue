<script setup>
import { computed, onMounted, ref } from 'vue'
import DataTable from './components/DataTable.vue'
import AwardsPanel from './components/AwardsPanel.vue'
import {
  aoeText,
  endingClass,
  killTotal,
  tierBase,
  tierLabel
} from './lib/format.js'

const BOARDS = ['总战力榜', '击杀榜', '死亡人数榜', '分组榜', '奖项']

const data = ref(null)
const error = ref('')
const loading = ref(true)
const board = ref(BOARDS[0])
const query = ref('')
const category = ref('')
const humanOnly = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('./data/ranking.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    data.value = await res.json()
    const cats = Object.keys(data.value?.leaderboards?.by_category || {})
    category.value = cats[0] || ''
  } catch (e) {
    error.value = String(e && e.message ? e.message : e)
  } finally {
    loading.value = false
  }
})

const categories = computed(() => Object.keys(data.value?.leaderboards?.by_category || {}))

const totals = computed(() => data.value?.totals || {})

const charByUid = computed(() => {
  const map = {}
  for (const c of data.value?.characters || []) map[c.uid] = c
  return map
})

const workById = computed(() => {
  const map = {}
  for (const w of data.value?.works || []) map[w.work_id] = w
  return map
})

function matchQuery(row) {
  const q = query.value.trim().toLowerCase()
  if (!q) return true
  return JSON.stringify(row).toLowerCase().includes(q)
}

// 过滤掉「非人物角色」：非人格角色（洪水、瘟疫、AI、器物）与抽象意象（时间、记忆）
function matchKind(c) {
  return !humanOnly.value || c.kind === '人格角色'
}

/* ---------- 总战力榜 ---------- */
const powerRows = computed(() => {
  const list = data.value?.characters || []
  return list
    .map((c, i) => ({ ...c, __rank: i + 1 }))
    .filter((c) => matchKind(c) && matchQuery(c))
})

const powerColumns = [
  { key: '__rank', label: '#', align: 'num', firstDir: 1, get: (r) => r.__rank },
  {
    key: 'name',
    label: '角色',
    classOf: () => 'name',
    get: (r) => r.name
  },
  { key: 'work_title', label: '出处', classOf: () => 'dim', get: (r) => r.work_title },
  {
    key: 'power_tier',
    label: '等级',
    classOf: (r) => `tier ${tierBase(r.power_tier)}`,
    get: (r) => tierLabel(r.power_tier)
  },
  {
    key: 'power_score',
    label: '战力',
    align: 'num',
    get: (r) => Number(r.power_score || 0)
  },
  {
    key: 'ending',
    label: '结局',
    classOf: (r) => endingClass(r.ending),
    get: (r) => r.ending
  },
  {
    key: 'kills',
    label: '击杀(L1+L2)',
    align: 'num',
    get: (r) => killTotal(r)
  },
  {
    key: 'aoe_level',
    label: '范围',
    hideSm: true,
    get: (r) => aoeText(r)
  },
  { key: 'note', label: '吐槽', classOf: () => 'note', hideSm: true, get: (r) => r.note || '' }
]

/* ---------- 击杀榜 ---------- */
const killRows = computed(() => {
  const list = data.value?.characters || []
  return list
    .filter((c) => killTotal(c) > 0 || (c.aoe_level && c.aoe_level !== '无'))
    .map((c, i) => ({ ...c, __rank: i + 1 }))
    .filter((c) => matchKind(c) && matchQuery(c))
})

const killColumns = [
  { key: '__rank', label: '#', align: 'num', firstDir: 1, get: (r) => r.__rank },
  { key: 'name', label: '角色', classOf: () => 'name', get: (r) => r.name },
  { key: 'work_title', label: '出处', classOf: () => 'dim', get: (r) => r.work_title },
  {
    key: 'power_tier',
    label: '等级',
    classOf: (r) => `tier ${tierBase(r.power_tier)}`,
    get: (r) => tierLabel(r.power_tier)
  },
  {
    key: 'kills_direct',
    label: 'L1 亲手',
    align: 'num',
    get: (r) => Number(r.kills_direct || 0)
  },
  {
    key: 'kills_indirect',
    label: 'L2 间接',
    align: 'num',
    get: (r) => Number(r.kills_indirect || 0)
  },
  { key: 'aoe_level', label: 'L3 范围', get: (r) => aoeText(r) },
  {
    key: 'ending',
    label: '结局',
    classOf: (r) => endingClass(r.ending),
    get: (r) => r.ending
  },
  { key: 'note', label: '吐槽', classOf: () => 'note', hideSm: true, get: (r) => r.note || '' }
]

/* ---------- 死亡人数榜 ---------- */
const deathRows = computed(() => {
  const order = data.value?.leaderboards?.death_toll || []
  return order
    .map((wid, i) => {
      const w = workById.value[wid] || {}
      const dt = w.death_toll || {}
      return {
        __rank: i + 1,
        work_id: wid,
        work_title: w.work_title || `#${wid}`,
        total_label: dt.total_label || '无',
        named_deaths: Number(dt.named_deaths || 0),
        unnamed: Number(dt.unnamed_or_group_deaths || 0),
        events: Number(dt.mass_event_count || 0),
        note: w.note || ''
      }
    })
    .filter(matchQuery)
})

const deathColumns = [
  { key: '__rank', label: '#', align: 'num', firstDir: 1, get: (r) => r.__rank },
  { key: 'work_title', label: '作品', classOf: () => 'name', get: (r) => r.work_title },
  { key: 'total_label', label: '死亡量级', get: (r) => r.total_label },
  {
    key: 'named_deaths',
    label: '有名死亡',
    align: 'num',
    get: (r) => r.named_deaths
  },
  { key: 'unnamed', label: '无名/群体', align: 'num', get: (r) => r.unnamed },
  { key: 'events', label: '群体事件', align: 'num', hideSm: true, get: (r) => r.events },
  { key: 'note', label: '备注', classOf: () => 'note', hideSm: true, get: (r) => r.note }
]

/* ---------- 分组榜 ---------- */
const categoryRows = computed(() => {
  const uids = data.value?.leaderboards?.by_category?.[category.value] || []
  return uids
    .map((uid) => charByUid.value[uid])
    .filter(Boolean)
    .sort((a, b) => Number(b.power_score || 0) - Number(a.power_score || 0))
    .map((c, i) => ({ ...c, __rank: i + 1 }))
    .filter((c) => matchKind(c) && matchQuery(c))
})

const categoryColumns = [
  { key: '__rank', label: '#', align: 'num', firstDir: 1, get: (r) => r.__rank },
  { key: 'name', label: '角色', classOf: () => 'name', get: (r) => r.name },
  { key: 'work_title', label: '出处', classOf: () => 'dim', get: (r) => r.work_title },
  {
    key: 'power_tier',
    label: '等级',
    classOf: (r) => `tier ${tierBase(r.power_tier)}`,
    get: (r) => tierLabel(r.power_tier)
  },
  { key: 'power_score', label: '战力', align: 'num', get: (r) => Number(r.power_score || 0) },
  {
    key: 'ending',
    label: '结局',
    classOf: (r) => endingClass(r.ending),
    get: (r) => r.ending
  }
]

const currentCount = computed(() => {
  if (board.value === '总战力榜') return powerRows.value.length
  if (board.value === '击杀榜') return killRows.value.length
  if (board.value === '死亡人数榜') return deathRows.value.length
  if (board.value === '分组榜') return categoryRows.value.length
  return 0
})

const currentColumns = computed(() => {
  if (board.value === '总战力榜') return powerColumns
  if (board.value === '击杀榜') return killColumns
  if (board.value === '死亡人数榜') return deathColumns
  return categoryColumns
})

const currentRows = computed(() => {
  if (board.value === '总战力榜') return powerRows.value
  if (board.value === '击杀榜') return killRows.value
  if (board.value === '死亡人数榜') return deathRows.value
  return categoryRows.value
})
</script>

<template>
  <header class="site-header">
    <div class="wrap">
      <h1>跃动七周年创作活动 · <em>战力排行榜</em></h1>
      <div class="tagline">恶搞向数据榜 · 只玩角色与统计口径的梗</div>

      <p class="disclaimer">
        <strong>⚠️ 非官方 · 全程剧透 · 纯玩梗</strong><br />
        本页是读者自制的恶搞统计，与活动主办方及任何作者无关；不评价作品与作者，只对角色、设定和统计口径开玩笑。
        下方所有数据都包含结局与死亡信息，<strong>请先读完原作再往下看</strong>。
      </p>

      <div class="chips">
        <div class="chip">作品 <b>{{ totals.works || 0 }}</b> 篇</div>
        <div class="chip">角色 <b>{{ totals.characters || 0 }}</b> 个</div>
        <div class="chip">死亡角色 <b>{{ totals.deaths || 0 }}</b> 个</div>
        <div class="chip">L1 亲手击杀 <b>{{ totals.kills_direct || 0 }}</b></div>
        <div class="chip">L2 间接击杀 <b>{{ totals.kills_indirect || 0 }}</b></div>
        <div class="chip">自灭 T∞ <b>{{ totals.self_kills || 0 }}</b></div>
      </div>
    </div>
  </header>

  <main class="wrap">
    <div v-if="loading" class="empty">正在加载数据…</div>

    <div v-else-if="error" class="error">
      数据加载失败：{{ error }}<br />
      请确认 <code>data/ranking.json</code> 存在。
    </div>

    <template v-else>
      <div class="tabs">
        <button
          v-for="b in BOARDS"
          :key="b"
          class="tab"
          :class="{ active: board === b }"
          @click="board = b"
        >
          {{ b }}
        </button>
      </div>

      <div v-if="board !== '奖项'" class="tools">
        <input v-model="query" type="search" placeholder="搜索角色 / 作品 / 等级 / 结局…" />
        <select v-if="board === '分组榜'" v-model="category">
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <label v-if="board !== '死亡人数榜'" class="switch" :class="{ on: humanOnly }">
          <input v-model="humanOnly" type="checkbox" />
          <span>只看人物角色</span>
        </label>
        <span class="count">
          {{ currentCount }} 条记录<template v-if="humanOnly && board !== '死亡人数榜'">
            （已过滤非人物角色）</template
          >
        </span>
      </div>

      <AwardsPanel
        v-if="board === '奖项'"
        :awards="data.awards || []"
        :cross-work="data.cross_work || []"
      />

      <DataTable
        v-else
        :columns="currentColumns"
        :rows="currentRows"
        empty-text="没有匹配的记录。"
      />

      <div class="panel" style="margin-top: 18px">
        <h3>统计口径</h3>
        <p class="note" style="margin: 0 0 8px; font-size: 13px">
          <b>击杀三层</b>：L1 亲手（进数字）、L2 下令/设局/造物代劳（进数字）、L3 群体死亡（
          <b>只给量级标签，不编数字</b>）。
        </p>
        <p class="note" style="margin: 0 0 8px; font-size: 13px">
          <b>战力等级</b>：T0 论外·元叙事 → T1 创世·灭世 → T2 神级·不死 → T3 超凡·屠城 → T4 高手 →
          T5 凡人 → T6 炮灰 → T7 非战斗单位；<b>-∞</b> 表示死于自己之手。
        </p>
        <p class="note" style="margin: 0; font-size: 13px">
          <b>T7 也参与总排名</b>：按「概念杀伤潜力」0–19 分计，所以「时间」可能排在某个持枪士兵前面。
        </p>
      </div>
    </template>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p>非官方同人统计页面 · 与活动主办方及作者无关 · 数据仅供娱乐</p>
      <p v-if="data">数据生成于 {{ data.generated_at }}</p>
    </div>
  </footer>
</template>
