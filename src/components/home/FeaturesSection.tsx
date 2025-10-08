'use client';

import Link from 'next/link';

import { IconSparkles } from './Icons';

export default function FeaturesSection() {
  return (
    <>
      {/* Hero section */}
      <section className="bg-[#18191A]/90 rounded-3xl p-8 border-2 border-[#41e0b3]/30 shadow-2xl shadow-[#41e0b3]/10 animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-white font-extrabold text-3xl mb-4 leading-tight drop-shadow">
            Envíos más{' '}
            <span className="bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] bg-clip-text text-transparent">
              inteligentes
            </span>
          </h1>
          <p className="text-gray-300 text-base leading-relaxed mb-8 font-light">
            Plataforma diseñada para hacer tus envíos <br />
            <span className="font-semibold text-[#41e0b3]">simples, rápidos y económicos</span>
          </p>
        </div>
        <div className="flex justify-center">
          <Link
            href="/cotizador"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#41e0b3] to-[#2bbd8c] text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-[#41e0b3]/30 hover:shadow-xl hover:shadow-[#41e0b3]/50 transform hover:scale-105 transition-all duration-300 animate-bounce"
          >
            <IconSparkles />
            <span>Cotizar ahora</span>
          </Link>
        </div>
      </section>

      {/* Beneficios */}
      <section className="space-y-6 animate-fade-in-up">
        <div className="text-center">
          <h2 className="text-[#41e0b3] font-bold text-xl mb-2 drop-shadow">¿Por qué Bisonte?</h2>
          <p className="text-gray-500 text-sm font-light">Ventajas que marcan la diferencia</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Rapidez */}
          <div className="bg-[#18191A]/90 rounded-2xl p-6 border border-[#41e0b3]/20 text-center group hover:bg-[#41e0b3]/10 transition-all duration-300 shadow">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-sm mb-2">Rapidez</h3>
            <p className="text-gray-300 text-xs font-light leading-relaxed">Entregas en 24-48 horas</p>
          </div>

          {/* Ahorro */}
          <div className="bg-[#18191A]/90 rounded-2xl p-6 border border-[#41e0b3]/20 text-center group hover:bg-[#41e0b3]/10 transition-all duration-300 shadow">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M12 6v12m-3-2.818l.879.659c1.171.8 3.07.8 4.242 0 1.172-.8 1.172-2.164 0-2.964C13.106 12.5 12.553 12 12 12s-1.106-.5-2.121-.123C8.757 12.696 8.757 14.06 9.879 14.818L12 16.5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-sm mb-2">Ahorro</h3>
            <p className="text-gray-300 text-xs font-light leading-relaxed">
              Hasta 40% menos que otros
            </p>
          </div>

          {/* Seguridad */}
          <div className="bg-[#18191A]/90 rounded-2xl p-6 border border-[#41e0b3]/20 text-center group hover:bg-[#41e0b3]/10 transition-all duration-300 shadow">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-sm mb-2">Seguridad</h3>
            <p className="text-gray-300 text-xs font-light leading-relaxed">
              Protección total garantizada
            </p>
          </div>

          {/* Cobertura */}
          <div className="bg-[#18191A]/90 rounded-2xl p-6 border border-[#41e0b3]/20 text-center group hover:bg-[#41e0b3]/10 transition-all duration-300 shadow">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white text-sm mb-2">Cobertura</h3>
            <p className="text-gray-300 text-xs font-light leading-relaxed">Red nacional completa</p>
          </div>
        </div>
      </section>

      {/* Proceso simple */}
      <section className="bg-[#23272b]/90 rounded-3xl p-8 border-2 border-[#41e0b3]/20 shadow-xl shadow-[#41e0b3]/10 animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-[#41e0b3] font-bold text-xl mb-2">Proceso simple</h2>
          <p className="text-gray-400 text-sm font-light">En solo 3 pasos</p>
        </div>
        <div className="space-y-6">
          {[
            { num: '01', title: 'Cotiza', desc: 'Ingresa datos básicos del envío' },
            { num: '02', title: 'Confirma', desc: 'Elige tu opción preferida' },
            { num: '03', title: 'Envía', desc: 'Nosotros nos encargamos' },
          ].map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#41e0b3] to-[#2bbd8c] rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 animate-bounce">
                {step.num}
              </div>
              <div className="pt-1">
                <h4 className="font-semibold text-white text-sm mb-1">{step.title}</h4>
                <p className="text-gray-300 text-xs font-light">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
