import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "w-[calc(100vw-2rem)] max-w-sm rounded-xl shadow-lg bg-background text-foreground border border-border",
          description: "text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm font-medium",
          cancelButton:
            "bg-muted text-muted-foreground rounded-md px-3 py-1 text-sm font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }