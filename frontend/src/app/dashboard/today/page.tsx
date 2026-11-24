import TodayTasks from '@/components/dashboard/TodayTasks';

export const instant = false;

export default function TodayTasksPage() {
  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      <TodayTasks />
    </div>
  );
}
