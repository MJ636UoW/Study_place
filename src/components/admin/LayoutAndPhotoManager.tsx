"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Lock,
  Grid,
  ExternalLink,
  Info,
  Sliders,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SEATS_FIXTURE_18 } from "@/lib/bookingAdapter";
import { LOCKERS_FIXTURE_15, generateLockersList } from "@/lib/pricingMatrix";

interface LayoutAndPhotoManagerProps {
  workstationLayoutImage: string;
  lockerLayoutImage: string;
  seatCustomImages: Record<string, string>;
  lockerCustomImages: Record<string, string>;
  lockerCount?: number;
  onUpdateSeatImage: (seatId: string, url: string) => Promise<void>;
  onUpdateLockerImage: (lockerId: string, url: string) => Promise<void>;
  onUpdateLayoutImage: (type: "workstations" | "lockers", url: string) => Promise<void>;
  showToast: (msg: string) => void;
}

export function LayoutAndPhotoManager({
  workstationLayoutImage,
  lockerLayoutImage,
  seatCustomImages,
  lockerCustomImages,
  lockerCount = 15,
  onUpdateSeatImage,
  onUpdateLockerImage,
  onUpdateLayoutImage,
  showToast,
}: LayoutAndPhotoManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"seats" | "lockers" | "blueprints">("seats");
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<{ title: string; url: string } | null>(null);

  // Hidden file inputs for direct trigger
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const currentActionRef = useRef<{
    targetType: "seat" | "locker" | "layout";
    targetId: string;
  } | null>(null);

  // Trigger camera or gallery for a specific target
  const triggerFileInput = (
    targetType: "seat" | "locker" | "layout",
    targetId: string,
    isCamera: boolean
  ) => {
    currentActionRef.current = { targetType, targetId };
    if (isCamera && cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentActionRef.current) return;

    const { targetType, targetId } = currentActionRef.current;
    const uploadKey = `${targetType}-${targetId}`;
    setUploadingTarget(uploadKey);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetType", targetType);
      formData.append("targetId", targetId);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload photo");
      }

      const uploadedUrl = data.url;

      if (targetType === "seat") {
        await onUpdateSeatImage(targetId, uploadedUrl);
        showToast(`Workstation ${targetId} photo updated and saved live!`);
      } else if (targetType === "locker") {
        await onUpdateLockerImage(targetId, uploadedUrl);
        showToast(`Locker #${targetId} photo updated and saved live!`);
      } else if (targetType === "layout") {
        const layoutType = targetId === "workstations" ? "workstations" : "lockers";
        await onUpdateLayoutImage(layoutType, uploadedUrl);
        showToast(`${targetId === "workstations" ? "Workstations Floorplan" : "Locker Cabinet"} layout image updated!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload error";
      alert(`Could not upload photo: ${msg}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  const lockers = generateLockersList(lockerCount, lockerCustomImages);

  return (
    <div className="space-y-6 text-left">
      {/* Hidden file input for Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Hidden file input for Camera with capture attribute */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Banner and Navigation */}
      <div className="p-6 bg-white border border-ivory-300 rounded-xl shadow-editorial space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-200">
          <div>
            <span className="text-[10px] uppercase font-mono text-amber-800 tracking-wider font-bold">
              Layout & Visual Assets Control
            </span>
            <h2 className="font-serif text-2xl font-bold text-charcoal-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-forest-800" />
              <span>Workstations & 15 Lockers Layout & Photos</span>
            </h2>
            <p className="text-xs text-charcoal-600 mt-0.5">
              Admin can click live camera photos or choose from the device gallery to update every seat, locker, and room layout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/book"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono bg-ivory-100 border border-ivory-300 hover:bg-forest-50 text-forest-900 rounded-lg font-bold transition-all shadow-sm"
            >
              <span>View Student Booking Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Sub-tabs: Seats vs Lockers vs Blueprints */}
        <div className="flex items-center gap-2 border-b border-ivory-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("seats")}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === "seats"
                ? "bg-forest-900 text-white font-bold shadow-sm"
                : "bg-ivory-100 text-charcoal-700 hover:bg-ivory-200"
            }`}
          >
            <span>🪑 18 Workstation Seats</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-forest-800 text-ivory-100">
              18
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("lockers")}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === "lockers"
                ? "bg-forest-900 text-white font-bold shadow-sm"
                : "bg-ivory-100 text-charcoal-700 hover:bg-ivory-200"
            }`}
          >
            <span>🗄️ 15 Storage Lockers</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-forest-800 text-ivory-100">
              {lockerCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("blueprints")}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === "blueprints"
                ? "bg-forest-900 text-white font-bold shadow-sm"
                : "bg-ivory-100 text-charcoal-700 hover:bg-ivory-200"
            }`}
          >
            <span>🗺️ Overall Layout Blueprints</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: WORKSTATION SEATS (18 DESKS)
          ========================================================================= */}
      {activeSubTab === "seats" && (
        <div className="space-y-4">
          <div className="p-4 bg-forest-50 border border-forest-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Camera className="w-5 h-5 text-forest-800 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-forest-950 block">Live Desk Photo Updating</span>
                <span className="text-forest-800">
                  Tap <strong>Open Camera</strong> to snap a photo of any workstation right from your mobile device, or tap <strong>Gallery</strong> to upload. Photos appear instantly in the student Workstation Inspector!
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SEATS_FIXTURE_18.map((seat) => {
              const currentImg = seatCustomImages[seat.id] || seat.photoUrl || "/desk-render-01.jpg";
              const isUploadingThis = uploadingTarget === `seat-${seat.id}`;
              const hasCustomImg = !!seatCustomImages[seat.id];

              return (
                <div
                  key={seat.id}
                  className="p-4 bg-white border border-ivory-300 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-forest-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                          {seat.seatNumber}
                        </span>
                        <div>
                          <h4 className="font-serif text-sm font-bold text-charcoal-900">{seat.name}</h4>
                          <span className="text-[10px] font-mono text-charcoal-500">{seat.zone}</span>
                        </div>
                      </div>
                      {hasCustomImg ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                          Custom Photo
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-ivory-200 text-charcoal-600 rounded-full">
                          Default
                        </span>
                      )}
                    </div>

                    {/* Image Preview Container */}
                    <div className="relative aspect-[16/10] w-full bg-charcoal-100 rounded-lg overflow-hidden border border-ivory-300 group">
                      <img
                        src={currentImg}
                        alt={seat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/desk-render-01.jpg";
                        }}
                      />
                      {isUploadingThis && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Uploading photo…</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewModalImg({ title: seat.name, url: currentImg })}
                        className="absolute bottom-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-mono"
                        title="View Full Photo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Enlarge</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-charcoal-600 font-sans line-clamp-1 italic">
                      {seat.viewDescription}
                    </p>
                  </div>

                  {/* Actions Strip: Camera & Gallery */}
                  <div className="pt-2 border-t border-ivory-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isUploadingThis}
                        onClick={() => triggerFileInput("seat", seat.id, true)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Open Camera</span>
                      </button>

                      <button
                        type="button"
                        disabled={isUploadingThis}
                        onClick={() => triggerFileInput("seat", seat.id, false)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-ivory-100 hover:bg-ivory-200 text-charcoal-800 border border-ivory-300 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-50"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-forest-700" />
                        <span>Gallery / Files</span>
                      </button>
                    </div>

                    {hasCustomImg && (
                      <button
                        type="button"
                        onClick={() => onUpdateSeatImage(seat.id, "")}
                        className="w-full text-center text-[10px] text-charcoal-400 hover:text-rose-600 underline font-mono"
                      >
                        Reset to default photo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: 15 STORAGE LOCKERS (#01 TO #15)
          ========================================================================= */}
      {activeSubTab === "lockers" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-5 h-5 text-amber-800 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-950 block">15 Storage Lockers Layout (#01 to #15)</span>
                <span className="text-amber-800">
                  Each locker has its own photo, dimensions, and occupancy status. Admin can capture photos of individual locker compartments or the locker key cabinet.
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300 whitespace-nowrap">
              Total Lockers: {lockerCount}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {lockers.map((locker) => {
              const currentImg =
                lockerCustomImages[locker.id] ||
                locker.photoUrl ||
                "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=600&q=80";
              const isUploadingThis = uploadingTarget === `locker-${locker.id}`;
              const hasCustomImg = !!lockerCustomImages[locker.id];

              return (
                <div
                  key={locker.id}
                  className="p-3.5 bg-white border border-ivory-300 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-forest-800" />
                        <span className="font-mono font-bold text-sm text-charcoal-900">{locker.number}</span>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-forest-50 border border-forest-200 text-forest-800 rounded">
                        {locker.size}
                      </span>
                    </div>

                    {/* Locker Image Preview */}
                    <div className="relative aspect-[4/3] w-full bg-slate-100 rounded-lg overflow-hidden border border-ivory-200 group">
                      <img
                        src={currentImg}
                        alt={locker.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                      {isUploadingThis && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px] gap-1">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading…</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewModalImg({ title: `Locker ${locker.number}`, url: currentImg })}
                        className="absolute bottom-1.5 right-1.5 p-1 bg-black/70 hover:bg-black text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-mono"
                      >
                        Enlarge
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-charcoal-500">
                      <span>Status:</span>
                      <strong className={locker.status === "available" ? "text-emerald-700" : "text-amber-700"}>
                        {locker.status === "available" ? "Available" : "Occupied"}
                      </strong>
                    </div>
                  </div>

                  {/* Actions: Camera & Gallery */}
                  <div className="pt-2 border-t border-ivory-200 space-y-1.5">
                    <button
                      type="button"
                      disabled={isUploadingThis}
                      onClick={() => triggerFileInput("locker", locker.id, true)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-[11px] font-mono font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Camera</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUploadingThis}
                      onClick={() => triggerFileInput("locker", locker.id, false)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 bg-ivory-100 hover:bg-ivory-200 text-charcoal-800 border border-ivory-300 rounded-lg text-[11px] font-mono font-bold transition-all disabled:opacity-50"
                    >
                      <ImageIcon className="w-3 h-3 text-forest-700" />
                      <span>Gallery</span>
                    </button>

                    {hasCustomImg && (
                      <button
                        type="button"
                        onClick={() => onUpdateLockerImage(locker.id, "")}
                        className="w-full text-center text-[9px] text-charcoal-400 hover:text-rose-600 underline font-mono"
                      >
                        Reset photo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: OVERALL BLUEPRINTS & ROOM LAYOUTS
          ========================================================================= */}
      {activeSubTab === "blueprints" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Workstations Floor Plan Layout */}
          <div className="p-5 bg-white border border-ivory-300 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
              <div>
                <h3 className="font-serif text-base font-bold text-charcoal-900">
                  Workstations Sanctuary Floor Plan
                </h3>
                <p className="text-xs text-charcoal-500">
                  The primary architectural floor plan layout displayed on the booking page.
                </p>
              </div>
            </div>

            <div className="relative aspect-[16/10] w-full bg-slate-100 rounded-lg overflow-hidden border border-ivory-300">
              <img
                src={workstationLayoutImage || "/room-layout.png"}
                alt="Workstations Sanctuary Layout"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/room-layout.png";
                }}
              />
              {uploadingTarget === "layout-workstations" && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Uploading Floorplan…</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => triggerFileInput("layout", "workstations", true)}
                className="flex items-center justify-center gap-2 py-2.5 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-xs font-mono font-bold shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>Camera Photo</span>
              </button>

              <button
                type="button"
                onClick={() => triggerFileInput("layout", "workstations", false)}
                className="flex items-center justify-center gap-2 py-2.5 bg-ivory-100 hover:bg-ivory-200 text-charcoal-800 border border-ivory-300 rounded-lg text-xs font-mono font-bold"
              >
                <ImageIcon className="w-4 h-4 text-forest-700" />
                <span>Gallery / File</span>
              </button>
            </div>
          </div>

          {/* 15 Lockers Cabinet Layout */}
          <div className="p-5 bg-white border border-ivory-300 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
              <div>
                <h3 className="font-serif text-base font-bold text-charcoal-900">
                  15-Locker Cabinet Bank Layout
                </h3>
                <p className="text-xs text-charcoal-500">
                  Photo or diagram of the 15-locker steel cabinet unit for student orientation.
                </p>
              </div>
            </div>

            <div className="relative aspect-[16/10] w-full bg-slate-100 rounded-lg overflow-hidden border border-ivory-300">
              <img
                src={lockerLayoutImage || "/desk-render-01.jpg"}
                alt="15 Lockers Cabinet Layout"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/desk-render-01.jpg";
                }}
              />
              {uploadingTarget === "layout-lockers" && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Uploading Cabinet Photo…</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => triggerFileInput("layout", "lockers", true)}
                className="flex items-center justify-center gap-2 py-2.5 bg-forest-800 hover:bg-forest-900 text-white rounded-lg text-xs font-mono font-bold shadow-sm"
              >
                <Camera className="w-4 h-4" />
                <span>Camera Photo</span>
              </button>

              <button
                type="button"
                onClick={() => triggerFileInput("layout", "lockers", false)}
                className="flex items-center justify-center gap-2 py-2.5 bg-ivory-100 hover:bg-ivory-200 text-charcoal-800 border border-ivory-300 rounded-lg text-xs font-mono font-bold"
              >
                <ImageIcon className="w-4 h-4 text-forest-700" />
                <span>Gallery / File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Modal */}
      {previewModalImg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
              <h3 className="font-serif text-lg font-bold text-charcoal-900">
                {previewModalImg.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="p-1 hover:bg-ivory-100 rounded text-charcoal-500 font-mono text-sm"
              >
                ✕ Close
              </button>
            </div>
            <div className="relative aspect-[16/10] w-full bg-slate-900 rounded-lg overflow-hidden">
              <img
                src={previewModalImg.url}
                alt={previewModalImg.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
