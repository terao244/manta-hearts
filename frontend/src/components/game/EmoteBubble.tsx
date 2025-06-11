import { EmoteType } from '../../types'

interface EmoteBubbleProps {
  emoteType: EmoteType
  isVisible: boolean
}

const EMOTE_EMOJIS: Record<EmoteType, string> = {
  dislike: '👎',
  fire: '🔥',
  trash: '🚮'
}

export default function EmoteBubble({ emoteType, isVisible }: EmoteBubbleProps) {
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
        transform 
        -translate-x-1/2 
        transition-opacity 
        duration-300
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
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        bottom: '100%',
        left: '50%',
        marginBottom: '8px'
      }}
    >
      <span className="text-2xl select-none">
        {EMOTE_EMOJIS[emoteType]}
      </span>
    </div>
  )
}