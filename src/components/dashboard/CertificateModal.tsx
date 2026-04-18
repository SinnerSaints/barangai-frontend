"use client";

import { useRef, useState } from "react";
import { X, Download, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { type CertificateEligibilityResponse } from "@/lib/statistics";
import { useTheme } from "@/context/theme";

type CertificateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateEligibilityResponse | null;
  isLoading: boolean;
};

export default function CertificateModal({ isOpen, onClose, data, isLoading }: CertificateModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      setIsDownloading(true);
      const element = certificateRef.current;
      
      // Temporarily scale up for better PDF resolution
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        backgroundColor: "#FAF9F6" // Force paper color
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`BarangAI_Certificate_${data?.user_name?.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${isDark ? "bg-[#0b0f10] border-white/10" : "bg-white border-gray-200"}`}>
        
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b backdrop-blur-md ${isDark ? "border-white/10 bg-[#0b0f10]/80" : "border-gray-200 bg-white/80"}`}>
          <h2 className="text-lg font-bold">Digital Literacy Certificate</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-500/20 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-accentGreen mb-4" />
              <p className="opacity-70">Verifying eligibility...</p>
            </div>
          ) : !data?.eligible ? (
            // INELIGIBLE STATE
            <div className="flex flex-col items-center text-center py-10 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Not quite ready yet!</h3>
              <p className="opacity-70 mb-8">{data?.message}</p>
              
              <div className={`w-full text-left p-6 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-60">Requirements to meet:</h4>
                <ul className="space-y-3">
                  {data?.action_items?.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 text-rose-500">•</div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            // ELIGIBLE STATE - CERTIFICATE RENDER
            <div className="flex flex-col items-center">
              <div className="w-full overflow-x-auto pb-4 flex justify-center">
                
                {/* THE ACTUAL CERTIFICATE DESIGN (Fixed size for perfect A4 Aspect Ratio) */}
                <div 
                  ref={certificateRef}
                  className="relative shrink-0 bg-[#FAF9F6] text-slate-900 border-[12px] border-double border-slate-300 shadow-sm flex flex-col items-center justify-center p-12"
                  style={{ width: "800px", height: "565px" }} // Standard A4 Landscape roughly
                >
                  {/* Decorative background border */}
                  <div className="absolute inset-2 border border-slate-200 pointer-events-none"></div>

                  <div className="text-center mb-6">
                    <p className="text-sm font-bold tracking-[0.2em] text-slate-500 uppercase mb-2">BarangAI Digital Literacy Initiative</p>
                    <h1 className="text-4xl font-serif font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-4 inline-block px-12">
                      Certificate of Excellence
                    </h1>
                  </div>

                  <p className="text-slate-500 italic mb-4">This is proudly presented to</p>

                  <h2 className="text-5xl font-bold text-[#2A4D14] mb-6 font-serif">
                    {data.user_name}
                  </h2>

                  <p className="text-center text-sm max-w-lg leading-relaxed text-slate-700 mb-6">
                    For demonstrating exemplary commitment to public service through digital upskilling. 
                    Having successfully completed the required coursework and practical assessments, 
                    the recipient has officially achieved the rank of:
                  </p>

                  <h3 className="text-2xl font-bold tracking-widest text-[#5A9B29] uppercase mb-8">
                    {data.stats?.proficiency}
                  </h3>

                  <div className="flex justify-between items-end w-full max-w-2xl mt-auto pt-6 border-t border-slate-300">
                    
                    {/* LEFT SIDE: Issued Date & Verification ID */}
                    <div className="text-left pb-1">
                      <div className="text-[10px] text-slate-400">
                        <p className="mb-0.5">Issued: <span className="text-slate-500">{new Date(data.issued_at!).toLocaleDateString()}</span></p>
                        <p>Verification ID: <span className="font-mono text-slate-500">{data.certificate_id}</span></p>
                      </div>
                    </div>
                    
                    {/* RIGHT SIDE: Performance Metrics */}
                    <div className="text-right">
                      <div className="text-xs text-slate-500">
                        <p className="font-bold text-slate-700 mb-1.5 tracking-wider">PERFORMANCE METRICS</p>
                        <p className="mb-0.5">Lessons Completed: <span className="font-semibold text-slate-700">{data.stats?.lessons_completed}</span></p>
                        <p>Average Quiz Score: <span className="font-semibold text-slate-700">{data.stats?.quiz_avg}%</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="mt-6 flex items-center gap-2 bg-[#5A9B29] hover:bg-[#4a8022] text-white px-8 py-3 rounded-full font-semibold transition disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                {isDownloading ? "Generating PDF..." : "Download Certificate"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}