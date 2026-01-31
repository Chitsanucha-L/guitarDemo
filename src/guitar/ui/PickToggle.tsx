interface PickToggleProps {
  isHoldingPick: boolean;
  onToggle: () => void;
}

export default function PickToggle({ isHoldingPick, onToggle }: PickToggleProps) {
  return (
    <div className="z-10 transition-all duration-300 pointer-events-auto">
      <button
        onClick={onToggle}
        className={`px-4 py-2 rounded-md transition font-medium text-[16px] ${isHoldingPick ? "bg-orange-500 text-white" : "bg-white text-black"}`}
      >
        {isHoldingPick ? "ถือปิ๊ก ✅" : "ไม่ถือปิ๊ก ❌"}
      </button>
    </div>
  );
}
