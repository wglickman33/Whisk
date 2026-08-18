import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initThemeSync } from "./store/settingsStore";
import { useAuthStore } from "./store/authStore";
import { useAuthModalStore } from "./store/authModalStore";
import { Layout } from "./components/layout/Layout";
import { Favicon } from "./components/layout/Favicon";
import { Home } from "./pages/Home";
import { ConverterLayout } from "./pages/converter/ConverterLayout";
import { FileConverterPage } from "./pages/converter/FileConverterPage";
import { UnitConverterPage } from "./pages/converter/UnitConverterPage";
import {
  ToolsLayout,
  ToolsHomePage,
  CropPage,
  ResizePage,
  CompressPage,
  RemoveBgPage,
  SharpenPage,
  ColorPickerPage,
  QRGeneratorPage,
  MarkdownPage,
  RotatePage,
  JsonPage,
  Base64Page,
  HashPage,
  UuidPage,
  AdjustPage,
  FiltersPage,
  PalettePage,
  WatermarkPage,
  ImagesToPdfPage,
  ExifPage,
  YamlPage,
  DiffPage,
  CounterPage,
  CasePage,
  CsvPage,
  TimestampPage,
  IngredientScalePage,
  OvenTempPage,
  PanYieldPage,
  TimerPage,
  BarcodePage,
  HtmlPreviewPage,
} from "./pages/tools";
import { RecipesPage } from "./pages/RecipesPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { DocsPage } from "./pages/info/DocsPage";
import { CapabilitiesPage } from "./pages/info/CapabilitiesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SousPage } from "./pages/SousPage";
import { PrivacyPage } from "./pages/info/PrivacyPage";
import { HowItWorksPage } from "./pages/info/HowItWorksPage";

function PasswordResetFromUrl() {
  const openResetModal = useAuthModalStore((s) => s.openResetModal);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") !== "1") return;
    const token = params.get("token");
    const email = params.get("email");
    if (token && email) {
      openResetModal(email, token);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [openResetModal]);
  return null;
}

function ThemeInit() {
  useEffect(() => initThemeSync(), []);
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
      <PasswordResetFromUrl />
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
            <Route path="rotate" element={<RotatePage />} />
            <Route path="json" element={<JsonPage />} />
            <Route path="base64" element={<Base64Page />} />
            <Route path="hash" element={<HashPage />} />
            <Route path="uuid" element={<UuidPage />} />
            <Route path="adjust" element={<AdjustPage />} />
            <Route path="filters" element={<FiltersPage />} />
            <Route path="palette" element={<PalettePage />} />
            <Route path="watermark" element={<WatermarkPage />} />
            <Route path="images-to-pdf" element={<ImagesToPdfPage />} />
            <Route path="exif" element={<ExifPage />} />
            <Route path="yaml" element={<YamlPage />} />
            <Route path="diff" element={<DiffPage />} />
            <Route path="counter" element={<CounterPage />} />
            <Route path="case" element={<CasePage />} />
            <Route path="csv" element={<CsvPage />} />
            <Route path="timestamp" element={<TimestampPage />} />
            <Route path="ingredient-scale" element={<IngredientScalePage />} />
            <Route path="oven-temp" element={<OvenTempPage />} />
            <Route path="pan-yield" element={<PanYieldPage />} />
            <Route path="timer" element={<TimerPage />} />
            <Route path="barcode" element={<BarcodePage />} />
            <Route path="html-preview" element={<HtmlPreviewPage />} />
          </Route>
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="shopping-list" element={<ShoppingListPage />} />
          <Route path="sous" element={<SousPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="capabilities" element={<CapabilitiesPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
