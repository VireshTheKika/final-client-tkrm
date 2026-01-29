import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
export default function ClientPanel() {
  const [clients, setClients] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "https://final-api-tkrm.onrender.com/api/clients";

  //  Fetch Clients
  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API}/get-clients`);
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  //  Add Client
  const addClient = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await axios.post(`${API}/add-client`, { name });
      setName("");
      fetchClients();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  //  Delete Client
  const deleteClient = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client?",
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/delete-client/${id}`);
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="gap-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 max-h-[450px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Add Client</h3>
        </div>

        {/* Add Form */}
        <form onSubmit={addClient} className="flex gap-2 mb-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Client name"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 rounded-lg text-sm hover:opacity-80"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </form>

        {/* Client List */}
        {clients.length === 0 ? (
          <p className="text-sm text-gray-500">No clients found</p>
        ) : (
          <ul className="space-y-3 max-h-[330px] overflow-y-auto pr-1">
            {clients.map((client) => (
              <li
                key={client._id}
                className="border bg-gray-100 border-gray-200 rounded-xl p-3 flex items-center justify-between hover:shadow transition"
              >
                <p className="font-medium text-gray-800">{client.name}</p>

                <button
                  onClick={() => deleteClient(client._id)}
                  className="text-xs bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
