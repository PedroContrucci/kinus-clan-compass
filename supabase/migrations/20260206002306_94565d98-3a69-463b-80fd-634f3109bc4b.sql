-- ═══════════════════════════════════════════════════════════════════════════
-- KINU TRAVEL OS — SCHEMA SUPABASE (PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 1. EXTENSÕES E CONFIGURAÇÕES                                              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 2. ENUMS (Tipos customizados)                                             ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE TYPE trip_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE traveler_type AS ENUM ('adult', 'child', 'infant');
CREATE TYPE activity_category AS ENUM ('flight', 'hotel', 'experience', 'restaurant', 'transport', 'other');
CREATE TYPE auction_status AS ENUM ('idle', 'watching', 'won', 'expired', 'cancelled');
CREATE TYPE priority_type AS ENUM ('flight', 'accommodation', 'experiences', 'balanced');
CREATE TYPE severity_type AS ENUM ('info', 'warning', 'critical');
CREATE TYPE currency_type AS ENUM ('BRL', 'USD', 'EUR', 'GBP', 'JPY');

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 3. TABELAS DE REFERÊNCIA (Dados estáticos)                                ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Países
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code CHAR(2) UNIQUE NOT NULL,
    name_pt VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    currency_code CHAR(3),
    timezone_default VARCHAR(50),
    visa_required_br BOOLEAN DEFAULT false,
    visa_notes TEXT,
    vaccines_required TEXT[],
    vaccines_recommended TEXT[],
    emergency_numbers JSONB,
    power_plug VARCHAR(10),
    voltage VARCHAR(20),
    tips TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cidades
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES countries(id),
    name_pt VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    is_capital BOOLEAN DEFAULT false,
    is_popular_destination BOOLEAN DEFAULT false,
    average_daily_cost_brl DECIMAL(10, 2),
    best_months INT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aeroportos
CREATE TABLE airports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iata_code CHAR(3) UNIQUE NOT NULL,
    icao_code CHAR(4),
    name_pt VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    city_id UUID REFERENCES cities(id),
    country_id UUID REFERENCES countries(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    is_international BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rotas de Voo
CREATE TABLE flight_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_airport_id UUID REFERENCES airports(id),
    destination_airport_id UUID REFERENCES airports(id),
    has_direct_flight BOOLEAN DEFAULT false,
    common_connections TEXT[],
    estimated_duration_minutes INT,
    airlines TEXT[],
    average_price_brl DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(origin_airport_id, destination_airport_id)
);

-- Companhias Aéreas
CREATE TABLE airlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iata_code CHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES countries(id),
    logo_url TEXT,
    baggage_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 4. TABELAS DE USUÁRIO                                                     ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Perfil do Usuário
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    home_city_id UUID REFERENCES cities(id),
    preferred_currency currency_type DEFAULT 'BRL',
    travel_style VARCHAR(50),
    notification_preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membros do Clã
CREATE TABLE clan_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type traveler_type NOT NULL,
    birth_date DATE,
    document_type VARCHAR(20),
    document_number VARCHAR(50),
    special_needs TEXT,
    dietary_restrictions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 5. TABELAS DE VIAGEM                                                      ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Viagens
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    origin_city_id UUID REFERENCES cities(id),
    destination_city_id UUID REFERENCES cities(id),
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    status trip_status DEFAULT 'draft',
    budget_total DECIMAL(12, 2),
    budget_currency currency_type DEFAULT 'BRL',
    budget_priority priority_type DEFAULT 'balanced',
    budget_used DECIMAL(12, 2) DEFAULT 0,
    trust_zone_min DECIMAL(5, 4) DEFAULT 0.80,
    trust_zone_max DECIMAL(5, 4) DEFAULT 1.00,
    travel_style VARCHAR(50),
    notes TEXT,
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Viajantes da Viagem
CREATE TABLE trip_travelers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    clan_member_id UUID REFERENCES clan_members(id),
    name VARCHAR(100),
    type traveler_type,
    age_at_travel INT,
    cost_multiplier DECIMAL(3, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atividades da Viagem
CREATE TABLE trip_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category activity_category NOT NULL,
    description TEXT,
    day_number INT NOT NULL,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    duration_minutes INT,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    currency currency_type DEFAULT 'BRL',
    is_confirmed BOOLEAN DEFAULT false,
    auction_enabled BOOLEAN DEFAULT false,
    location_name VARCHAR(200),
    location_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    external_url TEXT,
    booking_reference VARCHAR(100),
    notes TEXT,
    is_from_clan BOOLEAN DEFAULT false,
    source_activity_id UUID,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leilão Reverso
CREATE TABLE activity_auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES trip_activities(id) ON DELETE CASCADE,
    target_price DECIMAL(10, 2) NOT NULL,
    kinu_estimate DECIMAL(10, 2),
    max_wait_days INT DEFAULT 7,
    status auction_status DEFAULT 'idle',
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    best_price_found DECIMAL(10, 2),
    best_price_date TIMESTAMPTZ,
    best_price_url TEXT,
    savings DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Preços
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES activity_auctions(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    source VARCHAR(100),
    url TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist da Viagem
CREATE TABLE trip_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    item VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    is_completed BOOLEAN DEFAULT false,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagamentos da Viagem
CREATE TABLE trip_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES trip_activities(id),
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency currency_type DEFAULT 'BRL',
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    due_date DATE,
    payment_method VARCHAR(50),
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 6. TABELAS DE COMUNIDADE (CLÃ)                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Roteiros da Comunidade
CREATE TABLE community_itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES user_profiles(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    destination_city_id UUID REFERENCES cities(id),
    destination_country_id UUID REFERENCES countries(id),
    duration_days INT,
    estimated_budget_brl DECIMAL(10, 2),
    travel_style VARCHAR(50),
    views_count INT DEFAULT 0,
    copies_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    cover_image_url TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atividades/Dicas da Comunidade
CREATE TABLE community_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES user_profiles(id),
    itinerary_id UUID REFERENCES community_itineraries(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category activity_category,
    city_id UUID REFERENCES cities(id),
    country_id UUID REFERENCES countries(id),
    location_name VARCHAR(200),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    google_place_id VARCHAR(100),
    estimated_cost_brl DECIMAL(10, 2),
    cost_level VARCHAR(20),
    rating_average DECIMAL(3, 2),
    rating_count INT DEFAULT 0,
    tips TEXT[],
    best_time_to_visit VARCHAR(100),
    duration_minutes INT,
    website_url TEXT,
    phone VARCHAR(30),
    is_top_pick BOOLEAN DEFAULT false,
    rank_in_category INT,
    rank_tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fotos da Comunidade
CREATE TABLE community_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES community_activities(id) ON DELETE CASCADE,
    author_id UUID REFERENCES user_profiles(id),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    is_cover BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
CREATE TABLE community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES community_activities(id) ON DELETE CASCADE,
    author_id UUID REFERENCES user_profiles(id),
    parent_comment_id UUID REFERENCES community_comments(id),
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avaliações
CREATE TABLE community_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES community_activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    visited_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 7. TABELAS DE SMART PACKING                                               ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Tipos de Bagagem
CREATE TABLE luggage_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    width_cm DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    depth_cm DECIMAL(5, 2),
    weight_limit_kg DECIMAL(5, 2),
    is_carry_on BOOLEAN DEFAULT false
);

-- Biblioteca de Itens para Mala
CREATE TABLE packing_items_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    subcategory VARCHAR(50),
    average_weight_kg DECIMAL(5, 3),
    width_cm DECIMAL(5, 2),
    height_cm DECIMAL(5, 2),
    depth_cm DECIMAL(5, 2),
    icon VARCHAR(50),
    is_essential BOOLEAN DEFAULT false,
    climate_tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packing List da Viagem
CREATE TABLE trip_packing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    luggage_type_id UUID REFERENCES luggage_types(id),
    airline_id UUID REFERENCES airlines(id),
    items JSONB,
    total_weight_kg DECIMAL(5, 2),
    weight_limit_kg DECIMAL(5, 2),
    excess_fee DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 8. TABELAS DE CÂMBIO                                                      ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Histórico de Câmbio
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency CHAR(3) NOT NULL,
    target_currency CHAR(3) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'exchangerate.host'
);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency, recorded_at DESC);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 9. TABELAS DE KINU AI                                                     ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Insights do KINU
CREATE TABLE kinu_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    trip_id UUID REFERENCES trips(id),
    trigger_type VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    suggestion TEXT,
    severity severity_type DEFAULT 'info',
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 10. VIEWS E FUNÇÕES                                                       ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Função: Calcular idade do viajante na data da viagem
CREATE OR REPLACE FUNCTION calculate_traveler_age(birth_date DATE, travel_date DATE)
RETURNS INT AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(travel_date, birth_date));
END;
$$ LANGUAGE plpgsql;

-- Função: Verificar se criança paga (>= 2 anos)
CREATE OR REPLACE FUNCTION traveler_pays(birth_date DATE, travel_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN calculate_traveler_age(birth_date, travel_date) >= 2;
END;
$$ LANGUAGE plpgsql;

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 11. ROW LEVEL SECURITY (RLS)                                              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_packing ENABLE ROW LEVEL SECURITY;
ALTER TABLE kinu_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas de user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de clan_members
CREATE POLICY "Users can manage own clan" ON clan_members FOR ALL USING (auth.uid() = user_id);

-- Políticas de trips
CREATE POLICY "Users can manage own trips" ON trips FOR ALL USING (auth.uid() = user_id);

-- Políticas de trip_travelers
CREATE POLICY "Users can manage own trip travelers" ON trip_travelers 
    FOR ALL USING (auth.uid() = (SELECT user_id FROM trips WHERE id = trip_id));

-- Políticas de trip_activities
CREATE POLICY "Users can manage own activities" ON trip_activities 
    FOR ALL USING (auth.uid() = (SELECT user_id FROM trips WHERE id = trip_id));

-- Políticas de activity_auctions
CREATE POLICY "Users can manage own auctions" ON activity_auctions 
    FOR ALL USING (auth.uid() = (SELECT t.user_id FROM trips t JOIN trip_activities ta ON t.id = ta.trip_id WHERE ta.id = activity_id));

-- Políticas de trip_checklist
CREATE POLICY "Users can manage own checklist" ON trip_checklist 
    FOR ALL USING (auth.uid() = (SELECT user_id FROM trips WHERE id = trip_id));

-- Políticas de trip_payments
CREATE POLICY "Users can manage own payments" ON trip_payments 
    FOR ALL USING (auth.uid() = (SELECT user_id FROM trips WHERE id = trip_id));

-- Políticas de trip_packing
CREATE POLICY "Users can manage own packing" ON trip_packing 
    FOR ALL USING (auth.uid() = (SELECT user_id FROM trips WHERE id = trip_id));

-- Políticas de kinu_insights
CREATE POLICY "Users can view own insights" ON kinu_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can dismiss own insights" ON kinu_insights FOR UPDATE USING (auth.uid() = user_id);

-- Comunidade: todos podem ver conteúdo publicado
CREATE POLICY "Anyone can view published itineraries" ON community_itineraries 
    FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can manage own itineraries" ON community_itineraries 
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Anyone can view published activities" ON community_activities 
    FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can manage own activities" ON community_activities 
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Anyone can view photos" ON community_photos FOR SELECT USING (true);
CREATE POLICY "Authors can manage own photos" ON community_photos FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON community_comments 
    FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can manage own comments" ON community_comments 
    FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON community_comments 
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Anyone can view ratings" ON community_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON community_ratings 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON community_ratings 
    FOR UPDATE USING (auth.uid() = user_id);

-- Tabelas de referência são públicas para leitura
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE luggage_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Anyone can read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Anyone can read airports" ON airports FOR SELECT USING (true);
CREATE POLICY "Anyone can read airlines" ON airlines FOR SELECT USING (true);
CREATE POLICY "Anyone can read flight_routes" ON flight_routes FOR SELECT USING (true);
CREATE POLICY "Anyone can read luggage_types" ON luggage_types FOR SELECT USING (true);
CREATE POLICY "Anyone can read packing_items_library" ON packing_items_library FOR SELECT USING (true);
CREATE POLICY "Anyone can read exchange_rates" ON exchange_rates FOR SELECT USING (true);

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║ 12. ÍNDICES PARA PERFORMANCE                                              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

CREATE INDEX idx_trips_user_status ON trips(user_id, status);
CREATE INDEX idx_trips_dates ON trips(departure_date, return_date);
CREATE INDEX idx_activities_trip_day ON trip_activities(trip_id, day_number);
CREATE INDEX idx_community_activities_city ON community_activities(city_id) WHERE is_published = true;
CREATE INDEX idx_community_activities_country ON community_activities(country_id) WHERE is_published = true;
CREATE INDEX idx_community_activities_rank ON community_activities(rank_tags) WHERE is_top_pick = true;
CREATE INDEX idx_airports_iata ON airports(iata_code);
CREATE INDEX idx_cities_country ON cities(country_id);