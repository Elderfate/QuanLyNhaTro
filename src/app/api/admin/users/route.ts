import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NguoiDungGS } from '@/lib/googlesheets-models';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await NguoiDungGS.find();
    
    // Remove password fields and sort by createdAt
    const usersWithoutPassword = users
      .map((user: any) => {
        const { password, matKhau, ...userWithoutPassword } = user;
        return userWithoutPassword;
      })
      .sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    
    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, phone, role } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const allUsers = await NguoiDungGS.find();
    const existingUser = allUsers.find((user: any) => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await NguoiDungGS.create({
      _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      // Vietnamese fields
      ten: name,
      email: email.toLowerCase(),
      matKhau: hashedPassword,
      soDienThoai: phone || '',
      vaiTro: role,
      trangThai: 'hoatDong',
      // English fields
      name,
      password: hashedPassword,
      phone: phone || '',
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ngayTao: new Date().toISOString(),
      ngayCapNhat: new Date().toISOString(),
    });

    // Return user without password
    const { password: _, matKhau: __, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
