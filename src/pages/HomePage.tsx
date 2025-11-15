// src/pages/HomePage.tsx
import { Link } from "react-router-dom";
import Guitar3D from "../components/Guitar3D";

export default function HomePage() {
  return (
    <div className="max-w-screen max-h-screen w-full h-full flex flex-col">
      {/* ✅ Navbar */}
      <nav className="w-full bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Guitar Trainer</h1>
        <div className="space-x-4">
          <Link to="/" className="hover:text-yellow-400">Home</Link>
          <Link to="/game" className="hover:text-yellow-400">Game Mode</Link>
        </div>
      </nav>

      {/* ✅ Main Content */}
      <div className="flex-1 w-full h-full">
        <Guitar3D />
      </div>
    </div>
  );
}
