import Link from 'next/link';
import React from 'react';

export default function ExperimenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-gradient-to-br from-slate-50 to-blue-50">
      <aside className="bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 shadow-2xl border-r border-slate-700">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Experimenter</h1>
          <p className="text-slate-400 text-xs mt-1">Research Dashboard</p>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink href="/experimenter">Overview</NavLink>
          <NavLink href="/experimenter/agents">Agents</NavLink>
          <NavLink href="/experimenter/participants">Participants</NavLink>
          <NavLink href="/experimenter/assignments">Assignments</NavLink>
        </nav>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href}
      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-700 hover:text-white text-slate-300 hover:translate-x-1"
    >
      {children}
    </Link>
  );
}
