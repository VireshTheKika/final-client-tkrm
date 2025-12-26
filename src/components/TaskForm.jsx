import { useState, useEffect } from "react";
import axios from "axios";
import { createTask } from "../api/taskApi";

export default function TaskForm({ onTaskAdded }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Low",
    assignedTo: "",
  });
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users/all") // you’ll add this route soon
      .then((res) => setEmployees(res.data))
      .catch((err) => console.log(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await createTask(formData);
      setMessage("✅ Task assigned successfully!");
      onTaskAdded();
      setFormData({
        title: "",
        description: "",
        priority: "Low",
        assignedTo: "",
      });
      setTimeout(() => setMessage(""), 2500);
    } catch (error) {
      setError(error.response?.data?.message || "❌ Error assigning task");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded-2xl shadow-md space-y-3 w-full max-w-md"
    >
      <h2 className="text-xl font-semibold mb-2">Assign a New Task</h2>

      {/* Success or error messages */}
      {message && (
        <div className="text-green-600 bg-green-100 p-2 rounded text-sm text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="text-red-600 bg-red-100 p-2 rounded text-sm text-center">
          {error}
        </div>
      )}

      {/* Task Title */}
      <input
        type="text"
        placeholder="Task Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      {/* Description */}
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px]"
      />

      {/* Priority Select */}
      <select
        value={formData.priority}
        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      {/* Employee Select */}
      <select
        value={formData.assignedTo}
        onChange={(e) =>
          setFormData({ ...formData, assignedTo: e.target.value })
        }
        required
        className="w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">Select Employee</option>
        {employees.map((emp) => (
          <option key={emp._id} value={emp._id}>
            {emp.name} ({emp.role})
          </option>
        ))}
      </select>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium transition-colors"
      >
        Assign Task
      </button>
    </form>
  );
}
