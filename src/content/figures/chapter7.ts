import type { FigureOverrides, FigureSpec } from './types'
import { inline, pre, split, stack } from './helpers'

const mnemonic = (digits: string, sentence: string): FigureSpec =>
  stack([pre([digits], 'center'), { kind: 'text', lines: [sentence], serif: true }])
const nested = (outer: FigureSpec, inner: FigureSpec): FigureSpec => stack([outer, inner], true)

// Chapter 7, "A Memorable Chapter: Memorizing Numbers".
export const chapter7: FigureOverrides = {
  'ch7-f001': inline('{22/7}'),
  'ch7-f002': mnemonic(
    '3   1415   926   5   3   58   97   9   3   2   384   6264',
    '“My turtle Pancho will, my love, pick up my new mover, Ginger.”',
  ),
  'ch7-f003': mnemonic(
    '3   38   327   950   2   8841   971',
    '“My movie monkey plays in a favorite bucket.”',
  ),
  'ch7-f004': mnemonic(
    '69   3   99   375   1   05820   97494',
    '“Ship my puppy Michael to Sullivan’s backrubber.”',
  ),
  'ch7-f005': stack([
    mnemonic(
      '45   92   307   81   640   62   8   620',
      '“A really open music video cheers Jenny F. Jones.”',
    ),
    mnemonic(
      '8   99   86   28   0   3482   5   3421   1   7067',
      '“Have a baby fish knife so Marvin will marinate the goosechick.”',
    ),
  ]),
  'ch7-f006': nested(
    split('342', '42', '384', '300', '115,200 + 42² = 116,964', '“Title”'),
    split('42', '2', '44', '40', '1760 + 2² = 1764'),
  ),
  'ch7-f007': nested(
    split('273', '27', '300', '246', '73,800 + 27² = 74,529', '“Gum”'),
    split('27', '3', '30', '24', '720 + 3² = 729'),
  ),
}
