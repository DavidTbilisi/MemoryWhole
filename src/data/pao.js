import {
  PAO10_PEOPLE_DATA,
  PAO10_ACTIONS_DATA,
  PAO10_OBJECTS_DATA,
  PAO10_PEOPLE_IMAGES,
  PAO10_ACTIONS_IMAGES,
  PAO10_OBJECTS_IMAGES,
} from './pao10'

export const PAO_PEOPLE = Object.entries(PAO10_PEOPLE_DATA).map(([num, person]) => ({
  num: Number(num),
  person,
}))

export const PAO_ACTIONS = Object.entries(PAO10_ACTIONS_DATA).map(([num, action]) => ({
  num: Number(num),
  action,
}))

export const PAO_OBJECTS = Object.entries(PAO10_OBJECTS_DATA).map(([num, object]) => ({
  num: Number(num),
  object,
}))

export const PAO_DATA = {}
export const PAO_IMAGES = {}
export const PAO_ICONS = {}

for (let i = 0; i < 10; i += 1) {
  const key = String(i)
  PAO_DATA[`P${key}`] = PAO10_PEOPLE_DATA[key] || ''
  PAO_DATA[`A${key}`] = PAO10_ACTIONS_DATA[key] || ''
  PAO_DATA[`O${key}`] = PAO10_OBJECTS_DATA[key] || ''

  PAO_IMAGES[`P${key}`] = PAO10_PEOPLE_IMAGES[key] || ''
  PAO_IMAGES[`A${key}`] = PAO10_ACTIONS_IMAGES[key] || ''
  PAO_IMAGES[`O${key}`] = PAO10_OBJECTS_IMAGES[key] || ''

  PAO_ICONS[`P${key}`] = '🧑'
  PAO_ICONS[`A${key}`] = '⚡'
  PAO_ICONS[`O${key}`] = '🗡️'
}

export function getPAOPartLabel(dataMap, type, digit) {
  return String(dataMap?.[`${type}${digit}`] || '').trim()
}

export function getPAOSceneLabel(num, dataMap) {
  const digits = String(num).padStart(3, '0')
  const person = getPAOPartLabel(dataMap, 'P', digits[0])
  const action = getPAOPartLabel(dataMap, 'A', digits[1])
  const object = getPAOPartLabel(dataMap, 'O', digits[2])
  return [person, action, object].filter(Boolean).join(' • ')
}
