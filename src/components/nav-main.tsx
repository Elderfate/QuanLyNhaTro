"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Map routes to API endpoints for prefetching
const routeToApiEndpoint: Record<string, string> = {
  '/dashboard/toa-nha': '/api/data',
  '/dashboard/phong': '/api/data',
  '/dashboard/khach-thue': '/api/data',
  '/dashboard/hop-dong': '/api/data',
  '/dashboard/hoa-don': '/api/data',
  '/dashboard/thanh-toan': '/api/data',
  '/dashboard/su-co': '/api/data',
  '/dashboard/thong-bao': '/api/data',
  '/dashboard': '/api/data',
  '/dashboard/quan-ly-tai-khoan': '/api/users',
};

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const { isMobile, state } = useSidebar()
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)
  const queryClient = useQueryClient()
  
  // Prefetch data on hover
  const handleMouseEnter = React.useCallback((url: string) => {
    const apiEndpoint = routeToApiEndpoint[url];
    if (apiEndpoint) {
      // Prefetch route and data
      fetch(apiEndpoint, { credentials: 'include' }).catch(() => {
        // Silently fail - prefetching is optional
      });
    }
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Khi sidebar collapsed và không phải mobile, dùng DropdownMenu
          if (state === "collapsed" && !isMobile) {
            return (
              <SidebarMenuItem key={item.title}>
                <DropdownMenu 
                  open={openDropdown === item.title}
                  onOpenChange={(open) => {
                    setOpenDropdown(open ? item.title : null)
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="min-w-48 rounded-lg"
                    side="right"
                    align="start"
                    sideOffset={4}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <DropdownMenuLabel className="flex items-center gap-2">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.title}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.items?.map((subItem) => {
                      const isActive = pathname === subItem.url
                      return (
                        <DropdownMenuItem 
                          key={subItem.title} 
                          asChild
                          onSelect={() => {
                            setOpenDropdown(null)
                          }}
                        >
                          <Link 
                            href={subItem.url}
                            prefetch={true}
                            onMouseEnter={() => handleMouseEnter(subItem.url)}
                            className={isActive ? "bg-sidebar-accent" : ""}
                          >
                            {subItem.title}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          }

          // Khi sidebar expanded hoặc mobile, dùng Collapsible
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <Link 
                              href={subItem.url} 
                              prefetch={true}
                              onMouseEnter={() => handleMouseEnter(subItem.url)}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
