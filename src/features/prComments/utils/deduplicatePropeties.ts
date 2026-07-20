export const deduplicateProperties = <T, K extends keyof T>(
  properties: T[],
  key: K,
): T[] => {
  const uniquePropertiesMap = new Map<T[K], T>();

  for (const property of properties) {
    const keyValue = property[key];
    const exisitingProperty = uniquePropertiesMap.get(keyValue);
    
    if (!exisitingProperty) {
      uniquePropertiesMap.set(keyValue, property);
    }
  }
  return Array.from(uniquePropertiesMap.values());
};
