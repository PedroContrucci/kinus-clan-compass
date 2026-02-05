// Trip Cockpit — Container Grid dos 4 KPIs

import { motion } from 'framer-motion';
import { TripDashboardData } from '@/hooks/useTripDashboard';
import { CountdownCard } from './CountdownCard';
import { ChecklistProgress } from './ChecklistProgress';
import { PaymentStatus } from './PaymentStatus';
import { AuctionSavings } from './AuctionSavings';

interface TripCockpitProps {
  data: TripDashboardData;
}

export const TripCockpit = ({ data }: TripCockpitProps) => {
  const { countdown, checklist, payments, auctionSavings } = data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 -mx-4"
    >
      <CountdownCard
        daysLeft={countdown.daysLeft}
        isUrgent={countdown.isUrgent}
        isPast={countdown.isPast}
      />

      <ChecklistProgress
        total={checklist.total}
        completed={checklist.completed}
        percent={checklist.percent}
        pendingItems={checklist.pendingItems}
      />

      <PaymentStatus
        totalAmount={payments.totalAmount}
        paidAmount={payments.paidAmount}
        pendingAmount={payments.pendingAmount}
        biddingAmount={payments.biddingAmount}
        paidPercent={payments.paidPercent}
      />

      <AuctionSavings
        totalSaved={auctionSavings.totalSaved}
        percentSaved={auctionSavings.percentSaved}
        auctionCount={auctionSavings.auctionCount}
      />
    </motion.div>
  );
};

export default TripCockpit;
