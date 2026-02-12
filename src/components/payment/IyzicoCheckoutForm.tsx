'use client';

import { useEffect, useRef } from 'react';

interface IyzicoCheckoutFormProps {
  checkoutFormContent: string;
  onClose?: () => void;
}

export function IyzicoCheckoutForm({
  checkoutFormContent,
  onClose
}: IyzicoCheckoutFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !checkoutFormContent) return;

    // ✅ Önceki iyzico artıklarını temizle
    const existingIframes = document.querySelectorAll('iframe[src*="iyzipay"]');
    existingIframes.forEach(iframe => iframe.remove());

    // ✅ Global iyzico değişkenlerini temizle
    if ((window as any).iyziInit) {
      delete (window as any).iyziInit;
    }

    // ✅ Önceki iyzico script'lerini temizle
    const oldScripts = document.querySelectorAll('script[src*="iyzipay"]');
    oldScripts.forEach(s => s.remove());

    // ✅ Container'ı temizle ve HTML'i ekle
    containerRef.current.innerHTML = '';
    containerRef.current.innerHTML = checkoutFormContent;

    // ✅ Script'leri yeniden oluşturup execute et
    const scripts = containerRef.current.getElementsByTagName('script');
    Array.from(scripts).forEach((script) => {
      const newScript = document.createElement('script');
      // Attribute'ları kopyala
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      // Inline script içeriğini kopyala
      if (script.text) {
        newScript.text = script.text;
      }
      // Eski script'i yenisiyle değiştir (bu execute eder)
      script.parentNode?.replaceChild(newScript, script);
    });

    // ✅ Cleanup: component unmount olunca temizle
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      const iframes = document.querySelectorAll('iframe[src*="iyzipay"]');
      iframes.forEach(iframe => iframe.remove());
    };
  }, [checkoutFormContent]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Ödeme</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          )}
        </div>
        <div ref={containerRef} className="p-4" id="iyzico-checkout-container" />
      </div>
    </div>
  );
}