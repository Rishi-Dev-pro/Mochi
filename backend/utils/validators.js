// Validation utilities placeholder
export function validateRequestBody(body, requiredKeys) {
  return requiredKeys.every((key) => key in body);
}
