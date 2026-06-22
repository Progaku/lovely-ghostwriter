import { createTheme } from "@mui/material/styles";

/** 紙面風デザインの基準になるMUIテーマ */
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2f3a37",
      dark: "#1f2826",
      contrastText: "#fff8e7",
    },
    secondary: {
      main: "#5f766e",
      dark: "#42554f",
      contrastText: "#fff8e7",
    },
    background: {
      default: "#211d1a",
      paper: "#f4ead2",
    },
    text: {
      primary: "#332820",
      secondary: "#5d5044",
    },
    divider: "#cbbf9e",
    info: {
      main: "#506f80",
      light: "#e4eef0",
      dark: "#2f4a57",
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily:
      '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", serif',
    h3: {
      fontSize: "clamp(1.65rem, 1.35rem + 1.2vw, 3rem)",
      lineHeight: 1.18,
      fontWeight: 700,
    },
    h4: {
      fontSize: "clamp(1.45rem, 1.25rem + 0.6vw, 2rem)",
      lineHeight: 1.3,
      fontWeight: 700,
    },
    h5: {
      fontSize: "1.25rem",
      lineHeight: 1.35,
      fontWeight: 700,
    },
    body1: {
      lineHeight: 1.85,
    },
    body2: {
      lineHeight: 1.7,
    },
    button: {
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          minWidth: 0,
          lineHeight: 1.35,
          paddingInline: "1rem",
          textWrap: "balance",
        },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            boxShadow: "0 10px 20px rgba(47, 58, 55, 0.18)",
          },
        },
        {
          props: { variant: "outlined", color: "primary" },
          style: {
            backgroundColor: "rgba(244, 234, 210, 0.42)",
          },
        },
      ],
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 251, 239, 0.72)",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
          },
        },
        input: {
          overflowWrap: "anywhere",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          maxWidth: "100%",
        },
        label: {
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          alignItems: "flex-start",
        },
        message: {
          overflowWrap: "anywhere",
        },
      },
    },
  },
});
