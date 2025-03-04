import { get, cloneDeep, merge } from 'lodash';

/**
 * Deep merges objects while preserving nested structures
 * Use this to avoid losing nested data during partial updates
 *
 * This enhanced version provides additional logging and handles complex object structures
 */
export function deepMergeObjects<T>(target: T, ...sources: Partial<T>[]): T {
  console.log('Deep merging objects:', {
    target,
    sources,
  });

  // First create a deep clone to avoid mutating the original object
  const clonedTarget = cloneDeep(target);

  // Then perform the merge with each source
  const result = merge({}, clonedTarget, ...sources);

  console.log('Merge result:', result);
  return result;
}

/**
 * Creates a nested object from a dot-notation path and value
 * @example
 * // Returns { user: { profile: { name: 'John' } } }
 * createNestedObject('user.profile.name', 'John')
 */
export function createNestedObject(
  path: string,
  value: unknown
): Record<string, unknown> {
  console.log(`Creating nested object for path: ${path}`, { value });

  const result: Record<string, unknown> = {};
  const parts = path.split('.');

  let current = result;
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  console.log('Created nested object:', result);
  return result;
}

/**
 * Helper function that merges update data into current document data for API updates
 * Prevents the loss of nested object structures by doing a recursive merge
 */
export function prepareUpdateData(
  currentData: Record<string, unknown>,
  updateData: Record<string, unknown>
): Record<string, unknown> {
  console.log('Preparing update data with current document:', {
    currentDataKeys: Object.keys(currentData),
    updateDataKeys: Object.keys(updateData),
  });

  // Create deep clones to avoid reference issues
  const currentClone = cloneDeep(currentData);
  const updateClone = cloneDeep(updateData);

  const result: Record<string, unknown> = {};

  // Process each top-level field in the update data
  for (const [key, value] of Object.entries(updateClone)) {
    // Handle objects that need special merge logic
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      isPreservedObjectKey(key) &&
      currentClone[key] &&
      typeof currentClone[key] === 'object' &&
      !Array.isArray(currentClone[key])
    ) {
      console.log(`Deep merging object for key: ${key}`);
      // Recursively merge this object
      result[key] = mergeObjectsRecursive(
        currentClone[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      // For other types (primitives, arrays, or objects that should be replaced)
      console.log(`Setting direct value for key: ${key}`);
      result[key] = value;
    }
  }

  console.log('Final prepared update data:', result);
  return result;
}

/**
 * Recursively merges two objects with special handling for arrays and complex objects
 */
function mergeObjectsRecursive(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  // Create deep clones
  const targetClone = cloneDeep(target);
  const sourceClone = cloneDeep(source);

  // Start with all properties from target
  const result = { ...targetClone };

  // Add or override with properties from source
  for (const [key, sourceValue] of Object.entries(sourceClone)) {
    // If source value is an object and not an array
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue)
    ) {
      // If the target also has this key as an object
      if (
        targetClone[key] &&
        typeof targetClone[key] === 'object' &&
        !Array.isArray(targetClone[key])
      ) {
        // Recursively merge these objects
        result[key] = mergeObjectsRecursive(
          targetClone[key] as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        // Target doesn't have this key or it's not an object, just use source value
        result[key] = sourceValue;
      }
    } else {
      // For primitives or arrays, just use the source value
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Processes data with special handling for known object structures to preserve them
 */
function isPreservedObjectKey(key: string): boolean {
  const preservedKeys = [
    'metadata',
    'details',
    'user',
    'preferences',
    'bonus',
    'source',
    'processing_status',
    'ai_insights',
    'logo',
    'availability',
    'requirements',
  ];

  return preservedKeys.some(
    (preservedKey) => key === preservedKey || key.endsWith(`.${preservedKey}`)
  );
}

/**
 * Processes a data object for Firestore updates, handling nested fields
 * Converts nested objects to dot notation paths for Firestore
 *
 * Enhanced to be more careful with array handling and special objects
 */
export function processNestedUpdates(
  data: Record<string, unknown>,
  currentData: Record<string, unknown> = {},
  prefix = '',
  depth = 0
): Record<string, unknown> {
  const maxDepth = 10; // Prevent infinite recursion
  if (depth > maxDepth) {
    console.warn(
      `Maximum nesting depth (${maxDepth}) exceeded in processNestedUpdates for prefix: ${prefix}`
    );
    return { [prefix]: data };
  }

  console.log(`Processing nested updates ${prefix ? `for prefix ${prefix}` : ''}:`, data);

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    // Check if this is a non-null object that should be processed recursively
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Special handling for objects that should be deep merged, not replaced
      if (isPreservedObjectKey(fullKey)) {
        console.log(`Preserving object structure for key: ${fullKey}`);

        // Get the existing data for this key if available
        const existingValue = get(currentData, fullKey);

        if (
          existingValue &&
          typeof existingValue === 'object' &&
          !Array.isArray(existingValue)
        ) {
          // Deep merge with existing data instead of replacing
          console.log(`Deep merging existing data for key: ${fullKey}`, {
            existingValue,
          });
          result[fullKey] = merge({}, existingValue, value);
        } else {
          result[fullKey] = value;
        }
      } else if (Object.keys(value as Record<string, unknown>).length === 0) {
        // Handle empty objects
        console.log(`Empty object found for key: ${fullKey}`);
        result[fullKey] = {};
      } else {
        // Process nested objects recursively
        console.log(`Recursively processing object for key: ${fullKey}`);

        // Get the existing data for this path to merge with
        const existingNestedData = get(currentData, fullKey) || {};

        Object.assign(
          result,
          processNestedUpdates(
            value as Record<string, unknown>,
            existingNestedData as Record<string, unknown>,
            fullKey,
            depth + 1
          )
        );
      }
    } else {
      // Handle primitive values (including arrays)
      console.log(`Setting value for key: ${fullKey}`, value);
      result[fullKey] = value;
    }
  }

  console.log(`Processed result for ${prefix || 'root'}:`, result);
  return result;
}

/**
 * Safe object property accessor
 * @param obj The object to get the property from
 * @param path The path to the property
 * @param defaultValue A default value if the property doesn't exist
 * @returns The property value or the default value
 */
export function getProperty<T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue: T
): T {
  const value = get(obj, path);
  return value === undefined ? defaultValue : (value as T);
}

// Add other object utility functions here
