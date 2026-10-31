import type { Circle, Rect } from './types';

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/** Пересекаются ли круг и прямоугольник. */
export function circleIntersectsRect(circle: Circle, rect: Rect): boolean {
  // Ближайшая к центру круга точка прямоугольника
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.height);

  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;

  return dx * dx + dy * dy < circle.radius * circle.radius;
}
