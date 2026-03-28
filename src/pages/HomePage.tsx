// src/pages/HomePage.tsx
import { useTranslation } from "react-i18next";
import Guitar3D from "../guitar/Guitar3D";
import Navbar from "../guitar/ui/Navbar";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-screen min-h-dvh h-screen h-dvh flex flex-col overflow-hidden">
      <div className="hidden lg:block">
        <Navbar title={t("nav.title")} activeLink="home" variant="home" />
      </div>

      {/* Main Content — fullscreen; mobile uses in-canvas MobileNav */}
      <div className="flex-1 w-full min-h-0 relative z-0">
        <Guitar3D />
      </div>
    </div>
  );
}
