import { ChevronUp, Home, Inbox, Moon, Sun, User2 } from "lucide-react"
import logodark from "@/assets/zapfy-logo.png"
import logowhite from "@/assets/zapfy-logo-white.png"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  // SidebarGroupLabel,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import PlansModal from "./plansModal";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/auth"

// Menu items.
const items = [
  {
    title: "Workspaces",
    url: "#",
    icon: Inbox,
  },
]

export function AppSidebar(props: any) {
  const { isDarkMode, toggleTheme } = useTheme();

  const {
    signOut
  } = useAuth();

  return (
    <Sidebar className="w-40">
      <SidebarHeader>
        <img src={isDarkMode ? logowhite : logodark} alt="" className="w-8 my-2 mx-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Application</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.title === 'Workspaces' ?
                      <a onClick={props.handleHome} className="cursor-pointer">
                        <item.icon />
                        <span>{item.title}</span>
                      </a> :
                      <a href={item.url} >
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    }
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <PlansModal role={props.user?.role ?? ''} />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />{props.user?.displayName}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={signOut}>
                  <span >Sair</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDarkMode ? <span className="flex gap-2 justify-center items-center"><Sun size={18} /> modo claro</span> : <span className="flex gap-2 justify-center items-center"><Moon size={18} /> modo escuro</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
