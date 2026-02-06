-- Create the updated_at function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create flight price estimates table for realistic pricing
CREATE TABLE public.flight_price_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_code CHAR(3) NOT NULL,
  destination_code CHAR(3) NOT NULL,
  economy_min NUMERIC NOT NULL DEFAULT 2500,
  economy_avg NUMERIC NOT NULL DEFAULT 4500,
  economy_max NUMERIC,
  business_avg NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(origin_code, destination_code)
);

-- Enable RLS (public read-only data)
ALTER TABLE public.flight_price_estimates ENABLE ROW LEVEL SECURITY;

-- Anyone can read estimates
CREATE POLICY "Anyone can read flight price estimates" 
ON public.flight_price_estimates 
FOR SELECT 
USING (true);

-- Insert realistic price estimates for common Brazilian routes
INSERT INTO public.flight_price_estimates (origin_code, destination_code, economy_min, economy_avg, economy_max, business_avg) VALUES
('GRU', 'CDG', 3500, 5500, 8500, 18000),
('GRU', 'NRT', 4500, 7000, 12000, 25000),
('GRU', 'JFK', 2800, 4500, 7000, 15000),
('GRU', 'LIS', 2500, 4000, 6000, 12000),
('GRU', 'FCO', 3200, 5000, 7500, 16000),
('GRU', 'MAD', 3000, 4800, 7000, 15000),
('GRU', 'BCN', 3100, 4900, 7200, 15500),
('GRU', 'LHR', 3400, 5200, 8000, 17000),
('GRU', 'AMS', 3300, 5100, 7800, 16500),
('GRU', 'FRA', 3200, 5000, 7600, 16000),
('GRU', 'DXB', 4000, 6500, 10000, 22000),
('GIG', 'CDG', 3600, 5600, 8600, 18500),
('GIG', 'JFK', 2900, 4600, 7100, 15500),
('GIG', 'LIS', 2600, 4100, 6100, 12500);

-- Trigger to update timestamp
CREATE TRIGGER update_flight_price_estimates_updated_at
BEFORE UPDATE ON public.flight_price_estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();