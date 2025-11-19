import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NguoiDungGS } from '@/lib/googlesheets-models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await NguoiDungGS.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      _id: user._id,
      name: user.ten || user.name,
      email: user.email,
      phone: user.soDienThoai || user.phone,
      address: user.diaChi || user.address,
      avatar: user.anhDaiDien || user.avatar,
      role: user.vaiTro || user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address, avatar } = body;

    const user = await NguoiDungGS.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await NguoiDungGS.findByIdAndUpdate(user._id, {
      ten: name,
      soDienThoai: phone,
      diaChi: address,
      anhDaiDien: avatar,
      updatedAt: new Date().toISOString()
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({
      _id: updatedUser._id,
      name: updatedUser.ten || updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.soDienThoai || updatedUser.phone,
      address: updatedUser.diaChi || updatedUser.address,
      avatar: updatedUser.anhDaiDien || updatedUser.avatar,
      role: updatedUser.vaiTro || updatedUser.role,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
