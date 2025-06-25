import { useQuery } from '@tanstack/react-query';
import { Crown, LogOut, Plus, Users, Clock, CheckCircle, Kanban as Diagram } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../auth/AuthProvider';
import { ProjectTable } from './ProjectTable';
import { AddProjectModal } from './AddProjectModal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { ProjectWithClient, User } from '@shared/schema';

interface AdminStats {
  totalClients: number;
  activeProjects: number;
  pendingFeedback: number;
  completed: number;
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ['/api/admin/projects'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/clients'],
  });

  if (projectsLoading || statsLoading || clientsLoading) {
    return <LoadingSpinner />;
  }

  // Filter projects by selected client if any
  const filteredProjects = selectedClientId 
    ? projects?.filter(p => p.client_id === selectedClientId) 
    : projects;

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

        {/* Client Selection and Projects */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Project Management</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Filter by Client:</label>
                  <Select value={selectedClientId?.toString() || "all"} onValueChange={(value) => setSelectedClientId(value === "all" ? null : parseInt(value))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {selectedClientId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Showing projects for: <strong>{clients?.find(c => c.id === selectedClientId)?.name}</strong>
                </p>
              </div>
            )}
            
            <ProjectTable projects={filteredProjects || []} />
          </div>
        </div>
      </main>

      {/* Add Project Modal */}
      <AddProjectModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
