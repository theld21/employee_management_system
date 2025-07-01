"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  employeeId: string;
  gender: number;
  dateOfBirth: string;
  address: string;
  leaveDays: number;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserInfoCard() {
  const { user, checkAuth } = useAuth();
  const profileModal = useModal();
  const passwordModal = useModal();
  const router = useRouter();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const profileForm = useForm<UserProfile>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      position: user?.position || "",
      employeeId: user?.employeeId || "",
      gender: user?.gender ?? 1,
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
      address: user?.address || "",
      leaveDays: user?.leaveDays || 0,
    },
  });

  const passwordForm = useForm<PasswordChangeForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitProfile = async (data: UserProfile) => {
    setIsLoadingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await api.put("/auth/profile", data);
      await checkAuth();
      router.refresh();
      setProfileSuccess("Thông tin cá nhân đã được cập nhật thành công!");
      setTimeout(() => {
        profileModal.closeModal();
        setProfileSuccess(null);
      }, 2000);
    } catch (error) {
      console.error(error);
      setProfileError("Đã xảy ra lỗi khi cập nhật thông tin cá nhân. Vui lòng thử lại sau.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordChangeForm) => {
    setIsLoadingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await api.put("/auth/change-password", data);
      setPasswordSuccess("Mật khẩu đã được đổi thành công!");
      passwordForm.reset();
      setTimeout(() => {
        passwordModal.closeModal();
        setPasswordSuccess(null);
      }, 2000);
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Đổi mật khẩu thất bại"
        : "Đổi mật khẩu thất bại";
      console.error(error);
      setPasswordError(message);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        position: user.position || "",
        employeeId: user.employeeId || "",
        gender: user.gender ?? 1,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        address: user.address || "",
        leaveDays: user.leaveDays || 0,
      });
    }
  }, [user, profileForm]);

  // Clear messages when modals open
  useEffect(() => {
    if (profileModal.isOpen) {
      setProfileError(null);
      setProfileSuccess(null);
    }
  }, [profileModal.isOpen]);

  useEffect(() => {
    if (passwordModal.isOpen) {
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [passwordModal.isOpen]);

  if (!user) {
    return null;
  }

  // Debug log to check user data
  console.log("User data in UserInfoCard:", user);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getGenderText = (gender: number) => {
    return gender === 1 ? "Nam" : "Nữ";
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "Hoạt động",
      inactive: "Không hoạt động",
      suspended: "Tạm khóa"
    };
    return statusMap[status] || status;
  };

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      user: "Người dùng",
      admin: "Quản trị viên"
    };
    return roleMap[role] || role;
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src="/images/user/user.png"
                alt="user"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {`${user.firstName} ${user.lastName}`}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.position || "-"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.group?.name || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <button
                onClick={profileModal.openModal}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                    fill=""
                  />
                </svg>
                Sửa thông tin
              </button>
              <button
                onClick={passwordModal.openModal}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.5 8.25V6.75C4.5 4.40625 6.40625 2.5 8.75 2.5C11.0938 2.5 13 4.40625 13 6.75V8.25H13.75C14.4375 8.25 15 8.8125 15 9.5V14.75C15 15.4375 14.4375 16 13.75 16H3.75C3.0625 16 2.5 15.4375 2.5 14.75V9.5C2.5 8.8125 3.0625 8.25 3.75 8.25H4.5ZM5.75 8.25H11.75V6.75C11.75 5.09375 10.4063 3.75 8.75 3.75C7.09375 3.75 5.75 5.09375 5.75 6.75V8.25Z"
                    fill=""
                  />
                </svg>
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
          Thông tin cá nhân
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Mã nhân viên
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.employeeId ? user.employeeId : "-"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Tên đăng nhập
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.username}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Họ và tên
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {`${user.firstName} ${user.lastName}`}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Email
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.email}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Số điện thoại
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.phoneNumber ? user.phoneNumber : "-"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Chức vụ
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.position ? user.position : "-"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Phòng ban
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.group?.name ? user.group.name : "-"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Giới tính
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.gender !== undefined ? getGenderText(user.gender) : "-"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Ngày sinh
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.dateOfBirth ? formatDate(user.dateOfBirth) : "-"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Ngày bắt đầu làm việc
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.startDate ? formatDate(user.startDate) : "-"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Vai trò
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {getRoleText(user.role)}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Trạng thái
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${user.status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : user.status === 'inactive'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                {getStatusText(user.status || 'active')}
              </span>
            </p>
          </div>

          <div className="col-span-2">
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Địa chỉ
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.address ? user.address : "-"}
            </p>
          </div>

          <div className="col-span-2">
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Số ngày phép còn lại
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.leaveDays ? user.leaveDays : "0"}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Update Modal */}
      <Modal isOpen={profileModal.isOpen} onClose={profileModal.closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Cập nhật thông tin cá nhân
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Cập nhật thông tin chi tiết để giữ hồ sơ của bạn luôn mới nhất.
            </p>
          </div>

          {/* Error Message */}
          {profileError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/50 dark:border-red-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{profileError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {profileSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/50 dark:border-green-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-300">{profileSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <form className="flex flex-col" onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Thông tin cá nhân
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Tên</Label>
                    <input
                      type="text"
                      {...profileForm.register("firstName", { required: "Tên là bắt buộc" })}
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileForm.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Họ</Label>
                    <input
                      type="text"
                      {...profileForm.register("lastName", { required: "Họ là bắt buộc" })}
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileForm.formState.errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Email</Label>
                    <input
                      type="email"
                      {...profileForm.register("email", {
                        required: "Email là bắt buộc",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email không hợp lệ",
                        },
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Số điện thoại</Label>
                    <input
                      type="tel"
                      {...profileForm.register("phoneNumber")}
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label>Giới tính</Label>
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      {...profileForm.register("gender")}
                    >
                      <option value={1}>Nam</option>
                      <option value={0}>Nữ</option>
                    </select>
                  </div>

                  <div>
                    <Label>Ngày sinh</Label>
                    <input
                      type="date"
                      {...profileForm.register("dateOfBirth")}
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Địa chỉ</Label>
                    <textarea
                      rows={3}
                      {...profileForm.register("address")}
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button variant="outline" onClick={profileModal.closeModal} disabled={isLoadingProfile}>
                Đóng
              </Button>
              <button
                type="submit"
                disabled={isLoadingProfile}
                className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Password Change Modal */}
      <Modal isOpen={passwordModal.isOpen} onClose={passwordModal.closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Đổi mật khẩu
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.
            </p>
          </div>

          {/* Error Message */}
          {passwordError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/50 dark:border-red-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{passwordError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {passwordSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/50 dark:border-green-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-300">{passwordSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
            <div className="space-y-5">
              <div>
                <Label>Mật khẩu hiện tại</Label>
                <input
                  type="password"
                  {...passwordForm.register("currentPassword", { required: "Mật khẩu hiện tại là bắt buộc" })}
                  className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <Label>Mật khẩu mới</Label>
                <input
                  type="password"
                  {...passwordForm.register("newPassword", {
                    required: "Mật khẩu mới là bắt buộc",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu mới phải có ít nhất 6 ký tự"
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <Label>Nhập lại mật khẩu mới</Label>
                <input
                  type="password"
                  {...passwordForm.register("confirmPassword", {
                    required: "Vui lòng nhập lại mật khẩu mới",
                    validate: (value) => {
                      const newPassword = passwordForm.getValues("newPassword");
                      return value === newPassword || "Mật khẩu xác nhận không khớp";
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 lg:justify-end">
              <Button variant="outline" onClick={passwordModal.closeModal} disabled={isLoadingPassword}>
                Hủy
              </Button>
              <button
                type="submit"
                disabled={isLoadingPassword}
                className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
