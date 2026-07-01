import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSettingsStore } from "./store/settingsStore";
import { useAuthStore } from "./store/authStore";
import { Layout } from "./components/layout/Layout";
import { Favicon } from "./components/layout/Favicon";
import { Home } from "./pages/Home";
import { ConverterLayout } from "./pages/converter/ConverterLayout";
import { FileConverterPage } from "./pages/converter/FileConverterPage";
import { UnitConverterPage } from "./pages/converter/UnitConverterPage";
import { ToolsLayout } from "./pages/tools/ToolsLayout";
import { ToolsHomePage } from "./pages/tools/ToolsHomePage";
import { CropPage } from "./pages/tools/CropPage";
import { ResizePage } from "./pages/tools/ResizePage";
import { CompressPage } from "./pages/tools/CompressPage";
import { RemoveBgPage } from "./pages/tools/RemoveBgPage";
import { SharpenPage } from "./pages/tools/SharpenPage";
import { ColorPickerPage } from "./pages/tools/ColorPickerPage";
import { QRGeneratorPage } from "./pages/tools/QRGeneratorPage";
import { MarkdownPage } from "./pages/tools/MarkdownPage";
import { RecipesPage } from "./pages/RecipesPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { DocsPage } from "./pages/DocsPage";

function ThemeInit() {
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);
  return null;
}

function AuthInit() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Favicon />
      <ThemeInit />
      <AuthInit />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="converter" element={<ConverterLayout />}>
            <Route index element={<Navigate to="file" replace />} />
            <Route path="file" element={<FileConverterPage />} />
            <Route path="unit" element={<UnitConverterPage />} />
          </Route>
          <Route path="tools" element={<ToolsLayout />}>
            <Route index element={<ToolsHomePage />} />
            <Route path="crop" element={<CropPage />} />
            <Route path="resize" element={<ResizePage />} />
            <Route path="compress" element={<CompressPage />} />
            <Route path="remove-bg" element={<RemoveBgPage />} />
            <Route path="sharpen" element={<SharpenPage />} />
            <Route path="color-picker" element={<ColorPickerPage />} />
            <Route path="qr" element={<QRGeneratorPage />} />
            <Route path="markdown" element={<MarkdownPage />} />
          </Route>
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="shopping-list" element={<ShoppingListPage />} />
          <Route path="docs" element={<DocsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
