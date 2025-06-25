import { useQuery } from '@tanstack/react-query';
import { Crown, LogOut, Plus, Users, Clock, CheckCircle, Kanban as Diagram } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../auth/AuthProvider';
import { ProjectTable } from './ProjectTable';
import { AddProjectModal } from './AddProjectModal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { ProjectWithClient } from '@shared/schema';

interface AdminStats {
  totalClients: number;
  activeProjects: number;
  pendingFeedback: number;
  completed: number;
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: projects, isLoading: projectsLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ['/api/admin/projects'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  if (projectsLoading || statsLoading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: Diagram,
      color: 'text-blue-600',
    },
    {
      title: 'Pending Feedback',
      value: stats?.pendingFeedback || 0,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
              <span className="text-sm text-gray-500">{user?.name}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Admin
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects Table */}
        <ProjectTable projects={projects || []} />
      </main>

      {/* Add Project Modal */}
      <AddProjectModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
