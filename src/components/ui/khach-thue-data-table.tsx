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
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { KhachThue } from "@/types"
import { Phone, Mail, MapPin, Eye, Edit, Trash2 } from "lucide-react"

interface KhachThueDataTableProps {
  data: KhachThue[]
  onEdit: (khachThue: KhachThue) => void
  onDelete: (id: string) => void
  onView?: (khachThue: KhachThue) => void
  actionLoading?: string | null
}

export const columns = (
  onEdit: (khachThue: KhachThue) => void,
  onDelete: (id: string) => void,
  onView?: (khachThue: KhachThue) => void,
  actionLoading?: string | null
): ColumnDef<KhachThue>[] => [
  {
    accessorKey: "hoTen",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Họ tên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("hoTen")}</div>
    ),
  },
  {
    accessorKey: "soDienThoai",
    header: "Số điện thoại",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-gray-400" />
        {row.getValue("soDienThoai")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string
      return email ? (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          {email}
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
  },
  {
    accessorKey: "cccd",
    header: "CCCD",
    cell: ({ row }) => <div>{row.getValue("cccd")}</div>,
  },
  {
    accessorKey: "gioiTinh",
    header: "Giới tính",
    cell: ({ row }) => {
      const gioiTinh = row.getValue("gioiTinh") as string
      const labels = {
        nam: 'Nam',
        nu: 'Nữ',
        khac: 'Khác',
      }
      return <div>{labels[gioiTinh as keyof typeof labels] || 'Khác'}</div>
    },
  },
  {
    accessorKey: "queQuan",
    header: "Quê quán",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-400" />
        <span className="text-sm">{row.getValue("queQuan")}</span>
      </div>
    ),
  },
  {
    accessorKey: "trangThai",
    header: "Trạng thái",
    cell: ({ row }) => {
      const trangThai = row.getValue("trangThai") as string
      const variants = {
        dangThue: { variant: 'default' as const, label: 'Đang thuê' },
        daTraPhong: { variant: 'secondary' as const, label: 'Đã trả phòng' },
        chuaThue: { variant: 'outline' as const, label: 'Chưa thuê' },
      }
      
      const config = variants[trangThai as keyof typeof variants] || variants.chuaThue
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    accessorKey: "phongHienTai",
    header: "Phòng hiện tại",
    cell: ({ row }) => {
      const khachThue = row.original;
      const hopDong = (khachThue as any).hopDongHienTai;
      
      if (!hopDong || !hopDong.phong) {
        return <div className="text-gray-400">Chưa thuê</div>;
      }
      
      return (
        <div className="text-sm">
          <div className="font-medium">{hopDong.phong.maPhong}</div>
          <div className="text-gray-500 text-xs">
            {hopDong.phong.toaNha?.tenToaNha || 'N/A'}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const khachThue = row.original

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
                navigator.clipboard.writeText(khachThue._id!);
                toast.success('Đã sao chép ID khách thuê');
              }}
            >
              Sao chép ID khách thuê
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onView && (
              <DropdownMenuItem onClick={() => onView(khachThue)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(khachThue)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(khachThue._id!)}
              className="text-red-600"
              disabled={actionLoading === `delete-${khachThue._id}`}
            >
              {actionLoading === `delete-${khachThue._id}` ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function KhachThueDataTable({
  data,
  onEdit,
  onDelete,
  onView,
  actionLoading
}: KhachThueDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns: columns(onEdit, onDelete, onView, actionLoading),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Tìm kiếm theo tên, SĐT, CCCD..."
          value={(table.getColumn("hoTen")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("hoTen")?.setFilterValue(event.target.value)
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
                    {                     column.id === "hoTen" ? "Họ tên" :
                     column.id === "soDienThoai" ? "Số điện thoại" :
                     column.id === "email" ? "Email" :
                     column.id === "cccd" ? "CCCD" :
                     column.id === "gioiTinh" ? "Giới tính" :
                     column.id === "queQuan" ? "Quê quán" :
                     column.id === "trangThai" ? "Trạng thái" :
                     column.id === "phongHienTai" ? "Phòng hiện tại" :
                     column.id}
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
                  colSpan={columns(onEdit, onDelete, onView, actionLoading).length}
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
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} hàng được chọn.
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
