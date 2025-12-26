import { useEffect, useState } from "react";
import { getTasks, deleteTask } from "../api/taskApi";

export default function TaskList({ refresh }) {
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");

  const loadTasks = async () => {
    const { data } = await getTasks();
    setTasks(data);
  };

  useEffect(() => {
    loadTasks();
  }, [refresh]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(id);
    setMessage("✅ Task deleted successfully!");
    loadTasks();

    // Clear the message after 2 seconds
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <div className="mt-6">
      {/* Temporary success message */}
      {message && (
        <div className="mb-4 rounded-md bg-green-100 text-green-700 p-2 text-sm text-center">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="bg-white p-4 rounded-xl shadow-md border border-gray-100"
          >
            <h3 className="font-semibold text-lg">{task.title}</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
            <p className="text-sm mt-1">
              <strong>Priority:</strong> {task.priority}
            </p>
            <p className="text-sm">
              <strong>Assigned To:</strong> {task.assignedTo?.name}
            </p>
            <p className="text-sm">
              <strong>Status:</strong> {task.status}
            </p>

            <button
              onClick={() => handleDelete(task._id)}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Delete
            </button>
          </div>
        ))}

        {/* Show fallback message if no tasks */}
        {tasks.length === 0 && (
          <p className="text-center text-gray-500 col-span-2">
            No tasks available.
          </p>
        )}
      </div>
    </div>
  );
}
