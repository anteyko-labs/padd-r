import { DashboardLayout } from '@/components/dashboard/layout';
import { RewardsPanel } from '@/components/dashboard/rewards-panel';

export default function RewardsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Your Rewards</h1>
          <p className="text-muted-foreground">Manage your NFTs, vouchers, and exclusive benefits</p>
        </div>
        <RewardsPanel />
      </div>
    </DashboardLayout>
  );
}