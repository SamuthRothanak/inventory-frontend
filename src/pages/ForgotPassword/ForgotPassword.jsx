import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiPackage,
  FiArrowLeft,
} from "react-icons/fi";

import { forgotPasswordApi, verifyResetCodeApi, resetPasswordApi } from "../../services/auth.service";
import { getShopInitials, getStoredShopInfo } from "../../utils/shopInfo";

const emailSchema = z.object({
  email: z.string().min(1, "សូមបញ្ចូលអ៊ីមែល").email("អ៊ីមែលមិនត្រឹមត្រូវ"),
});

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "កូដត្រូវមាន 6 ខ្ទង់"),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ"),
    password_confirmation: z.string().min(6, "សូមបញ្ជាក់ពាក្យសម្ងាត់"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ",
    path: ["password_confirmation"],
  });

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [shopInfo] = useState(() => getStoredShopInfo());
  const [step, setStep] = useState("email"); // "email" | "code" | "password"
  const [targetEmail, setTargetEmail] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  const sendCodeMutation = useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (_, email) => {
      setTargetEmail(email);
      setStep("code");
      codeForm.reset();
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        "មិនអាចផ្ញើសំណើបានទេ សូមព្យាយាមម្ដងទៀត";

      emailForm.setError("root", { type: "server", message });
    },
  });

  const resendMutation = useMutation({
    mutationFn: forgotPasswordApi,
  });

  const verifyCodeMutation = useMutation({
    mutationFn: verifyResetCodeApi,
    onSuccess: (_, { code }) => {
      setVerifiedCode(code);
      setStep("password");
      passwordForm.reset();
    },
    onError: (error) => {
      const message =
        error?.response?.data?.errors?.code?.[0] ||
        error?.response?.data?.message ||
        "កូដនេះមិនត្រឹមត្រូវ ឬបានផុតកំណត់ហើយ";

      codeForm.setError("root", { type: "server", message });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: () => {
      setDone(true);
      window.setTimeout(() => navigate("/login", { replace: true }), 2000);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.errors?.code?.[0] ||
        error?.response?.data?.message ||
        "មិនអាចកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ សូមព្យាយាមម្ដងទៀត";

      passwordForm.setError("root", { type: "server", message });
    },
  });

  const onSubmitEmail = (values) => {
    sendCodeMutation.mutate(values.email);
  };

  const onSubmitCode = (values) => {
    verifyCodeMutation.mutate({ email: targetEmail, code: values.code });
  };

  const onSubmitPassword = (values) => {
    resetMutation.mutate({ email: targetEmail, code: verifiedCode, ...values });
  };

  const handleResend = () => {
    resendMutation.mutate(targetEmail);
  };

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
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-[0_24px_60px_-22px_rgba(190,18,60,0.25)] backdrop-blur-xl lg:grid-cols-[1.02fr_1fr]">
          {/* Left Brand Panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-rose-600 via-red-600 to-red-700 p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/15" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute right-10 bottom-32 h-3 w-3 rounded-full bg-white/40" />

            <div className="relative">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-3.5 py-3 ring-1 ring-white/20 backdrop-blur">
                <div className="login-icon-3d flex h-11 w-11 items-center justify-center rounded-xl bg-white text-red-600">
                  <span className="text-sm font-extrabold">{getShopInitials(shopInfo.name)}</span>
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                    {shopInfo.name}
                  </p>
                  <h2 className="text-base font-semibold leading-6">
                    {shopInfo.khmerName || "ប្រព័ន្ធគ្រប់គ្រងស្តុក និងលក់"}
                  </h2>
                </div>
              </div>

              <div className="mt-10 max-w-md">
                <h1 className="text-[2.15rem] font-bold leading-[1.25]">
                  ភ្លេចពាក្យសម្ងាត់?
                  <span className="block text-white/95">មិនអីទេ យើងជួយអ្នក</span>
                </h1>
                <p className="mt-4 text-sm leading-7 text-white/85">
                  បញ្ចូលអ៊ីមែលដែលបានចុះឈ្មោះ ហើយយើងនឹងផ្ញើកូដកំណត់ពាក្យសម្ងាត់ឡើងវិញទៅឱ្យអ្នក។
                </p>
              </div>
            </div>

            <div className="relative mt-7 grid gap-2.5">
              <Feature
                icon={<FiShield className="text-lg" />}
                title="សុវត្ថិភាពខ្ពស់"
                desc="កូដកំណត់ពាក្យសម្ងាត់ផុតកំណត់ក្នុងរយៈពេល ១០ នាទី។"
              />
              <Feature
                icon={<FiTrendingUp className="text-lg" />}
                title="គ្រប់គ្រងប្រតិបត្តិការប្រចាំថ្ងៃ"
                desc="តាមដានស្តុក ការលក់ និងសកម្មភាពហាងយ៉ាងមានប្រសិទ្ធភាព។"
              />
              <Feature
                icon={<FiPackage className="text-lg" />}
                title="គ្រប់គ្រងទំនិញច្បាស់លាស់"
                desc="ដឹងពីបរិមាណស្តុក និងចលនាទំនិញគ្រប់ពេលវេលា។"
              />
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="flex items-center justify-center p-5 sm:p-7 lg:p-9">
            <div className="w-full max-w-sm">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <div className="login-icon-3d flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white">
                  <span className="text-base font-extrabold">{getShopInitials(shopInfo.name)}</span>
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

              {step === "email" && (
                <>
                  <div className="mb-6">
                    <div className="login-icon-3d mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                      <FiMail className="text-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">ភ្លេចពាក្យសម្ងាត់</h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      បញ្ចូលអ៊ីមែលរបស់អ្នក ដើម្បីទទួលកូដកំណត់ពាក្យសម្ងាត់ឡើងវិញ។
                    </p>
                  </div>

                  <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        អ៊ីមែល
                      </label>
                      <div className="group relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-red-500">
                          <FiMail />
                        </span>
                        <input
                          type="email"
                          {...emailForm.register("email")}
                          placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក"
                          className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                            emailForm.formState.errors.email
                              ? "border-red-400 focus:border-red-500"
                              : "border-slate-200 focus:border-red-500"
                          }`}
                        />
                      </div>
                      {emailForm.formState.errors.email && (
                        <p className="mt-2 text-sm text-red-500">
                          {emailForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {emailForm.formState.errors.root && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        <FiAlertCircle className="mt-0.5 shrink-0" />
                        <span>{emailForm.formState.errors.root.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={sendCodeMutation.isPending}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-gradient-to-r from-red-500 to-rose-600 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#be123c,0_8px_14px_rgba(225,29,72,0.22)] transition hover:-translate-y-0.5 hover:from-red-600 hover:to-rose-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_4px_0_#9f1239,0_10px_17px_rgba(225,29,72,0.26)] active:translate-y-0.5 active:scale-[0.99] active:shadow-[inset_0_2px_4px_rgba(127,29,29,0.18),0_1px_0_#9f1239,0_3px_7px_rgba(225,29,72,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {sendCodeMutation.isPending ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          កំពុងផ្ញើ...
                        </>
                      ) : (
                        "ផ្ញើកូដកំណត់ពាក្យសម្ងាត់"
                      )}
                    </button>
                  </form>
                </>
              )}

              {step === "code" && (
                <>
                  <div className="mb-6">
                    <div className="login-icon-3d mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                      <FiShield className="text-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">បញ្ចូលកូដ</h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      យើងបានផ្ញើកូដ 6 ខ្ទង់ទៅ <span className="font-semibold text-slate-700">{targetEmail}</span> សូមបញ្ចូលកូដនោះ ខាងក្រោម។
                    </p>
                  </div>

                  <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        កូដ 6 ខ្ទង់
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        {...codeForm.register("code")}
                        onChange={(e) => {
                          codeForm.setValue("code", e.target.value.replace(/[^0-9]/g, "").slice(0, 6), {
                            shouldValidate: true,
                          });
                        }}
                        placeholder="123456"
                        className={`w-full rounded-xl border bg-white py-3 px-4 text-center text-lg font-bold tracking-[0.5em] text-slate-900 outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                          codeForm.formState.errors.code
                            ? "border-red-400 focus:border-red-500"
                            : "border-slate-200 focus:border-red-500"
                        }`}
                      />
                      {codeForm.formState.errors.code && (
                        <p className="mt-2 text-sm text-red-500">
                          {codeForm.formState.errors.code.message}
                        </p>
                      )}
                    </div>

                    {codeForm.formState.errors.root && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        <FiAlertCircle className="mt-0.5 shrink-0" />
                        <span>{codeForm.formState.errors.root.message}</span>
                      </div>
                    )}

                    {resendMutation.isSuccess && (
                      <p className="text-center text-xs font-semibold text-emerald-600">
                        បានផ្ញើកូដថ្មីទៅ {targetEmail} ហើយ។
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={verifyCodeMutation.isPending}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-gradient-to-r from-red-500 to-rose-600 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#be123c,0_8px_14px_rgba(225,29,72,0.22)] transition hover:-translate-y-0.5 hover:from-red-600 hover:to-rose-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_4px_0_#9f1239,0_10px_17px_rgba(225,29,72,0.26)] active:translate-y-0.5 active:scale-[0.99] active:shadow-[inset_0_2px_4px_rgba(127,29,29,0.18),0_1px_0_#9f1239,0_3px_7px_rgba(225,29,72,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {verifyCodeMutation.isPending ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          កំពុងផ្ទៀងផ្ទាត់...
                        </>
                      ) : (
                        "ផ្ទៀងផ្ទាត់កូដ"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendMutation.isPending}
                      className="w-full text-center text-xs font-semibold text-slate-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resendMutation.isPending ? "កំពុងផ្ញើ..." : "មិនទាន់ទទួលកូដ? ផ្ញើម្ដងទៀត"}
                    </button>
                  </form>
                </>
              )}

              {step === "password" && (
                <>
                  <div className="mb-6">
                    <div className="login-icon-3d mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                      <FiCheckCircle className="text-xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">កូដត្រឹមត្រូវ</h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      សូមបញ្ចូលពាក្យសម្ងាត់ថ្មីសម្រាប់គណនី <span className="font-semibold text-slate-700">{targetEmail}</span>។
                    </p>
                  </div>

                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
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
                          {...passwordForm.register("password")}
                          placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
                          className={`w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                            passwordForm.formState.errors.password
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
                      {passwordForm.formState.errors.password && (
                        <p className="mt-2 text-sm text-red-500">
                          {passwordForm.formState.errors.password.message}
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
                          {...passwordForm.register("password_confirmation")}
                          placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្ដងទៀត"
                          className={`w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100 ${
                            passwordForm.formState.errors.password_confirmation
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
                      {passwordForm.formState.errors.password_confirmation && (
                        <p className="mt-2 text-sm text-red-500">
                          {passwordForm.formState.errors.password_confirmation.message}
                        </p>
                      )}
                    </div>

                    {done && (
                      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <FiCheckCircle className="mt-0.5 shrink-0" />
                        <span>កំណត់ពាក្យសម្ងាត់ជោគជ័យ។ កំពុងបញ្ជូនអ្នកទៅចូលប្រើប្រាស់...</span>
                      </div>
                    )}

                    {passwordForm.formState.errors.root && (
                      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        <FiAlertCircle className="mt-0.5 shrink-0" />
                        <span>{passwordForm.formState.errors.root.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={resetMutation.isPending || done}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-gradient-to-r from-red-500 to-rose-600 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#be123c,0_8px_14px_rgba(225,29,72,0.22)] transition hover:-translate-y-0.5 hover:from-red-600 hover:to-rose-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_4px_0_#9f1239,0_10px_17px_rgba(225,29,72,0.26)] active:translate-y-0.5 active:scale-[0.99] active:shadow-[inset_0_2px_4px_rgba(127,29,29,0.18),0_1px_0_#9f1239,0_3px_7px_rgba(225,29,72,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {resetMutation.isPending ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          កំពុងកំណត់...
                        </>
                      ) : (
                        "កំណត់ពាក្យសម្ងាត់"
                      )}
                    </button>
                  </form>
                </>
              )}

              <Link
                to="/login"
                className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600"
              >
                <FiArrowLeft />
                ត្រឡប់ទៅចូលប្រើប្រាស់
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, title, desc }) => (
  <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/15">
    <div className="quick-action-icon-3d mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-[12px] leading-5 text-white/80">{desc}</p>
    </div>
  </div>
);

export default ForgotPassword;
