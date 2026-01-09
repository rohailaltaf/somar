import { forwardRef } from "react";
import { View, Text, type ViewProps, type TextProps } from "react-native";
import { cn } from "@/src/lib/utils";

/**
 * Card component matching shadcn/ui Card API.
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Account Balance</CardTitle>
 *     <CardDescription>Your current balance across all accounts</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <Text className="text-2xl font-bold">$12,345.67</Text>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>View Details</Button>
 *   </CardFooter>
 * </Card>
 */

export interface CardProps extends ViewProps {
  className?: string;
}

export const Card = forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          "bg-card rounded-xl border border-border",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn("p-6 pb-0", className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends TextProps {
  className?: string;
}

export const CardTitle = forwardRef<Text, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn(
          "text-lg font-semibold text-card-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<Text, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn("text-sm text-muted-foreground mt-1", className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn("p-6", className)}
        {...props}
      />
    );
  }
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn("flex-row items-center p-6 pt-0", className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";
