export const stripeElementsAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#AA336A",
    colorBackground: "#ffffff",
    colorText: "#3B1F38",
    colorDanger: "#AA336A",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "2px",
  },
  rules: {
    ".Input": {
      borderColor: "rgba(59, 31, 56, 0.15)",
    },
    ".Input:focus": {
      borderColor: "#FFB6C1",
      boxShadow: "0 0 0 1px #FFB6C1",
    },
  },
};
