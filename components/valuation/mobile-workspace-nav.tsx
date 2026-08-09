"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WorkspaceSidebar } from "@/components/valuation/workspace-sidebar";

/** Mobile-only bottom-sheet nav (Design spec §3, §8). */
export function MobileWorkspaceNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Menu className="size-4" aria-hidden="true" />
          Sections
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Valuation workspace</SheetTitle>
        </SheetHeader>
        <WorkspaceSidebar className="pb-4" onNavigate={() => setOpen(false)} indicatorScope="mobile" />
      </SheetContent>
    </Sheet>
  );
}
