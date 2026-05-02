import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiBox,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";

import { loginApi } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";

const schema = z.object({
  login: z.string().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const getNames = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.name;
      return null;
    })
    .filter(Boolean);
};

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const roles = useAuthStore((state) => state.roles);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const redirectByRole = (roleList = []) => {
    if (roleList.includes("admin")) {
      navigate("/home", { replace: true });
      return;
    }

    if (roleList.includes("cashier")) {
      navigate("/pos", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (token) {
      redirectByRole(roles);
    }
  }, [token, roles]);

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (response) => {
      const payload = response?.data ?? response;
      const user = payload?.user ?? null;

      const userRoles = getNames(user?.roles ?? payload?.roles ?? []);
      const userPermissions = getNames(
        user?.permissions ?? payload?.permissions ?? []
      );

      setAuth({
        token: payload?.token,
        tokenType: payload?.token_type || "Bearer",
        user,
        roles: userRoles,
        permissions: userPermissions,
      });

      redirectByRole(userRoles);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.errors?.login?.[0] ||
        error?.response?.data?.message ||
        "Login failed";

      setError("root", {
        type: "server",
        message,
      });
    },
  });

  const onSubmit = (values) => {
    mutation.mutate(values);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-100">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-red-200/40 blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-80px] h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/60 bg-white/80 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          {/* Left Panel */}
          <div className="hidden bg-gradient-to-br from-red-500 via-rose-500 to-red-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-500">
                  <FiBox className="text-xl" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/80">
                    HAKLEY MART
                  </p>
                  <h2 className="text-lg font-semibold">
                    Inventory Management System
                  </h2>
                </div>
              </div>

              <div className="mt-12 max-w-md">
                <h1 className="text-4xl font-bold leading-tight">
                  Inventory and sales management made simple
                </h1>
                <p className="mt-5 text-base leading-7 text-white/85">
                  Manage stock, suppliers, customers, and daily sales in one
                  secure system.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <FiShield className="text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold">Secure access</h3>
                  <p className="mt-1 text-sm text-white/80">
                    Role-based access for authorized staff.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <FiTrendingUp className="text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold">Daily operations control</h3>
                  <p className="mt-1 text-sm text-white/80">
                    Monitor inventory, sales, and store activity efficiently.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500 text-white shadow-lg lg:mx-0">
                  <FiShield className="text-2xl" />
                </div>

                <h2 className="text-3xl font-bold text-zinc-900">Sign in</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Enter your credentials to access Hakley Mart system.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">
                    Username or Email
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-red-500">
                      <FiUser />
                    </span>
                    <input
                      type="text"
                      {...register("login")}
                      placeholder="Enter username or email"
                      className={`w-full rounded-2xl border bg-white py-3.5 pl-11 pr-4 text-sm text-zinc-900 outline-none transition ${
                        errors.login
                          ? "border-red-400 focus:border-red-500"
                          : "border-zinc-300 focus:border-red-500"
                      }`}
                    />
                  </div>
                  {errors.login && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.login.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">
                    Password
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-red-500">
                      <FiLock />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="Enter password"
                      className={`w-full rounded-2xl border bg-white py-3.5 pl-11 pr-12 text-sm text-zinc-900 outline-none transition ${
                        errors.password
                          ? "border-red-400 focus:border-red-500"
                          : "border-zinc-300 focus:border-red-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-red-500"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {errors.root && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <FiAlertCircle className="mt-0.5 shrink-0" />
                    <span>{errors.root.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-red-500 px-4 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isPending ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs leading-6 text-zinc-500">
                Authorized users only. Access is granted based on your assigned
                role.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;