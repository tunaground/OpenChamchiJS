import bcrypt from "bcryptjs";

// Default salt for tripcode generation (used if admin doesn't configure one)
// Format: $2a$10$ + 22 characters
export const DEFAULT_TRIPCODE_SALT = "$2a$10$OpenChamchiJSDefault0.";

/**
 * Generate tripcode from username
 * If username contains #, the part after # is hashed and appended with ◆
 * Example: "홍길동#secret" -> "홍길동◆abcdef1234"
 */
export async function generateTripcode(
  name: string,
  salt: string = DEFAULT_TRIPCODE_SALT
): Promise<string> {
  // Replace ◆ with <> to prevent spoofing
  name = name.replace(/◆/g, "<>");

  const parts = name.split("#");
  if (parts.length >= 2) {
    const displayName = parts[0];
    const secret = parts.slice(1).join("#");
    const hash = await bcrypt.hash(secret, salt);
    const tripcode = hash.substring(hash.length - 10);
    return `${displayName}◆${tripcode}`;
  }

  return name;
}
