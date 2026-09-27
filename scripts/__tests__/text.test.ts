// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { collapseWs, slugify, titleCase, uniqueSlug } from '../lib/text'

describe('titleCase', () => {
  it('lowercases shouting headings and capitalises words', () => {
    expect(titleCase('INSTANT MULTIPLICATION')).toBe('Instant Multiplication')
  })
  it('keeps small words lower except at the start', () => {
    expect(titleCase('THE ART OF MATHEMATICAL MAGIC')).toBe('The Art of Mathematical Magic')
    expect(titleCase('A DAY FOR ANY DATE')).toBe('A Day for Any Date')
  })
  it('handles digits and hyphenated tokens', () => {
    expect(titleCase('3-BY-2 MULTIPLICATION')).toBe('3-by-2 Multiplication')
    expect(titleCase('THE MAGIC 1089!')).toBe('The Magic 1089!')
  })
  it('leaves mixed-case input alone', () => {
    expect(titleCase('Why This Trick Works')).toBe('Why This Trick Works')
  })
})

describe('slugify / uniqueSlug', () => {
  it('makes url-safe lowercase slugs', () => {
    expect(slugify('Squaring and More!')).toBe('squaring-and-more')
    expect(slugify('3-by-2 Multiplication')).toBe('3-by-2-multiplication')
    expect(slugify('“Guesstimation”')).toBe('guesstimation')
  })
  it('suffixes repeats in order', () => {
    const used = new Set<string>()
    expect(uniqueSlug('why-this-trick-works', used)).toBe('why-this-trick-works')
    expect(uniqueSlug('why-this-trick-works', used)).toBe('why-this-trick-works-2')
    expect(uniqueSlug('why-this-trick-works', used)).toBe('why-this-trick-works-3')
  })
})

describe('collapseWs', () => {
  it('collapses runs of whitespace including nbsp', () => {
    expect(collapseWs('Quick Tricks:\n Easy  (and Impressive)')).toBe(
      'Quick Tricks: Easy (and Impressive)',
    )
  })
})
