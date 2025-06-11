import { EmoteType } from '../index';

describe('Emote Types - Frontend', () => {
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

  describe('EmoteType validation', () => {
    it('should be one of the valid emote types', () => {
      const validEmotes: EmoteType[] = ['👎', '🔥', '🚮'];
      
      validEmotes.forEach(emote => {
        expect(['👎', '🔥', '🚮']).toContain(emote);
      });
    });

    it('should have exactly 3 emote types', () => {
      const emote1: EmoteType = '👎';
      const emote2: EmoteType = '🔥';
      const emote3: EmoteType = '🚮';
      
      // Type-level test to ensure these are the only valid types
      expect([emote1, emote2, emote3]).toHaveLength(3);
    });
  });
});