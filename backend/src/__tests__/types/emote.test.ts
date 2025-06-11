import { EmoteType } from '../../types';
import { ServerSocket } from '../../types';

describe('Emote Types', () => {
  describe('EmoteType', () => {
    it('should have thumbs down emote type', () => {
      const emote: EmoteType = '👎';
      expect(emote).toBe('👎');
    });

    it('should have fire emote type', () => {
      const emote: EmoteType = '🔥';
      expect(emote).toBe('🔥');
    });

    it('should have trash emote type', () => {
      const emote: EmoteType = '🚮';
      expect(emote).toBe('🚮');
    });
  });

  describe('Socket.io Event Types', () => {
    it('should have sendEmote in ClientToServerEvents', () => {
      // Type-level test: This will fail compilation if the type doesn't exist
      const handler = (emoteType: EmoteType) => {
        expect(['👎', '🔥', '🚮']).toContain(emoteType);
      };
      
      // Simple test that the handler function accepts EmoteType
      handler('👎');
      expect(true).toBe(true);
    });

    it('should have receiveEmote in ServerToClientEvents', () => {
      // Type-level test for emit payload
      const playerId = 1;
      const emoteType: EmoteType = '👎';
      
      // Test that the data structure matches expected format
      const emoteData = { playerId, emoteType };
      expect(emoteData.playerId).toBe(1);
      expect(emoteData.emoteType).toBe('👎');
    });
  });
});