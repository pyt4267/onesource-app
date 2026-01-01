import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            // On sign in, add the Google ID to the token
            if (account && profile) {
                token.googleId = profile.sub;
            }
            return token;
        },
        async session({ session, token }) {
            // Expose Google ID in the session
            if (token.googleId) {
                (session as any).googleId = token.googleId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/", // Redirect to home page for sign in
    },
});
