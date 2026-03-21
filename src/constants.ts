import { Game, Stream, User } from './types';

export const FEATURED_GAMES: Game[] = [
  {
    id: '1',
    title: 'Cyber Strike',
    thumbnail: 'https://picsum.photos/seed/cyber/400/225',
    category: 'Action',
    players: 1200,
    isLive: true
  },
  {
    id: '2',
    title: 'Neon Racer',
    thumbnail: 'https://picsum.photos/seed/race/400/225',
    category: 'Racing',
    players: 850,
    isLive: true
  },
  {
    id: '3',
    title: 'Shadow Quest',
    thumbnail: 'https://picsum.photos/seed/quest/400/225',
    category: 'RPG',
    players: 3400
  }
];

export const LIVE_STREAMS: Stream[] = [
  {
    id: 's1',
    streamer: 'ProGamer99',
    game: 'Cyber Strike',
    viewers: 1200,
    thumbnail: 'https://picsum.photos/seed/stream1/400/225'
  },
  {
    id: 's2',
    streamer: 'EliteQueen',
    game: 'Neon Racer',
    viewers: 850,
    thumbnail: 'https://picsum.photos/seed/stream2/400/225'
  }
];

export const CURRENT_USER: User = {
  id: 'u1',
  username: 'AlexGamer',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  followers: 1240,
  following: 450,
  bio: 'Hardcore gamer and streamer. Love RPGs and Action games.',
  wallet: {
    usd: 250.50,
    coins: 1500
  }
};