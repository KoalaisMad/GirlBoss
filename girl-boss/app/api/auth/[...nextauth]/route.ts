import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        // Automatically create/update user in database on sign in
        if (user.email && user.name) {
          console.log('📝 Creating/updating user in database:', user.email);
          
          const response = await fetch(`${BACKEND_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ User created/updated:', userData);
            
            // Store user ID in the session (backend now always returns _id)
            if (userData._id) {
              user.id = userData._id;
              console.log('💾 Stored user ID:', userData._id);
            }
          } else {
            console.error('❌ Failed to create user:', await response.text());
          }
        }
        
        return true; // Allow sign in
      } catch (error) {
        console.error('❌ Error in signIn callback:', error);
        return true; // Still allow sign in even if DB fails
      }
    },
    async session({ session, token }: any) {
      // Add user ID to session
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
