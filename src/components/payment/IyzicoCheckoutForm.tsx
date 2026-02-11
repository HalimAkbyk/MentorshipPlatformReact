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
    if (containerRef.current) {
      containerRef.current.innerHTML = checkoutFormContent;
      
      // Script'leri execute et
      const scripts = containerRef.current.getElementsByTagName('script');
      Array.from(scripts).forEach((script) => {
        const newScript = document.createElement('script');
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.text = script.text;
        script.parentNode?.replaceChild(newScript, script);
      });
    }
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
        <div ref={containerRef} className="p-4" />
      </div>
    </div>
  );
}