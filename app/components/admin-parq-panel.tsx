import { formatUkDateTimeShort } from "@/lib/booking-config";
import { formatParQYesNo, PARQ_QUESTIONS } from "@/lib/parq-config";

type ParQData = Record<string, unknown> | null;

export function AdminParQPanel({
  completed,
  completedAt,
  data,
}: {
  completed: boolean;
  completedAt: string | null;
  data: ParQData;
}) {
  return (
    <section className="rounded-lg border border-plum/10 bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">PAR-Q</p>
          <h3 className="mt-2 font-display text-2xl text-plum">Health questionnaire</h3>
          <p className="mt-2 text-sm text-muted">
            Submitted responses for pole, hoop, and silks safety screening.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            completed ? "bg-emerald-50 text-emerald-900" : "bg-brand/10 text-brand"
          }`}
        >
          {completed ? "Complete" : "Not submitted"}
        </span>
      </div>

      {!completed ? (
        <p className="mt-6 text-sm text-muted">
          This member has not completed their PAR-Q yet. They must submit it at{" "}
          <code className="rounded bg-pink-soft px-1.5 py-0.5 text-plum">/account/parq</code> before
          booking aerial or pole classes.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {completedAt && (
            <p className="text-sm text-muted">
              Submitted: <strong className="text-plum">{formatUkDateTimeShort(completedAt)}</strong>
            </p>
          )}

          <div className="overflow-hidden rounded-lg border border-plum/10">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-plum/10 bg-pink-soft/60 text-xs uppercase tracking-wider text-plum">
                <tr>
                  <th className="w-[70%] px-3 py-3 font-semibold">Question</th>
                  <th className="w-[30%] px-3 py-3 font-semibold">Answer</th>
                </tr>
              </thead>
              <tbody>
                {PARQ_QUESTIONS.map((question) => {
                  const answer = data?.[question.key];
                  const isYes = answer === true;

                  return (
                    <tr key={question.key} className="border-b border-plum/8 align-top">
                      <td className="px-3 py-3 text-plum">{question.label}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isYes ? "bg-brand/10 text-brand" : "bg-sage/10 text-plum"
                          }`}
                        >
                          {formatParQYesNo(answer)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {Boolean(data?.emergencyContactName || data?.emergencyContactPhone) && data && (
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted">Emergency contact</dt>
                <dd className="font-semibold text-plum">{String(data.emergencyContactName ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-muted">Emergency phone</dt>
                <dd className="font-semibold text-plum">{String(data.emergencyContactPhone ?? "—")}</dd>
              </div>
            </dl>
          )}

          {Boolean(data?.additionalNotes) && data && (
            <div>
              <p className="text-sm font-medium text-plum">Additional notes</p>
              <p className="mt-2 rounded-lg bg-pink-soft/40 px-4 py-3 text-sm text-muted">
                {String(data.additionalNotes)}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
