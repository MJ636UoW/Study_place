"use client";

import React from "react";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { CheckCircle2, ShieldAlert } from "lucide-react";

interface ConfigurationBannerProps {
  className?: string;
  showWhenConfigured?: boolean;
}

export const ConfigurationBanner: React.FC<ConfigurationBannerProps> = ({
  className = "",
  showWhenConfigured = false,
}) => {
  const status = getSupabaseConfigStatus();

  if (status.isConfigured && !showWhenConfigured) {
    return null;
  }

  if (status.isConfigured) {
    return (
      <div
        className={`p-4 border border-forest-800/30 bg-forest-50/50 text-xs font-mono text-forest-900 flex items-start gap-3 ${className}`}
        role="status"
        aria-label="Database Connection Status"
      >
        <CheckCircle2 className="w-4 h-4 text-forest-800 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold uppercase tracking-wider text-[10px] text-forest-800">
            PostgreSQL / Supabase Connected
          </div>
          <div>Live database persistence and authentication active.</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border border-amber-600/40 bg-amber-50/90 text-xs font-mono text-amber-950 flex items-start gap-3 shadow-editorial ${className}`}
      role="alert"
      aria-label="Supabase Configuration Notice"
    >
      <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-900 bg-amber-200/60 px-1.5 py-0.5">
            HONEST INTEGRATION STATUS • UNCONFIGURED
          </span>
          <span className="text-[10px] text-amber-700">Using Replaceable Offline Fixtures</span>
        </div>
        <p className="text-[11px] text-charcoal-700 leading-relaxed font-sans">
          Live PostgreSQL / Supabase credentials are not detected in <code className="font-mono bg-ivory-100 px-1 border border-ivory-300">.env.local</code>.
          The system will not fake successful authentication or database writes.
        </p>
        <div className="pt-1 text-[10px] text-charcoal-600 space-y-0.5">
          <div>Missing environment variables:</div>
          <ul className="list-disc list-inside text-amber-900 font-mono pl-1">
            {status.missingVars.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
          <div className="text-charcoal-500 pt-0.5">
            Refer to <code className="font-mono text-charcoal-800">.env.example</code> for required format.
          </div>
        </div>
      </div>
    </div>
  );
};
