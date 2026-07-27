import React, { useEffect, useRef } from "react";

// A USB/Bluetooth HID barcode scanner behaves as a keyboard — it "types" the code into
// whatever element currently has focus, then sends Enter. This invisible input exists purely
// to catch that: always focused by default, so scanning "just works" without the cashier
// clicking anything first, but never fighting for focus once they click into a real field
// (the product search box, a quantity input, etc.) on purpose.
export default function HardwareScannerInput({ onScan }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const input = inputRef.current;

    function refocusIfNothingElseFocused() {
      // Give whatever the user just clicked a chance to actually take focus first — only steal
      // it back if focus fell through to <body> (i.e. nothing was intentionally clicked into).
      requestAnimationFrame(() => {
        if (document.activeElement === document.body) {
          input?.focus();
        }
      });
    }

    input?.focus();
    document.addEventListener("click", refocusIfNothingElseFocused);
    window.addEventListener("focus", refocusIfNothingElseFocused);

    return () => {
      document.removeEventListener("click", refocusIfNothingElseFocused);
      window.removeEventListener("focus", refocusIfNothingElseFocused);
    };
  }, []);

  function handleKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const code = e.currentTarget.value.trim();
    e.currentTarget.value = "";
    if (code) onScan(code);
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="none"
      aria-hidden="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed left-0 top-0 h-0 w-0 opacity-0"
    />
  );
}
