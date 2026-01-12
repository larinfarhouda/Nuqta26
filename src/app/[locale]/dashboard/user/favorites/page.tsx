import { getUserFavorites, getUserFavoriteIds } from '@/actions/user';
import EventCard from '@/components/events/EventCard';
import { Heart } from 'lucide-react';

export default async function UserFavoritesPage() {
    const favorites = await getUserFavorites();
    const favoriteIds = await getUserFavoriteIds();
    const favoritesSet = new Set(favoriteIds);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                    <Heart className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">My Favorites</h1>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-500">No favorite events yet.</p>
                    <p className="text-sm text-gray-400">Mark events as favorites to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((event: any) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            isFavoriteInitial={favoritesSet.has(event.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
