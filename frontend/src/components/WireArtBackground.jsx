import React from 'react';

const WireArtBackground = () => {
  return (
    <div className="w-full max-w-6xl mx-auto my-6 relative overflow-hidden pointer-events-none select-none opacity-90 dark:opacity-85 transition-all duration-300">
      <svg
        viewBox="0 0 1100 420"
        className="w-full h-auto text-indigo-500/40 dark:text-indigo-400/40 font-sans"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient id="wireGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="30%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#ec4899" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
          </linearGradient>

          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Inline CSS Keyframe Animations */}
        <style>{`
          /* Customer 1: Walk in, checkout, walk out */
          @keyframes walkCustomerIn {
            0% { transform: translateX(-80px); opacity: 0; }
            4% { opacity: 1; }
            25% { transform: translateX(330px); opacity: 1; }
            45% { transform: translateX(330px); opacity: 1; }
            70% { transform: translateX(820px); opacity: 1; }
            80%, 100% { transform: translateX(900px); opacity: 0; }
          }

          /* Customer 2: Bicycle Arrival */
          @keyframes driveBicycle {
            0% { transform: translateX(-100px); opacity: 0; }
            10% { opacity: 1; }
            35% { transform: translateX(170px); opacity: 1; }
            75% { transform: translateX(170px); opacity: 1; }
            95% { transform: translateX(950px); opacity: 1; }
            100% { transform: translateX(980px); opacity: 0; }
          }

          /* Supplier Logistics Truck (Drives Forward Right -> Left) */
          @keyframes driveSupplierTruck {
            0% { transform: translateX(1150px); }
            35% { transform: translateX(650px); }
            70% { transform: translateX(650px); }
            95% { transform: translateX(-250px); }
            100% { transform: translateX(-250px); }
          }

          /* ROAD TRAFFIC ANIMATIONS */
          /* Eastbound Sedan (Left -> Right in Bottom Lane) */
          @keyframes trafficEastCar {
            0% { transform: translateX(-250px); }
            100% { transform: translateX(1350px); }
          }
          /* Eastbound Scooter (Left -> Right in Bottom Lane) */
          @keyframes trafficEastScooter {
            0% { transform: translateX(-150px); }
            100% { transform: translateX(1300px); }
          }
          /* Westbound EV Hatchback (Right -> Left in Top Lane) */
          @keyframes trafficWestCar {
            0% { transform: translateX(1350px); }
            100% { transform: translateX(-250px); }
          }
          /* Westbound SIBIS Bus (Right -> Left in Top Lane) */
          @keyframes trafficWestBus {
            0% { transform: translateX(1450px); }
            100% { transform: translateX(-400px); }
          }

          /* Package Box Hand-off */
          @keyframes unloadBox {
            0%, 35% { opacity: 0; transform: translate(750px, 205px); }
            40% { opacity: 1; transform: translate(730px, 205px); }
            55% { opacity: 1; transform: translate(520px, 185px); }
            62% { opacity: 0; transform: translate(490px, 185px); }
            100% { opacity: 0; }
          }

          /* Speech Bubble Customer 1 & Shopkeeper */
          @keyframes speechCustomer1 {
            0%, 8% { opacity: 0; transform: translateY(5px); }
            12%, 22% { opacity: 1; transform: translateY(0); }
            26%, 100% { opacity: 0; transform: translateY(-5px); }
          }

          /* Low Stock Warning Alert */
          @keyframes stockWarningBubble {
            0%, 28% { opacity: 0; transform: scale(0.9); }
            32%, 48% { opacity: 1; transform: scale(1); }
            52%, 100% { opacity: 0; transform: scale(0.9); }
          }

          /* Auto Reorder Sent Indicator */
          @keyframes autoReorderSignal {
            0%, 48% { opacity: 0; transform: translateY(0); }
            52%, 66% { opacity: 1; transform: translateY(-8px); }
            70%, 100% { opacity: 0; transform: translateY(-15px); }
          }

          /* Dog Tail Wag */
          @keyframes dogTailWag {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(22deg); }
          }

          /* Shopkeeper hand scan motion */
          @keyframes shopkeeperScan {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-15deg); }
          }

          /* AI Satellite Ray beam pulse */
          @keyframes aiBeamPulse {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.7; stroke: #a855f7; }
          }

          .anim-customer-in { animation: walkCustomerIn 24s ease-in-out infinite; }
          .anim-bicycle { animation: driveBicycle 24s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
          .anim-truck { animation: driveSupplierTruck 24s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
          .anim-box { animation: unloadBox 24s ease-in-out infinite; }
          .anim-speech-1 { animation: speechCustomer1 24s infinite; }
          .anim-stock-warn { animation: stockWarningBubble 24s infinite; }
          .anim-reorder-signal { animation: autoReorderSignal 24s infinite; }
          .anim-tail { transform-origin: 220px 252px; animation: dogTailWag 0.5s ease-in-out infinite; }
          .anim-scan-hand { transform-origin: 388px 180px; animation: shopkeeperScan 1.2s ease-in-out infinite; }
          .anim-beam { animation: aiBeamPulse 3s infinite; }

          /* Car Traffic Animation Classes */
          .anim-car-east1 { animation: trafficEastCar 12s linear infinite; }
          .anim-scooter-east { animation: trafficEastScooter 9s linear 4s infinite; }
          .anim-car-west1 { animation: trafficWestCar 15s linear 1s infinite; }
          .anim-bus-west { animation: trafficWestBus 22s linear 6s infinite; }
        `}</style>

        {/* AI Satellite & Overhead Beam */}
        <g stroke="#a855f7" strokeWidth="1.2" opacity="0.6">
          <circle cx="500" cy="20" r="10" strokeDasharray="3 2" />
          <line x1="485" y1="20" x2="515" y2="20" />
          <line x1="500" y1="5" x2="500" y2="35" />
          <circle cx="500" cy="20" r="3" fill="#ec4899" className="animate-ping" />
          <path d="M 490 30 L 420 75 M 510 30 L 580 75" stroke="url(#wireGlow)" strokeDasharray="4 4" className="anim-beam" />
        </g>

        {/* Environment Details (Trees & Lamp) */}
        <g stroke="#818cf8" strokeWidth="1.2" opacity="0.5">
          {/* Left Tree */}
          <line x1="70" y1="250" x2="70" y2="190" />
          <circle cx="70" cy="165" r="24" strokeDasharray="4 2" />
          <circle cx="70" cy="165" r="14" />

          {/* Right Lamp */}
          <path d="M 980 250 L 980 155 Q 980 135 965 135 L 960 135" />
          <path d="M 955 135 L 965 145 L 955 145 Z" fill="#6366f1" fillOpacity="0.3" />
          <circle cx="960" cy="140" r="3" fill="#ec4899" className="animate-ping" />
        </g>

        {/* EXPANDED SIBIS SUPERMARKET STOREFRONT (x=260 to 620, y=80 to 250) */}
        <g stroke="#6366f1" strokeWidth="1.8" filter="url(#neonGlow)">
          {/* Main Store Building Body */}
          <rect x="260" y="80" width="360" height="170" rx="6" />

          {/* Striped Awning Roof */}
          <path d="M 250 80 L 630 80 M 255 80 L 270 103 L 290 80 L 310 103 L 330 80 L 350 103 L 370 80 L 390 103 L 410 80 L 430 103 L 450 80 L 470 103 L 490 80 L 510 103 L 530 80 L 550 103 L 570 80 L 590 103 L 610 80 L 625 103 L 630 80" stroke="#a855f7" />

          {/* Store Header Banner */}
          <rect x="360" y="40" width="160" height="32" rx="8" stroke="#ec4899" fill="#0f172a" fillOpacity="0.5" />
          <text x="440" y="61" textAnchor="middle" fill="#a855f7" stroke="none" fontSize="13" fontWeight="900" letterSpacing="2">
            SIBIS MART
          </text>
          <circle cx="375" cy="56" r="3" fill="#ec4899" />
          <circle cx="505" cy="56" r="3" fill="#ec4899" />

          {/* SECTION 1: POS Checkout Counter & Shopkeeper (x=280 to 390) */}
          <g>
            <rect x="280" y="190" width="110" height="60" rx="3" stroke="#818cf8" fill="#0f172a" fillOpacity="0.3" />
            <rect x="350" y="160" width="30" height="24" rx="2" stroke="#38bdf8" />
            <line x1="365" y1="184" x2="365" y2="190" stroke="#38bdf8" />
            <text x="365" y="176" textAnchor="middle" fill="#38bdf8" stroke="none" fontSize="7" fontWeight="800">
              POS ৳
            </text>

            {/* SHOPKEEPER (Behind counter) */}
            <g stroke="#ec4899" strokeWidth="1.8">
              <circle cx="395" cy="150" r="7" />
              <path d="M 388 148 Q 395 140 405 148" stroke="#a855f7" />
              <circle cx="393" cy="149" r="0.8" fill="#ec4899" />
              <circle cx="397" cy="149" r="0.8" fill="#ec4899" />
              <path d="M 393 153 Q 395 155 397 153" />
              <path d="M 388 157 L 402 157 L 405 190 L 385 190 Z" stroke="#a855f7" fill="#a855f7" fillOpacity="0.1" />
              <path d="M 388 165 L 370 175 L 360 170" className="anim-scan-hand" />
              <rect x="355" y="166" width="8" height="6" rx="1" fill="#10b981" stroke="none" />
            </g>
          </g>

          {/* SECTION 2: Double Entrance Glass Doors (x=415 to 470) */}
          <rect x="415" y="125" width="55" height="125" rx="3" stroke="#818cf8" />
          <line x1="442" y1="125" x2="442" y2="250" stroke="#818cf8" strokeDasharray="4 2" />
          <line x1="438" y1="180" x2="438" y2="195" stroke="#ec4899" strokeWidth="2.5" />
          <line x1="446" y1="180" x2="446" y2="195" stroke="#ec4899" strokeWidth="2.5" />
          <text x="442" y="141" textAnchor="middle" fill="#10b981" stroke="none" fontSize="8" fontWeight="800">
            AUTOMATIC DOOR
          </text>

          {/* SECTION 3: Product Aisle Shelves & Stock Monitoring (x=490 to 600) */}
          <g>
            <rect x="490" y="115" width="115" height="105" rx="3" stroke="#818cf8" strokeDasharray="30 2" />
            <line x1="495" y1="150" x2="600" y2="150" stroke="#818cf8" strokeWidth="1" />
            <line x1="495" y1="183" x2="600" y2="183" stroke="#818cf8" strokeWidth="1" />

            <rect x="500" y="128" width="10" height="16" rx="1" stroke="#a855f7" />
            <rect x="515" y="130" width="12" height="14" rx="2" stroke="#ec4899" />
            <rect x="532" y="128" width="10" height="16" rx="1" stroke="#38bdf8" />
            
            <circle cx="508" cy="167" r="7" stroke="#10b981" />
            <circle cx="526" cy="167" r="7" stroke="#10b981" />
            <rect x="540" y="160" width="14" height="16" rx="1" stroke="#f59e0b" />
            <rect x="560" y="160" width="14" height="16" rx="1" stroke="#f59e0b" />
            
            <rect x="500" y="193" width="18" height="18" rx="2" stroke="#8b5cf6" />
            <rect x="525" y="193" width="18" height="18" rx="2" stroke="#8b5cf6" />
          </g>

          {/* DYNAMIC ACTIVITY BUBBLES */}
          {/* Low Stock Alert */}
          <g className="anim-stock-warn">
            <rect x="485" y="75" width="125" height="24" rx="12" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
            <text x="547" y="90" textAnchor="middle" fill="#f87171" stroke="none" fontSize="8" fontWeight="800">
              ⚠️ BASMATI RICE LOW (2 BGS)
            </text>
          </g>

          {/* Auto Reorder Sent Signal */}
          <g className="anim-reorder-signal">
            <rect x="270" y="103" width="135" height="24" rx="12" fill="#6366f1" fillOpacity="0.25" stroke="#6366f1" strokeWidth="1.5" />
            <text x="337" y="118" textAnchor="middle" fill="#818cf8" stroke="none" fontSize="8" fontWeight="800">
              📲 SIBIS AUTO REORDER SENT
            </text>
          </g>
        </g>

        {/* HAPPY DOG & FOOD BOWL (x=230, y=230) */}
        <g stroke="#f59e0b" strokeWidth="1.6" filter="url(#neonGlow)">
          <ellipse cx="230" cy="240" rx="12" ry="9" />
          <line x1="222" y1="247" x2="222" y2="250" />
          <line x1="228" y1="247" x2="228" y2="250" />
          <line x1="236" y1="247" x2="236" y2="250" />
          <circle cx="240" cy="228" r="7" />
          <path d="M 237 223 Q 232 227 235 233" />
          <path d="M 245 229 L 248 230" />
          <circle cx="248" cy="230" r="1.2" fill="#f59e0b" />
          <path d="M 220 237 Q 210 230 208 223" className="anim-tail" stroke="#f59e0b" strokeWidth="2" />
          <ellipse cx="254" cy="248" rx="7" ry="2.5" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" />
          <path d="M 240 214 C 238 210 234 211 234 214 C 234 217 240 220 240 220 C 240 220 246 217 246 214 C 246 211 242 210 240 214 Z" fill="#ec4899" stroke="none" className="animate-bounce" />
        </g>

        {/* SIDEWALK CURB LINE (y=250) */}
        <line x1="20" y1="250" x2="1080" y2="250" stroke="url(#wireGlow)" strokeWidth="2.5" />

        {/* CUSTOMER 1 (Pedestrian) */}
        <g className="anim-customer-in" stroke="#3b82f6" strokeWidth="1.8">
          <circle cx="0" cy="205" r="6" />
          <line x1="0" y1="211" x2="0" y2="232" />
          <line x1="0" y1="216" x2="-8" y2="226" />
          <line x1="0" y1="216" x2="8" y2="224" />
          <line x1="0" y1="232" x2="-8" y2="250" />
          <line x1="0" y1="232" x2="8" y2="250" />
          
          <g className="anim-speech-1">
            <rect x="-35" y="165" width="85" height="20" rx="10" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.2" />
            <text x="7" y="178" textAnchor="middle" fill="#60a5fa" stroke="none" fontSize="7.5" fontWeight="800">
              💬 "1x Rice, Please!"
            </text>
          </g>
        </g>

        {/* CUSTOMER 2 ON BICYCLE */}
        <g className="anim-bicycle" stroke="#a855f7" strokeWidth="1.8">
          <circle cx="-30" cy="237" r="13" />
          <circle cx="10" cy="237" r="13" />
          <line x1="-30" y1="237" x2="-10" y2="237" />
          <line x1="-10" y1="237" x2="-20" y2="219" />
          <line x1="-30" y1="237" x2="-20" y2="219" />
          <line x1="-20" y1="219" x2="5" y2="219" />
          <line x1="10" y1="237" x2="5" y2="219" />
          <line x1="5" y1="219" x2="5" y2="211" />
          <line x1="2" y1="211" x2="10" y2="211" />
          <circle cx="-15" cy="199" r="5" />
          <line x1="-15" y1="204" x2="-12" y2="219" />
          <line x1="-12" y1="207" x2="5" y2="212" />
        </g>

        {/* SUPPLIER LOGISTICS VAN & UNLOADING BOX (PROPERLY FACING FORWARD LEFT) */}
        <g className="anim-box" stroke="#10b981" strokeWidth="1.8">
          <rect x="0" y="0" width="18" height="18" rx="2" fill="#10b981" fillOpacity="0.3" />
          <line x1="0" y1="9" x2="18" y2="9" />
          <line x1="9" y1="0" x2="9" y2="18" />
          <text x="9" y="13" textAnchor="middle" fill="#10b981" stroke="none" fontSize="7" fontWeight="900">
            ✓
          </text>
        </g>

        <g className="anim-truck" stroke="#10b981" strokeWidth="1.8" filter="url(#neonGlow)">
          {/* Main Truck Body (Cabin hood on LEFT x=0..35, Windshield on LEFT x=10..38, Cargo Box on RIGHT x=38..130) */}
          <path d="M 0 225 L 25 200 L 40 200 L 40 190 L 130 190 L 130 245 L 0 245 Z" fill="#0f172a" fillOpacity="0.4" />
          {/* Windshield on LEFT */}
          <path d="M 10 212 L 27 202 L 38 202 L 38 212 Z" stroke="#34d399" />
          {/* SIBIS LOGISTICS Banner on Cargo Box */}
          <text x="85" y="220" textAnchor="middle" fill="#10b981" stroke="none" fontSize="9" fontWeight="900">
            SIBIS LOGISTICS
          </text>
          {/* Headlight on far LEFT edge */}
          <circle cx="2" cy="228" r="3" fill="#f59e0b" className="animate-pulse" />
          {/* Taillight on far RIGHT edge */}
          <circle cx="128" cy="228" r="3" fill="#ef4444" />
          {/* Wheels */}
          <g stroke="#34d399">
            <circle cx="30" cy="245" r="11" />
            <circle cx="30" cy="245" r="4.5" />
            <circle cx="100" cy="245" r="11" />
            <circle cx="100" cy="245" r="4.5" />
          </g>

          {/* Delivery Driver Worker (Standing near the rear/door x=142) */}
          <g stroke="#10b981" strokeWidth="1.6" transform="translate(142, -20)">
            <circle cx="0" cy="225" r="5" />
            <line x1="0" y1="230" x2="0" y2="250" />
            <line x1="0" y1="235" x2="-8" y2="245" />
            <line x1="0" y1="235" x2="8" y2="245" />
            <line x1="0" y1="250" x2="-6" y2="265" />
            <line x1="0" y1="250" x2="6" y2="265" />
          </g>
        </g>

        {/* ============================================================= */}
        {/* TWO-LANE FRONT ROAD & VEHICLE TRAFFIC                         */}
        {/* ============================================================= */}

        {/* Road Surface Boundaries & Lanes (y=255 to y=415) */}
        <g opacity="0.8">
          {/* Top Road Edge */}
          <line x1="20" y1="255" x2="1080" y2="255" stroke="#64748b" strokeWidth="2" />
          
          {/* Center Dashed Lane Divider (y=335) */}
          <line x1="20" y1="335" x2="1080" y2="335" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="18 12" opacity="0.7" />
          
          {/* Bottom Road Edge */}
          <line x1="20" y1="415" x2="1080" y2="415" stroke="#64748b" strokeWidth="2" />

          {/* Zebra Crosswalk at store door (x=410 to 475, y=256 to 414) */}
          <g stroke="#f59e0b" strokeWidth="8" opacity="0.6">
            <line x1="415" y1="258" x2="415" y2="412" />
            <line x1="430" y1="258" x2="430" y2="412" />
            <line x1="445" y1="258" x2="445" y2="412" />
            <line x1="460" y1="258" x2="460" y2="412" />
            <line x1="475" y1="258" x2="475" y2="412" />
          </g>
        </g>

        {/* Traffic Signal Light Post at Right of Store (x=640) */}
        <g transform="translate(640, 195)" stroke="#f59e0b" strokeWidth="1.8">
          <line x1="0" y1="55" x2="0" y2="0" />
          <rect x="-6" y="-30" width="12" height="30" rx="3" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="0" cy="-22" r="3" fill="#ef4444" />
          <circle cx="0" cy="-15" r="3" fill="#f59e0b" />
          <circle cx="0" cy="-8" r="3" fill="#10b981" className="animate-ping" />
        </g>

        {/* VEHICLE 1: Eastbound Sedan Car (Bottom Lane, y=348) */}
        <g className="anim-car-east1" stroke="#ec4899" strokeWidth="2.2" filter="url(#neonGlow)">
          <g transform="translate(0, 345)">
            <path d="M 0 25 L 12 12 L 40 6 L 90 6 L 115 12 L 145 25 L 145 40 L 0 40 Z" fill="#0f172a" fillOpacity="0.45" />
            <path d="M 42 7 L 62 7 L 62 23 L 26 23 Z" stroke="#f472b6" strokeWidth="1.8" />
            <path d="M 67 7 L 88 7 L 105 23 L 67 23 Z" stroke="#f472b6" strokeWidth="1.8" />
            <line x1="55" y1="27" x2="65" y2="27" stroke="#ec4899" strokeWidth="2" />
            <circle cx="144" cy="28" r="3.5" fill="#f59e0b" className="animate-pulse" />
            <circle cx="2" cy="28" r="3.5" fill="#ef4444" />
            <g stroke="#f472b6" strokeWidth="2">
              <circle cx="30" cy="40" r="10" />
              <circle cx="30" cy="40" r="4" />
              <circle cx="110" cy="40" r="10" />
              <circle cx="110" cy="40" r="4" />
            </g>
          </g>
        </g>

        {/* VEHICLE 2: Eastbound Delivery Scooter (Bottom Lane, y=350) */}
        <g className="anim-scooter-east" stroke="#38bdf8" strokeWidth="2" filter="url(#neonGlow)">
          <g transform="translate(0, 340)">
            <circle cx="10" cy="30" r="8" />
            <circle cx="45" cy="30" r="8" />
            <path d="M 10 30 L 25 30 L 35 15 L 45 30" />
            <line x1="35" y1="15" x2="32" y2="2" />
            <line x1="26" y1="2" x2="38" y2="2" />
            <rect x="0" y="10" width="18" height="16" rx="2" stroke="#38bdf8" fill="#38bdf8" fillOpacity="0.25" />
            <circle cx="40" cy="6" r="2.5" fill="#f59e0b" className="animate-pulse" />
            <circle cx="22" cy="-6" r="6" />
            <line x1="22" y1="0" x2="24" y2="18" />
          </g>
        </g>

        {/* VEHICLE 3: Westbound EV Hatchback (Top Lane, y=275) */}
        <g className="anim-car-west1" stroke="#a855f7" strokeWidth="2.2" filter="url(#neonGlow)">
          <g transform="translate(0, 275)">
            <path d="M 135 24 L 120 12 L 90 6 L 40 6 L 20 14 L 0 24 L 0 38 L 135 38 Z" fill="#0f172a" fillOpacity="0.45" />
            <path d="M 42 7 L 82 7 L 82 22 L 25 22 Z" stroke="#c084fc" strokeWidth="1.8" />
            <path d="M 87 7 L 110 11 L 115 22 L 87 22 Z" stroke="#c084fc" strokeWidth="1.8" />
            <circle cx="2" cy="26" r="3.5" fill="#f59e0b" className="animate-pulse" />
            <circle cx="134" cy="26" r="3.5" fill="#ef4444" />
            <g stroke="#c084fc" strokeWidth="2">
              <circle cx="32" cy="38" r="9.5" />
              <circle cx="32" cy="38" r="4" />
              <circle cx="102" cy="38" r="9.5" />
              <circle cx="102" cy="38" r="4" />
            </g>
          </g>
        </g>

        {/* VEHICLE 4: Westbound SIBIS Express Bus (Top Lane, y=262) */}
        <g className="anim-bus-west" stroke="#34d399" strokeWidth="2.2" filter="url(#neonGlow)">
          <g transform="translate(0, 262)">
            <rect x="0" y="0" width="210" height="52" rx="6" fill="#0f172a" fillOpacity="0.5" />
            <rect x="15" y="8" width="28" height="20" rx="2" stroke="#34d399" />
            <rect x="50" y="8" width="28" height="20" rx="2" stroke="#34d399" />
            <rect x="85" y="8" width="28" height="20" rx="2" stroke="#34d399" />
            <rect x="120" y="8" width="28" height="20" rx="2" stroke="#34d399" />
            <rect x="155" y="8" width="45" height="26" rx="2" stroke="#34d399" />
            <text x="100" y="42" textAnchor="middle" fill="#34d399" stroke="none" fontSize="10" fontWeight="900" letterSpacing="1">
              SIBIS EXPRESS BUS
            </text>
            <circle cx="208" cy="35" r="3.5" fill="#f59e0b" className="animate-pulse" />
            <circle cx="2" cy="35" r="3.5" fill="#ef4444" />
            <g stroke="#34d399" strokeWidth="2">
              <circle cx="40" cy="52" r="11" />
              <circle cx="40" cy="52" r="4.5" />
              <circle cx="165" cy="52" r="11" />
              <circle cx="165" cy="52" r="4.5" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default WireArtBackground;
