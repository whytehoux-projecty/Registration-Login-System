import React from "react";
import { Link } from "react-router-dom";
import SpaceBanner from "../assets/banner-for-landingpage.svg";
import PoweredByIcon from "../assets/powered-by.svg";
import Logo from "../assets/whytehoux.png";
import { DescriptionSection } from "../components/DescriptionSection";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Section 1: Banner - Black Background */}
      <section className="bg-black h-screen flex flex-col items-center justify-center overflow-hidden relative">
        <img
          src={SpaceBanner}
          alt="SPACE"
          className="w-full max-w-[95vw] h-auto object-contain animate-float-lift"
        />

        {/* Animated Next Icon - Links to Page 2 */}
        <Link
          to="/interest"
          className="absolute top-8 right-8 animate-bounce-right cursor-pointer group">
          <div className="w-16 h-16 rounded-none border-2 border-white/50 flex items-center justify-center transition-all duration-300 group-hover:border-white group-hover:bg-white/10">
            <svg
              className="w-8 h-8 text-white/70 group-hover:text-white transition-colors duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
        </Link>
      </section>

      {/* New Description Section */}
      <DescriptionSection />

      {/* Section 2: Light Grey Background */}
      <section className="bg-[#d9d9d9] min-h-screen flex flex-col items-center justify-end pb-8 relative">
        {/* Powered By Section */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={PoweredByIcon}
            alt="Powered By"
            style={{ width: "230px", height: "47px" }}
            className="opacity-80 object-contain"
          />
        </div>

        {/* Logo at the bottom center */}
        <div className="mb-4">
          <img
            src={Logo}
            alt="Whytehoux"
            style={{ width: "330px", height: "130px" }}
            className="object-contain"
          />
        </div>
      </section>
    </div>
  );
};
