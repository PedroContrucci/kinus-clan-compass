-- Add INSERT and DELETE policies for price_history table
-- Users can insert price history for their own trip auctions
CREATE POLICY "Users can insert own price history" ON public.price_history
FOR INSERT WITH CHECK (
  auth.uid() = (
    SELECT t.user_id FROM trips t
    JOIN trip_activities ta ON t.id = ta.trip_id
    JOIN activity_auctions aa ON ta.id = aa.activity_id
    WHERE aa.id = auction_id
  )
);

-- Users can delete price history for their own trip auctions
CREATE POLICY "Users can delete own price history" ON public.price_history
FOR DELETE USING (
  auth.uid() = (
    SELECT t.user_id FROM trips t
    JOIN trip_activities ta ON t.id = ta.trip_id
    JOIN activity_auctions aa ON ta.id = aa.activity_id
    WHERE aa.id = auction_id
  )
);
