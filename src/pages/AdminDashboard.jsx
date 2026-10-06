import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../layouts/AppShell";
import { Card, EmptyState, LoadingState, PageHeader, SectionHeader } from "../components/ui";
import { api } from "../services/api";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.admin.analytics()
      .then(setData)
      .catch((error) => setMessage(error.message || "Admin access required"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <AppShell><LoadingState label="Loading admin analytics" /></AppShell>;
  }

  if (!data) {
    return (
      <AppShell>
        <EmptyState icon={Shield} title="Admin dashboard unavailable" description={message} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title="Admin dashboard"
        description="Aggregated platform analytics without exposing personal student details."
      />

      <div className="metric-grid card">
        <div><span className="eyebrow">Total students</span><strong>{data.totalStudents}</strong></div>
        <div><span className="eyebrow">Active (30 days)</span><strong>{data.activeStudents}</strong></div>
        <div><span className="eyebrow">Events (30 days)</span><strong>{data.activity?.eventsLast30Days}</strong></div>
      </div>

      <div className="card-grid two-col">
        <Card>
          <SectionHeader title="Popular target roles" />
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.popularTargetRoles || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="role" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionHeader title="Common skill gaps" />
          <ul>{data.commonSkillGaps?.map((item) => <li key={item.skill}>{item.skill} — {item.count} students</li>)}</ul>
          <SectionHeader title="Activity (30 days)" />
          <ul>
            <li>Tests: {data.activity?.testsLast30Days}</li>
            <li>Roadmap updates: {data.activity?.roadmapUpdatesLast30Days}</li>
            <li>Project updates: {data.activity?.projectUpdatesLast30Days}</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

export default AdminDashboard;
