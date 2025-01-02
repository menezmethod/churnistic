declare module '@testing-library/react' {
  export * from '@testing-library/react/types';
  export function render(ui: React.ReactElement, options?: any): any;
  export const screen: {
    getByText: (text: string | RegExp) => HTMLElement;
    getByRole: (role: string, options?: { name?: string | RegExp }) => HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getAllByTestId: (id: string) => HTMLElement[];
    getByLabelText: (label: string | RegExp) => HTMLElement;
    queryByText: (text: string | RegExp) => HTMLElement | null;
    queryByRole: (
      role: string,
      options?: { name?: string | RegExp }
    ) => HTMLElement | null;
    queryByTestId: (id: string) => HTMLElement | null;
    queryByLabelText: (label: string | RegExp) => HTMLElement | null;
    findByText: (text: string | RegExp) => Promise<HTMLElement>;
    findByRole: (
      role: string,
      options?: { name?: string | RegExp }
    ) => Promise<HTMLElement>;
    findByTestId: (id: string) => Promise<HTMLElement>;
    findByLabelText: (label: string | RegExp) => Promise<HTMLElement>;
  };
  export function waitFor(
    callback: () => void | Promise<void>,
    options?: any
  ): Promise<void>;
}
