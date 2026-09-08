// Unified input: keyboard, on-screen touch controls, and gamepads.
// Logical buttons mirror a handheld: dpad, A (confirm/interact), B (cancel/run),
// START (menu), SELECT (time of day).

export type Btn = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select';
export const DIR_BTNS: Btn[] = ['up', 'down', 'left', 'right'];

const KEYMAP: Record<string, Btn> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
  z: 'a', Z: 'a', ' ': 'a', Enter: 'a',
  x: 'b', X: 'b', Escape: 'b', Backspace: 'b',
  Tab: 'start', m: 'start', M: 'start',
  Shift: 'select', q: 'select', Q: 'select',
};

export class Input {
  held = new Set<Btn>();
  pressed = new Set<Btn>();
  /** Order in which direction buttons were pressed, most recent last. */
  private dirStack: Btn[] = [];
  private padPrev = new Set<Btn>();
  /** Called on every press; `gesture` is true for real user gestures (keyboard/touch), false for gamepad polling. */
  onInteraction: ((gesture: boolean) => void) | null = null;

  constructor() {
    window.addEventListener('keydown', (e) => {
      const b = KEYMAP[e.key];
      if (!b || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      // leave focused page controls (the ♪ button, the TEXT link) alone so keyboard users can operate them
      if (t && t !== document.body && t.matches?.('input,textarea,select,button,a,[contenteditable]')) return;
      e.preventDefault();
      if (!e.repeat) this.press(b);
    });
    window.addEventListener('keyup', (e) => { const b = KEYMAP[e.key]; if (b) this.release(b); });
    window.addEventListener('blur', () => { this.held.clear(); this.dirStack = []; });
  }

  press(b: Btn, gesture = true) {
    this.onInteraction?.(gesture);
    if (!this.held.has(b)) { this.held.add(b); this.pressed.add(b); }
    if (DIR_BTNS.includes(b)) { this.dirStack = this.dirStack.filter((d) => d !== b); this.dirStack.push(b); }
  }
  release(b: Btn) {
    this.held.delete(b);
    this.dirStack = this.dirStack.filter((d) => d !== b);
  }

  /** The most recently pressed direction still held — gives responsive diagonal-free control. */
  dir(): Btn | null { return this.dirStack.length ? this.dirStack[this.dirStack.length - 1] : null; }
  hit(b: Btn) { return this.pressed.has(b); }
  endFrame() { this.pressed.clear(); }

  /** Bind on-screen buttons: any element with data-btn. */
  bindTouch(root: HTMLElement) {
    root.querySelectorAll<HTMLElement>('[data-btn]').forEach((el) => {
      const b = el.dataset.btn as Btn;
      const down = (e: Event) => { e.preventDefault(); el.classList.add('is-down'); this.press(b); };
      const up = (e: Event) => { e.preventDefault(); el.classList.remove('is-down'); this.release(b); };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  /** Poll gamepads each frame (standard mapping). */
  pollGamepad() {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = [...pads].find((p) => p && p.connected);
    if (!pad) return;
    const now = new Set<Btn>();
    const ax = pad.axes[0] ?? 0, ay = pad.axes[1] ?? 0;
    const btn = (i: number) => !!pad.buttons[i]?.pressed;
    if (btn(12) || ay < -0.5) now.add('up');
    if (btn(13) || ay > 0.5) now.add('down');
    if (btn(14) || ax < -0.5) now.add('left');
    if (btn(15) || ax > 0.5) now.add('right');
    if (btn(0)) now.add('a');
    if (btn(1)) now.add('b');
    if (btn(9)) now.add('start');
    if (btn(8)) now.add('select');
    for (const b of now) if (!this.padPrev.has(b)) this.press(b, false);
    for (const b of this.padPrev) if (!now.has(b)) this.release(b);
    this.padPrev = now;
  }
}
