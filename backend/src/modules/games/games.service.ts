import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, GameDocument } from './schemas/game.schema';

const SEEDED_GAMES = [
  ['FIFA 24', 'Sports', 'EA Sports'],
  ['EA FC 25', 'Sports', 'EA Sports'],
  ['Call of Duty: Warzone', 'Shooter', 'Activision'],
  ['Call of Duty: Mobile', 'Shooter', 'Activision'],
  ['eFootball 2025', 'Sports', 'Konami'],
  ['PUBG Mobile', 'Battle Royale', 'Krafton'],
  ['PUBG Battlegrounds', 'Battle Royale', 'Krafton'],
  ['Fortnite', 'Battle Royale', 'Epic Games'],
  ['Apex Legends', 'Battle Royale', 'EA'],
  ['Valorant', 'Tactical Shooter', 'Riot Games'],
  ['League of Legends', 'MOBA', 'Riot Games'],
  ['Dota 2', 'MOBA', 'Valve'],
  ['Counter-Strike 2', 'Shooter', 'Valve'],
  ['Rocket League', 'Sports', 'Psyonix'],
  ['Street Fighter 6', 'Fighting', 'Capcom'],
  ['Tekken 8', 'Fighting', 'Bandai Namco'],
  ['Mortal Kombat 1', 'Fighting', 'NetherRealm'],
  ['Free Fire MAX', 'Battle Royale', 'Garena'],
  ['Clash Royale', 'Strategy', 'Supercell'],
  ['Mobile Legends', 'MOBA', 'Moonton'],
] as const;

@Injectable()
export class GamesService implements OnModuleInit {
  constructor(@InjectModel(Game.name) private readonly gameModel: Model<GameDocument>) {}

  async onModuleInit() {
    const count = await this.gameModel.estimatedDocumentCount();
    if (count > 0) {
      return;
    }

    await this.gameModel.insertMany(
      SEEDED_GAMES.map(([title, genre, publisher], index) => ({
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        genre,
        publisher,
        thumbnail: `https://picsum.photos/seed/game-${index + 1}/500/400`,
        heroImage: `https://picsum.photos/seed/game-hero-${index + 1}/1200/800`,
        isPopular: index < 12,
        isFeatured: index < 8,
        activePlayers: 5000 + index * 1375,
        liveStreams: 100 + index * 18,
        rating: Number((4.2 + (index % 5) * 0.12).toFixed(1)),
        modes: genre === 'Sports' ? ['1v1', 'Co-op', 'Tournament'] : ['Ranked', 'Casual', 'Tournament'],
      })),
    );
  }

  listGames(query?: { search?: string; popular?: string; featured?: string }) {
    const filter: Record<string, unknown> = {};

    if (query?.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

    if (query?.popular === 'true') {
      filter.isPopular = true;
    }

    if (query?.featured === 'true') {
      filter.isFeatured = true;
    }

    return this.gameModel.find(filter).sort({ activePlayers: -1 }).lean();
  }

  getFeaturedGames() {
    return this.gameModel.find({ isFeatured: true }).sort({ activePlayers: -1 }).limit(8).lean();
  }

  getGameById(gameId: string) {
    return this.gameModel.findById(gameId).lean();
  }

  getGamesForSeeding() {
    return this.gameModel.find().limit(6).lean();
  }
}
