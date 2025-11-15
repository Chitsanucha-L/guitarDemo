import GuitarGame from "../components/GuitarGameScene"; // เปลี่ยน path ตามโปรเจกต์คุณ
import { Link } from "react-router-dom";

export default function GamePage() {
  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900 text-white">
      {/* ✅ Navbar */}
      <nav className="w-full bg-gray-800 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Guitar Trainer 🎸</h1>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-yellow-400">Home</Link>
          <Link to="/game" className="hover:text-yellow-400">Game</Link>
          <Link to="/about" className="hover:text-yellow-400">About</Link>
        </div>
      </nav>

      {/* ✅ Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[80vh] bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <GuitarGame />
        </div>
      </div>
    </div>
  );
}
