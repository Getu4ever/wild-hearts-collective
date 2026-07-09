export const PARQ_QUESTIONS = [
  { key: "hasHeartCondition", label: "Has your doctor ever said you have a heart condition?" },
  { key: "hasChestPain", label: "Do you feel pain in your chest when you do physical activity?" },
  { key: "hasBoneJointProblem", label: "Do you have a bone or joint problem that could worsen with exercise?" },
  { key: "hasHighBloodPressure", label: "Is your doctor currently prescribing medication for blood pressure or a heart condition?" },
  { key: "hasOtherMedicalReason", label: "Do you know of any other reason you should not do physical activity?" },
  { key: "isPregnant", label: "Are you pregnant or have you given birth in the last 6 months?" },
] as const;

export type ParQQuestionKey = (typeof PARQ_QUESTIONS)[number]["key"];

export function formatParQYesNo(value: unknown) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}
