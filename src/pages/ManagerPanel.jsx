import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify"; // make sure this import is at the top

export default function ManagerPanel() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expandedTask, setExpandedTask] = useState(null); // for viewing notes
  const [assignLoading, setAssignLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    deadline: "",
  });

  const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
  const token = userInfo?.token;
  const managerId = userInfo?._id;

  useEffect(() => {
    if (!token) {
      console.error("⚠️ No token found — please login again");
      return;
    }

    const fetchData = async () => {
      try {
        const [tasksRes, employeesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setTasks(tasksRes.data);
        setEmployees(employeesRes.data);
      } catch (error) {
        console.error(
          " Error fetching manager data:",
          error.response?.data || error.message
        );
      }
    };

    fetchData();
  }, [token]);

  const handleAssignTask = async (e) => {
    e.preventDefault();

    if (!newTask.title || !newTask.assignedTo || !newTask.deadline)
      return toast.error(" Please fill all required fields including deadline");

    try {
      setAssignLoading(true); // start loading

      const taskData = { ...newTask, assignedBy: managerId };

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tasks`,
        taskData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks((prev) => [...prev, data.task]);

      setNewTask({
        title: "",
        description: "",
        priority: "Medium",
        assignedTo: "",
        deadline: "",
      });

      toast.success(" Task assigned successfully!");
    } catch (error) {
      console.error(
        "Error assigning task:",
        error.response?.data || error.message
      );
      toast.error(" Failed to assign task");
    } finally {
      setAssignLoading(false); // stop loading
    }
  };

  const toggleNotes = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const DeleteNote = async (taskId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this task?")) return;

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // remove deleted task from state
      setTasks((prev) => prev.filter((task) => task._id !== taskId));

      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(" Failed to delete task");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold mb-2">Manager Panel</h2>
      <p className="text-gray-500 mb-6">View and assign tasks to employees.</p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Employees */}
        <div className="bg-white shadow rounded-lg p-4 md:col-span-1">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Employees
          </h3>
          {employees.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <li key={emp._id} className="py-2">
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-sm text-gray-500">{emp.email}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No employees found.</p>
          )}
        </div>

        {/* Assign Task Form */}
        <div className="bg-white shadow rounded-lg p-4 md:col-span-1">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Assign New Task
          </h3>
          <form onSubmit={handleAssignTask} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-blue-100"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                rows="3"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-blue-100"
                placeholder="Task details"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Deadline *
              </label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) =>
                  setNewTask({ ...newTask, deadline: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Assign To *
              </label>
              <select
                value={newTask.assignedTo}
                onChange={(e) =>
                  setNewTask({ ...newTask, assignedTo: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={assignLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {assignLoading ? "Assigning..." : "Assign Task"}
            </button>
          </form>
        </div>

        {/* Tasks */}
        <div className="bg-white shadow-lg rounded-2xl p-5 md:col-span-1 border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            Tasks
          </h3>

          {tasks.length > 0 ? (
            <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <li
                  key={task._id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start gap-3">
                    {/* Left section */}
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-800">
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="capitalize">{task.priority}</span> •{" "}
                        <span
                          className={`${
                            task.status === "Completed"
                              ? "text-green-600 font-medium"
                              : "text-blue-600"
                          }`}
                        >
                          {task.status}
                        </span>
                      </p>

                      {task.deadline && (
                        <p className="text-xs text-red-500 mt-1">
                          Deadline:{" "}
                          {new Date(task.deadline).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}

                      {task.assignedTo && (
                        <p className="text-xs text-gray-600 mt-1">
                          Assigned to:{" "}
                          <span className="font-medium text-gray-800">
                            {task.assignedTo?.name
                              ? task.assignedTo.name.charAt(0).toUpperCase() +
                                task.assignedTo.name.slice(1)
                              : "Unknown"}
                          </span>
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Created at:{" "}
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

                      <p className="text-xs text-gray-500">
                        {task.updatedAt !== task.createdAt && (
                          <p className="text-xs text-gray-500">
                            Completed at:{" "}
                            <b>
                              {new Date(task.updatedAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </b>
                          </p>
                        )}
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => toggleNotes(task._id)}
                        className="text-xs bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        {expandedTask === task._id
                          ? "Hide Notes"
                          : "View Notes"}
                      </button>
                      <button
                        onClick={() => DeleteNote(task._id)}
                        className="text-xs flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <MdDelete /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {expandedTask === task._id && (
                    <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-white shadow-inner">
                      {task.notes && task.notes.length > 0 ? (
                        <ul className="space-y-2 max-h-36 overflow-y-auto">
                          {task.notes.map((note, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-700 border-b border-gray-200 pb-1"
                            >
                              <p> {note.message}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(note.date).toLocaleString("en-IN")}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400">
                          No notes available.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No tasks assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
