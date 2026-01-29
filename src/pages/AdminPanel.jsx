import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import ClientPanel from "../components/ClientPanel";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null });
  const [assignLoading, setAssignLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
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
  const getTasksForSelectedDate = () => {
    if (!selectedDate) return [];
    const selectedDateStr = selectedDate.toDateString();
    return tasks.filter((task) => {
      const taskDate = new Date(task.createdAt).toDateString();
      return taskDate === selectedDateStr;
    });
  };

  const [selectedDate, setSelectedDate] = useState(null);
  const selectedDateTasks = getTasksForSelectedDate();
  const selectedOngoing = selectedDateTasks.filter(
    (t) => t.status !== "Completed",
  );
  const selectedCompleted = selectedDateTasks.filter(
    (t) => t.status === "Completed",
  );
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/clients/get-clients`,
        );
        setClients(res.data);
      } catch (error) {
        console.error("Failed to fetch clients", error);
      }
    };

    fetchClients();
  }, []);
  // NEW — Admin can assign tasks
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    deadline: "",
  });

  const token = JSON.parse(sessionStorage.getItem("userInfo"))?.token;
  const adminId = JSON.parse(sessionStorage.getItem("userInfo"))?._id;

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [usersRes, tasksRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUsers(usersRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        console.error("❌ Error loading admin panel:", error);
      }
    };

    fetchData();
  }, [token]);
  const liveTasks = tasks.filter(
    (task) =>
      task.status === "Ongoing" &&
      !task.isPaused &&
      (selectedEmployee === "all" || task.assignedTo?._id === selectedEmployee),
  );
  // Filter out admin from users list
  const nonAdminUsers = users.filter((u) => u._id !== adminId);
  const employeess = [
    ...new Map(
      tasks
        .filter((t) => t.assignedTo)
        .map((t) => [t.assignedTo._id, t.assignedTo]),
    ).values(),
  ];

  // ------------------------------
  // DELETE USER
  // ------------------------------
  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/users/${deleteModal.user._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setUsers((prev) => prev.filter((u) => u._id !== deleteModal.user._id));
      toast.success(`User "${deleteModal.user.name}" deleted successfully`);
      setDeleteModal({ show: false, user: null });
    } catch (error) {
      console.error("❌ Delete user error:", error);
      toast.error("Failed to delete user");
    }
  };

  const openDeleteModal = (user) => {
    setDeleteModal({ show: true, user });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, user: null });
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();

    if (!newTask.title || !newTask.assignedTo || !newTask.deadline)
      return toast.error("Please fill all required fields");

    try {
      setAssignLoading(true); // START LOADING

      const taskData = { ...newTask, assignedBy: adminId };

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tasks`,
        taskData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => [...prev, data.task]);
      toast.success("Task assigned successfully");

      setNewTask({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
        deadline: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign task");
    } finally {
      setAssignLoading(false); // STOP LOADING
    }
  };

  const DeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      toast.success("Task deleted");
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete task");
    }
  };

  const toggleNotes = (id) => {
    setExpandedTask(expandedTask === id ? null : id);
  };

  // Helper to show assigned employee name
  const getEmployeeName = (assignedTo) => {
    if (!assignedTo) return "Unknown";

    // If Task API returned full object → assignedTo.name exists
    if (assignedTo.name) return assignedTo.name;

    // If API returned only employeeId → find user
    const emp = users.find((u) => u._id === assignedTo);
    return emp ? emp.name : "Unknown";
  };

  const updateRole = async (userId, role) => {
    try {
      const { data } = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/users/update-role/${userId}`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));

      toast.success("Role updated");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const updateDesignation = async (userId, designation) => {
    try {
      const { data } = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/users/update-designation/${userId}`,
        { designation },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));

      toast.success("Designation updated");
    } catch (error) {
      toast.error("Failed to update designation");
    }
  };

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Admin Panel</h2>
          <p className="text-gray-500 mb-6">
            Manage all users, tasks & assignments.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* USERS LIST */}
            <div className="bg-white rounded-2xl shadow-sm  border border-gray-300 p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Users
              </h3>

              {nonAdminUsers.length > 0 ? (
                <ul className="space-y-4">
                  {nonAdminUsers.map((u) => (
                    <li
                      key={u._id}
                      className="flex justify-between items-start p-3 rounded-xl  border border-gray-300 hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {/* ROLE */}
                          <label className="text-xs text-gray-600 mb-1">
                            Role:
                          </label>
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u._id, e.target.value)}
                            className="text-xs  border border-gray-300 rounded-lg px-2 py-1 bg-gray-50 focus:ring-1 focus:ring-blue-500"
                          >
                            <option>Employee</option>
                            <option>Manager</option>
                            <option>Admin</option>
                          </select>

                          {/* DESIGNATION */}
                          <label className="text-xs text-gray-600 mb-1">
                            Designation :
                          </label>
                          <select
                            value={u.designation || "Employee"}
                            onChange={(e) =>
                              updateDesignation(u._id, e.target.value)
                            }
                            className="text-xs  border border-gray-300 rounded-lg px-2 py-1 bg-gray-50 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="graphic">Graphic Designer</option>
                            <option value="video">Video Editor</option>
                            <option value="Social">
                              Social Media Executive
                            </option>
                            <option value="web">Web Developer</option>
                            <option value="Photographer">Photographer</option>
                            <option value="digital">Digital Marketing</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => openDeleteModal(u)}
                        className="text-red-400 hover:text-red-600 transition"
                        title="Delete User"
                      >
                        <MdDelete size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">No users found.</p>
              )}
            </div>

            {/* ASSIGN TASK FORM */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Assign Task</h3>

              <form onSubmit={handleAssignTask} className="space-y-3">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Title"
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                />

                <textarea
                  rows={3}
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Description or Reference"
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                />
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Client
                  </label>

                  <select
                    value={newTask.client}
                    onChange={(e) =>
                      setNewTask({ ...newTask, client: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  >
                    <option value="">Select Client</option>

                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <label className="block text-sm font-medium mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({ ...newTask, deadline: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                />

                <select
                  value={newTask.assignedTo}
                  onChange={(e) =>
                    setNewTask({ ...newTask, assignedTo: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                >
                  <option value="">Assign to employee</option>

                  {employeess.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>

                <button
                  disabled={assignLoading}
                  className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {assignLoading ? "Assigning..." : "Assign Task"}
                </button>
              </form>
            </div>

            {/* TASKS LIST */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Tasks</h3>

              {tasks.length > 0 ? (
                <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <li
                      key={task._id}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                    >
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-sm text-gray-600">
                        {task.priority} • {task.status}
                      </p>

                      <p className="text-xs text-gray-500">
                        Assigned To: <b>{getEmployeeName(task.assignedTo)}</b>
                      </p>
                      <p className="text-xs text-gray-500">
                        Created At:{" "}
                        <b>
                          {new Date(task.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </b>
                      </p>

                      {task.deadline && (
                        <p className="text-xs text-red-500">
                          Deadline:{" "}
                          {new Date(task.deadline).toLocaleDateString("en-IN")}
                        </p>
                      )}

                      {/* Buttons */}
                      <div className="mt-2 flex justify-between">
                        <button
                          onClick={() => toggleNotes(task._id)}
                          className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 transition"
                        >
                          {expandedTask === task._id
                            ? "Hide Notes"
                            : "View Notes"}
                        </button>

                        <button
                          onClick={() => DeleteTask(task._id)}
                          className="text-xs bg-red-200 text-red-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-red-300 transition"
                        >
                          <MdDelete /> Delete
                        </button>
                      </div>

                      {/* Notes Section */}
                      {expandedTask === task._id && (
                        <div className="mt-3 p-3 border bg-white rounded">
                          {task.notes?.length > 0 ? (
                            <ul className="space-y-1 max-h-28 overflow-y-auto">
                              {task.notes.map((note, i) => (
                                <li key={i} className="text-sm border-b pb-1">
                                  {note.message}
                                  <p className="text-xs text-gray-400">
                                    {new Date(note.date).toLocaleString(
                                      "en-IN",
                                    )}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-400">
                              No notes available.
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No tasks found.</p>
              )}
            </div>
          </div>

          {/* DELETE USER MODAL */}
          {deleteModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-fadeIn">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                    <MdDelete className="text-red-600" size={24} />
                  </div>

                  <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">
                    Delete User Account
                  </h3>

                  <p className="text-center text-gray-600 mb-6">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-gray-900">
                      {deleteModal.user?.name}
                    </span>
                    ? This action cannot be undone and will permanently remove
                    all their data.
                  </p>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> All tasks assigned to this user
                      will also be affected.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.2s ease-out;
            }
          `}</style>
        </div>

        {/* second row */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <Calendar
            tasks={tasks}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
          />

          {/* Selected Date Tasks */}
          {selectedDate && (
            <div className="mt-6 max-h-[450px] overflow-y-auto bg-[#fff] rounded-2xl p-2">
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
                          className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2 "
                        >
                          <p className="font-medium text-sm">
                            Assigned to :{" "}
                            {task.assignedTo?.name || "Unassigned"}
                          </p>
                          <p className="font-medium text-sm">
                            Title : {task.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            Description : {task.description}
                          </p>
                          <p className="text-xs text-gray-600">
                            Start Time :
                            {task.startTime
                              ? new Date(task.startTime).toLocaleString(
                                  "en-US",
                                  {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  },
                                )
                              : "Not Started"}
                          </p>
                          <p className="text-xs text-gray-600">
                            End Time :{" "}
                            {task.endTime
                              ? new Date(task.endTime).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "Not Ended"}
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
                          <p className="font-medium text-sm">
                            Assigned to :{" "}
                            {task.assignedTo?.name || "Unassigned"}
                          </p>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-gray-600">
                            {task.description}
                          </p>
                          <p className="text-xs text-gray-600">
                            Start Time :{" "}
                            {new Date(task.startTime).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                          <p className="text-xs text-gray-600">
                            End Time :{" "}
                            {new Date(task.endTime).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
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

        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="grid md:grid-cols-3 gap-6 mt-10 ">
            <div className="gap-6">
              <div className="md:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-5 max-h-[450px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Clients
                  </h3>
                </div>

                {/* Body */}
                <div className="mt-2">
                  <ClientPanel />
                </div>
              </div>
            </div>

            <div className="gap-6 ">
              <div className="md:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-5 max-h-[450px] overflow-hidden">
                {/* Header + Filter */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Live Tasks
                  </h3>

                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    {employeess.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                {liveTasks.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No live tasks for selected employee
                  </p>
                ) : (
                  <ul className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {liveTasks.map((task) => (
                      <li
                        key={task._id}
                        className="border bg-gray-200 border-gray-100 rounded-xl p-4 hover:shadow transition"
                      >
                        <p className="text-[16px] text-white mt-1 bg-[#010110] rounded-[9px] w-fit px-2 py-1 inline-block">
                          {task.assignedTo?.name || "Unassigned"}
                        </p>
                        <p className=" text-[20px] font-bold text-gray-800">
                          {task.title}
                        </p>

                        {task.startTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            Started:{" "}
                            {new Date(task.startTime).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
