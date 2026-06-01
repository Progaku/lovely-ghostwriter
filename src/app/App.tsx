import { Alert, CssBaseline, Paper, ThemeProvider, Typography } from "@mui/material";
import { theme } from "./theme";

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className="min-h-screen bg-stone-900 px-4 py-10 text-stone-900">
        <Paper
          component="section"
          elevation={8}
          className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10"
        >
          <header className="space-y-2 text-center">
            <Typography component="h1" variant="h3">
              ラブリーゴーストライター風 予言紙
            </Typography>
            <Typography component="p" variant="body1">
              一ヶ月の気配を、四週の言葉に映します。
            </Typography>
          </header>

          <Alert severity="info">
            本アプリは非公式ファン作品です。娯楽用途として楽しみ、重要な判断には使用しないでください。
          </Alert>
        </Paper>
      </main>
    </ThemeProvider>
  );
}
