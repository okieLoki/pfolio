// Night lighting: a view-sized light map filled with the ambient tint, with
// additive radial lights punched in, multiplied over the scene. Then a soft
// bloom pass so lanterns visibly glow.

import type { Ambient } from './daylight';
import type { Light } from '../world/world';
import { makeCanvas, type Ctx } from '../core/gfx';

export class Lighting {
  private canvas: HTMLCanvasElement;
  private g: Ctx;

  constructor(w: number, h: number) {
    [this.canvas, this.g] = makeCanvas(w, h);
  }

  resize(w: number, h: number) {
    if (this.canvas.width !== w || this.canvas.height !== h) [this.canvas, this.g] = makeCanvas(w, h);
  }

  /**
   * @param lights world-space light list
   * @param cam camera top-left in world px
   * @param time seconds, for flicker
   */
  apply(scene: Ctx, ambient: Ambient, lights: Light[], cam: { x: number; y: number }, time: number) {
    const { width: w, height: h } = this.canvas;
    const g = this.g;
    const dark = ambient.tint !== '#ffffff';
    if (!dark && !ambient.haze) return;

    if (dark) {
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = ambient.tint;
      g.fillRect(0, 0, w, h);
      if (ambient.lights) {
        g.globalCompositeOperation = 'lighter';
        for (const l of lights) {
          const x = l.x - cam.x, y = l.y - cam.y;
          const r = l.radius * (l.flicker ? 1 + 0.05 * Math.sin(time * 9 + l.x) : 1);
          if (x < -r || y < -r || x > w + r || y > h + r) continue;
          const grad = g.createRadialGradient(x, y, 0, x, y, r);
          grad.addColorStop(0, l.color);
          grad.addColorStop(0.45, l.color + '99');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grad;
          g.fillRect(x - r, y - r, r * 2, r * 2);
        }
      }
      scene.globalCompositeOperation = 'multiply';
      scene.drawImage(this.canvas, 0, 0);
      // bloom: a second, smaller additive pass so light sources read as glowing
      if (ambient.lights) {
        scene.globalCompositeOperation = 'lighter';
        scene.globalAlpha = 0.35;
        for (const l of lights) {
          const x = l.x - cam.x, y = l.y - cam.y, r = l.radius * 0.5;
          if (x < -r || y < -r || x > w + r || y > h + r) continue;
          const grad = scene.createRadialGradient(x, y, 0, x, y, r);
          grad.addColorStop(0, l.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          scene.fillStyle = grad;
          scene.fillRect(x - r, y - r, r * 2, r * 2);
        }
        scene.globalAlpha = 1;
      }
    }
    if (ambient.haze && ambient.hazeAlpha > 0) {
      scene.globalCompositeOperation = 'lighter';
      scene.globalAlpha = ambient.hazeAlpha;
      const grad = scene.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, ambient.haze);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      scene.fillStyle = grad;
      scene.fillRect(0, 0, w, h);
      scene.globalAlpha = 1;
    }
    scene.globalCompositeOperation = 'source-over';
  }
}
