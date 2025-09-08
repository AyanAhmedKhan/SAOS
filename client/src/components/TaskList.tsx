import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Check, Clock, AlertTriangle } from 'lucide-react';
import type { Task } from '@/types';

interface TaskListProps {
  farmId: string;
}

export default function TaskList({ farmId }: TaskListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['/api/farms', farmId, 'tasks'],
    queryFn: () => api.getTasks(farmId),
    enabled: !!farmId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: any }) =>
      api.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'tasks'] });
      toast({
        title: 'Task Updated',
        description: 'Task has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update task.',
      });
    },
  });

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTasks(prev => new Set(prev).add(taskId));
    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        updates: { status: 'completed' }
      });
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-chart-5" />;
      case 'low':
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'task-high border-l-4';
      case 'medium':
        return 'task-medium border-l-4';
      case 'low':
        return 'task-low border-l-4';
      default:
        return 'border-l-4 border-l-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-accent text-accent-foreground';
      case 'in_progress':
        return 'bg-primary text-primary-foreground';
      case 'pending':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const pendingTasks = tasks?.filter((task: Task) => task.status !== 'completed') || [];
  const completedTasks = tasks?.filter((task: Task) => task.status === 'completed') || [];
  const completionRate = tasks?.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5" />
            <span>Tasks & Reminders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5" />
            <span>Tasks & Reminders</span>
          </CardTitle>
          <Button size="sm" variant="outline" data-testid="button-new-task">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task: Task) => {
              const isCompleting = completingTasks.has(task.id);
              
              return (
                <div
                  key={task.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                    task.priority === 'high' 
                      ? 'bg-destructive bg-opacity-10 border border-destructive' 
                      : 'bg-muted hover:bg-muted/80'
                  } ${getPriorityClass(task.priority)}`}
                  data-testid={`task-${task.id}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(task.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={isCompleting}
                      data-testid={`button-complete-${task.id}`}
                    >
                      {isCompleting ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending tasks</p>
              <p className="text-sm text-muted-foreground mt-2">
                All tasks completed! Create new tasks to stay organized.
              </p>
            </div>
          )}

          {/* Completed task example */}
          {completedTasks.length > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg opacity-60">
              <div className="flex-shrink-0">
                <Check className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground line-through">
                  {completedTasks[0].title}
                </p>
                <p className="text-sm text-muted-foreground">
                  Completed {completedTasks[0].completedAt ? 
                    new Date(completedTasks[0].completedAt).toLocaleDateString() : 
                    'recently'}
                </p>
              </div>
            </div>
          )}

          {/* Task completion stats */}
          {tasks && tasks.length > 0 && (
            <div className="mt-4 p-3 bg-background rounded border border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">This week:</span>
                <span className="font-mono">
                  {completedTasks.length} of {tasks.length} tasks completed
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
