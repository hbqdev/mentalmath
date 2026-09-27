import { registerBookSets } from '@/exercises/bookSets'
import { sets as ch1 } from './ch1'
import { sets as ch2 } from './ch2'
import { sets as ch3 } from './ch3'
import { sets as ch4 } from './ch4'
import { sets as ch5 } from './ch5'

// One import of this module registers every transcribed book set.
registerBookSets([...ch1, ...ch2, ...ch3, ...ch4, ...ch5])
