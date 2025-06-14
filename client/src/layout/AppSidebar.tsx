"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  UserIcon,
  FileIcon,
  GroupIcon,
  ListIcon,
  PaperPlaneIcon,
  PlugInIcon
} from "../icons/index";
import { useAuth } from '@/context/AuthContext';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Trang chủ",
    path: "/",
  },
  {
    icon: <CalenderIcon />,
    name: "Chấm công",
    path: "/calendar",
  },
  {
    icon: <PaperPlaneIcon />,
    name: "Yêu cầu của tôi",
    path: "/requests",
  },
  {
    icon: <FileIcon />,
    name: "Biên bản của tôi",
    path: "/contracts",
  },
];

const userItems: NavItem[] = [
];

const adminItems: NavItem[] = [
  {
    icon: <UserIcon />,
    name: "Quản lý tài khoản",
    path: "/admin/accounts",
  },
  {
    icon: <FileIcon />,
    name: "Quản lý yêu cầu",
    path: "/admin/requests",
  },
  {
    icon: <ListIcon />,
    name: "Quản lý biên bản",
    path: "/admin/contracts",
  },
  {
    icon: <PlugInIcon />,
    name: "Quản lý thiết bị",
    path: "/admin/devices",
  },
  {
    icon: <GridIcon />,
    name: "Quản lý loại thiết bị",
    path: "/admin/device-types",
  },
  {
    icon: <GroupIcon />,
    name: "Quản lý nhóm",
    path: "/admin/groups",
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = (): React.ReactElement => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<{ type: string; index: number } | null>(null);
  const subMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [subMenuHeight, setSubMenuHeight] = useState<{ [key: string]: number }>({});

  const isActive = useCallback((path: string): boolean => {
    return pathname === path;
  }, [pathname]);

  const handleSubmenuToggle = useCallback((index: number, type: string): void => {
    setOpenSubmenu(prev => 
      prev?.type === type && prev?.index === index ? null : { type, index }
    );
  }, []);

  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const element = subMenuRefs.current[key];
      if (element) {
        setSubMenuHeight(prev => ({
          ...prev,
          [key]: element.scrollHeight
        }));
      }
    }
  }, [openSubmenu]);

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others" | "admin" | "user"
  ): React.ReactElement => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${
        isExpanded ? "w-64" : "w-20"
      } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center">
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="ml-3 text-xl font-semibold text-brand-500 dark:text-brand-400">Zinza Technology</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-8">
          {renderMenuItems(navItems, "main")}
          {user?.role === "admin" && renderMenuItems(adminItems, "admin")}
          {(user?.role === "user") && renderMenuItems(userItems, "user")}
          {renderMenuItems(othersItems, "others")}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;