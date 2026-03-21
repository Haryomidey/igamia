import { useEffect, useState } from 'react';
import { api } from '../api/axios';

export type Game = {
  _id: string;
  title: string;
  slug: string;
  genre: string;
  publisher: string;
  thumbnail: string;
  heroImage: string;
  isPopular: boolean;
  isFeatured: boolean;
  activePlayers: number;
  liveStreams: number;
  rating: number;
  modes: string[];
};

export function useGames(params?: { search?: string; popular?: boolean; featured?: boolean }) {
  const [games, setGames] = useState<Game[]>([]);
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Game[]>('/games', {
        params: {
          search: params?.search,
          popular: params?.popular ? 'true' : undefined,
          featured: params?.featured ? 'true' : undefined,
        },
      });
      setGames(data);
      setError(null);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Unable to fetch games';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedGames = async () => {
    try {
      const { data } = await api.get<Game[]>('/games/featured');
      setFeaturedGames(data);
      return data;
    } catch {
      return [];
    }
  };

  const fetchGame = async (gameId: string) => {
    const { data } = await api.get<Game>(`/games/${gameId}`);
    return data;
  };

  useEffect(() => {
    void fetchGames();
    void fetchFeaturedGames();
  }, [params?.featured, params?.popular, params?.search]);

  return {
    games,
    featuredGames,
    loading,
    error,
    fetchGames,
    fetchFeaturedGames,
    fetchGame,
  };
}
