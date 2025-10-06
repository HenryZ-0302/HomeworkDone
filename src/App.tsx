import { HashRouter, Route, Routes } from "react-router-dom";
import RequireGeminiKey from "./components/guards/RequireGeminiKey";
import ScanPage from "./components/pages/ScanPage";
import InitPage from "./components/pages/InitPage";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import SettingsPage from "./components/pages/SettingsPage";

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
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </HashRouter>

      <Toaster />
    </ThemeProvider>
  );
}

export default App;
