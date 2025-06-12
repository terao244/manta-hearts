import { render, screen, fireEvent } from '@testing-library/react'
import { GameBoard } from '../GameBoard'
import type { GameBoardProps, CustomSocket, EmoteType } from '../../../types'

// Socket.ioのモック
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true
} as unknown as CustomSocket

// GameBoardのモックプロップス
const mockGameBoardProps: GameBoardProps = {
  gameState: {
    gameId: 1,
    status: 'playing',
    players: [
      { id: 1, displayName: 'Player 1', position: 'North' },
      { id: 2, displayName: 'Player 2', position: 'East' },
      { id: 3, displayName: 'Player 3', position: 'South' },
      { id: 4, displayName: 'Player 4', position: 'West' }
    ],
    currentHand: 1,
    currentTrick: 1,
    currentTurn: 1,
    phase: 'playing',
    heartsBroken: false,
    tricks: [],
    scores: { 1: 0, 2: 0, 3: 0, 4: 0 },
    currentHandScores: { 1: 0, 2: 0, 3: 0, 4: 0 },
    handCards: {
      1: [
        { id: 1, suit: 'Hearts', rank: 'A', points: 1 },
        { id: 2, suit: 'Spades', rank: 'Q', points: 13 }
      ]
    }
  },
  currentPlayerId: 1,
  validCardIds: [1, 2],
  onCardPlay: jest.fn(),
  onCardExchange: jest.fn(),
  socket: mockSocket
}

// EmoteButtons と EmoteBubble コンポーネントのモック
jest.mock('../EmoteButtons', () => {
  return function MockEmoteButtons({ socket }: { socket: CustomSocket | null; gameState: GameBoardProps['gameState'] }) {
    return (
      <div data-testid="emote-buttons">
        <button onClick={() => socket.emit('sendEmote', '👎')}>👎</button>
        <button onClick={() => socket.emit('sendEmote', '🔥')}>🔥</button>
        <button onClick={() => socket.emit('sendEmote', '🚮')}>🚮</button>
      </div>
    )
  }
})

jest.mock('../EmoteBubble', () => {
  return function MockEmoteBubble({ emoteType, isVisible }: { emoteType: string; isVisible: boolean }) {
    return (
      <div data-testid={`emote-bubble-${emoteType}`} className={isVisible ? 'visible' : 'hidden'}>
        {emoteType === '👎' && '👎'}
        {emoteType === '🔥' && '🔥'}
        {emoteType === '🚮' && '🚮'}
      </div>
    )
  }
})

describe('GameBoard エモート統合', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('自分のプレイヤー名横にEmoteButtonsが表示される', () => {
    render(<GameBoard {...mockGameBoardProps} />)
    
    // 自分のプレイヤーエリアにエモートボタンが表示される
    expect(screen.getByTestId('emote-buttons')).toBeInTheDocument()
    
    // エモートボタンをクリックできる
    const dislikeButton = screen.getByText('👎')
    fireEvent.click(dislikeButton)
    
    expect(mockSocket.emit).toHaveBeenCalledWith('sendEmote', '👎')
  })

  it('各プレイヤーにEmoteBubbleが配置される', () => {
    // エモートが設定されている状態でレンダー
    const propsWithEmote = {
      ...mockGameBoardProps,
      socket: mockSocket,
      playerEmotes: {
        1: { emoteType: '👎' as EmoteType, isVisible: true },
        2: { emoteType: '🔥' as EmoteType, isVisible: true }
      }
    }
    
    render(<GameBoard {...propsWithEmote} />)
    
    // エモートバブルが表示されることを確認
    expect(screen.getByTestId('emote-bubble-👎')).toBeInTheDocument()
    expect(screen.getByTestId('emote-bubble-🔥')).toBeInTheDocument()
  })

  it('playerEmotesプロップによりエモートバブルが制御される', () => {
    // 最初は非表示状態でレンダー
    const { rerender } = render(<GameBoard {...mockGameBoardProps} socket={mockSocket} />)
    
    // エモートバブルが存在しないことを確認
    expect(screen.queryByTestId('emote-bubble-🔥')).not.toBeInTheDocument()
    
    // エモートが表示される状態に変更
    const propsWithEmote = {
      ...mockGameBoardProps,
      socket: mockSocket,
      playerEmotes: {
        2: { emoteType: '🔥' as EmoteType, isVisible: true }
      }
    }
    
    rerender(<GameBoard {...propsWithEmote} />)
    
    // 該当プレイヤーのエモートバブルが表示されることを確認
    expect(screen.getByTestId('emote-bubble-🔥')).toBeInTheDocument()
    expect(screen.getByTestId('emote-bubble-🔥')).toHaveClass('visible')
  })

  it('複数プレイヤーのエモートが同時に表示可能', () => {
    const propsWithMultipleEmotes = {
      ...mockGameBoardProps,
      socket: mockSocket,
      playerEmotes: {
        2: { emoteType: '🔥' as EmoteType, isVisible: true },
        3: { emoteType: '👎' as EmoteType, isVisible: true }
      }
    }
    
    render(<GameBoard {...propsWithMultipleEmotes} />)
    
    // 両方のエモートバブルが表示される
    expect(screen.getByTestId('emote-bubble-🔥')).toBeInTheDocument()
    expect(screen.getByTestId('emote-bubble-👎')).toBeInTheDocument()
    expect(screen.getByTestId('emote-bubble-🔥')).toHaveClass('visible')
    expect(screen.getByTestId('emote-bubble-👎')).toHaveClass('visible')
  })

  it('ゲーム外フェーズではEmoteButtonsが表示されない', () => {
    const waitingProps = {
      ...mockGameBoardProps,
      gameState: {
        ...mockGameBoardProps.gameState,
        phase: 'waiting' as const
      }
    }
    
    render(<GameBoard {...waitingProps} />)
    
    // waitingフェーズではエモートボタンが表示されない
    expect(screen.queryByTestId('emote-buttons')).not.toBeInTheDocument()
  })

  it('exchangingフェーズでもEmoteButtonsが表示される', () => {
    const exchangingProps = {
      ...mockGameBoardProps,
      gameState: {
        ...mockGameBoardProps.gameState,
        phase: 'exchanging' as const
      }
    }
    
    render(<GameBoard {...exchangingProps} />)
    
    // exchangingフェーズでもエモートボタンが表示される
    expect(screen.getByTestId('emote-buttons')).toBeInTheDocument()
  })
})