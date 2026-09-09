<script setup>
defineProps({
  awards: { type: Array, default: () => [] },
  crossWork: { type: Array, default: () => [] }
})
</script>

<template>
  <div class="panel">
    <div v-if="!awards.length && !crossWork.length" class="empty">
      奖项与跨作品对照尚未生成。
    </div>

    <template v-if="awards.length">
      <h3>恶搞奖项</h3>
      <div v-for="(a, i) in awards" :key="i" class="award">
        <b>{{ a.award }}</b> → <span class="who">{{ a.winner }}</span>
        <span class="dim">（《{{ a.work_title }}》）</span>
        <div class="reason">{{ a.reason }}</div>
      </div>
    </template>

    <template v-if="crossWork.length">
      <h3 style="margin-top: 18px">跨作品重复角色</h3>
      <div v-for="(x, i) in crossWork" :key="i" class="award">
        <b>{{ x.name }}</b>：
        <span class="reason">
          {{ (x.appearances || []).map((p) => `《${p.work_title}》${p.note || ''}`).join('；') }}
        </span>
      </div>
    </template>
  </div>
</template>
