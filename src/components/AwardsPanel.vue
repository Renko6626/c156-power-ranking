<script setup>
import { computed } from 'vue'

const props = defineProps({
  awards: { type: Array, default: () => [] },
  crossWork: { type: Array, default: () => [] }
})

const GROUP_ORDER = ['战绩', '战力', '结局', '角色', '特别']
const GROUP_ICON = {
  战绩: '⚔️',
  战力: '💥',
  结局: '⚰️',
  角色: '🎭',
  特别: '✨'
}

// 有 group 字段就分组渲染，否则平铺
const grouped = computed(() => {
  const withGroup = props.awards.some((a) => a.group)
  if (!withGroup) return null
  const map = {}
  for (const a of props.awards) {
    const g = a.group || '特别'
    ;(map[g] ||= []).push(a)
  }
  return GROUP_ORDER.filter((g) => map[g]?.length).map((g) => ({ group: g, items: map[g] }))
})
</script>

<template>
  <div v-if="!awards.length && !crossWork.length" class="panel empty">
    奖项与跨作品对照尚未生成。
  </div>

  <template v-else>
    <template v-if="grouped">
      <section v-for="g in grouped" :key="g.group" class="award-group">
        <h3 class="group-title">
          <span class="group-icon">{{ GROUP_ICON[g.group] || '🏆' }}</span>{{ g.group }}类
          <span class="dim">{{ g.items.length }} 项</span>
        </h3>
        <div class="award-grid">
          <article v-for="(a, i) in g.items" :key="i" class="award-card">
            <div class="award-name">🏆 {{ a.award }}</div>
            <div class="award-winner">{{ a.winner }}</div>
            <div class="award-work">《{{ a.work_title }}》</div>
            <p class="award-reason">{{ a.reason }}</p>
            <div v-if="a.runners_up && a.runners_up.length" class="award-runners">
              <span class="dim">提名：</span>
              <span v-for="(r, j) in a.runners_up" :key="j" class="runner">
                {{ r.winner }}<span class="dim">（《{{ r.work_title }}》）</span>
                <span v-if="r.reason" class="runner-reason">{{ r.reason }}</span>
              </span>
            </div>
          </article>
        </div>
      </section>
    </template>

    <div v-else class="panel">
      <div v-for="(a, i) in awards" :key="i" class="award">
        <b>{{ a.award }}</b> → <span class="who">{{ a.winner }}</span>
        <span class="dim">（《{{ a.work_title }}》）</span>
        <div class="reason">{{ a.reason }}</div>
      </div>
    </div>

    <section v-if="crossWork.length" class="award-group">
      <h3 class="group-title"><span class="group-icon">🔗</span>跨作品重复角色</h3>
      <div class="panel">
        <div v-for="(x, i) in crossWork" :key="i" class="award">
          <b>{{ x.name }}</b>：
          <span class="reason">
            {{ (x.appearances || []).map((p) => `《${p.work_title}》${p.note || ''}`).join('；') }}
          </span>
        </div>
      </div>
    </section>
  </template>
</template>
