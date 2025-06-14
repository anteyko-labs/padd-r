import { DashboardLayout } from '@/components/dashboard/layout';
import { StakingForm } from '@/components/dashboard/staking-form';

export default function StakePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Stake Tokens</h1>
          <p className="text-muted-foreground">Lock your PADD-R tokens to earn rewards and tier benefits</p>
        </div>
        <StakingForm />
      </div>
    </DashboardLayout>
  );
}