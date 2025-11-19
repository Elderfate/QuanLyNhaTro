"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Eye, Download, Edit, Trash2, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmPopover } from "@/components/ui/delete-confirm-popover"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HopDong, Phong, KhachThue, ToaNha } from "@/types"

interface HopDongDataTableProps {
  data: HopDong[]
  phongList: Phong[]
  khachThueList: KhachThue[]
  toaNhaList: ToaNha[]
  onView: (hopDong: HopDong) => void
  onEdit: (hopDong: HopDong) => void
  onDelete: (id: string) => void
  onDownload: (hopDong: HopDong) => void
  onGiaHan: (hopDong: HopDong) => void
  onHuy: (hopDong: HopDong) => void
  actionLoading?: string | null
}

export function HopDongDataTable({ 
  data, 
  phongList, 
  khachThueList, 
  toaNhaList, 
  onView, 
  onEdit, 
  onDelete, 
  onDownload, 
  onGiaHan, 
  onHuy,
  actionLoading 
}: HopDongDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hoatDong':
        return <Badge variant="default">Hoạt động</Badge>;
      case 'hetHan':
        return <Badge variant="destructive">Hết hạn</Badge>;
      case 'daHuy':
        return <Badge variant="secondary">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPhongName = (phong: any) => {
    if (typeof phong === 'object' && phong?.maPhong) {
      return phong.maPhong;
    }
    const phongObj = phongList.find(p => p._id === phong);
    return phongObj?.maPhong || 'Không xác định';
  };

  const getToaNhaName = (toaNha: any) => {
    if (typeof toaNha === 'object' && toaNha?.tenToaNha) {
      return toaNha.tenToaNha;
    }
    const toaNhaObj = toaNhaList.find(t => t._id === toaNha);
    return toaNhaObj?.tenToaNha || 'Không xác định';
  };

  const getPhongInfo = (phong: any) => {
    if (typeof phong === 'object' && phong?.maPhong) {
      return {
        maPhong: phong.maPhong,
        toaNha: phong.toaNha?.tenToaNha || 'Không xác định'
      };
    }
    
    const phongObj = phongList.find(p => p._id === phong);
    if (!phongObj) return { maPhong: 'Không xác định', toaNha: 'Không xác định' };
    
    const toaNha = toaNhaList.find(t => t._id === phongObj.toaNha);
    return {
      maPhong: phongObj.maPhong,
      toaNha: toaNha?.tenToaNha || 'Không xác định'
    };
  };

  const getKhachThueName = (khachThue: any) => {
    if (typeof khachThue === 'object' && khachThue?.hoTen) {
      return khachThue.hoTen;
    }
    const khachThueObj = khachThueList.find(k => k._id === khachThue);
    return khachThueObj?.hoTen || 'Không xác định';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const isExpiringSoon = (ngayKetThuc: Date | string) => {
    const today = new Date();
    const endDate = new Date(ngayKetThuc);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (ngayKetThuc: Date | string) => {
    const today = new Date();
    const endDate = new Date(ngayKetThuc);
    return endDate < today;
  };

  const getWarningBadge = (ngayKetThuc: Date | string) => {
    if (isExpired(ngayKetThuc)) {
      return <Badge variant="destructive">Hết hạn</Badge>;
    } else if (isExpiringSoon(ngayKetThuc)) {
      return <Badge variant="secondary">Sắp hết hạn</Badge>;
    } else {
      return <Badge variant="outline">Bình thường</Badge>;
    }
  };

  const columns: ColumnDef<HopDong>[] = [
    {
      accessorKey: "maHopDong",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mã hợp đồng
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("maHopDong")}</div>,
    },
    {
      accessorKey: "phong",
      header: "Phòng",
      cell: ({ row }) => {
        const phong = row.getValue("phong");
        const phongInfo = getPhongInfo(phong);
        return <div>{phongInfo.maPhong}</div>;
      },
    },
    {
      accessorKey: "toaNha",
      header: "Tòa nhà",
      cell: ({ row }) => {
        const phong = row.getValue("phong");
        const phongInfo = getPhongInfo(phong);
        return <div className="text-gray-600">{phongInfo.toaNha}</div>;
      },
    },
    {
      accessorKey: "nguoiDaiDien",
      header: "Khách thuê",
      cell: ({ row }) => {
        const nguoiDaiDien = row.getValue("nguoiDaiDien");
        return <div>{getKhachThueName(nguoiDaiDien)}</div>;
      },
    },
    {
      accessorKey: "ngayBatDau",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Thời hạn
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const hopDong = row.original;
        return (
          <div className="text-sm">
            <div>Từ: {new Date(hopDong.ngayBatDau).toLocaleDateString('vi-VN')}</div>
            <div>Đến: {new Date(hopDong.ngayKetThuc).toLocaleDateString('vi-VN')}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "giaThue",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Giá thuê
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("giaThue"))
        const formatted = formatCurrency(amount);
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "trangThai",
      header: "Trạng thái",
      cell: ({ row }) => getStatusBadge(row.getValue("trangThai")),
    },
    {
      accessorKey: "ngayKetThuc",
      header: "Cảnh báo",
      cell: ({ row }) => {
        const ngayKetThuc = row.getValue("ngayKetThuc") as Date | string;
        return getWarningBadge(ngayKetThuc);
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const hopDong = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(hopDong._id!);
                  toast.success('Đã sao chép ID hợp đồng');
                }}
              >
                Sao chép ID hợp đồng
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(hopDong)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(hopDong)}>
                <Download className="mr-2 h-4 w-4" />
                Tải xuống
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(hopDong)}>
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              {hopDong.trangThai === 'hoatDong' && (
                <>
                  <DropdownMenuItem 
                    onClick={() => onGiaHan(hopDong)}
                    disabled={actionLoading === `giahan-${hopDong._id}`}
                  >
                    {actionLoading === `giahan-${hopDong._id}` ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Đang gia hạn...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Gia hạn
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onHuy(hopDong)}
                    className="text-orange-600"
                    disabled={actionLoading === `huy-${hopDong._id}`}
                  >
                    {actionLoading === `huy-${hopDong._id}` ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Đang hủy...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hủy hợp đồng
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="p-0">
                <DeleteConfirmPopover
                  onConfirm={() => onDelete(hopDong._id!)}
                  title="Xóa hợp đồng"
                  description="Bạn có chắc chắn muốn xóa hợp đồng này? Tất cả dữ liệu liên quan sẽ bị mất và không thể khôi phục."
                  buttonVariant="ghost"
                  buttonSize="sm"
                  iconOnly={false}
                  className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Tìm kiếm theo mã hợp đồng..."
          value={(table.getColumn("maHopDong")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("maHopDong")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Cột <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có dữ liệu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Hiển thị {table.getRowModel().rows.length} hợp đồng
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
