import { DashboardLayout } from '@/components/dashboard/layout';
import { UserProfile } from '@/components/dashboard/user-profile';

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>
        <UserProfile />
      </div>
    </DashboardLayout>
  );
}