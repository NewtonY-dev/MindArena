/**
 * Generates a unique 6-character room code
 * Format: Alphanumeric (e.g., A7K9P2)
 * Excludes confusing characters: 0, O, 1, I, L
 */
export const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

export default { generateRoomCode };
