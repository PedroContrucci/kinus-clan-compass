-- Insert Brazilian cities
INSERT INTO public.cities (name_pt, name_en, state_province, latitude, longitude, timezone, is_popular_destination) VALUES
('Rio de Janeiro', 'Rio de Janeiro', 'RJ', -22.9068, -43.1729, 'America/Sao_Paulo', true),
('Florianópolis', 'Florianopolis', 'SC', -27.5969, -48.5495, 'America/Sao_Paulo', true),
('Salvador', 'Salvador', 'BA', -12.9714, -38.5014, 'America/Bahia', true),
('Recife', 'Recife', 'PE', -8.0476, -34.8770, 'America/Recife', true),
('Fortaleza', 'Fortaleza', 'CE', -3.7172, -38.5433, 'America/Fortaleza', true),
('Foz do Iguaçu', 'Foz do Iguacu', 'PR', -25.5163, -54.5854, 'America/Sao_Paulo', true),
('Manaus', 'Manaus', 'AM', -3.1190, -60.0217, 'America/Manaus', true),
('Brasília', 'Brasilia', 'DF', -15.7801, -47.9292, 'America/Sao_Paulo', true),
('Belo Horizonte', 'Belo Horizonte', 'MG', -19.9167, -43.9345, 'America/Sao_Paulo', true),
('Porto Alegre', 'Porto Alegre', 'RS', -30.0346, -51.2177, 'America/Sao_Paulo', true),
('Natal', 'Natal', 'RN', -5.7793, -35.2009, 'America/Fortaleza', true),
('Maceió', 'Maceio', 'AL', -9.6498, -35.7089, 'America/Maceio', true),
('Curitiba', 'Curitiba', 'PR', -25.4290, -49.2671, 'America/Sao_Paulo', true),
('Gramado', 'Gramado', 'RS', -29.3789, -50.8761, 'America/Sao_Paulo', true),
('Fernando de Noronha', 'Fernando de Noronha', 'PE', -3.8544, -32.4297, 'America/Noronha', true),
('Jericoacoara', 'Jericoacoara', 'CE', -2.7975, -40.5137, 'America/Fortaleza', true),
('Bonito', 'Bonito', 'MS', -21.1267, -56.4836, 'America/Campo_Grande', true),
('Campo Grande', 'Campo Grande', 'MS', -20.4697, -54.6201, 'America/Campo_Grande', false)
ON CONFLICT DO NOTHING;

-- Insert international cities (Latin America)
INSERT INTO public.cities (name_pt, name_en, latitude, longitude, timezone, is_popular_destination) VALUES
('Cidade do México', 'Mexico City', 19.4326, -99.1332, 'America/Mexico_City', true),
('Cartagena', 'Cartagena', 10.3910, -75.4794, 'America/Bogota', true),
('Lima', 'Lima', -12.0464, -77.0428, 'America/Lima', true),
('Cusco', 'Cusco', -13.5319, -71.9675, 'America/Lima', true),
('Santiago', 'Santiago', -33.4489, -70.6693, 'America/Santiago', true),
('Montevidéu', 'Montevideo', -34.9011, -56.1645, 'America/Montevideo', true),
('Punta del Este', 'Punta del Este', -34.9467, -54.9356, 'America/Montevideo', true),
('Bariloche', 'Bariloche', -41.1335, -71.3103, 'America/Argentina/Buenos_Aires', true),
('Mendoza', 'Mendoza', -32.8895, -68.8458, 'America/Argentina/Mendoza', true),
('Havana', 'Havana', 23.1136, -82.3666, 'America/Havana', true),
('San Juan', 'San Juan', 18.4655, -66.1057, 'America/Puerto_Rico', true)
ON CONFLICT DO NOTHING;

-- Insert Brazilian airports
INSERT INTO public.airports (iata_code, name_pt, name_en, timezone, is_international, latitude, longitude) VALUES
('GIG', 'Aeroporto Internacional do Galeão', 'Rio de Janeiro Galeao International Airport', 'America/Sao_Paulo', true, -22.8089, -43.2436),
('SDU', 'Aeroporto Santos Dumont', 'Santos Dumont Airport', 'America/Sao_Paulo', false, -22.9106, -43.1631),
('FLN', 'Aeroporto Internacional de Florianópolis', 'Florianopolis-Hercílio Luz International Airport', 'America/Sao_Paulo', true, -27.6704, -48.5520),
('SSA', 'Aeroporto Internacional de Salvador', 'Salvador International Airport', 'America/Bahia', true, -12.9086, -38.3225),
('REC', 'Aeroporto Internacional do Recife', 'Recife-Guararapes International Airport', 'America/Recife', true, -8.1264, -34.9236),
('FOR', 'Aeroporto Internacional de Fortaleza', 'Fortaleza Pinto Martins International Airport', 'America/Fortaleza', true, -3.7763, -38.5325),
('IGU', 'Aeroporto Internacional de Foz do Iguaçu', 'Foz do Iguacu International Airport', 'America/Sao_Paulo', true, -25.5963, -54.4897),
('MAO', 'Aeroporto Internacional de Manaus', 'Manaus-Eduardo Gomes International Airport', 'America/Manaus', true, -3.0386, -60.0497),
('BSB', 'Aeroporto Internacional de Brasília', 'Brasilia International Airport', 'America/Sao_Paulo', true, -15.8711, -47.9186),
('CNF', 'Aeroporto Internacional de Confins', 'Belo Horizonte-Confins International Airport', 'America/Sao_Paulo', true, -19.6244, -43.9719),
('POA', 'Aeroporto Salgado Filho', 'Porto Alegre International Airport', 'America/Sao_Paulo', true, -29.9944, -51.1711),
('NAT', 'Aeroporto Internacional de Natal', 'Natal-São Gonçalo do Amarante International Airport', 'America/Fortaleza', true, -5.7681, -35.3761),
('MCZ', 'Aeroporto Internacional de Maceió', 'Maceio-Zumbi dos Palmares International Airport', 'America/Maceio', true, -9.5108, -35.7917),
('CWB', 'Aeroporto Afonso Pena', 'Curitiba-Afonso Pena International Airport', 'America/Sao_Paulo', true, -25.5284, -49.1758),
('FEN', 'Aeroporto de Fernando de Noronha', 'Fernando de Noronha Airport', 'America/Noronha', false, -3.8549, -32.4233),
('CGR', 'Aeroporto Internacional de Campo Grande', 'Campo Grande International Airport', 'America/Campo_Grande', true, -20.4689, -54.6725)
ON CONFLICT DO NOTHING;

-- Insert international airports (Latin America)
INSERT INTO public.airports (iata_code, name_pt, name_en, timezone, is_international, latitude, longitude) VALUES
('MEX', 'Aeroporto da Cidade do México', 'Mexico City International Airport', 'America/Mexico_City', true, 19.4363, -99.0721),
('CTG', 'Aeroporto de Cartagena', 'Rafael Núñez International Airport', 'America/Bogota', true, 10.4424, -75.5130),
('LIM', 'Aeroporto de Lima', 'Jorge Chavez International Airport', 'America/Lima', true, -12.0219, -77.1143),
('CUZ', 'Aeroporto de Cusco', 'Alejandro Velasco Astete International Airport', 'America/Lima', true, -13.5357, -71.9388),
('SCL', 'Aeroporto de Santiago', 'Arturo Merino Benítez International Airport', 'America/Santiago', true, -33.3930, -70.7858),
('MVD', 'Aeroporto de Montevidéu', 'Carrasco International Airport', 'America/Montevideo', true, -34.8384, -56.0308),
('BRC', 'Aeroporto de Bariloche', 'San Carlos de Bariloche Airport', 'America/Argentina/Buenos_Aires', true, -41.1512, -71.1575),
('MDZ', 'Aeroporto de Mendoza', 'Governor Francisco Gabrielli International Airport', 'America/Argentina/Mendoza', true, -32.8317, -68.7929),
('HAV', 'Aeroporto de Havana', 'José Martí International Airport', 'America/Havana', true, 22.9892, -82.4091),
('SJU', 'Aeroporto de San Juan', 'Luis Muñoz Marín International Airport', 'America/Puerto_Rico', true, 18.4394, -66.0018)
ON CONFLICT DO NOTHING;