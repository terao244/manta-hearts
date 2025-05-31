export interface GameConfig {
  endScore: number;
}

export const getGameConfig = (): GameConfig => {
  const endScore = parseInt(process.env.GAME_END_SCORE || '100', 10);
  
  if (isNaN(endScore) || endScore <= 0) {
    throw new Error('GAME_END_SCORE must be a positive number');
  }
  
  return {
    endScore
  };
};