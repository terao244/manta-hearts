import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { GameBoard } from '../GameBoard'
import type { GameBoardProps } from '../../../types'
import { Socket } from 'socket.io-client'

// Socket.ioのモック
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true
} as unknown as Socket

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
  return function MockEmoteButtons({ socket, gameState }: any) {
    return (
      <div data-testid="emote-buttons">
        <button onClick={() => socket.emit('sendEmote', 'dislike')}>👎</button>
        <button onClick={() => socket.emit('sendEmote', 'fire')}>🔥</button>
        <button onClick={() => socket.emit('sendEmote', 'trash')}>🚮</button>
      </div>
    )
  }
})

jest.mock('../EmoteBubble', () => {
  return function MockEmoteBubble({ emoteType, isVisible }: any) {
    return (
      <div data-testid={`emote-bubble-${emoteType}`} className={isVisible ? 'visible' : 'hidden'}>
        {emoteType === 'dislike' && '👎'}
        {emoteType === 'fire' && '🔥'}
        {emoteType === 'trash' && '🚮'}
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
    
    expect(mockSocket.emit).toHaveBeenCalledWith('sendEmote', 'dislike')
  })

  it('各プレイヤーにEmoteBubbleが配置される', () => {
    // エモートが設定されている状態でレンダー
    const propsWithEmote = {
      ...mockGameBoardProps,
      socket: mockSocket
    }
    
    render(<GameBoard {...propsWithEmote} />)
    
    // socket.onが呼ばれ、receiveEmoteイベントリスナーが設定されることを確認
    expect(mockSocket.on).toHaveBeenCalledWith('receiveEmote', expect.any(Function))
  })

  it('receiveEmoteイベント受信時に該当プレイヤーにEmoteBubbleが表示される', async () => {
    const propsWithSocket = { ...mockGameBoardProps, socket: mockSocket }
    render(<GameBoard {...propsWithSocket} />)
    
    // socket.onが呼ばれていることを確認
    expect(mockSocket.on).toHaveBeenCalledWith('receiveEmote', expect.any(Function))
    
    // receiveEmoteイベントハンドラーを取得してテスト実行
    const receiveEmoteHandler = (mockSocket.on as jest.Mock).mock.calls
      .find(call => call[0] === 'receiveEmote')?.[1]
    
    if (receiveEmoteHandler) {
      // エモート受信をシミュレート
      await act(async () => {
        receiveEmoteHandler({
          fromPlayerId: 2,
          emoteType: 'fire',
          timestamp: Date.now()
        })
      })
      
      await waitFor(() => {
        // 該当プレイヤーのエモートバブルが表示状態になることを期待
        const fireBubble = screen.getByTestId('emote-bubble-fire')
        expect(fireBubble).toHaveClass('visible')
      })
    }
  })

  it('複数プレイヤーのエモートが同時に表示可能', async () => {
    const propsWithSocket = { ...mockGameBoardProps, socket: mockSocket }
    render(<GameBoard {...propsWithSocket} />)
    
    const receiveEmoteHandler = (mockSocket.on as jest.Mock).mock.calls
      .find(call => call[0] === 'receiveEmote')?.[1]
    
    if (receiveEmoteHandler) {
      // 複数のエモートを受信
      await act(async () => {
        receiveEmoteHandler({
          fromPlayerId: 2,
          emoteType: 'fire',
          timestamp: Date.now()
        })
        
        receiveEmoteHandler({
          fromPlayerId: 3,
          emoteType: 'dislike',
          timestamp: Date.now()
        })
      })
      
      await waitFor(() => {
        // 両方のエモートバブルが表示される
        expect(screen.getByTestId('emote-bubble-fire')).toHaveClass('visible')
        expect(screen.getByTestId('emote-bubble-dislike')).toHaveClass('visible')
      })
    }
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