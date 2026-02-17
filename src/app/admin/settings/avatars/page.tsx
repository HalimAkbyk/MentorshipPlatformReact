"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AvatarSettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/avatars");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Yonlendiriliyor...</p>
    </div>
  );
}
