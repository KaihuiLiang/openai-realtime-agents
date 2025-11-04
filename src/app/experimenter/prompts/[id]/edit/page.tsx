"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PromptsEditRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/experimenter/agents/${params.id}/edit`);
  }, [params.id, router]);

  return null;
}
