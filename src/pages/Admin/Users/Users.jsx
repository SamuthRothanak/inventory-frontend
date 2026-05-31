import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getUsersApi,
  createUserApi,
  updateUserApi,
  updateUserStatusApi,
} from "../../../services/user.service";

import UserStats from "./components/UserStats";
import UserToolbar from "./components/UserToolbar";
import UserTable from "./components/UserTable";
import UserFormModal from "./components/UserFormModal";

import { userSchema, defaultValues } from "./schemas/userSchema";
import { extractUsers, getRoleName, getStatusLabel } from "./utils/userUtils";

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

function getMeta(response) {
  const data = response?.data;
  return data?.meta || response?.meta || null;
}

async function getAllUsersForStats() {
  const firstResponse = await getUsersApi({
    page: 1,
    per_page: 9999,
  });

  const firstUsers = extractUsers(firstResponse);
  const meta = getMeta(firstResponse);

  const lastPage = Number(meta?.last_page || meta?.lastPage || 1);
  const apiPerPage = Number(meta?.per_page || meta?.perPage || 100);

  if (lastPage <= 1) {
    return firstUsers;
  }

  const pageRequests = [];

  for (let nextPage = 2; nextPage <= lastPage; nextPage += 1) {
    pageRequests.push(
      getUsersApi({
        page: nextPage,
        per_page: apiPerPage,
      })
    );
  }

  const otherResponses = await Promise.all(pageRequests);

  const otherUsers = otherResponses.flatMap((response) =>
    extractUsers(response)
  );

  return [...firstUsers, ...otherUsers];
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

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  useLockBodyScroll(showModal);

  const {
    register,
    handleSubmit,
    reset,
    watch,
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
      [item.name, item.username, item.email, item.phone, item.role]
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
        message: messages?.[0] || "Invalid value",
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
    onError: (err) => handleServerError(err, "Create user failed."),
  });

  const updateMutation = useMutation({
    mutationFn: updateUserApi,
    onSuccess: () => {
      invalidateUsers();
      closeModal();
    },
    onError: (err) => handleServerError(err, "Update user failed."),
  });

  const statusMutation = useMutation({
    mutationFn: updateUserStatusApi,
    onSuccess: () => {
      invalidateUsers();
    },
    onError: (err) => {
      alert(err?.response?.data?.message || "Update status failed.");
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
        },
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

  const handleInactive = (user) => {
    const nextStatus = user.status === "Active" ? "inactive" : "active";

    const confirmText =
      nextStatus === "inactive"
        ? `Do you want to set ${user.name} as inactive?`
        : `Do you want to activate ${user.name}?`;

    if (!window.confirm(confirmText)) return;

    statusMutation.mutate({
      id: user.id,
      status: nextStatus,
    });
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
            "Failed to load user summary."}
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
        openEditModal={openEditModal}
        handleInactive={handleInactive}
        statusMutation={statusMutation}
        theme={theme}
      />

      {showModal && (
        <UserFormModal
          isEdit={isEdit}
          register={register}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          errors={errors}
          serverMessage={serverMessage}
          closeModal={closeModal}
          createMutation={createMutation}
          updateMutation={updateMutation}
          theme={theme}
        />
      )}
    </section>
  );
}