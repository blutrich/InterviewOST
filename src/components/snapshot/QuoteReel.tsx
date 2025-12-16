"use client";

interface Quote {
  quote: string;
  context: string;
  emotion: string;
}

interface QuoteReelProps {
  quotes: Quote[];
}

export function QuoteReel({ quotes }: QuoteReelProps) {
  if (!quotes || quotes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Quote Reel
          </h2>
        </div>
        <div className="p-8">
          <p className="text-landing-stone">No quotes extracted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
      <div className="px-8 py-6 border-b border-landing-charcoal/5">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-1">
          Quote Reel
        </h2>
        <p className="text-sm text-landing-stone">
          Most emotionally resonant moments from the interview
        </p>
      </div>
      <div className="p-8">
        <div className="space-y-6">
          {quotes.map((item, index) => (
            <div
              key={index}
              className="relative border-l-2 pl-6 py-1"
              style={{ borderColor: getEmotionColor(item.emotion) }}
            >
              <blockquote className="text-lg italic text-landing-charcoal leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span
                  className="text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: getEmotionColor(item.emotion) + "15",
                    color: getEmotionColor(item.emotion),
                  }}
                >
                  {item.emotion}
                </span>
                <span className="text-sm text-landing-stone">
                  {item.context}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getEmotionColor(emotion: string): string {
  const lowerEmotion = emotion.toLowerCase();

  if (lowerEmotion.includes("frustrat") || lowerEmotion.includes("angry") || lowerEmotion.includes("annoyed")) {
    return "#b45309"; // terracotta-like
  }
  if (lowerEmotion.includes("confus") || lowerEmotion.includes("unsure")) {
    return "#9a8478"; // stone
  }
  if (lowerEmotion.includes("happy") || lowerEmotion.includes("satisf") || lowerEmotion.includes("delight")) {
    return "#2d5a47"; // forest
  }
  if (lowerEmotion.includes("excit") || lowerEmotion.includes("enthus")) {
    return "#c2724e"; // terracotta
  }
  if (lowerEmotion.includes("worry") || lowerEmotion.includes("anxious") || lowerEmotion.includes("fear")) {
    return "#9a8478"; // stone
  }
  if (lowerEmotion.includes("hope") || lowerEmotion.includes("optimis")) {
    return "#4a7c65"; // forest light
  }
  if (lowerEmotion.includes("disappoint")) {
    return "#9a8478"; // stone
  }
  if (lowerEmotion.includes("surprise")) {
    return "#c2724e"; // terracotta
  }

  return "#9a8478"; // stone default
}
