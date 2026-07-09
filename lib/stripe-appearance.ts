export const stripeElementsAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#D58A94",
    colorBackground: "#ffffff",
    colorText: "#5A4D42",
    colorDanger: "#D58A94",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "2px",
  },
  rules: {
    ".Input": {
      borderColor: "rgba(90, 77, 66, 0.15)",
    },
    ".Input:focus": {
      borderColor: "#D58A94",
      boxShadow: "0 0 0 1px #D58A94",
    },
  },
};
