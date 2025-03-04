import { isObject, cloneDeep } from 'lodash';

/**
 * Deeply merges two objects, properly handling arrays and nested objects.
 * If a property exists in both objects, the source value overwrites the target value.
 * For arrays, the source array replaces the target array.
 *
 * @param target The target object to merge into
 * @param source The source object to merge from
 * @returns A new object with merged properties
 */
export function mergeDeep<
  T extends Record<string, unknown>,
  S extends Record<string, unknown>,
>(target: T, source: S): T & S {
  // Create deep clones to avoid mutations
  const output = cloneDeep(target) as Record<string, unknown>;
  const clonedSource = cloneDeep(source);

  // If either isn't an object, return source
  if (!isObject(target) || !isObject(source)) {
    return clonedSource as T & S;
  }

  // Loop through source object keys
  Object.keys(clonedSource).forEach((key) => {
    const targetValue = output[key];
    const sourceValue = clonedSource[key];

    // Handle source value is null or undefined (explicit overwrite)
    if (sourceValue === null || sourceValue === undefined) {
      output[key] = sourceValue;
      return;
    }

    // If both values are objects, deep merge them
    if (isObject(targetValue) && isObject(sourceValue) && !Array.isArray(sourceValue)) {
      output[key] = mergeDeep(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as Record<string, unknown>;
    } else {
      // For arrays and primitive values, use source value
      output[key] = cloneDeep(sourceValue) as unknown;
    }
  });

  return output as T & S;
}

/**
 * Updates a specific field in an object using a path string,
 * preserving other fields and properly handling nested objects.
 *
 * @param obj The object to update
 * @param path Path to the property in dot notation (e.g., 'user.address.city')
 * @param value The value to set
 * @returns A new object with the updated field
 */
export function updateField<T extends Record<string, unknown>, V>(
  obj: T,
  path: string,
  value: V
): T {
  const cloned = cloneDeep(obj);
  const parts = path.split('.');

  let current: Record<string, unknown> = cloned;
  const lastPart = parts.pop() || '';

  // Navigate to the nested object that contains the field
  for (const part of parts) {
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  // Set the field value
  current[lastPart] = value;

  return cloned;
}

/**
 * Creates an object with a nested structure based on a path string
 * and a value.
 *
 * @param path Path to the property in dot notation (e.g., 'user.address.city')
 * @param value The value to set at the path
 * @returns A new object with the nested structure
 */
export function createNestedObject<V>(path: string, value: V): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const parts = path.split('.');

  let current = result;
  const lastPart = parts.pop() || '';

  // Create nested object structure
  for (const part of parts) {
    current[part] = {};
    current = current[part] as Record<string, unknown>;
  }

  // Set the value at the end
  current[lastPart] = value;

  return result;
}
