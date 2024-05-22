import { FaCopy } from "react-icons/fa";
import { truncateString } from "@/utils";
import { useState } from "react";

const WalletAddressPill = ({ address }: { address?: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Show the "Copied!" message
        setCopied(true);

        // After 2 seconds, hide the message again
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div className="relative">
      <div
        className="italic p-1 px-2 rounded-full cursor-pointer items-center justify-center flex flex-row gap-2 font-black hover:bg-gray-700 bg-gray-900 select-none transition-all text-xs"
        onClick={() => copyToClipboard(address ?? "--")}
      >
        {truncateString(address ?? "--", 12)}
        <FaCopy />
      </div>
      {copied && (
        <div className="text-[10px]  text-white transition-all absolute -bottom-[16px] italic left-0 right-0 animate-pulse">
          Copied!
        </div>
      )}
    </div>
  );
};

export default WalletAddressPill;
