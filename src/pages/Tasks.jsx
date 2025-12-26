import { useState } from "react";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";

export default function Tasks() {
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin / Manager Task Panel</h1>
      <TaskForm onTaskAdded={() => setRefresh(!refresh)} />
      <TaskList refresh={refresh} />
    </div>
  );
}
