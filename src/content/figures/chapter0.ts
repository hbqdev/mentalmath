import type { FigureOverrides } from './types'

// Chapter 0, "Quick Tricks: Easy (and Impressive) Calculations".
export const chapter0: FigureOverrides = {
  'ch0-f001': {
    kind: 'column',
    lines: [{ value: '1  ', carry: true }, { value: '835', rule: true }, { value: '935' }],
  },
  'ch0-f002': {
    kind: 'column',
    lines: [{ value: '1  ', carry: true }, { value: '527', rule: true }, { value: '627' }],
  },
  'ch0-f003': {
    kind: 'column',
    lines: [{ value: '1  ', carry: true }, { value: '989', rule: true }, { value: '1089' }],
  },
  'ch0-f004': {
    kind: 'column',
    lines: [
      { value: '35' },
      { op: '×', value: '35', rule: true },
      { label: '3 × 4 =', value: '12' },
      { label: '5 × 5 =', value: '25', rule: true },
      { label: 'Answer:', value: '1225' },
    ],
  },
  'ch0-f005': {
    kind: 'column',
    lines: [
      { value: '85' },
      { op: '×', value: '85', rule: true },
      { label: '8 × 9 =', value: '72' },
      { label: '5 × 5 =', value: '25', rule: true },
      { label: 'Answer:', value: '7225' },
    ],
  },
  'ch0-f006': {
    kind: 'column',
    lines: [
      { value: '83' },
      { op: '×', value: '87', rule: true },
      { label: '8 × 9 =', value: '72' },
      { label: '3 × 7 =', value: '21', rule: true },
      { label: 'Answer:', value: '7221' },
    ],
  },
  'ch0-f007': { kind: 'column', lines: [{ value: '1241' }, { op: '−', value: '587', rule: true }] },
  'ch0-f008': {
    kind: 'column',
    lines: [{ value: '1241' }, { op: '−', value: '600', rule: true }, { value: '641' }],
  },
  'ch0-f009': {
    kind: 'column',
    lines: [{ value: '641' }, { op: '+', value: '13', rule: true }, { value: '654' }],
  },
  'ch0-f010': {
    kind: 'column',
    lines: [
      { value: '9' },
      { value: '5' },
      { value: '14' },
      { value: '19' },
      { value: '33' },
      { value: '52' },
      { value: '85' },
      { value: '137' },
      { value: '222' },
      { op: '+', value: '359', rule: true },
      { value: '935' },
    ],
  },
  'ch0-f011': {
    kind: 'table',
    head: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    rows: [['1', '2', '3', '4', '5', '6', '7 or 0']],
  },
  'ch0-f012': {
    kind: 'column',
    lines: [
      { label: 'Bill:', value: '30' },
      { label: 'Tip:', op: '+', value: '7', rule: true },
      { value: '37' },
      { label: 'subtract 7s:', op: '−', value: '35', rule: true },
      { value: '2', note: '= Tuesday' },
    ],
  },
  'ch0-f013': {
    kind: 'column',
    lines: [
      { label: 'Bill:', value: '43' },
      { label: 'Tip:', op: '+', value: '10', rule: true },
      { value: '53' },
      { label: 'subtract 7s:', op: '−', value: '49', rule: true },
      { value: '4', note: '= Thursday' },
    ],
  },
}
