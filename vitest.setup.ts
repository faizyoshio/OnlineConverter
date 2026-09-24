import "@testing-library/jest-dom/vitest";

/* Override jsdom's broken URL.createObjectURL — its default
   implementation reads `_buffer` which jsdom File objects lack,
   causing "Cannot read properties of undefined (reading '_buffer')"
   when FilePreview renders.  */
URL.createObjectURL = () => "blob:mock";
URL.revokeObjectURL = () => {};
