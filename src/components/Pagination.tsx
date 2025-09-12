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
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  className,
  maxPagesDisplayed = 5,
}: PaginationProps) => {
  if (totalPages <= 1) return null

  const pages: (number | "ellipsis")[] = []

  // Calcula intervalo de páginas visíveis
  let startPage = Math.max(currentPage - Math.floor(maxPagesDisplayed / 2), 1)
  let endPage = startPage + maxPagesDisplayed - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(endPage - maxPagesDisplayed + 1, 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  // Adiciona ellipsis se necessário
  if (startPage > 1) pages.unshift("ellipsis")
  if (endPage < totalPages) pages.push("ellipsis")

  return (
    <nav className={cn("flex justify-center gap-1", className)} aria-label="Pagination Navigation">
      <PaginationPrevious
        onClick={() => hasPreviousPage && onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
      />
      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <PaginationEllipsis key={`ellipsis-${index}`} />
        ) : (
          <PaginationLink
            key={page}
            isActive={page === currentPage}
            onClick={() => onPageChange(page)}
          >
            {page}
          </PaginationLink>
        )
      )}
      <PaginationNext
        onClick={() => hasNextPage && onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
      />
    </nav>
  )
}

// Componentes de UI reutilizáveis
const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: { isActive?: boolean } & Pick<ButtonProps, "size"> & React.ComponentProps<"button">) => (
  <button
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
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
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"
