import { EmoteType, RelativePosition } from '../../types'

interface EmoteBubbleProps {
  emoteType: EmoteType
  isVisible: boolean
  position?: RelativePosition | ''
}

const EMOTE_EMOJIS: Record<EmoteType, string> = {
  '👎': '👎',
  '🔥': '🔥',
  '🚮': '🚮'
}

export default function EmoteBubble({ emoteType, isVisible, position = '' }: EmoteBubbleProps) {
  // 位置に応じてスタイルを決定
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        // 上のプレイヤー：右側に表示
        return {
          top: '50%',
          left: '100%',
          transform: 'translateY(-50%)',
          marginLeft: '12px'
        }
      case 'right':
        // 右のプレイヤー：左側に表示
        return {
          top: '50%',
          right: '100%',
          transform: 'translateY(-50%)',
          marginRight: '12px'
        }
      case 'bottom':
        // 下のプレイヤー（自分）：左側に表示
        return {
          top: '50%',
          right: '100%',
          transform: 'translateY(-50%)',
          marginRight: '12px'
        }
      case 'left':
        // 左のプレイヤー：右側に表示
        return {
          top: '50%',
          left: '100%',
          transform: 'translateY(-50%)',
          marginLeft: '12px'
        }
      default:
        // デフォルト（上に表示）
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px'
        }
    }
  }

  // 吹き出しの尾の向きを決定
  const getTailClasses = () => {
    switch (position) {
      case 'top':
      case 'left':
        // 右側に表示される場合（尾は左向き）
        return `
          before:content-['']
          before:absolute
          before:top-1/2
          before:right-full
          before:transform
          before:-translate-y-1/2
          before:border-t-8
          before:border-b-8
          before:border-r-8
          before:border-t-transparent
          before:border-b-transparent
          before:border-r-gray-300
        `
      case 'right':
      case 'bottom':
        // 左側に表示される場合（尾は右向き）
        return `
          before:content-['']
          before:absolute
          before:top-1/2
          before:left-full
          before:transform
          before:-translate-y-1/2
          before:border-t-8
          before:border-b-8
          before:border-l-8
          before:border-t-transparent
          before:border-b-transparent
          before:border-l-gray-300
        `
      default:
        // デフォルト（尾は下向き）
        return `
          before:content-['']
          before:absolute
          before:top-full
          before:left-1/2
          before:transform
          before:-translate-x-1/2
          before:border-l-8
          before:border-r-8
          before:border-t-8
          before:border-l-transparent
          before:border-r-transparent
          before:border-t-gray-300
        `
    }
  }

  return (
    <div
      role="presentation"
      className={`
        absolute 
        bg-white 
        border-2 
        border-gray-300 
        rounded-lg 
        px-3 
        py-2 
        shadow-lg 
        transition-opacity 
        duration-300
        ${getTailClasses()}
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={getPositionStyles()}
    >
      <span className="text-4xl select-none">
        {EMOTE_EMOJIS[emoteType]}
      </span>
    </div>
  )
}