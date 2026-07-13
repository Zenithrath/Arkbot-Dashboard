import { useState, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, Plus, Trash2, Download, FileText } from "lucide-react"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDocuments } from "@/hooks/useDocuments"
import { useDocumentActions } from "@/hooks/useDocumentActions"
import { useDebounce } from "@/hooks/useDebounce"
import { UploadDialog } from "@/components/upload/UploadDialog"
import { DeleteConfirmDialog } from "@/components/knowledge-base/DeleteConfirmDialog"
import { formatRelativeTime, formatFileSize, getFileType, cn } from "@/lib/utils"
import { STATUS_COLORS } from "@/config/constants"
import type { Document } from "@/lib/types"

export function KnowledgeBasePage() {
  const {
    data,
    total,
    loading,
    params,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setSort,
    refresh,
  } = useDocuments()

  const { remove } = useDocumentActions()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)

  // Sync debounced search to hook
  const handleSearch = useCallback(
    (value: string) => {
      setSearchInput(value)
    },
    []
  )

  // Update hook when debounced value changes
  const prevSearchRef = useState({ current: debouncedSearch })
  if (prevSearchRef[0].current !== debouncedSearch) {
    prevSearchRef[0].current = debouncedSearch
    setSearch(debouncedSearch)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const success = await remove(deleteTarget.id, deleteTarget.file_name)
    if (success) {
      setDeleteTarget(null)
      refresh()
    }
  }

  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: "file_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          onClick={() =>
            setSort(
              "file_name",
              params.sortBy === "file_name" && params.sortOrder === "asc"
                ? "desc"
                : "asc"
            )
          }
        >
          File Name
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate max-w-[250px]">
            {row.original.file_name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "file_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{getFileType(row.original.file_name)}</Badge>
      ),
    },
    {
      accessorKey: "file_size",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          onClick={() =>
            setSort(
              "file_size",
              params.sortBy === "file_size" && params.sortOrder === "asc"
                ? "desc"
                : "asc"
            )
          }
        >
          Size
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatFileSize(row.original.file_size)}
        </span>
      ),
    },
    {
      accessorKey: "last_synced_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          onClick={() =>
            setSort(
              "last_synced_at",
              params.sortBy === "last_synced_at" && params.sortOrder === "desc"
                ? "asc"
                : "desc"
            )
          }
        >
          Last Sync
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatRelativeTime(row.original.last_synced_at)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "border",
            STATUS_COLORS[row.original.status]
          )}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              window.open(`/api/documents/${row.original.id}/download`, "_blank")
            }
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-500"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / params.pageSize),
    state: {
      pagination: {
        pageIndex: params.page - 1,
        pageSize: params.pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const newPage =
        typeof updater === "function"
          ? updater({ pageIndex: params.page - 1, pageSize: params.pageSize })
          : updater
      setPage(newPage.pageIndex + 1)
      setPageSize(newPage.pageSize)
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages = Math.ceil(total / params.pageSize)

  return (
    <div>
      <TopBar
        title="Knowledge Base"
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Input
              placeholder="Search documents..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full sm:w-80"
            />
          </div>
          <Select
            value={params.status || "all"}
            onValueChange={(v) => setStatus(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="synced">Synced</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p>No documents found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {total > 0 ? (params.page - 1) * params.pageSize + 1 : 0}–{Math.min(params.page * params.pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(params.page - 1)}
                disabled={params.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {params.page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(params.page + 1)}
                disabled={params.page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={refresh}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        documentName={deleteTarget?.file_name || ""}
        onConfirm={handleDelete}
      />
    </div>
  )
}
