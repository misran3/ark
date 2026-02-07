import { BridgeDataContainer } from '@/src/containers/BridgeDataContainer';
import { AsteroidsContainer } from '@/src/containers/AsteroidsContainer';
import { VisaShieldsContainer } from '@/src/containers/VisaShieldsContainer';

export const metadata = {
  title: 'Module 6: Bridge Data Isolation Test',
  description: 'Isolation test page for SynesthesiaPay Bridge UI Data components',
};

/**
 * Renders the "Module 6: Data Display" isolation test page for Bridge UI data components.
 *
 * The page composes the BridgeDataContainer, AsteroidsContainer, and VisaShieldsContainer into a full-screen,
 * styled test layout with a starfield background, scanline overlay, sectioned headers, and a footer with build info.
 *
 * @returns The React element tree representing the Bridge Data Isolation Test UI page.
 */
export default function BridgeDataTestPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      {/* Starfield Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(1px 1px at 20px 30px, white, transparent),
                            radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
                            radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.6), transparent),
                            radial-gradient(1px 1px at 90px 40px, white, transparent),
                            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.7), transparent),
                            radial-gradient(1px 1px at 160px 120px, white, transparent),
                            radial-gradient(2px 2px at 200px 50px, rgba(6,182,212,0.5), transparent),
                            radial-gradient(1px 1px at 220px 150px, white, transparent),
                            radial-gradient(1px 1px at 260px 90px, rgba(255,255,255,0.6), transparent),
                            radial-gradient(2px 2px at 300px 130px, rgba(217,70,239,0.4), transparent)`,
          backgroundSize: '320px 200px',
        }}
      />

      {/* Scanline Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 py-8 px-4">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="text-[10px] font-mono text-cyan-500/60 tracking-[0.5em] mb-2">
            SYNESTHESIAPAY // BRIDGE SYSTEMS
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Module 6: Data Display
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-mono">
            ISOLATION TEST ENVIRONMENT
          </p>
        </header>

        {/* Section 1: Bridge Data (HUD + Metrics + Transactions) */}
        <section className="mb-16">
          <div className="text-center mb-6">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-cyan-500/80 mb-1">
              Section 1: Financial Overview
            </h2>
            <p className="text-[10px] text-gray-600 font-mono">
              BridgeDataContainer → BalanceHUD + BottomMetricsBar + TransactionLog
            </p>
          </div>
          <BridgeDataContainer />
        </section>

        {/* Divider */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>

        {/* Section 2: Asteroids (Threat Detection) */}
        <section className="mb-16">
          <div className="text-center mb-6">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-amber-500/80 mb-1">
              Section 2: Threat Detection
            </h2>
            <p className="text-[10px] text-gray-600 font-mono">
              AsteroidsContainer → AsteroidCard[]
            </p>
          </div>
          <AsteroidsContainer />
        </section>

        {/* Section 3: Visa Shields */}
        <section className="mb-16">
          <div className="text-center mb-6">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-fuchsia-500/80 mb-1">
              Section 3: Security Systems
            </h2>
            <p className="text-[10px] text-gray-600 font-mono">
              VisaShieldsContainer → VisaControlRule[]
            </p>
          </div>
          <VisaShieldsContainer />
        </section>

        {/* Footer */}
        <footer className="text-center mt-16 pb-8">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6 max-w-md mx-auto" />
          <div className="text-[10px] font-mono text-gray-600 space-y-1">
            <div>BUILD VERSION: 0.1.0-ALPHA</div>
            <div>DATA SOURCE: OFFICIAL SHARED MOCKS</div>
            <div className="text-cyan-500/50">
              MODULE 6 // AKSHAT // BRIDGE UI DATA
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}