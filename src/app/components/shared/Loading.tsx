import { Loader2 } from "lucide-react";

export function Loading({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin" size={size} style={{ color: "#0F7D7A" }} />
    </div>
  );
}
