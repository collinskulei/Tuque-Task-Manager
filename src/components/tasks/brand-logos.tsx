import Image from "next/image";
import { cn } from "@/lib/utils";

export function JointLogo({ size = "sm" }: { size?: "sm" | "lg" }) {
  const heights = size === "lg" ? { tuque: 28, ilkerin: 34 } : { tuque: 18, ilkerin: 22 };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md bg-white",
        size === "lg" ? "gap-4 px-4 py-3" : "gap-2.5 px-2.5 py-1.5"
      )}
    >
      <Image
        src="/logos/tuque.png"
        alt="Tuque Consulting"
        width={814}
        height={244}
        sizes="100px"
        style={{ height: heights.tuque, width: "auto" }}
        priority={size === "lg"}
      />
      <div className="w-px self-stretch bg-black/10" />
      <Image
        src="/logos/ilkerin.png"
        alt="ilkerin Consulting"
        width={930}
        height={503}
        sizes="80px"
        style={{ height: heights.ilkerin, width: "auto" }}
        priority={size === "lg"}
      />
    </div>
  );
}
