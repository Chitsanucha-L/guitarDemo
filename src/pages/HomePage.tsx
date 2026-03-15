// src/pages/HomePage.tsx
import { useTranslation } from "react-i18next";
import Guitar3D from "../guitar/Guitar3D";
import Navbar from "../guitar/ui/Navbar";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-screen max-h-screen w-full h-full flex flex-col">
      <Navbar title={t("nav.title")} activeLink="home" variant="home" />

      {/* Main Content */}
      <div className="flex-1 w-full h-full z-0">
        <Guitar3D />
      </div>
    </div>
  );
}
