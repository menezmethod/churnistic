declare module '@testing-library/react' {
  export function render(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'queries'> & {
      fallback?: React.ReactElement;
    }
  ): RenderResult;
}
