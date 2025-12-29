export interface Example {
  text: string;
  translation: string;
  pair?: string; // For minimal pairs
}

export interface ExampleCategory {
  id: string;
  name: string;
  nameJp: string;
  icon: string;
  description: string;
  items: Example[];
}

export const exampleCategories: ExampleCategory[] = [
  {
    id: "greetings",
    name: "Greetings",
    nameJp: "挨拶",
    icon: "👋",
    description: "Essential daily greetings and polite expressions",
    items: [
      { text: "おはようございます", translation: "Good morning (polite)" },
      { text: "こんにちは", translation: "Hello" },
      { text: "こんばんは", translation: "Good evening" },
      { text: "おやすみなさい", translation: "Good night" },
      { text: "ありがとうございます", translation: "Thank you (polite)" },
      { text: "すみません", translation: "Excuse me / Sorry" },
      { text: "いただきます", translation: "Before eating" },
      { text: "ごちそうさまでした", translation: "After eating" },
      { text: "お元気ですか", translation: "How are you?" },
      { text: "はじめまして", translation: "Nice to meet you" },
    ],
  },
  {
    id: "minimal-pairs",
    name: "Minimal Pairs",
    nameJp: "同音異義語",
    icon: "🔀",
    description: "Words that sound similar but have different pitch patterns",
    items: [
      { text: "箸", translation: "Chopsticks (はし¹)", pair: "橋" },
      { text: "橋", translation: "Bridge (はし²)", pair: "箸" },
      { text: "雨", translation: "Rain (あめ¹)", pair: "飴" },
      { text: "飴", translation: "Candy (あめ⁰)", pair: "雨" },
      { text: "柿", translation: "Persimmon (かき⁰)", pair: "牡蠣" },
      { text: "牡蠣", translation: "Oyster (かき¹)", pair: "柿" },
      { text: "酒", translation: "Sake/alcohol (さけ⁰)", pair: "鮭" },
      { text: "鮭", translation: "Salmon (さけ²)", pair: "酒" },
    ],
  },
  {
    id: "numbers",
    name: "Numbers",
    nameJp: "数字",
    icon: "🔢",
    description: "Counting and number-related expressions",
    items: [
      { text: "一", translation: "One" },
      { text: "二", translation: "Two" },
      { text: "三", translation: "Three" },
      { text: "四", translation: "Four" },
      { text: "五", translation: "Five" },
      { text: "六", translation: "Six" },
      { text: "七", translation: "Seven" },
      { text: "八", translation: "Eight" },
      { text: "九", translation: "Nine" },
      { text: "十", translation: "Ten" },
      { text: "百", translation: "Hundred" },
      { text: "千", translation: "Thousand" },
    ],
  },
  {
    id: "verbs",
    name: "Common Verbs",
    nameJp: "動詞",
    icon: "🏃",
    description: "Frequently used verbs in various forms",
    items: [
      { text: "食べる", translation: "To eat" },
      { text: "飲む", translation: "To drink" },
      { text: "行く", translation: "To go" },
      { text: "来る", translation: "To come" },
      { text: "見る", translation: "To see/watch" },
      { text: "聞く", translation: "To listen/ask" },
      { text: "話す", translation: "To speak" },
      { text: "読む", translation: "To read" },
      { text: "書く", translation: "To write" },
      { text: "買う", translation: "To buy" },
      { text: "する", translation: "To do" },
      { text: "ある", translation: "To exist (things)" },
      { text: "いる", translation: "To exist (living)" },
    ],
  },
  {
    id: "adjectives",
    name: "Adjectives",
    nameJp: "形容詞",
    icon: "🎨",
    description: "Common descriptive words",
    items: [
      { text: "大きい", translation: "Big" },
      { text: "小さい", translation: "Small" },
      { text: "高い", translation: "High/expensive" },
      { text: "安い", translation: "Cheap" },
      { text: "新しい", translation: "New" },
      { text: "古い", translation: "Old" },
      { text: "いい", translation: "Good" },
      { text: "悪い", translation: "Bad" },
      { text: "暑い", translation: "Hot (weather)" },
      { text: "寒い", translation: "Cold (weather)" },
    ],
  },
  {
    id: "places",
    name: "Places",
    nameJp: "場所",
    icon: "🗺️",
    description: "Common locations and proper nouns",
    items: [
      { text: "東京", translation: "Tokyo" },
      { text: "大阪", translation: "Osaka" },
      { text: "京都", translation: "Kyoto" },
      { text: "日本", translation: "Japan" },
      { text: "学校", translation: "School" },
      { text: "会社", translation: "Company" },
      { text: "駅", translation: "Station" },
      { text: "病院", translation: "Hospital" },
      { text: "銀行", translation: "Bank" },
      { text: "コンビニ", translation: "Convenience store" },
    ],
  },
  {
    id: "sentences",
    name: "Sentences",
    nameJp: "文",
    icon: "💬",
    description: "Complete sentences to practice phrase-level pitch",
    items: [
      { text: "日本語を勉強しています", translation: "I am studying Japanese" },
      { text: "東京に住んでいます", translation: "I live in Tokyo" },
      { text: "今日は天気がいいですね", translation: "The weather is nice today" },
      { text: "何を食べたいですか", translation: "What do you want to eat?" },
      { text: "どこに行きますか", translation: "Where are you going?" },
      { text: "日本に来たことがありますか", translation: "Have you been to Japan?" },
      { text: "明日会議があります", translation: "There's a meeting tomorrow" },
      { text: "ちょっと待ってください", translation: "Please wait a moment" },
    ],
  },
];

export function getCategoryById(id: string): ExampleCategory | undefined {
  return exampleCategories.find((cat) => cat.id === id);
}

export function getAllExamples(): Example[] {
  return exampleCategories.flatMap((cat) => cat.items);
}
