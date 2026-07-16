import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "../../../components/ConfirmDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getUsersApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  resetUserPasswordApi,
} from "../../../services/user.service";

import UserStats from "./components/UserStats";
import UserToolbar from "./components/UserToolbar";
import UserTable from "./components/UserTable";
import UserFormModal from "./components/UserFormModal";
import UserViewModal from "./components/UserViewModal";

import { userSchema, defaultValues } from "./schemas/userSchema";
import {
  extractUsers,
  getRoleLabel,
  getRoleName,
  getStatusLabel,
} from "./utils/userUtils";

function useLockBodyScroll(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
}

async function getAllUsersForStats() {
  const response = await getUsersApi({ per_page: 9999 });
  return extractUsers(response);
}

function normalizeUser(item) {
  return {
    id: item.id,
    name: item.name ?? "",
    username: item.username ?? "",
    email: item.email ?? "",
    phone: item.phone ?? "",
    role: getRoleName(item),
    status: getStatusLabel(item),
  };
}

export default function Users() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [serverMessage, setServerMessage] = useState("");

  useLockBodyScroll(showModal || Boolean(selectedUser));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues,
  });

  const isEdit = watch("isEdit");

  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users", { per_page: 100 }],
    queryFn: () => getUsersApi({ per_page: 100 }),
  });

  const statsQuery = useQuery({
    queryKey: ["users", "all-for-stats"],
    queryFn: getAllUsersForStats,
    keepPreviousData: true,
  });

  const rawUsers = useMemo(() => {
    return extractUsers(usersResponse);
  }, [usersResponse]);

  const users = useMemo(() => {
    return rawUsers.map((item) => normalizeUser(item));
  }, [rawUsers]);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return users;

    return users.filter((item) =>
      [
        item.name,
        item.username,
        item.email,
        item.phone,
        item.role,
        getRoleLabel(item.role),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [search, users]);

  const summary = useMemo(() => {
    const allUsersRaw = Array.isArray(statsQuery.data)
      ? statsQuery.data
      : extractUsers(statsQuery.data);

    const allUsers = allUsersRaw.map((item) => normalizeUser(item));

    const total = allUsers.length;
    const active = allUsers.filter((item) => item.status === "Active").length;

    return {
      total,
      active,
      inactive: total - active,
    };
  }, [statsQuery.data]);

  const theme = {
    pageTitle: isDark ? "text-white" : "text-zinc-900",

    card: isDark
      ? "border-white/10 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modal: isDark
      ? "border-white/10 bg-[#111113] text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modalHeader: isDark
      ? "border-white/10 bg-[#111113]"
      : "border-zinc-200 bg-white",

    modalBody: isDark ? "bg-[#151518]" : "bg-zinc-50/70",

    muted: isDark ? "text-zinc-400" : "text-zinc-500",

    input: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-red-400/20",

    select: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 focus:border-red-400 focus:ring-red-400/20",

    tableWrap: isDark
      ? "border-white/10 bg-zinc-900"
      : "border-zinc-200 bg-white",

    row: isDark
      ? "border-white/10 text-zinc-200 hover:bg-white/[0.04]"
      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",

    active: isDark ? "text-emerald-400" : "text-emerald-600",

    inactive: isDark ? "text-red-400" : "text-red-500",

    badge: isDark
      ? "border-white/10 bg-white/5 text-zinc-200"
      : "border-zinc-200 bg-zinc-100 text-zinc-700",

    softCard: isDark
      ? "border-white/10 bg-white/[0.04]"
      : "border-zinc-200 bg-white",

    section: isDark
      ? "border-white/10 bg-[#18181b]"
      : "border-zinc-200 bg-white",
  };

  const closeModal = () => {
    setShowModal(false);
    setServerMessage("");
    reset(defaultValues);
  };

  const openCreateModal = () => {
    setServerMessage("");
    reset(defaultValues);
    setShowModal(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
  };

  const openEditModal = (user) => {
    setServerMessage("");

    reset({
      id: user.id,
      isEdit: true,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status?.toLowerCase() || "active",
      password: "",
      password_confirmation: "",
    });

    setShowModal(true);
  };

  const handleServerError = (err, fallbackMessage) => {
    const data = err?.response?.data;
    const fieldErrors = data?.errors || {};

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      setError(field, {
        type: "server",
        message: messages?.[0] || "តម្លៃមិនត្រឹមត្រូវ",
      });
    });

    if (!Object.keys(fieldErrors).length) {
      setServerMessage(data?.message || fallbackMessage);
    }
  };

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const createMutation = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      invalidateUsers();
      closeModal();
    },
    onError: (err) => handleServerError(err, "មិនអាចបង្កើតអ្នកប្រើប្រាស់បានទេ ។"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPasswordApi,
    onSuccess: () => {
      invalidateUsers();
      closeModal();
    },
    onError: (err) => handleServerError(err, "មិនអាចកំណត់លេខសម្ងាត់ឡើងវិញបានទេ ។"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUserApi({ id, payload }),
    onSuccess: (_, variables) => {
      if (variables.newPassword) {
        resetPasswordMutation.mutate({ id: variables.id, password: variables.newPassword });
      } else {
        invalidateUsers();
        closeModal();
      }
    },
    onError: (err) => handleServerError(err, "មិនអាចកែអ្នកប្រើប្រាស់បានទេ ។"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      invalidateUsers();
    },
    onError: (err) => {
      alert(err?.response?.data?.message || "មិនអាចលុបអ្នកប្រើប្រាស់បានទេ ។");
    },
  });

  const onSubmit = (values) => {
    setServerMessage("");

    if (values.isEdit) {
      updateMutation.mutate({
        id: values.id,
        payload: {
          name: values.name,
          username: values.username,
          email: values.email,
          phone: values.phone || "",
          role: values.role,
          status: values.status,
        },
        newPassword: values.password || null,
      });

      return;
    }

    createMutation.mutate({
      name: values.name,
      username: values.username,
      email: values.email,
      phone: values.phone || "",
      password: values.password,
      password_confirmation: values.password_confirmation,
      role: values.role,
    });
  };

  const handleDelete = async (user) => {
    const ok = await confirm(`តើអ្នកប្រាកដថាចង់លុបអ្នកប្រើប្រាស់ "${user.name}" មែនទេ?`, { confirmLabel: "លុប" });
    if (!ok) return;
    deleteMutation.mutate(user.id);
  };

  return (
    <section className="space-y-6">
      <UserStats
        totalUsers={summary.total}
        activeUsers={summary.active}
        inactiveUsers={summary.inactive}
        theme={theme}
      />

      {statsQuery.isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {statsQuery.error?.response?.data?.message ||
            "មិនអាចផ្ទុកព័ត៌មានសង្ខេបអ្នកប្រើប្រាស់បានទេ ។"}
        </div>
      )}

      <UserToolbar
        search={search}
        setSearch={setSearch}
        openCreateModal={openCreateModal}
        theme={theme}
      />

      <UserTable
        filteredUsers={filteredUsers}
        isLoading={isLoading}
        isError={isError}
        error={error}
        openViewModal={openViewModal}
        openEditModal={openEditModal}
        onDelete={handleDelete}
        isDeletingId={deleteMutation.isPending ? deleteMutation.variables : null}
        theme={theme}
      />

      {selectedUser && (
        <UserViewModal
          user={selectedUser}
          theme={theme}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {showModal && (
        <UserFormModal
          isEdit={isEdit}
          register={register}
          watch={watch}
          setValue={setValue}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          errors={errors}
          serverMessage={serverMessage}
          closeModal={closeModal}
          createMutation={createMutation}
          updateMutation={updateMutation}
          resetPasswordMutation={resetPasswordMutation}
          theme={theme}
        />
      )}
    </section>
  );
}
