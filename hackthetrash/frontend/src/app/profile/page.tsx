"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function MyProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace(`/profile/${user.id}`);
    else router.replace("/admin/login?next=/profile");
  }, [loading, user, router]);

  return <div className="p-8 text-gray-500 text-center">Loading…</div>;
}
