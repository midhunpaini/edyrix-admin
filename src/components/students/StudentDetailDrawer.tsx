import { useState } from "react";
import { Icon } from "../ui/Icon";
import { Icons } from "../../lib/icons";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import type { StudentDetail } from "../../types";
import { useGrantAccess, useSuspendStudent, useUnsuspendStudent } from "../../hooks/useStudents";

interface Props {
  student: StudentDetail | null;
  open: boolean;
  onClose: () => void;
}

const PLANS = [
  { id: "plan-uuid-1", name: "Science Bundle" },
  { id: "plan-uuid-2", name: "Full Access" },
];

export function StudentDetailDrawer({ student, open, onClose }: Props) {
  const [grantOpen, setGrantOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [grantPlan, setGrantPlan] = useState(PLANS[0].id);
  const [grantDuration, setGrantDuration] = useState(30);
  const [grantReason, setGrantReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  const grantAccess = useGrantAccess();
  const suspend = useSuspendStudent();
  const unsuspend = useUnsuspendStudent();

  if (!student) return null;
  const s = student;

  const initials = s.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  function handleGrantAccess() {
    if (!grantReason.trim()) return;
    grantAccess.mutate(
      { studentId: s.id, plan_id: grantPlan, duration_days: grantDuration, reason: grantReason },
      { onSuccess: () => { setGrantOpen(false); setGrantReason(""); } }
    );
  }

  function handleSuspend() {
    if (!suspendReason.trim()) return;
    suspend.mutate(
      { studentId: s.id, reason: suspendReason },
      { onSuccess: () => { setSuspendOpen(false); setSuspendReason(""); } }
    );
  }

  return (
    <>
      {/* Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8">
              <h3 className="font-display font-bold text-lg text-ink">Student Details</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-ink/5" aria-label="Close">
                <Icon name={Icons.close} size={20} className="text-ink-3" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-lg text-ink truncate">{s.name}</p>
                  <p className="text-sm text-ink-3">{s.email ?? s.phone ?? "â€”"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="teal">Class {s.current_class ?? "?"}</Badge>
                    <Badge variant={s.subscription_status === "active" ? "forest" : s.subscription_status === "trial" ? "amber" : "gray"}>
                      {s.subscription_status}
                    </Badge>
                    {s.is_suspended && <Badge variant="rose">Suspended</Badge>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!s.is_suspended ? (
                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => setGrantOpen(true)}>
                    <Icon name={Icons.add} size={16} className="mr-1" /> Grant Access
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={() => unsuspend.mutate(s.id)}>
                    <Icon name={Icons.unlock} size={16} className="mr-1" /> Unsuspend
                  </Button>
                )}
                {!s.is_suspended ? (
                  <Button size="sm" variant="secondary" className="flex-1 text-rose hover:text-rose" onClick={() => setSuspendOpen(true)}>
                    <Icon name={Icons.lock} size={16} className="mr-1" /> Suspend
                  </Button>
                ) : null}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-xl font-display font-bold text-ink">{s.stats.videos}</p>
                  <p className="text-xs text-ink-3">Videos</p>
                </div>
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-xl font-display font-bold text-ink">{s.stats.tests}</p>
                  <p className="text-xs text-ink-3">Tests</p>
                </div>
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-xl font-display font-bold text-ink">{s.stats.avg_score}%</p>
                  <p className="text-xs text-ink-3">Avg Score</p>
                </div>
                <div className="bg-bg rounded-xl p-3 text-center">
                  <p className="text-xl font-display font-bold text-ink">{s.stats.streak}</p>
                  <p className="text-xs text-ink-3">Streak</p>
                </div>
              </div>

              {/* Subject Progress */}
              {s.subject_progress.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-sm text-ink mb-3">Subject Progress</h4>
                  <div className="space-y-2">
                    {s.subject_progress.map((sp) => (
                      <div key={sp.subject}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-body text-ink">{sp.subject}</span>
                          <span className="text-ink-3">{sp.pct}%</span>
                        </div>
                        <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
                          <div className="h-full bg-teal rounded-full" style={{ width: `${sp.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment History */}
              {s.payment_history.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-sm text-ink mb-3">Subscription History</h4>
                  <div className="space-y-2">
                    {s.payment_history.map((p, i) => (
                      <div key={i} className="bg-bg rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-body text-ink">{p.plan_name}</span>
                          <Badge variant={p.status === "active" ? "forest" : p.status === "cancelled" ? "rose" : "gray"}>{p.status}</Badge>
                        </div>
                        <p className="text-xs text-ink-3 mt-1">â‚¹{(p.amount_paise / 100).toLocaleString("en-IN")}</p>
                        <p className="text-xs text-ink-3">{new Date(p.started_at).toLocaleDateString("en-IN")} â€” {p.expires_at ? new Date(p.expires_at).toLocaleDateString("en-IN") : "Ongoing"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              {s.recent_activity.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-sm text-ink mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {s.recent_activity.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Icon name={a.type === "video_watched" ? Icons.video : a.type === "test_taken" ? Icons.quiz : Icons.doubt} size={16} className="text-ink-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-ink truncate">{a.title}</p>
                          <p className="text-xs text-ink-3">{new Date(a.timestamp).toLocaleString("en-IN")}</p>
                        </div>
                        {a.score !== undefined && <span className="text-xs font-bold text-ink">{a.score}%</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grant Access Modal */}
      <Modal open={grantOpen} onClose={() => setGrantOpen(false)} title="Grant Access" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Plan</label>
            <select value={grantPlan} onChange={(e) => setGrantPlan(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-ink/20 text-sm font-body text-ink focus:outline-none focus:border-teal">
              {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Duration</label>
            <div className="flex gap-2">
              {[30, 60, 90, 180].map((d) => (
                <button key={d} onClick={() => setGrantDuration(d)} className={`flex-1 h-10 rounded-lg text-sm font-body font-semibold transition-colors ${grantDuration === d ? "bg-teal text-white" : "bg-bg text-ink-3 hover:bg-ink/5"}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Reason</label>
            <textarea value={grantReason} onChange={(e) => setGrantReason(e.target.value)} rows={3} className="w-full rounded-lg border border-ink/20 p-3 text-sm font-body text-ink focus:outline-none focus:border-teal resize-none" placeholder="Why are you granting access?" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setGrantOpen(false)}>Cancel</Button>
            <Button disabled={!grantReason.trim() || grantAccess.isPending} loading={grantAccess.isPending} onClick={handleGrantAccess}>Grant Access</Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Confirm */}
      <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title="Suspend Student" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-rose/5 rounded-lg border border-rose/20">
            <p className="text-sm font-body text-rose">
              <span className="font-bold">{s.name}</span> will not be able to log in after suspension.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold font-body text-ink mb-1">Reason</label>
            <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3} className="w-full rounded-lg border border-ink/20 p-3 text-sm font-body text-ink focus:outline-none focus:border-teal resize-none" placeholder="Reason for suspension" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button variant="secondary" className="text-rose" disabled={!suspendReason.trim() || suspend.isPending} loading={suspend.isPending} onClick={handleSuspend}>Confirm Suspend</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
