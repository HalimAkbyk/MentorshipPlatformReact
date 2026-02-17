'use client';

import { useParams } from 'next/navigation';
import { useStaticPage } from '@/lib/hooks/use-cms';
import { FileText } from 'lucide-react';

export default function DynamicStaticPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: page, isLoading, isError } = useStaticPage(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sayfa Bulunamadi</h1>
          <p className="text-gray-500">
            Aradiginiz sayfa mevcut degil veya kaldirilmis olabilir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}
