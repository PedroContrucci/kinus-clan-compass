// Hooks para buscar dados do Supabase

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// Types
export type Country = Tables<'countries'>;
export type City = Tables<'cities'>;
export type Airport = Tables<'airports'>;
export type Airline = Tables<'airlines'>;
export type FlightRoute = Tables<'flight_routes'>;
export type CommunityActivity = Tables<'community_activities'>;
export type Trip = Tables<'trips'>;
export type TripActivity = Tables<'trip_activities'>;

// Fetch all countries
export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name_pt', { ascending: true });
      
      if (error) throw error;
      return data as Country[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Fetch cities with optional country filter
export function useCities(countryId?: string) {
  return useQuery({
    queryKey: ['cities', countryId],
    queryFn: async () => {
      let query = supabase
        .from('cities')
        .select(`
          *,
          country:countries(*)
        `)
        .order('name_pt', { ascending: true });
      
      if (countryId) {
        query = query.eq('country_id', countryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Fetch airports with optional city filter
export function useAirports(cityId?: string) {
  return useQuery({
    queryKey: ['airports', cityId],
    queryFn: async () => {
      let query = supabase
        .from('airports')
        .select(`
          *,
          city:cities(*),
          country:countries(*)
        `)
        .order('name_pt', { ascending: true });
      
      if (cityId) {
        query = query.eq('city_id', cityId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });
}

// Fetch airlines
export function useAirlines() {
  return useQuery({
    queryKey: ['airlines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('airlines')
        .select(`
          *,
          country:countries(*)
        `)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
}

// Fetch flight routes between two airports
export function useFlightRoutes(originAirportId?: string, destinationAirportId?: string) {
  return useQuery({
    queryKey: ['flight_routes', originAirportId, destinationAirportId],
    queryFn: async () => {
      let query = supabase
        .from('flight_routes')
        .select(`
          *,
          origin_airport:airports!flight_routes_origin_airport_id_fkey(*),
          destination_airport:airports!flight_routes_destination_airport_id_fkey(*)
        `);
      
      if (originAirportId) {
        query = query.eq('origin_airport_id', originAirportId);
      }
      if (destinationAirportId) {
        query = query.eq('destination_airport_id', destinationAirportId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: Boolean(originAirportId || destinationAirportId),
    staleTime: 1000 * 60 * 30,
  });
}

// Fetch community activities with filters
export function useCommunityActivities(filters?: {
  countryId?: string;
  cityId?: string;
  category?: 'flight' | 'hotel' | 'experience' | 'restaurant' | 'transport' | 'other';
  isTopPick?: boolean;
}) {
  return useQuery({
    queryKey: ['community_activities', filters],
    queryFn: async () => {
      let query = supabase
        .from('community_activities')
        .select(`
          *,
          city:cities(*),
          country:countries(*)
        `)
        .eq('is_published', true)
        .order('rating_average', { ascending: false });
      
      if (filters?.countryId) {
        query = query.eq('country_id', filters.countryId);
      }
      if (filters?.cityId) {
        query = query.eq('city_id', filters.cityId);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.isTopPick) {
        query = query.eq('is_top_pick', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Fetch community itineraries
export function useCommunityItineraries(filters?: {
  countryId?: string;
  cityId?: string;
  isFeatured?: boolean;
}) {
  return useQuery({
    queryKey: ['community_itineraries', filters],
    queryFn: async () => {
      let query = supabase
        .from('community_itineraries')
        .select(`
          *,
          destination_city:cities(*),
          destination_country:countries(*)
        `)
        .eq('is_published', true)
        .order('likes_count', { ascending: false });
      
      if (filters?.countryId) {
        query = query.eq('destination_country_id', filters.countryId);
      }
      if (filters?.cityId) {
        query = query.eq('destination_city_id', filters.cityId);
      }
      if (filters?.isFeatured) {
        query = query.eq('is_featured', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

// Fetch photos for activities
export function useCommunityPhotos(activityIds?: string[]) {
  return useQuery({
    queryKey: ['community_photos', activityIds],
    queryFn: async () => {
      if (!activityIds || activityIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('community_photos')
        .select('*')
        .in('activity_id', activityIds)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(activityIds && activityIds.length > 0),
    staleTime: 1000 * 60 * 10,
  });
}

// Fetch user trips
export function useUserTrips(userId?: string) {
  return useQuery({
    queryKey: ['trips', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          origin_city:cities!trips_origin_city_id_fkey(*),
          destination_city:cities!trips_destination_city_id_fkey(*),
          activities:trip_activities(*),
          payments:trip_payments(*),
          checklist:trip_checklist(*),
          travelers:trip_travelers(*)
        `)
        .eq('user_id', userId)
        .order('departure_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Search cities and airports for autocomplete
export function useCityAirportSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['city_airport_search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return { cities: [], airports: [] };
      
      const normalizedSearch = searchTerm.toLowerCase();
      
      // Search cities
      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select(`
          *,
          country:countries(name_pt, code)
        `)
        .or(`name_pt.ilike.%${normalizedSearch}%,name_en.ilike.%${normalizedSearch}%`)
        .limit(10);
      
      if (citiesError) throw citiesError;
      
      // Search airports
      const { data: airports, error: airportsError } = await supabase
        .from('airports')
        .select(`
          *,
          city:cities(name_pt),
          country:countries(name_pt, code)
        `)
        .or(`name_pt.ilike.%${normalizedSearch}%,name_en.ilike.%${normalizedSearch}%,iata_code.ilike.%${normalizedSearch}%`)
        .limit(10);
      
      if (airportsError) throw airportsError;
      
      return { cities: cities || [], airports: airports || [] };
    },
    enabled: searchTerm.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

// Find route between two cities (via airports)
export function useRouteInfo(originCityName: string, destinationCityName: string) {
  return useQuery({
    queryKey: ['route_info', originCityName, destinationCityName],
    queryFn: async () => {
      if (!originCityName || !destinationCityName) return null;
      
      // Get origin airports
      const { data: originCity } = await supabase
        .from('cities')
        .select('id')
        .or(`name_pt.ilike.%${originCityName}%,name_en.ilike.%${originCityName}%`)
        .maybeSingle();
      
      // Get destination airports
      const { data: destCity } = await supabase
        .from('cities')
        .select('id')
        .or(`name_pt.ilike.%${destinationCityName}%,name_en.ilike.%${destinationCityName}%`)
        .maybeSingle();
      
      if (!originCity || !destCity) return null;
      
      // Get airports for these cities
      const { data: originAirports } = await supabase
        .from('airports')
        .select('id, iata_code, name_pt')
        .eq('city_id', originCity.id);
      
      const { data: destAirports } = await supabase
        .from('airports')
        .select('id, iata_code, name_pt')
        .eq('city_id', destCity.id);
      
      if (!originAirports?.length || !destAirports?.length) {
        return { hasRoute: false, needsConnection: true, message: 'Aeroportos não encontrados' };
      }
      
      // Check for direct routes
      const originIds = originAirports.map(a => a.id);
      const destIds = destAirports.map(a => a.id);
      
      const { data: routes } = await supabase
        .from('flight_routes')
        .select(`
          *,
          origin_airport:airports!flight_routes_origin_airport_id_fkey(iata_code, name_pt),
          destination_airport:airports!flight_routes_destination_airport_id_fkey(iata_code, name_pt)
        `)
        .in('origin_airport_id', originIds)
        .in('destination_airport_id', destIds);
      
      if (routes && routes.length > 0) {
        const directRoutes = routes.filter(r => r.has_direct_flight);
        const bestRoute = directRoutes.length > 0 ? directRoutes[0] : routes[0];
        
        return {
          hasRoute: true,
          hasDirect: bestRoute.has_direct_flight,
          needsConnection: !bestRoute.has_direct_flight,
          connections: bestRoute.common_connections || [],
          estimatedDuration: bestRoute.estimated_duration_minutes,
          averagePrice: bestRoute.average_price_brl,
          airlines: bestRoute.airlines || [],
          originAirport: bestRoute.origin_airport,
          destinationAirport: bestRoute.destination_airport,
        };
      }
      
      return {
        hasRoute: false,
        needsConnection: true,
        message: 'Rota não encontrada. Conexões podem ser necessárias.',
      };
    },
    enabled: Boolean(originCityName && destinationCityName),
    staleTime: 1000 * 60 * 10,
  });
}
