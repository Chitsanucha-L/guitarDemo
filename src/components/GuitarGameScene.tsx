import { useEffect, useRef } from "react";
import Phaser from "phaser";
import GuitarGame2D from "./GuitarGame2D";

export default function GuitarGame() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      backgroundColor: "#222",
      scene: [GuitarGame2D]
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true); // ลบเกมเมื่อ unmount หรือหยุด
    };
  }, []);

  return (
    <div className="w-full max-w-screen h-screen relative overflow-hidden">
      <div ref={gameRef} className="w-full h-full" />
    </div>
  );
}
