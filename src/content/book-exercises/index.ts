import { registerBookSets } from '@/exercises/bookSets'
import { sets as ch1 } from './ch1'

// One import of this module registers every transcribed book set.
registerBookSets([...ch1])
