"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Map các route sang tiếng Việt
const routeNameMap: Record<string, string> = {
  dashboard: "Tổng quan",
  "toa-nha": "Tòa nhà",
  phong: "Phòng",
  "khach-thue": "Khách thuê",
  "hop-dong": "Hợp đồng",
  "hoa-don": "Hóa đơn",
  "thanh-toan": "Thanh toán",
  "su-co": "Sự cố",
  "thong-bao": "Thông báo",
  "ho-so": "Hồ sơ",
  "cai-dat": "Cài đặt",
  "quan-ly-tai-khoan": "Quản lý tài khoản",
  "them-moi": "Thêm mới",
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)

  // Nếu đang ở trang dashboard chính, chỉ hiển thị Home
  if (pathSegments.length <= 1) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Trang chủ
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathSegments.slice(1).map((segment, index) => {
          const isLast = index === pathSegments.length - 2
          const href = `/${pathSegments.slice(0, index + 2).join("/")}`
          const displayName = routeNameMap[segment] || segment

          return (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{displayName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

