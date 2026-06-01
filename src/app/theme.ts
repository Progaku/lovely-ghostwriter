import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#211d1a",
      paper: "#f0e4c8",
    },
    text: {
      primary: "#332820",
    },
  },
  typography: {
    fontFamily: '"Yu Mincho", "Hiragino Mincho ProN", serif',
  },
});
