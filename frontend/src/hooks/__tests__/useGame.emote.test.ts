import { renderHook, act } from '@testing-library/react'
import { useGame } from '../useGame'
import { useSocket } from '../useSocket'
import type { EmoteType, CustomSocket } from '../../types'

// useSocketのモック
jest.mock('../useSocket')
const mockUseSocket = useSocket as jest.MockedFunction<typeof useSocket>

// Socket.ioのモック
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true
}

// GameServiceのモック
const mockGameService = {
  createGame: jest.fn(),
  joinGame: jest.fn(),
  playCard: jest.fn(),
  exchangeCards: jest.fn(),
  getValidCards: jest.fn()
}

describe('useGame エモート機能', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // useSocketのモック設定
    mockUseSocket.mockReturnValue({
      socket: mockSocket as CustomSocket,
      isConnected: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gameService: mockGameService as unknown as any,
      joinGame: jest.fn(),
      playCard: jest.fn(),
      exchangeCards: jest.fn(),
      on: mockSocket.on,
      off: mockSocket.off
    })
  })

  it('sendEmote関数が提供される', () => {
    const { result } = renderHook(() => useGame(null))
    
    expect(typeof result.current.sendEmote).toBe('function')
  })

  it('sendEmote関数がSocket.ioでエモートを送信する', () => {
    const { result } = renderHook(() => useGame(null))
    
    act(() => {
      result.current.sendEmote('fire')
    })
    
    expect(mockSocket.emit).toHaveBeenCalledWith('sendEmote', 'fire')
  })

  it('playerEmotesステートが管理される', () => {
    const { result } = renderHook(() => useGame(null))
    
    // 初期状態では空のオブジェクト
    expect(result.current.playerEmotes).toEqual({})
  })

  it('receiveEmoteイベントでplayerEmotesが更新される', () => {
    const { result } = renderHook(() => useGame(null))
    
    // socket.onが呼ばれることを確認
    expect(mockSocket.on).toHaveBeenCalledWith('receiveEmote', expect.any(Function))
    
    // receiveEmoteイベントハンドラーを取得
    const receiveEmoteHandler = (mockSocket.on as jest.Mock).mock.calls
      .find(call => call[0] === 'receiveEmote')?.[1]
    
    if (receiveEmoteHandler) {
      act(() => {
        receiveEmoteHandler({
          fromPlayerId: 2,
          emoteType: 'dislike' as EmoteType,
          timestamp: Date.now()
        })
      })
      
      // playerEmotesが更新されることを確認
      expect(result.current.playerEmotes).toEqual({
        2: {
          emoteType: 'dislike',
          isVisible: true,
          timestamp: expect.any(Number)
        }
      })
    }
  })

  it('エモート表示が2秒後に自動的に非表示になる', async () => {
    jest.useFakeTimers()
    
    const { result } = renderHook(() => useGame(null))
    
    const receiveEmoteHandler = (mockSocket.on as jest.Mock).mock.calls
      .find(call => call[0] === 'receiveEmote')?.[1]
    
    if (receiveEmoteHandler) {
      act(() => {
        receiveEmoteHandler({
          fromPlayerId: 3,
          emoteType: 'trash' as EmoteType,
          timestamp: Date.now()
        })
      })
      
      // 最初は表示状態
      expect(result.current.playerEmotes[3]?.isVisible).toBe(true)
      
      // 2秒経過
      act(() => {
        jest.advanceTimersByTime(2000)
      })
      
      // 非表示になる
      expect(result.current.playerEmotes[3]?.isVisible).toBe(false)
    }
    
    jest.useRealTimers()
  })

  it('Socket未接続時はsendEmote関数が何もしない', () => {
    // Socket未接続状態のモック
    mockUseSocket.mockReturnValue({
      socket: null,
      isConnected: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gameService: mockGameService as unknown as any,
      joinGame: jest.fn(),
      playCard: jest.fn(),
      exchangeCards: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    })
    
    const { result } = renderHook(() => useGame(null))
    
    act(() => {
      result.current.sendEmote('fire')
    })
    
    // Socket.emitが呼ばれないことを確認
    expect(mockSocket.emit).not.toHaveBeenCalled()
  })

  it('複数のエモートが適切に管理される', () => {
    const { result } = renderHook(() => useGame(null))
    
    const receiveEmoteHandler = (mockSocket.on as jest.Mock).mock.calls
      .find(call => call[0] === 'receiveEmote')?.[1]
    
    if (receiveEmoteHandler) {
      // 複数のプレイヤーからエモートを受信
      act(() => {
        receiveEmoteHandler({
          fromPlayerId: 2,
          emoteType: 'fire' as EmoteType,
          timestamp: Date.now()
        })
        
        receiveEmoteHandler({
          fromPlayerId: 3,
          emoteType: 'dislike' as EmoteType,
          timestamp: Date.now()
        })
      })
      
      // 両方のエモートが管理されることを確認
      expect(result.current.playerEmotes).toEqual({
        2: {
          emoteType: 'fire',
          isVisible: true,
          timestamp: expect.any(Number)
        },
        3: {
          emoteType: 'dislike',
          isVisible: true,
          timestamp: expect.any(Number)
        }
      })
    }
  })
})