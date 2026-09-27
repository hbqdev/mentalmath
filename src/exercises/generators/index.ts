import type { GeneratedSetDef } from '../types'
import { sets as ch0 } from './chapter0'
import { sets as ch1 } from './chapter1'
import { sets as ch2 } from './chapter2'
import { sets as ch3 } from './chapter3'
import { sets as ch4 } from './chapter4'
import { sets as ch5 } from './chapter5'
import { sets as ch6 } from './chapter6'
import { sets as ch7 } from './chapter7'
import { sets as ch8 } from './chapter8'
import { sets as ch9 } from './chapter9'

export const generatedSets: GeneratedSetDef[] = [...ch0, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch7, ...ch8, ...ch9]

export function findGenerated(id: string): GeneratedSetDef | undefined {
  return generatedSets.find((s) => s.id === id)
}
