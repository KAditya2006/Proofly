import React, { useEffect, useState } from 'react';
import { getTasks, updateTaskStatus } from '../services/taskService';
import { Clock, AlertCircle } from 'lucide-react';

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateTaskStatus(id, status);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-brand-navy">Task Board</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tasks found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {tasks.map(task => (
              <li key={task._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                    <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Priority: {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-brand-coral focus:border-brand-navy rounded-md"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
