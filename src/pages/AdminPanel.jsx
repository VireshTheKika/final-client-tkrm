import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null });
  const [assignLoading, setAssignLoading] = useState(false);

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

  // Filter out admin from users list
  const nonAdminUsers = users.filter((u) => u._id !== adminId);
  const employeeUsers = users.filter(
    (u) => u.role === "Employee" && u._id !== adminId
  );

  // ------------------------------
  // DELETE USER
  // ------------------------------
  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/users/${deleteModal.user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  // ------------------------------
  // CREATE NEW TASK
  // ------------------------------
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
        { headers: { Authorization: `Bearer ${token}` } }
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

  // ------------------------------
  // DELETE TASK
  // ------------------------------
  const DeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold mb-2">Admin Panel</h2>
      <p className="text-gray-500 mb-6">
        Manage all users, tasks & assignments.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* USERS LIST */}
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Users</h3>

          {nonAdminUsers.length > 0 ? (
            <ul className="divide-y">
              {nonAdminUsers.map((u) => (
                <li
                  key={u._id}
                  className="py-3 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <p className="text-xs text-gray-400">Role: {u.role}</p>
                  </div>
                  <button
                    onClick={() => openDeleteModal(u)}
                    className="text-red-500 hover:text-red-700 transition ml-2"
                    title="Delete User"
                  >
                    <MdDelete size={20} />
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
              className="border p-2 w-full rounded"
            />

            <textarea
              rows={3}
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              placeholder="Description"
              className="border p-2 w-full rounded"
            />

            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
              className="border p-2 w-full rounded"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <input
              type="date"
              value={newTask.deadline}
              onChange={(e) =>
                setNewTask({ ...newTask, deadline: e.target.value })
              }
              className="border p-2 w-full rounded"
            />

            <select
              value={newTask.assignedTo}
              onChange={(e) =>
                setNewTask({ ...newTask, assignedTo: e.target.value })
              }
              className="border p-2 w-full rounded"
            >
              <option value="">Assign to employee</option>
              {employeeUsers.map((emp) => (
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
                      {expandedTask === task._id ? "Hide Notes" : "View Notes"}
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
                                {new Date(note.date).toLocaleString("en-IN")}
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
                ? This action cannot be undone and will permanently remove all
                their data.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> All tasks assigned to this user will
                  also be affected.
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
  );
}
