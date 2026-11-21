"use client";

import { useEffect, useState } from "react";

/** Keys whose default action (page scroll) is prevented while a game reads the keyboard. */
const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);

export type KeyState = {
  /** True while the key (KeyboardEvent.code) is held down. */
  isDown: (code: string) => boolean;
  /** True once per press: consumes the "just pressed" flag of the key. */
  consumePressed: (code: string) => boolean;
};

function isTextInput(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
}

function createKeyStore() {
  const down = new Set<string>();
  const pressed = new Set<string>();
  const state: KeyState = {
    isDown: (code) => down.has(code),
    consumePressed: (code) => pressed.delete(code),
  };
  return { down, pressed, state };
}

/**
 * Tracks held and just-pressed keys on window while enabled. Ignores events typed into inputs,
 * prevents the page from scrolling with the arrows and space, and forgets every key when disabled.
 */
export function useKeys(enabled: boolean): KeyState {
  const [store] = useState(createKeyStore);

  useEffect(() => {
    if (!enabled) return;
    const { down, pressed } = store;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextInput(e.target)) return;
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (!down.has(e.code)) pressed.add(e.code);
      down.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      down.delete(e.code);
    };
    const onBlur = () => {
      down.clear();
      pressed.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      down.clear();
      pressed.clear();
    };
  }, [enabled, store]);

  return store.state;
}
