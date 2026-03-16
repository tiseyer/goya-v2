'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { members, allCountries, type MemberRole } from '@/lib/members-data';

const ROLES: Array<'All' | MemberRole> = ['All', 'Teacher', 'Student', 'School', 'Wellness Practitioner'];

const ROLE_STYLES: Record<string, { badge: string; bar: string; dot: string }> = {
  Teacher: { badge: 'bg-teal-50 text-teal-700', bar: 'bg-teal-400', dot: 'bg-teal-500' },
  Student: { badge: 'bg-blue-50 text-blue-700', bar: 'bg-blue-400', dot: 'bg-blue-500' },
  School: { badge: 'bg-purple-50 text-purple-700', bar: 'bg-purple-400', dot: 'bg-purple-500' },
  'Wellness Practitioner': { badge: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-400', dot: 'bg-emerald-500' },
};

export default function MembersPage() {
  const [roleFilter, setRoleFilter] = useState<'All' | MemberRole>('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (roleFilter !== 'All' && m.role !== roleFilter) return false;
      if (countryFilter !== 'All' && m.country !== countryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.city.toLowerCase().includes(q) &&
          !m.country.toLowerCase().includes(q) &&
          !m.bio.toLowerCase().includes(q) &&
          !m.teachingStyles.some(s => s.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [roleFilter, countryFilter, search]);

  const hasFilters = roleFilter !== 'All' || countryFilter !== 'All' || search !== '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-[#1a2744] py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-20 top-0 w-80 h-80 bg-[#2dd4bf] opacity-[0.04] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 rounded-full px-3 py-1 text-[#2dd4bf] text-xs font-medium mb-5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {members.length} Members Worldwide
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Member Directory</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Discover yoga teachers, students, schools, and wellness practitioners from across the globe.
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf] placeholder-slate-400"
              />
            </div>

            {/* Role pills */}
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    roleFilter === role
                      ? 'bg-[#1a2744] text-white border-[#1a2744]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {role === 'All' ? 'All Roles' : role}
                </button>
              ))}
            </div>

            {/* Country select */}
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf] bg-white text-slate-700 min-w-[150px]"
            >
              {allCountries.map(c => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Countries' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-800">{filtered.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{members.length}</span> members
          </p>
          {hasFilters && (
            <button
              onClick={() => { setRoleFilter('All'); setCountryFilter('All'); setSearch(''); }}
              className="text-xs text-[#2dd4bf] hover:text-[#14b8a6] font-semibold transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold mb-1">No members found</p>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(member => {
              const style = ROLE_STYLES[member.role];
              return (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 hover:border-[#2dd4bf]/20 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {/* Role accent bar */}
                  <div className={`h-1 ${style.bar}`} />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Top row */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-[60px] h-[60px] rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-[#2dd4bf]/30 transition-all"
                        />
                        {member.featured && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2dd4bf] rounded-full flex items-center justify-center ring-2 ring-white">
                            <svg className="w-2.5 h-2.5 text-[#1a2744]" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-[15px] truncate group-hover:text-[#1a2744] leading-snug">
                          {member.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${style.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-3">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{member.city}, {member.country}</span>
                    </div>

                    {/* Designations */}
                    {member.designations.filter(d => d !== 'GOYA Member').length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {member.designations.filter(d => d !== 'GOYA Member').slice(0, 3).map(d => (
                          <span
                            key={d}
                            className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                          >
                            {d}
                          </span>
                        ))}
                        {member.designations.filter(d => d !== 'GOYA Member').length > 3 && (
                          <span className="text-xs text-slate-400 font-medium self-center">
                            +{member.designations.filter(d => d !== 'GOYA Member').length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bio */}
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 flex-1 mb-4">
                      {member.bio}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400">Since {member.memberSince}</span>
                      <span className="text-xs font-semibold text-[#2dd4bf] group-hover:text-[#14b8a6] flex items-center gap-1 transition-colors">
                        View Profile
                        <svg
                          className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
