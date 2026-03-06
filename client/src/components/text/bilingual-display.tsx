import { HebrewText } from "./hebrew-text";
import { EnglishText } from "./english-text";
import type { TalmudText } from "@/types/talmud";

interface BilingualDisplayProps {
  text: TalmudText;
}

export function BilingualDisplay({ text }: BilingualDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-sepia-200 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hebrew Text (First on Mobile/Stacked, Right Side on Desktop) */}
        <div className="space-y-6 lg:order-2">
          <h3 className="text-lg font-semibold text-talmud-brown border-b border-sepia-200 pb-2">
            טקסט עברי
          </h3>
          <HebrewText text={text.hebrewText} />
        </div>

        {/* English Text (Second on Mobile/Stacked, Left Side on Desktop) */}
        <div className="space-y-6 lg:order-1">
          <h3 className="text-lg font-semibold text-talmud-brown border-b border-sepia-200 pb-2">
            English Translation
          </h3>
          <EnglishText text={text.englishText} />
        </div>
      </div>
    </div>
  );
}
