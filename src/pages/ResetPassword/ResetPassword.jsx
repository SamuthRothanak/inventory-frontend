import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";

import { resetPasswordApi } from "../../services/auth.service";
import { getShopInitials, getStoredShopInfo } from "../../utils/shopInfo";

const schema = z
  .object({
    password: z.string().min(6, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ"),
    password_confirmation: z.string().min(6, "សូមបញ្ជាក់ពាក្យសម្ងាត់"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ",
    path: ["password_confirmation"],
  });

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [shopInfo] = useState(() => getStoredShopInfo());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  const mutation = useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: () => {
      setDone(true);
      window.setTimeout(() => navigate("/login", { replace: true }), 2000);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.errors?.token?.[0] ||
        error?.response?.data?.message ||
        "មិនអាចកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ សូមព្យាយាមម្ដងទៀត";

      setError("root", {
        type: "server",
        message,
      });
    },
  });

  const onSubmit = (values) => {
    mutation.mutate({ token, email, ...values });
  };

  const invalidLink = !token || !email;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-[Hanuman,sans-serif]">
      {/* Background atmosphere */}
      <div className="absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-rose-300/30 blur-[120px]" />
        <div className="absolute bottom-[-140px] right-[-120px] h-[28rem] w-[28rem] rounded-full bg-red-300/30 blur-[130px]" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-200/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a07_1px,transparent_1px),linear-gradient(to_bottom,#0f172a07_1px,transparent_1px)] bg-[size:38px_38px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-3">
        <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_-22px_rgba(190,18,60,0.25)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="login-icon-3d flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
              <span className="text-sm font-extrabold">{getShopInitials(shopInfo.name)}</span>
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">
                {shopInfo.name}
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {shopInfo.khmerName || "ប្រព័ន្ធគ្រប់គ្រងស្តុក និងលក់"}
              </p>
            </div>
          </div>

          {invalidLink ? (
            <div>
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <FiAlertCircle className="mt-0.5 shrink-0" />
                <span>តំណនេះមិនត្រឹមត្រូវ ឬបាត់ព័ត៌មានចាំបាច់។ សូមស្នើសុំតំណថ្មីម្ដងទៀត។</span>
              </div>
              <Link
                to="/forgot-password"
                className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600"
              >
                <FiArrowLeft />
                ស្នើសុំតំណថ្មី
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="login-icon-3d mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <FiShield className="text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">កំណត់ពាក្យសម្ងាត់ថ្មី</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  សូមបញ្ចូលពាក្យសម្ងាត់ថ្មីសម្រាប់គណនី {email}។
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ពាក្យសម្ងាត់ថ្មី
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-red-500">
                      <FiLock />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
                      className={`w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                        errors.password
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-red-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-red-500"
                      aria-label={showPassword ? "លាក់ពាក្យសម្ងាត់" : "បង្ហាញពាក្យសម្ងាត់"}
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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    បញ្ជាក់ពាក្យសម្ងាត់ថ្មី
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-red-500">
                      <FiLock />
                    </span>
                    <input
                      type={showConfirm ? "text" : "password"}
                      {...register("password_confirmation")}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្ដងទៀត"
                      className={`w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                        errors.password_confirmation
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-red-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-red-500"
                      aria-label={showConfirm ? "លាក់ពាក្យសម្ងាត់" : "បង្ហាញពាក្យសម្ងាត់"}
                    >
                      {showConfirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="mt-2 text-sm text-red-500">
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>

                {done && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <FiCheckCircle className="mt-0.5 shrink-0" />
                    <span>កំណត់ពាក្យសម្ងាត់ជោគជ័យ។ កំពុងបញ្ជូនអ្នកទៅចូលប្រើប្រាស់...</span>
                  </div>
                )}

                {errors.root && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <FiAlertCircle className="mt-0.5 shrink-0" />
                    <span>{errors.root.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending || done}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-gradient-to-r from-red-500 to-rose-600 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#be123c,0_8px_14px_rgba(225,29,72,0.22)] transition hover:-translate-y-0.5 hover:from-red-600 hover:to-rose-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_4px_0_#9f1239,0_10px_17px_rgba(225,29,72,0.26)] active:translate-y-0.5 active:scale-[0.99] active:shadow-[inset_0_2px_4px_rgba(127,29,29,0.18),0_1px_0_#9f1239,0_3px_7px_rgba(225,29,72,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      កំពុងកំណត់...
                    </>
                  ) : (
                    "កំណត់ពាក្យសម្ងាត់"
                  )}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600"
              >
                <FiArrowLeft />
                ត្រឡប់ទៅចូលប្រើប្រាស់
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
