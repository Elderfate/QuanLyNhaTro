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
  Eye,
  Phone,
  Mail,
  MapPin,
  GripVertical,
  MoreVertical,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  CreditCard,
  Calendar,
  Search,
  Home,
  Building2,
  Key,
  Check,
  X,
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
import type { KhachThue } from '@/types'

// Helper functions
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'dangThue':
      return (
        <Badge variant="default" className="gap-1">
          <User className="h-3 w-3" />
          Đang thuê
        </Badge>
      )
    case 'daTraPhong':
      return (
        <Badge variant="secondary" className="gap-1">
          Đã trả phòng
        </Badge>
      )
    case 'chuaThue':
      return (
        <Badge variant="outline" className="gap-1">
          Chưa thuê
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
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

type KhachThueTableProps = {
  onView?: (khachThue: KhachThue) => void
  onEdit: (khachThue: KhachThue) => void
  onDelete: (id: string) => void
  actionLoading: string | null
}

const createColumns = (props: KhachThueTableProps): ColumnDef<KhachThue>[] => [
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
    accessorKey: "hoTen",
    header: "Họ tên",
    cell: ({ row }) => (
      <div className="min-w-40">
        <div className="font-medium">{row.original.hoTen}</div>
        <div className="text-xs text-muted-foreground capitalize">
          {row.original.gioiTinh}
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "soDienThoai",
    header: "Liên hệ",
    cell: ({ row }) => (
      <div className="min-w-40">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3 w-3 text-muted-foreground" />
          {row.original.soDienThoai}
        </div>
        {row.original.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {row.original.email}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "cccd",
    header: "CCCD",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm">{row.original.cccd}</span>
      </div>
    ),
  },
  {
    accessorKey: "ngaySinh",
    header: "Ngày sinh",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {new Date(row.original.ngaySinh).toLocaleDateString('vi-VN')}
      </div>
    ),
  },
  {
    accessorKey: "queQuan",
    header: "Quê quán",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm max-w-xs truncate">{row.original.queQuan}</span>
      </div>
    ),
  },
  {
    accessorKey: "ngheNghiep",
    header: "Nghề nghiệp",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.ngheNghiep || '-'}</span>
    ),
  },
  {
    accessorKey: "phongDangThue",
    header: "Phòng đang thuê",
    cell: ({ row }) => {
      const khachThue = row.original as any;
      const hopDong = khachThue.hopDongHienTai;
      
      if (!hopDong || !hopDong.phong) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Home className="h-4 w-4" />
            <span className="text-sm">Chưa thuê</span>
          </div>
        );
      }
      
      const phong = hopDong.phong;
      const toaNha = phong.toaNha;
      
      return (
        <div className="min-w-32">
          <div className="flex items-center gap-2 mb-1">
            <Home className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-sm font-medium">
                {phong.maPhong}
              </div>
              {toaNha && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {toaNha.tenToaNha}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "matKhau",
    header: "Tài khoản",
    cell: ({ row }) => {
      const khachThue = row.original as any;
      const hasPassword = !!khachThue.matKhau;
      
      return (
        <div className="flex items-center gap-2">
          <Key className={`h-4 w-4 ${hasPassword ? 'text-green-600' : 'text-muted-foreground'}`} />
          {hasPassword ? (
            <Badge variant="default" className="gap-1 bg-green-600">
              <Check className="h-3 w-3" />
              Đã tạo
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <X className="h-3 w-3" />
              Chưa tạo
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "trangThai",
    header: "Trạng thái",
    cell: ({ row }) => getStatusBadge(row.original.trangThai),
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
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => props.onDelete(row.original._id!)}
            disabled={props.actionLoading === `delete-${row.original._id}`}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {props.actionLoading === `delete-${row.original._id}` ? 'Đang xóa...' : 'Xóa'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  },
]

function DraggableRow({ row }: { row: Row<KhachThue> }) {
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

type KhachThueDataTableProps = KhachThueTableProps & {
  data: KhachThue[]
  searchTerm?: string
  onSearchChange?: (value: string) => void
  selectedTrangThai?: string
  onTrangThaiChange?: (value: string) => void
}

export function KhachThueDataTable(props: KhachThueDataTableProps) {
  const { data: initialData, searchTerm, onSearchChange, selectedTrangThai, onTrangThaiChange, ...tableProps } = props
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
          <div className="flex-1 sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, SĐT, CCCD..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedTrangThai} onValueChange={onTrangThaiChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="dangThue">Đang thuê</SelectItem>
              <SelectItem value="daTraPhong">Đã trả phòng</SelectItem>
              <SelectItem value="chuaThue">Chưa thuê</SelectItem>
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

