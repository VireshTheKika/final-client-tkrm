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

const TaskCard = React.memo(function TaskCard({
  task,
  updateStatus,
  addNote,
  noteValue,
  onNoteChange,
}) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">{task.title}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            task.status === "Completed"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {task.status}
        </span>
      </div>

      <p className="text-gray-600 text-sm mt-1">{task.description}</p>

      <p className="text-xs text-gray-400 mt-1">
        Assigned {timeAgo(task.createdAt)}
      </p>

      <button
        onClick={() => updateStatus(task._id, task.status)}
        className="mt-3 px-3 py-1 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800"
      >
        {task.status === "Completed" ? "Mark Ongoing" : "Mark Completed"}
      </button>

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
      day
    ).toDateString();

    return tasks.filter((task) => {
      const taskDate = new Date(task.createdAt).toDateString();
      return taskDate === dateStr;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
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
            (t) => t.status === "Completed"
          );
          const hasPendingTasks = dayTasks.some(
            (t) => t.status !== "Completed"
          );

          return (
            <button
              key={day}
              onClick={() => {
                const clickedDate = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day
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

export default function EmployeePanel() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteInputs, setNoteInputs] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  const token = JSON.parse(sessionStorage.getItem("userInfo"))?.token;

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
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
  }, []);

  // Get tasks for selected date
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
    (t) => t.status !== "Completed"
  );
  const selectedCompleted = selectedDateTasks.filter(
    (t) => t.status === "Completed"
  );

  // Split tasks into Ongoing & Completed
  const ongoingTasks = tasks.filter((t) => t.status !== "Completed");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  // Summary
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const pendingCount = ongoingTasks.length;

  const updateStatus = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Completed" ? "Ongoing" : "Completed";

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error("Error updating status:", err);
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, notes: data.notes } : t))
      );

      setNoteInputs((prev) => ({ ...prev, [taskId]: "" }));
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  if (loading)
    return <p className="text-gray-500 text-center mt-10">Loading tasks...</p>;

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <h2 className="text-3xl my-5 font-bold">Employee panel</h2>
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
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE – CALENDAR */}

        {/* MIDDLE – ONGOING TASKS */}
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
                  updateStatus={updateStatus}
                  addNote={addNote}
                  noteValue={noteInputs[task._id] || ""}
                  onNoteChange={handleNoteChange}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No pending tasks.</p>
            )}
          </div>
        </div>

        {/* RIGHT SIDE – COMPLETED TASKS */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Completed Tasks
          </h3>
          <div className="space-y-4 max-h-[520px] overflow-y-auto">
            {completedTasks.length ? (
              completedTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  updateStatus={updateStatus}
                  addNote={addNote}
                  noteValue={noteInputs[task._id] || ""}
                  onNoteChange={handleNoteChange}
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No completed tasks yet.</p>
            )}
          </div>
        </div>

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
                  {/* Ongoing Tasks for Selected Date */}
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

                  {/* Completed Tasks for Selected Date */}
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
