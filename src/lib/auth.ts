import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
import { NguoiDungGS } from './googlesheets-models';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        matKhau: { label: 'Mật khẩu', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.matKhau) {
          console.log('❌ Missing credentials');
          return null;
        }

        try {
          const emailLower = credentials.email.toLowerCase().trim();
          console.log('🔍 Looking for user:', emailLower);
          const user = await NguoiDungGS.findOne({ 
            email: emailLower,
            trangThai: 'hoatDong'
          });

          if (!user) {
            console.log('❌ User not found');
            return null;
          }

          if (!user.matKhau) {
            console.log('❌ User has no password hash');
            return null;
          }

          if (!user._id) {
            console.log('❌ User has no _id');
            return null;
          }

          console.log('✅ User found:', user.email);
          console.log('   Password hash type:', typeof user.matKhau);
          console.log('   Password hash length:', user.matKhau?.length);
          
          // Ensure matKhau is a string (not parsed as JSON)
          const passwordHash = typeof user.matKhau === 'string' ? user.matKhau : String(user.matKhau);
          
          const isPasswordValid = await compare(credentials.matKhau, passwordHash);

          if (!isPasswordValid) {
            console.log('❌ Password invalid');
            return null;
          }

          console.log('✅ Password valid, returning user');
          return {
            id: user._id.toString(),
            email: user.email as string,
            name: user.ten as string,
            role: user.vaiTro as string,
            phone: user.soDienThoai as string,
            avatar: user.anhDaiDien as string,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
          if (error instanceof Error) {
            console.error('   Error message:', error.message);
            console.error('   Error stack:', error.stack);
          }
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/dang-nhap',
    error: '/dang-nhap',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
