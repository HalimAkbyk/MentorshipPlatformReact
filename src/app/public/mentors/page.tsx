'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { useMentors } from '../../../lib/hooks/use-mentors';
import { formatCurrency } from '../../../lib/utils/format';
import { ROUTES } from '../../../lib/constants/routes';

export default function MentorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [university, setUniversity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useMentors({
    searchTerm,
    university: university || undefined,
    page: 1,
    pageSize: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold mb-6">Mentör Bul</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Üniversite, bölüm veya mentör adı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtreler
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 grid md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Üniversite</label>
                <Input
                  placeholder="Üniversite filtrele"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum Fiyat</label>
                <Input type="number" placeholder="₺" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Maximum Fiyat</label>
                <Input type="number" placeholder="₺" />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              {data?.totalCount || 0} mentör bulundu
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.items.map((mentor) => (
                <Link key={mentor.userId} href={ROUTES.MENTOR_PROFILE(mentor.userId)}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={mentor.avatarUrl} />
                          <AvatarFallback>
                            {mentor.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {mentor.displayName}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {mentor.university}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {mentor.department}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="font-semibold">{mentor.ratingAvg.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({mentor.ratingCount})
                          </span>
                        </div>
                        {mentor.isVerified && (
                          <Badge variant="success" className="text-xs">
                            Doğrulanmış
                          </Badge>
                        )}
                      </div>

                      {mentor.hourlyRate && (
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary-600">
                            {formatCurrency(mentor.hourlyRate)}
                          </span>
                          <span className="text-gray-500 text-sm">/saat</span>
                        </div>
                      )}

                      <Button className="w-full mt-4">
                        Profili Görüntüle
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  disabled={!data.hasPreviousPage}
                >
                  Önceki
                </Button>
                <span className="text-sm text-gray-600">
                  Sayfa {data.pageNumber} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={!data.hasNextPage}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}