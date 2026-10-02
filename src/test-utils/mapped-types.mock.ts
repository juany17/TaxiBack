/**
 * Doble de prueba para `@nestjs/mapped-types`.
 *
 * El paquete es ESM puro; Jest compila a CommonJS. La aplicacion solo usa
 * `PartialType` para derivar DTOs, asi que se expone un decorador inerte.
 */
export const PartialType = (classRef: unknown): new (...args: never[]) => unknown =>
  class PartialTypeStub {};

export const PickType = (classRef: unknown): new (...args: never[]) => unknown =>
  class PickTypeStub {};

export const OmitType = (classRef: unknown): new (...args: never[]) => unknown =>
  class OmitTypeStub {};

export const IntersectionType = (
  ...classRefs: unknown[]
): new (...args: never[]) => unknown => class IntersectionTypeStub {};
