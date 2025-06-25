import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@shared/schema';

interface ProjectCardProps {
  project: Project;
}

const statusConfig = {
  'in-progress': { label: 'In Progress', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  'waiting-feedback': { label: 'Waiting for Feedback', variant: 'secondary' as const, color: 'bg-amber-100 text-amber-800' },
  'complete': { label: 'Complete', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
};

export function ProjectCard({ project }: ProjectCardProps) {
  const [driveLink, setDriveLink] = useState(project.driveLink || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateDriveLinkMutation = useMutation({
    mutationFn: async (link: string) => {
      const response = await apiRequest('PATCH', `/api/projects/${project.id}/drive-link`, {
        driveLink: link,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/my/${project.clientId}`] });
      toast({
        title: 'Success',
        description: 'Drive link updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update drive link',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateLink = () => {
    updateDriveLinkMutation.mutate(driveLink);
  };

  const status = statusConfig[project.status as keyof typeof statusConfig];
  const isComplete = project.status === 'complete';

  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          </div>
          <Badge className={status.color}>
            {status.label}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{project.completionPercentage}%</span>
          </div>
          <Progress value={project.completionPercentage} className="h-2" />
        </div>

        {/* Admin Notes */}
        {project.notes && (
          <div className={`mb-4 p-3 rounded-lg ${
            isComplete ? 'bg-green-50' : 'bg-gray-50'
          }`}>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Admin Notes:</h4>
            <p className="text-sm text-gray-600">{project.notes}</p>
          </div>
        )}

        {/* Drive Link */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Google Drive Link</Label>
          <Input
            type="url"
            placeholder="https://drive.google.com/..."
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            disabled={isComplete}
          />
          <Button
            className="w-full"
            onClick={handleUpdateLink}
            disabled={updateDriveLinkMutation.isPending || isComplete}
          >
            {isComplete 
              ? 'Project Complete' 
              : updateDriveLinkMutation.isPending 
                ? 'Updating...' 
                : 'Update Link'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
