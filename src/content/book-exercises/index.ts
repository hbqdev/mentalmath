import { registerBookSets } from '@/exercises/bookSets'
import { sets as ch1 } from './ch1'
import { sets as ch2 } from './ch2'
import { sets as ch3 } from './ch3'
import { sets as ch4 } from './ch4'
import { sets as ch5 } from './ch5'
import { sets as ch6 } from './ch6'
import { sets as ch8 } from './ch8'
import { sets as ch9 } from './ch9'

// One import of this module registers every transcribed book set.
registerBookSets([...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...ch6, ...ch8, ...ch9])
