import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "school_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "school_refresh_secret";

export const refreshTokenService = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

    const newAccessToken = jwt.sign(
      { user_id: decoded.user_id, role_id: decoded.role_id },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};
