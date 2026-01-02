import { useEffect, useCallback } from 'react';
import { Task, TaskStatus, CONFIDENCE_THRESHOLD } from '@/types';
import { ghostTaskTemplates } from '@/data/demoData';

let taskCounter = 10;

// Pipeline stages for automatic progression
const processingStages: TaskStatus[] = ['ingesting', 'planning', 'reasoning', 'validating'];

export function useSimulation(
  enabled: boolean,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) {
  // Progress tasks through pipeline stages
  const progressTasks = useCallback(() => {
    setTasks((prev) =>
      prev.map((task) => {
        // Skip tasks that are already completed
        if (['review', 'approved', 'learning'].includes(task.status)) {
          return task;
        }

        const currentIndex = processingStages.indexOf(task.status);
        
        // If at the last processing stage (validating), decide outcome
        if (currentIndex === processingStages.length - 1) {
          const confidence = task.confidence ?? 50;
          // Below threshold → Expert Review, otherwise → Approved
          const newStatus: TaskStatus = confidence < CONFIDENCE_THRESHOLD ? 'review' : 'approved';
          return { ...task, status: newStatus };
        }

        // Move to next stage
        if (currentIndex >= 0 && currentIndex < processingStages.length - 1) {
          return { ...task, status: processingStages[currentIndex + 1] };
        }

        return task;
      })
    );
  }, [setTasks]);

  const addGhostTask = useCallback(() => {
    const template = ghostTaskTemplates[Math.floor(Math.random() * ghostTaskTemplates.length)];
    const sources = ['email', 'slack', 'meeting'] as const;
    const randomSource = template.source || sources[Math.floor(Math.random() * sources.length)];
    
    const newTask: Task = {
      id: `ghost-${taskCounter++}`,
      title: template.title,
      requestor: template.requestor,
      status: 'ingesting', // Always start at ingesting
      timestamp: new Date(),
      priority: template.priority,
      description: `Auto-generated task: ${template.title}`,
      source: randomSource,
      flags: template.flags || { urgency: Math.random() > 0.7, humanRequested: Math.random() > 0.8, vip: Math.random() > 0.9 },
      confidence: Math.floor(50 + Math.random() * 50),
    };

    setTasks((prev) => [newTask, ...prev]);
  }, [setTasks]);

  useEffect(() => {
    if (!enabled) return;

    // Add a ghost task every 8-15 seconds
    const addInterval = setInterval(() => {
      addGhostTask();
    }, 8000 + Math.random() * 7000);

    // Progress tasks through pipeline every 3-5 seconds
    const progressInterval = setInterval(() => {
      progressTasks();
    }, 3000 + Math.random() * 2000);

    return () => {
      clearInterval(addInterval);
      clearInterval(progressInterval);
    };
  }, [enabled, addGhostTask, progressTasks]);

  return { addGhostTask };
}
