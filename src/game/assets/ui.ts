// Ninja Adventure (CC0, Pixel-boy & AAA) -- UI / font / emote / FX slice.
// Generated from pixel measurements (Pillow); every coordinate is on the ORIGINAL sheet.
//
// Sources used (copied verbatim to /public/game/ui/):
//   Ui/Dialog/{DialogBox, DialogueBoxSimple, DialogBoxFaceset, ChoiceBox, DialogInfo, FacesetBox, YesButton, NoButton}.png
//   Ui/Font/{font8x8.png, NormalFont.ttf}
//   Ui/Theme/Theme Wood/{nine_path_*, button_*, inventory_cell, checked, unchecked, radio_*, arrow_*, *_slidder_grabber}.png
//   Ui/Emote/emote1..30.png           Ui/Arrow.png
//   Ui/Input/Keyboard/Key{Up,Down,Left,Right,W,A,S,D,Z,X,E,Enter,Shift,Space,Escape,Tab}.png, Ui/Input/Icon{Keyboard,Gamepad,Mouse}.png
//   FX/Particle/{Leaf,LeafPink,Grass,Clouds,Spark,Rain,Snow}.png -> /game/ui/Particle/   FX/Environment/{Raylight,Fog}.png -> /game/ui/Environment/
//   FX/Smoke/Smoke/SpriteSheet.png -> /game/ui/Smoke/,  FX/Smoke/SmokeCircular/SpriteSheet.png -> /game/ui/SmokeCircular/
//   (FX files keep their original names inside sub-folders because macOS is case-insensitive and e.g. a foreign
//    lowercase grass.png would clobber Grass.png at the top level; the two Smoke sheets share the name SpriteSheet.png.)
//
// Deliberately skipped: Ui/Font/font24x30.png (large display font, not needed), Ui/Skill Icon/** (no cursor/arrow there),
//   Ui/Receptacle/** (HUD bars), Ui/Input/Gamepad/** & Mouse/**, Ui/Theme/Wip/**, tabs/sliders beyond the grabbers,
//   FX/Particle/{Bamboo,Fire,Rock,RockGray,Vase,Wood,RainOnFloor}.png, all FX/Attack|Elemental|Magic|Projectile|Slash sheets.
//
// Gotchas the engine must know:
//   * DialogInfo.png is a 4-frame "..." speech bubble (SPEECH_DOTS), not a name tag. The name tag is the tab
//     baked into DialogBox.png (UI.nameTag, open-bottomed); UI.dialogBox keeps that tab inside its 71px-wide
//     left corner piece, so the 9-slice min size is 79x24 and the tab stays at the top-left when stretched.
//   * UI_EXTRA.dialogBoxFaceset: keep the height at 58 (only stretch horizontally) or the 38x38 portrait frame,
//     which crosses the vertical stretch zone, gets taller too.
//   * No pointing-hand cursor exists in the pack: UI.cursor is the Theme Wood ">" chevron (tight bbox).
//   * font8x8 glyphs are CENTRED in their 8x8 cells (left bearing 1-3 px). For proportional text blit
//     src (cellX + FONT_BEARING[ch], cellY, FONT.advance[ch] - 1, 8) at the pen, then pen += advance[ch].
//     Glyph colour is #0b001e on transparent; baseline is cell row 6 (FONT_METRICS).
//   * Emotes are single 14x13 frames (frames: 1) with the tail at the bottom-centre (column 7): anchor them
//     centred over the actor, not left-aligned. The pack has no music-note or sweat-drop emote.
//   * FX.clouds is one 80x36 cloud sprite, not a strip. OVERLAYS are pure white + alpha: draw with globalAlpha.

import type { Region, Anim, NineSlice, BitmapFont } from './types';

export interface UiSet {
  dialogBox: NineSlice; dialogBoxSimple: NineSlice; choiceBox: NineSlice; nameTag: NineSlice;
  facesetBox: Region; yes: Region; no: Region; cursor: Region; arrowDown: Region;
}

/** Dialog chrome. See SLOTS for the text / portrait rectangles inside each box. */
export const UI = {
  dialogBox: { region: { sheet: "/game/ui/DialogBox.png", x: 0, y: 0, w: 300, h: 58 }, inset: { l: 71, t: 16, r: 8, b: 8 } },
  dialogBoxSimple: { region: { sheet: "/game/ui/DialogueBoxSimple.png", x: 0, y: 0, w: 316, h: 60 }, inset: { l: 8, t: 8, r: 8, b: 8 } },
  choiceBox: { region: { sheet: "/game/ui/ChoiceBox.png", x: 0, y: 0, w: 64, h: 20 }, inset: { l: 5, t: 5, r: 5, b: 5 } },
  nameTag: { region: { sheet: "/game/ui/DialogBox.png", x: 3, y: 0, w: 68, h: 9 }, inset: { l: 3, t: 2, r: 3, b: 1 } },
  facesetBox: { sheet: "/game/ui/FacesetBox.png", x: 0, y: 0, w: 48, h: 48 },
  yes: { sheet: "/game/ui/YesButton.png", x: 0, y: 0, w: 26, h: 16 },
  no: { sheet: "/game/ui/NoButton.png", x: 0, y: 0, w: 26, h: 16 },
  cursor: { sheet: "/game/ui/arrow_right.png", x: 4, y: 1, w: 10, h: 14 },
  arrowDown: { sheet: "/game/ui/Arrow.png", x: 0, y: 0, w: 13, h: 13 },
} satisfies UiSet;

/** Interior rectangles (px, relative to the box's top-left at its native size) for text and portraits. */
export const SLOTS = {
  dialogBoxText: { x: 6, y: 16, w: 288, h: 34 },
  dialogBoxNameTagText: { x: 4, y: 2, w: 66, h: 7 },
  dialogBoxSimpleText: { x: 6, y: 8, w: 304, h: 44 },
  choiceBoxText: { x: 5, y: 5, w: 54, h: 10 },
  facesetBoxPortrait: { x: 5, y: 5, w: 38, h: 38 },
  dialogBoxFacesetPortrait: { x: 6, y: 14, w: 38, h: 38 },
  dialogBoxFacesetText: { x: 50, y: 16, w: 244, h: 34 },
} satisfies Record<string, { x: number; y: number; w: number; h: number }>;

/** DialogBox variant with a built-in 38x38 portrait frame (SLOTS.dialogBoxFacesetPortrait). */
export const UI_EXTRA = {
  dialogBoxFaceset: { region: { sheet: "/game/ui/DialogBoxFaceset.png", x: 0, y: 0, w: 300, h: 58 }, inset: { l: 71, t: 16, r: 8, b: 8 } },
} satisfies Record<string, NineSlice>;

/** 4-frame '...' speech bubble (0,1,2,3 dots) -- NPC typing / thinking indicator. */
export const SPEECH_DOTS = { sheet: "/game/ui/DialogInfo.png", x: 0, y: 0, w: 20, h: 16, frames: 4, fps: 3 } satisfies Anim;

/** Theme Wood nine-slices for menus (panel = orange wood frame, panelDark = dark backdrop). */
export const THEME = {
  panel: { region: { sheet: "/game/ui/nine_path_panel.png", x: 0, y: 0, w: 16, h: 16 }, inset: { l: 6, t: 6, r: 5, b: 5 } },
  panelDisabled: { region: { sheet: "/game/ui/nine_path_panel_disabled.png", x: 0, y: 0, w: 16, h: 16 }, inset: { l: 6, t: 6, r: 5, b: 5 } },
  panelDark: { region: { sheet: "/game/ui/nine_path_bg.png", x: 0, y: 0, w: 16, h: 16 }, inset: { l: 2, t: 2, r: 2, b: 2 } },
  panelDarker: { region: { sheet: "/game/ui/nine_path_bg_2.png", x: 0, y: 0, w: 16, h: 16 }, inset: { l: 2, t: 2, r: 2, b: 2 } },
  focusRing: { region: { sheet: "/game/ui/nine_path_focus.png", x: 0, y: 0, w: 8, h: 8 }, inset: { l: 3, t: 3, r: 3, b: 3 } },
  inventoryCell: { region: { sheet: "/game/ui/inventory_cell.png", x: 0, y: 0, w: 16, h: 16 }, inset: { l: 3, t: 3, r: 1, b: 1 } },
  button: { region: { sheet: "/game/ui/button_normal.png", x: 0, y: 0, w: 16, h: 8 }, inset: { l: 2, t: 2, r: 2, b: 2 } },
  buttonHover: { region: { sheet: "/game/ui/button_hover.png", x: 0, y: 0, w: 16, h: 8 }, inset: { l: 2, t: 2, r: 2, b: 2 } },
  buttonPressed: { region: { sheet: "/game/ui/button_pressed.png", x: 0, y: 0, w: 16, h: 8 }, inset: { l: 2, t: 3, r: 2, b: 1 } },
  buttonDisabled: { region: { sheet: "/game/ui/button_disabled.png", x: 0, y: 0, w: 16, h: 8 }, inset: { l: 2, t: 2, r: 2, b: 2 } },
} satisfies Record<string, NineSlice>;

/** Theme Wood widget states (whole-file regions). */
export const WIDGETS = {
  checkboxOn: { sheet: "/game/ui/checked.png", x: 0, y: 0, w: 16, h: 16 },
  checkboxOff: { sheet: "/game/ui/unchecked.png", x: 0, y: 0, w: 16, h: 16 },
  radioOn: { sheet: "/game/ui/radio_checked.png", x: 0, y: 0, w: 16, h: 16 },
  radioOff: { sheet: "/game/ui/radio_unchecked.png", x: 0, y: 0, w: 16, h: 16 },
  toggleOn: { sheet: "/game/ui/button_checked.png", x: 0, y: 0, w: 26, h: 14 },
  toggleOff: { sheet: "/game/ui/button_unchecked.png", x: 0, y: 0, w: 26, h: 14 },
  arrowLeft: { sheet: "/game/ui/arrow_left.png", x: 0, y: 0, w: 16, h: 16 },
  arrowRight: { sheet: "/game/ui/arrow_right.png", x: 0, y: 0, w: 16, h: 16 },
  arrowLeftHover: { sheet: "/game/ui/arrow_left_hover.png", x: 0, y: 0, w: 16, h: 16 },
  arrowRightHover: { sheet: "/game/ui/arrow_right_hover.png", x: 0, y: 0, w: 16, h: 16 },
  sliderGrabberH: { sheet: "/game/ui/h_slidder_grabber.png", x: 0, y: 0, w: 13, h: 11 },
  sliderGrabberV: { sheet: "/game/ui/v_slidder_grabber.png", x: 0, y: 0, w: 11, h: 13 },
} satisfies Record<string, Region>;

/** 8x8 bitmap font: ASCII 32..126 in order, cell 95 blank (DEL), then CP437 128..151 (Ç ü é â ä à å ç ê ë è ï î ì Ä Å É æ Æ ô ö ò û ù). */
export const FONT = {
  region: { sheet: "/game/ui/font8x8.png", x: 0, y: 0, w: 120, h: 64 },
  glyphW: 8, glyphH: 8, cols: 15,
  charset: " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\u007f\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9",
  advance: {
    " ": 3, "!": 3, "\"": 6, "#": 9, "$": 9, "%": 7, "&": 8, "'": 3, "(": 4, ")": 4,
    "*": 6, "+": 7, ",": 3, "-": 7, ".": 3, "/": 7, "0": 6, "1": 6, "2": 7, "3": 7,
    "4": 7, "5": 7, "6": 7, "7": 7, "8": 7, "9": 7, ":": 3, ";": 3, "<": 6, "=": 7,
    ">": 6, "?": 7, "@": 9, "A": 7, "B": 7, "C": 7, "D": 7, "E": 6, "F": 6, "G": 7,
    "H": 7, "I": 7, "J": 7, "K": 7, "L": 6, "M": 8, "N": 7, "O": 7, "P": 6, "Q": 8,
    "R": 6, "S": 7, "T": 7, "U": 7, "V": 8, "W": 8, "X": 7, "Y": 7, "Z": 7, "[": 4,
    "\\": 7, "]": 4, "^": 8, "_": 7, "`": 3, "a": 7, "b": 5, "c": 4, "d": 5, "e": 5,
    "f": 5, "g": 5, "h": 5, "i": 5, "j": 5, "k": 5, "l": 4, "m": 8, "n": 5, "o": 6,
    "p": 5, "q": 5, "r": 5, "s": 5, "t": 4, "u": 6, "v": 5, "w": 8, "x": 6, "y": 5,
    "z": 6, "{": 5, "|": 3, "}": 5, "~": 8, "\u007f": 3, "\u00c7": 7, "\u00fc": 6, "\u00e9": 5, "\u00e2": 6,
    "\u00e4": 6, "\u00e0": 6, "\u00e5": 6, "\u00e7": 5, "\u00ea": 5, "\u00eb": 5, "\u00e8": 6, "\u00ef": 5, "\u00ee": 5, "\u00ec": 5,
    "\u00c4": 7, "\u00c5": 7, "\u00c9": 6, "\u00e6": 8, "\u00c6": 8, "\u00f4": 6, "\u00f6": 6, "\u00f2": 6, "\u00fb": 6, "\u00f9": 6,
  },
} satisfies BitmapFont;

/** Left bearing (first visible column) of each glyph inside its 8x8 cell; subtract it when blitting proportionally. */
export const FONT_BEARING = {
  " ": 0, "!": 3, "\"": 1, "#": 0, "$": 0, "%": 1, "&": 1, "'": 3, "(": 2, ")": 3,
  "*": 2, "+": 1, ",": 3, "-": 1, ".": 3, "/": 1, "0": 2, "1": 2, "2": 1, "3": 1,
  "4": 1, "5": 1, "6": 1, "7": 1, "8": 1, "9": 1, ":": 3, ";": 3, "<": 1, "=": 1,
  ">": 2, "?": 1, "@": 0, "A": 1, "B": 1, "C": 1, "D": 1, "E": 1, "F": 1, "G": 1,
  "H": 1, "I": 1, "J": 1, "K": 1, "L": 1, "M": 1, "N": 1, "O": 1, "P": 1, "Q": 1,
  "R": 1, "S": 1, "T": 1, "U": 1, "V": 1, "W": 1, "X": 1, "Y": 1, "Z": 1, "[": 3,
  "\\": 1, "]": 3, "^": 1, "_": 1, "`": 3, "a": 1, "b": 2, "c": 2, "d": 2, "e": 2,
  "f": 2, "g": 2, "h": 2, "i": 2, "j": 1, "k": 2, "l": 2, "m": 1, "n": 2, "o": 1,
  "p": 2, "q": 2, "r": 2, "s": 2, "t": 2, "u": 2, "v": 2, "w": 1, "x": 1, "y": 2,
  "z": 1, "{": 2, "|": 3, "}": 2, "~": 1, "\u007f": 0, "\u00c7": 1, "\u00fc": 2, "\u00e9": 2, "\u00e2": 2,
  "\u00e4": 2, "\u00e0": 2, "\u00e5": 2, "\u00e7": 2, "\u00ea": 2, "\u00eb": 2, "\u00e8": 2, "\u00ef": 2, "\u00ee": 2, "\u00ec": 2,
  "\u00c4": 1, "\u00c5": 1, "\u00c9": 1, "\u00e6": 1, "\u00c6": 1, "\u00f4": 2, "\u00f6": 2, "\u00f2": 2, "\u00fb": 2, "\u00f9": 2,
} satisfies Record<string, number>;

/** Vertical metrics of font8x8 in cell pixels (baseline = last row of 'H'; descenders use row 7). */
export const FONT_METRICS = {
  baseline: 6,
  capHeight: 6,
  xHeight: 5,
  descent: 1,
  lineHeight: 10,
  color: "#0b001e",
} satisfies { baseline: number; capHeight: number; xHeight: number; descent: number; lineHeight: number; color: string };

/** NormalFont.ttf (internal name 'NinjaAdventure'): unitsPerEm 2048 on a 9-unit pixel grid (cap 6px, x-height 5px, descender 2px, line 12px). Use 9px or integer multiples (18, 27, 36). */
export const TTF = { url: "/game/ui/NormalFont.ttf", family: "NinjaNormal", pixelSize: 9 } satisfies { url: string; family: 'NinjaNormal'; pixelSize: number };

/** Speech-bubble emotes, one 14x13 frame each. The tail is bottom-CENTRE (tip pixel at column 7 of 14, rows 11-12 span columns 6-7), so centre the bubble horizontally over the actor's head: draw at (actorCentreX - 7, headY - 13). */
export const EMOTES = {
  surprised: { sheet: "/game/ui/emote1.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  grimace: { sheet: "/game/ui/emote2.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  dizzy: { sheet: "/game/ui/emote3.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  angry: { sheet: "/game/ui/emote4.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  neutral: { sheet: "/game/ui/emote5.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  laughing: { sheet: "/game/ui/emote6.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  puzzled: { sheet: "/game/ui/emote7.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  pleased: { sheet: "/game/ui/emote8.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  smug: { sheet: "/game/ui/emote9.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  unamused: { sheet: "/game/ui/emote10.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  happy: { sheet: "/game/ui/emote11.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  joyful: { sheet: "/game/ui/emote12.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  sad: { sheet: "/game/ui/emote13.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  blank: { sheet: "/game/ui/emote14.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  shocked: { sheet: "/game/ui/emote15.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  wailing: { sheet: "/game/ui/emote16.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  worried: { sheet: "/game/ui/emote17.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  content: { sheet: "/game/ui/emote18.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  frustrated: { sheet: "/game/ui/emote19.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  ellipsis: { sheet: "/game/ui/emote20.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  exclamation: { sheet: "/game/ui/emote21.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  exclamationRed: { sheet: "/game/ui/emote22.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  question: { sheet: "/game/ui/emote23.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  person: { sheet: "/game/ui/emote24.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  questionRed: { sheet: "/game/ui/emote25.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  heartBroken: { sheet: "/game/ui/emote26.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  heart: { sheet: "/game/ui/emote27.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  sleep: { sheet: "/game/ui/emote28.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  star: { sheet: "/game/ui/emote29.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
  cross: { sheet: "/game/ui/emote30.png", x: 0, y: 0, w: 14, h: 13, frames: 1, fps: 1 },
} satisfies Record<string, Anim>;

/** Particle strips (frames laid out to the right). leaf/grass are 6 tumbling variants; rain = 3 drop lengths; snow = twinkle. smoke/smokeCircular fps come from the pack Preview.gifs (100 ms and 60 ms per frame). */
export const FX = {
  leaf: { sheet: "/game/ui/Particle/Leaf.png", x: 0, y: 0, w: 12, h: 7, frames: 6, fps: 8 },
  leafPink: { sheet: "/game/ui/Particle/LeafPink.png", x: 0, y: 0, w: 12, h: 7, frames: 6, fps: 8 },
  grass: { sheet: "/game/ui/Particle/Grass.png", x: 0, y: 0, w: 12, h: 13, frames: 6, fps: 8 },
  clouds: { sheet: "/game/ui/Particle/Clouds.png", x: 0, y: 0, w: 80, h: 36, frames: 1, fps: 1 },
  spark: { sheet: "/game/ui/Particle/Spark.png", x: 0, y: 0, w: 10, h: 8, frames: 7, fps: 12 },
  rain: { sheet: "/game/ui/Particle/Rain.png", x: 0, y: 0, w: 8, h: 8, frames: 3, fps: 12 },
  snow: { sheet: "/game/ui/Particle/Snow.png", x: 0, y: 0, w: 8, h: 8, frames: 7, fps: 8 },
  smoke: { sheet: "/game/ui/Smoke/SpriteSheet.png", x: 0, y: 0, w: 32, h: 32, frames: 6, fps: 10 },
  smokeCircular: { sheet: "/game/ui/SmokeCircular/SpriteSheet.png", x: 0, y: 0, w: 30, h: 14, frames: 8, fps: 16.67 },
} satisfies Record<string, Anim>;

/** Full-screen white+alpha overlays: raylight = 3 diagonal shafts (visible x0..205), fog = 320x180 cloud layer (scroll it). */
export const OVERLAYS = {
  raylight: { sheet: "/game/ui/Environment/Raylight.png", x: 0, y: 0, w: 216, h: 102 },
  fog: { sheet: "/game/ui/Environment/Fog.png", x: 0, y: 0, w: 320, h: 180 },
} satisfies Record<string, Region>;

/** Keyboard key caps (13x13 for letters/arrows; wide keys vary) and device icons. */
export const INPUT_ICONS = {
  up: { sheet: "/game/ui/KeyUp.png", x: 0, y: 0, w: 13, h: 13 },
  down: { sheet: "/game/ui/KeyDown.png", x: 0, y: 0, w: 13, h: 13 },
  left: { sheet: "/game/ui/KeyLeft.png", x: 0, y: 0, w: 13, h: 13 },
  right: { sheet: "/game/ui/KeyRight.png", x: 0, y: 0, w: 13, h: 13 },
  w: { sheet: "/game/ui/KeyW.png", x: 0, y: 0, w: 13, h: 13 },
  a: { sheet: "/game/ui/KeyA.png", x: 0, y: 0, w: 13, h: 13 },
  s: { sheet: "/game/ui/KeyS.png", x: 0, y: 0, w: 13, h: 13 },
  d: { sheet: "/game/ui/KeyD.png", x: 0, y: 0, w: 13, h: 13 },
  z: { sheet: "/game/ui/KeyZ.png", x: 0, y: 0, w: 13, h: 13 },
  x: { sheet: "/game/ui/KeyX.png", x: 0, y: 0, w: 13, h: 13 },
  e: { sheet: "/game/ui/KeyE.png", x: 0, y: 0, w: 13, h: 13 },
  enter: { sheet: "/game/ui/KeyEnter.png", x: 0, y: 0, w: 17, h: 17 },
  shift: { sheet: "/game/ui/KeyShift.png", x: 0, y: 0, w: 30, h: 13 },
  space: { sheet: "/game/ui/KeySpace.png", x: 0, y: 0, w: 33, h: 13 },
  esc: { sheet: "/game/ui/KeyEscape.png", x: 0, y: 0, w: 18, h: 13 },
  tab: { sheet: "/game/ui/KeyTab.png", x: 0, y: 0, w: 22, h: 13 },
  iconKeyboard: { sheet: "/game/ui/IconKeyboard.png", x: 0, y: 0, w: 20, h: 15 },
  iconGamepad: { sheet: "/game/ui/IconGamepad.png", x: 0, y: 0, w: 19, h: 16 },
  iconMouse: { sheet: "/game/ui/IconMouse.png", x: 0, y: 0, w: 9, h: 16 },
} satisfies Record<string, Region>;
