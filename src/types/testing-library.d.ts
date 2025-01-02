declare module '@testing-library/react' {
  export * from '@testing-library/react/types';
  export { screen, fireEvent, waitFor, render } from '@testing-library/dom';
}

declare module '@testing-library/jest-dom' {
  export * from '@testing-library/jest-dom/matchers';
}
