"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  CalenderIcon,
  ChevronDownIcon,
  FileIcon,
  GroupIcon,
  ListIcon,
  PaperPlaneIcon,
  PlugInIcon,
  HomeIcon
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
    icon: <HomeIcon />,
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
    name: "Yêu cầu",
    subItems: [
      { name: "Yêu cầu của tôi", path: "/requests" },
      { name: "Yêu cầu cần duyệt", path: "/admin/requests" },
    ],
  },
  {
    icon: <FileIcon />,
    name: "Biên bản",
    subItems: [
      { name: "Biên bản của tôi", path: "/contracts" },
    ],
  },
];

const adminItems: NavItem[] = [
  {
    icon: <ListIcon />,
    name: "Quản lý biên bản",
    path: "/admin/contracts",
  },
  {
    icon: <PlugInIcon />,
    name: "Quản lý thiết bị",
    subItems: [
      { name: "Danh sách thiết bị", path: "/admin/devices" },
      { name: "Loại thiết bị", path: "/admin/device-types" },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "Quản lý tài khoản",
    subItems: [
      { name: "Quản lý tài khoản", path: "/admin/accounts" },
      { name: "Quản lý nhóm", path: "/admin/groups" },
    ],
  },
];

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
    menuType: "main" | "admin"
  ): React.ReactElement => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <div>
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group w-full ${
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
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className={`overflow-hidden transition-all duration-200 ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "max-h-[500px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
                style={{
                  maxHeight: openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px"
                }}
              >
                <ul className="pl-4 mt-2 space-y-2">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.path}>
                      <Link
                        href={subItem.path}
                        className={`block px-4 py-2 text-sm rounded-md transition-colors ${
                          isActive(subItem.path)
                            ? "text-brand-500 bg-brand-50 dark:bg-brand-900/50"
                            : "text-gray-600 hover:text-brand-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {subItem.name}
                        {subItem.new && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium text-brand-500 bg-brand-50 rounded-full dark:bg-brand-900/50">
                            Mới
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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

        <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto">
          {renderMenuItems(navItems, "main")}
          {user?.role === "admin" && renderMenuItems(adminItems, "admin")}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;