import { describe, it, expect } from 'vitest'
import { applyBackgroundTone, isDarkColor } from '../src/lib/palette.js'

const base = {
  bg: '#ffffff',
  bgAlt: '#eeeeee',
  surface: '#dddddd',
  text: '#111111',
  accent: '#2d4262',
  accentDark: '#1c2b3a',
  sectionDark: '#101010',
  sectionDarkText: '#fafafa',
  vibrant: '#2d4262',
}

describe('isDarkColor', () => {
  it('treats navy as dark', () => expect(isDarkColor('#2d4262')).toBe(true))
  it('treats gold as light', () => expect(isDarkColor('#c9a96e')).toBe(false))
  it('handles 3-digit hex', () => expect(isDarkColor('#000')).toBe(true))
})

describe('applyBackgroundTone — vibrant', () => {
  it('uses the vibrant color as background', () => {
    expect(applyBackgroundTone({ ...base, vibrant: '#2d4262' }, 'vibrant').bg).toBe('#2d4262')
  })

  it('auto-picks LIGHT text on a dark vibrant', () => {
    const p = applyBackgroundTone({ ...base, vibrant: '#2d4262' }, 'vibrant')
    expect(p.text).toBe('#fafafa') // palette.sectionDarkText
  })

  it('auto-picks DARK text on a light vibrant', () => {
    const p = applyBackgroundTone({ ...base, vibrant: '#c9a96e' }, 'vibrant')
    expect(p.text).toBe('#111111') // palette.text
  })

  it('remaps button to a contrasting inverse', () => {
    const p = applyBackgroundTone({ ...base, vibrant: '#2d4262' }, 'vibrant')
    expect(p.btnBg).toBe('#fafafa')
    expect(p.btnText).toBe('#2d4262')
  })

  it('falls back to accent when vibrant is unset', () => {
    const p = applyBackgroundTone({ ...base, vibrant: undefined }, 'vibrant')
    expect(p.bg).toBe('#2d4262') // accent
  })
})

describe('applyBackgroundTone — unchanged tones', () => {
  it('default is a no-op', () => {
    expect(applyBackgroundTone(base, 'default')).toBe(base)
  })
  it('dark still pairs sectionDark + sectionDarkText', () => {
    const p = applyBackgroundTone(base, 'dark')
    expect(p.bg).toBe('#101010')
    expect(p.text).toBe('#fafafa')
  })
})
