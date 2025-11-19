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
  CircleCheck,
  AlertCircle,
  Camera,
  Copy,
  Search,
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
import type { HoaDon, Phong, KhachThue } from '@/types'

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'daThanhToan':
      return (
        <Badge variant="default" className="gap-1">
          <CircleCheck className="h-3 w-3" />
          Đã thanh toán
        </Badge>
      )
    case 'daThanhToanMotPhan':
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Thanh toán một phần
        </Badge>
      )
    case 'chuaThanhToan':
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Chưa thanh toán
        </Badge>
      )
    case 'quaHan':
      return (
        <Badge variant="outline" className="gap-1 border-orange-600 text-orange-600">
          <Calendar className="h-3 w-3" />
          Quá hạn
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const isOverdue = (hanThanhToan: Date | string) => {
  const today = new Date()
  const dueDate = new Date(hanThanhToan)
  return dueDate < today
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

type HoaDonTableProps = {
  phongList: Phong[]
  khachThueList: KhachThue[]
  onView: (hoaDon: HoaDon) => void
  onEdit: (hoaDon: HoaDon) => void
  onDelete: (id: string) => void
  onDownload: (hoaDon: HoaDon) => void
  onScreenshot: (hoaDon: HoaDon) => void
  onShare: (hoaDon: HoaDon) => void
  onPayment: (hoaDon: HoaDon) => void
  onDeleteMultiple?: (ids: string[]) => void
}

const getPhongName = (phong: string | { maPhong: string }, phongList: Phong[]) => {
  if (typeof phong === 'object' && phong?.maPhong) {
    return phong.maPhong
  }
  const phongObj = phongList.find(p => p._id === phong)
  return phongObj?.maPhong || 'N/A'
}

const getKhachThueName = (khachThue: string | { hoTen: string }, khachThueList: KhachThue[]) => {
  if (typeof khachThue === 'object' && khachThue?.hoTen) {
    return khachThue.hoTen
  }
  const khachThueObj = khachThueList.find(k => k._id === khachThue)
  return khachThueObj?.hoTen || 'N/A'
}

const createColumns = (props: HoaDonTableProps): ColumnDef<HoaDon>[] => [
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
    accessorKey: "maHoaDon",
    header: "Mã hóa đơn",
    cell: ({ row }) => {
      return <HoaDonCellViewer hoaDon={row.original} onView={props.onView} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "phong",
    header: "Phòng",
    cell: ({ row }) => (
      <div className="min-w-24">
        <div className="font-medium">{getPhongName(row.original.phong, props.phongList)}</div>
      </div>
    ),
  },
  {
    accessorKey: "khachThue",
    header: "Khách thuê",
    cell: ({ row }) => (
      <div className="min-w-32">
        <div className="font-medium">
          {getKhachThueName(row.original.khachThue, props.khachThueList)}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "thang",
    header: "Tháng/Năm",
    cell: ({ row }) => (
      <div className="text-sm font-medium">
        {row.original.thang}/{row.original.nam}
      </div>
    ),
  },
  {
    accessorKey: "hanThanhToan",
    header: "Hạn thanh toán",
    cell: ({ row }) => {
      const isLate = isOverdue(row.original.hanThanhToan)
      return (
        <div className="text-sm">
          <div className={isLate ? 'text-orange-600 font-medium' : ''}>
            {new Date(row.original.hanThanhToan).toLocaleDateString('vi-VN')}
          </div>
          {isLate && (
            <div className="text-xs text-orange-600">Quá hạn</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "trangThai",
    header: "Trạng thái",
    cell: ({ row }) => getStatusBadge(row.original.trangThai),
  },
  {
    accessorKey: "tongTien",
    header: () => <div className="text-right">Tổng tiền</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <div className="font-medium">{formatCurrency(row.original.tongTien)}</div>
        {row.original.conLai > 0 && (
          <div className="text-xs text-orange-600">
            Còn {formatCurrency(row.original.conLai)}
          </div>
        )}
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
          <DropdownMenuItem onClick={() => props.onView(row.original)}>
            <Eye className="mr-2 h-4 w-4" />
            Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => props.onEdit(row.original)}>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </DropdownMenuItem>
          {row.original.conLai > 0 && (
            <DropdownMenuItem onClick={() => props.onPayment(row.original)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Thanh toán
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => props.onShare(row.original)}>
            <Copy className="mr-2 h-4 w-4" />
            Sao chép link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => props.onScreenshot(row.original)}>
            <Camera className="mr-2 h-4 w-4" />
            Xuất PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => props.onDownload(row.original)}>
            <Download className="mr-2 h-4 w-4" />
            Tải HTML
          </DropdownMenuItem>
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

function DraggableRow({ row }: { row: Row<HoaDon> }) {
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

type HoaDonDataTableProps = HoaDonTableProps & {
  data: HoaDon[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
  statusFilter?: string
  onStatusChange?: (value: string) => void
  monthFilter?: string
  onMonthChange?: (value: string) => void
  yearFilter?: string
  onYearChange?: (value: string) => void
  getMonthOptions?: () => number[]
  getYearOptions?: () => number[]
}

export function HoaDonDataTable(props: HoaDonDataTableProps) {
  const { data: initialData, onDeleteMultiple, searchTerm, onSearchChange, statusFilter, onStatusChange, monthFilter, onMonthChange, yearFilter, onYearChange, getMonthOptions, getYearOptions, ...tableProps } = props
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

  // Handle bulk delete
  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedIds = selectedRows.map(row => row.original._id!)
    
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một hóa đơn để xóa')
      return
    }
    
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} hóa đơn đã chọn?`)) {
      if (onDeleteMultiple) {
        onDeleteMultiple(selectedIds)
        setRowSelection({})
      }
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
                placeholder="Tìm kiếm theo mã hóa đơn..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="chuaThanhToan">Chưa thanh toán</SelectItem>
              <SelectItem value="daThanhToanMotPhan">Một phần</SelectItem>
              <SelectItem value="daThanhToan">Đã thanh toán</SelectItem>
              <SelectItem value="quaHan">Quá hạn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={onMonthChange}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {getMonthOptions?.().map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  Tháng {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={onYearChange}>
            <SelectTrigger className="w-full sm:w-[100px]">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {getYearOptions?.().map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tùy chỉnh cột bên phải */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa {selectedCount}
            </Button>
          )}
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

// Cell viewer component for hoa don details
function HoaDonCellViewer({ 
  hoaDon, 
  onView 
}: { 
  hoaDon: HoaDon
  onView: (hoaDon: HoaDon) => void
}) {
  return (
    <Button 
      variant="link" 
      className="text-foreground w-fit px-0 text-left font-medium"
      onClick={() => onView(hoaDon)}
    >
      {hoaDon.maHoaDon}
    </Button>
  )
}

