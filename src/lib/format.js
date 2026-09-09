export const TIER_NAME = {
  T0: '论外·元叙事级',
  T1: '创世·灭世级',
  T2: '神级·不死级',
  T3: '超凡·屠城级',
  T4: '高手级',
  T5: '凡人级',
  T6: '炮灰·被杀级',
  T7: '非战斗单位'
}

export const AOE_RANK = {
  无: 0,
  量级不明: 1,
  十人级: 2,
  百人级: 3,
  万人级: 4,
  文明级: 5,
  宇宙级: 6
}

export const TIER_ORDER = {
  T0: 0, T1: 1, T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T7: 7
}

export function tierBase(tier) {
  return String(tier || 'T7').replace('-∞', '')
}

export function tierName(tier) {
  return TIER_NAME[tierBase(tier)] || tierBase(tier)
}

export function tierLabel(tier) {
  return `${tier || 'T7'} ${tierName(tier)}`
}

export function isSelfKilled(tier) {
  return String(tier || '').endsWith('-∞')
}

export function killText(c) {
  const direct = Number(c.kills_direct || 0)
  const indirect = Number(c.kills_indirect || 0)
  const total = direct + indirect
  if (total === 0) return '0'
  return indirect > 0 ? `${direct}+${indirect}` : String(direct)
}

export function killTotal(c) {
  return Number(c.kills_direct || 0) + Number(c.kills_indirect || 0)
}

export function aoeText(c) {
  const aoe = c.aoe_level || '无'
  return aoe === '无' ? '—' : aoe
}

export const ENDING_CLASS = {
  存活: 'ending-alive',
  死亡: 'ending-dead',
  不明: 'ending-unknown',
  超脱: 'ending-ascend',
  概念性消亡: 'ending-concept',
  未登场: 'ending-offscreen'
}

export function endingClass(ending) {
  return ENDING_CLASS[ending] || ''
}
