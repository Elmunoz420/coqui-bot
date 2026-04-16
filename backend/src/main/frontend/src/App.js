          /*
## MyToDoReact version 1.0.
##
## Copyright (c) 2022 Oracle, Inc.
## Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl/
*/
/*
 * This is the application main React component. We're using "function"
 * components in this application. No "class" components should be used for
 * consistency.
 * @author  jean.de.lavarene@oracle.com
 */
import React, { useState, useEffect, useMemo } from 'react';
import API_LIST from './API';
import { CircularProgress } from '@mui/material';
import Topbar from './components/Topbar';
import SummaryCards from './components/SummaryCards';
import TaskFilters from './components/TaskFilters';
import TaskComposer from './components/TaskComposer';
import TaskTable from './components/TaskTable';
import TaskDetailDrawer from './components/TaskDetailDrawer';
import BotActivityPanel from './components/BotActivityPanel';

/* In this application we're using Function Components with the State Hooks
 * to manage the states. See the doc: https://reactjs.org/docs/hooks-state.html
 * This App component represents the entire app. It renders a NewItem component
 * and two tables: one that lists the todo items that are to be done and another
 * one with the items that are already done.
 */
function App() {
    const [isLoading, setLoading] = useState(false);
    const [isInserting, setInserting] = useState(false);
    const [items, setItems] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isTaskDetailOpen, setTaskDetailOpen] = useState(false);
    const [filters, setFilters] = useState({
      search: '',
      project: 'All',
      status: 'All',
      priority: 'All'
    });
    const [error, setError] = useState();

    function recordActivity(message, taskId) {
      setActivityLog((previous) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          message,
          taskId,
          createdAt: new Date().toISOString()
        },
        ...previous
      ].slice(0, 40));
    }

    function inferPriority(item) {
      // FASE 2: Ya no inferimos, usamos el valor real del backend
      if (item.prioridad) {
        return item.prioridad.toLowerCase();
      }
      return 'media';
    }

    function inferStatus(item) {
      // Usar estado real si está disponible, sino inferir de done
      if (item.estado) {
        return item.estado.toLowerCase();
      }
      if (item.done === true) {
        return 'completada';
      }
      return 'pendiente';
    }

    function buildFallbackHistory(item) {
      const events = [];
      if (item.createdAt) {
        events.push({
          id: `created-${item.id}`,
          title: 'Task created',
          date: item.createdAt,
          comment: 'Created from task service.'
        });
      }
      if (item.done) {
        events.push({
          id: `done-${item.id}`,
          title: 'Task marked as completed',
          date: new Date().toISOString(),
          comment: 'State is currently completed.'
        });
      }
      const uiEvents = activityLog
        .filter((entry) => String(entry.taskId) === String(item.id))
        .map((entry) => ({
          id: `ui-${entry.id}`,
          title: entry.message,
          date: entry.createdAt,
          comment: 'Recorded from frontend activity.'
        }));
      return [...uiEvents, ...events];
    }

    function buildAiSuggestions(task) {
      if (Array.isArray(task.aiSuggestions) && task.aiSuggestions.length) {
        return task.aiSuggestions;
      }
      const suggestions = [];
      if (!task.done) {
        suggestions.push({
          id: `ai-focus-${task.id}`,
          type: 'Focus recommendation',
          content: 'Break this task into two sub-steps for better execution tracking.'
        });
      }
      suggestions.push({
        id: `ai-time-${task.id}`,
        type: 'Time estimate',
        content: 'Review estimated vs real effort after completion to improve planning quality.'
      });
      return suggestions;
    }

    function normalizeTask(item) {
      return {
        id: item.id,
        title: item.description || item.title || 'Untitled task',
        rawDescription: item.description || '',
        description: item.descripcion || '',
        project:
          item.project?.name ||
          item.proyecto?.nombre ||
          item.project ||
          item.proyecto ||
          'COQUI BOT',
        assignedUser:
          item.assignedUser?.name ||
          item.usuarioAsignado?.nombre ||
          item.assignedUser ||
          'coqui_bot_user',
        priority: inferPriority(item),
        status: inferStatus(item),
        done: Boolean(item.done),
        createdAt: item.createdAt || item.fechaCreacion || null,
        dueDate: item.fechaLimite || item.dueDate || null,
        estimatedHours: item.horasEstimadas ?? 'N/A',
        realHours: item.horasReales ?? 'N/A',
        history: buildFallbackHistory(item),
        aiSuggestions: buildAiSuggestions(item)
      };
    }

    const normalizedTasks = useMemo(() => items.map(normalizeTask), [items, activityLog]);

    const projectOptions = useMemo(
      () => ['All', ...new Set(normalizedTasks.map((task) => task.project))],
      [normalizedTasks]
    );

    const statusOptions = useMemo(
      () => ['All', ...new Set(normalizedTasks.map((task) => task.status))],
      [normalizedTasks]
    );

    const priorityOptions = useMemo(
      () => ['All', ...new Set(normalizedTasks.map((task) => task.priority))],
      [normalizedTasks]
    );

    const filteredTasks = useMemo(() => {
      return normalizedTasks.filter((task) => {
        const searchValue = filters.search.toLowerCase();
        const matchesSearch =
          !searchValue ||
          task.title.toLowerCase().includes(searchValue) ||
          task.description.toLowerCase().includes(searchValue);
        const matchesProject = filters.project === 'All' || task.project === filters.project;
        const matchesStatus = filters.status === 'All' || task.status === filters.status;
        const matchesPriority = filters.priority === 'All' || task.priority === filters.priority;
        return matchesSearch && matchesProject && matchesStatus && matchesPriority;
      });
    }, [normalizedTasks, filters]);

    const metrics = useMemo(() => {
      const total = normalizedTasks.length;
      const active = normalizedTasks.filter((task) => !task.done).length;
      const completed = normalizedTasks.filter((task) => task.done).length;
      const now = Date.now();
      const overdue = normalizedTasks.filter((task) => {
        if (task.done || !task.dueDate) {
          return false;
        }
        const due = new Date(task.dueDate).getTime();
        return !Number.isNaN(due) && due < now;
      }).length;
      return { total, active, completed, overdue };
    }, [normalizedTasks]);

    function deleteItem(deleteId) {
      fetch(API_LIST+"/"+deleteId, {
        method: 'DELETE',
      })
      .then(response => {
        if (response.ok) {
          return response;
        } else {
          throw new Error('Something went wrong ...');
        }
      })
      .then(
        (result) => {
          const remainingItems = items.filter(item => item.id !== deleteId);
          setItems(remainingItems);
          recordActivity(`Task #${deleteId} deleted`, deleteId);
          if (selectedTask && String(selectedTask.id) === String(deleteId)) {
            setTaskDetailOpen(false);
            setSelectedTask(null);
          }
        },
        (error) => {
          setError(error);
        }
      );
    }
    function toggleDone(event, id, description, done) {
      event.preventDefault();
      modifyItem(id, description, done).then(
        (result) => {
          reloadOneIteam(id);
          recordActivity(`Task #${id} marked as ${done ? 'done' : 'pending'}`, id);
        },
        (error) => { setError(error); }
      );
    }
    function reloadOneIteam(id){
      fetch(API_LIST+"/"+id)
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Something went wrong ...');
          }
        })
        .then(
          (result) => {
            const items2 = items.map(
              x => (String(x.id) === String(id) ? {
                 ...x,
                 'description':result.description,
                 'createdAt': result.createdAt,
                 'done': result.done
                } : x));
            setItems(items2);
          },
          (error) => {
            setError(error);
          });
    }
    function modifyItem(id, description, done) {
      // console.log("deleteItem("+deleteId+")")
      var data = {"description": description, "done": done};
      return fetch(API_LIST+"/"+id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        // console.log("response=");
        // console.log(response);
        if (response.ok) {
          // console.log("deleteItem FETCH call is ok");
          return response;
        } else {
          throw new Error('Something went wrong ...');
        }
      });
    }
    /*
    To simulate slow network, call sleep before making API calls.
    const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    */
    useEffect(() => {
      setLoading(true);
      fetch(API_LIST)
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Something went wrong ...');
          }
        })
        .then(
          (result) => {
            setLoading(false);
            setItems(result);
            recordActivity('Task list synchronized from backend');
          },
          (error) => {
            setLoading(false);
            setError(error);
          });
    },
    [] // empty deps array [] means
       // this useEffect will run once
    );
    function addItem(taskData){
      setInserting(true);
      // taskData ahora puede ser un objeto completo {description, descripcion, prioridad, fechaLimite, horasEstimadas, ...}
      // o un string simple (para compatibilidad hacia atrás)
      const payload = typeof taskData === 'string' 
        ? { description: taskData, done: false } 
        : taskData;
      
      fetch(API_LIST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      }).then((response) => {
        if (response.ok) {
          return response;
        } else {
          throw new Error('Something went wrong ...');
        }
      }).then(
        (result) => {
          var id = result.headers.get('location');
          // Build complete new item from payload, with server-returned ID
          var newItem = {
            id: id,
            description: payload.description || 'Untitled',
            descripcion: payload.descripcion || '',
            prioridad: payload.prioridad || 'media',
            estado: 'pendiente',
            done: false,
            createdAt: new Date().toISOString(),
            fechaLimite: payload.fechaLimite || null,
            horasEstimadas: payload.horasEstimadas || 0,
            horasReales: 0
          };
          setItems([newItem, ...items]);
          setInserting(false);
          recordActivity(`Task #${id} created: ${payload.description}`, id);
        },
        (error) => {
          setInserting(false);
          setError(error);
        }
      );
    }

    function handleFilterChange(field, value) {
      setFilters((current) => ({ ...current, [field]: value }));
    }

    function resetFilters() {
      setFilters({ search: '', project: 'All', status: 'All', priority: 'All' });
    }

    function openTaskDetails(task) {
      setSelectedTask(task);
      setTaskDetailOpen(true);
    }

    const recentActivity = activityLog.slice(0, 8);

    return (
      <>
        <Topbar />
        <main className="main-layout">
          <div className="main-content">
            {error && (
              <section className="error-banner" role="alert">
                <strong>Unable to process request.</strong>
                <span>{error.message}</span>
              </section>
            )}

            <SummaryCards metrics={metrics} />
            <TaskComposer onAddItem={addItem} isInserting={isInserting} />

            <TaskFilters
              filters={filters}
              onChange={handleFilterChange}
              projectOptions={projectOptions}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
              onReset={resetFilters}
            />

            {isLoading ? (
              <div className="loading-state" role="status">
                <CircularProgress />
                <p>Loading tasks from backend...</p>
              </div>
            ) : (
              <TaskTable
                tasks={filteredTasks}
                onToggleDone={toggleDone}
                onDelete={deleteItem}
                onOpenDetails={openTaskDetails}
              />
            )}

            <BotActivityPanel activities={recentActivity} />
          </div>
        </main>

        <TaskDetailDrawer
          open={isTaskDetailOpen}
          onClose={() => setTaskDetailOpen(false)}
          task={selectedTask}
        />
      </>
    );
}
export default App;
