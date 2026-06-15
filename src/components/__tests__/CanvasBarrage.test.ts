import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CanvasBarrage from '../CanvasBarrage.vue'

// vitest-canvas-mock 自动 mock Canvas API

describe('CanvasBarrage.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('mounts and renders canvas', () => {
    const wrapper = mount(CanvasBarrage)
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('renders barrage input when showInput is true', () => {
    const wrapper = mount(CanvasBarrage, {
      props: { showInput: true },
    })
    expect(wrapper.find('.barrage-input').exists()).toBe(true)
    expect(wrapper.find('.barrage-send').exists()).toBe(true)
  })

  it('does not render input when showInput is false', () => {
    const wrapper = mount(CanvasBarrage)
    expect(wrapper.find('.barrage-input').exists()).toBe(false)
  })

  it('emits send event when send button clicked', async () => {
    const wrapper = mount(CanvasBarrage, {
      props: { showInput: true },
    })
    const input = wrapper.find('.barrage-input')
    await input.setValue('test barrage')
    await wrapper.find('.barrage-send').trigger('click')
    expect(wrapper.emitted('send')).toBeTruthy()
    expect(wrapper.emitted('send')![0]).toEqual(['test barrage'])
  })

  it('clears input after send', async () => {
    const wrapper = mount(CanvasBarrage, {
      props: { showInput: true },
    })
    const input = wrapper.find('.barrage-input')
    await input.setValue('clear me')
    await wrapper.find('.barrage-send').trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('uses withDefaults for props', () => {
    const wrapper = mount(CanvasBarrage)
    // speed=2 是默认值, opacity=0.85, fontSize=18
    expect(wrapper.props('speed')).toBe(2)
    expect(wrapper.props('opacity')).toBe(0.85)
    expect(wrapper.props('fontSize')).toBe(18)
    expect(wrapper.props('paused')).toBe(false)
  })

  it('respects custom prop values', () => {
    const wrapper = mount(CanvasBarrage, {
      props: { speed: 5, opacity: 0.5, fontSize: 24, paused: true },
    })
    expect(wrapper.props('speed')).toBe(5)
    expect(wrapper.props('opacity')).toBe(0.5)
    expect(wrapper.props('fontSize')).toBe(24)
    expect(wrapper.props('paused')).toBe(true)
  })
})
