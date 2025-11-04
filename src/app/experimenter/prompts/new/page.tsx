"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PromptsNewRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/experimenter/agents/new');
  }, [router]);

  return null;
}
