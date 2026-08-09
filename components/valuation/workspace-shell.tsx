"use client";

import type { ReactNode } from "react";
import { Container } from "@/components/brand/container";
import { WorkspaceSidebar } from "@/components/valuation/workspace-sidebar";
import { MobileWorkspaceNav } from "@/components/valuation/mobile-workspace-nav";
import { FairValuePanelLive } from "@/components/valuation/workspace-live";
import { WorkspaceJourneyProvider } from "@/components/valuation/workspace-journey-context";

/**
 * The sidebar + scrollable content shell (Design spec §3, brief §6/§9) —
 * a client boundary specifically so the sidebar (a sibling of `children`,
 * not an ancestor/descendant) and the scrollable journey can share one
 * `WorkspaceJourneyProvider` for "which section is active right now."
 */
export function WorkspaceShell({ companySlug, children }: { companySlug: string; children: ReactNode }) {
  return (
    <WorkspaceJourneyProvider companySlug={companySlug}>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="hidden shrink-0 flex-col border-r border-border md:flex md:w-14 lg:w-64">
          <WorkspaceSidebar variant="full" className="hidden flex-1 py-4 lg:block" />
          <WorkspaceSidebar variant="icon" className="flex-1 py-4 lg:hidden" />
          <FairValuePanelLive className="hidden border-t border-border lg:block" />
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="border-b border-border py-3 md:hidden">
            <Container>
              <MobileWorkspaceNav />
            </Container>
          </div>

          <main id="main-content" className="flex-1 pb-20 lg:pb-0">
            <Container className="py-4">{children}</Container>
          </main>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background lg:hidden">
        <FairValuePanelLive variant="bar" />
      </div>
    </WorkspaceJourneyProvider>
  );
}
