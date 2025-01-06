type NestedObject = Record<string, unknown> | unknown[];

export const updateNestedValue = (obj: NestedObject, path: string, value: unknown) => {
  const keys = path.split('.');
  let current = obj as Record<string, unknown>;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key]) current[key] = {};
      current = current[key] as Record<string, unknown>;
    }
  });
};
