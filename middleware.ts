export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/entries/:path*", "/admin/:path*"],
};
