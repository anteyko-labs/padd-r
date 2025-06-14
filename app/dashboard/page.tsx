import { DashboardLayout } from '@/components/dashboard/layout';
import { Overview } from '@/components/dashboard/overview';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Overview />
    </DashboardLayout>
  );
}