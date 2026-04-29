import { useState } from "react";
import { toast } from "sonner";
import { useSettings, useUpdateFeatureFlag, useAuditLog } from "../hooks/useSettings";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";

type Tab = "plans" | "flags" | "admins" | "audit";

const FLAG_LABELS: Record<string, { label: string; description: string; type: "toggle" | "number" }> = {
  free_trial_enabled: { label: "Free Trial", description: "Allow new users to start a 7-day free trial", type: "toggle" },
  trial_duration_days: { label: "Trial Duration (days)", description: "Duration of the free trial in days", type: "number" },
  whatsapp_share_enabled: { label: "WhatsApp Share", description: "Show WhatsApp share button on test results", type: "toggle" },
  maintenance_mode: { label: "Maintenance Mode", description: "Block all student logins (admin only)", type: "toggle" },
};

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("plans");
  const [trialDays, setTrialDays] = useState<string>("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditAction, setAuditAction] = useState("");

  const { data: settings, isLoading } = useSettings();
  const updateFlag = useUpdateFeatureFlag();
  const { data: auditData, isLoading: auditLoading } = useAuditLog({
    page: auditPage,
    limit: 20,
    action: auditAction || undefined,
  });

  function handleToggle(flag: string, current: boolean) {
    updateFlag.mutate(
      { flag_name: flag, value: !current },
      {
        onSuccess: () => toast.success(`${FLAG_LABELS[flag]?.label ?? flag} updated`),
        onError: () => toast.error("Failed to update flag"),
      }
    );
  }

  function handleTrialDaysSave() {
    const n = parseInt(trialDays);
    if (!n || n < 1 || n > 90) return;
    updateFlag.mutate(
      { flag_name: "trial_duration_days", value: n },
      {
        onSuccess: () => { toast.success("Trial duration updated"); setTrialDays(""); },
        onError: () => toast.error("Failed to update"),
      }
    );
  }

  const flags = settings?.feature_flags;
  const maintenanceOn = flags?.maintenance_mode === true;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-ink">Settings</h2>
        <p className="text-ink-3 text-sm font-body mt-0.5">Platform configuration and administration</p>
      </div>

      {maintenanceOn && (
        <div className="mb-4 p-4 bg-rose/5 border border-rose/20 rounded-xl flex items-center gap-3">
          <span className="text-rose text-lg">⚠️</span>
          <p className="text-sm font-body text-rose font-semibold">
            Maintenance mode is ON — students cannot log in
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-bg rounded-xl p-1 w-fit mb-6">
        {([
          { key: "plans", label: "Plans" },
          { key: "flags", label: "Feature Flags" },
          { key: "admins", label: "Admin Users" },
          { key: "audit", label: "Audit Log" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-colors ${
              tab === t.key ? "bg-white text-ink shadow-sm" : "text-ink-3 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Plans */}
          {tab === "plans" && (
            <div className="space-y-3">
              {settings?.plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl border border-ink/8 shadow-sm p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-base text-ink">{plan.name}</p>
                    <p className="text-xs font-body text-ink-3 mt-0.5">
                      {plan.plan_type} · {plan.billing_cycle} · ₹{(plan.price_paise / 100).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Badge variant={plan.is_active ? "forest" : "gray"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
              {!settings?.plans.length && (
                <p className="text-sm text-ink-3 font-body">No plans found</p>
              )}
            </div>
          )}

          {/* Feature Flags */}
          {tab === "flags" && (
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
              <div className="divide-y divide-ink/5">
                {Object.entries(FLAG_LABELS).map(([key, meta]) => {
                  const val = flags?.[key as keyof typeof flags];
                  return (
                    <div key={key} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-sm text-ink">{meta.label}</p>
                        <p className="text-xs text-ink-3 font-body mt-0.5">{meta.description}</p>
                      </div>
                      {meta.type === "toggle" ? (
                        <button
                          onClick={() => handleToggle(key, Boolean(val))}
                          disabled={updateFlag.isPending}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            val ? "bg-teal" : "bg-ink/20"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              val ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder={String(val ?? "")}
                            value={trialDays}
                            onChange={(e) => setTrialDays(e.target.value)}
                            className="w-20 h-8 px-2 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal text-center"
                          />
                          <Button size="sm" variant="secondary" onClick={handleTrialDaysSave} disabled={!trialDays || updateFlag.isPending}>
                            Save
                          </Button>
                          <span className="text-xs text-ink-3">Current: {val}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Users */}
          {tab === "admins" && (
            <div className="bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
              <div className="divide-y divide-ink/5">
                {settings?.admin_users.map((admin) => (
                  <div key={admin.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal font-bold text-sm">
                        {admin.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm text-ink">{admin.name}</p>
                      <p className="text-xs text-ink-3 font-body">{admin.email}</p>
                    </div>
                    <Badge variant="teal">{admin.role}</Badge>
                  </div>
                ))}
                {!settings?.admin_users.length && (
                  <div className="p-5">
                    <p className="text-sm text-ink-3 font-body">No admin users found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {tab === "audit" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter by action (e.g. lesson.create)"
                  value={auditAction}
                  onChange={(e) => { setAuditAction(e.target.value); setAuditPage(1); }}
                  className="h-9 px-3 rounded-lg border border-ink/20 bg-white text-sm font-body text-ink focus:outline-none focus:border-teal w-72"
                />
                {auditAction && (
                  <button onClick={() => setAuditAction("")} className="text-xs text-ink-3 hover:text-ink font-body">
                    Clear
                  </button>
                )}
              </div>

              {auditLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-body">
                      <thead>
                        <tr className="border-b border-ink/8 bg-bg">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-ink-3">Admin</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-ink-3">Action</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-ink-3">Resource</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-ink-3">IP</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-ink-3">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditData?.logs.map((log) => (
                          <tr key={log.id} className="border-b border-ink/5 hover:bg-bg/50">
                            <td className="py-3 px-4 font-semibold text-ink">{log.admin_name ?? "—"}</td>
                            <td className="py-3 px-4">
                              <code className="text-xs bg-ink/5 px-1.5 py-0.5 rounded text-teal">{log.action}</code>
                            </td>
                            <td className="py-3 px-4 text-ink-3">
                              {log.resource_type ?? "—"}
                              {log.resource_id && (
                                <span className="text-xs ml-1 text-ink/40">{String(log.resource_id).slice(0, 8)}…</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-ink-3 text-xs">{log.ip_address ?? "—"}</td>
                            <td className="py-3 px-4 text-ink-3 text-xs">
                              {new Date(log.created_at).toLocaleString("en-IN", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))}
                        {!auditData?.logs.length && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-ink-3 font-body">No audit entries</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {(auditData?.total ?? 0) > 20 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-ink/8">
                      <span className="text-xs text-ink-3 font-body">
                        {(auditPage - 1) * 20 + 1}–{Math.min(auditPage * 20, auditData?.total ?? 0)} of {auditData?.total} entries
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" disabled={auditPage === 1} onClick={() => setAuditPage((p) => p - 1)}>
                          Prev
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={auditPage * 20 >= (auditData?.total ?? 0)}
                          onClick={() => setAuditPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
