"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Edit,
  Trash2,
  Download,
  Eye,
  Calendar,
  CreditCard,
  GripVertical,
  MoreVertical,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  Building2,
  Search,
  Users,
  Home,
} from "lucide-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ThanhToan, HoaDon } from '@/types'

// Type cho ThanhToan đã được populate
type ThanhToanPopulated = Omit<ThanhToan, 'hoaDon'> & {
  hoaDon: string | HoaDon
}

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const getMethodBadge = (method: string) => {
  switch (method) {
    case 'tienMat':
      return (
        <Badge variant="default" className="gap-1">
          <CreditCard className="h-3 w-3" />
          Tiền mặt
        </Badge>
      )
    case 'chuyenKhoan':
      return (
        <Badge variant="secondary" className="gap-1">
          <Building2 className="h-3 w-3" />
          Chuyển khoản
        </Badge>
      )
    case 'viDienTu':
      return (
        <Badge variant="outline" className="gap-1">
          <CreditCard className="h-3 w-3" />
          Ví điện tử
        </Badge>
      )
    default:
      return <Badge variant="outline">{method}</Badge>
  }
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <GripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Kéo để sắp xếp</span>
    </Button>
  )
}

type ThanhToanTableProps = {
  hoaDonList: HoaDon[]
  onView?: (thanhToan: ThanhToanPopulated) => void
  onEdit: (thanhToan: ThanhToanPopulated) => void
  onDelete: (id: string) => void
  onDownload?: (thanhToan: ThanhToanPopulated) => void
}

const getHoaDonInfo = (hoaDon: string | HoaDon, hoaDonList: HoaDon[]) => {
  if (typeof hoaDon === 'object' && hoaDon?.maHoaDon) {
    return hoaDon.maHoaDon
  }
  if (typeof hoaDon === 'string') {
    const hoaDonItem = hoaDonList.find(h => h._id === hoaDon)
    return hoaDonItem?.maHoaDon || 'N/A'
  }
  return 'N/A'
}

const createColumns = (props: ThanhToanTableProps): ColumnDef<ThanhToanPopulated>[] => [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original._id!} />,
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "hoaDon",
    header: "Hóa đơn",
    cell: ({ row }) => {
      const hoaDonInfo = typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      return (
        <div className="min-w-32">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {getHoaDonInfo(row.original.hoaDon, props.hoaDonList)}
            </span>
          </div>
          {hoaDonInfo && (
            <div className="text-xs text-muted-foreground mt-1 ml-6">
              Tháng {hoaDonInfo.thang}/{hoaDonInfo.nam}
            </div>
          )}
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "phong",
    header: "Phòng",
    cell: ({ row }) => {
      const hoaDonInfo = typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      const phongInfo = hoaDonInfo && typeof hoaDonInfo.phong === 'object' ? (hoaDonInfo.phong as any) : null;
      return (
        <div className="flex items-center gap-2 min-w-24">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {phongInfo?.maPhong || 'N/A'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "khachThue",
    header: "Người đại diện",
    cell: ({ row }) => {
      const hoaDonInfo = typeof row.original.hoaDon === 'object' ? row.original.hoaDon : null;
      const khachThueInfo = hoaDonInfo && typeof hoaDonInfo.khachThue === 'object' ? (hoaDonInfo.khachThue as any) : null;
      return (
        <div className="flex items-center gap-2 min-w-32">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {khachThueInfo?.hoTen || 'N/A'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "soTien",
    header: () => <div className="text-right">Số tiền</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.soTien)}
      </div>
    ),
  },
  {
    accessorKey: "phuongThuc",
    header: "Phương thức",
    cell: ({ row }) => getMethodBadge(row.original.phuongThuc),
  },
  {
    accessorKey: "thongTinChuyenKhoan",
    header: "Thông tin giao dịch",
    cell: ({ row }) => {
      const tt = row.original.thongTinChuyenKhoan
      if (!tt) return <span className="text-muted-foreground">-</span>
      return (
        <div className="min-w-32">
          <div className="text-sm font-medium">{tt.nganHang}</div>
          <div className="text-xs text-muted-foreground">{tt.soGiaoDich}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "ngayThanhToan",
    header: "Ngày thanh toán",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {new Date(row.original.ngayThanhToan).toLocaleDateString('vi-VN')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "ghiChu",
    header: "Ghi chú",
    cell: ({ row }) => (
      <div className="max-w-xs truncate text-sm">
        {row.original.ghiChu || '-'}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">Mở menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {props.onView && (
            <DropdownMenuItem onClick={() => props.onView!(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem chi tiết
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => props.onEdit(row.original)}>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </DropdownMenuItem>
          {row.original.anhBienLai && props.onDownload && (
            <DropdownMenuItem onClick={() => props.onDownload!(row.original)}>
              <Download className="mr-2 h-4 w-4" />
              Tải biên lai
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => props.onDelete(row.original._id!)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  },
]

function DraggableRow({ row }: { row: Row<ThanhToanPopulated> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id!,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

type ThanhToanDataTableProps = ThanhToanTableProps & {
  data: ThanhToanPopulated[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
  methodFilter?: string
  onMethodChange?: (value: string) => void
  dateFilter?: string
  onDateChange?: (value: string) => void
}

export function ThanhToanDataTable(props: ThanhToanDataTableProps) {
  const { data: initialData, searchTerm, onSearchChange, methodFilter, onMethodChange, dateFilter, onDateChange, ...tableProps } = props
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  
  // Sync data when prop changes
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])
  
  const columns = React.useMemo(() => createColumns(tableProps), [tableProps])
  
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ _id }) => _id!) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row._id!,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Tìm kiếm và Bộ lọc bên trái */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <div className="flex-1 sm:max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm ghi chú, giao dịch..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={methodFilter} onValueChange={onMethodChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Phương thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="tienMat">Tiền mặt</SelectItem>
              <SelectItem value="chuyenKhoan">Chuyển khoản</SelectItem>
              <SelectItem value="viDienTu">Ví điện tử</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={onDateChange}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="today">Hôm nay</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tùy chỉnh cột bên phải */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Tùy chỉnh cột</span>
                <span className="lg:hidden">Cột</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
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
      </div>
      
      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {selectedCount > 0 ? (
            <>Đã chọn {selectedCount} trong {table.getFilteredRowModel().rows.length} hàng</>
          ) : (
            <>Hiển thị {table.getFilteredRowModel().rows.length} hàng</>
          )}
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Số hàng mỗi trang
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Trang {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Trang đầu</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Trang trước</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Trang sau</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Trang cuối</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

