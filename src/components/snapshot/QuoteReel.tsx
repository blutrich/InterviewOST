"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Quote Reel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No quotes extracted.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💬</span>
          Quote Reel
        </CardTitle>
        <p className="text-sm text-gray-500">
          Most emotionally resonant moments from the interview
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quotes.map((item, index) => (
            <div
              key={index}
              className="relative border-l-4 pl-4 py-2"
              style={{ borderColor: getEmotionColor(item.emotion) }}
            >
              <blockquote className="text-lg italic text-gray-800 dark:text-gray-200">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: getEmotionColor(item.emotion) + "20",
                    color: getEmotionColor(item.emotion),
                  }}
                >
                  {getEmotionEmoji(item.emotion)} {item.emotion}
                </Badge>
                <span className="text-sm text-gray-500">
                  {item.context}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getEmotionColor(emotion: string): string {
  const lowerEmotion = emotion.toLowerCase();

  if (
    lowerEmotion.includes("frustrat") ||
    lowerEmotion.includes("angry") ||
    lowerEmotion.includes("annoyed")
  ) {
    return "#ef4444"; // red
  }
  if (
    lowerEmotion.includes("confus") ||
    lowerEmotion.includes("unsure")
  ) {
    return "#f59e0b"; // amber
  }
  if (
    lowerEmotion.includes("happy") ||
    lowerEmotion.includes("satisf") ||
    lowerEmotion.includes("delight")
  ) {
    return "#22c55e"; // green
  }
  if (
    lowerEmotion.includes("excit") ||
    lowerEmotion.includes("enthus")
  ) {
    return "#8b5cf6"; // purple
  }
  if (
    lowerEmotion.includes("worry") ||
    lowerEmotion.includes("anxious") ||
    lowerEmotion.includes("fear")
  ) {
    return "#f97316"; // orange
  }
  if (
    lowerEmotion.includes("hope") ||
    lowerEmotion.includes("optimis")
  ) {
    return "#06b6d4"; // cyan
  }
  if (
    lowerEmotion.includes("disappoint")
  ) {
    return "#6366f1"; // indigo
  }
  if (
    lowerEmotion.includes("surprise")
  ) {
    return "#ec4899"; // pink
  }

  return "#6b7280"; // gray
}

function getEmotionEmoji(emotion: string): string {
  const lowerEmotion = emotion.toLowerCase();

  if (
    lowerEmotion.includes("frustrat") ||
    lowerEmotion.includes("angry")
  ) {
    return "😤";
  }
  if (
    lowerEmotion.includes("confus")
  ) {
    return "😕";
  }
  if (
    lowerEmotion.includes("happy") ||
    lowerEmotion.includes("satisf")
  ) {
    return "😊";
  }
  if (
    lowerEmotion.includes("excit")
  ) {
    return "🤩";
  }
  if (
    lowerEmotion.includes("worry") ||
    lowerEmotion.includes("fear")
  ) {
    return "😟";
  }
  if (
    lowerEmotion.includes("hope")
  ) {
    return "🙂";
  }
  if (
    lowerEmotion.includes("disappoint")
  ) {
    return "😞";
  }
  if (
    lowerEmotion.includes("surprise")
  ) {
    return "😮";
  }

  return "💭";
}
