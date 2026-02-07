'use client';

import Link from 'next/link';

const DEV_PAGES = [
  {
    name: 'Captain Nova',
    slug: 'dev-captain-nova',
    color: '#22d3ee',
    description: 'AI companion character',
  },
  {
    name: 'Asteroid Field',
    slug: 'dev-asteroid',
    color: '#f97316',
    description: 'Recurring charges & subscription fees',
  },
  {
    name: 'Ion Storm',
    slug: 'dev-ion-storm',
    color: '#a855f7',
    description: 'Volatile spending patterns',
  },
  {
    name: 'Solar Flare',
    slug: 'dev-solar-flare',
    color: '#fbbf24',
    description: 'Large unexpected charges',
  },
  {
    name: 'Black Hole',
    slug: 'dev-black-hole',
    color: '#4c1d95',
    description: 'Debt accumulation',
  },
  {
    name: 'Wormhole',
    slug: 'dev-wormhole',
    color: '#60a5fa',
    description: 'Missed cashback & rewards',
  },
  {
    name: 'Enemy Cruiser',
    slug: 'dev-enemy-cruiser',
    color: '#991b1b',
    description: 'Fraud & unauthorized charges',
  },
] as const;

export default function DevHubPage() {
  return (
    <div className="min-h-screen bg-black p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-block font-rajdhani text-2xl px-9 py-4.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            &larr; Back to Bridge
          </Link>
          <h1 className="font-orbitron text-2xl text-cyan-400 tracking-wider mt-2">
            DEV HUB
          </h1>
          <p className="font-rajdhani text-sm text-cyan-400/60 mt-1">
            Isolated testing environments for each visual component
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEV_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/${page.slug}`}
              className="block rounded-lg border border-gray-700/50 bg-gray-900/50 p-14 hover:bg-gray-800/50 transition-colors group"
              style={{ borderLeftColor: page.color, borderLeftWidth: '3px' }}
            >
              <h2
                className="font-orbitron text-2xl tracking-wider mb-4"
                style={{ color: page.color }}
              >
                {page.name}
              </h2>
              <p className="font-rajdhani text-lg text-gray-400 group-hover:text-gray-300 transition-colors">
                {page.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
