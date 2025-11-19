'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, AlertCircle, Search, HelpCircle } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-2xl mx-auto px-4">
        {/* 404 Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-20 w-20 text-gray-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">
            Trang không tìm thấy
          </h2>
        </div>

        {/* Main Error Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Có gì đó không đúng?
            </CardTitle>
            <CardDescription>
              Trang bạn đang tìm kiếm không tồn tại trong hệ thống dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Đây có thể là do:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 text-left max-w-sm mx-auto">
              <li>• URL không chính xác hoặc đã lỗi thời</li>
              <li>• Trang đã được di chuyển hoặc xóa</li>
              <li>• Bạn không có quyền truy cập trang này</li>
              <li>• Liên kết bị hỏng hoặc không hợp lệ</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto px-6 py-3">
              <Home className="h-4 w-4 mr-2" />
              Về Dashboard
            </Button>
          </Link>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto px-6 py-3"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>

        {/* Quick Navigation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-center gap-2">
              <Search className="h-4 w-4" />
              Có thể bạn đang tìm kiếm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <Link href="/dashboard/phong" className="text-blue-600 hover:underline">
                Quản lý phòng
              </Link>
              <Link href="/dashboard/khach-thue" className="text-blue-600 hover:underline">
                Khách thuê
              </Link>
              <Link href="/dashboard/hoa-don" className="text-blue-600 hover:underline">
                Hóa đơn
              </Link>
              <Link href="/dashboard/hop-dong" className="text-blue-600 hover:underline">
                Hợp đồng
              </Link>
              <Link href="/dashboard/su-co" className="text-blue-600 hover:underline">
                Sự cố
              </Link>
              <Link href="/dashboard/thanh-toan" className="text-blue-600 hover:underline">
                Thanh toán
              </Link>
              <Link href="/dashboard/toa-nha" className="text-blue-600 hover:underline">
                Tòa nhà
              </Link>
              <Link href="/dashboard/thong-bao" className="text-blue-600 hover:underline">
                Thông báo
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Support Info */}
        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật.</p>
          <p>Mã lỗi: DASHBOARD-404 | Thời gian: {new Date().toLocaleString('vi-VN')}</p>
        </div>
      </div>
    </div>
  );
}
