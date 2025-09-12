import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-2xl text-base font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-heading",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dark hover:shadow-lg shadow-md hover:-translate-y-0.5 hover:scale-[1.02]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg shadow-md hover:-translate-y-0.5 hover:scale-[1.02]",
        outline:
          "border-2 border-primary bg-background hover:bg-primary hover:text-primary-foreground text-primary hover:shadow-md shadow-sm hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md shadow-sm hover:-translate-y-0.5",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground hover:-translate-y-0.5",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-dark",
        accent: "bg-accent text-accent-foreground hover:bg-accent-dark hover:shadow-lg shadow-cta hover:-translate-y-0.5 hover:scale-[1.02]",
        modern: "bg-primary text-primary-foreground hover:bg-primary-dark hover:shadow-lg shadow-md hover:-translate-y-0.5 hover:scale-[1.02]",
        hero: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg shadow-md hover:-translate-y-0.5 hover:scale-[1.02] font-bold",
        soft: "btn-soft hover:btn-soft:hover",
        premium: "bg-premium text-premium-foreground hover:bg-premium/90 hover:shadow-lg shadow-md hover:-translate-y-0.5 hover:scale-[1.02]",
      },
      size: {
        default: "h-12 px-8 py-3 min-h-[3rem]",
        sm: "h-10 rounded-xl px-6 text-sm min-h-[2.5rem]",
        lg: "h-14 rounded-3xl px-12 text-lg min-h-[3.5rem]",
        icon: "h-12 w-12 min-h-[3rem] min-w-[3rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
