import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        success: "🌸",
        error: "🥺",
        warning: "💫",
        info: "💡",
        loading: "⏳",
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-2 group-[.toaster]:border-border group-[.toaster]:rounded-2xl group-[.toaster]:p-5 group-[.toaster]:shadow-2xl group-[.toaster]:data-[type=success]:border-[hsl(var(--toast-success))] group-[.toaster]:data-[type=error]:border-[hsl(var(--toast-error))] group-[.toaster]:data-[type=warning]:border-[hsl(var(--toast-warning))] group-[.toaster]:data-[type=info]:border-[hsl(var(--toast-info))]",
          title: "group-[.toast]:text-base group-[.toast]:font-bold",
          description: "group-[.toast]:text-sm group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          closeButton: "group-[.toast]:opacity-0 group-[.toast]:hover:opacity-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

