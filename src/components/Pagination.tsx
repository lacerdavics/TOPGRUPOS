import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  hasNextPage: boolean
  hasPreviousPage: boolean
  className?: string
  maxPagesDisplayed?: number // opcional, padrão 5
  compact?: boolean // para mobile
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  className,
  maxPagesDisplayed = 5,
  compact = false,
}: PaginationProps) => {
  if (totalPages <= 1) return null

  // Reduzir páginas mostradas no mobile
  const effectiveMaxPages = compact ? 3 : maxPagesDisplayed;

  const pages: (number | "ellipsis")[] = []

  // Calcula intervalo de páginas visíveis
  let startPage = Math.max(currentPage - Math.floor(effectiveMaxPages / 2), 1)
  let endPage = startPage + effectiveMaxPages - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(endPage - effectiveMaxPages + 1, 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  // Adiciona ellipsis se necessário
  if (startPage > 1) pages.unshift("ellipsis")
  if (endPage < totalPages) pages.push("ellipsis")

  return (
    <nav className={cn("flex justify-center items-center gap-1 sm:gap-2", className)} aria-label="Pagination Navigation">
      <PaginationPrevious
        onClick={() => hasPreviousPage && onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        compact={compact}
      />
      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <PaginationEllipsis key={`ellipsis-${index}`} />
        ) : (
          <PaginationLink
            key={page}
            isActive={page === currentPage}
            onClick={() => onPageChange(page)}
            compact={compact}
          >
            {page}
          </PaginationLink>
        )
      )}
      <PaginationNext
        onClick={() => hasNextPage && onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        compact={compact}
      />
    </nav>
  )
}

// Componentes de UI reutilizáveis
const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  compact,
  ...props
}: { isActive?: boolean; compact?: boolean } & Pick<ButtonProps, "size"> & React.ComponentProps<"button">) => (
  <button
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size: compact ? "sm" : size,
      }),
      compact ? "h-8 w-8 text-xs sm:h-9 sm:w-9 sm:text-sm" : "",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  compact,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Ir para página anterior"
    size={compact ? "sm" : "default"}
    className={cn(
      compact ? "gap-1 px-2 h-8 text-xs sm:h-10 sm:px-3 sm:text-sm" : "gap-1 pl-2.5",
      className
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className={compact ? "hidden sm:inline" : ""}>Anterior</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  compact,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Ir para próxima página"
    size={compact ? "sm" : "default"}
    className={cn(
      compact ? "gap-1 px-2 h-8 text-xs sm:h-10 sm:px-3 sm:text-sm" : "gap-1 pr-2.5",
      className
    )}
    {...props}
  >
    <span className={compact ? "hidden sm:inline" : ""}>Próxima</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"
