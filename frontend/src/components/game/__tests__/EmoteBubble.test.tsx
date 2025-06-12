import { render, screen } from '@testing-library/react'
import EmoteBubble from '../EmoteBubble'
import { EmoteType } from '../../../types'

// Timer処理のためのjestタイマーモック
jest.useFakeTimers()

describe('EmoteBubble', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('エモートが吹き出し内に表示される', () => {
    render(<EmoteBubble emoteType="👎" isVisible={true} />)
    
    expect(screen.getByText('👎')).toBeInTheDocument()
    expect(screen.getByRole('presentation')).toHaveClass('opacity-100')
  })

  it('isVisibleがfalseの場合は非表示になる', () => {
    render(<EmoteBubble emoteType="🔥" isVisible={false} />)
    
    const bubble = screen.getByRole('presentation')
    expect(bubble).toHaveClass('opacity-0')
  })

  it('各エモートタイプが正しく表示される', () => {
    const testCases: Array<{ type: EmoteType; emoji: string }> = [
      { type: '👎', emoji: '👎' },
      { type: '🔥', emoji: '🔥' },
      { type: '🚮', emoji: '🚮' }
    ]

    testCases.forEach(({ type, emoji }) => {
      const { rerender } = render(<EmoteBubble emoteType={type} isVisible={true} />)
      expect(screen.getByText(emoji)).toBeInTheDocument()
      rerender(<div />)
    })
  })

  it('吹き出しデザインのスタイルが適用される', () => {
    render(<EmoteBubble emoteType="🔥" isVisible={true} />)
    
    const bubble = screen.getByRole('presentation')
    expect(bubble).toHaveClass(
      'absolute',
      'bg-white',
      'border-2',
      'border-gray-300',
      'rounded-lg',
      'px-3',
      'py-2',
      'shadow-lg',
      'transform',
      '-translate-x-1/2',
      'transition-opacity',
      'duration-300'
    )
  })

  it('アニメーション用のクラスが正しく適用される', () => {
    const { rerender } = render(<EmoteBubble emoteType="👎" isVisible={false} />)
    
    let bubble = screen.getByRole('presentation')
    expect(bubble).toHaveClass('opacity-0')
    
    rerender(<EmoteBubble emoteType="👎" isVisible={true} />)
    bubble = screen.getByRole('presentation')
    expect(bubble).toHaveClass('opacity-100')
  })

  it('吹き出しの矢印（三角形）が表示される', () => {
    render(<EmoteBubble emoteType="🚮" isVisible={true} />)
    
    // 疑似要素の三角形はテストしにくいが、コンテナの構造を確認
    const container = screen.getByRole('presentation')
    
    // 三角形用のクラスがコンテナに適用されているかチェック
    expect(container).toHaveClass('before:absolute')
  })
})