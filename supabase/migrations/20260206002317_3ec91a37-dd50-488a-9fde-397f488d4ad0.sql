-- Corrigir funções com search_path mutável
CREATE OR REPLACE FUNCTION calculate_traveler_age(birth_date DATE, travel_date DATE)
RETURNS INT AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(travel_date, birth_date));
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION traveler_pays(birth_date DATE, travel_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN calculate_traveler_age(birth_date, travel_date) >= 2;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Habilitar RLS na tabela price_history
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Política para price_history (usuário pode ver histórico de preços dos seus leilões)
CREATE POLICY "Users can view own price history" ON price_history 
    FOR SELECT USING (
        auth.uid() = (
            SELECT t.user_id 
            FROM trips t 
            JOIN trip_activities ta ON t.id = ta.trip_id 
            JOIN activity_auctions aa ON ta.id = aa.activity_id 
            WHERE aa.id = auction_id
        )
    );