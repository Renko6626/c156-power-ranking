<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  defaultSort: { type: String, default: '' },
  emptyText: { type: String, default: '没有匹配的记录。' }
})

const sortKey = ref(props.defaultSort)
const sortDir = ref(-1)

watch(
  () => props.defaultSort,
  (k) => {
    sortKey.value = k
    sortDir.value = -1
  }
)

function valueOf(row, col) {
  return col.get ? col.get(row) : row[col.key]
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows
  const col = props.columns.find((c) => c.key === sortKey.value)
  if (!col) return props.rows
  const dir = sortDir.value
  return [...props.rows].sort((a, b) => {
    const x = valueOf(a, col)
    const y = valueOf(b, col)
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return String(x ?? '').localeCompare(String(y ?? ''), 'zh') * dir
  })
})

function toggle(col) {
  if (col.sortable === false) return
  if (sortKey.value === col.key) {
    sortDir.value = -sortDir.value
  } else {
    sortKey.value = col.key
    sortDir.value = col.firstDir === 1 ? 1 : -1
  }
}
</script>

<template>
  <div v-if="!sortedRows.length" class="empty">{{ emptyText }}</div>
  <div v-else class="table-wrap">
    <table>
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[col.align || '', { sorted: sortKey === col.key, 'hide-sm': col.hideSm }]"
            @click="toggle(col)"
          >
            {{ col.label }}<span v-if="sortKey === col.key">{{ sortDir > 0 ? ' ▲' : ' ▼' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in sortedRows" :key="row.uid || row.work_id || i">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[col.align || '', col.classOf ? col.classOf(row) : '', { 'hide-sm': col.hideSm }]"
          >
            {{ valueOf(row, col) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
