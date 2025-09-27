import { HashRouter, Route, Routes } from "react-router-dom";
import RequireGeminiKey from "./components/RequireGeminiKey";
import ScanPage from "./components/pages/ScanPage";
import InitPage from "./components/pages/InitPage";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              <RequireGeminiKey fallback="/init">
                <ScanPage />
              </RequireGeminiKey>
            }
          />

          <Route path="/init" element={<InitPage />} />
        </Routes>
      </HashRouter>

      <Toaster />
    </ThemeProvider>
  );
}

export default App;
