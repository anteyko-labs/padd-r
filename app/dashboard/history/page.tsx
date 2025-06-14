import { DashboardLayout } from '@/components/dashboard/layout';
import { TransactionHistory } from '@/components/dashboard/transaction-history';

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">View your staking and reward history</p>
        </div>
        <TransactionHistory />
      </div>
    </DashboardLayout>
  );
}