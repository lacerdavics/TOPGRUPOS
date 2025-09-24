import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "w-[calc(100vw-2rem)] max-w-sm rounded-xl shadow-lg bg-background text-foreground border border-border",
          description: "text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm font-medium",
          cancelButton:
            "bg-muted text-muted-foreground rounded-md px-3 py-1 text-sm font-medium",
          closeButton:
            "bg-background border border-border hover:bg-muted text-foreground rounded-md p-1 transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }