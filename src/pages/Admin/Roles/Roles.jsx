import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FiPlusCircle, FiSettings, FiTrash2 } from "react-icons/fi";

const Roles = () => {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const [roles, setRoles] = useState([
    { id: 1, role: "Admin", guard: "api" },
    { id: 2, role: "Manager", guard: "api" },
    { id: 3, role: "Cashier", guard: "api" },
  ]);

  const handleDelete = (id) => {
    setRoles((prev) => prev.filter((item) => item.id !== id));
  };

  const theme = {
    wrap: isDark
      ? "border-zinc-800 bg-zinc-900"
      : "border-zinc-300 bg-white",
    head: isDark ? "bg-red-600 text-white" : "bg-red-600 text-white",
    row: isDark
      ? "border-zinc-800 text-zinc-200"
      : "border-zinc-200 text-zinc-700",
    empty: isDark ? "text-zinc-400" : "text-zinc-500",
  };

  return (
    <section className="space-y-5">
      <div className="flex justify-end">
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-500 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600">
          <FiPlusCircle className="text-base" />
          Add
        </button>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.wrap}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className={theme.head}>
              <tr>
                <th className="w-24 px-6 py-4 text-left text-sm font-medium">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium">
                  Guard
                </th>
                <th className="w-[220px] px-6 py-4 text-center text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {roles.length > 0 ? (
                roles.map((item) => (
                  <tr key={item.id} className={`border-t ${theme.row}`}>
                    <td className="px-6 py-5 text-sm">{item.id}</td>
                    <td className="px-6 py-5 text-sm">{item.role}</td>
                    <td className="px-6 py-5 text-sm">{item.guard}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-4">
                        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
                          <FiSettings size={15} />
                          Permissions
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className={`border-t ${theme.row}`}>
                  <td
                    colSpan="4"
                    className={`px-6 py-8 text-center text-sm ${theme.empty}`}
                  >
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Roles;