// Pre-computed coordinates for known attractions
// Used by DailyRouteMap to avoid Nominatim API rate limits

export const ATTRACTION_COORDS: Record<string, { lat: number; lng: number }> = {
  // ─── Paris ───
  'musée du louvre, paris': { lat: 48.8606, lng: 2.3376 },
  'louvre, paris': { lat: 48.8606, lng: 2.3376 },
  'cathédrale notre-dame, paris': { lat: 48.8530, lng: 2.3499 },
  'notre-dame, paris': { lat: 48.8530, lng: 2.3499 },
  'tour eiffel, paris': { lat: 48.8584, lng: 2.2945 },
  'torre eiffel, paris': { lat: 48.8584, lng: 2.2945 },
  "musée d'orsay, paris": { lat: 48.8600, lng: 2.3266 },
  'sacré-cœur, paris': { lat: 48.8867, lng: 2.3431 },
  'sacré-coeur, paris': { lat: 48.8867, lng: 2.3431 },
  'montmartre, paris': { lat: 48.8867, lng: 2.3431 },
  'arc de triomphe, paris': { lat: 48.8738, lng: 2.2950 },
  'champs-élysées, paris': { lat: 48.8698, lng: 2.3078 },
  'jardins du luxembourg, paris': { lat: 48.8462, lng: 2.3372 },
  'le marais, paris': { lat: 48.8566, lng: 2.3622 },
  'trocadéro, paris': { lat: 48.8627, lng: 2.2887 },
  'saint-germain-des-prés, paris': { lat: 48.8539, lng: 2.3338 },
  'café de flore, paris': { lat: 48.8540, lng: 2.3326 },
  'les deux magots, paris': { lat: 48.8541, lng: 2.3330 },
  'ladurée, paris': { lat: 48.8690, lng: 2.3102 },

  // ─── Roma ───
  'coliseu, roma': { lat: 41.8902, lng: 12.4922 },
  'colosseum, roma': { lat: 41.8902, lng: 12.4922 },
  'fontana di trevi, roma': { lat: 41.9009, lng: 12.4833 },
  'vaticano, roma': { lat: 41.9029, lng: 12.4534 },
  'basílica de são pedro, roma': { lat: 41.9022, lng: 12.4539 },
  'panteão, roma': { lat: 41.8986, lng: 12.4769 },
  'pantheon, roma': { lat: 41.8986, lng: 12.4769 },
  'fórum romano, roma': { lat: 41.8925, lng: 12.4853 },
  'piazza navona, roma': { lat: 41.8992, lng: 12.4731 },
  'trastevere, roma': { lat: 41.8869, lng: 12.4694 },
  'escadaria da praça de espanha, roma': { lat: 41.9060, lng: 12.4828 },
  'villa borghese, roma': { lat: 41.9145, lng: 12.4921 },

  // ─── Tóquio ───
  'senso-ji, tóquio': { lat: 35.7148, lng: 139.7967 },
  'sensoji, tóquio': { lat: 35.7148, lng: 139.7967 },
  'shibuya crossing, tóquio': { lat: 35.6595, lng: 139.7004 },
  'meiji jingu, tóquio': { lat: 35.6764, lng: 139.6993 },
  'tsukiji outer market, tóquio': { lat: 35.6654, lng: 139.7707 },
  'tsukiji, tóquio': { lat: 35.6654, lng: 139.7707 },
  'shinjuku gyoen, tóquio': { lat: 35.6852, lng: 139.7100 },
  'akihabara, tóquio': { lat: 35.7023, lng: 139.7745 },
  'harajuku, tóquio': { lat: 35.6702, lng: 139.7027 },
  'imperial palace, tóquio': { lat: 35.6852, lng: 139.7528 },
  'tokyo skytree, tóquio': { lat: 35.7101, lng: 139.8107 },
  'roppongi, tóquio': { lat: 35.6628, lng: 139.7313 },

  // ─── Lisboa ───
  'torre de belém, lisboa': { lat: 38.6916, lng: -9.2160 },
  'mosteiro dos jerónimos, lisboa': { lat: 38.6979, lng: -9.2068 },
  'alfama, lisboa': { lat: 38.7114, lng: -9.1300 },
  'praça do comércio, lisboa': { lat: 38.7075, lng: -9.1364 },
  'castelo de são jorge, lisboa': { lat: 38.7139, lng: -9.1335 },
  'bairro alto, lisboa': { lat: 38.7139, lng: -9.1454 },
  'pastéis de belém, lisboa': { lat: 38.6975, lng: -9.2033 },
  'time out market, lisboa': { lat: 38.7069, lng: -9.1459 },
  'lx factory, lisboa': { lat: 38.7035, lng: -9.1774 },

  // ─── Barcelona ───
  'sagrada família, barcelona': { lat: 41.4036, lng: 2.1744 },
  'la sagrada familia, barcelona': { lat: 41.4036, lng: 2.1744 },
  'park güell, barcelona': { lat: 41.4145, lng: 2.1527 },
  'la rambla, barcelona': { lat: 41.3809, lng: 2.1734 },
  'casa batlló, barcelona': { lat: 41.3916, lng: 2.1650 },
  'la boqueria, barcelona': { lat: 41.3816, lng: 2.1719 },
  'barrio gótico, barcelona': { lat: 41.3833, lng: 2.1761 },
  'barceloneta, barcelona': { lat: 41.3808, lng: 2.1897 },
  'camp nou, barcelona': { lat: 41.3809, lng: 2.1228 },
  'montjuïc, barcelona': { lat: 41.3641, lng: 2.1586 },

  // ─── Londres ───
  'british museum, londres': { lat: 51.5194, lng: -0.1270 },
  'tower of london, londres': { lat: 51.5081, lng: -0.0759 },
  'big ben, londres': { lat: 51.5007, lng: -0.1246 },
  'buckingham palace, londres': { lat: 51.5014, lng: -0.1419 },
  'london eye, londres': { lat: 51.5033, lng: -0.1196 },
  'hyde park, londres': { lat: 51.5073, lng: -0.1657 },
  'borough market, londres': { lat: 51.5055, lng: -0.0910 },
  'covent garden, londres': { lat: 51.5117, lng: -0.1240 },
  'camden market, londres': { lat: 51.5414, lng: -0.1427 },
  'tate modern, londres': { lat: 51.5076, lng: -0.0994 },

  // ─── Bangkok ───
  'grand palace, bangkok': { lat: 13.7500, lng: 100.4914 },
  'wat pho, bangkok': { lat: 13.7465, lng: 100.4930 },
  'wat arun, bangkok': { lat: 13.7437, lng: 100.4888 },
  'chatuchak market, bangkok': { lat: 13.7999, lng: 100.5503 },
  'khao san road, bangkok': { lat: 13.7589, lng: 100.4974 },
  'chinatown, bangkok': { lat: 13.7411, lng: 100.5133 },
  'yaowarat, bangkok': { lat: 13.7411, lng: 100.5133 },
  'siam, bangkok': { lat: 13.7454, lng: 100.5342 },
  'lumphini park, bangkok': { lat: 13.7308, lng: 100.5418 },

  // ─── Phuket ───
  'wat chalong, phuket': { lat: 7.8425, lng: 98.3383 },
  'big buddha, phuket': { lat: 7.8278, lng: 98.3127 },
  'old phuket town, phuket': { lat: 7.8847, lng: 98.3862 },
  'patong beach, phuket': { lat: 7.8964, lng: 98.2965 },
  'phi phi islands, phuket': { lat: 7.7407, lng: 98.7784 },
  'kata beach, phuket': { lat: 7.8200, lng: 98.2976 },
  'karon beach, phuket': { lat: 7.8432, lng: 98.2943 },
  'freedom beach, phuket': { lat: 7.8757, lng: 98.2730 },

  // ─── Bali ───
  'ubud, bali': { lat: -8.5069, lng: 115.2625 },
  'tanah lot, bali': { lat: -8.6213, lng: 115.0868 },
  'uluwatu temple, bali': { lat: -8.8291, lng: 115.0849 },
  'tegallalang rice terraces, bali': { lat: -8.4312, lng: 115.2793 },
  'seminyak, bali': { lat: -8.6913, lng: 115.1588 },
  'kuta beach, bali': { lat: -8.7180, lng: 115.1685 },
  'tirta empul, bali': { lat: -8.4152, lng: 115.3155 },
  'monkey forest, bali': { lat: -8.5184, lng: 115.2588 },

  // ─── Nova York ───
  'central park, nova york': { lat: 40.7829, lng: -73.9654 },
  'times square, nova york': { lat: 40.7580, lng: -73.9855 },
  'statue of liberty, nova york': { lat: 40.6892, lng: -74.0445 },
  'empire state building, nova york': { lat: 40.7484, lng: -73.9857 },
  'brooklyn bridge, nova york': { lat: 40.7061, lng: -73.9969 },
  'metropolitan museum, nova york': { lat: 40.7794, lng: -73.9632 },
  'high line, nova york': { lat: 40.7480, lng: -74.0048 },
  'chelsea market, nova york': { lat: 40.7424, lng: -74.0061 },

  // ─── Amsterdam ───
  'rijksmuseum, amsterdam': { lat: 52.3600, lng: 4.8852 },
  'anne frank house, amsterdam': { lat: 52.3752, lng: 4.8840 },
  'van gogh museum, amsterdam': { lat: 52.3584, lng: 4.8811 },
  'vondelpark, amsterdam': { lat: 52.3579, lng: 4.8686 },
  'dam square, amsterdam': { lat: 52.3730, lng: 4.8932 },
  'jordaan, amsterdam': { lat: 52.3747, lng: 4.8800 },
  'albert cuyp market, amsterdam': { lat: 52.3558, lng: 4.8947 },

  // ─── Dubai ───
  'burj khalifa, dubai': { lat: 25.1972, lng: 55.2744 },
  'dubai mall, dubai': { lat: 25.1985, lng: 55.2796 },
  'palm jumeirah, dubai': { lat: 25.1124, lng: 55.1390 },
  'dubai marina, dubai': { lat: 25.0805, lng: 55.1403 },
  'al fahidi, dubai': { lat: 25.2636, lng: 55.2979 },
  'gold souk, dubai': { lat: 25.2867, lng: 55.2975 },
  'jumeirah beach, dubai': { lat: 25.2048, lng: 55.2390 },
  'burj al arab, dubai': { lat: 25.1412, lng: 55.1853 },

  // ─── Buenos Aires ───
  'la boca, buenos aires': { lat: -34.6345, lng: -58.3631 },
  'caminito, buenos aires': { lat: -34.6386, lng: -58.3605 },
  'recoleta, buenos aires': { lat: -34.5875, lng: -58.3934 },
  'san telmo, buenos aires': { lat: -34.6214, lng: -58.3733 },
  'teatro colón, buenos aires': { lat: -34.6011, lng: -58.3833 },
  'plaza de mayo, buenos aires': { lat: -34.6084, lng: -58.3724 },
  'palermo soho, buenos aires': { lat: -34.5881, lng: -58.4284 },
  'puerto madero, buenos aires': { lat: -34.6174, lng: -58.3627 },

  // ─── Miami ───
  'south beach, miami': { lat: 25.7826, lng: -80.1341 },
  'wynwood walls, miami': { lat: 25.8012, lng: -80.1997 },
  'little havana, miami': { lat: 25.7659, lng: -80.2191 },
  'ocean drive, miami': { lat: 25.7819, lng: -80.1300 },
  'bayside marketplace, miami': { lat: 25.7782, lng: -80.1862 },
  'vizcaya museum, miami': { lat: 25.7445, lng: -80.2103 },

  // ─── Cancún ───
  'zona hotelera, cancún': { lat: 21.1326, lng: -86.7625 },
  'chichén itzá, cancún': { lat: 20.6843, lng: -88.5678 },
  'isla mujeres, cancún': { lat: 21.2322, lng: -86.7318 },
  'xcaret, cancún': { lat: 20.5803, lng: -87.1187 },
  'tulum, cancún': { lat: 20.2145, lng: -87.4291 },
  'playa del carmen, cancún': { lat: 20.6296, lng: -87.0739 },

  // ─── Singapura ───
  'marina bay sands, singapura': { lat: 1.2834, lng: 103.8607 },
  'gardens by the bay, singapura': { lat: 1.2816, lng: 103.8636 },
  'sentosa island, singapura': { lat: 1.2494, lng: 103.8303 },
  'chinatown, singapura': { lat: 1.2835, lng: 103.8443 },
  'little india, singapura': { lat: 1.3066, lng: 103.8518 },
  'orchard road, singapura': { lat: 1.3048, lng: 103.8318 },
  'merlion park, singapura': { lat: 1.2868, lng: 103.8545 },

  // ─── Cidade do Cabo ───
  'table mountain, cidade do cabo': { lat: -33.9625, lng: 18.4034 },
  'v&a waterfront, cidade do cabo': { lat: -33.9036, lng: 18.4217 },
  'cape point, cidade do cabo': { lat: -34.3568, lng: 18.4973 },
  'robben island, cidade do cabo': { lat: -33.8066, lng: 18.3663 },
  'bo-kaap, cidade do cabo': { lat: -33.9190, lng: 18.4164 },
  'kirstenbosch, cidade do cabo': { lat: -33.9881, lng: 18.4327 },
  'camps bay, cidade do cabo': { lat: -33.9514, lng: 18.3779 },

  // ─── Istambul ───
  'hagia sophia, istambul': { lat: 41.0086, lng: 28.9802 },
  'blue mosque, istambul': { lat: 41.0054, lng: 28.9768 },
  'grand bazaar, istambul': { lat: 41.0107, lng: 28.9681 },
  'topkapi palace, istambul': { lat: 41.0115, lng: 28.9834 },
  'galata tower, istambul': { lat: 41.0256, lng: 28.9741 },
  'spice bazaar, istambul': { lat: 41.0165, lng: 28.9706 },
  'bosphorus, istambul': { lat: 41.0824, lng: 29.0491 },

  // ─── Praga ───
  'charles bridge, praga': { lat: 50.0865, lng: 14.4114 },
  'prague castle, praga': { lat: 50.0911, lng: 14.4013 },
  'old town square, praga': { lat: 50.0875, lng: 14.4213 },
  'astronomical clock, praga': { lat: 50.0870, lng: 14.4208 },
  'john lennon wall, praga': { lat: 50.0856, lng: 14.4068 },
  'vyšehrad, praga': { lat: 50.0645, lng: 14.4198 },
  'petřín tower, praga': { lat: 50.0833, lng: 14.3952 },

  // ─── Atenas ───
  'acropolis, atenas': { lat: 37.9715, lng: 23.7267 },
  'parthenon, atenas': { lat: 37.9715, lng: 23.7267 },
  'plaka, atenas': { lat: 37.9725, lng: 23.7302 },
  'monastiraki, atenas': { lat: 37.9762, lng: 23.7257 },
  'temple of olympian zeus, atenas': { lat: 37.9693, lng: 23.7331 },
  'national archaeological museum, atenas': { lat: 37.9891, lng: 23.7325 },
  'syntagma square, atenas': { lat: 37.9755, lng: 23.7348 },

  // ─── Sydney ───
  'sydney opera house, sydney': { lat: -33.8568, lng: 151.2153 },
  'harbour bridge, sydney': { lat: -33.8523, lng: 151.2108 },
  'bondi beach, sydney': { lat: -33.8915, lng: 151.2767 },
  'darling harbour, sydney': { lat: -33.8724, lng: 151.1998 },
  'the rocks, sydney': { lat: -33.8597, lng: 151.2094 },
  'taronga zoo, sydney': { lat: -33.8435, lng: 151.2411 },
  'manly beach, sydney': { lat: -33.7960, lng: 151.2877 },

  // ─── Rio de Janeiro ───
  'cristo redentor, rio de janeiro': { lat: -22.9519, lng: -43.2105 },
  'pão de açúcar, rio de janeiro': { lat: -22.9488, lng: -43.1569 },
  'copacabana, rio de janeiro': { lat: -22.9711, lng: -43.1823 },
  'ipanema, rio de janeiro': { lat: -22.9838, lng: -43.2050 },
  'lapa, rio de janeiro': { lat: -22.9140, lng: -43.1816 },
  'santa teresa, rio de janeiro': { lat: -22.9217, lng: -43.1868 },
  'jardim botânico, rio de janeiro': { lat: -22.9672, lng: -43.2236 },
  'maracanã, rio de janeiro': { lat: -22.9121, lng: -43.2302 },

  // ─── Kyoto ───
  'fushimi inari, kyoto': { lat: 34.9671, lng: 135.7727 },
  'kinkaku-ji, kyoto': { lat: 35.0394, lng: 135.7292 },
  'arashiyama bamboo grove, kyoto': { lat: 35.0094, lng: 135.6722 },
  'kiyomizu-dera, kyoto': { lat: 34.9949, lng: 135.7850 },
  'gion, kyoto': { lat: 35.0036, lng: 135.7755 },
  'nijo castle, kyoto': { lat: 35.0142, lng: 135.7479 },
  'philosopher\'s path, kyoto': { lat: 35.0273, lng: 135.7940 },

  // ─── Seul ───
  'gyeongbokgung, seul': { lat: 37.5796, lng: 126.9770 },
  'bukchon hanok village, seul': { lat: 37.5826, lng: 126.9831 },
  'myeongdong, seul': { lat: 37.5636, lng: 126.9850 },
  'namsan tower, seul': { lat: 37.5512, lng: 126.9882 },
  'dongdaemun, seul': { lat: 37.5711, lng: 127.0092 },
  'insadong, seul': { lat: 37.5742, lng: 126.9857 },
  'hongdae, seul': { lat: 37.5563, lng: 126.9236 },
};
