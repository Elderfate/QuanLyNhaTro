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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Eye, Copy, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Phong } from "@/types"
import { DeleteConfirmPopover } from "@/components/ui/delete-confirm-popover"
import { ImageCarousel } from "@/components/ui/image-carousel"

interface PhongDataTableProps {
  data: Phong[]
  onEdit: (phong: Phong) => void
  onDelete: (id: string) => void
}

export function PhongDataTable({ data, onEdit, onDelete }: PhongDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const getTrangThaiBadge = (trangThai: string) => {
    const variants = {
      trong: { variant: 'secondary' as const, label: 'Trống' },
      daDat: { variant: 'outline' as const, label: 'Đã đặt' },
      dangThue: { variant: 'default' as const, label: 'Đang thuê' },
      baoTri: { variant: 'destructive' as const, label: 'Bảo trì' },
    };
    
    const config = variants[trangThai as keyof typeof variants] || variants.trong;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns: ColumnDef<Phong>[] = [
    {
      accessorKey: "maPhong",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mã phòng
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("maPhong")}</div>,
    },
    {
      accessorKey: "toaNha",
      header: "Tòa nhà",
      cell: ({ row }) => {
        const toaNha = row.getValue("toaNha") as any;
        return <div>{typeof toaNha === 'object' ? toaNha.tenToaNha : 'N/A'}</div>;
      },
    },
    {
      accessorKey: "tang",
      header: "Tầng",
      cell: ({ row }) => <div>{row.getValue("tang")}</div>,
    },
    {
      accessorKey: "dienTich",
      header: "Diện tích",
      cell: ({ row }) => <div>{row.getValue("dienTich")} m²</div>,
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
        const formatted = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "trangThai",
      header: "Trạng thái",
      cell: ({ row }) => getTrangThaiBadge(row.getValue("trangThai")),
    },
    {
      accessorKey: "khachThue",
      header: "Khách thuê hiện tại",
      cell: ({ row }) => {
        const phong = row.original;
        const hopDong = (phong as any).hopDongHienTai;
        
        if (!hopDong || !hopDong.khachThueId || hopDong.khachThueId.length === 0) {
          return <div className="text-gray-400">Trống</div>;
        }
        
        return (
          <div className="space-y-1">
            {hopDong.khachThueId.map((khach: any, index: number) => (
              <div key={khach._id} className="text-sm">
                <span className="font-medium">{khach.hoTen}</span>
                {hopDong.nguoiDaiDien && hopDong.nguoiDaiDien._id === khach._id && (
                  <span className="text-xs text-blue-600 ml-1">(Đại diện)</span>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "soNguoiToiDa",
      header: "Số người tối đa",
      cell: ({ row }) => <div>{row.getValue("soNguoiToiDa")}</div>,
    },
    {
      accessorKey: "anhPhong",
      header: "Ảnh phòng",
      cell: ({ row }) => {
        const anhPhong = row.getValue("anhPhong") as string[];
        if (!anhPhong || anhPhong.length === 0) {
          return <div className="text-gray-400 text-sm">Chưa có ảnh</div>;
        }
        return (
          <div className="flex items-center space-x-2">
            <div className="relative w-12 h-8 rounded overflow-hidden">
              <img
                src={anhPhong[0]}
                alt="Ảnh phòng"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col space-y-1">
              {anhPhong.length > 1 && (
                <span className="text-xs text-gray-500">+{anhPhong.length - 1}</span>
              )}
              <div className="flex space-x-1">
                <ImageCarousel
                  images={anhPhong}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Xem ảnh">
                      <Eye className="h-3 w-3" />
                    </Button>
                  }
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  title="Copy link chia sẻ"
                  onClick={() => {
                    const phong = row.original;
                    const publicUrl = `${window.location.origin}/xem-phong?phong=${phong.maPhong}`;
                    navigator.clipboard.writeText(publicUrl);
                    toast.success('Đã sao chép link chia sẻ phòng');
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const phong = row.original

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
                  const publicUrl = `${window.location.origin}/xem-phong?phong=${phong.maPhong}`;
                  navigator.clipboard.writeText(publicUrl);
                  toast.success('Đã sao chép link chia sẻ phòng');
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Sao chép link chia sẻ
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const publicUrl = `${window.location.origin}/xem-phong?phong=${phong.maPhong}`;
                  window.open(publicUrl, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Xem trang công khai
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(phong._id!);
                  toast.success('Đã sao chép ID phòng');
                }}
              >
                Sao chép ID phòng
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(phong)}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-0">
                <DeleteConfirmPopover
                  onConfirm={() => onDelete(phong._id!)}
                  title="Xóa phòng"
                  description="Bạn có chắc chắn muốn xóa phòng này? Tất cả dữ liệu liên quan sẽ bị mất và không thể khôi phục."
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
          placeholder="Tìm kiếm theo mã phòng..."
          value={(table.getColumn("maPhong")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("maPhong")?.setFilterValue(event.target.value)
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
                    {column.id === "maPhong" ? "Mã phòng" :
                     column.id === "toaNha" ? "Tòa nhà" :
                     column.id === "tang" ? "Tầng" :
                     column.id === "dienTich" ? "Diện tích" :
                     column.id === "giaThue" ? "Giá thuê" :
                     column.id === "trangThai" ? "Trạng thái" :
                     column.id === "khachThue" ? "Khách thuê hiện tại" :
                     column.id === "soNguoiToiDa" ? "Số người tối đa" :
                     column.id === "anhPhong" ? "Ảnh phòng" :
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
          Hiển thị {table.getRowModel().rows.length} phòng
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
