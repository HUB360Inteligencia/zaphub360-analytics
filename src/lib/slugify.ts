// Utility function to generate URL-friendly slugs

/**
 * Generate a URL-friendly slug from a string
 * Handles Portuguese characters and special characters
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace Portuguese characters
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate a unique slug by appending a number if needed
 */
export const generateUniqueSlug = (
  baseText: string, 
  existingSlugs: string[]
): string => {
  let slug = slugify(baseText);
  let counter = 1;
  
  // If slug already exists, append a number
  while (existingSlugs.includes(slug)) {
    slug = `${slugify(baseText)}-${counter}`;
    counter++;
  }
  
  return slug;
};
