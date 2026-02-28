'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { IconUsers } from '@tabler/icons-react';

import { NavInventory } from '@/components/nav-inventory';
import { NavMain } from '@/components/nav-main';
import { NavPOS } from '@/components/nav-pos';
import { NavFinance } from '@/components/nav-finance';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { Logo } from '@/components/ui/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';

type AppSidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

const navSecondary = [
  {
    title: 'Admin Panel',
    url: '/admin',
    icon: IconUsers,
  },
];

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: AppSidebarUser }) {
  const { data: session } = useSession();
  const { setOpenMobile, isMobile } = useSidebar();

  const userData = React.useMemo<AppSidebarUser>(() => {
    if (session?.user) {
      return {
        name: session.user.name || session.user.email || 'User',
        email: session.user.email || '',
        avatar: session.user.avatar_url || session.user.image || '',
      };
    }

    if (user) {
      return user;
    }

    return {
      name: 'Loading...',
      email: '',
      avatar: '',
    };
  }, [session?.user, user]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link 
                href="/dashboard" 
                prefetch={true}
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <Logo variant="brand" size="sm" />
                <span className="text-base font-semibold">BaaWA Inventory</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavPOS />
        <NavInventory />
        <NavFinance />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
