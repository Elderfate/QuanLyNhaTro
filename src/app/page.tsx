import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br ">
      <div className=" mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
            Hệ thống quản lý phòng trọ
          </h1>
          <p className="text-sm md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Hệ thống quản lý phòng trọ hiện đại và tiện lợi
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center px-4 max-w-md mx-auto">
            <Link href="/dang-nhap" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-4 text-base md:text-lg">
                <LogIn className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Đăng nhập
              </Button>
            </Link> 
            <Link href="/xem-phong" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 md:px-10 py-3 md:py-4 text-base md:text-lg">
                <HomeIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Xem phòng
              </Button>
            </Link>
          </div>
        </div>

        {/* Simple Info */}
        <div className="text-center px-4">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 lg:p-10 max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Chào mừng bạn đến với hệ thống
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-gray-600 mb-6">
              Vui lòng chọn một trong hai tùy chọn phía trên để tiếp tục
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Đăng nhập</h3>
                <p className="text-sm text-blue-600">Dành cho quản trị viên hệ thống</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Xem phòng</h3>
                <p className="text-sm text-green-600">Xem danh sách phòng trọ có sẵn</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
