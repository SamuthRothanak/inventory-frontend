import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "../../../components/ConfirmDialog";
import {
  FiArchive,
  FiCalendar,
  FiHardDrive,
  FiSearch,
  FiShield,
} from "react-icons/fi";

import BackupActionPanel from "./components/BackupActionPanel";
import BackupHistoryTable from "./components/BackupHistoryTable";
import BackupPolicyCard from "./components/BackupPolicyCard";
import BackupSummaryCard from "./components/BackupSummaryCard";
import RestoreModal from "./components/RestoreModal";
import {
  createBackupApi,
  deleteBackupApi,
  downloadBackupApi,
  getBackupsApi,
  getBackupStatsApi,
  restoreBackupApi,
  restoreBackupFromIdApi,
} from "../../../services/backup.service";
import { getBackupTheme } from "./utils/backupTheme";
import { backupChecklist } from "./utils/backupData";

function formatBytes(bytes) {
  if (!bytes) return "0 MB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function formatLatest(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  return isToday ? "ថ្ងៃនេះ" : d.toLocaleDateString("en-GB");
}

const summaryIcons = [<FiCalendar />, <FiArchive />, <FiHardDrive />, <FiShield />];

export default function BackupData() {
  const outlet  = useOutletContext();
  const isDark  = outlet?.isDark ?? false;
  const confirm = useConfirm();
  const theme   = getBackupTheme(isDark);
  const qc      = useQueryClient();

  const [search, setSearch]               = useState("");
  const [restoreTarget, setRestoreTarget] = useState(null);

  const { data: statsData } = useQuery({
    queryKey: ["backup-stats"],
    queryFn:  getBackupStatsApi,
  });

  const stats = statsData?.data ?? {};

  const summaryCards = [
    {
      title:    "បម្រុងទុកចុងក្រោយ",
      value:    formatLatest(stats.latest_backup),
      subtitle: stats.latest_backup
        ? new Date(stats.latest_backup).toLocaleString("en-GB")
        : "មិនទាន់មានទិន្នន័យបម្រុងទុក",
      tone: "emerald",
    },
    {
      title:    "ឯកសារបម្រុងទុក",
      value:    String(stats.backup_count ?? 0),
      subtitle: "រក្សាទុកក្នុង server",
      tone:     "blue",
    },
    {
      title:    "ទំហំសរុប",
      value:    formatBytes(stats.total_size),
      subtitle: "Database + រូបភាព",
      tone:     "amber",
    },
    {
      title:    "រយៈពេលរក្សា",
      value:    `${stats.retention_days ?? 30} ថ្ងៃ`,
      subtitle: "រក្សាទិន្នន័យបម្រុងទុកថ្មីៗ",
      tone:     "purple",
    },
  ];

  const { data: backupsData, isLoading } = useQuery({
    queryKey: ["backups", search],
    queryFn:  () => getBackupsApi({ search }),
  });

  const rows = (backupsData?.data ?? []).filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [row.file_name, row.status, row.created_by?.name]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const createMutation = useMutation({
    mutationFn: createBackupApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups"] });
      qc.invalidateQueries({ queryKey: ["backup-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBackupApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backups"] });
      qc.invalidateQueries({ queryKey: ["backup-stats"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (file) => restoreBackupApi(file),
    onSuccess: () => {
      setRestoreTarget(null);
      qc.invalidateQueries({ queryKey: ["backups"] });
      qc.invalidateQueries({ queryKey: ["backup-stats"] });
    },
  });

  const restoreFromIdMutation = useMutation({
    mutationFn: (id) => restoreBackupFromIdApi(id),
    onSuccess: () => {
      setRestoreTarget(null);
      qc.invalidateQueries({ queryKey: ["backups"] });
      qc.invalidateQueries({ queryKey: ["backup-stats"] });
    },
  });

  function handleDownload(row) {
    downloadBackupApi(row.id, row.file_name);
  }

  async function handleDelete(row) {
    const ok = await confirm(`តើអ្នកប្រាកដថាចង់លុបទិន្នន័យបម្រុងទុក "${row.file_name}" មែនទេ?`);
    if (!ok) return;
    deleteMutation.mutate(row.id);
  }

  return (
    <div className={`space-y-6 px-5 pb-8 pt-6 ${theme.page}`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item, index) => (
          <BackupSummaryCard
            key={item.title}
            theme={theme}
            title={item.title}
            value={item.value}
            subtitle={item.subtitle}
            tone={item.tone}
            icon={summaryIcons[index]}
          />
        ))}
      </div>

      <BackupActionPanel
        theme={theme}
        onCreateBackup={() => createMutation.mutate()}
        isCreating={createMutation.isPending}
        onRestoreUpload={(file) => setRestoreTarget({ file })}
      />

      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ស្វែងរកឯកសារបម្រុងទុក ឬ ស្ថានភាព..."
          className={`h-14 w-full rounded-2xl border pl-14 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
      </div>

      <BackupHistoryTable
        theme={theme}
        rows={rows}
        isLoading={isLoading}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onRestore={(row) => setRestoreTarget({ existing: row })}
      />

      <BackupPolicyCard theme={theme} />

      {restoreTarget && (
        <RestoreModal
          theme={theme}
          onClose={() => setRestoreTarget(null)}
          onConfirmUpload={(file) => restoreMutation.mutate(file)}
          onConfirmFromId={(id) => restoreFromIdMutation.mutate(id)}
          isLoading={restoreMutation.isPending || restoreFromIdMutation.isPending}
          existingBackup={restoreTarget.existing ?? null}
          preSelectedFile={restoreTarget.file ?? null}
        />
      )}
    </div>
  );
}
