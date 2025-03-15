
import { toast as baseToast } from "@/hooks/use-toast";
import { ToastProps } from "@/components/ui/toast";

// Create enhanced toast with utility methods
export const toast = {
  // Base toast function
  base: baseToast,
  
  // Success toast variant
  success: (message: string) => {
    return baseToast({
      title: "Success",
      description: message,
      variant: "default",
      className: "bg-green-100 border-green-500 text-green-900",
    });
  },
  
  // Error toast variant
  error: (message: string) => {
    return baseToast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  }
};
