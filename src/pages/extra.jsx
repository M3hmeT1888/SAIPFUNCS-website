import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Extra() {
  const navigate = useNavigate();
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    document.title = "sınavdan 30 aldım..";

    return () => {
      document.title = "SaipFuncs.co | Fizik ve Matematik Simülasyonu";
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-[#060913] flex flex-col items-center justify-center font-sans relative overflow-hidden">
      
      <div className="z-10 flex flex-col items-center text-center px-4">
        
        <h1 className="text-lg md:text-xl font-medium tracking-wide text-gray-200 max-w-4xl leading-relaxed mb-16">
          Kuvvetle muhtemel bana inanmadığın için buraya tıkladın ama bak ne diyeceğim,
          <br />
          bana inanmıyorsan aşağıdaki tuşa tıkla
        </h1>

        <div className="flex flex-col items-center space-y-8">
          
          <button 
            onClick={() => setShowImage(true)}
            className="w-56 h-12 border border-[#007acc] rounded hover:bg-[#007acc]/10 transition-all focus:outline-none shadow-[0_0_15px_rgba(0,122,204,0.1)] hover:shadow-[0_0_20px_rgba(0,122,204,0.3)]"
            title="Sürprizi Gör"
          >
          </button>

          <button 
            onClick={() => navigate('/')}
            className="w-48 py-2 border border-[#007acc] text-[#007acc] font-bold text-[10px] tracking-widest uppercase rounded hover:bg-[#007acc] hover:text-white transition-all"
          >
            ANA MENÜYE DÖN
          </button>
          
        </div>
      </div>

      {showImage && (
        <div 
          className="fixed inset-0 h-screen w-screen bg-black z-50 flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer animate-in fade-in duration-300"
          onClick={() => setShowImage(false)}
          title="Kapatmak için tıkla"
        >
          <img 
            src="/saipbulent.png"
            alt="Saip Bülent Sürprizi" 
            className="w-full h-full object-contain animate-fade-in"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/1920x1080?text=saipbulent.webp+public+klasorunde+yok";
              alert("Dosya yolu hatası! public/ klasöründe saipbulent.webp dosyası olduğundan emin ol.");
            }}
          />
        </div>
      )}

    </div>
  );
}