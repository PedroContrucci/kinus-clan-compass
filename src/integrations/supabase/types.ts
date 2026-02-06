export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_auctions: {
        Row: {
          activity_id: string | null
          best_price_date: string | null
          best_price_found: number | null
          best_price_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          kinu_estimate: number | null
          max_wait_days: number | null
          savings: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["auction_status"] | null
          target_price: number
          updated_at: string | null
        }
        Insert: {
          activity_id?: string | null
          best_price_date?: string | null
          best_price_found?: number | null
          best_price_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          kinu_estimate?: number | null
          max_wait_days?: number | null
          savings?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["auction_status"] | null
          target_price: number
          updated_at?: string | null
        }
        Update: {
          activity_id?: string | null
          best_price_date?: string | null
          best_price_found?: number | null
          best_price_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          kinu_estimate?: number | null
          max_wait_days?: number | null
          savings?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["auction_status"] | null
          target_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_auctions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "trip_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      airlines: {
        Row: {
          baggage_rules: Json | null
          country_id: string | null
          created_at: string | null
          iata_code: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          baggage_rules?: Json | null
          country_id?: string | null
          created_at?: string | null
          iata_code: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          baggage_rules?: Json | null
          country_id?: string | null
          created_at?: string | null
          iata_code?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "airlines_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      airports: {
        Row: {
          city_id: string | null
          country_id: string | null
          created_at: string | null
          iata_code: string
          icao_code: string | null
          id: string
          is_international: boolean | null
          latitude: number | null
          longitude: number | null
          name_en: string
          name_pt: string
          timezone: string | null
        }
        Insert: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          iata_code: string
          icao_code?: string | null
          id?: string
          is_international?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name_en: string
          name_pt: string
          timezone?: string | null
        }
        Update: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          iata_code?: string
          icao_code?: string | null
          id?: string
          is_international?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name_en?: string
          name_pt?: string
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "airports_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "airports_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          average_daily_cost_brl: number | null
          best_months: number[] | null
          country_id: string | null
          created_at: string | null
          id: string
          is_capital: boolean | null
          is_popular_destination: boolean | null
          latitude: number | null
          longitude: number | null
          name_en: string
          name_pt: string
          state_province: string | null
          timezone: string | null
        }
        Insert: {
          average_daily_cost_brl?: number | null
          best_months?: number[] | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_capital?: boolean | null
          is_popular_destination?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name_en: string
          name_pt: string
          state_province?: string | null
          timezone?: string | null
        }
        Update: {
          average_daily_cost_brl?: number | null
          best_months?: number[] | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_capital?: boolean | null
          is_popular_destination?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name_en?: string
          name_pt?: string
          state_province?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      clan_members: {
        Row: {
          birth_date: string | null
          created_at: string | null
          dietary_restrictions: string[] | null
          document_number: string | null
          document_type: string | null
          id: string
          name: string
          special_needs: string | null
          type: Database["public"]["Enums"]["traveler_type"]
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          name: string
          special_needs?: string | null
          type: Database["public"]["Enums"]["traveler_type"]
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          name?: string
          special_needs?: string | null
          type?: Database["public"]["Enums"]["traveler_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clan_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_activities: {
        Row: {
          address: string | null
          author_id: string | null
          best_time_to_visit: string | null
          category: Database["public"]["Enums"]["activity_category"] | null
          city_id: string | null
          cost_level: string | null
          country_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          estimated_cost_brl: number | null
          google_place_id: string | null
          id: string
          is_published: boolean | null
          is_top_pick: boolean | null
          is_verified: boolean | null
          itinerary_id: string | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          phone: string | null
          rank_in_category: number | null
          rank_tags: string[] | null
          rating_average: number | null
          rating_count: number | null
          tips: string[] | null
          title: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          author_id?: string | null
          best_time_to_visit?: string | null
          category?: Database["public"]["Enums"]["activity_category"] | null
          city_id?: string | null
          cost_level?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          estimated_cost_brl?: number | null
          google_place_id?: string | null
          id?: string
          is_published?: boolean | null
          is_top_pick?: boolean | null
          is_verified?: boolean | null
          itinerary_id?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          phone?: string | null
          rank_in_category?: number | null
          rank_tags?: string[] | null
          rating_average?: number | null
          rating_count?: number | null
          tips?: string[] | null
          title: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          author_id?: string | null
          best_time_to_visit?: string | null
          category?: Database["public"]["Enums"]["activity_category"] | null
          city_id?: string | null
          cost_level?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          estimated_cost_brl?: number | null
          google_place_id?: string | null
          id?: string
          is_published?: boolean | null
          is_top_pick?: boolean | null
          is_verified?: boolean | null
          itinerary_id?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          phone?: string | null
          rank_in_category?: number | null
          rank_tags?: string[] | null
          rating_average?: number | null
          rating_count?: number | null
          tips?: string[] | null
          title?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_activities_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_activities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_activities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_activities_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "community_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          activity_id: string | null
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          likes_count: number | null
          parent_comment_id: string | null
          updated_at: string | null
        }
        Insert: {
          activity_id?: string | null
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string | null
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "community_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_itineraries: {
        Row: {
          author_id: string | null
          copies_count: number | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          destination_city_id: string | null
          destination_country_id: string | null
          duration_days: number | null
          estimated_budget_brl: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          likes_count: number | null
          tags: string[] | null
          title: string
          travel_style: string | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          copies_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          destination_city_id?: string | null
          destination_country_id?: string | null
          duration_days?: number | null
          estimated_budget_brl?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title: string
          travel_style?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          copies_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          destination_city_id?: string | null
          destination_country_id?: string | null
          duration_days?: number | null
          estimated_budget_brl?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          travel_style?: string | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_itineraries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_itineraries_destination_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_itineraries_destination_country_id_fkey"
            columns: ["destination_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      community_photos: {
        Row: {
          activity_id: string | null
          author_id: string | null
          caption: string | null
          created_at: string | null
          id: string
          is_cover: boolean | null
          sort_order: number | null
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          activity_id?: string | null
          author_id?: string | null
          caption?: string | null
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          activity_id?: string | null
          author_id?: string | null
          caption?: string | null
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_photos_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "community_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_photos_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_ratings: {
        Row: {
          activity_id: string | null
          created_at: string | null
          id: string
          rating: number | null
          review: string | null
          user_id: string | null
          visited_at: string | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          user_id?: string | null
          visited_at?: string | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          user_id?: string | null
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_ratings_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "community_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          currency_code: string | null
          emergency_numbers: Json | null
          id: string
          name_en: string
          name_pt: string
          power_plug: string | null
          timezone_default: string | null
          tips: string[] | null
          vaccines_recommended: string[] | null
          vaccines_required: string[] | null
          visa_notes: string | null
          visa_required_br: boolean | null
          voltage: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          currency_code?: string | null
          emergency_numbers?: Json | null
          id?: string
          name_en: string
          name_pt: string
          power_plug?: string | null
          timezone_default?: string | null
          tips?: string[] | null
          vaccines_recommended?: string[] | null
          vaccines_required?: string[] | null
          visa_notes?: string | null
          visa_required_br?: boolean | null
          voltage?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          currency_code?: string | null
          emergency_numbers?: Json | null
          id?: string
          name_en?: string
          name_pt?: string
          power_plug?: string | null
          timezone_default?: string | null
          tips?: string[] | null
          vaccines_recommended?: string[] | null
          vaccines_required?: string[] | null
          visa_notes?: string | null
          visa_required_br?: boolean | null
          voltage?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          id: string
          rate: number
          recorded_at: string | null
          source: string | null
          target_currency: string
        }
        Insert: {
          base_currency: string
          id?: string
          rate: number
          recorded_at?: string | null
          source?: string | null
          target_currency: string
        }
        Update: {
          base_currency?: string
          id?: string
          rate?: number
          recorded_at?: string | null
          source?: string | null
          target_currency?: string
        }
        Relationships: []
      }
      flight_routes: {
        Row: {
          airlines: string[] | null
          average_price_brl: number | null
          common_connections: string[] | null
          created_at: string | null
          destination_airport_id: string | null
          estimated_duration_minutes: number | null
          has_direct_flight: boolean | null
          id: string
          origin_airport_id: string | null
        }
        Insert: {
          airlines?: string[] | null
          average_price_brl?: number | null
          common_connections?: string[] | null
          created_at?: string | null
          destination_airport_id?: string | null
          estimated_duration_minutes?: number | null
          has_direct_flight?: boolean | null
          id?: string
          origin_airport_id?: string | null
        }
        Update: {
          airlines?: string[] | null
          average_price_brl?: number | null
          common_connections?: string[] | null
          created_at?: string | null
          destination_airport_id?: string | null
          estimated_duration_minutes?: number | null
          has_direct_flight?: boolean | null
          id?: string
          origin_airport_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_routes_destination_airport_id_fkey"
            columns: ["destination_airport_id"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_routes_origin_airport_id_fkey"
            columns: ["origin_airport_id"]
            isOneToOne: false
            referencedRelation: "airports"
            referencedColumns: ["id"]
          },
        ]
      }
      kinu_insights: {
        Row: {
          created_at: string | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean | null
          message: string
          severity: Database["public"]["Enums"]["severity_type"] | null
          suggestion: string | null
          title: string
          trigger_type: string | null
          trip_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          message: string
          severity?: Database["public"]["Enums"]["severity_type"] | null
          suggestion?: string | null
          title: string
          trigger_type?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          message?: string
          severity?: Database["public"]["Enums"]["severity_type"] | null
          suggestion?: string | null
          title?: string
          trigger_type?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kinu_insights_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kinu_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      luggage_types: {
        Row: {
          depth_cm: number | null
          height_cm: number | null
          id: string
          is_carry_on: boolean | null
          name: string
          weight_limit_kg: number | null
          width_cm: number | null
        }
        Insert: {
          depth_cm?: number | null
          height_cm?: number | null
          id?: string
          is_carry_on?: boolean | null
          name: string
          weight_limit_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          depth_cm?: number | null
          height_cm?: number | null
          id?: string
          is_carry_on?: boolean | null
          name?: string
          weight_limit_kg?: number | null
          width_cm?: number | null
        }
        Relationships: []
      }
      packing_items_library: {
        Row: {
          average_weight_kg: number | null
          category: string | null
          climate_tags: string[] | null
          created_at: string | null
          depth_cm: number | null
          height_cm: number | null
          icon: string | null
          id: string
          is_essential: boolean | null
          name: string
          subcategory: string | null
          width_cm: number | null
        }
        Insert: {
          average_weight_kg?: number | null
          category?: string | null
          climate_tags?: string[] | null
          created_at?: string | null
          depth_cm?: number | null
          height_cm?: number | null
          icon?: string | null
          id?: string
          is_essential?: boolean | null
          name: string
          subcategory?: string | null
          width_cm?: number | null
        }
        Update: {
          average_weight_kg?: number | null
          category?: string | null
          climate_tags?: string[] | null
          created_at?: string | null
          depth_cm?: number | null
          height_cm?: number | null
          icon?: string | null
          id?: string
          is_essential?: boolean | null
          name?: string
          subcategory?: string | null
          width_cm?: number | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          auction_id: string | null
          id: string
          price: number
          recorded_at: string | null
          source: string | null
          url: string | null
        }
        Insert: {
          auction_id?: string | null
          id?: string
          price: number
          recorded_at?: string | null
          source?: string | null
          url?: string | null
        }
        Update: {
          auction_id?: string | null
          id?: string
          price?: number
          recorded_at?: string | null
          source?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "activity_auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_activities: {
        Row: {
          actual_cost: number | null
          auction_enabled: boolean | null
          booking_reference: string | null
          category: Database["public"]["Enums"]["activity_category"]
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          day_number: number
          description: string | null
          duration_minutes: number | null
          end_datetime: string | null
          estimated_cost: number | null
          external_url: string | null
          id: string
          is_confirmed: boolean | null
          is_from_clan: boolean | null
          latitude: number | null
          location_address: string | null
          location_name: string | null
          longitude: number | null
          name: string
          notes: string | null
          sort_order: number | null
          source_activity_id: string | null
          start_datetime: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          auction_enabled?: boolean | null
          booking_reference?: string | null
          category: Database["public"]["Enums"]["activity_category"]
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          day_number: number
          description?: string | null
          duration_minutes?: number | null
          end_datetime?: string | null
          estimated_cost?: number | null
          external_url?: string | null
          id?: string
          is_confirmed?: boolean | null
          is_from_clan?: boolean | null
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          longitude?: number | null
          name: string
          notes?: string | null
          sort_order?: number | null
          source_activity_id?: string | null
          start_datetime?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          auction_enabled?: boolean | null
          booking_reference?: string | null
          category?: Database["public"]["Enums"]["activity_category"]
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          day_number?: number
          description?: string | null
          duration_minutes?: number | null
          end_datetime?: string | null
          estimated_cost?: number | null
          external_url?: string | null
          id?: string
          is_confirmed?: boolean | null
          is_from_clan?: boolean | null
          latitude?: number | null
          location_address?: string | null
          location_name?: string | null
          longitude?: number | null
          name?: string
          notes?: string | null
          sort_order?: number | null
          source_activity_id?: string | null
          start_datetime?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_activities_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklist: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          item: string
          trip_id: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          item: string
          trip_id?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          item?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklist_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_packing: {
        Row: {
          airline_id: string | null
          created_at: string | null
          excess_fee: number | null
          id: string
          items: Json | null
          luggage_type_id: string | null
          total_weight_kg: number | null
          trip_id: string | null
          updated_at: string | null
          weight_limit_kg: number | null
        }
        Insert: {
          airline_id?: string | null
          created_at?: string | null
          excess_fee?: number | null
          id?: string
          items?: Json | null
          luggage_type_id?: string | null
          total_weight_kg?: number | null
          trip_id?: string | null
          updated_at?: string | null
          weight_limit_kg?: number | null
        }
        Update: {
          airline_id?: string | null
          created_at?: string | null
          excess_fee?: number | null
          id?: string
          items?: Json | null
          luggage_type_id?: string | null
          total_weight_kg?: number | null
          trip_id?: string | null
          updated_at?: string | null
          weight_limit_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_packing_airline_id_fkey"
            columns: ["airline_id"]
            isOneToOne: false
            referencedRelation: "airlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_packing_luggage_type_id_fkey"
            columns: ["luggage_type_id"]
            isOneToOne: false
            referencedRelation: "luggage_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_packing_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_payments: {
        Row: {
          activity_id: string | null
          amount: number
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string
          due_date: string | null
          id: string
          is_paid: boolean | null
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          trip_id: string | null
        }
        Insert: {
          activity_id?: string | null
          amount: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description: string
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          trip_id?: string | null
        }
        Update: {
          activity_id?: string | null
          amount?: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_payments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "trip_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_payments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_travelers: {
        Row: {
          age_at_travel: number | null
          clan_member_id: string | null
          cost_multiplier: number | null
          created_at: string | null
          id: string
          name: string | null
          trip_id: string | null
          type: Database["public"]["Enums"]["traveler_type"] | null
        }
        Insert: {
          age_at_travel?: number | null
          clan_member_id?: string | null
          cost_multiplier?: number | null
          created_at?: string | null
          id?: string
          name?: string | null
          trip_id?: string | null
          type?: Database["public"]["Enums"]["traveler_type"] | null
        }
        Update: {
          age_at_travel?: number | null
          clan_member_id?: string | null
          cost_multiplier?: number | null
          created_at?: string | null
          id?: string
          name?: string | null
          trip_id?: string | null
          type?: Database["public"]["Enums"]["traveler_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_travelers_clan_member_id_fkey"
            columns: ["clan_member_id"]
            isOneToOne: false
            referencedRelation: "clan_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_travelers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget_currency: Database["public"]["Enums"]["currency_type"] | null
          budget_priority: Database["public"]["Enums"]["priority_type"] | null
          budget_total: number | null
          budget_used: number | null
          completed_at: string | null
          cover_image_url: string | null
          created_at: string | null
          departure_date: string
          destination_city_id: string | null
          id: string
          name: string
          notes: string | null
          origin_city_id: string | null
          return_date: string
          status: Database["public"]["Enums"]["trip_status"] | null
          travel_style: string | null
          trust_zone_max: number | null
          trust_zone_min: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          budget_currency?: Database["public"]["Enums"]["currency_type"] | null
          budget_priority?: Database["public"]["Enums"]["priority_type"] | null
          budget_total?: number | null
          budget_used?: number | null
          completed_at?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          departure_date: string
          destination_city_id?: string | null
          id?: string
          name: string
          notes?: string | null
          origin_city_id?: string | null
          return_date: string
          status?: Database["public"]["Enums"]["trip_status"] | null
          travel_style?: string | null
          trust_zone_max?: number | null
          trust_zone_min?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          budget_currency?: Database["public"]["Enums"]["currency_type"] | null
          budget_priority?: Database["public"]["Enums"]["priority_type"] | null
          budget_total?: number | null
          budget_used?: number | null
          completed_at?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          departure_date?: string
          destination_city_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          origin_city_id?: string | null
          return_date?: string
          status?: Database["public"]["Enums"]["trip_status"] | null
          travel_style?: string | null
          trust_zone_max?: number | null
          trust_zone_min?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_destination_city_id_fkey"
            columns: ["destination_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_origin_city_id_fkey"
            columns: ["origin_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          home_city_id: string | null
          id: string
          notification_preferences: Json | null
          preferred_currency:
            | Database["public"]["Enums"]["currency_type"]
            | null
          travel_style: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          home_city_id?: string | null
          id: string
          notification_preferences?: Json | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_type"]
            | null
          travel_style?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          home_city_id?: string | null
          id?: string
          notification_preferences?: Json | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_type"]
            | null
          travel_style?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_home_city_id_fkey"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_traveler_age: {
        Args: { birth_date: string; travel_date: string }
        Returns: number
      }
      traveler_pays: {
        Args: { birth_date: string; travel_date: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_category:
        | "flight"
        | "hotel"
        | "experience"
        | "restaurant"
        | "transport"
        | "other"
      auction_status: "idle" | "watching" | "won" | "expired" | "cancelled"
      currency_type: "BRL" | "USD" | "EUR" | "GBP" | "JPY"
      priority_type: "flight" | "accommodation" | "experiences" | "balanced"
      severity_type: "info" | "warning" | "critical"
      traveler_type: "adult" | "child" | "infant"
      trip_status: "draft" | "active" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_category: [
        "flight",
        "hotel",
        "experience",
        "restaurant",
        "transport",
        "other",
      ],
      auction_status: ["idle", "watching", "won", "expired", "cancelled"],
      currency_type: ["BRL", "USD", "EUR", "GBP", "JPY"],
      priority_type: ["flight", "accommodation", "experiences", "balanced"],
      severity_type: ["info", "warning", "critical"],
      traveler_type: ["adult", "child", "infant"],
      trip_status: ["draft", "active", "completed", "cancelled"],
    },
  },
} as const
