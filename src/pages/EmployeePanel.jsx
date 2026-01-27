import React, { useEffect, useState } from "react";
import axios from "axios";

// Utility: Format "time ago"
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (let key in intervals) {
    const interval = Math.floor(seconds / intervals[key]);
    if (interval > 1) return `${interval} ${key}s ago`;
    if (interval === 1) return `1 ${key} ago`;
  }

  return "just now";
};

// Utility: Format duration in a readable way
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const Calendar = ({ tasks, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getTasksForDate = (day) => {
    const dateStr = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    ).toDateString();

    return tasks.filter((task) => {
      const taskDate = new Date(task.createdAt).toDateString();
      return taskDate === dateStr;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prevMonth}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ←
        </button>
        <h3 className="font-semibold text-lg">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayTasks = getTasksForDate(day);
          const hasCompletedTasks = dayTasks.some(
            (t) => t.status === "Completed",
          );
          const hasPendingTasks = dayTasks.some(
            (t) => t.status !== "Completed",
          );

          return (
            <button
              key={day}
              onClick={() => {
                const clickedDate = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day,
                );
                onDateSelect(clickedDate);
              }}
              className={`aspect-square flex flex-col items-center justify-center text-sm border rounded hover:bg-gray-100 transition ${
                isSelectedDate(day) ? "bg-blue-100 border-blue-500" : ""
              }`}
            >
              <span className="font-medium">{day}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {hasPendingTasks && (
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  )}
                  {hasCompletedTasks && (
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>Pending/Ongoing Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Completed Tasks</span>
        </div>
      </div>
    </div>
  );
};

const TaskCard = React.memo(function TaskCard({
  task,
  addNote,
  noteValue,
  onNoteChange,
  startTask,
  pauseTask,
  completeTask,
  reopenTask,
  currentTime,
}) {
  const getLiveTimeSpent = () => {
    if (!task.startTime) return "Not started";
    const totalWorked = task.totalWorkedSeconds || 0;
    if (task.status === "Completed") return formatDuration(totalWorked);

    let liveSeconds = totalWorked;
    if (!task.isPaused && task.lastResumedAt) {
      liveSeconds += Math.floor(
        (currentTime - new Date(task.lastResumedAt)) / 1000,
      );
    }
    return formatDuration(Math.max(0, liveSeconds));
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">{task.title}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            task.status === "Completed"
              ? "bg-green-100 text-green-700"
              : task.status === "Paused"
                ? "bg-orange-100 text-orange-700"
                : task.status === "Ongoing"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {task.status}
        </span>
      </div>

      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
      {/* <p className="text-white text-sm mt-1 bg-[#010110] rounded-[9px] w-fit px-2 py-1 inline-block">
        {task.client?.name || "no Client name"}
      </p> */}

      <p className="text-xs text-gray-400 mt-1">
        Assigned{" "}
        {new Date(task.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </p>

      {task.startTime && (
        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">
              ⏱️ Time Spent:
            </span>
            <span
              className={`text-sm font-bold ${
                task.status === "Ongoing"
                  ? "text-blue-600"
                  : task.status === "Paused"
                    ? "text-orange-600"
                    : "text-green-600"
              }`}
            >
              {getLiveTimeSpent()}
            </span>
          </div>
          {/* ... status indicators ... */}
        </div>
      )}

      {task.status === "Completed" && task.updatedAt && (
        <p className="text-xs text-gray-400 mt-1">
          Completed{" "}
          {new Date(task.updatedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {(task.status === "Pending" || !task.startTime) && (
          <button
            onClick={() => startTask(task._id)}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            ▶ Start
          </button>
        )}

        {(task.status === "Ongoing" || task.status === "Paused") &&
          task.startTime && (
            <button
              onClick={() => pauseTask(task._id)}
              className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
            >
              {task.status === "Paused" ? "▶ Resume" : "⏸ Pause"}
            </button>
          )}

        {task.status !== "Completed" && (
          <button
            onClick={() => completeTask(task._id)}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Complete
          </button>
        )}

        {task.status === "Completed" && (
          <button
            onClick={() => reopenTask(task._id)}
            className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
          >
            Reopen
          </button>
        )}
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-semibold">Notes</h4>

        <div className="max-h-20 overflow-y-auto mt-1">
          {task.notes?.length ? (
            task.notes.map((note, index) => (
              <p key={index} className="text-gray-700 text-xs border-b py-1">
                • {note.message}
              </p>
            ))
          ) : (
            <p className="text-gray-400 text-xs">No notes yet.</p>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Add a note..."
            value={noteValue}
            onChange={(e) => onNoteChange(task._id, e.target.value)}
            className="w-full text-xs border px-2 py-1 rounded-md"
          />
          <button
            onClick={() => addNote(task._id)}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

export default function EmployeePanel() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteInputs, setNoteInputs] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = JSON.parse(sessionStorage.getItem("userInfo") || "{}")?.token;

  // Update current time every second for live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tasks`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  const startTask = async (taskId) => {
    try {
      const { data } = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.map((t) => (t._id === taskId ? data : t)));
    } catch (err) {
      console.error("Error starting task:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const pauseTask = async (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t._id === taskId && !t.isPaused) {
          const now = new Date();
          const activeTime = t.lastResumedAt
            ? Math.floor((now - new Date(t.lastResumedAt)) / 1000)
            : 0;
          return {
            ...t,
            isPaused: true,
            status: "Paused",
            pausedAt: now,
            totalWorkedSeconds: (t.totalWorkedSeconds || 0) + activeTime,
          };
        }
        return t;
      }),
    );

    try {
      const { data } = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/pause`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.map((t) => (t._id === taskId ? data : t)));
    } catch (err) {
      console.error(err);
    }
  };
  const completeTask = async (taskId) => {
    try {
      const { data } = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.map((t) => (t._id === taskId ? data : t)));
    } catch (err) {
      console.error("Error completing task:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const reopenTask = async (taskId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId
          ? {
              ...t,
              status: "Ongoing",
              isPaused: false,
              lastResumedAt: new Date(),
            }
          : t,
      ),
    );

    try {
      const { data } = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/reopen`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.map((t) => (t._id === taskId ? data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNoteChange = (taskId, value) => {
    setNoteInputs((prev) => ({ ...prev, [taskId]: value }));
  };

  const addNote = async (taskId) => {
    const note = noteInputs[taskId];
    if (!note?.trim()) return;

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/notes`,
        { message: note },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, notes: data.notes } : t)),
      );

      setNoteInputs((prev) => ({ ...prev, [taskId]: "" }));
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    const selectedDateStr = selectedDate.toDateString();
    return tasks.filter((task) => {
      const taskDate = new Date(task.createdAt).toDateString();
      return taskDate === selectedDateStr;
    });
  };

  const selectedDateTasks = getTasksForSelectedDate();
  const selectedOngoing = selectedDateTasks.filter(
    (t) => t.status !== "Completed",
  );
  const selectedCompleted = selectedDateTasks.filter(
    (t) => t.status === "Completed",
  );

  // Split tasks into Ongoing & Completed
  const ongoingTasks = tasks.filter((t) => t.status !== "Completed");
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const today = new Date().toLocaleDateString();

  // for single day tasks
  const todaysTasks = completedTasks.filter((task) => {
    const taskDate = new Date(task.updatedAt).toLocaleDateString();
    return taskDate === today;
  });

  // Summary
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const pendingCount = ongoingTasks.length;

  //  FIXED: Calculate total time spent today (excluding pause time)
  const totalTimeSpentToday = todaysTasks.reduce((total, task) => {
    if (task.startTime && task.endTime) {
      const start = new Date(task.startTime);
      const end = new Date(task.endTime);
      const rawTime = Math.floor((end - start) / 1000);
      const actualTime = rawTime - (task.pausedDuration || 0);
      return total + actualTime;
    }
    return total;
  }, 0);

  if (loading)
    return <p className="text-gray-500 text-center mt-10">Loading tasks....</p>;

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <h2 className="text-3xl my-5 font-bold">Employee Panel</h2>

      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 text-white p-4 rounded-lg text-center">
          <p className="text-sm">Total Assigned</p>
          <h3 className="text-xl font-bold">{totalTasks}</h3>
        </div>
        <div className="bg-green-100 text-green-700 p-4 rounded-lg text-center">
          <p className="text-sm">Completed</p>
          <h3 className="text-xl font-bold">{completedCount}</h3>
        </div>
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg text-center">
          <p className="text-sm">Pending</p>
          <h3 className="text-xl font-bold">{pendingCount}</h3>
        </div>
        {/* <div className="bg-blue-100 text-blue-700 p-4 rounded-lg text-center">
          <p className="text-sm">Time Today</p>
          <h3 className="text-xl font-bold">
            {formatDuration(totalTimeSpentToday)}
          </h3>
        </div> */}
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT – ONGOING TASKS */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Pending / Ongoing Tasks
          </h3>
          <div className="space-y-4 max-h-[520px] overflow-y-auto">
            {ongoingTasks.length ? (
              ongoingTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  addNote={addNote}
                  noteValue={noteInputs[task._id] || ""}
                  onNoteChange={handleNoteChange}
                  startTask={startTask}
                  pauseTask={pauseTask}
                  completeTask={completeTask}
                  reopenTask={reopenTask}
                  currentTime={currentTime}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No pending tasks.</p>
            )}
          </div>
        </div>

        {/* MIDDLE – COMPLETED TASKS */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Today's Completed Tasks
          </h3>
          <div className="space-y-4 max-h-[520px] overflow-y-auto">
            {todaysTasks.length > 0 ? (
              todaysTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  addNote={addNote}
                  noteValue={noteInputs[task._id] || ""}
                  onNoteChange={handleNoteChange}
                  startTask={startTask}
                  pauseTask={pauseTask}
                  completeTask={completeTask}
                  reopenTask={reopenTask}
                  currentTime={currentTime}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No tasks completed today.</p>
            )}
          </div>
        </div>

        {/* RIGHT – CALENDAR */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Task Calendar
          </h3>
          <Calendar
            tasks={tasks}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
          />

          {/* Selected Date Tasks */}
          {selectedDate && (
            <div className="mt-6 max-h-[150px] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Tasks for {selectedDate.toLocaleDateString()}
              </h3>

              {selectedDateTasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No tasks for this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedOngoing.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-700 mb-2">
                        Pending ({selectedOngoing.length})
                      </h4>
                      {selectedOngoing.map((task) => (
                        <div
                          key={task._id}
                          className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2"
                        >
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-gray-600">
                            {task.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedCompleted.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-2">
                        Completed ({selectedCompleted.length})
                      </h4>
                      {selectedCompleted.map((task) => (
                        <div
                          key={task._id}
                          className="bg-green-50 border border-green-200 rounded p-2 mb-2"
                        >
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-gray-600">
                            {task.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
