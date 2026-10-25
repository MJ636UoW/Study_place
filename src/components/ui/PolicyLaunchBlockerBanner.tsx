import React from "react";
import { ShieldAlert } from "lucide-react";
import { checkPolicyLaunchBlockers } from "@/lib/policies/policyCheck";

interface PolicyLaunchBlockerBannerProps {
  policyContent: string;
  policyName: string;
}

export function PolicyLaunchBlockerBanner({ policyContent, policyName }: PolicyLaunchBlockerBannerProps) {
  const result = checkPolicyLaunchBlockers(policyContent);

  if (!result.hasBlockers) {
    return null;
  }

  return (
    <div className="p-6 border-2 border-rose-600 bg-rose-50 text-rose-900 rounded-none space-y-3 my-6 shadow-editorial">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold text-rose-800">
        <ShieldAlert className="w-5 h-5 text-rose-700" />
        <span>CRITICAL LAUNCH BLOCKER: UNFINISHED LEGAL TEXT DETECTED</span>
      </div>
      <p className="text-xs sm:text-sm font-sans leading-relaxed text-rose-900">
        The policy document <strong>{policyName}</strong> contains incomplete placeholder terms ({result.blockers.join(", ")}).
        Per Sanctuary launch standards, production deployment is restricted until all legal placeholders are resolved by legal counsel.
      </p>
    </div>
  );
}
