export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  players: number;
  pledgeAmount?: number;
  isLive?: boolean;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  followers: number;
  following: number;
  bio: string;
  wallet: {
    usd: number;
    coins: number;
  };
}

export interface Stream {
  id: string;
  streamer: string;
  game: string;
  viewers: number;
  thumbnail: string;
}
